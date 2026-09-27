"""
AI-Powered Recommendation Engine
FastAPI + Scikit-learn + Pandas
"""
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

# Load environment variables
load_dotenv()

from recommender import RecommendationEngine
from utils.data_sync import DataSync
from models.chatbot import SupportChatbot

# ── Initialize engines ────────────────────────────────────────────────────
recommender = RecommendationEngine()
data_sync   = DataSync()
chatbot     = SupportChatbot()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    recommender.load_or_train()
    chatbot.load()
    print("✅ ML models loaded")
    yield
    # Shutdown
    pass

app = FastAPI(
    title="E-Commerce ML Service",
    description="Recommendation engine (personalized recommendations & similar products)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ML Service Running ✅", "version": "1.0.0"}


# ── Personalized Recommendations ─────────────────────────────────────────
@app.get("/recommend/{user_id}")
def get_recommendations(user_id: str, top_n: int = 10):
    try:
        result = recommender.get_user_recommendations(user_id, top_n)
        return {"userId": user_id, "recommendations": result, "source": "personalized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Similar Products (Content-based) ──────────────────────────────────────
@app.get("/similar/{product_id}")
def get_similar(product_id: str, top_n: int = 8):
    try:
        result = recommender.get_similar_products(product_id, top_n)
        return {"productId": product_id, "similar": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Popular Products (fallback) ────────────────────────────────────────────
@app.get("/popular")
def get_popular(top_n: int = 10):
    try:
        result = recommender.get_popular_products(top_n)
        return {"recommendations": result, "source": "popular"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Chatbot Support ───────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str
    userId: Optional[str] = None
    userName: Optional[str] = None
    userEmail: Optional[str] = None

@app.post("/chat")
def chat_with_bot(payload: ChatMessage):
    try:
        result = chatbot.respond(
            payload.message,
            payload.userId,
            payload.userName,
            payload.userEmail
        )
        return {
            "response": result["response"],
            "intent": result["intent"],
            "confidence": result["confidence"],
            "ticketCreated": result.get("ticketCreated", False),
            "source": result.get("source", "unknown")
        }
    except Exception as e:
        print(f"Chatbot error: {e}")  # Log for debugging
        raise HTTPException(status_code=500, detail="Chat service temporarily unavailable")


# ── Sync user behaviour from Node backend ─────────────────────────────────
class UserDataPayload(BaseModel):
    userId: str
    purchaseHistory: List[dict]
    browsingHistory: List[dict]

@app.post("/sync/user")
def sync_user(payload: UserDataPayload):
    try:
        data_sync.update_user(payload.userId, payload.purchaseHistory, payload.browsingHistory)
        recommender.update_model_incremental(payload.userId)
        return {"message": "User data synced and model updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Admin: Retrain model ───────────────────────────────────────────────────
@app.post("/admin/retrain")
def retrain():
    try:
        recommender.train()
        return {"message": "Model retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
