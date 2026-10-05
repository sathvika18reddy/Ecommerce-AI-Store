import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

from src.recommender import RecommendationEngine

load_dotenv()

app = FastAPI(
    title="StoreProject Recommendation API",
    description="AI/ML Microservice for e-commerce personalized and content-based recommendations",
    version="1.0.0"
)

# Enable CORS for communication with Node.js and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Recommendation Engine
engine = RecommendationEngine(model_dir="model")

# Request / Response Schemas
class ProductItem(BaseModel):
    id: int
    name: str
    description: Optional[str] = ""
    price: Optional[float] = None
    discount_price: Optional[float] = None
    image_url: Optional[str] = None

class InteractionItem(BaseModel):
    product_id: int
    quantity: Optional[int] = 1

class UserRecommendationRequest(BaseModel):
    user_id: Optional[int] = None
    user_history: List[InteractionItem] = Field(default_factory=list)
    products: List[ProductItem] = Field(default_factory=list)
    top_n: Optional[int] = 8

class ProductRecommendationRequest(BaseModel):
    product_id: int
    products: List[ProductItem] = Field(default_factory=list)
    top_n: Optional[int] = 5

class TrainRequest(BaseModel):
    products: List[ProductItem]

@app.get("/health")
def health_check():
    """Health check endpoint for Node.js backend monitoring."""
    return {
        "status": "online",
        "service": "StoreProject-AIML-Recommendation-Engine",
        "version": "1.0.0"
    }

@app.post("/recommend/user")
def recommend_for_user(payload: UserRecommendationRequest):
    """
    Generate personalized recommendations for a user given their shopping history and product catalog.
    """
    try:
        products_dict = [p.model_dump() for p in payload.products]
        history_dict = [h.model_dump() for h in payload.user_history]
        
        recommendations = engine.get_user_recommendations(
            user_id=payload.user_id,
            user_history=history_dict,
            all_products=products_dict,
            top_n=payload.top_n
        )
        return {
            "success": True,
            "user_id": payload.user_id,
            "count": len(recommendations),
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/product")
def recommend_similar_products(payload: ProductRecommendationRequest):
    """
    Generate similar/related product recommendations based on content similarity.
    """
    try:
        products_dict = [p.model_dump() for p in payload.products]
        engine.fit_content_model(products_dict)
        
        similar_items = engine.get_similar_products(
            product_id=payload.product_id,
            top_n=payload.top_n
        )
        return {
            "success": True,
            "product_id": payload.product_id,
            "count": len(similar_items),
            "recommendations": similar_items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
def train_model(payload: TrainRequest):
    """
    Triggers re-fitting and saving of the recommendation model with the latest product catalog.
    """
    try:
        products_dict = [p.model_dump() for p in payload.products]
        engine.fit_content_model(products_dict)
        engine.save_model()
        return {
            "success": True,
            "message": f"Successfully trained and persisted model on {len(payload.products)} products."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=True)
