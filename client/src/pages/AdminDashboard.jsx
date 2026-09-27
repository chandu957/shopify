import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { getFallbackByCategory, getImageSrc, formatPrice } from '../utils/imageUtils'
import SimpleBarChart from '../components/SimpleBarChart'
import AdminAnalytics from '../components/AdminAnalytics'

const initialForm = {
  name: '', description: '', price: '', category: 'Electronics',
  stock: 0, image: '', rating: 0, numReviews: 0, tags: '',
}

const TABS = ['Overview', 'Analytics', 'Products', 'Orders', 'Users', 'Support Tickets']

const STATUS_COLORS = {
  pending:     'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved:    'bg-green-100 text-green-800',
  closed:      'bg-gray-100 text-gray-600',
}

const REASON_COLORS = {
  severe_complaint:  'bg-red-100 text-red-700',
  no_answer_found:   'bg-orange-100 text-orange-700',
  no_match:          'bg-orange-100 text-orange-700',
  unresolved:        'bg-yellow-100 text-yellow-700',
  off_topic_question:'bg-purple-100 text-purple-700',
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [stats, setStats]         = useState({})
  const [products, setProducts]   = useState([])
  const [users, setUsers]         = useState([])
  const [orders, setOrders]       = useState([])
  const [tickets, setTickets]     = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm]           = useState(initialForm)
  const [error, setError]         = useState('')
  const [ticketFilter, setTicketFilter] = useState('all')

  const fetchAll = async () => {
    try {
      const [statsRes, productsRes, usersRes, ordersRes] = await Promise.all([
        apiClient.get('/api/analytics/dashboard'),
        apiClient.get('/api/products'),
        apiClient.get('/api/users'),
        apiClient.get('/api/orders'),
      ])
      setStats(statsRes.data)
      setProducts(productsRes.data)
      setUsers(usersRes.data || [])
      setOrders(ordersRes.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get('/api/chat/tickets')
      setTickets(res.data || [])
    } catch (e) {
      setError('Failed to load support tickets')
    }
  }

  useEffect(() => { fetchAll() }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient.get('/api/analytics/admin')
      setAnalytics(res.data)
    } catch (e) {
      setError('Failed to load analytics')
    }
  }

  useEffect(() => {
    if (activeTab === 'Support Tickets') fetchTickets()
    if (activeTab === 'Analytics') fetchAnalytics()
  }, [activeTab])

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const startEdit = (product) => {
    setEditingId(product._id)
    setForm({
      name: product.name || '', description: product.description || '',
      price: product.price ?? '', category: product.category || 'Electronics',
      stock: product.stock ?? 0, image: product.image || '',
      rating: product.rating ?? 0, numReviews: product.numReviews ?? 0,
      tags: (product.tags || []).join(', '),
    })
    setActiveTab('Products')
  }

  const resetForm = () => { setEditingId(''); setForm(initialForm) }

  const saveProduct = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    const payload = {
      ...form, price: Number(form.price), stock: Number(form.stock),
      rating: Number(form.rating), numReviews: Number(form.numReviews),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    try {
      if (editingId) await apiClient.put(`/api/products/${editingId}`, payload)
      else await apiClient.post('/api/products', payload)
      resetForm(); await fetchAll()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save product')
    } finally { setSaving(false) }
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try { await apiClient.delete(`/api/products/${id}`); await fetchAll() }
    catch (e) { setError(e.response?.data?.message || 'Failed to delete product') }
  }

  const updateOrderStatus = async (orderId, status) => {
    try { await apiClient.put(`/api/orders/${orderId}/status`, { status }); await fetchAll() }
    catch (e) { setError(e.response?.data?.message || 'Failed to update order') }
  }

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    try { await apiClient.put(`/api/orders/${orderId}/payment`, { paymentStatus }); await fetchAll() }
    catch (e) { setError(e.response?.data?.message || 'Failed to update payment') }
  }

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await apiClient.put(`/api/chat/tickets/${ticketId}`, { status })
      await fetchTickets()
    } catch (e) { setError('Failed to update ticket') }
  }

  const filteredTickets = ticketFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === ticketFilter)

  const pendingTickets = tickets.filter(t => t.status === 'pending').length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Loading dashboard...
    </div>
  )

  const categoryCounts = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'].map(c => ({
    label: c, value: products.filter(p => p.category === c).length,
  }))
  const orderStatusCounts = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => ({
    label: s, value: orders.filter(o => o.status === s).length,
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        {activeTab === 'Products' && (
          <button onClick={resetForm} className="btn-primary px-5 py-2">
            {editingId ? 'Add New Product' : 'Clear Form'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white border border-b-white border-gray-200 text-orange-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'Support Tickets' && pendingTickets > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingTickets}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'Overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users',    value: stats.totalUsers    || 0 },
              { label: 'Total Products', value: stats.totalProducts || 0 },
              { label: 'Total Orders',   value: orders.length       || 0 },
              { label: 'Open Tickets',   value: pendingTickets, urgent: pendingTickets > 0 },
            ].map(s => (
              <div key={s.label} className={`bg-white p-4 rounded-lg shadow ${s.urgent ? 'border-l-4 border-red-500' : ''}`}>
                <p className="text-sm text-gray-600">{s.label}</p>
                <p className={`text-2xl font-bold ${s.urgent ? 'text-red-600' : ''}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <SimpleBarChart title="Products by Category" data={categoryCounts} color="bg-indigo-500" />
            <SimpleBarChart title="Orders by Status" data={orderStatusCounts} color="bg-rose-500" />
          </div>
        </>
      )}

      {/* ── ANALYTICS TAB — powered by AdminAnalytics component ── */}
      {activeTab === 'Analytics' && (
        <AdminAnalytics analytics={analytics} stats={stats} />
      )}

      {/* ── PRODUCTS TAB ── */}
      {activeTab === 'Products' && (
        <div className="grid lg:grid-cols-5 gap-8">
          <form onSubmit={saveProduct} className="lg:col-span-2 bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            <input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Product name" className="w-full border rounded-lg p-3" required />
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Description" className="w-full border rounded-lg p-3 h-24" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)} placeholder="Price" className="w-full border rounded-lg p-3" required />
              <input type="number" value={form.stock} onChange={e => handleChange('stock', e.target.value)} placeholder="Stock" className="w-full border rounded-lg p-3" required />
            </div>
            <select value={form.category} onChange={e => handleChange('category', e.target.value)} className="w-full border rounded-lg p-3">
              {['Electronics','Fashion','Home','Sports','Books'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={form.image} onChange={e => handleChange('image', e.target.value)} placeholder="Image URL (optional)" className="w-full border rounded-lg p-3" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => handleChange('rating', e.target.value)} placeholder="Rating 0-5" className="w-full border rounded-lg p-3" />
              <input type="number" min="0" value={form.numReviews} onChange={e => handleChange('numReviews', e.target.value)} placeholder="Reviews count" className="w-full border rounded-lg p-3" />
            </div>
            <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="Tags comma separated" className="w-full border rounded-lg p-3" />
            <button type="submit" disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
            </button>
          </form>
          <div className="lg:col-span-3 space-y-4">
            {products.map(product => (
              <div key={product._id} className="bg-white rounded-xl shadow p-4 flex gap-4">
                <img src={getImageSrc(product.image, product.category)} alt={product.name}
                  onError={e => { e.currentTarget.src = getFallbackByCategory(product.category) }}
                  className="w-24 h-24 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <p className="text-sm mt-1">{formatPrice(product.price)} | Stock: {product.stock} | ⭐ {product.rating || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{product.tags?.join(', ') || 'No tags'}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => startEdit(product)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Edit</button>
                  <button onClick={() => deleteProduct(product._id)} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'Orders' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Order Management</h2>
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {orders.map(o => (
              <div key={o._id} className="border rounded-lg p-3">
                <div className="flex justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold">#{o._id.slice(-8)} — {o.user?.name || 'Customer'}</p>
                    <p className="text-sm text-gray-600">{o.user?.email || ''}</p>
                  </div>
                  <p className="font-bold">{formatPrice(o.totalPrice)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={o.status} onChange={e => updateOrderStatus(o._id, e.target.value)} className="border rounded p-2 text-sm">
                    {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={o.paymentStatus} onChange={e => updatePaymentStatus(o._id, e.target.value)} className="border rounded p-2 text-sm">
                    {['Pending','Paid','Failed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2">Tracking: {o.trackingId || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'Users' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">User Management</h2>
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {users.map(u => (
              <div key={u._id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-gray-600">{u.email}</p>
                  {u.phone && <p className="text-xs text-gray-500">{u.phone}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUPPORT TICKETS TAB ── */}
      {activeTab === 'Support Tickets' && (
        <div>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            {['all', 'pending', 'in_progress', 'resolved', 'closed'].map(f => (
              <button
                key={f}
                onClick={() => setTicketFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  ticketFilter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? `All (${tickets.length})` : `${f.replace('_', ' ')} (${tickets.filter(t => t.status === f).length})`}
              </button>
            ))}
            <button onClick={fetchTickets} className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline">
              Refresh
            </button>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-lg font-medium">No tickets here</p>
              <p className="text-sm">All clear!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket._id}
                  className={`bg-white rounded-xl shadow p-5 border-l-4 ${
                    ticket.reason === 'severe_complaint'
                      ? 'border-red-500'
                      : ticket.status === 'pending'
                      ? 'border-yellow-400'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {ticket.reason === 'severe_complaint' && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                          🚨 URGENT
                        </span>
                      )}
                      <p className="font-semibold text-gray-900 mb-1 break-words">"{ticket.message}"</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Intent: {ticket.intent || 'unknown'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${REASON_COLORS[ticket.reason] || 'bg-gray-100 text-gray-600'}`}>
                          {ticket.reason?.replace(/_/g, ' ') || 'unresolved'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {ticket.timestamp
                            ? new Date(ticket.timestamp).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      {ticket.user ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {ticket.user.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{ticket.user.name}</p>
                            <p className="text-xs text-gray-500">{ticket.user.email}</p>
                            {ticket.user.phone && <p className="text-xs text-gray-500">📞 {ticket.user.phone}</p>}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-400 italic">
                          Guest user (not logged in)
                          {ticket.user_id && <span className="ml-2 text-xs font-mono text-gray-300">ID: {ticket.user_id}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
                        {ticket.status?.replace('_', ' ') || 'pending'}
                      </span>
                      <select
                        value={ticket.status || 'pending'}
                        onChange={e => updateTicketStatus(ticket._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
