import { getRecommendationsForUser, getSimilarProductsFromML } from "../services/recommendationService.js";

const normalizeProduct = (p) => {
  if (!p) return null;
  const id = p._id ?? p.id;
  const image =
    p.image ||
    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "") ||
    "";
  return {
    _id: id,
    name: p.name,
    category: p.category,
    price: p.price,
    rating: p.rating ?? 0,
    numReviews: p.numReviews ?? 0,
    image,
    images: p.images || (image ? [image] : []),
    discount: p.discount ?? 0,
    brand: p.brand,
    subcategory: p.subcategory,
    soldCount: p.soldCount,
  };
};

export const getUserRecommendations = async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.userId)) {
      return res.status(403).json({ message: "Not authorized to view these recommendations" });
    }

    const raw = await getRecommendationsForUser(req.params.userId);
    const recommendations = raw.map(normalizeProduct).filter(Boolean);

    res.json({
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const raw = await getSimilarProductsFromML(productId);
    const similar = raw.map(normalizeProduct).filter(Boolean);
    res.json({ similar, count: similar.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
