import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate, fmtDateTime, inr } from '../../lib/api';
import { Badge, Img, Spinner } from '../../components/ui';
import { PageHead } from './AdminApp';

const ROSE = '#C24E17';

function Kpi({ label, value, delta, icon, sub }) {
  return (
    <div className="bg-chatim-paper rounded-2xl border border-pink-100 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <span className="w-8 h-8 rounded-lg bg-chatim-peach text-chatim-clayDark flex items-center justify-center text-xs"><i className={`fa-solid ${icon}`} /></span>
      </div>
      <p className="font-serif text-3xl font-medium text-chatim-ink mt-2">{value}</p>
      <p className="text-xs mt-1 text-gray-500">
        {delta != null && Number.isFinite(delta) && (
          <span className={`font-semibold mr-1 ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <i className={`fa-solid ${delta >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} mr-0.5`} />{delta >= 0 ? '+' : ''}{delta.toFixed(0)}%
          </span>
        )}
        {sub}
      </p>
    </div>
  );
}

/** Single-series vertical bar chart (one hue, rounded data-ends, hover tooltip). */
function RevenueChart({ series }) {
  const [hover, setHover] = useState(null);
  const W = 700; const H = 240; const pad = { l: 48, r: 8, t: 12, b: 28 };
  const max = Math.max(1000, ...series.map((d) => d.revenue));
  const step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
  const top = Math.ceil(max / step) * step;
  const ticks = [0, top / 2, top];
  const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b;
  const bw = iw / series.length; const barW = Math.max(6, Math.min(22, bw - 8));
  const y = (v) => pad.t + ih - (v / top) * ih;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Daily revenue, last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#f1e4e8" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{t >= 1000 ? `₹${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `₹${t}`}</text>
          </g>
        ))}
        {series.map((d, i) => {
          const cx = pad.l + bw * i + bw / 2;
          const h = Math.max(d.revenue ? 2 : 0, ih - (y(d.revenue) - pad.t));
          const x = cx - barW / 2; const yy = pad.t + ih - h; const r = Math.min(4, barW / 2, h);
          const path = h > 0 ? `M${x},${pad.t + ih} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${pad.t + ih} Z` : '';
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + bw * i} y={pad.t} width={bw} height={ih} fill="transparent" />
              {path && <path d={path} fill={ROSE} opacity={hover == null || hover === i ? 1 : 0.45} />}
              {(i % 2 === 0 || series.length < 10) && <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">{fmtDate(d.day, { day: 'numeric', month: 'short' })}</text>}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="#e5d5da" strokeWidth="1" />
      </svg>
      {hover != null && (
        <div className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-soft -translate-x-1/2 -translate-y-full"
          style={{ left: `${((pad.l + bw * hover + bw / 2) / W) * 100}%`, top: `${(y(series[hover].revenue) / H) * 100}%`, marginTop: -8 }}>
          <p className="font-semibold">{fmtDate(series[hover].day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="text-white/80">{inr(series[hover].revenue)} · {series[hover].orders} order{series[hover].orders === 1 ? '' : 's'}</p>
        </div>
      )}
    </div>
  );
}

function CategoryBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const total = data.reduce((s, d) => s + d.revenue, 0) || 1;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.name} className="group" title={`${d.name}: ${inr(d.revenue)}`}>
          <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700">{d.name}</span><span className="text-gray-500">{inr(d.revenue)} · {Math.round((d.revenue / total) * 100)}%</span></div>
          <div className="h-2.5 rounded-full bg-pink-50"><div className="h-full rounded-full transition-all group-hover:brightness-110" style={{ width: `${(d.revenue / max) * 100}%`, background: ROSE }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard({ stats }) {
  const [table, setTable] = useState(false);
  if (stats.isLoading) return <div className="py-24 text-center"><Spinner className="text-chatim-clay text-2xl" /></div>;
  if (stats.error) return <p className="text-red-500">{stats.error.message}</p>;
  const s = stats.data;
  const pct = (a, b) => (b ? ((a - b) / b) * 100 : null);
  const rev14 = s.series.reduce((n, d) => n + d.revenue, 0);
  return (
    <>
      <PageHead title="Dashboard" sub={`Overview as of ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
        <Link to="/admin/products?new=1" className="btn-primary !py-2.5"><i className="fa-solid fa-plus" /> Add product</Link>
      </PageHead>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Kpi label="Revenue (30 days)" value={inr(s.last30.revenue)} delta={pct(s.last30.revenue, s.prev30.revenue)} sub={s.prev30.revenue ? 'vs previous 30 days' : 'all-time ' + inr(s.kpi.revenue)} icon="fa-indian-rupee-sign" />
        <Kpi label="Orders (30 days)" value={s.last30.orders} delta={pct(s.last30.orders, s.prev30.orders)} sub={`${s.kpi.orders} all-time`} icon="fa-receipt" />
        <Kpi label="Average order value" value={inr(s.kpi.aov)} sub="across all orders" icon="fa-scale-balanced" />
        <Kpi label="Customers" value={s.customers} sub={`${s.subscribers} newsletter · ${s.newInquiries} new leads`} icon="fa-users" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mb-6">
        <section className="xl:col-span-2 bg-chatim-paper rounded-2xl border border-pink-100 p-5">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="font-semibold text-chatim-ink">Daily revenue</h2><p className="text-xs text-gray-500">Last 14 days · {inr(rev14)} total</p></div>
            <button onClick={() => setTable(!table)} className="text-xs font-semibold text-chatim-clayDark hover:underline">{table ? 'View chart' : 'View as table'}</button>
          </div>
          {table ? (
            <div className="max-h-64 overflow-y-auto"><table className="w-full text-xs"><thead className="text-gray-500 text-left"><tr><th className="py-1.5">Date</th><th className="text-right">Orders</th><th className="text-right">Revenue</th></tr></thead>
              <tbody>{s.series.map((d) => <tr key={d.day} className="border-t border-pink-50"><td className="py-1.5">{fmtDate(d.day)}</td><td className="text-right">{d.orders}</td><td className="text-right">{inr(d.revenue)}</td></tr>)}</tbody></table></div>
          ) : <RevenueChart series={s.series} />}
        </section>
        <section className="bg-chatim-paper rounded-2xl border border-pink-100 p-5">
          <h2 className="font-semibold text-chatim-ink">Revenue by category</h2>
          <p className="text-xs text-gray-500 mb-5">All-time, excluding cancelled</p>
          <CategoryBars data={s.byCategory} />
          <div className="mt-6 pt-4 border-t border-pink-50 flex flex-wrap gap-2">
            {s.byStatus.map((x) => <Badge key={x.status} status={x.status}>{x.status} · {x.count}</Badge>)}
          </div>
        </section>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-chatim-paper rounded-2xl border border-pink-100 p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-chatim-ink">Recent orders</h2><Link to="/admin/orders" className="text-xs font-semibold text-chatim-clayDark hover:underline">View all</Link></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500"><th className="pb-2 font-medium">Order</th><th className="pb-2 font-medium">Customer</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium text-right">Total</th></tr></thead>
              <tbody>
                {s.recent.map((o) => (
                  <tr key={o.orderNumber} className="border-t border-pink-50">
                    <td className="py-2.5"><Link to={`/admin/orders?q=${o.orderNumber}`} className="font-semibold hover:text-chatim-clayDark">#{o.orderNumber}</Link><p className="text-[11px] text-gray-400">{fmtDateTime(o.createdAt)}</p></td>
                    <td>{o.name}</td>
                    <td><Badge status={o.status} /></td>
                    <td className="text-right font-semibold">{inr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="space-y-6">
          <section className="bg-chatim-paper rounded-2xl border border-pink-100 p-5">
            <h2 className="font-semibold text-chatim-ink mb-4">Top products</h2>
            <ul className="space-y-3">
              {s.topProducts.map((p, i) => (
                <li key={p.id ?? i} className="flex items-center gap-3">
                  <Img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-pink-50" />
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{p.name}</p><p className="text-[11px] text-gray-500">{p.units} sold</p></div>
                  <span className="text-xs font-semibold">{inr(p.revenue)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-chatim-paper rounded-2xl border border-pink-100 p-5">
            <h2 className="font-semibold text-chatim-ink mb-1">Low stock</h2>
            <p className="text-xs text-gray-500 mb-3">8 units or fewer</p>
            {s.lowStock.length === 0 ? <p className="text-xs text-gray-500">All products are well stocked.</p> : (
              <ul className="space-y-2">{s.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <Link to={`/admin/products?edit=${p.id}`} className="truncate hover:text-chatim-clayDark pr-2">{p.name}</Link>
                  <span className={`chip ${p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}><i className={`fa-solid ${p.stock === 0 ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}`} />{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
                </li>
              ))}</ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
