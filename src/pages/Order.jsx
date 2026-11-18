import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fmtDate, fmtDateTime, inr, ORDER_FLOW, PAYMENT_LABEL } from '../lib/api';
import { useAuth, toast } from '../store';
import { Badge, EmptyState, Img, Spinner } from '../components/ui';

const STEP_META = {
  placed: ['fa-receipt', 'Order placed'], confirmed: ['fa-circle-check', 'Confirmed'], packed: ['fa-box', 'Packed'],
  shipped: ['fa-truck-fast', 'Shipped'], delivered: ['fa-house-chimney', 'Delivered'], cancelled: ['fa-ban', 'Cancelled'],
};

export function OrderTimeline({ order }) {
  if (order.status === 'cancelled') {
    return <div className="p-4 rounded-2xl bg-gray-50 text-sm text-gray-600"><i className="fa-solid fa-ban mr-2" />This order was cancelled{order.paymentStatus === 'refunded' ? ' and your payment has been refunded.' : '.'}</div>;
  }
  const idx = ORDER_FLOW.indexOf(order.status);
  return (
    <ol className="grid grid-cols-5 relative">
      <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-pink-100 rounded-full" />
      <div className="absolute top-5 left-[10%] h-1 bg-chatim-clay rounded-full transition-all duration-700" style={{ width: `${(idx / (ORDER_FLOW.length - 1)) * 80}%` }} />
      {ORDER_FLOW.map((s, i) => {
        const ev = order.events.find((e) => e.status === s);
        const done = i <= idx;
        return (
          <li key={s} className="relative flex flex-col items-center text-center z-10">
            <span className={`w-11 h-11 rounded-full flex items-center justify-center text-sm border-4 border-white shadow ${done ? 'bg-chatim-ink text-chatim-paper' : 'bg-pink-50 text-chatim-marigold'}`}><i className={`fa-solid ${STEP_META[s][0]}`} /></span>
            <span className={`text-[11px] sm:text-xs font-semibold mt-2 ${done ? 'text-chatim-ink' : 'text-gray-400'}`}>{STEP_META[s][1]}</span>
            {ev && <span className="text-[10px] text-gray-400 hidden sm:block">{fmtDateTime(ev.createdAt)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetail({ order, onCancel, cancelling }) {
  const a = order.address;
  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-xs text-gray-500">Order</p>
            <p className="font-serif text-xl font-medium">#{order.orderNumber}</p>
            <p className="text-xs text-gray-500 mt-1">Placed on {fmtDate(order.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-2"><Badge status={order.status} /><Badge status={order.paymentStatus}>{order.paymentStatus === 'pending' ? 'Payment due' : order.paymentStatus}</Badge></div>
        </div>
        <OrderTimeline order={order} />
        {order.status === 'shipped' && <p className="mt-5 text-xs text-center text-gray-500">Expected delivery by <b>{new Date(Date.now() + 2 * 864e5).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</b></p>}
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="card divide-y divide-pink-100">
          {order.items.map((it, i) => (
            <div key={i} className="p-4 sm:p-5 flex gap-4 items-center">
              <Img src={it.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-pink-50" />
              <div className="flex-1 min-w-0">
                {it.slug ? <Link to={`/product/${it.slug}`} className="text-sm font-medium hover:text-chatim-clayDark line-clamp-2">{it.name}</Link> : <p className="text-sm font-medium">{it.name}</p>}
                <p className="text-xs text-gray-500">Qty {it.quantity} × {inr(it.price)}</p>
              </div>
              <p className="font-semibold text-sm">{inr(it.price * it.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="card p-5 text-sm space-y-2">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon {order.couponCode}</span><span>−{inr(order.discount)}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Shipping ({order.shippingMethod})</span><span>{order.shipping ? inr(order.shipping) : 'FREE'}</span></div>
            {order.giftWrap > 0 && <div className="flex justify-between text-gray-600"><span>Gift wrap</span><span>{inr(order.giftWrap)}</span></div>}
            <div className="flex justify-between font-bold pt-2 border-t border-pink-100"><span>Total</span><span className="font-serif text-lg">{inr(order.total)}</span></div>
            <p className="text-xs text-gray-500 pt-1"><i className="fa-solid fa-wallet mr-1.5" />Paid via {PAYMENT_LABEL[order.paymentMethod]}</p>
          </div>
          <div className="card p-5 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-chatim-ink mb-2">Delivering to</p>
            <p className="font-semibold">{order.name}</p>
            <p className="text-gray-600 text-xs leading-relaxed mt-1">{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} – {a.pincode}<br />{order.phone}</p>
            {order.notes && <p className="text-xs text-gray-500 mt-3 italic">Note: {order.notes}</p>}
          </div>
          {onCancel && ['placed', 'confirmed'].includes(order.status) && (
            <button onClick={onCancel} disabled={cancelling} className="w-full text-xs font-semibold text-gray-500 hover:text-red-500 py-2">{cancelling ? <Spinner /> : 'Cancel this order'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const { orderNumber } = useParams();
  const [sp] = useSearchParams();
  const placed = sp.get('placed') === '1';
  const { user } = useAuth();
  const qc = useQueryClient();
  const email = sessionStorage.getItem(`order-email-${orderNumber}`) || sp.get('email') || '';
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderNumber, user?.id], queryFn: () => api(`/orders/${orderNumber}${email ? `?email=${encodeURIComponent(email)}` : ''}`),
  });
  const cancel = useMutation({
    mutationFn: () => api(`/orders/${orderNumber}/cancel`, { method: 'POST' }),
    onSuccess: (o) => { qc.setQueryData(['order', orderNumber, user?.id], o); qc.invalidateQueries({ queryKey: ['orders'] }); toast('Your order has been cancelled'); },
    onError: (e) => toast(e.message, 'error'),
  });

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center"><Spinner className="text-chatim-clay text-2xl" /></div>;
  if (error) return <div className="container-x py-16"><EmptyState icon="fa-solid fa-magnifying-glass" title="Order not found" text="Sign in with the account you ordered from, or track it with your order number and email." action={<Link to="/track" className="btn-primary">Track an order</Link>} /></div>;

  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-8 sm:py-12 max-w-5xl">
        {placed && (
          <div className="text-center mb-10 animate-slideUp">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner"><i className="fa-solid fa-circle-check" /></div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium">Thank you, {order.name.split(' ')[0]}!</h1>
            <p className="text-gray-600 mt-2">Your order <b>#{order.orderNumber}</b> is confirmed. We’ve sent the details to <b>{order.email}</b>.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link to="/shop" className="btn-primary">Continue shopping</Link>
              {!user && <Link to="/account" className="btn-outline">Create an account to track orders</Link>}
            </div>
          </div>
        )}
        {!placed && <h1 className="font-serif text-3xl font-medium mb-6">Order details</h1>}
        <OrderDetail order={order} onCancel={user ? () => window.confirm('Cancel this order?') && cancel.mutate() : null} cancelling={cancel.isPending} />
      </div>
    </div>
  );
}
