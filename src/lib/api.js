export class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body && !form ? { 'Content-Type': 'application/json' } : undefined,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.details);
  return data;
}

export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

// Pieces imported from Instagram have no listed price (price 0) – customers ask on WhatsApp instead.
export const onRequest = (p) => !(p?.price > 0);
export const WHATSAPP = '917278980393';
export const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
export const priceEnquiryText = (p) =>
  `Hi Chatim! I'd love to know the price and availability of "${p.name}" – ${window.location.origin}/product/${p.slug}`;

export const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const fmtDate = (s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`).toLocaleDateString('en-IN', opts);

export const fmtDateTime = (s) =>
  new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const ORDER_FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
export const STATUS_STYLE = {
  placed: 'bg-sky-50 text-sky-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  packed: 'bg-amber-50 text-amber-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  refunded: 'bg-gray-100 text-gray-600',
  new: 'bg-pink-50 text-chatim-clayDark',
  contacted: 'bg-sky-50 text-sky-700',
  closed: 'bg-gray-100 text-gray-500',
};

export const PAYMENT_LABEL = { upi: 'UPI', card: 'Card', cod: 'Cash on Delivery' };

export const INDIAN_STATES = ['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
