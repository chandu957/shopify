import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FaShoppingCart, FaUser, FaSearch, FaBars } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        setCartCount(0)
        return
      }
      try {
        const res = await apiClient.get('/api/cart')
        const items = res.data?.items || []
        setCartCount(items.reduce((sum, i) => sum + (i.quantity || 0), 0))
      } catch {
        setCartCount(0)
      }
    }
    loadCart()
  }, [user, location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
  }

  const categories = [
    { label: "Today's Deals", to: '/products' },
    { label: 'Electronics', to: '/products?category=Electronics' },
    { label: 'Fashion', to: '/products?category=Fashion' },
    { label: 'Sports', to: '/products?category=Sports' },
    { label: 'Home', to: '/products?category=Home' },
    { label: 'Books', to: '/products?category=Books' },
  ]

  return (
    <header className="text-white shadow-lg sticky top-0 z-50">
      <div className="bg-amazon-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0 rounded-sm px-2 py-1 hover:outline hover:outline-1 hover:outline-white/70"
            >
              <i className="fas fa-store text-2xl text-amazon-yellow"></i>
              <span className="text-lg font-extrabold tracking-tight">ProShop</span>
              <span className="text-xs font-semibold text-white/70 -ml-1">India</span>
            </Link>

            <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-sm hover:outline hover:outline-1 hover:outline-white/70">
              <div className="leading-none">
                <div className="text-[11px] text-white/70">Deliver to</div>
                <div className="text-sm font-bold">India</div>
              </div>
            </div>

            <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0">
              <div className="flex w-full">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, brands and more"
                    className="w-full h-11 pl-12 pr-3 rounded-l-md bg-white text-amazon-950 text-sm focus:outline-none focus:ring-2 focus:ring-amazon-yellow"
                  />
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 rounded-r-md bg-amazon-yellow hover:brightness-95 text-amazon-950 font-bold text-sm transition"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-sm hover:outline hover:outline-1 hover:outline-white/70"
                  >
                    <FaUser />
                    <span className="text-sm font-semibold max-w-[120px] truncate">
                      Hello, {user.name}
                    </span>
                  </Link>

                  {user.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="hidden md:inline-flex px-2 py-1 rounded-sm text-sm font-semibold text-white/90 hover:outline hover:outline-1 hover:outline-white/70"
                    >
                      Admin
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="hidden md:inline-flex px-2 py-1 rounded-sm text-sm font-semibold text-white/90 hover:outline hover:outline-1 hover:outline-white/70"
                    >
                      Account
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="hidden md:inline-flex px-2 py-1 rounded-sm text-sm font-semibold text-white/90 hover:outline hover:outline-1 hover:outline-white/70"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-2 py-1 rounded-sm text-sm font-semibold hover:outline hover:outline-1 hover:outline-white/70"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="hidden lg:inline-flex px-3 py-2 rounded-md bg-amazon-yellow text-amazon-950 font-extrabold text-sm hover:brightness-95"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              <Link
                to="/cart"
                className="relative flex items-center gap-2 px-2 py-1 rounded-sm hover:outline hover:outline-1 hover:outline-white/70"
              >
                <FaShoppingCart className="text-2xl" />
                <span className="hidden sm:block text-sm font-bold">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-orange-500 text-white text-[11px] font-extrabold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              <FaBars className="md:hidden text-xl ml-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amazon-900 border-b border-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 flex items-center gap-3 overflow-x-auto">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 shrink-0 px-2 py-1 rounded-sm text-sm font-bold hover:outline hover:outline-1 hover:outline-white/70"
            >
              <FaBars className="text-sm" />
              All
            </Link>

            <div className="flex items-center gap-3">
              {categories.map((c) => (
                <Link
                  key={c.label}
                  to={c.to}
                  className="shrink-0 px-2 py-1 rounded-sm text-sm font-semibold text-white/95 hover:outline hover:outline-1 hover:outline-white/70"
                >
                  {c.label}
                </Link>
              ))}
            </div>

            <div className="ml-auto hidden lg:flex items-center gap-2">
              <span className="text-sm font-bold">Fast delivery</span>
              <span className="text-[11px] text-white/70">|</span>
              <span className="text-sm font-semibold text-white/90">Easy returns</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
