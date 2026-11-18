import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fmtDateTime, inr, ORDER_FLOW, PAYMENT_LABEL } from '../../lib/api';
import { toast } from '../../store';
import { Badge, Img, Spinner } from '../../components/ui';
import { PageHead } from './AdminApp';

const TABS = ['all', ...ORDER_FLOW, 'cancelled'];

function OrderPanel({ order, onClose }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const m = useMutation({
    mutationFn: (body) => api(`/admin/orders/${order.orderNumber}`, { method: 'PATCH', body }),
    onSuccess: () => { toast('Order updated'); setNote(''); qc.invalidateQueries({ queryKey: ['admin'] }); },
    onError: (e) => toast(e.message, 'error'),
  });
  const idx = ORDER_FLOW.indexOf(order.status);
  const next = idx >= 0 && idx < ORDER_FLOW.length - 1 ? ORDER_FLOW[idx + 1] : null;
  const a = order.address;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/30 animate-fadeIn" />
      <aside className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-chatim-paper shadow-card overflow-y-auto animate-slideUp">
        <div className="sticky top-0 bg-chatim-paper border-b border-pink-100 px-6 py-4 flex items-center justify-between">
          <div><p className="font-serif text-xl font-medium">#{order.orderNumber}</p><p className="text-xs text-gray-500">{fmtDateTime(order.createdAt)}</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100" aria-label="Close"><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex gap-2"><Badge status={order.status} /><Badge status={order.paymentStatus} /><span className="chip bg-gray-100 text-gray-600">{PAYMENT_LABEL[order.paymentMethod]}</span></div>

          {order.status !== 'cancelled' && (
            <div className="p-4 rounded-2xl bg-chatim-ivory space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Update fulfilment</p>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="input !py-2 text-xs" placeholder="Note for timeline (e.g., AWB / courier) – optional" />
              <div className="flex flex-wrap gap-2">
                {next && <button disabled={m.isPending} onClick={() => m.mutate({ status: next, note })} className="btn-primary !py-2 !px-4 text-xs capitalize">{m.isPending ? <Spinner /> : <>Mark as {next} <i className="fa-solid fa-arrow-right" /></>}</button>}
                <select value={order.status} onChange={(e) => m.mutate({ status: e.target.value, note })} className="input !w-auto !py-2 text-xs capitalize">
                  {[...ORDER_FLOW, 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {order.paymentStatus === 'pending' && <button onClick={() => m.mutate({ paymentStatus: 'paid' })} className="btn-outline !py-2 !px-4 text-xs">Mark paid</button>}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Items</p>
            <div className="space-y-3">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3"><Img src={it.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-pink-50" /><div className="flex-1 min-w-0"><p className="text-sm truncate">{it.name}</p><p className="text-xs text-gray-500">{it.quantity} × {inr(it.price)}</p></div><span className="text-sm font-semibold">{inr(it.quantity * it.price)}</span></div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-pink-100 text-sm space-y-1">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon {order.couponCode}</span><span>−{inr(order.discount)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Shipping ({order.shippingMethod})</span><span>{inr(order.shipping)}</span></div>
              {order.giftWrap > 0 && <div className="flex justify-between text-gray-600"><span>Gift wrap</span><span>{inr(order.giftWrap)}</span></div>}
              <div className="flex justify-between font-bold pt-1"><span>Total</span><span>{inr(order.total)}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Customer</p><p className="font-medium">{order.name}</p><p className="text-xs text-gray-500 break-all">{order.email}</p><p className="text-xs text-gray-500">{order.phone}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Ship to</p><p className="text-xs text-gray-600 leading-relaxed">{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}</p></div>
          </div>
          {order.notes && <p className="text-xs p-3 rounded-xl bg-amber-50 text-amber-800"><i className="fa-regular fa-note-sticky mr-1.5" />{order.notes}</p>}

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Timeline</p>
            <ol className="border-l-2 border-pink-100 ml-2 space-y-4">
              {order.events.map((e, i) => (
                <li key={i} className="pl-4 relative"><span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-chatim-clay" /><p className="text-sm font-medium capitalize">{e.status}</p><p className="text-[11px] text-gray-400">{fmtDateTime(e.createdAt)}</p>{e.note && <p className="text-xs text-gray-600 mt-0.5">{e.note}</p>}</li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Orders() {
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState(sp.get('q') || '');
  const [debounced, setDebounced] = useState(q);
  const [selected, setSelected] = useState(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'orders', status, debounced], queryFn: () => api(`/admin/orders?status=${status}&q=${encodeURIComponent(debounced)}`) });
  const current = selected && data?.find((o) => o.orderNumber === selected);
  useEffect(() => { if (sp.get('q') && data?.length === 1) { setSelected(data[0].orderNumber); setSp({}); } }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    const rows = [['Order', 'Date', 'Customer', 'Email', 'Phone', 'City', 'Items', 'Total', 'Payment', 'Payment status', 'Status']];
    (data || []).forEach((o) => rows.push([o.orderNumber, o.createdAt, o.name, o.email, o.phone, o.address.city, o.items.reduce((n, i) => n + i.quantity, 0), o.total, o.paymentMethod, o.paymentStatus, o.status]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `chatim-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <>
      <PageHead title="Orders" sub="Manage fulfilment, payments and cancellations">
        <button onClick={exportCsv} className="btn-outline !py-2.5"><i className="fa-solid fa-file-csv" /> Export CSV</button>
      </PageHead>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map((t) => <button key={t} onClick={() => setStatus(t)} className={`px-4 py-2 rounded-full text-xs font-semibold capitalize ${status === t ? 'bg-gray-900 text-white' : 'bg-chatim-paper border border-pink-100 text-gray-600'}`}>{t}</button>)}
        <div className="relative ml-auto min-w-[240px]"><i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" /><input className="input pl-9 !py-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order #, name or email" /></div>
      </div>
      <div className="bg-chatim-paper rounded-2xl border border-pink-100 overflow-x-auto">
        {isLoading ? <div className="p-16 text-center"><Spinner className="text-chatim-clay text-xl" /></div> : (
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 text-xs text-gray-500 text-left"><tr><th className="p-3 pl-5 font-medium">Order</th><th className="font-medium">Customer</th><th className="font-medium">Items</th><th className="font-medium">Payment</th><th className="font-medium">Status</th><th className="font-medium text-right pr-5">Total</th></tr></thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.orderNumber} onClick={() => setSelected(o.orderNumber)} className="border-t border-pink-50 hover:bg-chatim-ivory/40 cursor-pointer">
                  <td className="p-3 pl-5"><p className="font-semibold">#{o.orderNumber}</p><p className="text-[11px] text-gray-400">{fmtDateTime(o.createdAt)}</p></td>
                  <td><p>{o.name}</p><p className="text-[11px] text-gray-400">{o.address.city}</p></td>
                  <td className="text-gray-600">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td><span className="text-xs text-gray-600 mr-1.5">{PAYMENT_LABEL[o.paymentMethod]}</span><Badge status={o.paymentStatus} /></td>
                  <td><Badge status={o.status} /></td>
                  <td className="text-right pr-5 font-semibold">{inr(o.total)}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-sm text-gray-500">No orders found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {current && <OrderPanel order={current} onClose={() => setSelected(null)} />}
    </>
  );
}
