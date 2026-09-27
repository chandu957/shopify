import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { getFallbackByCategory, getImageSrc, formatPrice } from '../utils/imageUtils'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewDrafts, setReviewDrafts] = useState({})

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/api/orders/myorders')
      setOrders(res.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const setDraft = (productId, key, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [productId]: {
        rating: prev[productId]?.rating || 5,
        comment: prev[productId]?.comment || '',
        ...prev[productId],
        [key]: value,
      },
    }))
  }

  const submitReview = async (productId) => {
    const draft = reviewDrafts[productId] || { rating: 5, comment: '' }
    try {
      await apiClient.post(`/api/products/${productId}/reviews`, {
        rating: Number(draft.rating || 5),
        comment: draft.comment || '',
      })
      alert('Review submitted')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit review')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading orders...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-gray-600">No orders yet.</div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap justify-between gap-3 mb-4">
                <div>
                  <p className="font-bold">Order #{order._id.slice(-8)}</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Status: <span className="font-semibold">{order.status}</span></p>
                  <p className="text-sm">Payment: <span className="font-semibold">{order.paymentStatus}</span></p>
                  <p className="text-sm">Tracking: <span className="font-semibold">{order.trackingId || 'N/A'}</span></p>
                  <p className="text-lg font-bold mt-1">{formatPrice(order.totalPrice)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 border rounded-lg p-3">
                    <img
                      src={getImageSrc(item.product?.image, item.product?.category)}
                      alt={item.product?.name || 'Product'}
                      onError={(e) => {
                        e.currentTarget.src = getFallbackByCategory(item.product?.category)
                      }}
                      className="h-16 w-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.product?.name || 'Deleted Product'}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.product?._id && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <select
                            value={reviewDrafts[item.product._id]?.rating || 5}
                            onChange={(e) => setDraft(item.product._id, 'rating', e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {[1, 2, 3, 4, 5].map((r) => (
                              <option key={r} value={r}>{r} Star</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={reviewDrafts[item.product._id]?.comment || ''}
                            onChange={(e) => setDraft(item.product._id, 'comment', e.target.value)}
                            placeholder="Write review comment"
                            className="border rounded px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => submitReview(item.product._id)}
                            className="px-2 py-1 bg-amazon-950 text-white rounded text-xs"
                          >
                            Submit Review
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="font-semibold">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders

