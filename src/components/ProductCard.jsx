import { Link } from 'react-router-dom';
import { Img, Price } from './ui';
import { useCart, useUI, useWishlist, toast } from '../store';
import { onRequest, priceEnquiryText, waLink } from '../lib/api';

export function useWishToggle() {
  const toggle = useWishlist((s) => s.toggle);
  return (p) => {
    const added = toggle(p.id);
    toast(added ? `Saved “${p.name}” to your wishlist` : 'Removed from wishlist', added ? 'heart' : 'info');
  };
}

export function useAddToCart() {
  const add = useCart((s) => s.add);
  const openCart = useUI((s) => s.openCart);
  return (p, qty = 1, { open = true } = {}) => {
    if (p.stock <= 0) { toast('Sorry, this piece is sold out', 'error'); return; }
    if (onRequest(p)) { toast('This piece is priced on request – message us on WhatsApp', 'info'); return; }
    add(p, qty);
    toast(`Added “${p.name}” to your bag`);
    if (open) openCart();
  };
}

export default function ProductCard({ product: p, index = 0 }) {
  const wished = useWishlist((s) => s.ids.includes(p.id));
  const toggleWish = useWishToggle();
  const addToCart = useAddToCart();
  const openQuickView = useUI((s) => s.openQuickView);
  const soldOut = p.stock <= 0;
  const ask = onRequest(p);
  const low = !soldOut && !ask && p.stock <= 5;

  return (
    <article className="group flex flex-col animate-slideUp" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="relative aspect-[4/5] rounded-2xl bg-chatim-sand overflow-hidden">
        <Link to={`/product/${p.slug}`} aria-label={p.name}>
          <Img src={p.images[0]} alt={p.name} className={`absolute inset-0 w-full h-full object-cover !transition-all !duration-[900ms] ease-out group-hover:scale-[1.04] ${p.images[1] ? 'group-hover:opacity-0' : ''} ${soldOut ? 'grayscale-[50%]' : ''}`} />
          {p.images[1] && <Img src={p.images[1]} alt="" aria-hidden fade={false} className="absolute inset-0 w-full h-full object-cover scale-[1.04] opacity-0 group-hover:opacity-100 transition-all duration-[900ms] ease-out" />}
        </Link>
        {(p.badge || soldOut) && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9.5px] font-medium uppercase tracking-[0.14em] ${soldOut ? 'bg-chatim-ink text-chatim-paper' : 'bg-chatim-paper/90 backdrop-blur text-chatim-ink'}`}>
            {soldOut ? 'Sold out' : p.badge.toLowerCase()}
          </span>
        )}
        <button onClick={() => toggleWish(p)} className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-chatim-paper/80 backdrop-blur hover:bg-chatim-paper flex items-center justify-center transition active:scale-90" aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished}>
          <i className={`${wished ? 'fa-solid fa-heart text-chatim-clay' : 'fa-regular fa-heart text-chatim-ink'} text-[13px]`} />
        </button>
        {/* hover actions (desktop) */}
        <div className="hidden sm:flex absolute inset-x-3 bottom-3 gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          {ask && !soldOut ? (
            <a href={waLink(priceEnquiryText(p))} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 rounded-full bg-chatim-ink/90 backdrop-blur text-chatim-paper text-[10.5px] uppercase tracking-[0.16em] hover:bg-chatim-clay transition-colors flex items-center justify-center gap-2">
              <i className="fa-brands fa-whatsapp text-[13px]" />Ask for price
            </a>
          ) : (
            <button onClick={() => addToCart(p)} disabled={soldOut} className="flex-1 h-10 rounded-full bg-chatim-ink/90 backdrop-blur text-chatim-paper text-[10.5px] uppercase tracking-[0.16em] hover:bg-chatim-clay transition-colors disabled:bg-chatim-ink/50">
              {soldOut ? 'Sold out' : 'Add to bag'}
            </button>
          )}
          <button onClick={() => openQuickView(p.slug)} className="w-10 h-10 rounded-full bg-chatim-paper/90 backdrop-blur text-chatim-ink hover:text-chatim-clay" aria-label="Quick view"><i className="fa-regular fa-eye text-[13px]" /></button>
        </div>
        {/* compact bag button (touch) */}
        {!soldOut && (ask ? (
          <a href={waLink(priceEnquiryText(p))} target="_blank" rel="noopener noreferrer" className="sm:hidden absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-chatim-ink text-chatim-paper flex items-center justify-center" aria-label={`Ask for the price of ${p.name} on WhatsApp`}>
            <i className="fa-brands fa-whatsapp text-sm" />
          </a>
        ) : (
          <button onClick={() => addToCart(p)} className="sm:hidden absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-chatim-ink text-chatim-paper flex items-center justify-center" aria-label={`Add ${p.name} to bag`}>
            <i className="fa-solid fa-plus text-xs" />
          </button>
        ))}
      </div>

      <div className="pt-3.5 px-0.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-[10.5px] uppercase tracking-[0.14em] text-gray-500">
          <span className="truncate">{p.collection}</span>
          {p.reviewCount > 0 && <span className="flex items-center gap-1 normal-case tracking-normal shrink-0"><i className="fa-solid fa-star text-chatim-marigold text-[9px]" />{p.rating.toFixed(1)}</span>}
        </div>
        <Link to={`/product/${p.slug}`} className="mt-1 font-serif text-[1.15rem] sm:text-[1.25rem] leading-snug text-chatim-ink line-clamp-2 hover:text-chatim-clay transition-colors">{p.name}</Link>
        <div className="mt-1.5"><Price price={p.price} originalPrice={p.originalPrice} /></div>
        {low && <p className="text-[11px] text-chatim-clay mt-1">Only {p.stock} left</p>}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[4/5] rounded-2xl skeleton" />
      <div className="pt-4 space-y-2">
        <div className="h-3 w-1/3 rounded skeleton" />
        <div className="h-5 w-4/5 rounded skeleton" />
        <div className="h-4 w-1/4 rounded skeleton" />
      </div>
    </div>
  );
}

export function ProductGrid({ items, loading, count = 8, cols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' }) {
  return (
    <div className={`grid ${cols} gap-x-4 gap-y-10 sm:gap-x-7 sm:gap-y-14`}>
      {loading ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
}
