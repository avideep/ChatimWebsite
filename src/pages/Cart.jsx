import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, inr } from '../lib/api';
import { useCart } from '../store';
import { Breadcrumbs, EmptyState, Img, QtyStepper, Spinner } from '../components/ui';
import { CouponBox, useCartQuote } from '../components/Overlays';
import { ProductGrid } from '../components/ProductCard';

export function OrderSummary({ quote, loading, children, compact = false }) {
  return (
    <div className="card p-5 sm:p-6 space-y-3">
      <h3 className="font-serif text-lg font-medium">Order Summary {loading && <Spinner className="text-chatim-clay text-sm ml-1" />}</h3>
      {!compact && <CouponBox quote={quote} />}
      <div className="space-y-2 text-sm text-gray-600 pt-1">
        <div className="flex justify-between"><span>Total MRP</span><span>{inr(quote?.mrp)}</span></div>
        {quote?.mrp > quote?.subtotal && <div className="flex justify-between text-emerald-600"><span>Discount on MRP</span><span>−{inr(quote.mrp - quote.subtotal)}</span></div>}
        {quote?.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon ({quote.coupon?.code})</span><span>−{inr(quote.discount)}</span></div>}
        <div className="flex justify-between"><span>Shipping</span><span>{quote?.shipping ? inr(quote.shipping) : <span className="text-emerald-600 font-semibold">FREE</span>}</span></div>
        {quote?.giftWrap > 0 && <div className="flex justify-between"><span>Gift wrap</span><span>{inr(quote.giftWrap)}</span></div>}
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-pink-100 font-bold text-chatim-ink">
        <span>Total</span><span className="font-serif text-2xl">{inr(quote?.total)}</span>
      </div>
      {quote?.savings > 0 && <p className="text-xs text-emerald-600 font-medium text-center bg-emerald-50 rounded-xl py-2">🎉 You save {inr(quote.savings)} on this order</p>}
      {children}
      <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
        <span><i className="fa-solid fa-lock mr-1" />Secure checkout</span><span><i className="fa-solid fa-clock mr-1" />48-hour issue claims</span>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const nav = useNavigate();
  const { data: quote, isFetching } = useCartQuote();
  const recs = useQuery({ queryKey: ['products', 'popular4'], queryFn: () => api('/products?sort=popular&limit=4&inStock=1') });

  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shopping Bag' }]} />
        <h1 className="font-serif text-3xl sm:text-4xl font-medium mt-3 mb-6">Shopping Bag</h1>
        {items.length === 0 ? (
          <EmptyState icon="fa-solid fa-bag-shopping" title="Your bag is empty" text="Looks like you haven’t added anything yet. Explore our most loved designs." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} />
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div className="card divide-y divide-pink-100">
              {items.map((it) => {
                const issue = quote?.issues?.find((x) => x.productId === it.productId);
                return (
                  <div key={it.productId} className="p-4 sm:p-6 flex gap-4 sm:gap-6">
                    <Link to={`/product/${it.product.slug}`}><Img src={it.product.images?.[0]} alt={it.product.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover bg-pink-50" /></Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-3">
                        <div>
                          <Link to={`/product/${it.product.slug}`} className="font-medium text-chatim-ink hover:text-chatim-clayDark line-clamp-2">{it.product.name}</Link>
                          <p className="text-xs text-gray-400 mt-0.5">{it.product.material}</p>
                        </div>
                        <p className="font-bold whitespace-nowrap">{inr(it.product.price * it.quantity)}</p>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1 text-xs">
                        <span className="text-gray-700">{inr(it.product.price)} each</span>
                        {it.product.originalPrice > it.product.price && <span className="text-gray-400 line-through">{inr(it.product.originalPrice)}</span>}
                      </div>
                      {issue && <p className="text-xs text-red-500 mt-1"><i className="fa-solid fa-triangle-exclamation mr-1" />{issue.message}</p>}
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <QtyStepper small value={it.quantity} max={Math.min(10, it.product.stock || 10)} onChange={(q) => setQty(it.productId, q)} />
                        <button onClick={() => remove(it.productId)} className="text-xs text-gray-400 hover:text-red-500"><i className="fa-regular fa-trash-can mr-1" />Remove</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="lg:sticky lg:top-36">
              <OrderSummary quote={quote} loading={isFetching}>
                <button onClick={() => nav('/checkout')} className="btn-primary w-full py-3.5" disabled={!quote?.lines?.length}>Proceed to Checkout <i className="fa-solid fa-arrow-right text-xs" /></button>
                <Link to="/shop" className="block text-center text-xs font-semibold text-gray-600 hover:text-chatim-clayDark">Continue shopping</Link>
              </OrderSummary>
            </div>
          </div>
        )}
        <section className="mt-14">
          <h2 className="h-section mb-6">Bestsellers you might like</h2>
          <ProductGrid items={recs.data?.items || []} loading={recs.isLoading} count={4} />
        </section>
      </div>
    </div>
  );
}
