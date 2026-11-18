import { useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../store';
import { Logo, Spinner } from '../../components/ui';
import Dashboard from './Dashboard';
import Products from './Products';
import Orders from './Orders';
import { Coupons, Customers, Inquiries } from './Misc';

const LINKS = [
  ['', 'Dashboard', 'fa-chart-line'], ['orders', 'Orders', 'fa-receipt'], ['products', 'Products', 'fa-gem'],
  ['customers', 'Customers', 'fa-users'], ['inquiries', 'Leads & Inquiries', 'fa-inbox'], ['coupons', 'Coupons', 'fa-ticket'],
];

export default function AdminApp() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api('/admin/stats'), enabled: user?.role === 'admin' });
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="text-chatim-clay text-2xl" /></div>;
  if (!user) return <Navigate to={`/account?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (user.role !== 'admin') {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center"><i className="fa-solid fa-lock text-3xl text-chatim-clay" /><h1 className="font-serif text-2xl font-medium">Admins only</h1><p className="text-sm text-gray-500">Your account doesn’t have access to the dashboard.</p><Link to="/" className="btn-primary">Back to store</Link></div>;
  }
  const newLeads = stats.data?.newInquiries || 0;

  return (
    <div className="min-h-screen bg-chatim-ivory flex">
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-chatim-paper border-r border-pink-100 flex flex-col transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-pink-100"><Logo /><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3">Store Admin</p></div>
        <nav className="flex-1 p-3 space-y-1">
          {LINKS.map(([to, label, icon]) => (
            <NavLink key={to} to={`/admin${to ? `/${to}` : ''}`} end={!to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-chatim-peach text-chatim-clayDark' : 'text-gray-600 hover:bg-gray-50'}`}>
              <i className={`fa-solid ${icon} w-4 text-center`} />{label}
              {to === 'inquiries' && newLeads > 0 && <span className="ml-auto chip bg-chatim-ink text-chatim-paper !py-0.5">{newLeads}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-pink-100 text-xs">
          <p className="font-semibold text-chatim-ink truncate">{user.name}</p>
          <p className="text-gray-500 truncate">{user.email}</p>
          <Link to="/" className="mt-3 flex items-center gap-2 text-chatim-clayDark font-semibold hover:underline"><i className="fa-solid fa-store" />View storefront</Link>
        </div>
      </aside>
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-chatim-paper border-b border-pink-100 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="p-2" aria-label="Open admin menu"><i className="fa-solid fa-bars" /></button>
          <span className="font-serif font-medium">Chatim Admin</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          <Routes>
            <Route index element={<Dashboard stats={stats} />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><h1 className="font-serif text-2xl sm:text-3xl font-medium text-chatim-ink">{title}</h1>{sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
