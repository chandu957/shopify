const CATEGORY_FALLBACKS = {
  Electronics:
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  Fashion:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  Sports:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  Home:
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80",
  Books:
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
};

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80";

export const getImageSrc = (image, category) => {
  if (image && typeof image === "string" && image.trim().length > 0) {
    return image.trim();
  }
  return CATEGORY_FALLBACKS[category] || DEFAULT_FALLBACK;
};

export const getProductImage = (product) => {
  if (!product) return DEFAULT_FALLBACK;
  const img =
    product.image ||
    (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);
  return getImageSrc(img, product.category);
};

export const getFallbackByCategory = (category) =>
  CATEGORY_FALLBACKS[category] || DEFAULT_FALLBACK;

export const getHeroImage = () =>
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=2000&q=80";

export const formatPrice = (n) => {
  if (n == null || Number.isNaN(Number(n))) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n));
};

