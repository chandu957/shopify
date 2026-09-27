import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import apiClient from '../api/client'
import { getHeroImage } from '../utils/imageUtils'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [recLoading, setRecLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const loadRecs = async () => {
      const uid = user?._id || user?.id
      if (!uid || user.role === 'admin') {
        setRecommendations([])
        return
      }
      setRecLoading(true)
      try {
        const res = await apiClient.get(`/api/recommend/user/${uid}`)
        setRecommendations(res.data?.recommendations || [])
      } catch {
        setRecommendations([])
      } finally {
        setRecLoading(false)
      }
    }
    loadRecs()
  }, [user])

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/api/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const topRated = [...products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Hero */}
      <div className="relative h-72 md:h-96 rounded-xl overflow-hidden mb-8 md:mb-10 shadow-xl border border-gray-200/80">
        <img
          src={getHeroImage()}
          alt="Deals banner"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80'
          }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent flex items-center px-6 md:px-10">
          <div className="max-w-xl">
            <p className="text-amazon-yellow font-bold text-sm uppercase tracking-wider mb-2">ProShop</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
              Great deals on electronics &amp; fashion
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-6">
              Fast delivery, easy returns, and personalized picks for you.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-amazon-yellow hover:brightness-95 text-amazon-950 font-extrabold px-8 py-3 rounded-md shadow-lg transition"
            >
              Shop all products
            </Link>
          </div>
        </div>
      </div>

      {/* Category shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10">
        {[
          { label: 'Electronics', q: 'Electronics' },
          { label: 'Fashion', q: 'Fashion' },
          { label: 'Sports', q: 'Sports' },
          { label: 'Home', q: 'Home' },
          { label: 'Books', q: 'Books' },
          { label: "Today's deals", q: '' },
        ].map((c) => (
          <Link
            key={c.label}
            to={c.q ? `/products?category=${encodeURIComponent(c.q)}` : '/products'}
            className="bg-white border border-gray-200 rounded-lg py-3 px-2 text-center text-sm font-semibold text-gray-800 hover:border-orange-400 hover:shadow-md transition"
          >
            {c.label}
          </Link>
        ))}
      </div>

      {/* Personalized recommendations */}
      {user && user.role !== 'admin' && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recommended for you</h2>
              <p className="text-sm text-gray-500">Based on your browsing and purchases</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
              See all
            </Link>
          </div>
          {recLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {recommendations.slice(0, 20).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-white border border-dashed border-gray-200 rounded-lg p-6">
              Sign in and explore products — recommendations appear after the ML service runs (start the Python
              service on port 8000 and seed the database).
            </p>
          )}
        </section>
      )}

      {/* Top rated */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex-1">Top rated picks</h2>
          <Link to="/products" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
            Browse catalogue
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="product-card animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {topRated.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* All featured */}
      <section>
        <div className="flex items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex-1">Featured products</h2>
          <Link to="/products" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
            View all ({products.length})
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="product-card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.slice(0, 20).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
