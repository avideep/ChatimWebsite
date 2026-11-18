import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container-x py-16">
      <EmptyState icon="fa-regular fa-compass" title="Page not found" text="The page you’re looking for doesn’t exist or has moved."
        action={<div className="flex justify-center gap-3"><Link to="/" className="btn-primary">Go home</Link><Link to="/shop" className="btn-outline">Shop jewellery</Link></div>} />
    </div>
  );
}
