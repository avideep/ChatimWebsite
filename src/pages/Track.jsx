import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Field, Spinner } from '../components/ui';
import { OrderDetail } from './Order';

export default function Track() {
  const [form, setForm] = useState({ orderNumber: '', email: '' });
  const m = useMutation({ mutationFn: () => api(`/orders/${encodeURIComponent(form.orderNumber.trim().replace(/^#/, ''))}?email=${encodeURIComponent(form.email.trim())}`) });
  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-10 sm:py-14 max-w-5xl">
        <div className="text-center mb-8">
          <span className="eyebrow">Order status</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium mt-1">Track your order</h1>
          <p className="text-sm text-gray-500 mt-2">Enter the order number from your confirmation and the email you used at checkout.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="card p-6 grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end max-w-3xl mx-auto">
          <Field label="Order number"><input className="input uppercase" required value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} placeholder="CH2611171234" /></Field>
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
          <button disabled={m.isPending} className="btn-primary h-[42px]">{m.isPending ? <Spinner /> : 'Track'}</button>
        </form>
        {m.error && <p className="text-center text-sm text-red-500 mt-4"><i className="fa-solid fa-circle-exclamation mr-1" />{m.error.message}</p>}
        {m.data && <div className="mt-10 animate-slideUp"><OrderDetail order={m.data} /></div>}
      </div>
    </div>
  );
}
