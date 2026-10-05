"""
Training and evaluation script for the AI/ML Recommendation Engine.
Can be executed standalone: python src/train.py
"""

import os
import json
from src.recommender import RecommendationEngine

def train():
    print("[AI/ML Service] Starting recommendation model training pipeline...")

    # Sample baseline data if training without live database
    sample_products = [
        {"id": 1, "name": "Wireless Bluetooth Headphones", "description": "Noise cancelling over-ear wireless audio headset"},
        {"id": 2, "name": "Gaming Mechanical Keyboard", "description": "RGB backlit mechanical keyboard with blue switches"},
        {"id": 3, "name": "Ergonomic Wireless Mouse", "description": "High precision optical gaming mouse with custom DPI"},
        {"id": 4, "name": "USB-C Fast Charging Cable", "description": "Braided durable high-speed charging data cable"},
        {"id": 5, "name": "Ultra HD 4K Monitor", "description": "27-inch IPS LED display with HDR and thin bezels"}
    ]

    engine = RecommendationEngine(model_dir="model")
    engine.fit_content_model(sample_products)
    engine.save_model()

    print("[AI/ML Service] Model training complete! Saved to model/recommender_model.pkl")

if __name__ == "__main__":
    train()
