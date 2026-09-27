import { Link } from 'react-router-dom'
import { FaStar } from 'react-icons/fa'
import { getFallbackByCategory, getProductImage, formatPrice } from '../utils/imageUtils'

const ProductCard = ({ product }) => {
  const rating = Math.min(5, Math.max(0, Number(product.rating) || 0))
  const fullStars = Math.round(rating)
  const discount = Number(product.discount) || 0
  const mrp = discount > 0 ? Math.round(product.price / (1 - discount / 100)) : null

  return (
    <div className="product-card group h-full flex flex-col">
      <Link to={`/product/${product._id}`} className="relative overflow-hidden block flex-1 flex flex-col">
        <div className="relative aspect-square bg-gray-50">
          <img
            src={getProductImage(product)}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = getFallbackByCategory(product.category)
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              {discount}% off
            </span>
          )}
          <span className="absolute top-2 right-2 bg-white/95 text-amazon-950 text-xs font-bold px-2 py-1 rounded shadow">
            {formatPrice(product.price)}
          </span>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors text-gray-900">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}
          <p className="text-xs text-gray-500 mb-2">{product.category}</p>

          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="w-3.5 h-3.5" style={{ opacity: i < fullStars ? 1 : 0.25 }} />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {rating.toFixed(1)} ({product.numReviews ?? 0})
            </span>
          </div>

          <div className="mt-auto flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-amazon-950">{formatPrice(product.price)}</span>
            {mrp && mrp > product.price && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(mrp)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default ProductCard
