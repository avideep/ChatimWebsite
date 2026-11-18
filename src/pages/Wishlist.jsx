import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useWishlist } from '../store';
import { Breadcrumbs, EmptyState } from '../components/ui';
import { ProductGrid } from '../components/ProductCard';

export default function Wishlist() {
  const ids = useWishlist((s) => s.ids);
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'wishlist', ids], queryFn: () => api(`/products?ids=${ids.join(',')}&limit=60`), enabled: ids.length > 0,
  });
  const items = (data?.items || []).slice().sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
        <h1 className="font-serif text-3xl sm:text-4xl font-medium mt-3">My Wishlist</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">{ids.length} saved piece{ids.length === 1 ? '' : 's'}</p>
        {ids.length === 0 ? (
          <EmptyState icon="fa-regular fa-heart" title="Your wishlist is empty" text="Tap the heart on any design to save it for later." action={<Link to="/shop" className="btn-primary">Discover designs</Link>} />
        ) : <ProductGrid items={items} loading={isLoading} count={Math.min(ids.length, 8)} />}
      </div>
    </div>
  );
}
