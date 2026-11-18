import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db, serializeProduct, PRODUCT_SELECT, DATA_DIR } from '../db.js';
import { h, parse, HttpError, requireAdmin } from '../lib.js';
import { loadOrder } from './api.js';

const r = Router();
r.use(requireAdmin);

export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${nanoid(12)}${path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)),
});

// ---------------- Dashboard ----------------
r.get('/stats', (_req, res) => {
  const live = "status != 'cancelled'";
  const kpi = db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue, COALESCE(AVG(total),0) AS aov FROM orders WHERE ${live}`).get();
  const last30 = db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue FROM orders WHERE ${live} AND created_at >= datetime('now','-30 days')`).get();
  const prev30 = db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue FROM orders WHERE ${live} AND created_at >= datetime('now','-60 days') AND created_at < datetime('now','-30 days')`).get();
  const daily = db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS orders, SUM(total) AS revenue FROM orders WHERE ${live} AND created_at >= date('now','-13 days') GROUP BY day`).all();
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    const hit = daily.find((x) => x.day === d);
    return { day: d, orders: hit?.orders || 0, revenue: hit?.revenue || 0 };
  });
  const byStatus = db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all();
  const byCategory = db.prepare(`SELECT p.category AS name, SUM(i.price * i.quantity) AS revenue FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id WHERE o.${live} GROUP BY p.category ORDER BY revenue DESC`).all();
  const topProducts = db.prepare(`SELECT i.product_id AS id, i.name, MAX(i.image) AS image, SUM(i.quantity) AS units, SUM(i.price * i.quantity) AS revenue FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.${live} GROUP BY i.product_id ORDER BY revenue DESC LIMIT 5`).all();
  const lowStock = db.prepare('SELECT id, name, stock, slug FROM products WHERE active = 1 AND stock <= 8 ORDER BY stock ASC LIMIT 8').all();
  const recent = db.prepare('SELECT order_number FROM orders ORDER BY created_at DESC LIMIT 6').all().map((o) => loadOrder(o.order_number));
  const customers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'").get().c;
  const newInquiries = db.prepare("SELECT COUNT(*) AS c FROM inquiries WHERE status = 'new'").get().c;
  const subscribers = db.prepare('SELECT COUNT(*) AS c FROM subscribers').get().c;
  res.json({ kpi, last30, prev30, series, byStatus, byCategory, topProducts, lowStock, recent, customers, newInquiries, subscribers });
});

// ---------------- Products ----------------
r.get('/products', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const rows = db.prepare(`${PRODUCT_SELECT} WHERE p.name LIKE ? OR p.category LIKE ? ORDER BY p.created_at DESC`).all(q, q);
  res.json(rows.map(serializeProduct));
});

const productSchema = z.object({
  name: z.string().trim().min(3).max(120),
  category: z.enum(['Earrings', 'Necklaces', 'Rings', 'Bangles', 'Sets', 'Nose Pins']),
  collection: z.string().trim().min(2).max(40),
  badge: z.string().trim().max(24).optional().nullable().transform((v) => v || null),
  // 0 = "price on request": shown without a price and cannot be added to the bag.
  price: z.coerce.number().int().min(0),
  originalPrice: z.coerce.number().int().min(0),
  material: z.string().trim().max(120).optional().default(''),
  description: z.string().trim().max(2000).optional().default(''),
  details: z.array(z.string().trim().max(160)).max(12).optional().default([]),
  images: z.array(z.string().trim().min(1).max(500)).min(1, 'Add at least one image').max(8),
  stock: z.coerce.number().int().min(0),
  featured: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
}).refine((p) => p.originalPrice >= p.price, { message: 'MRP must be greater than or equal to the selling price', path: ['originalPrice'] });

const slugify = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const uniqueSlug = (name, id = 0) => {
  const base = slugify(name) || 'product'; let slug = base; let n = 2;
  while (db.prepare('SELECT 1 FROM products WHERE slug = ? AND id != ?').get(slug, id)) slug = `${base}-${n++}`;
  return slug;
};
const toRow = (d) => ({ name: d.name, category: d.category, collection: d.collection, badge: d.badge, price: d.price,
  original_price: d.originalPrice, material: d.material, description: d.description, details: JSON.stringify(d.details),
  images: JSON.stringify(d.images), stock: d.stock, featured: d.featured ? 1 : 0, is_new: d.isNew ? 1 : 0, active: d.active ? 1 : 0 });

r.post('/products', h((req, res) => {
  const d = parse(productSchema, req.body);
  const row = { ...toRow(d), slug: uniqueSlug(d.name) };
  const { lastInsertRowid } = db.prepare(`INSERT INTO products (slug,name,category,collection,badge,price,original_price,material,description,details,images,stock,featured,is_new,active)
    VALUES (@slug,@name,@category,@collection,@badge,@price,@original_price,@material,@description,@details,@images,@stock,@featured,@is_new,@active)`).run(row);
  res.status(201).json(serializeProduct(db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(lastInsertRowid)));
}));

r.put('/products/:id', h((req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM products WHERE id = ?').get(id)) throw new HttpError(404, 'Product not found');
  const d = parse(productSchema, req.body);
  db.prepare(`UPDATE products SET slug=@slug,name=@name,category=@category,collection=@collection,badge=@badge,price=@price,original_price=@original_price,
    material=@material,description=@description,details=@details,images=@images,stock=@stock,featured=@featured,is_new=@is_new,active=@active WHERE id=@id`)
    .run({ ...toRow(d), slug: uniqueSlug(d.name, id), id });
  res.json(serializeProduct(db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id)));
}));

r.delete('/products/:id', h((req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) throw new HttpError(404, 'Product not found');
  res.json({ ok: true });
}));

r.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Please upload a JPG, PNG, WEBP or GIF under 5 MB');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------------- Orders ----------------
r.get('/orders', (req, res) => {
  const { status, q } = req.query;
  const where = []; const params = [];
  if (status && status !== 'all') { where.push('status = ?'); params.push(status); }
  if (q) { where.push('(order_number LIKE ? OR name LIKE ? OR email LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const rows = db.prepare(`SELECT order_number FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 200`).all(...params);
  res.json(rows.map((o) => loadOrder(o.order_number)));
});

r.patch('/orders/:orderNumber', h((req, res) => {
  const d = parse(z.object({
    status: z.enum(['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'refunded']).optional(),
    note: z.string().trim().max(300).optional().default(''),
  }), req.body);
  const o = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
  if (!o) throw new HttpError(404, 'Order not found');
  db.transaction(() => {
    if (d.status && d.status !== o.status) {
      if (o.status === 'cancelled') throw new HttpError(400, 'Cancelled orders cannot be reopened');
      db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(d.status, o.id);
      db.prepare('INSERT INTO order_events (order_id,status,note) VALUES (?,?,?)').run(o.id, d.status, d.note || null);
      if (d.status === 'delivered' && o.payment_method === 'cod') db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(o.id);
      if (d.status === 'cancelled') {
        for (const i of db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)) {
          db.prepare('UPDATE products SET stock = stock + ?, sold = MAX(0, sold - ?) WHERE id = ?').run(i.quantity, i.quantity, i.product_id);
        }
        if (o.payment_status === 'paid') db.prepare("UPDATE orders SET payment_status = 'refunded' WHERE id = ?").run(o.id);
      }
    }
    if (d.paymentStatus) db.prepare("UPDATE orders SET payment_status = ?, updated_at = datetime('now') WHERE id = ?").run(d.paymentStatus, o.id);
  })();
  res.json(loadOrder(o.order_number));
}));

// ---------------- Customers, leads, coupons ----------------
r.get('/customers', (_req, res) => {
  res.json(db.prepare(`SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at AS createdAt,
    COUNT(o.id) AS orders, COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END),0) AS spent, MAX(o.created_at) AS lastOrder
    FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id ORDER BY spent DESC`).all());
});

r.get('/inquiries', (_req, res) => res.json(db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all()));
r.patch('/inquiries/:id', h((req, res) => {
  const { status } = parse(z.object({ status: z.enum(['new', 'contacted', 'closed']) }), req.body);
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  res.json({ ok: true });
}));
r.get('/subscribers', (_req, res) => res.json(db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all()));

r.get('/coupons', (_req, res) => res.json(db.prepare('SELECT * FROM coupons ORDER BY code').all()));
r.post('/coupons', h((req, res) => {
  const d = parse(z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, 'Use 3–20 letters/numbers'),
    description: z.string().trim().max(120).optional().default(''),
    type: z.enum(['percent', 'flat']), value: z.coerce.number().int().min(1),
    minSubtotal: z.coerce.number().int().min(0).optional().default(0),
    maxDiscount: z.coerce.number().int().min(0).optional().nullable(),
    active: z.boolean().optional().default(true),
  }).refine((c) => c.type !== 'percent' || c.value <= 90, { message: 'Percent discount must be ≤ 90', path: ['value'] }), req.body);
  db.prepare(`INSERT INTO coupons (code,description,type,value,min_subtotal,max_discount,active) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(code) DO UPDATE SET description=excluded.description, type=excluded.type, value=excluded.value,
    min_subtotal=excluded.min_subtotal, max_discount=excluded.max_discount, active=excluded.active`)
    .run(d.code, d.description, d.type, d.value, d.minSubtotal, d.maxDiscount || null, d.active ? 1 : 0);
  res.status(201).json({ ok: true });
}));
r.delete('/coupons/:code', (req, res) => { db.prepare('DELETE FROM coupons WHERE code = ?').run(req.params.code); res.json({ ok: true }); });

export default r;
