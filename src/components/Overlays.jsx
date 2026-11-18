import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, inr, onRequest, priceEnquiryText, waLink } from '../lib/api';
import { useAuth, useCart, useToasts, useUI, toast } from '../store';
import { Field, Img, Logo, Modal, Price, QtyStepper, Spinner, Stars } from './ui';
import { NAV } from './Header';
import { useAddToCart, useWishToggle } from './ProductCard';
import { useWishlist } from '../store';

export function useCartQuote(extra = {}) {
  const items = useCart((s) => s.items);
  const coupon = useCart((s) => s.coupon);
  const payload = { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), couponCode: coupon || null, ...extra };
  return useQuery({
    queryKey: ['quote', payload], queryFn: () => api('/cart/quote', { method: 'POST', body: payload }),
    enabled: items.length > 0, placeholderData: (prev) => prev, staleTime: 15e3,
  });
}

export function CouponBox({ quote }) {
  const { coupon, setCoupon } = useCart();
  const [code, setCode] = useState(coupon);
  useEffect(() => setCode(coupon), [coupon]);
  if (quote?.coupon) {
    return (
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
        <span className="text-emerald-700 font-medium"><i className="fa-solid fa-ticket mr-1.5" /><b>{quote.coupon.code}</b> applied · you save {inr(quote.discount)}</span>
        <button onClick={() => setCoupon('')} className="text-emerald-800 font-bold hover:underline">Remove</button>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) setCoupon(code.trim().toUpperCase()); }} className="flex flex-wrap gap-2">
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code (try CHATIM15)" className="flex-1 px-3.5 py-2 rounded-xl bg-chatim-paper border border-gray-200 text-xs uppercase outline-none focus:border-chatim-clay" aria-label="Promo code" />
      <button className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition">Apply</button>
      {quote?.couponError && coupon && <p className="basis-full text-[11px] text-red-500 -mt-1">{quote.couponError}</p>}
    </form>
  );
}

export function CartDrawer() {
  const { drawer, closeDrawer } = useUI();
  const { items, setQty, remove } = useCart();
  const open = drawer === 'cart';
  const nav = useNavigate();
  const { data: quote, isFetching } = useCartQuote();
  const loc = useLocation();
  useEffect(() => { closeDrawer(); }, [loc.pathname, closeDrawer]);
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => e.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, closeDrawer]);

  const freeLeft = quote?.freeShippingRemaining ?? 999;
  const pct = Math.min(100, ((999 - freeLeft) / 999) * 100);

  return (
    <>
      <div onClick={closeDrawer} className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-chatim-paper z-50 transform transition-transform duration-300 flex flex-col ${open ? 'translate-x-0 shadow-card' : 'translate-x-full'}`} aria-hidden={!open} aria-label="Shopping bag">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-chatim-ivory">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-bag-shopping text-chatim-clay" />
            <h3 className="font-serif text-lg font-medium text-chatim-ink">Your Shopping Bag</h3>
            <span className="text-xs text-gray-500">({items.reduce((n, i) => n + i.quantity, 0)})</span>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-full bg-chatim-paper text-gray-600 hover:text-chatim-ink flex items-center justify-center shadow-soft" aria-label="Close bag"><i className="fa-solid fa-xmark" /></button>
        </div>

        {items.length > 0 && (
          <div className="px-6 py-3 bg-pink-50/80 border-b border-pink-100 text-xs text-center text-gray-700">
            {freeLeft > 0 ? <>Add <b className="text-chatim-clayDark">{inr(freeLeft)}</b> more for <b>FREE shipping!</b></> : <><i className="fa-solid fa-circle-check text-emerald-500 mr-1" />You’ve unlocked <b>FREE shipping</b></>}
            <div className="mt-2 h-1.5 rounded-full bg-pink-100 overflow-hidden"><div className="h-full bg-gradient-to-r from-chatim-clay to-chatim-marigold transition-all duration-500" style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center pt-16">
              <div className="w-20 h-20 rounded-full bg-chatim-peach text-chatim-clay mx-auto flex items-center justify-center text-3xl mb-4"><i className="fa-solid fa-bag-shopping" /></div>
              <h4 className="font-serif text-xl font-medium">Your bag is empty</h4>
              <p className="text-sm text-gray-500 mt-1 mb-6">Find something you’ll love wearing.</p>
              <button onClick={() => { closeDrawer(); nav('/shop'); }} className="btn-primary">Start Shopping</button>
            </div>
          ) : items.map((it) => {
            const issue = quote?.issues?.find((x) => x.productId === it.productId);
            return (
              <div key={it.productId} className="flex gap-4">
                <Link to={`/product/${it.product.slug}`} className="shrink-0"><Img src={it.product.images?.[0]} alt={it.product.name} className="w-20 h-20 rounded-2xl object-cover bg-pink-50" /></Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${it.product.slug}`} className="text-sm font-medium text-chatim-ink line-clamp-2 hover:text-chatim-clayDark">{it.product.name}</Link>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-bold">{inr(it.product.price)}</span>
                    {it.product.originalPrice > it.product.price && <span className="text-[11px] text-gray-400 line-through">{inr(it.product.originalPrice)}</span>}
                  </div>
                  {issue && <p className="text-[11px] text-red-500 mt-0.5">{issue.message}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <QtyStepper small value={it.quantity} max={Math.min(10, it.product.stock || 10)} onChange={(q) => setQty(it.productId, q)} />
                    <button onClick={() => remove(it.productId)} className="text-[11px] text-gray-400 hover:text-red-500"><i className="fa-regular fa-trash-can mr-1" />Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
            <CouponBox quote={quote} />
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{inr(quote?.subtotal)}</span></div>
              {quote?.discount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Discount ({quote.coupon?.code})</span><span>−{inr(quote.discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{quote?.shipping ? inr(quote.shipping) : <span className="text-emerald-600 font-semibold">FREE</span>}</span></div>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-chatim-ink pt-1 border-t border-gray-200">
              <span className="pt-2">Total {isFetching && <Spinner className="text-chatim-clay ml-1 text-xs" />}</span>
              <span className="text-lg font-serif pt-2">{inr(quote?.total)}</span>
            </div>
            {quote?.savings > 0 && <p className="text-[11px] text-emerald-600 text-center font-medium">🎉 You’re saving {inr(quote.savings)} on this order</p>}
            <button onClick={() => { closeDrawer(); nav('/checkout'); }} className="btn-primary w-full py-3.5">Proceed to Checkout <i className="fa-solid fa-arrow-right text-xs" /></button>
            <button onClick={() => { closeDrawer(); nav('/cart'); }} className="w-full text-xs font-semibold text-gray-600 hover:text-chatim-clayDark">View full bag</button>
          </div>
        )}
      </aside>
    </>
  );
}

export function QuickView() {
  const { quickView, closeQuickView, openInquiry } = useUI();
  const { data, isLoading } = useQuery({ queryKey: ['product', quickView], queryFn: () => api(`/products/${quickView}`), enabled: !!quickView });
  const addToCart = useAddToCart();
  const toggleWish = useWishToggle();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  useEffect(() => { setQty(1); setImg(0); }, [quickView]);
  const p = data?.product;
  const wished = useWishlist((s) => p && s.ids.includes(p.id));
  return (
    <Modal open={!!quickView} onClose={closeQuickView} className="max-w-3xl" label="Quick view">
      {isLoading || !p ? <div className="h-96 flex items-center justify-center"><Spinner className="text-chatim-clay text-2xl" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-pink-50">
            <Img src={p.images[img]} alt={p.name} className="w-full aspect-square object-cover" />
            {p.images.length > 1 && (
              <div className="flex gap-2 p-3">
                {p.images.map((src, i) => (
                  <button key={i} onClick={() => setImg(i)} className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${i === img ? 'border-chatim-clay' : 'border-transparent'}`}><Img src={src} alt="" className="w-full h-full object-cover" /></button>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 sm:p-8 flex flex-col">
            <span className="eyebrow">{p.collection} · {p.category}</span>
            <h3 className="font-serif text-2xl font-medium text-chatim-ink mt-1 pr-8">{p.name}</h3>
            {p.reviewCount > 0 && <div className="flex items-center gap-2 mt-2 text-xs text-gray-500"><Stars value={p.rating} /> {p.rating.toFixed(1)} · {p.reviewCount} reviews</div>}
            <div className="mt-4"><Price price={p.price} originalPrice={p.originalPrice} size="lg" /></div>
            <p className="text-[11px] text-gray-400">{onRequest(p) ? 'Message us for the price & availability' : 'Inclusive of all taxes'}</p>
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">{p.description}</p>
            {p.material && <p className="text-xs text-gray-500 mt-3"><i className="fa-solid fa-gem text-chatim-clay mr-1.5" />{p.material}</p>}
            {onRequest(p) && p.stock > 0 ? (
              <div className="mt-auto pt-6 flex items-center gap-3">
                <a href={waLink(priceEnquiryText(p))} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1"><i className="fa-brands fa-whatsapp" /> Ask for price</a>
                <button onClick={() => { closeQuickView(); openInquiry('Price Enquiry', priceEnquiryText(p)); }} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center hover:bg-pink-50" aria-label="Request a callback"><i className="fa-solid fa-phone" /></button>
                <button onClick={() => toggleWish(p)} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center hover:bg-pink-50" aria-label="Wishlist"><i className={`${wished ? 'fa-solid text-chatim-clay' : 'fa-regular'} fa-heart`} /></button>
              </div>
            ) : (
              <div className="mt-auto pt-6 flex items-center gap-3">
                {p.stock > 0 && <QtyStepper value={qty} max={Math.min(10, p.stock)} onChange={(q) => setQty(Math.max(1, q))} />}
                <button disabled={p.stock <= 0} onClick={() => { addToCart(p, qty); closeQuickView(); }} className="btn-primary flex-1">{p.stock > 0 ? <><i className="fa-solid fa-bag-shopping" /> Add to Bag</> : 'Sold out'}</button>
                <button onClick={() => toggleWish(p)} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center hover:bg-pink-50" aria-label="Wishlist"><i className={`${wished ? 'fa-solid text-chatim-clay' : 'fa-regular'} fa-heart`} /></button>
              </div>
            )}
            <Link to={`/product/${p.slug}`} onClick={closeQuickView} className="mt-4 text-xs font-semibold text-chatim-clayDark hover:underline text-center">View full details →</Link>
          </div>
        </div>
      )}
    </Modal>
  );
}

const TOPICS = ['Festive / Durga Puja Oxidised Set', 'Price Enquiry', '925 Sterling Silver Gift', 'Bridal / Trousseau Styling', 'Bulk / Corporate Gifting', 'Facebook Live Item Inquiry', 'Order Support'];

export function InquiryModal() {
  const { inquiry, inquiryTopic, inquiryMessage, closeInquiry } = useUI();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', topic: TOPICS[0], message: '', preferredDate: '' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (inquiry) { setDone(false); setErrors({}); setForm((f) => ({ ...f, topic: inquiryTopic || f.topic, message: inquiryMessage || f.message, name: f.name || user?.name || '', phone: f.phone || user?.phone || '', email: f.email || user?.email || '' })); }
  }, [inquiry, inquiryTopic, inquiryMessage, user]);
  const m = useMutation({
    mutationFn: () => api('/inquiries', { method: 'POST', body: form }),
    onSuccess: () => setDone(true),
    onError: (e) => setErrors(e.details || { _: e.message }),
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal open={inquiry} onClose={closeInquiry} label="Book a styling session">
      <div className="p-6 sm:p-8">
        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center text-2xl mb-4"><i className="fa-solid fa-check" /></div>
            <h3 className="font-serif text-2xl font-medium">We’ll be in touch!</h3>
            <p className="text-sm text-gray-500 mt-2">Our stylist will call or WhatsApp you within one working day.</p>
            <button onClick={closeInquiry} className="btn-primary mt-6">Continue shopping</button>
          </div>
        ) : (
          <>
            <span className="eyebrow">Personal Styling</span>
            <h3 className="font-serif text-2xl font-medium text-chatim-ink mt-1">Connect with Chatim</h3>
            <p className="text-xs text-gray-500 mt-1 mb-5">{form.topic === 'Price Enquiry' ? 'Leave your number and we’ll share the price and availability on call or WhatsApp.' : 'Book a video-call showcase or visit our Purbachal, Kolkata boutique.'}</p>
            <form onSubmit={(e) => { e.preventDefault(); setErrors({}); m.mutate(); }} className="space-y-3.5">
              <Field label="Your name" error={errors.name}><input className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} placeholder="e.g., Nandini Das" required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone / WhatsApp" error={errors.phone}><input type="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={set('phone')} placeholder="+91 98300 XXXXX" required /></Field>
                <Field label="Preferred date"><input type="date" className="input" value={form.preferredDate} onChange={set('preferredDate')} min={new Date().toISOString().slice(0, 10)} /></Field>
              </div>
              <Field label="Looking for"><select className="input" value={form.topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Message (optional)"><textarea className="input" rows={3} value={form.message} onChange={set('message')} placeholder="Tell us about the occasion, outfit or budget…" /></Field>
              {errors._ && <p className="text-xs text-red-500">{errors._}</p>}
              <button disabled={m.isPending} className="btn-primary w-full">{m.isPending ? <Spinner /> : 'Request Callback'}</button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

export function MobileNav() {
  const { mobileNav, setMobileNav } = useUI();
  const { user } = useAuth();
  const loc = useLocation();
  useEffect(() => { setMobileNav(false); }, [loc.pathname, loc.search, setMobileNav]);
  return (
    <div className={`fixed inset-0 z-50 lg:hidden transition ${mobileNav ? '' : 'pointer-events-none'}`} aria-hidden={!mobileNav}>
      <div onClick={() => setMobileNav(false)} className={`absolute inset-0 bg-black/40 transition-opacity ${mobileNav ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-chatim-paper p-6 flex flex-col transition-transform duration-300 ${mobileNav ? 'translate-x-0 shadow-card' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between pb-5 border-b border-gray-100">
          <Logo />
          <button onClick={() => setMobileNav(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" aria-label="Close menu"><i className="fa-solid fa-xmark" /></button>
        </div>
        <ul className="mt-4 space-y-1 text-sm font-medium text-gray-800 flex-1 overflow-y-auto">
          {NAV.map((n) => <li key={n.label}><Link to={n.to} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-chatim-peach hover:text-chatim-clayDark">{n.label}<i className="fa-solid fa-chevron-right text-[10px] opacity-40" /></Link></li>)}
          <li className="pt-3 mt-3 border-t border-gray-100"><Link to="/account" className="flex items-center gap-2 py-2.5 px-2"><i className="fa-regular fa-user w-5" />{user ? 'My Account' : 'Sign in / Register'}</Link></li>
          <li><Link to="/track" className="flex items-center gap-2 py-2.5 px-2"><i className="fa-solid fa-truck-fast w-5" />Track Order</Link></li>
          {user?.role === 'admin' && <li><Link to="/admin" className="flex items-center gap-2 py-2.5 px-2 text-chatim-clayDark font-semibold"><i className="fa-solid fa-gauge w-5" />Admin Dashboard</Link></li>}
          <li><a href="https://www.facebook.com/Chatimcollections/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-2.5 px-2 text-[#1877F2] font-semibold"><i className="fa-brands fa-facebook w-5" />Chatim on Facebook</a></li>
        </ul>
        <div className="p-4 rounded-2xl bg-chatim-peach text-xs text-chatim-clayDark">
          <p className="font-bold">Purbachal, Kolkata</p>
          <p className="mt-0.5 text-[11px] opacity-80">Pan-India shipping · 48-hour issue claims</p>
        </div>
      </div>
    </div>
  );
}

const TOAST_ICON = { success: 'fa-circle-check text-chatim-marigold', error: 'fa-circle-exclamation text-red-400', info: 'fa-circle-info text-sky-300', heart: 'fa-heart text-chatim-marigold' };
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 pointer-events-none w-[92vw] max-w-md" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="bg-gray-900 text-white px-5 py-3 rounded-full shadow-card text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-slideUp">
          <i className={`fa-solid ${TOAST_ICON[t.type] || TOAST_ICON.success}`} /><span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
