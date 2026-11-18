import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, inr, qs } from '../lib/api';
import { useAuth, useCart, useUI, useWishlist, toast } from '../store';
import { Img, Logo } from './ui';

const PROMOS = [
  <>New to Chatim? Enjoy <span className="text-chatim-marigold">15% off</span> with <CopyCode code="CHATIM15" /></>,
  <>Complimentary shipping above ₹999<span className="hidden sm:inline"><span className="mx-2 opacity-40">·</span> Pan-India delivery</span></>,
  <>The Pujo Edit — extra <span className="text-chatim-marigold">25% off</span> above ₹2,499 with <CopyCode code="PUJO25" /></>,
];

function CopyCode({ code }) {
  return (
    <button onClick={() => { navigator.clipboard?.writeText(code); toast(`Code ${code} copied`); }} className="underline underline-offset-4 decoration-chatim-marigold/60 hover:text-chatim-marigold" title="Click to copy">{code}</button>
  );
}

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % PROMOS.length), 5000); return () => clearInterval(t); }, []);
  return (
    <div className="bg-chatim-ink text-chatim-peach text-[10.5px] sm:text-[11px] uppercase tracking-[0.18em] py-2.5 px-4 text-center relative z-50">
      <div key={i} className="animate-fadeIn">{PROMOS[i]}</div>
    </div>
  );
}

export const NAV = [
  { label: 'New In', to: '/shop?isNew=1&sort=newest' },
  { label: 'Afghani Tribal', to: '/shop?collection=Afghani%20Tribal', dot: true },
  { label: 'Earrings', to: '/shop?category=Earrings', sub: [
    { label: 'Vintage Afghan Earrings', to: '/shop?category=Earrings&collection=Afghani%20Tribal' },
    { label: 'Oxidised Earrings', to: '/shop?category=Earrings&collection=Oxidised' },
    { label: 'Festive Earrings', to: '/shop?category=Earrings&collection=Festive' },
    { label: 'Everyday Earrings', to: '/shop?category=Earrings&collection=Everyday' },
  ] },
  { label: 'Necklaces', to: '/shop?category=Necklaces', sub: [
    { label: 'Vintage Afghan Necklaces', to: '/shop?category=Necklaces&collection=Afghani%20Tribal' },
    { label: 'Oxidised Necklaces', to: '/shop?category=Necklaces&collection=Oxidised' },
    { label: 'Kazakh & Tibetan Neckpieces', to: '/shop?category=Necklaces&collection=Kazakh,Tibetan' },
    { label: 'Festive & Everyday', to: '/shop?category=Necklaces&collection=Festive,Everyday' },
  ] },
  { label: 'Rings', to: '/shop?category=Rings', sub: [
    { label: 'Turkish Finger Rings', to: '/shop?category=Rings&collection=Turkish' },
    { label: 'Tibetan Brass Rings', to: '/shop?category=Rings&collection=Tibetan' },
    { label: '925 Silver Nose Pins', to: '/shop?category=Nose%20Pins' },
  ] },
  { label: 'Bangles', to: '/shop?category=Bangles' },
  { label: 'Sets', to: '/shop?category=Sets' },
  { label: 'Shop All', to: '/shop' },
];

function SearchBox({ mobile = false }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const ref = useRef(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 200); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
  }, []);
  const { data, isFetching } = useQuery({
    queryKey: ['suggest', debounced], enabled: debounced.length >= 2,
    queryFn: () => api(`/products${qs({ q: debounced, limit: 5 })}`), staleTime: 60e3,
  });
  const submit = (e) => { e.preventDefault(); setOpen(false); nav(`/shop${qs({ q: q.trim() })}`); };
  return (
    <form onSubmit={submit} ref={ref} className="relative w-full" role="search">
      <i className={`fa-solid ${isFetching ? 'fa-circle-notch fa-spin' : 'fa-magnifying-glass'} absolute left-0 top-1/2 -translate-y-1/2 text-[13px] text-chatim-ink/60`} />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder={mobile ? 'Search jhumkas, chokers, silver…' : 'Search the collection'}
        aria-label="Search products"
        className="w-full bg-transparent text-[13px] text-chatim-ink placeholder:text-chatim-ink/45 pl-6 pr-2 py-2 border-0 border-b border-chatim-line focus:border-chatim-ink outline-none transition-colors" />
      {open && debounced.length >= 2 && data && (
        <div className="absolute left-0 right-0 top-full mt-3 min-w-[320px] bg-chatim-paper rounded-2xl shadow-card border border-chatim-line p-2 z-50 animate-fadeIn">
          {data.items.length === 0 ? <p className="p-3 text-xs text-gray-500">No matches for “{debounced}”. Try “jhumka” or “silver”.</p> : (
            <>
              {data.items.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} onClick={() => { setOpen(false); setQ(''); }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-chatim-ivory">
                  <Img src={p.images[0]} alt="" className="w-11 h-11 rounded-lg object-cover bg-chatim-sand" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-chatim-ink truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-500">{p.category} · {p.price > 0 ? inr(p.price) : 'Price on request'}</p>
                  </div>
                </Link>
              ))}
              <button type="submit" className="w-full text-center text-[11px] uppercase tracking-[0.14em] text-chatim-clay py-2.5 hover:text-chatim-ink">View all {data.total} results</button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

const iconBtn = 'relative w-10 h-10 rounded-full flex items-center justify-center text-chatim-ink hover:text-chatim-clay transition-colors';
const Count = ({ n, bump }) => n > 0 && (
  <span className={`absolute top-1 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-chatim-clay text-chatim-paper text-[9.5px] font-semibold flex items-center justify-center transition-transform ${bump ? 'scale-125' : ''}`}>{n}</span>
);

function AccountMenu() {
  const { user } = useAuth();
  if (!user) return <Link to="/account" className={iconBtn} aria-label="Sign in"><i className="fa-regular fa-user text-[17px]" /></Link>;
  return (
    <div className="relative group">
      <Link to="/account" className={iconBtn} aria-label="My account">
        <span className="w-7 h-7 rounded-full bg-chatim-ink text-chatim-paper text-[10px] font-semibold flex items-center justify-center tracking-wide">{user.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}</span>
      </Link>
      <div className="hidden group-hover:block absolute right-0 top-full pt-2 z-50">
        <div className="w-52 bg-chatim-paper rounded-2xl shadow-card border border-chatim-line p-2 text-[13px]">
          <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">Hi, {user.name.split(' ')[0]}</p>
          <Link to="/account" className="block px-3 py-2 rounded-xl hover:bg-chatim-ivory">My Orders</Link>
          <Link to="/account?tab=profile" className="block px-3 py-2 rounded-xl hover:bg-chatim-ivory">Profile</Link>
          <Link to="/wishlist" className="block px-3 py-2 rounded-xl hover:bg-chatim-ivory">Wishlist</Link>
          {user.role === 'admin' && <Link to="/admin" className="block px-3 py-2 rounded-xl hover:bg-chatim-ivory text-chatim-clay"><i className="fa-solid fa-gauge mr-2" />Admin Dashboard</Link>}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlist((s) => s.ids.length);
  const { openCart, setMobileNav } = useUI();
  const loc = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => { if (!cartCount) return undefined; setBump(true); const t = setTimeout(() => setBump(false), 300); return () => clearTimeout(t); }, [cartCount]);
  const isActive = (to) => `${loc.pathname}${loc.search}` === to;

  return (
    <header className={`sticky top-0 z-40 bg-chatim-ivory/90 backdrop-blur-md border-b transition-[box-shadow,border-color] ${scrolled ? 'border-chatim-line shadow-[0_8px_24px_-20px_rgba(31,27,23,.4)]' : 'border-transparent'}`}>
      <div className="container-x">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 sm:h-20 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(true)} className={`${iconBtn} lg:hidden -ml-2`} aria-label="Open menu"><i className="fa-solid fa-bars-staggered text-lg" /></button>
            <div className="hidden md:block w-full max-w-[260px]"><SearchBox /></div>
          </div>
          <Logo />
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <Link to="/#boutique" className="hidden xl:flex items-center gap-1.5 mr-3 text-[11px] uppercase tracking-[0.14em] text-chatim-ink/70 hover:text-chatim-clay">
              <i className="fa-solid fa-location-dot text-chatim-clay" />Kolkata
            </Link>
            <AccountMenu />
            <Link to="/wishlist" className={iconBtn} aria-label={`Wishlist (${wishCount})`}>
              <i className="fa-regular fa-heart text-[17px]" /><Count n={wishCount} />
            </Link>
            <button onClick={openCart} className={iconBtn} aria-label={`Shopping bag (${cartCount} items)`}>
              <i className="fa-solid fa-bag-shopping text-[17px]" /><Count n={cartCount} bump={bump} />
            </button>
          </div>
        </div>
        <div className="md:hidden pb-3"><SearchBox mobile /></div>
      </div>

      <nav className="hidden lg:block" aria-label="Main">
        <ul className="container-x flex items-center justify-center gap-6 xl:gap-9 whitespace-nowrap text-[11px] uppercase tracking-[0.14em] xl:tracking-[0.16em] text-chatim-ink/80 h-11">
          {NAV.map((n) => (
            <li key={n.label} className="relative group">
              <NavLink to={n.to} className={`py-3 flex items-center gap-1.5 transition-colors hover:text-chatim-clay link-underline ${isActive(n.to) ? 'text-chatim-clay after:scale-x-100' : ''}`}>
                {n.dot && <span className="w-1.5 h-1.5 rounded-full bg-chatim-marigold" />}
                {n.label}
                {n.sub && <i className="fa-solid fa-chevron-down text-[8px] opacity-50" />}
              </NavLink>
              {n.sub && (
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full pt-1 z-50">
                  <div className="w-60 bg-chatim-paper rounded-2xl shadow-card border border-chatim-line p-2 normal-case tracking-normal">
                    {n.sub.map((s) => <Link key={s.label} to={s.to} className="block px-3 py-2 rounded-xl hover:bg-chatim-ivory hover:text-chatim-clay text-[13px]">{s.label}</Link>)}
                  </div>
                </div>
              )}
            </li>
          ))}
          <li>
            <a href="https://www.facebook.com/Chatimcollections/" target="_blank" rel="noopener noreferrer" className="py-3 flex items-center gap-1.5 text-chatim-clay hover:text-chatim-ink link-underline">
              <i className="fa-brands fa-facebook-f text-[10px]" /> Live Drops
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
