import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import { getFallbackByCategory, getImageSrc, formatPrice } from '../utils/imageUtils'

const Cart = () => {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchCart()
  }, [user])

  const fetchCart = async () => {
    try {
      // Backend cart API call
      const res = await apiClient.get('/api/cart')
      setCartItems(res.data.items || [])
    } catch (error) {
      console.error('Cart fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId)
    
    try {
      await apiClient.put(`/api/cart/update/${productId}`, { quantity })
      fetchCart()
    } catch (error) {
      console.error('Update cart error:', error)
    }
  }

  const removeFromCart = async (productId) => {
    try {
      await apiClient.delete(`/api/cart/${productId}`)
      fetchCart()
    } catch (error) {
      console.error('Remove cart error:', error)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const placeOrder = async () => {
    try {
      setPlacingOrder(true)

      // Build shipping address from the user's saved profile fields
      const addressParts = [
        user?.addressLine1,
        user?.addressLine2,
        user?.city,
        user?.state,
        user?.country,
        user?.postalCode,
      ].filter(Boolean)
      const shippingAddress = addressParts.length > 0
        ? addressParts.join(', ')
        : '' // server will fall back to profile lookup if empty

      await apiClient.post('/api/orders/place', {
        paymentMethod: 'COD',
        shippingAddress,
      })
      await fetchCart()
      navigate('/orders')
    } catch (error) {
      console.error('Place order error:', error)
      alert(error.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading cart...</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center">
    <Link to="/login" className="btn-primary px-8 py-4 text-lg">
      Login to view cart
    </Link>
  </div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <i className="fas fa-shopping-cart text-8xl text-gray-300 mb-8"></i>
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Your cart is empty</h2>
          <Link to="/products" className="btn-primary px-8 py-3 text-lg">
            Continue Shopping →
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.map((item) => (
              <div key={item._id} className="flex bg-white rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-shadow">
                <img 
                  src={getImageSrc(item.image, item.category)}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src = getFallbackByCategory(item.category)
                  }}
                  className="w-24 h-24 object-cover rounded-lg mr-6 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">{item.name}</h3>
                  <p className="text-green-700 font-bold text-xl mb-4">{formatPrice(item.price)}</p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-8 h-fit sticky top-24">
            <h3 className="text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-lg">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              {/* Show delivery address or nudge to set one */}
              <div className="text-sm border-t pt-3">
                <p className="text-gray-500 font-medium mb-1">Deliver to:</p>
                {[user?.addressLine1, user?.city, user?.state, user?.country].filter(Boolean).length > 0 ? (
                  <p className="text-gray-700">
                    {[user?.addressLine1, user?.city, user?.state, user?.country, user?.postalCode].filter(Boolean).join(', ')}
                  </p>
                ) : (
                  <Link to="/profile" className="text-orange-500 hover:text-orange-600 font-medium">
                    ⚠️ Add delivery address in Profile →
                  </Link>
                )}
              </div>
            </div>
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-2xl font-bold text-amazon-950">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="btn-primary w-full py-4 text-lg font-bold mb-4 disabled:opacity-60"
            >
              {placingOrder ? 'Placing Order...' : 'Proceed to Checkout'}
            </button>
            <Link to="/products" className="block text-center text-sm text-orange-600 hover:text-orange-500 font-medium">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart

