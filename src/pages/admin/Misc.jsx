import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fmtDate, fmtDateTime, inr } from '../../lib/api';
import { toast } from '../../store';
import { Badge, Field, Spinner } from '../../components/ui';
import { PageHead } from './AdminApp';

const Loading = () => <div className="p-16 text-center"><Spinner className="text-chatim-clay text-xl" /></div>;

export function Customers() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'customers'], queryFn: () => api('/admin/customers') });
  const [q, setQ] = useState('');
  const rows = (data || []).filter((c) => !q || `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title="Customers" sub={`${data?.length ?? '…'} registered accounts`} />
      <div className="relative max-w-sm mb-4"><i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" /><input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" /></div>
      <div className="bg-chatim-paper rounded-2xl border border-pink-100 overflow-x-auto">
        {isLoading ? <Loading /> : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-xs text-gray-500 text-left"><tr><th className="p-3 pl-5 font-medium">Customer</th><th className="font-medium">Phone</th><th className="font-medium">Joined</th><th className="font-medium">Orders</th><th className="font-medium">Last order</th><th className="font-medium text-right pr-5">Lifetime value</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-pink-50">
                  <td className="p-3 pl-5"><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-chatim-peach text-chatim-clayDark text-xs font-bold flex items-center justify-center">{c.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span><div><p className="font-medium">{c.name} {c.role === 'admin' && <span className="chip bg-gray-900 text-white ml-1">admin</span>}</p><p className="text-[11px] text-gray-400">{c.email}</p></div></div></td>
                  <td className="text-gray-600">{c.phone || '–'}</td>
                  <td className="text-gray-600">{fmtDate(c.createdAt)}</td>
                  <td>{c.orders}</td>
                  <td className="text-gray-600">{c.lastOrder ? fmtDate(c.lastOrder) : '–'}</td>
                  <td className="text-right pr-5 font-semibold">{inr(c.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function Inquiries() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'inquiries'], queryFn: () => api('/admin/inquiries') });
  const subs = useQuery({ queryKey: ['admin', 'subscribers'], queryFn: () => api('/admin/subscribers') });
  const m = useMutation({
    mutationFn: ({ id, status }) => api(`/admin/inquiries/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
  return (
    <>
      <PageHead title="Leads & Inquiries" sub="Styling requests, bulk orders and newsletter sign-ups" />
      <div className="grid xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-3">
          {isLoading ? <Loading /> : data.length === 0 ? <p className="text-sm text-gray-500">No inquiries yet.</p> : data.map((i) => (
            <div key={i.id} className={`bg-chatim-paper rounded-2xl border p-5 ${i.status === 'new' ? 'border-chatim-clay/40' : 'border-pink-100'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{i.name} <Badge status={i.status} /></p>
                  <p className="text-xs text-gray-500 mt-0.5"><a href={`tel:${i.phone}`} className="hover:text-chatim-clayDark"><i className="fa-solid fa-phone mr-1" />{i.phone}</a>{i.email && <> · {i.email}</>} · {fmtDateTime(i.created_at)}</p>
                </div>
                <select value={i.status} onChange={(e) => m.mutate({ id: i.id, status: e.target.value })} className="input !w-auto !py-1.5 text-xs">
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
                </select>
              </div>
              <p className="text-sm mt-3"><span className="chip bg-chatim-peach text-chatim-clayDark mr-2">{i.topic}</span>{i.preferred_date && <span className="text-xs text-gray-500"><i className="fa-regular fa-calendar mr-1" />Prefers {fmtDate(i.preferred_date)}</span>}</p>
              {i.message && <p className="text-sm text-gray-600 mt-2">{i.message}</p>}
            </div>
          ))}
        </div>
        <div className="bg-chatim-paper rounded-2xl border border-pink-100 p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Newsletter</h2><span className="chip bg-chatim-peach text-chatim-clayDark">{subs.data?.length ?? 0}</span></div>
          <ul className="space-y-2 max-h-96 overflow-y-auto text-xs">
            {(subs.data || []).map((s) => <li key={s.id} className="flex justify-between gap-2"><span className="truncate">{s.email}</span><span className="text-gray-400 shrink-0">{fmtDate(s.created_at, { day: 'numeric', month: 'short' })}</span></li>)}
          </ul>
          {subs.data?.length > 0 && <button onClick={() => { navigator.clipboard?.writeText(subs.data.map((s) => s.email).join(', ')); toast('Emails copied'); }} className="btn-outline w-full !py-2 text-xs mt-4"><i className="fa-regular fa-copy" /> Copy all emails</button>}
        </div>
      </div>
    </>
  );
}

export function Coupons() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: () => api('/admin/coupons') });
  const empty = { code: '', description: '', type: 'percent', value: 10, minSubtotal: 0, maxDiscount: '', active: true };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const save = useMutation({
    mutationFn: (body) => api('/admin/coupons', { method: 'POST', body }),
    onSuccess: () => { toast('Coupon saved'); setForm(empty); setErrors({}); qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }); },
    onError: (e) => { setErrors(e.details || {}); toast(e.message, 'error'); },
  });
  const del = useMutation({ mutationFn: (code) => api(`/admin/coupons/${code}`, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }) });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <>
      <PageHead title="Coupons" sub="Promo codes are validated server-side at checkout" />
      <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="bg-chatim-paper rounded-2xl border border-pink-100 overflow-x-auto">
          {isLoading ? <Loading /> : (
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-xs text-gray-500 text-left"><tr><th className="p-3 pl-5 font-medium">Code</th><th className="font-medium">Discount</th><th className="font-medium">Min. order</th><th className="font-medium">Uses</th><th className="font-medium">Status</th><th /></tr></thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.code} className="border-t border-pink-50">
                    <td className="p-3 pl-5"><p className="font-mono font-bold">{c.code}</p><p className="text-[11px] text-gray-400">{c.description}</p></td>
                    <td>{c.type === 'percent' ? `${c.value}%` : inr(c.value)}{c.max_discount ? <span className="text-[11px] text-gray-400"> (max {inr(c.max_discount)})</span> : null}</td>
                    <td>{c.min_subtotal ? inr(c.min_subtotal) : '–'}</td>
                    <td>{c.uses}</td>
                    <td><button onClick={() => save.mutate({ code: c.code, description: c.description, type: c.type, value: c.value, minSubtotal: c.min_subtotal, maxDiscount: c.max_discount, active: !c.active })} className={`chip ${c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? 'Active' : 'Paused'}</button></td>
                    <td className="pr-4 text-right whitespace-nowrap">
                      <button onClick={() => setForm({ code: c.code, description: c.description || '', type: c.type, value: c.value, minSubtotal: c.min_subtotal, maxDiscount: c.max_discount || '', active: !!c.active })} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600" title="Edit"><i className="fa-regular fa-pen-to-square" /></button>
                      <button onClick={() => window.confirm(`Delete ${c.code}?`) && del.mutate(c.code)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete"><i className="fa-regular fa-trash-can" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate({ ...form, maxDiscount: form.maxDiscount === '' ? null : form.maxDiscount }); }} className="bg-chatim-paper rounded-2xl border border-pink-100 p-5 space-y-3">
          <h2 className="font-semibold">Create / update coupon</h2>
          <Field label="Code" error={errors.code}><input className="input uppercase font-mono" value={form.code} onChange={set('code')} placeholder="DIWALI20" required /></Field>
          <Field label="Description"><input className="input" value={form.description} onChange={set('description')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><select className="input" value={form.type} onChange={set('type')}><option value="percent">Percent %</option><option value="flat">Flat ₹</option></select></Field>
            <Field label="Value" error={errors.value}><input className="input" type="number" min="1" value={form.value} onChange={set('value')} /></Field>
            <Field label="Min. order ₹"><input className="input" type="number" min="0" value={form.minSubtotal} onChange={set('minSubtotal')} /></Field>
            <Field label="Max discount ₹"><input className="input" type="number" min="0" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="No cap" /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={set('active')} className="accent-chatim-clay" />Active</label>
          <button disabled={save.isPending} className="btn-primary w-full">{save.isPending ? <Spinner /> : 'Save coupon'}</button>
        </form>
      </div>
    </>
  );
}
