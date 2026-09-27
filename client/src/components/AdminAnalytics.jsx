import { useEffect, useRef } from 'react'

// ─── colour palette ────────────────────────────────────────────────────────
const PALETTE = ['#f97316','#6366f1','#22c55e','#ec4899','#14b8a6','#eab308','#a855f7','#ef4444','#0ea5e9','#84cc16']

const fmtINR   = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const fmtMonth = (m) => {
  const [y, mo] = m.split('-')
  const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${mn[+mo - 1]} '${y.slice(2)}`
}

// ─── Donut Chart ───────────────────────────────────────────────────────────
const DonutChart = ({ data, colors = PALETTE, title, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <p className="text-xs text-gray-400 text-center py-8">No data yet</p>

  let cum = 0
  const R = 60, CX = 70, CY = 70, STROKE = 22
  const circumference = 2 * Math.PI * R
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const offset = circumference * (1 - cum)
    cum += pct
    return { ...d, pct, offset, dash: circumference * pct - 1.5, color: colors[i % colors.length] }
  })

  return (
    <div className="flex gap-4 items-center flex-wrap">
      <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {slices.map((sl, i) => (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={sl.color}
              strokeWidth={STROKE}
              strokeDasharray={`${sl.dash} ${circumference - sl.dash}`}
              strokeDashoffset={sl.offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px`, transition: 'stroke-dasharray 0.6s ease' }}
            />
          ))}
          <circle cx={CX} cy={CY} r={R - STROKE / 2 - 2} fill="white" />
          {centerLabel && (
            <>
              <text x={CX} y={CY - 6} textAnchor="middle" fontSize="11" fill="#6b7280">{centerLabel.sub}</text>
              <text x={CX} y={CY + 10} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">{centerLabel.main}</text>
            </>
          )}
        </svg>
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((sl, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: sl.color }} />
            <span className="text-gray-600 truncate flex-1">{sl.label}</span>
            <span className="font-semibold text-gray-800 shrink-0">
              {sl.display ?? sl.value}
              <span className="text-gray-400 font-normal ml-1">({(sl.pct * 100).toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Horizontal Progress Bar ───────────────────────────────────────────────
const HBarChart = ({ data, color = '#f97316', valueFormatter }) => {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 truncate max-w-[58%]">{d.label}</span>
            <span className="font-semibold text-gray-800">{valueFormatter ? valueFormatter(d.value) : d.value}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Grouped Bar (Revenue + Orders) ───────────────────────────────────────
const RevenueOrdersBar = ({ data }) => {
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  const maxOrd = Math.max(...data.map(d => d.orders), 1)
  const BAR_H  = 120

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-4 pb-2" style={{ minWidth: data.length * 72 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[64px]">
            {/* revenue value label */}
            <span className="text-[10px] text-orange-500 font-semibold">{fmtINR(d.revenue)}</span>
            <div className="flex items-end gap-1.5 w-full justify-center" style={{ height: BAR_H }}>
              {/* Revenue bar */}
              <div
                className="rounded-t-sm transition-all duration-700 cursor-default group relative"
                style={{ width: 18, height: Math.max((d.revenue / maxRev) * BAR_H, 4), background: '#f97316' }}
                title={`Revenue: ${fmtINR(d.revenue)}`}
              />
              {/* Orders bar */}
              <div
                className="rounded-t-sm transition-all duration-700 cursor-default"
                style={{ width: 18, height: Math.max((d.orders / maxOrd) * BAR_H, 4), background: '#6366f1' }}
                title={`Orders: ${d.orders}`}
              />
            </div>
            <span className="text-[10px] text-gray-500 whitespace-nowrap">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Rating vs Price Scatter ───────────────────────────────────────────────
const RatingPriceScatter = ({ products }) => {
  const W = 360, H = 200, PAD = { t: 10, r: 10, b: 32, l: 52 }
  if (!products?.length) return <p className="text-xs text-gray-400 text-center py-8">No product data</p>

  const maxPrice = Math.max(...products.map(p => p.avgPrice), 1)
  const toX = (v) => PAD.l + ((v / maxPrice) * (W - PAD.l - PAD.r))
  const toY = (v) => PAD.t + ((1 - v / 5) * (H - PAD.t - PAD.b))

  const yTicks = [1, 2, 3, 4, 5]
  const xTicks = [0, Math.round(maxPrice / 2), Math.round(maxPrice)]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* grid */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={PAD.l} y1={toY(t)} x2={W - PAD.r} y2={toY(t)} stroke="#f3f4f6" strokeWidth="1" />
          <text x={PAD.l - 6} y={toY(t) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{t}★</text>
        </g>
      ))}
      {xTicks.map(t => (
        <g key={t}>
          <line x1={toX(t)} y1={PAD.t} x2={toX(t)} y2={H - PAD.b} stroke="#f3f4f6" strokeWidth="1" />
          <text x={toX(t)} y={H - PAD.b + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {t === 0 ? '₹0' : `₹${(t / 1000).toFixed(0)}k`}
          </text>
        </g>
      ))}
      {/* dots */}
      {products.map((p, i) => (
        <g key={i}>
          <circle
            cx={toX(p.avgPrice)}
            cy={toY(p.avgRating)}
            r={Math.min(Math.max(p.count * 2.5, 5), 18)}
            fill={PALETTE[i % PALETTE.length]}
            fillOpacity="0.75"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <title>{p._id}: {p.count} products, avg ₹{Math.round(p.avgPrice)}, avg ★{p.avgRating?.toFixed(1)}</title>
        </g>
      ))}
      {/* axis labels */}
      <text x={PAD.l - 2} y={PAD.t - 2} fontSize="9" fill="#9ca3af">Rating</text>
      <text x={W - PAD.r} y={H - PAD.b + 28} textAnchor="end" fontSize="9" fill="#9ca3af">Avg Price →</text>
    </svg>
  )
}

// ─── User Growth Area Bar ──────────────────────────────────────────────────
const UserGrowthBars = ({ data }) => {
  if (!data?.length) return <p className="text-xs text-gray-400 text-center py-8">No user data yet</p>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-32 overflow-x-auto pb-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-[48px] flex-1">
          <span className="text-[10px] font-semibold text-emerald-600">{d.count}</span>
          <div
            className="w-full rounded-t transition-all duration-700"
            style={{ height: `${Math.max((d.count / max) * 100, 6)}px`, background: 'linear-gradient(180deg,#4ade80,#16a34a)' }}
          />
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{fmtMonth(d._id)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────
const AdminAnalytics = ({ analytics, stats }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  const totalRevenue = analytics.revenueByMonth.reduce((s, m) => s + m.revenue, 0)
  const totalOrders  = analytics.ordersByStatus.reduce((s, o) => s + o.count, 0)

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',    value: fmtINR(totalRevenue), icon: '💰', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Orders',     value: totalOrders,           icon: '📦', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Products Listed',  value: stats?.totalProducts || 0, icon: '🛍️', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Registered Users', value: stats?.totalUsers || 0,    icon: '👥', color: 'text-pink-600',  bg: 'bg-pink-50'  },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 flex items-center gap-3 border border-white shadow-sm`}>
            <span className="text-3xl">{k.icon}</span>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{k.label}</p>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue & Orders Grouped Bar ── */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Revenue &amp; Orders — Last 6 Months</h3>
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />Revenue</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />Orders</span>
          </div>
        </div>
        {analytics.revenueByMonth.length === 0
          ? <p className="text-sm text-gray-400 py-8 text-center">No order data yet</p>
          : <RevenueOrdersBar data={analytics.revenueByMonth.map(m => ({
              label: fmtMonth(m._id), revenue: m.revenue, orders: m.count
            }))} />
        }
      </div>

      {/* ── Three Donut Charts ── */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Orders by Status</h3>
          <DonutChart
            data={analytics.ordersByStatus.map(o => ({ label: o._id || 'Unknown', value: o.count }))}
            colors={PALETTE}
            centerLabel={{ sub: 'total', main: totalOrders }}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Payment Status</h3>
          <DonutChart
            data={analytics.ordersByPayment.map(o => ({ label: o._id || 'Unknown', value: o.count }))}
            colors={['#22c55e','#f97316','#ef4444','#6366f1']}
            centerLabel={{ sub: 'statuses', main: analytics.ordersByPayment.length }}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Products by Category</h3>
          <DonutChart
            data={analytics.productsByCategory.map(p => ({ label: p._id || 'Other', value: p.count }))}
            colors={PALETTE}
            centerLabel={{ sub: 'products', main: stats?.totalProducts || 0 }}
          />
        </div>
      </div>

      {/* ── Top Products + Rating Distribution ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">🏆 Top 5 Selling Products</h3>
          <HBarChart
            data={analytics.topProducts.map(p => ({ label: p.name, value: p.sold }))}
            color="#f97316"
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">⭐ Rating Distribution</h3>
          <HBarChart
            data={[1,2,3,4,5].map(star => {
              const found = analytics.ratingDist.find(r => r._id === star)
              return { label: `${star} Star${star > 1 ? 's' : ''}`, value: found?.count || 0 }
            })}
            color="#eab308"
          />
        </div>
      </div>

      {/* ── Rating vs Price Scatter + Category Table ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-1">💡 Rating vs Price (by Category)</h3>
          <p className="text-xs text-gray-400 mb-3">Bubble size = number of products</p>
          <RatingPriceScatter products={analytics.productsByCategory} />
          {/* legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {analytics.productsByCategory.map((p, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: PALETTE[i % PALETTE.length] }} />
                {p._id}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📋 Category Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Category', 'Products', 'Avg Price', 'Avg ★'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-gray-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.productsByCategory.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="font-medium text-gray-800">{c._id || 'Other'}</span>
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-600">{c.count}</td>
                    <td className="py-2 px-2 text-gray-600">{fmtINR(c.avgPrice)}</td>
                    <td className="py-2 px-2">
                      <span className="flex items-center gap-0.5">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-gray-700">{(c.avgRating || 0).toFixed(1)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── User Growth ── */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">👥 New User Registrations — Last 6 Months</h3>
        <UserGrowthBars data={analytics.usersByMonth} />
      </div>

    </div>
  )
}

export default AdminAnalytics
