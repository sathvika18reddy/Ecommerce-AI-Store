import os
import pickle
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from src.preprocessor import TextPreprocessor

class RecommendationEngine:
    """
    Modular Recommendation Engine.
    Supports Content-Based Filtering, User Interaction Scoring, and Hybrid Models.
    """

    def __init__(self, model_dir: str = "model"):
        self.model_dir = model_dir
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix: Optional[np.ndarray] = None
        self.product_ids: List[int] = []
        self.product_id_to_idx: Dict[int, int] = {}
        self.idx_to_product_id: Dict[int, int] = {}

    def fit_content_model(self, products: List[Dict[str, Any]]) -> None:
        """
        Builds the TF-IDF feature space from a list of products.
        """
        if not products:
            return

        df = TextPreprocessor.combine_product_features(products)
        self.product_ids = df["id"].tolist()
        self.product_id_to_idx = {pid: idx for idx, pid in enumerate(self.product_ids)}
        self.idx_to_product_id = {idx: pid for idx, pid in enumerate(self.product_ids)}

        self.vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
        self.tfidf_matrix = self.vectorizer.fit_transform(df["feature_text"])

    def get_similar_products(self, product_id: int, top_n: int = 5) -> List[Dict[str, Any]]:
        """
        Returns top-N products similar to the given product_id based on content similarity.
        """
        if self.tfidf_matrix is None or product_id not in self.product_id_to_idx:
            return []

        target_idx = self.product_id_to_idx[product_id]
        target_vec = self.tfidf_matrix[target_idx]

        sim_scores = cosine_similarity(target_vec, self.tfidf_matrix).flatten()
        
        # Sort indices by score descending, excluding the target item itself
        sorted_indices = np.argsort(sim_scores)[::-1]
        results = []
        for idx in sorted_indices:
            pid = self.idx_to_product_id[idx]
            if pid != product_id and sim_scores[idx] > 0.0:
                results.append({
                    "product_id": int(pid),
                    "score": float(sim_scores[idx]),
                    "reason": "Similar product characteristics and description"
                })
            if len(results) >= top_n:
                break

        return results

    def get_user_recommendations(
        self,
        user_id: Optional[int],
        user_history: List[Dict[str, Any]],
        all_products: List[Dict[str, Any]],
        top_n: int = 8
    ) -> List[Dict[str, Any]]:
        """
        Computes personalized recommendations for a user given their interaction history (orders/cart).
        If history is empty (cold start), returns top products from catalog.
        """
        if not all_products:
            return []

        # Ensure model is fitted on current product catalog
        self.fit_content_model(all_products)

        # Extract interacted product IDs
        interacted_ids = {
            item.get("product_id") for item in user_history if item.get("product_id") is not None
        }

        # If user has no history, fallback to catalog order
        if not interacted_ids:
            return [
                {
                    "product_id": int(p["id"]),
                    "score": 1.0,
                    "reason": "Trending / Popular items"
                }
                for p in all_products[:top_n]
            ]

        # Aggregate similarity scores across all interacted items
        aggregate_scores = np.zeros(len(self.product_ids))

        for pid in interacted_ids:
            if pid in self.product_id_to_idx:
                idx = self.product_id_to_idx[pid]
                sims = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
                aggregate_scores += sims

        sorted_indices = np.argsort(aggregate_scores)[::-1]

        recommendations = []
        for idx in sorted_indices:
            pid = self.idx_to_product_id[idx]
            # Recommend items user hasn't already interacted with, or top matches
            score = float(aggregate_scores[idx])
            recommendations.append({
                "product_id": int(pid),
                "score": score,
                "reason": "Recommended based on your recent orders and shopping history"
            })
            if len(recommendations) >= top_n:
                break

        return recommendations

    def save_model(self, filename: str = "recommender_model.pkl") -> None:
        """Serializes the recommendation model state."""
        os.makedirs(self.model_dir, exist_ok=True)
        path = os.path.join(self.model_dir, filename)
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load_model(cls, model_dir: str = "model", filename: str = "recommender_model.pkl") -> "RecommendationEngine":
        """Loads a pre-trained recommendation model state."""
        path = os.path.join(model_dir, filename)
        if os.path.exists(path):
            with open(path, "rb") as f:
                return pickle.load(f)
        return cls(model_dir=model_dir)
