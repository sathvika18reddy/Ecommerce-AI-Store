import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  getPersonalizedRecommendations,
  getSimilarProductRecommendations,
} from "../services/recommendationService.js";

/**
 * Controller to get personalized product recommendations for the current user or guest.
 * Route: GET /recommendations?limit=8
 */
export const getUserRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const limit = Number(req.query.limit) || 8;

    const recommendations = await getPersonalizedRecommendations(userId, limit);
    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("[RecommendationController] Error fetching user recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
    });
  }
};

/**
 * Controller to get similar product recommendations for a specific product.
 * Route: GET /recommendations/product/:productId?limit=4
 */
export const getSimilarProducts = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const limit = Number(req.query.limit) || 4;
    const recommendations = await getSimilarProductRecommendations(productId, limit);

    return res.status(200).json({
      success: true,
      product_id: productId,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("[RecommendationController] Error fetching similar products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch similar product recommendations",
    });
  }
};
