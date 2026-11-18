import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, inr, qs } from '../lib/api';
import { ProductGrid } from '../components/ProductCard';
import { Breadcrumbs, EmptyState } from '../components/ui';

const SORTS = [
  ['featured', 'Featured'], ['popular', 'Bestselling'], ['newest', 'Newest'], ['price-low', 'Price: Low to High'],
  ['price-high', 'Price: High to Low'], ['rating', 'Top Rated'], ['discount', 'Biggest Discount'],
];
const PRICE_BANDS = [[0, 999, 'Under ₹999'], [1000, 1999, '₹1,000 – ₹1,999'], [2000, 2999, '₹2,000 – ₹2,999'], [3000, '', '₹3,000 & above']];

function useListParam(params, key) {
  return (params.get(key) || '').split(',').filter(Boolean);
}

// Compact pager (at most 7 slots), e.g. 1 … 9 10 11 … 34; a gap of a single page shows that page instead of "…".
function pageItems(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 4) [2, 3, 4, 5].forEach((n) => keep.add(n));
  if (cur >= total - 3) [total - 4, total - 3, total - 2, total - 1].forEach((n) => keep.add(n));
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return nums.flatMap((n, i) => {
    if (i === 0 || n - nums[i - 1] === 1) return [n];
    return n - nums[i - 1] === 2 ? [n - 1, n] : [`gap-${n}`, n];
  });
}

function Filters({ params, update, facets }) {
  const cats = useListParam(params, 'category');
  const cols = useListParam(params, 'collection');
  const toggleList = (key, list, v) => update({ [key]: (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]).join(',') });
  const min = params.get('minPrice') || ''; const max = params.get('maxPrice') || '';
  const [pmin, setPmin] = useState(min); const [pmax, setPmax] = useState(max);
  useEffect(() => { setPmin(min); setPmax(max); }, [min, max]);

  const Box = ({ checked, onChange, label, count }) => (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded accent-chatim-clay" />
      <span className="flex-1 group-hover:text-chatim-clayDark">{label}</span>
      {count != null && <span className="text-[11px] text-gray-400">{count}</span>}
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-chatim-ink mb-2">Category</h4>
        {facets?.categories.map((c) => <Box key={c.name} label={c.name} count={c.count} checked={cats.includes(c.name)} onChange={() => toggleList('category', cats, c.name)} />)}
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-chatim-ink mb-2">Collection</h4>
        {facets?.collections.map((c) => <Box key={c.name} label={c.name} count={c.count} checked={cols.includes(c.name)} onChange={() => toggleList('collection', cols, c.name)} />)}
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-chatim-ink mb-2">Price</h4>
        {PRICE_BANDS.map(([a, b, l]) => {
          const active = String(a || '') === min && String(b) === max;
          return <Box key={l} label={l} checked={active} onChange={() => update(active ? { minPrice: '', maxPrice: '' } : { minPrice: a || '', maxPrice: b })} />;
        })}
        <form onSubmit={(e) => { e.preventDefault(); update({ minPrice: pmin, maxPrice: pmax }); }} className="flex items-center gap-2 mt-2">
          <input type="number" min="0" value={pmin} onChange={(e) => setPmin(e.target.value)} placeholder={`₹${facets?.price.min ?? 0}`} className="input !py-1.5 !px-3 text-xs" aria-label="Minimum price" />
          <span className="text-gray-400">–</span>
          <input type="number" min="0" value={pmax} onChange={(e) => setPmax(e.target.value)} placeholder={`₹${facets?.price.max ?? ''}`} className="input !py-1.5 !px-3 text-xs" aria-label="Maximum price" />
          <button className="w-9 h-9 shrink-0 rounded-full bg-gray-900 text-white text-xs" aria-label="Apply price"><i className="fa-solid fa-check" /></button>
        </form>
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-chatim-ink mb-2">Customer Rating</h4>
        {[4.5, 4].map((r) => <Box key={r} label={<>{r}<i className="fa-solid fa-star text-amber-400 text-[10px] mx-1" />& above</>} checked={params.get('minRating') === String(r)} onChange={() => update({ minRating: params.get('minRating') === String(r) ? '' : r })} />)}
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-chatim-ink mb-2">Availability</h4>
        <Box label="In stock only" checked={params.get('inStock') === '1'} onChange={() => update({ inStock: params.get('inStock') === '1' ? '' : '1' })} />
        <Box label="New arrivals" checked={params.get('isNew') === '1'} onChange={() => update({ isNew: params.get('isNew') === '1' ? '' : '1' })} />
      </div>
    </div>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const page = Number(params.get('page') || 1);
  const query = Object.fromEntries(params.entries());

  const update = (patch, keepPage = false) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    if (!keepPage) next.delete('page');
    setParams(next);
  };

  const facets = useQuery({ queryKey: ['facets'], queryFn: () => api('/facets'), staleTime: 5 * 60e3 });
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', query], queryFn: () => api(`/products${qs({ ...query, limit: 12 })}`), placeholderData: keepPreviousData,
  });

  useEffect(() => { document.body.style.overflow = sheet ? 'hidden' : ''; }, [sheet]);

  const cats = (params.get('category') || '').split(',').filter(Boolean);
  const title = params.get('q') ? `Results for “${params.get('q')}”` : cats.length === 1 ? cats[0] : params.get('collection') ? `${params.get('collection').split(',').join(' & ')} Collection` : params.get('isNew') ? 'New Arrivals' : params.get('featured') ? 'Most Loved' : 'All Jewellery';

  const chips = [];
  if (params.get('q')) chips.push(['q', `“${params.get('q')}”`]);
  cats.forEach((c) => chips.push(['category', c, c]));
  (params.get('collection') || '').split(',').filter(Boolean).forEach((c) => chips.push(['collection', c, c]));
  if (params.get('minPrice') || params.get('maxPrice')) chips.push(['price', `${params.get('minPrice') ? inr(params.get('minPrice')) : '₹0'} – ${params.get('maxPrice') ? inr(params.get('maxPrice')) : 'any'}`]);
  if (params.get('minRating')) chips.push(['minRating', `${params.get('minRating')}★ & up`]);
  if (params.get('inStock')) chips.push(['inStock', 'In stock']);
  if (params.get('isNew')) chips.push(['isNew', 'New']);
  const removeChip = ([key, , value]) => {
    if (key === 'price') return update({ minPrice: '', maxPrice: '' });
    if (value) return update({ [key]: (params.get(key) || '').split(',').filter((x) => x !== value).join(',') });
    return update({ [key]: '' });
  };
  const clearAll = () => setParams(params.get('sort') ? { sort: params.get('sort') } : {});
  const goPage = (n) => { update({ page: n }, true); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="bg-chatim-ivory/40 min-h-screen">
      <div className="container-x py-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, ...(title !== 'All Jewellery' ? [{ label: title }] : [])]} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-3 mb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-chatim-ink">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{data ? `${data.total} handcrafted design${data.total === 1 ? '' : 's'}` : 'Loading designs…'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSheet(true)} className="lg:hidden btn-outline !py-2 !px-4 text-xs"><i className="fa-solid fa-sliders" /> Filters{chips.length ? ` (${chips.length})` : ''}</button>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <span className="hidden sm:inline">Sort by</span>
              <select value={params.get('sort') || 'featured'} onChange={(e) => update({ sort: e.target.value })} className="px-3.5 py-2 rounded-full text-xs font-medium bg-chatim-paper border border-pink-100 text-gray-700 outline-none focus:border-chatim-clay cursor-pointer">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* quick category pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {['All', ...(facets.data?.categories.map((c) => c.name) || [])].map((c) => {
            const active = c === 'All' ? cats.length === 0 : cats.length === 1 && cats[0] === c;
            return <button key={c} onClick={() => update({ category: c === 'All' ? '' : c })} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${active ? 'bg-chatim-ink text-chatim-paper shadow-soft' : 'bg-chatim-paper text-gray-700 hover:bg-pink-50 border border-pink-100'}`}>{c}</button>;
          })}
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside className="hidden lg:block">
            <div className="card p-5 sticky top-36">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-medium">Filters</h3>
                {chips.length > 0 && <button onClick={clearAll} className="text-xs font-semibold text-chatim-clayDark hover:underline">Clear all</button>}
              </div>
              <Filters params={params} update={update} facets={facets.data} />
            </div>
          </aside>

          <div className="min-w-0">
            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {chips.map((c) => (
                  <button key={c.join()} onClick={() => removeChip(c)} className="chip bg-chatim-paper border border-pink-200 text-gray-700 hover:border-chatim-clay !py-1.5 !px-3">
                    {c[1]} <i className="fa-solid fa-xmark text-[10px] text-gray-400" />
                  </button>
                ))}
                <button onClick={clearAll} className="text-xs font-semibold text-chatim-clayDark hover:underline ml-1">Clear all</button>
              </div>
            )}
            <div className={`transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
              {!isLoading && data?.items.length === 0 ? (
                <EmptyState title="No matching jewellery found" text="Try removing a filter or browse all our handcrafted pieces." action={<button onClick={clearAll} className="btn-primary">Show all designs</button>} />
              ) : (
                <ProductGrid items={data?.items || []} loading={isLoading} count={12} cols="grid-cols-2 md:grid-cols-3" />
              )}
            </div>
            {data && data.pages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
                <button disabled={page <= 1} onClick={() => goPage(page - 1)} className="w-10 h-10 shrink-0 rounded-full bg-chatim-paper border border-pink-100 disabled:opacity-40" aria-label="Previous page"><i className="fa-solid fa-chevron-left text-xs" /></button>
                <span className="sm:hidden px-3 text-sm font-medium text-gray-600 whitespace-nowrap">Page {page} of {data.pages}</span>
                {pageItems(page, data.pages).map((n) => (typeof n === 'number' ? (
                  <button key={n} onClick={() => goPage(n)} className={`hidden sm:block w-10 h-10 shrink-0 rounded-full text-sm font-semibold ${n === page ? 'bg-chatim-ink text-chatim-paper' : 'bg-chatim-paper border border-pink-100 hover:bg-pink-50'}`} aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined}>{n}</button>
                ) : (
                  <span key={n} className="hidden sm:block w-6 text-center text-gray-400" aria-hidden="true">…</span>
                )))}
                <button disabled={page >= data.pages} onClick={() => goPage(page + 1)} className="w-10 h-10 shrink-0 rounded-full bg-chatim-paper border border-pink-100 disabled:opacity-40" aria-label="Next page"><i className="fa-solid fa-chevron-right text-xs" /></button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sheet ? '' : 'pointer-events-none'}`}>
        <div onClick={() => setSheet(false)} className={`absolute inset-0 bg-black/40 transition-opacity ${sheet ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute bottom-0 inset-x-0 max-h-[85vh] bg-chatim-paper rounded-t-3xl flex flex-col transition-transform duration-300 ${sheet ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-serif text-lg font-medium">Filters</h3>
            <button onClick={() => setSheet(false)} className="w-8 h-8 rounded-full bg-gray-100" aria-label="Close filters"><i className="fa-solid fa-xmark" /></button>
          </div>
          <div className="overflow-y-auto p-6"><Filters params={params} update={update} facets={facets.data} /></div>
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button onClick={clearAll} className="btn-outline flex-1">Clear</button>
            <button onClick={() => setSheet(false)} className="btn-primary flex-1">Show {data?.total ?? ''} results</button>
          </div>
        </div>
      </div>
    </div>
  );
}
