import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import apiClient from '../api/client'

const CATEGORY_OPTIONS = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books']

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const search = searchParams.get('search')?.trim() || ''
  const category = searchParams.get('category')?.trim() || ''

  const [draftSearch, setDraftSearch] = useState(search)
  const [draftCategory, setDraftCategory] = useState(category)

  useEffect(() => {
    setDraftSearch(search)
    setDraftCategory(category)
  }, [search, category])

  useEffect(() => {
    let cancelled = false
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (category) params.set('category', category)
        const qs = params.toString()
        const url = '/api/products' + (qs ? `?${qs}` : '')
        const response = await apiClient.get(url)
        if (!cancelled) setProducts(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Error fetching products:', error)
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [search, category])

  const applyFilters = () => {
    const next = new URLSearchParams()
    const s = draftSearch.trim()
    const c = draftCategory.trim()
    if (s) next.set('search', s)
    if (c) next.set('category', c)
    setSearchParams(next)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
          <div className="relative flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Search products..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full pl-12 pr-32 py-4 rounded-full bg-white shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg"
            />
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
            <button
              type="button"
              onClick={applyFilters}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-full text-sm font-bold transition-all"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400 min-w-[180px]"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button type="button" onClick={applyFilters} className="btn-primary px-6 py-3">
              Filter
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            All Products ({products.length})
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="product-card animate-pulse">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No products found</h2>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter.</p>
            <p className="text-sm text-gray-400 max-w-lg mx-auto">
              If you expect many items here, run the seed script with the same <code className="bg-gray-100 px-1 rounded">MONGO_URI</code> as the
              server, then open{' '}
              <a href="/api/products/catalog-stats" className="text-orange-600 underline">
                /api/products/catalog-stats
              </a>{' '}
              to verify counts per category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
