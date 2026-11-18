import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fmtDate, inr } from '../lib/api';
import { useAuth, useWishlist, toast } from '../store';
import { Badge, EmptyState, Field, Img, Spinner } from '../components/ui';

function AuthForms() {
  const [sp] = useSearchParams();
  const next = sp.get('next') || '/account';
  const [mode, setMode] = useState(sp.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const { setUser } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api(`/auth/${mode}`, { method: 'POST', body: mode === 'login' ? { email: form.email, password: form.password } : form }),
    onSuccess: ({ user }) => {
      setUser(user); qc.invalidateQueries({ queryKey: ['orders'] });
      toast(mode === 'login' ? `Welcome back, ${user.name.split(' ')[0]}!` : `Welcome to Chatim, ${user.name.split(' ')[0]}! 🌸`);
      nav(user.role === 'admin' && next === '/account' ? '/admin' : next, { replace: true });
    },
    onError: (e) => setErrors(e.details || { _: e.message }),
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="min-h-[70vh] grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-chatim-ivory">
        <Img src="/media/products/vintage-afghan-triangle-coin-fringe-earrings-1.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-chatim-ink/80 via-chatim-ink/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="font-serif text-3xl font-medium leading-tight">Join the Chatim Club</p>
          <ul className="mt-4 space-y-2 text-sm text-white/90">
            <li><i className="fa-solid fa-check mr-2 text-chatim-marigold" />Track orders & manage exchanges</li>
            <li><i className="fa-solid fa-check mr-2 text-chatim-marigold" />Save your wishlist across devices</li>
            <li><i className="fa-solid fa-check mr-2 text-chatim-marigold" />Early access to festive drops</li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex p-1 rounded-full bg-chatim-peach mb-8">
            {['login', 'register'].map((m2) => (
              <button key={m2} onClick={() => { setMode(m2); setErrors({}); }} className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition ${mode === m2 ? 'bg-chatim-paper shadow text-chatim-clayDark' : 'text-gray-600'}`}>{m2 === 'login' ? 'Sign in' : 'Create account'}</button>
            ))}
          </div>
          <h1 className="font-serif text-3xl font-medium">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">{mode === 'login' ? 'Sign in to view your orders and wishlist.' : 'It takes less than a minute.'}</p>
          <form onSubmit={(e) => { e.preventDefault(); setErrors({}); m.mutate(); }} className="space-y-4" noValidate>
            {mode === 'register' && <>
              <Field label="Full name" error={errors.name}><input className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} autoComplete="name" /></Field>
              <Field label="Mobile (optional)"><input className="input" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
            </>}
            <Field label="Email" error={errors.email}><input className={`input ${errors.email ? 'input-error' : ''}`} type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
            <Field label="Password" error={errors.password} hint={mode === 'register' ? 'At least 8 characters' : undefined}>
              <div className="relative">
                <input className={`input pr-11 ${errors.password ? 'input-error' : ''}`} type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={show ? 'Hide password' : 'Show password'}><i className={`fa-regular ${show ? 'fa-eye-slash' : 'fa-eye'}`} /></button>
              </div>
            </Field>
            {errors._ && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5"><i className="fa-solid fa-circle-exclamation mr-2" />{errors._}</p>}
            <button disabled={m.isPending} className="btn-primary w-full py-3.5">{m.isPending ? <Spinner /> : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-6">Just want to check an order? <Link to="/track" className="text-chatim-clayDark font-semibold hover:underline">Track without signing in</Link></p>
        </div>
      </div>
    </div>
  );
}

function Profile({ user }) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const m = useMutation({
    mutationFn: () => api('/auth/me', { method: 'PATCH', body: form }),
    onSuccess: ({ user: u }) => { setUser(u); setForm((f) => ({ ...f, currentPassword: '', newPassword: '' })); toast('Profile updated'); },
    onError: (e) => { setErrors(e.details || {}); toast(e.message, 'error'); },
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); setErrors({}); m.mutate(); }} className="card p-6 sm:p-8 space-y-5 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Mobile"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
        <div className="sm:col-span-2"><Field label="Email" hint="Contact us to change your email"><input className="input bg-gray-50" value={user.email} disabled /></Field></div>
      </div>
      <div className="pt-4 border-t border-pink-100">
        <p className="text-sm font-semibold mb-3">Change password</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Current password"><input className="input" type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" /></Field>
          <Field label="New password" error={errors.newPassword}><input className="input" type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" /></Field>
        </div>
      </div>
      <button disabled={m.isPending} className="btn-primary">{m.isPending ? <Spinner /> : 'Save changes'}</button>
    </form>
  );
}

function Orders() {
  const { data, isLoading } = useQuery({ queryKey: ['orders', 'mine'], queryFn: () => api('/orders/mine') });
  if (isLoading) return <div className="py-16 text-center"><Spinner className="text-chatim-clay text-2xl" /></div>;
  if (!data.length) return <EmptyState icon="fa-solid fa-box-open" title="No orders yet" text="When you place an order, it will appear here." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} />;
  return (
    <div className="space-y-4">
      {data.map((o) => (
        <Link key={o.orderNumber} to={`/order/${o.orderNumber}`} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-soft transition">
          <div className="flex -space-x-3">
            {o.items.slice(0, 3).map((it, i) => <Img key={i} src={it.image} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white bg-pink-50" />)}
            {o.items.length > 3 && <span className="w-14 h-14 rounded-xl bg-chatim-peach border-2 border-white text-xs font-bold text-chatim-clayDark flex items-center justify-center">+{o.items.length - 3}</span>}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">#{o.orderNumber}</p>
            <p className="text-xs text-gray-500">{fmtDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</p>
          </div>
          <Badge status={o.status} />
          <p className="font-serif font-medium text-lg w-24 sm:text-right">{inr(o.total)}</p>
          <i className="fa-solid fa-chevron-right text-xs text-gray-300 hidden sm:block" />
        </Link>
      ))}
    </div>
  );
}

export default function Account() {
  const { user, loading, setUser } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'orders';
  const nav = useNavigate();
  const qc = useQueryClient();
  const setWish = useWishlist((s) => s.set);
  useEffect(() => { document.title = 'My Account | Chatim Collections'; }, []);
  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><Spinner className="text-chatim-clay text-2xl" /></div>;
  if (!user) return <AuthForms />;
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null); setWish([]); qc.removeQueries({ queryKey: ['orders'] }); toast('You’ve been signed out', 'info'); nav('/');
  };
  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-chatim-ink text-chatim-paper text-lg font-bold flex items-center justify-center">{user.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div><h1 className="font-serif text-2xl sm:text-3xl font-medium">Hello, {user.name.split(' ')[0]}</h1><p className="text-xs text-gray-500">{user.email} · Member since {fmtDate(user.createdAt, { month: 'long', year: 'numeric' })}</p></div>
          </div>
          <div className="flex gap-2">
            {user.role === 'admin' && <Link to="/admin" className="btn-dark !py-2.5"><i className="fa-solid fa-gauge" /> Admin</Link>}
            <button onClick={logout} className="btn-outline !py-2.5"><i className="fa-solid fa-arrow-right-from-bracket" /> Sign out</button>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          {[['orders', 'My Orders', 'fa-box'], ['profile', 'Profile', 'fa-user']].map(([k, l, i]) => (
            <button key={k} onClick={() => setSp({ tab: k })} className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${tab === k ? 'bg-chatim-ink text-chatim-paper shadow-soft' : 'bg-chatim-paper border border-pink-100 text-gray-700 hover:bg-pink-50'}`}><i className={`fa-solid ${i} mr-2`} />{l}</button>
          ))}
          <Link to="/wishlist" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-chatim-paper border border-pink-100 text-gray-700 hover:bg-pink-50"><i className="fa-regular fa-heart mr-2" />Wishlist</Link>
        </div>
        {tab === 'profile' ? <Profile user={user} /> : <Orders />}
      </div>
    </div>
  );
}
