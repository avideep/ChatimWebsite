import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, inr } from '../../lib/api';
import { toast } from '../../store';
import { Field, Img, Modal, Spinner } from '../../components/ui';
import { PageHead } from './AdminApp';

const CATS = ['Earrings', 'Necklaces', 'Rings', 'Bangles', 'Sets', 'Nose Pins'];
const COLLECTIONS = ['Afghani Tribal', 'Oxidised', '925 Silver', 'Festive', 'Everyday', 'Kazakh', 'Tibetan', 'Turkish'];
const blank = { name: '', category: 'Earrings', collection: 'Oxidised', badge: '', price: '', originalPrice: '', material: '', description: '', details: [], images: [], stock: 10, featured: false, isNew: true, active: true };

function Editor({ product, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => (product ? { ...product, badge: product.badge || '' } : blank));
  const [imgUrl, setImgUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = useMutation({
    mutationFn: () => api(product ? `/admin/products/${product.id}` : '/admin/products', { method: product ? 'PUT' : 'POST', body: { ...form, details: form.details.filter(Boolean) } }),
    onSuccess: () => { toast(product ? 'Product updated' : 'Product created'); qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['product'] }); qc.invalidateQueries({ queryKey: ['facets'] }); onClose(); },
    onError: (e) => { setErrors(e.details || {}); toast(e.message, 'error'); },
  });
  const upload = async (file) => {
    if (!file) return;
    const fd = new FormData(); fd.append('image', file);
    setUploading(true);
    try { const { url } = await api('/admin/upload', { method: 'POST', form: fd }); setForm((f) => ({ ...f, images: [...f.images, url] })); } catch (e) { toast(e.message, 'error'); }
    setUploading(false);
  };
  const discount = form.originalPrice > 0 && form.price > 0 ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100) : 0;
  return (
    <Modal open onClose={onClose} className="max-w-3xl" label="Edit product">
      <form onSubmit={(e) => { e.preventDefault(); setErrors({}); save.mutate(); }} className="p-6 sm:p-8 space-y-5">
        <h2 className="font-serif text-2xl font-medium">{product ? 'Edit product' : 'New product'}</h2>
        <Field label="Product name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} required /></Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Category"><select className="input" value={form.category} onChange={set('category')}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Collection" error={errors.collection}><input className="input" list="collections" value={form.collection} onChange={set('collection')} /><datalist id="collections">{COLLECTIONS.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Badge (optional)"><input className="input uppercase" value={form.badge} onChange={set('badge')} placeholder="BESTSELLER" maxLength={24} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Selling price (₹)" error={errors.price} hint="Enter 0 to show “Price on request”"><input className="input" type="number" min="0" value={form.price} onChange={set('price')} required /></Field>
          <Field label="MRP (₹)" error={errors.originalPrice} hint={discount > 0 ? `${discount}% off` : undefined}><input className="input" type="number" min="0" value={form.originalPrice} onChange={set('originalPrice')} required /></Field>
          <Field label="Stock" error={errors.stock}><input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} required /></Field>
        </div>
        <Field label="Material"><input className="input" value={form.material} onChange={set('material')} /></Field>
        <Field label="Description"><textarea className="input" rows={3} value={form.description} onChange={set('description')} /></Field>
        <Field label="Detail bullets (one per line)"><textarea className="input" rows={3} value={form.details.join('\n')} onChange={(e) => setForm({ ...form, details: e.target.value.split('\n') })} /></Field>
        <div>
          <span className="label">Images {errors.images && <span className="text-red-500 font-normal ml-2">{errors.images}</span>}</span>
          <div className="flex flex-wrap gap-3">
            {form.images.map((src, i) => (
              <div key={src + i} className="relative group">
                <Img src={src} alt="" className="w-20 h-20 rounded-xl object-cover bg-pink-50 border border-pink-100" />
                {i === 0 && <span className="absolute bottom-1 left-1 chip bg-chatim-paper/90 text-[9px] !px-1.5 !py-0">Cover</span>}
                <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, k) => k !== i) })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100" aria-label="Remove image"><i className="fa-solid fa-xmark" /></button>
                {i > 0 && <button type="button" onClick={() => { const imgs = [...form.images]; [imgs[0], imgs[i]] = [imgs[i], imgs[0]]; setForm({ ...form, images: imgs }); }} className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-chatim-paper border text-[10px] opacity-0 group-hover:opacity-100" title="Make cover"><i className="fa-solid fa-star" /></button>}
              </div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-pink-200 flex flex-col items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-chatim-clay hover:text-chatim-clayDark">
              {uploading ? <Spinner /> : <><i className="fa-solid fa-cloud-arrow-up text-lg" />Upload</>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files[0])} />
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <input className="input !py-2 text-xs" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="…or paste an image URL (https://…)" />
            <button type="button" onClick={() => { if (imgUrl.trim()) { setForm({ ...form, images: [...form.images, imgUrl.trim()] }); setImgUrl(''); } }} className="btn-dark !py-2 !px-4 text-xs">Add</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          {[['active', 'Visible in store'], ['featured', 'Featured on home'], ['isNew', 'Mark as new']].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={form[k]} onChange={set(k)} className="w-4 h-4 accent-chatim-clay" />{l}</label>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button disabled={save.isPending} className="btn-primary">{save.isPending ? <Spinner /> : product ? 'Save changes' : 'Create product'}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Products() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'products'], queryFn: () => api('/admin/products') });
  const editId = sp.get('edit'); const creating = sp.get('new') === '1';
  const editing = editId ? data?.find((p) => String(p.id) === editId) : null;
  const close = () => setSp({});
  const del = useMutation({
    mutationFn: (id) => api(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast('Product deleted', 'info'); qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
    onError: (e) => toast(e.message, 'error'),
  });
  const quickStock = useMutation({
    mutationFn: (p) => api(`/admin/products/${p.id}`, { method: 'PUT', body: p }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
  });
  useEffect(() => { document.title = 'Products · Chatim Admin'; }, []);

  const rows = (data || []).filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()))
    && (filter === 'all' || (filter === 'low' && p.stock <= 8) || (filter === 'hidden' && !p.active) || (filter === 'featured' && p.featured)));

  return (
    <>
      <PageHead title="Products" sub={`${data?.length ?? '…'} products in catalogue`}>
        <button onClick={() => setSp({ new: '1' })} className="btn-primary !py-2.5"><i className="fa-solid fa-plus" /> Add product</button>
      </PageHead>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm"><i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" /><input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" /></div>
        {[['all', 'All'], ['low', 'Low stock'], ['featured', 'Featured'], ['hidden', 'Hidden']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-4 py-2 rounded-full text-xs font-semibold ${filter === k ? 'bg-gray-900 text-white' : 'bg-chatim-paper border border-pink-100 text-gray-600'}`}>{l}</button>
        ))}
      </div>
      <div className="bg-chatim-paper rounded-2xl border border-pink-100 overflow-x-auto">
        {isLoading ? <div className="p-16 text-center"><Spinner className="text-chatim-clay text-xl" /></div> : (
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-gray-50 text-xs text-gray-500 text-left"><tr><th className="p-3 pl-5 font-medium">Product</th><th className="font-medium">Category</th><th className="font-medium">Price</th><th className="font-medium">Stock</th><th className="font-medium">Sold</th><th className="font-medium">Rating</th><th className="font-medium">Status</th><th /></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-pink-50 hover:bg-chatim-ivory/40">
                  <td className="p-3 pl-5"><div className="flex items-center gap-3"><Img src={p.images[0]} alt="" className="w-11 h-11 rounded-lg object-cover bg-pink-50" /><div className="min-w-0"><p className="font-medium truncate max-w-[260px]">{p.name}</p><p className="text-[11px] text-gray-400">{p.collection}{p.badge ? ` · ${p.badge}` : ''}</p></div></div></td>
                  <td className="text-gray-600">{p.category}</td>
                  <td>{p.price > 0 ? <><p className="font-semibold">{inr(p.price)}</p><p className="text-[11px] text-gray-400 line-through">{inr(p.originalPrice)}</p></> : <p className="text-xs font-semibold text-chatim-clayDark">On request</p>}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => quickStock.mutate({ ...p, stock: Math.max(0, p.stock - 1) })} className="w-6 h-6 rounded-full hover:bg-gray-100 text-[10px]" aria-label="Decrease stock"><i className="fa-solid fa-minus" /></button>
                      <span className={`w-8 text-center font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 8 ? 'text-amber-600' : ''}`}>{p.stock}</span>
                      <button onClick={() => quickStock.mutate({ ...p, stock: p.stock + 1 })} className="w-6 h-6 rounded-full hover:bg-gray-100 text-[10px]" aria-label="Increase stock"><i className="fa-solid fa-plus" /></button>
                    </div>
                  </td>
                  <td className="text-gray-600">{p.sold}</td>
                  <td className="text-gray-600">{p.reviewCount ? <>{p.rating.toFixed(1)} <i className="fa-solid fa-star text-amber-400 text-[10px]" /> <span className="text-gray-400">({p.reviewCount})</span></> : '–'}</td>
                  <td><span className={`chip ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.active ? 'Live' : 'Hidden'}</span>{p.featured && <span className="chip bg-chatim-peach text-chatim-clayDark ml-1"><i className="fa-solid fa-star" /></span>}</td>
                  <td className="pr-4 text-right whitespace-nowrap">
                    {p.active && <Link to={`/product/${p.slug}`} target="_blank" className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500" title="View in store"><i className="fa-solid fa-arrow-up-right-from-square text-xs" /></Link>}
                    <button onClick={() => setSp({ edit: p.id })} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600" title="Edit"><i className="fa-regular fa-pen-to-square" /></button>
                    <button onClick={() => window.confirm(`Delete “${p.name}”? This cannot be undone.`) && del.mutate(p.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete"><i className="fa-regular fa-trash-can" /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-sm text-gray-500">No products match.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {(creating || editing) && <Editor key={editId || 'new'} product={editing} onClose={close} />}
    </>
  );
}
