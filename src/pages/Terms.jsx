const SECTIONS = [
  {
    title: '1. Order Acceptance & Processing',
    points: [
      'All orders are subject to stock availability and our acceptance.',
      'Standard processing time is 5–7 business days. Custom or personalised orders may require additional time, which we will communicate at order confirmation.',
    ],
  },
  {
    title: '2. Pricing & Payment',
    points: [
      'Full payment is required before dispatch, except for the part-payment option described below.',
      'Part payment is available only on orders totalling ₹1,500 or more. Chatim will set the payment schedule (number of instalments and deadlines) based on the total order value.',
      'If you request a specific payment date, you must remit the full amount by that date. Failure to settle payment by the agreed date will result in automatic order cancellation.',
      'Orders cancelled due to non-payment are final. No refunds or credit notes will be issued in these circumstances.',
    ],
  },
  {
    title: '3. Item Reservation & Customer Responsiveness',
    points: [
      'We will reserve an item upon your request and payment commitment.',
      'If you are unresponsive for one whole day or more after requesting a reservation, we reserve the right to release the item for sale and decline future orders for the same item.',
    ],
  },
  {
    title: '4. Custom or Personalised Orders',
    points: [
      'Custom and made-to-order items are non-cancellable and non-refundable once the design is confirmed.',
    ],
  },
  {
    title: '5. Shipping & Delivery',
    points: [
      'We ship via third-party courier services and will share tracking information upon dispatch.',
      'Chatim is not liable for delays, loss, or damage once the parcel leaves our facility. Claims for transit issues must be filed directly with the courier.',
    ],
  },
  {
    title: '6. Returns, Exchanges & Damaged Goods',
    points: [
      'Returns and exchanges are accepted only if the product is defective or incorrect.',
      'Any claim must be submitted within 48 hours of delivery, accompanied by clear photographs and an unboxing video.',
      'Without an unboxing video, we will be unable to process refunds or compensation for damaged items.',
    ],
  },
  {
    title: '7. Product Variations',
    points: [
      'As many of our pieces are handcrafted or curated, slight variations in colour, texture, finish, or dimensions may occur and do not constitute defects.',
    ],
  },
  {
    title: '8. Product Care',
    points: [
      'Customers are responsible for following any care instructions provided. Chatim will not be liable for damage resulting from improper handling or exposure to chemicals, moisture, or impact.',
    ],
  },
  {
    title: '9. Pricing Policy',
    points: [
      'We maintain fixed, non-negotiable pricing. Bargaining or haggling is not permitted.',
    ],
  },
  {
    title: '10. Intellectual Property',
    points: [
      'All designs, images, text, logos, and other brand assets are the sole property of Chatim. Unauthorised use, reproduction, or distribution is prohibited.',
    ],
  },
  {
    title: '11. Amendments',
    points: [
      'We reserve the right to modify these terms at any time. Changes will be effective upon posting on our website or notifying you via email or WhatsApp. Continued use of our services after a modification constitutes acceptance of the updated terms.',
    ],
  },
];

export default function Terms() {
  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-10 sm:py-14 max-w-3xl">
        <header className="text-center mb-10">
          <span className="eyebrow">Chatim Collections</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium mt-1">Terms & Conditions</h1>
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">
            By placing an order with Chatim (“we,” “us,” or “our”), you (“Customer”) agree to be bound by these terms and conditions.
          </p>
        </header>
        <div className="card divide-y divide-pink-100">
          {SECTIONS.map((section) => (
            <section key={section.title} className="p-5 sm:p-6">
              <h2 className="font-serif text-xl font-medium text-chatim-ink">{section.title}</h2>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-600 leading-relaxed">
                {section.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
