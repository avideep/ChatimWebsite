import jwt from 'jsonwebtoken';
import { db } from './db.js';

export const COOKIE = 'chatim_session';
const secret = () => process.env.JWT_SECRET;

export class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

/** Wrap async/sync handlers so thrown errors reach the error middleware. */
export const h = (fn) => (req, res, next) => {
  try { const out = fn(req, res, next); if (out?.catch) out.catch(next); } catch (e) { next(e); }
};

/** Validate req.body against a zod schema, throwing a 400 with field errors. */
export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const fields = {};
    for (const i of r.error.issues) fields[i.path.join('.') || '_'] = i.message;
    throw new HttpError(400, Object.values(fields)[0] || 'Invalid input', fields);
  }
  return r.data;
}

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, secret(), { expiresIn: '14d' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    maxAge: 14 * 864e5, path: '/',
  });
}

export const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.created_at });

/** Attach req.user if a valid session cookie is present (never rejects). */
export function sessionMiddleware(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { sub } = jwt.verify(token, secret());
      req.user = db.prepare('SELECT * FROM users WHERE id = ?').get(sub) || null;
    } catch { req.user = null; }
  }
  next();
}

export const requireAuth = (req, _res, next) => (req.user ? next() : next(new HttpError(401, 'Please sign in to continue')));
export const requireAdmin = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new HttpError(req.user ? 403 : 401, 'Admin access required'));

// ---------- Pricing (single source of truth for cart totals) ----------
export const SHIPPING = {
  standard: { label: 'Standard (4–6 days)', fee: 79, freeAbove: 999 },
  express: { label: 'Express (1–2 days)', fee: 149, freeAbove: 2499 },
};
export const GIFT_WRAP_FEE = 49;

export function evaluateCoupon(code, subtotal) {
  if (!code) return { coupon: null, discount: 0 };
  const c = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(code.trim());
  if (!c) throw new HttpError(400, 'This promo code is not valid');
  if (subtotal < c.min_subtotal) throw new HttpError(400, `Add ₹${(c.min_subtotal - subtotal).toLocaleString('en-IN')} more to use ${c.code}`);
  let discount = c.type === 'percent' ? Math.round((subtotal * c.value) / 100) : c.value;
  if (c.max_discount) discount = Math.min(discount, c.max_discount);
  return { coupon: { code: c.code, description: c.description }, discount: Math.min(discount, subtotal) };
}

/**
 * Re-price a cart from the database. Returns line items, totals and any
 * per-line problems (out of stock, removed product) without throwing for those.
 */
export function quoteCart({ items, couponCode, shippingMethod = 'standard', giftWrap = false }) {
  const getP = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1');
  const lines = []; const issues = [];
  for (const { productId, quantity } of items) {
    const p = getP.get(productId);
    if (!p) { issues.push({ productId, message: 'This item is no longer available' }); continue; }
    if (p.price <= 0) { issues.push({ productId, message: `${p.name} is available on request – message us for the price` }); continue; }
    let qty = quantity;
    if (p.stock <= 0) { issues.push({ productId, message: `${p.name} is sold out` }); continue; }
    if (qty > p.stock) { issues.push({ productId, message: `Only ${p.stock} left of ${p.name}` }); qty = p.stock; }
    lines.push({ productId: p.id, slug: p.slug, name: p.name, image: JSON.parse(p.images)[0], price: p.price,
      originalPrice: p.original_price, quantity: qty, stock: p.stock, lineTotal: p.price * qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const mrp = lines.reduce((s, l) => s + l.originalPrice * l.quantity, 0);
  let couponError = null; let coupon = null; let discount = 0;
  try { ({ coupon, discount } = evaluateCoupon(couponCode, subtotal)); } catch (e) { couponError = e.message; }
  const ship = SHIPPING[shippingMethod] || SHIPPING.standard;
  const afterDiscount = subtotal - discount;
  const shipping = lines.length === 0 || afterDiscount >= ship.freeAbove ? 0 : ship.fee;
  const gift = giftWrap && lines.length ? GIFT_WRAP_FEE : 0;
  return {
    lines, issues, subtotal, mrp, savings: mrp - subtotal + discount, discount, coupon, couponError,
    shipping, shippingMethod: SHIPPING[shippingMethod] ? shippingMethod : 'standard', giftWrap: gift,
    total: afterDiscount + shipping + gift,
    freeShippingRemaining: Math.max(0, SHIPPING.standard.freeAbove - afterDiscount),
  };
}
