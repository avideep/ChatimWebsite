import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { db, serializeProduct, PRODUCT_SELECT } from '../db.js';
import {
  h, parse, HttpError, issueSession, publicUser, requireAuth, COOKIE, quoteCart, SHIPPING, GIFT_WRAP_FEE,
} from '../lib.js';

const r = Router();
const orderSuffix = customAlphabet('0123456789', 4);
const authLimiter = rateLimit({ windowMs: 15 * 60e3, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts – please try again in a few minutes.' } });
const formLimiter = rateLimit({ windowMs: 10 * 60e3, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests – please slow down.' } });

// ---------------- Catalogue ----------------
const SORTS = {
  featured: 'p.featured DESC, p.sold DESC',
  newest: 'p.created_at DESC',
  // Price-on-request items (price 0) sort after priced ones.
  'price-low': '(p.price = 0), p.price ASC',
  'price-high': 'p.price DESC',
  rating: 'rating DESC, review_count DESC',
  popular: 'p.sold DESC',
  discount: '(p.original_price - p.price) * 1.0 / p.original_price DESC',
};

r.get('/products', h((req, res) => {
  const q = req.query;
  const where = ['p.active = 1']; const params = {};
  const list = (v) => String(v).split(',').map((s) => s.trim()).filter(Boolean);
  if (q.category && q.category !== 'All') {
    const cats = list(q.category); where.push(`p.category IN (${cats.map((_, i) => `@cat${i}`).join(',')})`);
    cats.forEach((c, i) => { params[`cat${i}`] = c; });
  }
  if (q.collection) {
    const cols = list(q.collection); where.push(`p.collection IN (${cols.map((_, i) => `@col${i}`).join(',')})`);
    cols.forEach((c, i) => { params[`col${i}`] = c; });
  }
  if (q.minPrice || q.maxPrice) where.push('p.price > 0');
  if (q.minPrice) { where.push('p.price >= @minPrice'); params.minPrice = Number(q.minPrice) || 0; }
  if (q.maxPrice) { where.push('p.price <= @maxPrice'); params.maxPrice = Number(q.maxPrice) || 1e9; }
  if (q.inStock === '1') where.push('p.stock > 0');
  if (q.isNew === '1') where.push('p.is_new = 1');
  if (q.featured === '1') where.push('p.featured = 1');
  if (q.ids) { const ids = list(q.ids).map(Number).filter(Number.isInteger).slice(0, 100); where.push(`p.id IN (${ids.join(',') || 0})`); }
  if (q.q) {
    where.push('(p.name LIKE @q OR p.category LIKE @q OR p.collection LIKE @q OR p.material LIKE @q OR p.description LIKE @q)');
    params.q = `%${String(q.q).slice(0, 80)}%`;
  }
  let sql = `SELECT * FROM (${PRODUCT_SELECT} WHERE ${where.join(' AND ')}) p`;
  if (q.minRating) { sql += ' WHERE rating >= @minRating'; params.minRating = Number(q.minRating); }
  const total = db.prepare(`SELECT COUNT(*) AS c FROM (${sql})`).get(params).c;
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 12, 1), 60);
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const order = SORTS[q.sort] || SORTS.featured;
  const rows = db.prepare(`${sql} ORDER BY (p.stock > 0) DESC, ${order} LIMIT ${limit} OFFSET ${(page - 1) * limit}`).all(params);
  res.json({ items: rows.map(serializeProduct), total, page, pages: Math.max(1, Math.ceil(total / limit)), limit });
}));

r.get('/facets', h((_req, res) => {
  const categories = db.prepare('SELECT category AS name, COUNT(*) AS count FROM products WHERE active = 1 GROUP BY category ORDER BY count DESC').all();
  const collections = db.prepare('SELECT collection AS name, COUNT(*) AS count FROM products WHERE active = 1 GROUP BY collection ORDER BY count DESC').all();
  const price = db.prepare('SELECT MIN(price) AS min, MAX(price) AS max FROM products WHERE active = 1 AND price > 0').get();
  res.json({ categories, collections, price });
}));

r.get('/products/:slug', h((req, res) => {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.active = 1`).get(req.params.slug);
  if (!row) throw new HttpError(404, 'Product not found');
  const product = serializeProduct(row);
  const reviews = db.prepare('SELECT id, author, location, rating, title, body, verified, created_at AS createdAt FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(row.id);
  const breakdown = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: reviews.filter((x) => x.rating === s).length }));
  const related = db.prepare(`${PRODUCT_SELECT} WHERE p.active = 1 AND p.id != ? ORDER BY (p.category = ?) DESC, (p.collection = ?) DESC, p.sold DESC LIMIT 8`)
    .all(row.id, row.category, row.collection).map(serializeProduct);
  res.json({ product, reviews, breakdown, related });
}));

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().default(''),
  body: z.string().trim().min(10, 'Please write at least 10 characters').max(1200),
  location: z.string().trim().max(60).optional().default(''),
});
r.post('/products/:id/reviews', requireAuth, formLimiter, h((req, res) => {
  const data = parse(reviewSchema, req.body);
  const pid = Number(req.params.id);
  if (!db.prepare('SELECT id FROM products WHERE id = ?').get(pid)) throw new HttpError(404, 'Product not found');
  const bought = db.prepare(`SELECT 1 FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.user_id = ? AND i.product_id = ? AND o.status != 'cancelled' LIMIT 1`).get(req.user.id, pid);
  db.prepare('INSERT INTO reviews (product_id,user_id,author,location,rating,title,body,verified) VALUES (?,?,?,?,?,?,?,?)')
    .run(pid, req.user.id, req.user.name, data.location, data.rating, data.title, data.body, bought ? 1 : 0);
  res.status(201).json({ ok: true });
}));

r.get('/testimonials', h((_req, res) => {
  res.json(db.prepare(`SELECT r.author, r.location, r.rating, r.title, r.body, p.name AS product, p.slug
    FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.rating = 5 AND length(r.body) > 60
    GROUP BY r.author ORDER BY r.created_at DESC LIMIT 6`).all());
}));

// ---------------- Auth ----------------
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().max(20).optional().default(''),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});
r.post('/auth/register', authLimiter, h((req, res) => {
  const d = parse(registerSchema, req.body);
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(d.email)) throw new HttpError(409, 'An account with this email already exists');
  const { lastInsertRowid } = db.prepare('INSERT INTO users (name,email,phone,password_hash) VALUES (?,?,?,?)')
    .run(d.name, d.email, d.phone, bcrypt.hashSync(d.password, 10));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
  issueSession(res, user);
  res.status(201).json({ user: publicUser(user) });
}));

r.post('/auth/login', authLimiter, h((req, res) => {
  const d = parse(z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') }), req.body);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(d.email);
  if (!user || !bcrypt.compareSync(d.password, user.password_hash)) throw new HttpError(401, 'Incorrect email or password');
  issueSession(res, user);
  res.json({ user: publicUser(user) });
}));

r.post('/auth/logout', (_req, res) => { res.clearCookie(COOKIE, { path: '/' }); res.json({ ok: true }); });
r.get('/auth/me', (req, res) => res.json({ user: publicUser(req.user) }));

r.patch('/auth/me', requireAuth, h((req, res) => {
  const d = parse(z.object({
    name: z.string().trim().min(2).max(80), phone: z.string().trim().max(20).optional().default(''),
    currentPassword: z.string().optional(), newPassword: z.string().min(8, 'New password must be at least 8 characters').max(100).optional().or(z.literal('')),
  }), req.body);
  if (d.newPassword) {
    if (!d.currentPassword || !bcrypt.compareSync(d.currentPassword, req.user.password_hash)) throw new HttpError(400, 'Current password is incorrect');
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(d.newPassword, 10), req.user.id);
  }
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(d.name, d.phone, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
}));

// ---------------- Wishlist (signed-in sync) ----------------
r.get('/wishlist', requireAuth, (req, res) => {
  res.json({ ids: db.prepare('SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id).map((x) => x.product_id) });
});
r.put('/wishlist', requireAuth, h((req, res) => {
  const { ids } = parse(z.object({ ids: z.array(z.number().int()).max(200) }), req.body);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM wishlist WHERE user_id = ?').run(req.user.id);
    const ins = db.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) SELECT ?, id FROM products WHERE id = ?');
    ids.forEach((id) => ins.run(req.user.id, id));
  });
  tx();
  res.json({ ok: true });
}));

// ---------------- Cart & checkout ----------------
const itemsSchema = z.array(z.object({ productId: z.number().int(), quantity: z.number().int().min(1).max(10) })).max(50);
const quoteSchema = z.object({
  items: itemsSchema,
  couponCode: z.string().trim().max(30).optional().nullable(),
  shippingMethod: z.enum(['standard', 'express']).optional().default('standard'),
  giftWrap: z.boolean().optional().default(false),
});

r.get('/checkout/options', (_req, res) => res.json({ shipping: SHIPPING, giftWrapFee: GIFT_WRAP_FEE }));
r.post('/cart/quote', h((req, res) => res.json(quoteCart(parse(quoteSchema, req.body)))));

const orderSchema = quoteSchema.extend({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,16}$/, 'Enter a valid phone number'),
  address: z.object({
    line1: z.string().trim().min(3, 'Enter your address').max(160),
    line2: z.string().trim().max(160).optional().default(''),
    city: z.string().trim().min(2, 'Enter your city').max(60),
    state: z.string().trim().min(2, 'Select your state').max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  }),
  paymentMethod: z.enum(['upi', 'card', 'cod']),
  notes: z.string().trim().max(500).optional().default(''),
});

r.post('/orders', formLimiter, h((req, res) => {
  const d = parse(orderSchema, req.body);
  if (!d.items.length) throw new HttpError(400, 'Your bag is empty');
  const createOrder = db.transaction(() => {
    const quote = quoteCart(d);
    if (quote.issues.length) throw new HttpError(409, quote.issues[0].message, { issues: quote.issues });
    if (d.couponCode && quote.couponError) throw new HttpError(400, quote.couponError);
    const now = new Date();
    const orderNo = `CH${now.toISOString().slice(2, 10).replace(/-/g, '')}${orderSuffix()}`;
    // Payment is simulated (demo store): UPI/card are marked paid, COD stays pending.
    const paymentStatus = d.paymentMethod === 'cod' ? 'pending' : 'paid';
    const { lastInsertRowid: oid } = db.prepare(`INSERT INTO orders (order_number,user_id,email,name,phone,address,subtotal,discount,shipping,gift_wrap,total,coupon_code,shipping_method,payment_method,payment_status,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(orderNo, req.user?.id ?? null, d.email, d.name, d.phone, JSON.stringify(d.address),
      quote.subtotal, quote.discount, quote.shipping, quote.giftWrap, quote.total, quote.coupon?.code ?? null,
      quote.shippingMethod, d.paymentMethod, paymentStatus, d.notes);
    const insI = db.prepare('INSERT INTO order_items (order_id,product_id,name,image,price,quantity) VALUES (?,?,?,?,?,?)');
    const dec = db.prepare('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ? AND stock >= ?');
    for (const l of quote.lines) {
      insI.run(oid, l.productId, l.name, l.image, l.price, l.quantity);
      if (dec.run(l.quantity, l.quantity, l.productId, l.quantity).changes !== 1) throw new HttpError(409, `${l.name} just sold out`);
    }
    if (quote.coupon) db.prepare('UPDATE coupons SET uses = uses + 1 WHERE code = ?').run(quote.coupon.code);
    db.prepare("INSERT INTO order_events (order_id,status,note) VALUES (?, 'placed', ?)").run(oid,
      d.paymentMethod === 'cod' ? 'Cash on delivery selected' : `Payment received via ${d.paymentMethod.toUpperCase()}`);
    return orderNo;
  });
  const orderNumber = createOrder();
  res.status(201).json({ orderNumber, order: loadOrder(orderNumber) });
}));

export function loadOrder(orderNumber) {
  const o = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
  if (!o) return null;
  return {
    id: o.id, orderNumber: o.order_number, userId: o.user_id, email: o.email, name: o.name, phone: o.phone,
    address: JSON.parse(o.address), subtotal: o.subtotal, discount: o.discount, shipping: o.shipping, giftWrap: o.gift_wrap,
    total: o.total, couponCode: o.coupon_code, shippingMethod: o.shipping_method, paymentMethod: o.payment_method,
    paymentStatus: o.payment_status, status: o.status, notes: o.notes, createdAt: o.created_at, updatedAt: o.updated_at,
    items: db.prepare(`SELECT i.product_id AS productId, i.name, i.image, i.price, i.quantity, p.slug FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = ?`).all(o.id),
    events: db.prepare('SELECT status, note, created_at AS createdAt FROM order_events WHERE order_id = ? ORDER BY id').all(o.id),
  };
}

r.get('/orders/mine', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT order_number FROM orders WHERE user_id = ? OR (user_id IS NULL AND email = ?) ORDER BY created_at DESC').all(req.user.id, req.user.email);
  res.json(rows.map((x) => loadOrder(x.order_number)));
});

// Order lookup: owner/admin when signed in, otherwise requires the matching email (order tracking).
r.get('/orders/:orderNumber', h((req, res) => {
  const o = loadOrder(String(req.params.orderNumber).toUpperCase());
  const email = String(req.query.email || '').trim().toLowerCase();
  const allowed = o && (req.user?.role === 'admin' || (req.user && (o.userId === req.user.id || o.email === req.user.email)) || (email && email === o.email.toLowerCase()));
  if (!allowed) throw new HttpError(404, 'We couldn’t find an order with those details');
  res.json(o);
}));

r.post('/orders/:orderNumber/cancel', requireAuth, h((req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
  if (!o || (o.user_id !== req.user.id && req.user.role !== 'admin')) throw new HttpError(404, 'Order not found');
  if (!['placed', 'confirmed'].includes(o.status)) throw new HttpError(400, 'This order can no longer be cancelled');
  db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'cancelled', payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END, updated_at = datetime('now') WHERE id = ?").run(o.id);
    db.prepare("INSERT INTO order_events (order_id,status,note) VALUES (?, 'cancelled', 'Cancelled by customer')").run(o.id);
    for (const i of db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)) {
      db.prepare('UPDATE products SET stock = stock + ?, sold = MAX(0, sold - ?) WHERE id = ?').run(i.quantity, i.quantity, i.product_id);
    }
  })();
  res.json(loadOrder(o.order_number));
}));

// ---------------- Lead capture ----------------
r.post('/newsletter', formLimiter, h((req, res) => {
  const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') }), req.body);
  db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
  res.status(201).json({ ok: true, coupon: 'CHATIM15' });
}));

r.post('/inquiries', formLimiter, h((req, res) => {
  const d = parse(z.object({
    name: z.string().trim().min(2, 'Enter your name').max(80),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{7,16}$/, 'Enter a valid phone number'),
    email: z.string().trim().email().optional().or(z.literal('')),
    topic: z.string().trim().min(2).max(80),
    message: z.string().trim().max(1000).optional().default(''),
    preferredDate: z.string().trim().max(30).optional().default(''),
  }), req.body);
  db.prepare('INSERT INTO inquiries (name,phone,email,topic,message,preferred_date) VALUES (?,?,?,?,?,?)')
    .run(d.name, d.phone, d.email || null, d.topic, d.message, d.preferredDate);
  res.status(201).json({ ok: true });
}));

export default r;
