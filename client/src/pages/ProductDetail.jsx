import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaStar } from 'react-icons/fa'
import apiClient from '../api/client'
import { getFallbackByCategory, getProductImage, formatPrice } from '../utils/imageUtils'
import ProductCard from '../components/ProductCard'

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [similar, setSimilar] = useState([])
  const [similarLoading, setSimilarLoading] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [id])

  useEffect(() => {
    const loadSimilar = async () => {
      if (!id) return
      setSimilarLoading(true)
      try {
        const res = await apiClient.get(`/api/recommend/similar/${id}`)
        setSimilar(res.data?.similar || [])
      } catch {
        setSimilar([])
      } finally {
        setSimilarLoading(false)
      }
    }
    loadSimilar()
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await apiClient.get(`/api/products/${id}`)
      setProduct(res.data)
    } catch (error) {
      console.error('Product fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>
    )
  }
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Product not found</div>
    )
  }

  const handleAddToCart = async () => {
    try {
      await apiClient.post(`/api/cart/add/${id}`, { quantity })
      alert('Added to cart!')
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Please log in to add items to your cart.')
      } else {
        alert(error.response?.data?.message || 'Failed to add to cart. Please try again.')
      }
      console.error('Add to cart error:', error)
    }
  }

  const discount = Number(product.discount) || 0
  const mrp =
    discount > 0 ? Math.round(Number(product.price) / (1 - discount / 100)) : null
  const rating = Math.min(5, Math.max(0, Number(product.rating) || 0))
  const fullStars = Math.round(rating)
  const mainImg = getProductImage(product)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <Link to="/products" className="inline-flex items-center text-orange-600 hover:text-orange-500 mb-6 text-sm font-medium">
        <i className="fas fa-arrow-left mr-2"></i>
        Back to products
      </Link>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <img
              src={mainImg}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src = getFallbackByCategory(product.category)
              }}
              className="w-full aspect-square object-cover"
            />
          </div>
        </div>

        <div>
          <div className="space-y-4">
            {product.brand && (
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">{product.brand}</p>
            )}
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            {product.subcategory && (
              <p className="text-sm text-gray-500">{product.subcategory}</p>
            )}

            <div className="flex items-center flex-wrap gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, idx) => (
                  <FaStar key={idx} className={idx < fullStars ? '' : 'opacity-25'} />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {rating.toFixed(1)} ({product.numReviews ?? 0} ratings)
              </span>
              {product.soldCount != null && (
                <span className="text-sm text-gray-500">| {product.soldCount}+ bought</span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-bold text-amazon-950">
                  {formatPrice(product.price)}
                </span>
                {mrp && mrp > product.price && (
                  <span className="text-2xl text-gray-400 line-through">{formatPrice(mrp)}</span>
                )}
                {discount > 0 && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {discount}% off
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-lg font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-xl font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    className="w-11 h-11 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-base md:text-lg leading-relaxed border-t border-gray-100 pt-4">
                {product.description}
              </p>

              {product.reviews?.length > 0 && (
                <div className="pt-2">
                  <h3 className="font-bold mb-2 text-gray-900">Recent reviews</h3>
                  <div className="space-y-2 max-h-44 overflow-auto">
                    {product.reviews.slice(-3).reverse().map((review) => (
                      <div key={review._id} className="border border-gray-100 rounded-lg p-3 text-sm bg-gray-50/80">
                        <div className="flex justify-between">
                          <span className="font-semibold">{review.name}</span>
                          <span>{review.rating}/5</span>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn-primary flex-1 py-4 text-lg font-bold"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  className="bg-amazon-950 hover:bg-amazon-900 text-white px-8 py-4 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-heart"></i>
                  <span>Wishlist</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-gray-200 pt-10">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Similar products</h2>
        {similarLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : similar.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {similar.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No similar items. Start the ML service on port 8000 for content-based matches.</p>
        )}
      </section>
    </div>
  )
}

export default ProductDetail
