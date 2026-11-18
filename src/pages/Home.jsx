import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUI } from '../store';
import { Img } from '../components/ui';
import { ProductGrid } from '../components/ProductCard';

const SLIDES = [
  { eyebrow: 'Handpicked in Kolkata', title: <>Timeless grace,<br /><em className="text-chatim-clay">artisanal soul.</em></>,
    text: 'Afghani tribal silver, Bengali oxidised heirlooms and fine 925 sterling — curated by two friends who believe jewellery should tell a story.',
    cta: { label: 'Explore the collection', to: '/shop' }, img: '/media/boutique.jpg', caption: 'At our Kolkata pop-up' },
  { eyebrow: 'The Afghani Tribal Edit', title: <>Pieces that<br /><em className="text-chatim-clay">chime as you move.</em></>,
    text: 'Hand-hammered medallions, ghungroo tassels and coloured glass — statement silver for Pujo evenings and everyday drama.',
    cta: { label: 'Shop Afghani Tribal', to: '/shop?collection=Afghani%20Tribal' }, img: '/media/p2.jpg', caption: 'Ghungroo Tassel Necklace' },
  { eyebrow: 'Turkish Finger Rings', title: <>For fingers that like<br /><em className="text-chatim-clay">a little drama.</em></>,
    text: 'Sculpted blooms, faces, feathers and theatre masks — statement finger rings straight from our Instagram drops. Message us for prices.',
    cta: { label: 'Shop finger rings', to: '/shop?category=Rings&collection=Turkish' }, img: '/media/products/big-bloom-flower-finger-ring-1.jpg', caption: 'Big Bloom Flower Finger Ring' },
];

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return undefined; const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6500); return () => clearInterval(t); }, [paused]);
  const s = SLIDES[i];
  return (
    <section className="relative overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      <div className="container-x grid lg:grid-cols-12 gap-10 lg:gap-6 items-center pt-8 pb-14 sm:pt-12 lg:pt-14 lg:pb-20">
        <div key={`t${i}`} className="lg:col-span-6 xl:col-span-5 order-2 lg:order-1 text-center lg:text-left animate-slideUp">
          <p className="eyebrow flex items-center justify-center lg:justify-start gap-3"><span className="hidden lg:block w-10 h-px bg-chatim-clay" />{s.eyebrow}</p>
          <h1 className="font-serif font-medium text-chatim-ink text-[2.9rem] sm:text-6xl xl:text-[5.2rem] leading-[0.98] mt-5">{s.title}</h1>
          <p className="text-[15px] text-chatim-muted max-w-md mx-auto lg:mx-0 mt-6 leading-relaxed">{s.text}</p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-7 gap-y-4 mt-9">
            <Link to={s.cta.to} className="btn-primary">{s.cta.label}</Link>
            <a href="https://www.facebook.com/Chatimcollections/" target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-[0.16em] text-chatim-ink link-underline">Follow new drops</a>
          </div>
          <div className="flex items-center justify-center lg:justify-start gap-4 mt-12">
            <span className="font-serif text-lg text-chatim-ink">0{i + 1}</span>
            <div className="flex gap-1.5">
              {SLIDES.map((_, k) => (
                <button key={k} onClick={() => setI(k)} className="h-6 flex items-center" aria-label={`Go to slide ${k + 1}`} aria-current={k === i}>
                  <span className={`block h-px transition-all duration-500 ${k === i ? 'w-14 bg-chatim-ink' : 'w-6 bg-chatim-ink/25 hover:bg-chatim-ink/50'}`} />
                </button>
              ))}
            </div>
            <span className="font-serif text-lg text-chatim-ink/40">0{SLIDES.length}</span>
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-7 order-1 lg:order-2 relative flex justify-center lg:justify-end">
          {/* logo-inspired sun + blush stroke */}
          <div className="absolute top-2 left-[8%] sm:left-[14%] lg:left-[10%] w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-chatim-marigold animate-floaty" aria-hidden />
          <div className="absolute bottom-10 right-[2%] lg:right-[-2%] w-40 h-16 sm:w-56 sm:h-20 rounded-full bg-chatim-blush/60 -rotate-12" aria-hidden />
          <div key={`i${i}`} className="relative w-[78%] sm:w-[60%] lg:w-[78%] xl:w-[66%] aspect-[4/5] arch overflow-hidden bg-chatim-sand animate-fadeIn">
            <Img src={s.img} alt={s.caption} className="w-full h-full object-cover" />
          </div>
          <p className="absolute -bottom-2 right-[12%] lg:right-[6%] bg-chatim-paper px-4 py-2 rounded-full text-[10.5px] uppercase tracking-[0.16em] text-chatim-ink shadow-soft">{s.caption}</p>
        </div>
      </div>
    </section>
  );
}

const CATS = [
  { label: 'Afghani Tribal', to: '/shop?collection=Afghani%20Tribal', img: '/media/p6.jpg' },
  { label: 'Earrings', to: '/shop?category=Earrings', img: '/media/products/peacock-long-bead-chain-jhumkas-1.jpg' },
  { label: 'Necklaces', to: '/shop?category=Necklaces', img: '/media/p0.jpg' },
  { label: 'Rings', to: '/shop?category=Rings', img: '/media/products/tibetan-red-green-inlay-oval-ring-1.jpg' },
  { label: 'Bangles', to: '/shop?category=Bangles', img: '/media/p7.jpg' },
  { label: 'Sets', to: '/shop?category=Sets', img: '/media/products/dual-tone-bead-fringe-collar-earrings-on-red-thread-1.jpg' },
];

const PERKS = ['Complimentary shipping over ₹999', '48-hour issue claims', 'Cash on delivery', 'Gift-ready keepsake box', 'Skin-safe & anti-tarnish'];

// Newest first – from @chatim_collections, optimised into /media/reels (video + poster frame).
const REELS = [
  ['vintage-afghan-handcuffs', 'Vintage Afghan handcuffs'],
  ['kazakh-earrings', 'Kazakh earrings'],
  ['vintage-afghan-pendants', 'Vintage Afghan pendants'],
  ['diwali-series-earrings', 'Diwali series earrings'],
  ['turkman-pendants', 'Turkman pendants'],
  ['dipaboli-afghan-earrings', 'Dipaboli collection earrings'],
  ['afghan-triangle-earrings', 'Afghan earrings'],
  ['kojagori-pendants', 'Kojagori Lakshmi Puja pendants'],
  ['pujor-goyna-earrings', 'Pujor Goyna earrings'],
  ['minimalist-pujo-earrings', 'Minimalist Pujo earrings'],
].map(([slug, title]) => ({ src: `/media/reels/${slug}.mp4`, poster: `/media/reels/${slug}.jpg`, title }));

function Reel({ src, poster, title }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } };
  return (
    <div className="relative shrink-0 w-44 sm:w-auto aspect-[9/16] rounded-2xl overflow-hidden bg-chatim-ink cursor-pointer" onClick={toggle}
      onMouseEnter={() => { ref.current?.play(); setPlaying(true); }} onMouseLeave={() => { ref.current?.pause(); setPlaying(false); }}>
      <video ref={ref} src={poster ? src : `${src}#t=0.5`} poster={poster} muted loop playsInline preload="metadata" className="w-full h-full object-cover" aria-label={`${title} – Chatim Collections jewellery reel`} />
      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-t from-chatim-ink/40 to-transparent transition-opacity duration-500 ${playing ? 'opacity-0' : 'opacity-100'}`}>
        <span className="w-12 h-12 rounded-full border border-chatim-paper/80 text-chatim-paper flex items-center justify-center backdrop-blur-sm"><i className="fa-solid fa-play text-xs ml-0.5" /></span>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, link, center = false }) {
  return (
    <div className={`flex ${center ? 'flex-col items-center text-center' : 'items-end justify-between'} gap-4 mb-10 sm:mb-12`}>
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className="h-section mt-3">{title}</h2></div>
      {link && <Link to={link.to} className="text-[11px] uppercase tracking-[0.16em] text-chatim-ink link-underline shrink-0">{link.label}</Link>}
    </div>
  );
}

export default function Home() {
  const openInquiry = useUI((s) => s.openInquiry);
  const featured = useQuery({ queryKey: ['products', 'featured'], queryFn: () => api('/products?featured=1&limit=8&sort=featured') });
  const fresh = useQuery({ queryKey: ['products', 'new'], queryFn: () => api('/products?sort=newest&limit=4') });
  const testimonials = useQuery({ queryKey: ['testimonials'], queryFn: () => api('/testimonials') });

  return (
    <>
      <Hero />

      {/* perks ribbon */}
      <div className="border-y border-chatim-line overflow-hidden">
        <div className="container-x flex items-center justify-between gap-8 py-4 overflow-x-auto no-scrollbar text-[10.5px] uppercase tracking-[0.18em] text-chatim-ink/70 whitespace-nowrap">
          {PERKS.map((p, k) => <span key={p} className="flex items-center gap-8">{k > 0 && <span className="w-1 h-1 rounded-full bg-chatim-marigold" />}{p}</span>)}
        </div>
      </div>

      {/* categories */}
      <section className="py-20 sm:py-24">
        <div className="container-x">
          <SectionHead eyebrow="Explore" title="Shop by category" link={{ label: 'View all', to: '/shop' }} />
          <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
            {CATS.map((c) => (
              <Link key={c.label} to={c.to} className="group shrink-0 w-36 sm:w-auto text-center">
                <div className="aspect-[3/4] arch overflow-hidden bg-chatim-sand">
                  <Img src={c.img} alt={c.label} className="w-full h-full object-cover !transition-all !duration-700 group-hover:scale-105" />
                </div>
                <span className="block mt-4 font-serif text-xl text-chatim-ink group-hover:text-chatim-clay transition-colors">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* reels */}
      <section className="py-14 sm:py-16 border-t border-chatim-line">
        <div className="container-x">
          <SectionHead eyebrow="As seen on our live drops" title="Chatim in motion" link={{ label: 'Follow on Facebook', to: '/shop?collection=Afghani%20Tribal' }} />
          <div className="flex sm:grid sm:grid-cols-5 gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
            {REELS.map((r) => <Reel key={r.src} {...r} />)}
          </div>
        </div>
      </section>

      {/* gifting */}
      <section className="py-20 sm:py-28">
        <div className="container-x">
          <SectionHead center eyebrow="Gifting, made effortless" title="Find something for everyone" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { to: '/shop?collection=Everyday', k: 'Everyday', t: 'Daily wear', bg: 'bg-chatim-paper' },
              { to: '/shop?collection=Afghani%20Tribal', k: 'Statement', t: 'Vintage Afghan', bg: 'bg-chatim-marigoldLight' },
              { to: '/shop?collection=Festive', k: 'Celebrations', t: 'Festive & Pujo', bg: 'bg-chatim-blush/35' },
              { to: '/shop?collection=Turkish,Tibetan', k: 'Finger rings', t: 'Turkish & Tibetan', bg: 'bg-chatim-sand' },
            ].map((x) => (
              <Link key={x.t} to={x.to} className={`group ${x.bg} border border-chatim-line rounded-2xl p-6 sm:p-8 min-h-[190px] flex flex-col justify-between hover:border-chatim-ink transition-colors`}>
                <span className="text-[10.5px] uppercase tracking-[0.18em] text-chatim-muted">{x.k}</span>
                <div>
                  <h3 className="font-serif text-[1.9rem] sm:text-4xl font-medium text-chatim-ink leading-none">{x.t}</h3>
                  <span className="inline-flex items-center gap-2 mt-4 text-[11px] uppercase tracking-[0.16em] text-chatim-clay">Shop <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* most loved */}
      <section className="pb-20 sm:pb-28">
        <div className="container-x">
          <SectionHead eyebrow="Most loved on Instagram" title="Our most loved pieces" link={{ label: 'Shop all', to: '/shop' }} />
          <ProductGrid items={featured.data?.items || []} loading={featured.isLoading} />
        </div>
      </section>

      {/* new in */}
      <section className="pb-20 sm:pb-28">
        <div className="container-x">
          <SectionHead eyebrow="Just landed" title="New in" link={{ label: 'See what’s new', to: '/shop?isNew=1&sort=newest' }} />
          <ProductGrid items={fresh.data?.items || []} loading={fresh.isLoading} count={4} />
        </div>
      </section>

      {/* editorial banner */}
      <section className="bg-chatim-peach/70">
        <div className="container-x grid lg:grid-cols-2 items-center gap-10 lg:gap-20 py-16 sm:py-24">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-chatim-marigold" aria-hidden />
            <div className="relative grid grid-cols-5 gap-4">
              <div className="col-span-3 aspect-[3/4] rounded-2xl overflow-hidden bg-chatim-sand"><Img src="/media/p4.jpg" alt="Afghani coin bib necklace" className="w-full h-full object-cover" /></div>
              <div className="col-span-2 flex flex-col gap-4 pt-12">
                <div className="aspect-[3/4] arch overflow-hidden bg-chatim-sand"><Img src="/media/p5.jpg" alt="Kuchi mirror-stone pendant" className="w-full h-full object-cover" /></div>
                <div className="aspect-square rounded-2xl overflow-hidden bg-chatim-sand"><Img src="/media/p3.jpg" alt="Banjara thread choker" className="w-full h-full object-cover" /></div>
              </div>
            </div>
          </div>
          <div className="text-center lg:text-left">
            <p className="eyebrow">The edit</p>
            <h2 className="font-serif text-4xl sm:text-[3.4rem] leading-[1.02] font-medium mt-4">Afghani tribal silver,<br /><em className="text-chatim-clay">worn your way.</em></h2>
            <p className="text-[15px] text-chatim-muted mt-6 max-w-md mx-auto lg:mx-0 leading-relaxed">Hammered coins, Kuchi medallions and coloured glass, gathered piece by piece. Each one is slightly different — that is the point.</p>
            <Link to="/shop?collection=Afghani%20Tribal" className="btn-primary mt-9">Discover the edit</Link>
          </div>
        </div>
      </section>

      {/* story */}
      <section id="boutique" className="bg-chatim-ink text-chatim-paper scroll-mt-24 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-chatim-marigold/90" aria-hidden />
        <div className="container-x relative grid lg:grid-cols-12 gap-12 items-center py-20 sm:py-28">
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] arch overflow-hidden bg-chatim-ink"><Img src="/media/p7.jpg" alt="Tribal cuffs at a Chatim Collections pop-up in Kolkata" className="w-full h-full object-cover" /></div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="text-[11px] uppercase tracking-luxe text-chatim-marigold">Our story · Purbachal, Kolkata</p>
            <h2 className="font-serif text-4xl sm:text-[3.4rem] leading-[1.04] font-medium mt-5">Named for the blossom that announces <em className="text-chatim-blush">Pujo.</em></h2>
            <p className="text-[15px] text-chatim-paper/70 mt-7 leading-relaxed max-w-xl">
              The <span className="text-chatim-paper">Chatim</span> flower scents Bengal’s autumn just before the festivities begin. Our collection carries the same spirit — Afghani tribal silver, German-silver oxidised pieces and fine 925 sterling, hand-picked in Kolkata and shipped with love across India.
            </p>
            <dl className="grid grid-cols-2 xl:grid-cols-4 gap-6 mt-10 pt-10 border-t border-chatim-paper/15">
              {[['Hand-picked', 'Artisan designs'], ['Featherlight', 'All-day comfort'], ['Gift-ready', 'Keepsake box'], ['Personal', 'Styling help']].map(([t, d]) => (
                <div key={t}><dt className="font-serif text-xl">{t}</dt><dd className="text-[11px] uppercase tracking-[0.14em] text-chatim-paper/50 mt-1">{d}</dd></div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-4 mt-10">
              <button onClick={() => openInquiry()} className="btn px-7 py-3.5 bg-chatim-paper text-chatim-ink hover:bg-chatim-marigold">Book a video call</button>
              <a href="https://www.facebook.com/Chatimcollections/" target="_blank" rel="noopener noreferrer" className="btn px-7 py-3.5 border border-chatim-paper/40 text-chatim-paper hover:bg-chatim-paper hover:text-chatim-ink"><i className="fa-brands fa-facebook-f" /> Facebook</a>
            </div>
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="py-20 sm:py-28">
        <div className="container-x">
          <SectionHead center eyebrow="Kind words" title="Loved across India" />
          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {(testimonials.data || []).slice(0, 3).map((t) => (
              <figure key={t.author} className="text-center px-2">
                <div className="flex justify-center gap-1 text-chatim-marigold text-[11px]">{Array.from({ length: t.rating }, (_, k) => <i key={k} className="fa-solid fa-star" />)}</div>
                <blockquote className="font-serif text-[1.4rem] leading-snug text-chatim-ink mt-5 italic">“{t.body}”</blockquote>
                <figcaption className="mt-6 text-[11px] uppercase tracking-[0.16em] text-chatim-muted">
                  {t.author} <span className="mx-1.5 text-chatim-clay">·</span> {t.location}
                  <Link to={`/product/${t.slug}`} className="block normal-case tracking-normal text-[12px] text-chatim-clay mt-1.5 hover:text-chatim-ink">on {t.product}</Link>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
