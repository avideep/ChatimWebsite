import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inr, STATUS_STYLE } from '../lib/api';

const FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBF6EE"/><stop offset="1" stop-color="#F3E6D4"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><g transform="translate(200 185) scale(4)" fill="none" stroke="#C24E17" stroke-width="1.4" stroke-linejoin="round"><path d="M0-9c1.5 3.5 4.5 5 8 5.5-3.5 2-4.5 5-4 8.5-3-2-5-2-8 0 .5-3.5-.5-6.5-4-8.5 3.5-.5 6.5-2 8-5.5z"/><circle cy="-1" r="2" fill="#C24E17"/></g><text x="200" y="265" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#C24E17" letter-spacing="4">CHATIM</text></svg>`)}`;

/** Image with graceful branded fallback + fade-in. */
export function Img({ src, alt, className = '', fade = true, ...rest }) {
  // Track state per URL (not reset in an effect): cached images can fire onLoad
  // before effects run, which previously left them stuck at opacity 0.
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [errSrc, setErrSrc] = useState(null);
  const err = errSrc === src;
  const loaded = loadedSrc === src || err;
  const ref = useCallback((el) => { if (el?.complete && el.naturalWidth > 0) setLoadedSrc(src); }, [src]);
  return (
    <img
      ref={ref}
      src={err || !src ? FALLBACK : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoadedSrc(src)}
      onError={() => setErrSrc(src)}
      className={fade ? `${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}` : className}
      {...rest}
    />
  );
}

export function Stars({ value = 0, size = 'text-xs', className = '' }) {
  return (
    <span className={`inline-flex text-amber-400 ${size} ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={value >= i ? 'fa-solid fa-star' : value >= i - 0.5 ? 'fa-solid fa-star-half-stroke' : 'fa-regular fa-star'} />
      ))}
    </span>
  );
}

export function Price({ price, originalPrice, size = 'base' }) {
  const big = size === 'lg';
  if (!(price > 0)) {
    return <span className={`${big ? 'text-[1.6rem] font-serif font-medium' : 'text-[13px] font-medium tracking-wide'} text-chatim-clayDark`}>Price on request</span>;
  }
  const pct = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`${big ? 'text-[2rem] font-serif font-medium' : 'text-[15px] font-medium'} text-chatim-ink`}>{inr(price)}</span>
      {pct > 0 && <>
        <span className={`${big ? 'text-base' : 'text-xs'} text-gray-400 line-through`}>{inr(originalPrice)}</span>
        <span className={`${big ? 'text-xs px-2 py-0.5' : 'text-[10.5px]'} font-medium text-chatim-clay ${big ? 'bg-chatim-peach rounded-full' : ''}`}>{pct}% off</span>
      </>}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <i className={`fa-solid fa-circle-notch fa-spin ${className}`} aria-hidden />;
}

export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label="Chatim Collections home">
      <img src="/media/logo.jpg" alt="" width="44" height="44" className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover group-hover:rotate-6 transition-transform duration-500" />
      <div className="flex flex-col items-start">
        <span className={`font-serif text-[1.6rem] sm:text-[2rem] font-semibold tracking-[0.06em] leading-none ${light ? 'text-chatim-paper' : 'text-chatim-ink'}`}>Chatim</span>
        <span className={`text-[8.5px] sm:text-[9.5px] tracking-[0.42em] uppercase mt-1 ${light ? 'text-chatim-marigold' : 'text-chatim-clay'}`}>Collections</span>
      </div>
    </Link>
  );
}

export function Modal({ open, onClose, children, className = 'max-w-md', label }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-chatim-ink/40 backdrop-blur-sm animate-fadeIn" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={label}>
      <div className={`bg-chatim-paper rounded-3xl w-full shadow-card relative animate-slideUp max-h-[92vh] overflow-y-auto ${className}`}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-chatim-paper/90 text-chatim-ink hover:text-chatim-clay flex items-center justify-center border border-chatim-line" aria-label="Close">
          <i className="fa-solid fa-xmark" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="block text-[11px] text-red-500 mt-1">{error}</span> : hint ? <span className="block text-[11px] text-gray-400 mt-1">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ icon = 'fa-regular fa-gem', title, text, action }) {
  return (
    <div className="text-center py-20 px-6 bg-chatim-paper rounded-3xl border border-chatim-line">
      <div className="w-16 h-16 rounded-full border border-chatim-line text-chatim-clay mx-auto flex items-center justify-center text-xl mb-5"><i className={icon} /></div>
      <h3 className="font-serif text-2xl font-medium text-chatim-ink">{title}</h3>
      {text && <p className="text-sm text-gray-500 mt-1 mb-5 max-w-md mx-auto">{text}</p>}
      {action}
    </div>
  );
}

export function Badge({ status, children }) {
  return <span className={`chip capitalize ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-600'}`}>{children || status}</span>;
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="text-[11px] uppercase tracking-[0.14em] text-gray-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="opacity-40">/</span>}
          {it.to ? <Link to={it.to} className="hover:text-chatim-clay">{it.label}</Link> : <span className="text-chatim-ink line-clamp-1">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function QtyStepper({ value, onChange, max = 10, small = false }) {
  const s = small ? 'w-7 h-7 text-[10px]' : 'w-10 h-10 text-xs';
  return (
    <div className="inline-flex items-center rounded-full border border-chatim-line bg-chatim-paper">
      <button type="button" onClick={() => onChange(value - 1)} className={`${s} rounded-full hover:bg-chatim-ivory text-chatim-ink`} aria-label="Decrease quantity"><i className="fa-solid fa-minus" /></button>
      <span className={`${small ? 'w-6 text-xs' : 'w-8 text-sm'} text-center font-medium`}>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className={`${s} rounded-full hover:bg-chatim-ivory text-chatim-ink disabled:opacity-30`} aria-label="Increase quantity"><i className="fa-solid fa-plus" /></button>
    </div>
  );
}
