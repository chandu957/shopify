"""
Data Sync Utility
Handles syncing user behavior data from Node backend to MongoDB
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ecommerce")


class DataSync:
    def __init__(self):
        kwargs = {}
        if MONGO_URI.startswith("mongodb+srv://"):
            kwargs["tls"] = True
            kwargs["tlsAllowInvalidCertificates"] = True  # bypass broken pyOpenSSL on Anaconda
        self.client = MongoClient(MONGO_URI, **kwargs)
        self.db = self.client["ecommerce"]

    def update_user(self, user_id: str, purchase_history: list, browsing_history: list):
        """Update user behavior data in MongoDB."""
        try:
            from bson import ObjectId
            user_data = {
                "purchaseHistory": [
                    {
                        "productId": ObjectId(p["productId"]),
                        "category": p.get("category", ""),
                        "price": p.get("price", 0),
                        "quantity": p.get("quantity", 1),
                        "purchasedAt": p.get("purchasedAt")
                    }
                    for p in purchase_history
                ],
                "browsingHistory": [
                    {
                        "productId": ObjectId(b["productId"]),
                        "category": b.get("category", ""),
                        "timeSpent": b.get("timeSpent", 0)
                    }
                    for b in browsing_history
                ]
            }

            self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": user_data},
                upsert=True
            )
            print(f"✅ Synced data for user {user_id}")
        except Exception as e:
            print(f"❌ Error syncing user data: {e}")
            raise