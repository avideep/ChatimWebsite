import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fmtDate, onRequest, priceEnquiryText, waLink } from '../lib/api';
import { useAuth, useUI, useWishlist, toast } from '../store';
import { Breadcrumbs, EmptyState, Field, Img, Price, QtyStepper, Spinner, Stars } from '../components/ui';
import { ProductGrid, useAddToCart, useWishToggle } from '../components/ProductCard';

function Gallery({ images, name }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(null);
  useEffect(() => setI(0), [images]);
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-start gap-3 sm:gap-4">
      <div className="flex sm:flex-col gap-3 overflow-x-auto no-scrollbar">
        {images.map((src, k) => (
          <button key={k} onClick={() => setI(k)} className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border transition ${k === i ? 'border-chatim-ink' : 'border-transparent opacity-60 hover:opacity-100'}`} aria-label={`View image ${k + 1}`}>
            <Img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <div className="relative flex-1 min-w-0 aspect-[4/5] rounded-2xl overflow-hidden bg-chatim-sand cursor-zoom-in"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
        onMouseLeave={() => setZoom(null)}>
        <Img key={images[i]} src={images[i]} alt={name} className="absolute inset-0 w-full h-full object-cover !transition-transform duration-200"
          style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
        {images.length > 1 && <>
          <button onClick={() => setI((i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-chatim-paper/90 shadow flex items-center justify-center sm:hidden" aria-label="Previous image"><i className="fa-solid fa-chevron-left text-xs" /></button>
          <button onClick={() => setI((i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-chatim-paper/90 shadow flex items-center justify-center sm:hidden" aria-label="Next image"><i className="fa-solid fa-chevron-right text-xs" /></button>
        </>}
      </div>
    </div>
  );
}

function Accordion({ title, children, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="border-b border-pink-100">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-sm font-semibold text-chatim-ink" aria-expanded={open}>
        {title}<i className={`fa-solid fa-chevron-down text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4 text-sm text-gray-600 leading-relaxed animate-fadeIn">{children}</div>}
    </div>
  );
}

function ReviewForm({ productId, onDone }) {
  const [form, setForm] = useState({ rating: 5, title: '', body: '', location: '' });
  const [hover, setHover] = useState(0);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api(`/products/${productId}/reviews`, { method: 'POST', body: form }),
    onSuccess: () => { toast('Thank you! Your review is live.'); qc.invalidateQueries({ queryKey: ['product'] }); onDone(); },
    onError: (e) => toast(e.message, 'error'),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="card p-5 sm:p-6 space-y-4 animate-slideUp">
      <div>
        <span className="label">Your rating</span>
        <div className="flex gap-1 text-2xl text-amber-400" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button type="button" key={s} onMouseEnter={() => setHover(s)} onClick={() => setForm({ ...form, rating: s })} aria-label={`${s} stars`}>
              <i className={`${(hover || form.rating) >= s ? 'fa-solid' : 'fa-regular'} fa-star`} />
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Headline"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sum it up in a few words" maxLength={80} /></Field>
        <Field label="Your city (optional)"><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g., Salt Lake, Kolkata" /></Field>
      </div>
      <Field label="Your review"><textarea className="input" rows={4} required minLength={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="How did it look and feel? Would you recommend it?" /></Field>
      <div className="flex gap-3">
        <button disabled={m.isPending} className="btn-primary">{m.isPending ? <Spinner /> : 'Submit review'}</button>
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const openInquiry = useUI((s) => s.openInquiry);
  const { data, isLoading, error } = useQuery({ queryKey: ['product', slug], queryFn: () => api(`/products/${slug}`) });
  const addToCart = useAddToCart();
  const toggleWish = useWishToggle();
  const [qty, setQty] = useState(1);
  const [writing, setWriting] = useState(false);
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState(null);
  const p = data?.product;
  const wished = useWishlist((s) => p && s.ids.includes(p.id));

  useEffect(() => { setQty(1); setWriting(false); setPinMsg(null); }, [slug]);
  useEffect(() => { if (p) document.title = `${p.name} | Chatim Collections`; return () => { document.title = 'Chatim Collections | Fine Silver, Oxidised & Handcrafted Jewellery – Kolkata'; }; }, [p]);

  if (error) return <div className="container-x py-16"><EmptyState title="This piece has moved on" text="It may have sold out or been retired. Explore similar designs instead." action={<Link to="/shop" className="btn-primary">Browse collection</Link>} /></div>;
  if (isLoading) {
    return (
      <div className="container-x py-10 grid lg:grid-cols-2 gap-10">
        <div className="aspect-square rounded-3xl skeleton" />
        <div className="space-y-4"><div className="h-6 w-1/3 rounded skeleton" /><div className="h-10 w-4/5 rounded skeleton" /><div className="h-8 w-1/2 rounded skeleton" /><div className="h-24 rounded skeleton" /></div>
      </div>
    );
  }

  const soldOut = p.stock <= 0;
  const ask = onRequest(p);
  const enquiry = priceEnquiryText(p);
  const eta = new Date(Date.now() + 5 * 864e5).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const checkPin = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setPinMsg({ ok: false, text: 'Please enter a valid 6-digit PIN code' });
    const metro = /^(70|11|40|56|60|50)/.test(pin);
    return setPinMsg({ ok: true, text: metro ? `Express delivery available · Get it by ${new Date(Date.now() + 2 * 864e5).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}` : `Delivery by ${eta} · COD available` });
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: p.name, url }); } catch { /* cancelled */ } } else { await navigator.clipboard?.writeText(url); toast('Link copied to clipboard'); }
  };
  const total = data.reviews.length;

  return (
    <>
      <div className="container-x py-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: p.category, to: `/shop?category=${p.category}` }, { label: p.name }]} />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 mt-5">
          <Gallery images={p.images} name={p.name} />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {p.badge && <span className="chip bg-chatim-peach text-chatim-clayDark">{p.badge}</span>}
              <Link to={`/shop?collection=${encodeURIComponent(p.collection)}`} className="chip bg-gray-100 text-gray-600 hover:bg-gray-200">{p.collection}</Link>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-medium text-chatim-ink mt-3 leading-tight">{p.name}</h1>
            {p.reviewCount > 0 && (
              <a href="#reviews" className="flex items-center gap-2 mt-3 text-sm text-gray-600 hover:text-chatim-clayDark w-fit">
                <Stars value={p.rating} size="text-sm" /><span className="font-semibold">{p.rating.toFixed(1)}</span><span className="text-gray-400">({p.reviewCount} reviews)</span>
                {p.sold > 0 && <><span className="text-gray-300">|</span><span className="text-gray-500">{p.sold}+ sold</span></>}
              </a>
            )}
            <div className="mt-5"><Price price={p.price} originalPrice={p.originalPrice} size="lg" /></div>
            <p className="text-xs text-gray-400 mt-1">{ask ? 'Message us on WhatsApp for the price and availability' : 'MRP inclusive of all taxes'}</p>

            {!ask && (
              <div className="mt-4 p-3 rounded-2xl bg-chatim-marigoldLight border border-chatim-marigold/40 text-xs text-chatim-ink flex items-center gap-2">
                <i className="fa-solid fa-ticket" /> Extra 15% off on your first order with <b>CHATIM15</b>
              </div>
            )}

            <p className="text-sm text-gray-600 mt-5 leading-relaxed">{p.description}</p>

            {!ask && (
              <div className="mt-5 text-sm">
                {soldOut ? <span className="text-red-500 font-semibold"><i className="fa-solid fa-circle-xmark mr-1.5" />Currently sold out</span>
                  : p.stock <= 5 ? <span className="text-amber-600 font-semibold"><i className="fa-solid fa-fire-flame-curved mr-1.5" />Hurry! Only {p.stock} left in stock</span>
                    : <span className="text-emerald-600 font-semibold"><i className="fa-solid fa-circle-check mr-1.5" />In stock, ready to ship</span>}
              </div>
            )}

            {ask ? (
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <a href={waLink(enquiry)} target="_blank" rel="noopener noreferrer" className="btn-primary flex-auto py-3.5"><i className="fa-brands fa-whatsapp text-base leading-none" /> Ask on WhatsApp</a>
                <button onClick={() => openInquiry('Price Enquiry', enquiry)} className="btn-dark flex-auto py-3.5"><i className="fa-solid fa-phone" /> Call me back</button>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => toggleWish(p)} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center hover:bg-pink-50" aria-label="Toggle wishlist" aria-pressed={!!wished}><i className={`${wished ? 'fa-solid text-chatim-clay' : 'fa-regular'} fa-heart text-lg`} /></button>
                  <button onClick={share} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center hover:bg-pink-50" aria-label="Share"><i className="fa-solid fa-share-nodes" /></button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 mt-5">
                {!soldOut && <QtyStepper value={qty} max={Math.min(10, p.stock)} onChange={(q) => setQty(Math.max(1, q))} />}
                <button disabled={soldOut} onClick={() => addToCart(p, qty)} className="btn-primary flex-1 min-w-[160px] py-3.5"><i className="fa-solid fa-bag-shopping" /> {soldOut ? 'Sold out' : 'Add to Bag'}</button>
                {!soldOut && <button onClick={() => { addToCart(p, qty, { open: false }); nav('/checkout'); }} className="btn-dark flex-1 min-w-[140px] py-3.5">Buy Now</button>}
                <button onClick={() => toggleWish(p)} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center hover:bg-pink-50 shrink-0" aria-label="Toggle wishlist" aria-pressed={!!wished}><i className={`${wished ? 'fa-solid text-chatim-clay' : 'fa-regular'} fa-heart text-lg`} /></button>
                <button onClick={share} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center hover:bg-pink-50 shrink-0" aria-label="Share"><i className="fa-solid fa-share-nodes" /></button>
              </div>
            )}
            {soldOut && <button onClick={() => openInquiry('Order Support')} className="mt-3 text-xs font-semibold text-chatim-clayDark hover:underline">Ask us when it’s back in stock →</button>}

            {!ask && (
              <form onSubmit={checkPin} className="mt-6 p-4 rounded-2xl border border-pink-100 bg-chatim-ivory/60">
                <p className="text-xs font-bold text-chatim-ink mb-2"><i className="fa-solid fa-location-dot text-chatim-clay mr-1.5" />Check delivery</p>
                <div className="flex gap-2">
                  <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="Enter PIN code" className="input !py-2" aria-label="PIN code" />
                  <button className="px-5 rounded-xl bg-gray-900 text-white text-xs font-semibold">Check</button>
                </div>
                {pinMsg && <p className={`text-xs mt-2 ${pinMsg.ok ? 'text-emerald-700' : 'text-red-500'}`}>{pinMsg.text}</p>}
              </form>
            )}

            <div className="grid grid-cols-3 gap-3 mt-6 text-center">
              {(ask
                ? [['fa-hand-sparkles', 'Hand-picked by Chatim'], ['fa-camera', 'As seen on our Instagram'], ['fa-comments', 'Quick replies on WhatsApp']]
                : [['fa-shield-halved', 'Skin-safe & hypoallergenic'], ['fa-clock', '48-hour issue claims'], ['fa-gift', 'Free gift box']]).map(([i, t]) => (
                <div key={t} className="p-3 rounded-2xl bg-chatim-paper border border-pink-100"><i className={`fa-solid ${i} text-chatim-clay`} /><p className="text-[11px] text-gray-600 mt-1">{t}</p></div>
              ))}
            </div>

            <div className="mt-6">
              {p.details.length > 0 && <Accordion title="Product details" open>
                <ul className="space-y-1.5">{p.details.map((d) => <li key={d} className="flex gap-2"><i className="fa-solid fa-check text-chatim-clay text-xs mt-1" />{d}</li>)}</ul>
              </Accordion>}
              {!ask && <Accordion title="Shipping & exchange">Standard processing takes 5–7 business days. After dispatch, standard delivery takes 4–6 working days. Returns and exchanges are accepted only for defective or incorrect items; claims must be submitted within 48 hours with clear photos and an unboxing video. <Link to="/terms" className="text-chatim-clayDark underline underline-offset-2">Read Terms & Conditions.</Link></Accordion>}
              <Accordion title="Jewellery care">Store in the zip pouch provided, away from moisture. Put your jewellery on last – after perfume, lotion and hairspray. Wipe gently with a soft dry cloth after each wear.</Accordion>
            </div>
          </div>
        </div>
      </div>

      <section id="reviews" className="bg-chatim-ivory/60 border-y border-pink-100 py-12 scroll-mt-24">
        <div className="container-x grid lg:grid-cols-[300px_1fr] gap-10">
          <div>
            <h2 className="h-section">Customer Reviews</h2>
            <div className="flex items-center gap-3 mt-4">
              <span className="font-serif text-5xl font-medium">{total ? p.rating.toFixed(1) : '–'}</span>
              <div><Stars value={p.rating} size="text-base" /><p className="text-xs text-gray-500 mt-1">Based on {total} reviews</p></div>
            </div>
            <div className="mt-5 space-y-2">
              {data.breakdown.map((b) => (
                <div key={b.stars} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-6">{b.stars}★</span>
                  <div className="flex-1 h-2 rounded-full bg-pink-100 overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${total ? (b.count / total) * 100 : 0}%` }} /></div>
                  <span className="w-6 text-right">{b.count}</span>
                </div>
              ))}
            </div>
            {user ? (
              !writing && <button onClick={() => setWriting(true)} className="btn-outline w-full mt-6"><i className="fa-regular fa-pen-to-square" /> Write a review</button>
            ) : (
              <Link to={`/account?next=/product/${slug}%23reviews`} className="btn-outline w-full mt-6">Sign in to write a review</Link>
            )}
          </div>
          <div className="space-y-4">
            {writing && <ReviewForm productId={p.id} onDone={() => setWriting(false)} />}
            {data.reviews.length === 0 && !writing && <p className="text-sm text-gray-500">No reviews yet – be the first!</p>}
            {data.reviews.map((r) => (
              <article key={r.id} className="card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-chatim-clay/90 text-white font-bold text-xs flex items-center justify-center">{r.author.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
                    <div>
                      <p className="text-sm font-bold text-chatim-ink">{r.author}</p>
                      <p className="text-[11px] text-gray-500">{r.location && `${r.location} · `}{fmtDate(r.createdAt)}{r.verified ? <span className="text-emerald-600 font-semibold"> · <i className="fa-solid fa-circle-check" /> Verified buyer</span> : null}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.title && <p className="font-semibold text-sm text-chatim-ink mt-3">{r.title}</p>}
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {data.related.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="container-x">
            <span className="eyebrow">Complete the look</span>
            <h2 className="h-section mt-1 mb-8">You may also love</h2>
            <ProductGrid items={data.related.slice(0, 4)} />
          </div>
        </section>
      )}

      {/* sticky mobile buy bar */}
      {!soldOut && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-chatim-paper/95 backdrop-blur border-t border-pink-100 p-3 flex gap-3">
          <button onClick={() => toggleWish(p)} className="w-12 h-12 rounded-full border border-pink-200 flex items-center justify-center shrink-0" aria-label="Toggle wishlist"><i className={`${wished ? 'fa-solid text-chatim-clay' : 'fa-regular'} fa-heart`} /></button>
          {ask
            ? <a href={waLink(enquiry)} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1"><i className="fa-brands fa-whatsapp text-base leading-none" /> Ask for price</a>
            : <button onClick={() => addToCart(p, qty)} className="btn-primary flex-1">Add to Bag · ₹{p.price.toLocaleString('en-IN')}</button>}
        </div>
      )}
    </>
  );
}
