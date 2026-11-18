import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUI } from '../store';

const FAQ = [
  { id: 'shipping', q: 'How long does delivery take?', a: 'Standard processing takes 5–7 business days. After dispatch, standard delivery takes 4–6 working days across India and is free above ₹999. Custom or personalised orders may need additional time, which we will communicate at order confirmation.' },
  { q: 'Do you offer Cash on Delivery?', a: 'Yes! COD is available on all orders across India at no extra charge.' },
  { q: 'What is your exchange policy?', a: 'Returns and exchanges are accepted only for defective or incorrect products. Submit a claim within 48 hours of delivery with clear photos and an unboxing video. See our Terms & Conditions for the full policy.' },
  { id: 'care', q: 'How do I care for oxidised and silver jewellery?', a: 'Store each piece in the zip pouch provided, away from moisture and air. Put jewellery on last – after perfume, lotion and hairspray. Wipe with a soft dry cloth after each wear. For 925 silver, a silver polishing cloth restores shine in seconds.' },
  { q: 'Is the jewellery skin-safe?', a: 'All our pieces are nickel and lead free. Our 925 sterling silver and anti-tarnish steel pieces are hypoallergenic and suitable for sensitive skin.' },
  { q: 'Can I personalise a piece?', a: 'Yes – our Initial Pendant can be personalised. Mention your letter in the order notes at checkout. For custom bridal or bulk orders, book a styling call.' },
  { q: 'Do you have a physical store?', a: 'Our boutique is in Purbachal, Kolkata. Visits are by appointment so we can give you our full attention – book via the styling form.' },
];

export default function Help() {
  const [open, setOpen] = useState(() => {
    const h = window.location.hash.slice(1); const i = FAQ.findIndex((f) => f.id === h); return i >= 0 ? i : 0;
  });
  const openInquiry = useUI((s) => s.openInquiry);
  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-10 sm:py-14 max-w-3xl">
        <div className="text-center mb-10">
          <span className="eyebrow">Help Centre</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium mt-1">Frequently asked questions</h1>
        </div>
        <div className="card divide-y divide-pink-100">
          {FAQ.map((f, i) => (
            <div key={f.q} id={f.id} className="scroll-mt-32">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left font-semibold text-chatim-ink" aria-expanded={open === i}>
                {f.q}<i className={`fa-solid fa-plus text-chatim-clay transition-transform ${open === i ? 'rotate-45' : ''}`} />
              </button>
              {open === i && <p className="px-5 sm:px-6 pb-6 -mt-2 text-sm text-gray-600 leading-relaxed animate-fadeIn">{f.a}{f.q === 'What is your exchange policy?' && <> <Link to="/terms" className="text-chatim-clayDark underline underline-offset-2">Read Terms & Conditions.</Link></>}</p>}
            </div>
          ))}
        </div>
        <div className="text-center mt-10 card p-8">
          <p className="font-serif text-xl font-medium">Still need help?</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Our team replies within one working day.</p>
          <button onClick={() => openInquiry('Order Support')} className="btn-primary"><i className="fa-regular fa-comments" /> Contact us</button>
        </div>
      </div>
    </div>
  );
}
