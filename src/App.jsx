import { lazy, Suspense, useEffect, useRef } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header, { AnnouncementBar } from './components/Header';
import Footer from './components/Footer';
import { CartDrawer, InquiryModal, MobileNav, QuickView, Toaster } from './components/Overlays';
import { Spinner } from './components/ui';
import { api } from './lib/api';
import { useAuth, useWishlist } from './store';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/Product';

const CartPage = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderPage = lazy(() => import('./pages/Order'));
const Account = lazy(() => import('./pages/Account'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Track = lazy(() => import('./pages/Track'));
const Help = lazy(() => import('./pages/Help'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function ScrollManager() {
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50); return; }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]); // eslint-disable-line react-hooks/exhaustive-deps
  void search;
  return null;
}

/** Keep the wishlist synced with the server for signed-in shoppers (merges guest picks on login). */
function WishlistSync() {
  const { user } = useAuth();
  const { ids, set } = useWishlist();
  const ready = useRef(false);
  const { data } = useQuery({ queryKey: ['wishlist', user?.id], queryFn: () => api('/wishlist'), enabled: !!user });
  useEffect(() => {
    if (!user) { ready.current = false; return; }
    if (data && !ready.current) {
      ready.current = true;
      const merged = [...new Set([...ids, ...data.ids])];
      set(merged);
      if (merged.length !== data.ids.length) api('/wishlist', { method: 'PUT', body: { ids: merged } }).catch(() => {});
    }
  }, [data, user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user && ready.current) {
      const t = setTimeout(() => api('/wishlist', { method: 'PUT', body: { ids } }).catch(() => {}), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [ids, user]);
  return null;
}

const Loading = () => <div className="min-h-[50vh] flex items-center justify-center"><Spinner className="text-chatim-clay text-2xl" /></div>;

function StoreLayout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] btn-primary">Skip to content</a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="min-h-[60vh]"><Suspense fallback={<Loading />}><Outlet /></Suspense></main>
      <Footer />
      <CartDrawer />
      <QuickView />
      <InquiryModal />
      <MobileNav />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <WishlistSync />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order/:orderNumber" element={<OrderPage />} />
          <Route path="account" element={<Account />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="track" element={<Track />} />
          <Route path="help" element={<Help />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/*" element={<Suspense fallback={<Loading />}><AdminApp /></Suspense>} />
      </Routes>
      <Toaster />
    </>
  );
}
