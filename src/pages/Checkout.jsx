import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, inr, INDIAN_STATES } from '../lib/api';
import { useAuth, useCart, toast } from '../store';
import { Breadcrumbs, EmptyState, Field, Img, Logo, Spinner } from '../components/ui';
import { useCartQuote, CouponBox } from '../components/Overlays';
import { OrderSummary } from './Cart';

const SAVED = 'chatim-checkout';
const PAYMENTS = [
  { id: 'upi', icon: 'fa-solid fa-mobile-screen-button', title: 'UPI', text: 'Google Pay, PhonePe, Paytm & more' },
  { id: 'card', icon: 'fa-regular fa-credit-card', title: 'Credit / Debit Card', text: 'Visa, Mastercard, RuPay' },
  { id: 'cod', icon: 'fa-solid fa-money-bill-wave', title: 'Cash on Delivery', text: 'Pay in cash or UPI at your doorstep' },
];

function Step({ n, title, children }) {
  return (
    <section className="card p-5 sm:p-7">
      <h2 className="flex items-center gap-3 font-serif text-xl font-medium text-chatim-ink mb-5">
        <span className="w-8 h-8 rounded-full bg-chatim-ink text-chatim-paper text-sm font-sans flex items-center justify-center">{n}</span>{title}
      </h2>
      {children}
    </section>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, coupon, clear } = useCart();
  const nav = useNavigate();
  const qc = useQueryClient();
  const saved = JSON.parse(localStorage.getItem(SAVED) || '{}');
  const [form, setForm] = useState({
    name: saved.name || '', email: saved.email || '', phone: saved.phone || '',
    address: { line1: '', line2: '', city: '', state: 'West Bengal', pincode: '', ...(saved.address || {}) },
    shippingMethod: 'standard', paymentMethod: 'upi', giftWrap: false, notes: '',
  });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  useEffect(() => { if (user) setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone || '' })); }, [user]);

  const { data: quote, isFetching } = useCartQuote({ shippingMethod: form.shippingMethod, giftWrap: form.giftWrap });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setA = (k) => (e) => setForm({ ...form, address: { ...form.address, [k]: k === 'pincode' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value } });

  const place = useMutation({
    mutationFn: () => api('/orders', { method: 'POST', body: { ...form, couponCode: coupon || null, items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) } }),
    onSuccess: (d) => {
      localStorage.setItem(SAVED, JSON.stringify({ name: form.name, email: form.email, phone: form.phone, address: form.address }));
      sessionStorage.setItem(`order-email-${d.orderNumber}`, form.email);
      clear();
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      nav(`/order/${d.orderNumber}?placed=1`, { replace: true });
    },
    onError: (e) => {
      setPaying(false);
      setErrors(e.details && !e.details.issues ? e.details : {});
      toast(e.message, 'error');
      if (e.details && !e.details.issues) setTimeout(() => document.querySelector('.input-error')?.focus(), 50);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const v = {};
    if (form.name.trim().length < 2) v.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) v.email = 'Enter a valid email';
    if (!/^[+\d][\d\s-]{7,16}$/.test(form.phone.trim())) v.phone = 'Enter a valid phone number';
    if (form.address.line1.trim().length < 3) v['address.line1'] = 'Enter your address';
    if (form.address.city.trim().length < 2) v['address.city'] = 'Enter your city';
    if (!/^\d{6}$/.test(form.address.pincode)) v['address.pincode'] = 'Enter a valid 6-digit PIN code';
    setErrors(v);
    if (Object.keys(v).length) {
      toast('Please check the highlighted fields', 'error');
      setTimeout(() => document.querySelector('.input-error')?.focus(), 50);
      return;
    }
    if (form.paymentMethod === 'cod') { place.mutate(); return; }
    setPaying(true);
    setTimeout(() => place.mutate(), 1600); // simulated payment gateway hand-off
  };

  if (items.length === 0 && !place.isPending) {
    return <div className="container-x py-16"><EmptyState icon="fa-solid fa-bag-shopping" title="Your bag is empty" text="Add something you love before checking out." action={<Link to="/shop" className="btn-primary">Browse jewellery</Link>} /></div>;
  }
  const err = (k) => errors[k];
  const cls = (k) => `input ${err(k) ? 'input-error' : ''}`;

  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Bag', to: '/cart' }, { label: 'Checkout' }]} />
        <h1 className="font-serif text-3xl sm:text-4xl font-medium mt-3 mb-6">Secure Checkout</h1>
        {!user && (
          <div className="mb-6 p-4 rounded-2xl bg-chatim-paper border border-pink-100 text-sm flex flex-wrap items-center justify-between gap-3">
            <span className="text-gray-600"><i className="fa-regular fa-user mr-2 text-chatim-clay" />Have an account? Sign in for faster checkout and order tracking.</span>
            <Link to="/account?next=/checkout" className="text-chatim-clayDark font-semibold hover:underline">Sign in</Link>
          </div>
        )}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          <form id="checkout-form" onSubmit={submit} noValidate className="space-y-6">
            <Step n={1} title="Contact details">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name" error={err('name')}><input className={cls('name')} value={form.name} onChange={set('name')} autoComplete="name" /></Field>
                <Field label="Mobile number" error={err('phone')} hint="For delivery updates on WhatsApp"><input className={cls('phone')} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="+91 98300 00000" /></Field>
                <div className="sm:col-span-2"><Field label="Email" error={err('email')} hint="Order confirmation will be sent here"><input className={cls('email')} type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field></div>
              </div>
            </Step>

            <Step n={2} title="Shipping address">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Field label="Address line 1" error={err('address.line1')}><input className={cls('address.line1')} value={form.address.line1} onChange={setA('line1')} autoComplete="address-line1" placeholder="House no., building, street" /></Field></div>
                <div className="sm:col-span-2"><Field label="Address line 2 (optional)"><input className="input" value={form.address.line2} onChange={setA('line2')} autoComplete="address-line2" placeholder="Area, landmark" /></Field></div>
                <Field label="City" error={err('address.city')}><input className={cls('address.city')} value={form.address.city} onChange={setA('city')} autoComplete="address-level2" /></Field>
                <Field label="PIN code" error={err('address.pincode')}><input className={cls('address.pincode')} value={form.address.pincode} onChange={setA('pincode')} inputMode="numeric" autoComplete="postal-code" placeholder="700091" /></Field>
                <div className="sm:col-span-2"><Field label="State" error={err('address.state')}><select className={cls('address.state')} value={form.address.state} onChange={setA('state')}>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field></div>
              </div>
            </Step>

            <Step n={3} title="Delivery">
              <div className="grid sm:grid-cols-2 gap-3">
                {[['standard', 'Standard', '4–6 working days', quote && form.shippingMethod === 'standard' ? quote.shipping : (quote?.subtotal - quote?.discount >= 999 ? 0 : 79)],
                  ['express', 'Express', '1–2 days in metros', quote && form.shippingMethod === 'express' ? quote.shipping : (quote?.subtotal - quote?.discount >= 2499 ? 0 : 149)]].map(([id, t, d, fee]) => (
                  <label key={id} className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${form.shippingMethod === id ? 'border-chatim-clay bg-chatim-peach/40' : 'border-gray-100 hover:border-pink-200'}`}>
                    <input type="radio" name="ship" checked={form.shippingMethod === id} onChange={() => setForm({ ...form, shippingMethod: id })} className="mt-1 accent-chatim-clay" />
                    <div className="flex-1"><p className="text-sm font-semibold">{t}</p><p className="text-xs text-gray-500">{d}</p></div>
                    <span className="text-sm font-bold">{fee ? inr(fee) : <span className="text-emerald-600">FREE</span>}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-3 mt-4 p-4 rounded-2xl bg-chatim-ivory cursor-pointer">
                <input type="checkbox" checked={form.giftWrap} onChange={set('giftWrap')} className="w-4 h-4 accent-chatim-clay" />
                <span className="flex-1 text-sm"><i className="fa-solid fa-gift text-chatim-clay mr-2" />Add premium gift wrap & handwritten note</span>
                <span className="text-sm font-semibold">₹49</span>
              </label>
              <div className="mt-4"><Field label="Order notes (optional)" hint="Initial for personalised pendants, gift message, delivery instructions…"><textarea className="input" rows={2} value={form.notes} onChange={set('notes')} maxLength={500} /></Field></div>
            </Step>

            <Step n={4} title="Payment">
              <div className="space-y-3">
                {PAYMENTS.map((pm) => (
                  <label key={pm.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition ${form.paymentMethod === pm.id ? 'border-chatim-clay bg-chatim-peach/40' : 'border-gray-100 hover:border-pink-200'}`}>
                    <input type="radio" name="pay" checked={form.paymentMethod === pm.id} onChange={() => setForm({ ...form, paymentMethod: pm.id })} className="accent-chatim-clay" />
                    <i className={`${pm.icon} text-xl text-chatim-clayDark w-6 text-center`} />
                    <div><p className="text-sm font-semibold">{pm.title}</p><p className="text-xs text-gray-500">{pm.text}</p></div>
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-4"><i className="fa-solid fa-circle-info mr-1" />Demo store: online payments are simulated – no real money is charged and no card details are collected.</p>
            </Step>
          </form>

          <div className="lg:sticky lg:top-36 space-y-4">
            <div className="card p-5 space-y-3 max-h-72 overflow-y-auto">
              {quote?.lines.map((l) => (
                <div key={l.productId} className="flex gap-3 items-center">
                  <div className="relative"><Img src={l.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-pink-50" /><span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">{l.quantity}</span></div>
                  <p className="flex-1 text-xs font-medium text-gray-800 line-clamp-2">{l.name}</p>
                  <span className="text-sm font-semibold">{inr(l.lineTotal)}</span>
                </div>
              ))}
              {quote?.issues?.map((i) => <p key={i.productId} className="text-xs text-red-500"><i className="fa-solid fa-triangle-exclamation mr-1" />{i.message}</p>)}
            </div>
            <div className="card p-4"><CouponBox quote={quote} /></div>
            <OrderSummary quote={quote} loading={isFetching} compact>
              <button type="submit" form="checkout-form" disabled={place.isPending || paying || !quote?.lines?.length} className="btn-primary w-full py-4 text-base">
                {place.isPending || paying ? <><Spinner /> Processing…</> : form.paymentMethod === 'cod' ? <>Place Order · {inr(quote?.total)}</> : <><i className="fa-solid fa-lock text-sm" /> Pay {inr(quote?.total)}</>}
              </button>
              <p className="text-[11px] text-gray-400 text-center">By placing this order you agree to our <Link to="/terms" className="text-chatim-clayDark underline underline-offset-2">Terms & Conditions</Link>.</p>
            </OrderSummary>
          </div>
        </div>
      </div>

      {paying && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-chatim-paper rounded-3xl p-8 max-w-sm w-full text-center shadow-card animate-slideUp">
            <div className="flex justify-center mb-4"><Logo /></div>
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-pink-100 border-t-chatim-clay animate-spin" />
            <h3 className="font-serif text-xl font-medium mt-5">Confirming your payment</h3>
            <p className="text-sm text-gray-500 mt-1">{form.paymentMethod === 'upi' ? 'Approve the request in your UPI app…' : 'Securely authorising your card…'}</p>
            <p className="font-serif text-2xl font-medium mt-4">{inr(quote?.total)}</p>
            <p className="text-[11px] text-gray-400 mt-4"><i className="fa-solid fa-lock mr-1" />Simulated gateway · Demo mode</p>
          </div>
        </div>
      )}
    </div>
  );
}
