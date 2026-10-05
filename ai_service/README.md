# AI/ML Recommendation Service

This folder contains the dedicated AI/ML Recommendation Engine microservice for **StoreProject-FullStack**. It exposes a lightweight REST API (FastAPI) that seamlessly communicates with the Node.js Express backend.

---

## 📁 Directory Structure

```
ai_service/
├── app.py                     # Main FastAPI server exposing recommendation endpoints
├── requirements.txt           # Python dependencies
├── .env.example               # Configuration template
├── README.md                  # Documentation & usage guide
├── model/                     # Serialized trained model weights (.pkl, .pt, .onnx)
│   └── recommender_model.pkl
├── data/                      # Dataset dumps, interaction logs, and offline training data
└── src/
    ├── __init__.py
    ├── preprocessor.py        # Text & metadata preprocessing
    ├── recommender.py         # Recommendation algorithms (Content-Based, Collaborative, Hybrid)
    └── train.py               # Standalone training script
```

---

## 🚀 Setup & Installation

### 1. Create a Python Virtual Environment
```bash
cd ai_service
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Run the Service
```bash
# Using uvicorn with auto-reload
uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Or directly with Python
python app.py
```

The interactive OpenAPI / Swagger documentation will be live at:
👉 **http://localhost:5000/docs**

---

## 📡 API Endpoints

### 1. Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "online",
  "service": "StoreProject-AIML-Recommendation-Engine",
  "version": "1.0.0"
}
```

### 2. User Personalized Recommendations
- **Endpoint**: `POST /recommend/user`
- **Request Body**:
```json
{
  "user_id": 1,
  "user_history": [
    { "product_id": 10, "quantity": 2 },
    { "product_id": 15, "quantity": 1 }
  ],
  "products": [
    { "id": 10, "name": "Wireless Headset", "description": "Over-ear noise cancelling" },
    { "id": 11, "name": "Gaming Mouse", "description": "RGB optical mouse" },
    { "id": 12, "name": "Audio Amp", "description": "High fidelity headphone amplifier" }
  ],
  "top_n": 5
}
```
- **Response**:
```json
{
  "success": true,
  "user_id": 1,
  "count": 3,
  "recommendations": [
    {
      "product_id": 12,
      "score": 0.842,
      "reason": "Recommended based on your recent orders and shopping history"
    }
  ]
}
```

### 3. Product-to-Product Similarity
- **Endpoint**: `POST /recommend/product`
- **Request Body**:
```json
{
  "product_id": 10,
  "products": [
    { "id": 10, "name": "Wireless Headset", "description": "Over-ear noise cancelling" },
    { "id": 12, "name": "Audio Amp", "description": "High fidelity headphone amplifier" }
  ],
  "top_n": 4
}
```

### 4. Model Training & Persistence
- **Endpoint**: `POST /train` (or run `python src/train.py`)

---

## 🧠 How to Write Your Own Custom AI/ML Models

1. Open `src/recommender.py`.
2. You can replace or extend the `RecommendationEngine` class with:
   - **Collaborative Filtering / Matrix Factorization** (SVD, ALS, LightFM).
   - **Deep Learning / Neural Networks** (PyTorch, TensorFlow, Two-Tower Recommenders).
   - **Semantic Embeddings** (SentenceTransformers, HuggingFace, OpenAI embeddings).
   - **Graph-based Recommendations** (Graph Neural Networks).
3. Save trained weights to the `model/` folder using `pickle.dump()` or `torch.save()`.
4. The Node.js backend communicates with this service via REST API, meaning you can iterate on your Python AI/ML models without changing a single line of Node.js code!
