import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import { getFallbackByCategory, getImageSrc, formatPrice } from '../utils/imageUtils'
import ProductCard from '../components/ProductCard'
import UserAnalytics from '../components/UserAnalytics'

const fmtPrice = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const STATUS_COLOR = {
  Delivered:  'bg-green-100 text-green-700',
  Pending:    'bg-yellow-100 text-yellow-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped:    'bg-indigo-100 text-indigo-700',
  Cancelled:  'bg-red-100 text-red-700',
}

const CustomerDashboard = () => {
  const { user } = useAuth()
  const [cartItems, setCartItems]                   = useState([])
  const [orders, setOrders]                         = useState([])
  const [analytics, setAnalytics]                   = useState(null)
  const [recommendations, setRecommendations]       = useState([])
  const [recLoading, setRecLoading]                 = useState(false)
  const [analyticsLoading, setAnalyticsLoading]     = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartRes, ordersRes, analyticsRes] = await Promise.all([
          apiClient.get('/api/cart'),
          apiClient.get('/api/orders/myorders'),
          apiClient.get('/api/analytics/user'),
        ])
        setCartItems(cartRes.data?.items || [])
        setOrders(ordersRes.data || [])
        setAnalytics(analyticsRes.data || null)
      } catch (error) {
        console.error('Customer dashboard error:', error)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const uid = user?._id || user?.id
    if (!uid) return
    setRecLoading(true)
    apiClient
      .get(`/api/recommend/user/${uid}`)
      .then((res) => setRecommendations(res.data?.recommendations || []))
      .catch(() => setRecommendations([]))
      .finally(() => setRecLoading(false))
  }, [user])

  const totalCartValue = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, <span className="font-semibold text-gray-700">{user?.name || 'Customer'}</span>
        </p>
      </div>

      {/* ── Quick nav ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/products', icon: '🛍️', label: 'Browse Products', sub: 'Explore categories' },
          { to: '/cart',     icon: '🛒', label: 'Your Cart',       sub: `${cartItems.reduce((s, i) => s + i.quantity, 0)} items — ${fmtPrice(totalCartValue)}` },
          { to: '/orders',   icon: '📦', label: 'My Orders',       sub: `${orders.length} total orders` },
          { to: '/profile',  icon: '👤', label: 'Profile',         sub: 'Account settings' },
        ].map(c => (
          <Link key={c.to} to={c.to} className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition flex items-start gap-3">
            <span className="text-2xl">{c.icon}</span>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm">{c.label}</p>
              <p className="text-xs text-gray-500 truncate">{c.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Purchase Analytics ── */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 My Purchase Analytics</h2>
        {analyticsLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <UserAnalytics analytics={analytics} orders={orders} cartItems={cartItems} />
        )}
      </div>

      {/* ── Recent Orders ── */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Recent Orders</h2>
      <div className="bg-white rounded-xl shadow p-5 mb-8">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders placed yet.</p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-auto">
            {orders.slice(0, 5).map(o => (
              <div key={o._id} className="flex items-center justify-between border-b border-gray-50 pb-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">#{o._id.slice(-8)}</p>
                  <p className="text-xs text-gray-500">Tracking: {o.trackingId || 'N/A'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                  {o.status}
                </span>
                <span className="text-sm font-bold text-orange-600 shrink-0">{fmtPrice(o.totalPrice)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cart snapshot ── */}
      {cartItems.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🛒 Cart Snapshot</h2>
          <div className="bg-white rounded-xl shadow p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">{cartItems.reduce((s, i) => s + i.quantity, 0)} items</p>
              <p className="font-bold text-orange-600">{fmtPrice(totalCartValue)}</p>
            </div>
            <div className="space-y-2 max-h-44 overflow-auto">
              {cartItems.map(item => (
                <div key={item._id} className="flex items-center gap-3 border rounded-lg p-2">
                  <img
                    src={getImageSrc(item.image, item.category)}
                    alt={item.name}
                    className="h-10 w-10 rounded object-cover shrink-0"
                    onError={e => { e.currentTarget.src = getFallbackByCategory(item.category) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} · {fmtPrice(item.price)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-700 shrink-0">{fmtPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Recommendations ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">✨ Recommended for You</h2>
        <Link to="/products" className="text-sm font-semibold text-orange-600 hover:text-orange-700">Shop more</Link>
      </div>
      {recLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {recommendations.slice(0, 8).map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      ) : (
        <p className="text-sm text-gray-500 bg-white border border-gray-100 rounded-xl p-6">
          Recommendations load when the ML service (port 8000) is running.
        </p>
      )}
    </div>
  )
}

export default CustomerDashboard
