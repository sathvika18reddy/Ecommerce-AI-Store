import db from "../database/db.js";

const ML_SERVICE_URL = (typeof process !== "undefined" && process.env?.ML_SERVICE_URL) || "http://localhost:5000";

interface RecommendationItem {
  product_id: number;
  score: number;
  reason?: string;
}

interface ProductRecord {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  qty: number;
}

/**
 * Fetch approved products for recommendation context.
 */
async function getApprovedProducts(): Promise<ProductRecord[]> {
  const [products]: any = await db.query(
    "SELECT id, name, description, price, discount_price, image_url, qty FROM products WHERE approval_status = 'approved' ORDER BY created_at DESC LIMIT 100"
  );
  return products as ProductRecord[];
}

/**
 * Fetch user interaction history (purchased orders + active cart items).
 */
async function getUserInteractionHistory(userId: number) {
  const [orderItems]: any = await db.query(
    "SELECT product_id, quantity FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [userId]
  );
  const [cartItems]: any = await db.query(
    "SELECT product_id, quantity FROM cart WHERE user_id = ?",
    [userId]
  );
  return [...orderItems, ...cartItems];
}

/**
 * Fetch personalized recommendations for a user by contacting the Python AI/ML microservice.
 */
export async function getPersonalizedRecommendations(userId?: number, topN: number = 8) {
  const allProducts = await getApprovedProducts();
  if (!allProducts || allProducts.length === 0) {
    return [];
  }

  let userHistory: any[] = [];
  if (userId) {
    userHistory = await getUserInteractionHistory(userId);
  }

  try {
    // API Call to Python AI/ML Service
    const response = await fetch(`${ML_SERVICE_URL}/recommend/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId || null,
        user_history: userHistory,
        products: allProducts,
        top_n: topN,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI/ML Service returned status ${response.status}`);
    }

    const data: any = await response.json();
    const recommendations: RecommendationItem[] = data.recommendations || [];

    // Map recommendation IDs to full product records
    const productMap = new Map<number, ProductRecord>(allProducts.map((p) => [p.id, p]));
    const result = recommendations
      .filter((rec) => productMap.has(rec.product_id))
      .map((rec) => {
        const product = productMap.get(rec.product_id)!;
        return {
          ...product,
          recommendation_score: rec.score,
          recommendation_reason: rec.reason,
        };
      });

    return result.length > 0 ? result : allProducts.slice(0, topN);
  } catch (error) {
    console.warn(
      "[RecommendationService] Python AI/ML service unreachable or returned error. Falling back to default catalog:",
      (error as Error).message
    );
    // Graceful fallback to approved products
    return allProducts.slice(0, topN);
  }
}

/**
 * Fetch similar product recommendations for a specific product.
 */
export async function getSimilarProductRecommendations(productId: number, topN: number = 4) {
  const allProducts = await getApprovedProducts();
  if (!allProducts || allProducts.length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${ML_SERVICE_URL}/recommend/product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        products: allProducts,
        top_n: topN,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI/ML Service returned status ${response.status}`);
    }

    const data: any = await response.json();
    const recommendations: RecommendationItem[] = data.recommendations || [];

    const productMap = new Map<number, ProductRecord>(allProducts.map((p) => [p.id, p]));
    const result = recommendations
      .filter((rec) => productMap.has(rec.product_id))
      .map((rec) => {
        const product = productMap.get(rec.product_id)!;
        return {
          ...product,
          recommendation_score: rec.score,
          recommendation_reason: rec.reason,
        };
      });

    return result.length > 0 ? result : allProducts.filter((p) => p.id !== productId).slice(0, topN);
  } catch (error) {
    console.warn(
      "[RecommendationService] Python AI/ML service fallback for product similarity:",
      (error as Error).message
    );
    return allProducts.filter((p) => p.id !== productId).slice(0, topN);
  }
}
