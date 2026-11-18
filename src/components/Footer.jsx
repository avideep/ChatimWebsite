import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUI, toast } from '../store';
import { Logo, Spinner } from './ui';

export function NewsletterForm({ dark = false }) {
  const [email, setEmail] = useState('');
  const m = useMutation({
    mutationFn: () => api('/newsletter', { method: 'POST', body: { email } }),
    onSuccess: (d) => { setEmail(''); toast(`Welcome to the Chatim Club! Use ${d.coupon} at checkout.`); },
    onError: (e) => toast(e.message, 'error'),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className={`flex items-center border-b ${dark ? 'border-chatim-paper/30 focus-within:border-chatim-paper' : 'border-chatim-ink/30 focus-within:border-chatim-ink'} transition-colors`}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address"
        className={`w-full bg-transparent py-3 text-sm outline-none ${dark ? 'text-chatim-paper placeholder:text-chatim-paper/40' : 'text-chatim-ink placeholder:text-chatim-ink/40'}`} />
      <button disabled={m.isPending} className={`shrink-0 text-[11px] uppercase tracking-[0.16em] pl-4 ${dark ? 'text-chatim-marigold hover:text-chatim-paper' : 'text-chatim-clay hover:text-chatim-ink'}`}>{m.isPending ? <Spinner /> : <>Subscribe <i className="fa-solid fa-arrow-right-long ml-1" /></>}</button>
    </form>
  );
}

const FLink = ({ to, children }) => <li><Link to={to} className="hover:text-chatim-marigold transition-colors">{children}</Link></li>;

export default function Footer() {
  const openInquiry = useUI((s) => s.openInquiry);
  return (
    <footer className="bg-chatim-ink text-chatim-paper/70">
      <div className="container-x pt-20 pb-10">
        <div className="grid lg:grid-cols-12 gap-14 pb-16 border-b border-chatim-paper/10">
          <div className="lg:col-span-5 space-y-6">
            <Logo light />
            <p className="font-serif text-2xl sm:text-[1.9rem] leading-snug text-chatim-paper max-w-md">Everyday elegance and Bengali heritage, hand-picked in Kolkata.</p>
            <div className="max-w-sm pt-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-chatim-marigold mb-1">Join the Chatim Club</p>
              <p className="text-xs text-chatim-paper/50 mb-2">Early access to festive drops and members-only codes.</p>
              <NewsletterForm dark />
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10 text-[13px]">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-chatim-paper mb-5">Shop</h4>
              <ul className="space-y-3">
                <FLink to="/shop?isNew=1&sort=newest">New in</FLink>
                <FLink to="/shop?collection=Afghani%20Tribal">Afghani Tribal</FLink>
                <FLink to="/shop?featured=1">Most loved</FLink>
                <FLink to="/shop?collection=Turkish">Turkish finger rings</FLink>
                <FLink to="/shop?category=Bangles">Bangles & cuffs</FLink>
                <FLink to="/shop?category=Sets">Jewellery sets</FLink>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-chatim-paper mb-5">Care</h4>
              <ul className="space-y-3">
                <FLink to="/track">Track your order</FLink>
                <FLink to="/account">My account</FLink>
                <FLink to="/help#shipping">Shipping & exchange</FLink>
                <FLink to="/help#care">Jewellery care</FLink>
                <FLink to="/help">FAQs</FLink>
                <FLink to="/terms">Terms & Conditions</FLink>
                <li><button onClick={() => openInquiry('Bulk / Corporate Gifting')} className="hover:text-chatim-marigold transition-colors">Bulk & bridal</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-chatim-paper mb-5">Visit</h4>
              <ul className="space-y-3">
                <li>Purbachal, Kolkata<br />West Bengal</li>
                <li>Mon – Sat · 11am – 8pm</li>
                <li><button onClick={() => openInquiry()} className="hover:text-chatim-marigold transition-colors">Book a video call</button></li>
              </ul>
              <div className="flex items-center gap-3 pt-6">
                <a href="https://www.facebook.com/Chatimcollections/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-chatim-paper/20 flex items-center justify-center hover:bg-chatim-paper hover:text-chatim-ink transition" aria-label="Facebook"><i className="fa-brands fa-facebook-f text-sm" /></a>
                <button onClick={() => openInquiry()} className="w-10 h-10 rounded-full border border-chatim-paper/20 flex items-center justify-center hover:bg-chatim-paper hover:text-chatim-ink transition" aria-label="WhatsApp us"><i className="fa-brands fa-whatsapp text-sm" /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-[0.14em] text-chatim-paper/40">
          <p>© {new Date().getFullYear()} Chatim Collections, Kolkata</p>
          <div className="flex items-center gap-4 text-base normal-case tracking-normal">
            <span className="text-[11px] uppercase tracking-[0.14em]">Secure payments</span>
            <i className="fa-brands fa-cc-visa" /><i className="fa-brands fa-cc-mastercard" /><i className="fa-brands fa-google-pay text-xl" /><i className="fa-solid fa-money-bill-wave text-sm" />
          </div>
        </div>
      </div>
    </footer>
  );
}
