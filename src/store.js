import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './lib/api';

/** Cart lines hold a product snapshot for instant UI; the server re-prices at quote/checkout. */
export const useCart = create(persist((set, get) => ({
  items: [], // { productId, quantity, product: {id, slug, name, price, originalPrice, images, stock} }
  coupon: '',
  add: (product, quantity = 1) => set((s) => {
    const existing = s.items.find((i) => i.productId === product.id);
    const cap = Math.min(10, product.stock ?? 10);
    if (existing) {
      return { items: s.items.map((i) => (i.productId === product.id ? { ...i, quantity: Math.min(cap, i.quantity + quantity), product: snap(product) } : i)) };
    }
    return { items: [...s.items, { productId: product.id, quantity: Math.min(cap, quantity), product: snap(product) }] };
  }),
  setQty: (productId, quantity) => set((s) => ({
    items: quantity <= 0 ? s.items.filter((i) => i.productId !== productId)
      : s.items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, 10, i.product.stock || 10) } : i)),
  })),
  remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  clear: () => set({ items: [], coupon: '' }),
  setCoupon: (coupon) => set({ coupon }),
  count: () => get().items.reduce((n, i) => n + i.quantity, 0),
}), { name: 'chatim-cart' }));

const snap = (p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, originalPrice: p.originalPrice, images: p.images, stock: p.stock, material: p.material });

export const useWishlist = create(persist((set, get) => ({
  ids: [],
  toggle: (id) => {
    const has = get().ids.includes(id);
    set({ ids: has ? get().ids.filter((x) => x !== id) : [id, ...get().ids] });
    return !has;
  },
  set: (ids) => set({ ids }),
}), { name: 'chatim-wishlist' }));

export const useUI = create((set) => ({
  drawer: null, // 'cart' | null
  quickView: null, // product slug
  inquiry: false,
  inquiryTopic: null,
  inquiryMessage: '',
  mobileNav: false,
  openCart: () => set({ drawer: 'cart' }),
  closeDrawer: () => set({ drawer: null }),
  openQuickView: (slug) => set({ quickView: slug }),
  closeQuickView: () => set({ quickView: null }),
  openInquiry: (topic = null, message = '') => set({ inquiry: true, inquiryTopic: topic, inquiryMessage: message }),
  closeInquiry: () => set({ inquiry: false }),
  setMobileNav: (v) => set({ mobileNav: v }),
}));

let toastId = 0;
export const useToasts = create((set) => ({
  toasts: [],
  push: (message, type = 'success') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
}));
export const toast = (msg, type) => useToasts.getState().push(msg, type);

export function useAuth() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me'), staleTime: 5 * 60e3 });
  return {
    user: data?.user || null,
    loading: isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: ['me'] }),
    setUser: (user) => qc.setQueryData(['me'], { user }),
  };
}
