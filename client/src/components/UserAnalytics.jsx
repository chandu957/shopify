// ─── colour palette ────────────────────────────────────────────────────────
const PALETTE = ['#f97316','#6366f1','#22c55e','#ec4899','#14b8a6','#eab308','#a855f7','#ef4444','#0ea5e9','#84cc16']
const fmtINR  = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

// ─── Donut Chart ───────────────────────────────────────────────────────────
const DonutChart = ({ data, colors = PALETTE, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <p className="text-xs text-gray-400 text-center py-8">No data yet</p>

  let cum = 0
  const R = 55, CX = 65, CY = 65, STROKE = 20
  const circumference = 2 * Math.PI * R

  const slices = data.map((d, i) => {
    const pct = d.value / total
    const offset = circumference * (1 - cum)
    cum += pct
    return { ...d, pct, offset, dash: circumference * pct - 1.5, color: colors[i % colors.length] }
  })

  return (
    <div className="flex gap-4 items-center flex-wrap">
      <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
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
              <text x={CX} y={CY - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">{centerLabel.sub}</text>
              <text x={CX} y={CY + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">{centerLabel.main}</text>
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
              <span className="text-gray-400 font-normal ml-1">({(sl.pct * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Horizontal Bar ────────────────────────────────────────────────────────
const HBar = ({ data, color = '#f97316', valueFormatter }) => {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 truncate max-w-[55%]">{d.label}</span>
            <span className="font-semibold text-gray-800">{valueFormatter ? valueFormatter(d.value) : d.value}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Spending Bars (vertical) ──────────────────────────────────────────────
const SpendingBars = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-36 overflow-x-auto pb-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-[52px] flex-1">
          <span className="text-[10px] font-semibold text-orange-500">{fmtINR(d.value)}</span>
          <div
            className="w-full rounded-t transition-all duration-700"
            style={{
              height: `${Math.max((d.value / max) * 104, 4)}px`,
              background: 'linear-gradient(180deg,#fb923c,#ea580c)',
            }}
          />
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Mini Stat Card ────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className={`rounded-xl p-4 flex items-center gap-3 border border-white shadow-sm ${color}`}>
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
)

// ─── Main Export ───────────────────────────────────────────────────────────
const UserAnalytics = ({ analytics, orders, cartItems }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  const spendingMonthData = Object.entries(analytics.spendingByMonth).map(([k, v]) => ({ label: k, value: v }))
  const categoryPieData   = Object.entries(analytics.spendingByCategory).map(([k, v]) => ({
    label: k, value: v, display: fmtINR(v),
  }))
  const statusPieData     = Object.entries(analytics.ordersByStatus).map(([k, v]) => ({ label: k, value: v }))
  const totalCartVal      = (cartItems || []).reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📦" label="Total Orders"    value={analytics.totalOrders ?? orders?.length ?? 0} color="bg-indigo-50" />
        <StatCard icon="💰" label="Total Spent"     value={fmtINR(analytics.totalSpend)}                 color="bg-orange-50" />
        <StatCard icon="📈" label="Avg Order Value" value={fmtINR(analytics.avgOrderValue)}               color="bg-green-50" />
        <StatCard icon="🛒" label="Cart Value"      value={fmtINR(totalCartVal)}
          sub={`${(cartItems || []).reduce((s, i) => s + i.quantity, 0)} items`}                          color="bg-pink-50" />
      </div>

      {/* ── Monthly Spend + Category Donut ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📅 Monthly Spending</h3>
          {spendingMonthData.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
            : <SpendingBars data={spendingMonthData} />
          }
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">🎪 Spending by Category</h3>
          <DonutChart
            data={categoryPieData}
            colors={PALETTE}
            centerLabel={{ sub: 'total', main: fmtINR(analytics.totalSpend) }}
          />
        </div>
      </div>

      {/* ── Order Status Donut + Top Categories Bar ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📦 My Orders by Status</h3>
          <DonutChart
            data={statusPieData}
            colors={['#22c55e','#f97316','#6366f1','#14b8a6','#ef4444']}
            centerLabel={{ sub: 'orders', main: analytics.totalOrders ?? 0 }}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">🎯 Top Spending Categories</h3>
          {(analytics.topCategories || []).length === 0
            ? <p className="text-xs text-gray-400 text-center py-8">No purchases yet</p>
            : <HBar
                data={(analytics.topCategories || []).map(c => ({ label: c.category, value: c.amount }))}
                color="#6366f1"
                valueFormatter={fmtINR}
              />
          }
        </div>
      </div>

      {/* ── Category Spend Share — pill bar ── */}
      {categoryPieData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📊 Category Spend Share</h3>
          <div className="flex rounded-full overflow-hidden h-5 mb-3">
            {categoryPieData.map((d, i) => {
              const total = categoryPieData.reduce((s, x) => s + x.value, 0)
              const pct = total ? (d.value / total) * 100 : 0
              return (
                <div
                  key={i}
                  style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length], minWidth: pct > 1 ? 2 : 0 }}
                  title={`${d.label}: ${pct.toFixed(1)}%`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {categoryPieData.map((d, i) => {
              const total = categoryPieData.reduce((s, x) => s + x.value, 0)
              const pct   = total ? (d.value / total) * 100 : 0
              return (
                <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                  {d.label}
                  <span className="text-gray-400">({pct.toFixed(1)}%)</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

export default UserAnalytics
