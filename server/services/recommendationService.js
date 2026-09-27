import axios from "axios";

const ML_BASE = process.env.ML_SERVICE_URL || "http://localhost:8000";

export const getRecommendationsForUser = async (userId) => {
  try {
    const response = await axios.get(`${ML_BASE}/recommend/${userId}`, {
      timeout: 8000,
    });
    return response.data.recommendations || [];
  } catch (error) {
    // Silent fail - return empty array for graceful degradation
    return [];
  }
};

export const getSimilarProductsFromML = async (productId) => {
  try {
    const response = await axios.get(`${ML_BASE}/similar/${productId}`, {
      timeout: 8000,
    });
    return response.data.similar || [];
  } catch (error) {
    // Silent fail - return empty array for graceful degradation
    return [];
  }
};
