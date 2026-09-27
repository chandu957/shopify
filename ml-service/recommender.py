"""
Recommendation Engine
─────────────────────
Hybrid approach:
  1. Content-Based Filtering   → TF-IDF on product features + cosine similarity
  2. Collaborative Filtering   → KNN on user-item interaction matrix
  3. Popular Fallback           → Most sold / highly rated
"""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / "server" / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

MONGO_URI   = os.getenv("MONGO_URI", "mongodb://localhost:27017/ecommerce")
MODEL_PATH  = "models/saved/recommender.pkl"


def _mongo_client():
    uri = MONGO_URI
    kwargs = {}
    if uri.startswith("mongodb+srv://") or os.getenv("MONGO_TLS", "") == "1":
        kwargs["tls"] = True
        kwargs["tlsAllowInvalidCertificates"] = True  # bypass broken pyOpenSSL on Anaconda
    return MongoClient(uri, **kwargs)


class RecommendationEngine:
    def __init__(self):
        self.client   = _mongo_client()
        self.db       = self.client["ecommerce"]
        self.products_df      = None
        self.user_item_matrix = None
        self.content_model    = None    # cosine similarity matrix (content-based)
        self.collab_model     = None    # KNN model (collaborative)
        self.tfidf_matrix     = None
        self.product_index    = {}      # product_id → row index

    # ─── Load or Train ────────────────────────────────────────────────────
    def load_or_train(self):
        if os.path.exists(MODEL_PATH):
            self._load()
            print("✅ Recommender loaded from disk")
        else:
            self.train()

    def _load(self):
        with open(MODEL_PATH, "rb") as f:
            state = pickle.load(f)
        self.products_df      = state["products_df"]
        self.user_item_matrix = state["user_item_matrix"]
        self.content_model    = state["content_model"]
        self.collab_model     = state["collab_model"]
        self.tfidf_matrix     = state["tfidf_matrix"]
        self.product_index    = state["product_index"]

    def _save(self):
        os.makedirs("models/saved", exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({
                "products_df":      self.products_df,
                "user_item_matrix": self.user_item_matrix,
                "content_model":    self.content_model,
                "collab_model":     self.collab_model,
                "tfidf_matrix":     self.tfidf_matrix,
                "product_index":    self.product_index,
            }, f)

    # ─── Train ────────────────────────────────────────────────────────────
    def train(self):
        print("🔄 Training recommendation models...")
        self._build_product_features()
        self._build_content_model()
        self._build_user_item_matrix()
        self._build_collab_model()
        self._save()
        print("✅ Models trained and saved")

    # ── Step 1: Product Feature Matrix ──────────────────────────────────
    def _build_product_features(self):
        products = list(self.db.products.find({"isActive": True}, {
            "_id": 1, "name": 1, "category": 1, "subcategory": 1,
            "brand": 1, "tags": 1, "price": 1, "rating": 1, "soldCount": 1, "purchases": 1,
        }))

        if not products:
            # Use dummy data if DB is empty (for development)
            products = self._dummy_products()

        df = pd.DataFrame(products)
        df["_id"] = df["_id"].astype(str)
        if "soldCount" not in df.columns and "purchases" in df.columns:
            df["soldCount"] = df["purchases"].fillna(0)
        elif "soldCount" in df.columns:
            df["soldCount"] = df["soldCount"].fillna(0)
        else:
            df["soldCount"] = 0
        df["tags"]     = df["tags"].apply(lambda x: " ".join(x) if isinstance(x, list) else "")
        df["features"] = (
            df["category"].fillna("") + " " +
            df.get("subcategory", pd.Series([""] * len(df))).fillna("") + " " +
            df.get("brand",       pd.Series([""] * len(df))).fillna("") + " " +
            df["tags"]
        )

        self.products_df  = df
        self.product_index = {pid: idx for idx, pid in enumerate(df["_id"])}

    # ── Step 2: Content-Based Model (TF-IDF + Cosine Similarity) ────────
    def _build_content_model(self):
        tfidf = TfidfVectorizer(stop_words="english", max_features=500)
        self.tfidf_matrix  = tfidf.fit_transform(self.products_df["features"])
        self.content_model = cosine_similarity(self.tfidf_matrix)

    # ── Step 3: User-Item Interaction Matrix ─────────────────────────────
    def _build_user_item_matrix(self):
        users = list(self.db.users.find(
            {"role": "user"},
            {"_id": 1, "purchaseHistory": 1, "browsingHistory": 1}
        ))

        if not users:
            self.user_item_matrix = pd.DataFrame()
            return

        rows = []
        for u in users:
            uid = str(u["_id"])
            for p in u.get("purchaseHistory", []):
                rows.append({"userId": uid, "productId": str(p["productId"]), "score": 3.0})
            for b in u.get("browsingHistory", []):
                rows.append({"userId": uid, "productId": str(b["productId"]), "score": 1.0})

        if not rows:
            self.user_item_matrix = pd.DataFrame()
            return

        df = pd.DataFrame(rows)
        # Aggregate scores: purchase (3) + browse (1)
        df = df.groupby(["userId", "productId"])["score"].sum().reset_index()
        matrix = df.pivot(index="userId", columns="productId", values="score").fillna(0)
        self.user_item_matrix = matrix

    # ── Step 4: Collaborative Filtering (KNN) ────────────────────────────
    def _build_collab_model(self):
        if self.user_item_matrix.empty:
            self.collab_model = None
            return
        model = NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=10)
        model.fit(self.user_item_matrix.values)
        self.collab_model = model

    # ─── Predict ──────────────────────────────────────────────────────────
    def get_user_recommendations(self, user_id: str, top_n: int = 10) -> list:
        # Try collaborative filtering first
        if (self.collab_model is not None and
                self.user_item_matrix is not None and
                user_id in self.user_item_matrix.index):
            rec = self._collab_recommend(user_id, top_n)
            if rec:
                return rec

        # Fallback: content-based on user's purchase history
        from bson import ObjectId
        try:
            uid = ObjectId(user_id) if isinstance(user_id, str) and len(user_id) == 24 else user_id
        except Exception:
            uid = user_id
        user = self.db.users.find_one({"_id": uid})
        if user and user.get("purchaseHistory"):
            purchased_ids = [str(p["productId"]) for p in user["purchaseHistory"][-5:]]
            return self._content_recommend_from_seeds(purchased_ids, top_n)

        # Final fallback: popular
        return self.get_popular_products(top_n)

    def _collab_recommend(self, user_id: str, top_n: int) -> list:
        user_vec = self.user_item_matrix.loc[user_id].values.reshape(1, -1)
        distances, indices = self.collab_model.kneighbors(user_vec, n_neighbors=min(10, len(self.user_item_matrix)))

        already_interacted = set(
            col for col, val in zip(self.user_item_matrix.columns, user_vec[0]) if val > 0
        )

        product_scores = {}
        for dist, idx in zip(distances[0][1:], indices[0][1:]):
            sim = 1 - dist
            neighbor_row = self.user_item_matrix.iloc[idx]
            for product_id, score in neighbor_row.items():
                if score > 0 and product_id not in already_interacted:
                    product_scores[product_id] = product_scores.get(product_id, 0) + sim * score

        ranked = sorted(product_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return self._enrich_products([pid for pid, _ in ranked])

    def get_similar_products(self, product_id: str, top_n: int = 8) -> list:
        if product_id not in self.product_index:
            return self.get_popular_products(top_n)

        idx  = self.product_index[product_id]
        sims = list(enumerate(self.content_model[idx]))
        sims = sorted(sims, key=lambda x: x[1], reverse=True)[1 : top_n + 1]
        product_ids = [self.products_df.iloc[i]["_id"] for i, _ in sims]
        return self._enrich_products(product_ids)

    def _content_recommend_from_seeds(self, seed_ids: list, top_n: int) -> list:
        indices = [self.product_index[pid] for pid in seed_ids if pid in self.product_index]
        if not indices:
            return self.get_popular_products(top_n)

        combined = np.mean(self.content_model[indices], axis=0)
        sims     = sorted(enumerate(combined), key=lambda x: x[1], reverse=True)
        candidates = [
            self.products_df.iloc[i]["_id"]
            for i, _ in sims
            if self.products_df.iloc[i]["_id"] not in seed_ids
        ][:top_n]
        return self._enrich_products(candidates)

    def get_popular_products(self, top_n: int = 10) -> list:
        if self.products_df is not None and not self.products_df.empty:
            df = self.products_df.copy()
            if "soldCount" not in df.columns:
                df["soldCount"] = 0
            popular = (
                df.sort_values("soldCount", ascending=False)
                .head(top_n)["_id"]
                .tolist()
            )
            return self._enrich_products(popular)
        return []

    def _enrich_products(self, product_ids: list) -> list:
        """Attach product details from DB for frontend rendering."""
        results = []
        for pid in product_ids:
            try:
                from bson import ObjectId
                oid = ObjectId(pid) if isinstance(pid, str) and len(pid) == 24 else pid
                p = self.db.products.find_one(
                    {"_id": oid},
                    {
                        "name": 1,
                        "category": 1,
                        "price": 1,
                        "images": 1,
                        "image": 1,
                        "rating": 1,
                        "discount": 1,
                        "numReviews": 1,
                        "brand": 1,
                        "subcategory": 1,
                        "soldCount": 1,
                        "purchases": 1,
                    },
                )
                if p:
                    p["_id"] = str(p["_id"])
                    results.append(p)
            except Exception:
                pass
        return results

    def update_model_incremental(self, user_id: str):
        """Light update after new user data arrives — retrain collab model."""
        self._build_user_item_matrix()
        self._build_collab_model()
        self._save()

    # ─── Dummy data for cold start / development ──────────────────────────
    def _dummy_products(self):
        categories = ["Electronics", "Clothing", "Books", "Sports", "Home"]
        return [
            {
                "_id": f"prod_{i:03d}",
                "name": f"Product {i}",
                "category": categories[i % len(categories)],
                "subcategory": "general",
                "brand": f"Brand{i % 5}",
                "tags": ["popular", categories[i % len(categories)].lower()],
                "price": 100 + i * 10,
                "rating": round(3.5 + (i % 3) * 0.5, 1),
                "soldCount": 100 - i,
            }
            for i in range(50)
        ]
