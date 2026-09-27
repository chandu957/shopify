"""
Intelligent E-Commerce Chatbot
FLOW:
  1. User message
  2. Groq converts message → structured query (intent + params)
  3. Query MongoDB with exact schema fields
  4. Return DB result → if empty → rule-based response → if unknown → admin escalation
"""

import os
import re
import json
from datetime import datetime
from typing import Dict, Optional

import pymongo
from bson import ObjectId
from groq import Groq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── Active Groq model ────────────────────────────────────────────────────────
GROQ_MODEL = "llama-3.3-70b-versatile"

# ── Rule-based knowledge base (always works offline) ─────────────────────────
RULE_RESPONSES = {
    "greeting": (
        "👋 Hi! How can I help you today?\n\n"
        "I can assist with:\n"
        "  📦 Your orders & tracking\n"
        "  🛍️ Product search\n"
        "  🚚 Shipping information\n"
        "  ↩️ Returns & refunds\n"
        "  💳 Payment info"
    ),
    "return policy": (
        "↩️ Return Policy\n"
        "We accept returns within 30 days of purchase.\n"
        "Items must be unused and in original packaging.\n"
        "To start a return, please contact our support team."
    ),
    "refund": (
        "💰 Refund Policy\n"
        "Refunds are processed within 5-7 business days after we receive the returned item.\n"
        "You'll get a confirmation email once your refund is initiated."
    ),
    "shipping": (
        "🚚 Shipping Info\n"
        "  • Free shipping on orders over ₹500\n"
        "  • Standard delivery: 3-5 business days\n"
        "  • Express delivery: 1-2 business days (extra charge)\n"
        "  • Order tracking is available in your account dashboard"
    ),
    "payment": (
        "💳 Payment Methods Accepted\n"
        "  • Credit / Debit Cards (Visa, Mastercard, RuPay)\n"
        "  • UPI (GPay, PhonePe, Paytm)\n"
        "  • Net Banking\n"
        "  • Cash on Delivery (COD)\n"
        "  • PayPal"
    ),
    "discount": (
        "🏷️ Discounts & Offers\n"
        "Check the Offers section on our homepage for current deals.\n"
        "Subscribe to our newsletter to get exclusive discount codes."
    ),
    "contact": (
        "📞 Contact Support\n"
        "  • Email: support@store.com\n"
        "  • Phone: 1800-XXX-XXXX (Mon–Sat, 9AM–6PM)\n"
        "  • Live chat available on our website"
    ),
    "account": (
        "👤 Account Help\n"
        "  • Reset password: Go to Login → Forgot Password\n"
        "  • Update profile: Go to My Account → Edit Profile\n"
        "  • For account issues, email: support@store.com"
    ),
    "cancel order": (
        "❌ Order Cancellation\n"
        "Orders can be cancelled within 24 hours of placing them.\n"
        "Go to My Orders → Select Order → Cancel.\n"
        "After 24 hours, please contact support."
    ),
}

# ── Intent keyword patterns (offline fallback) ────────────────────────────────
INTENT_PATTERNS = {
    "greeting":       ["hello", "hi", "hey", "good morning", "good evening", "howdy"],
    "order status":   ["my order", "order status", "where is my order", "check order", "order update"],
    "track order":    ["track", "tracking", "where is my package", "shipment status", "out for delivery"],
    "product search": ["find", "search", "looking for", "show me", "do you have", "buy", "purchase", "get me", "i want"],
    "return policy":  ["return", "return policy", "how to return", "want to return"],
    "refund":         ["refund", "money back", "get my money", "reimbursement"],
    "shipping":       ["shipping", "delivery", "how long", "when will", "ship", "deliver"],
    "payment":        ["payment", "pay", "how to pay", "accepted cards", "upi", "cod"],
    "discount":       ["discount", "offer", "coupon", "promo", "deal", "sale"],
    "contact":        ["contact", "support", "help", "phone number", "email"],
    "account":        ["account", "password", "login", "profile", "forgot password"],
    "cancel order":   ["cancel", "cancellation", "cancel my order"],
    "complaint":      ["complaint", "problem", "issue", "broken", "damaged", "not working", "wrong item", "missing"],
}


class SupportChatbot:
    def __init__(self):
        self.vectorizer = None
        self.intent_list = []
        self._corpus_vectors = None
        self.db_client = None
        self.db = None
        self.is_db_connected = False
        self._groq_client = None

    # ── Groq client (cached singleton) ───────────────────────────────────────
    def _get_groq(self) -> Groq:
        if self._groq_client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY not set in .env")
            self._groq_client = Groq(api_key=api_key)
        return self._groq_client

    # ── Safe ObjectId conversion ──────────────────────────────────────────────
    def _to_object_id(self, value: str) -> Optional[ObjectId]:
        """Convert string to ObjectId safely. Returns None if invalid."""
        if not value:
            return None
        # Strip any leading # or whitespace
        clean = str(value).strip().lstrip("#")
        try:
            return ObjectId(clean)
        except Exception:
            return None

    # ── MongoDB connection ────────────────────────────────────────────────────
    def connect_db(self):
        try:
            mongo_url = (
                os.getenv("MONGO_URI")
                or os.getenv("MONGODB_URI")
                or "mongodb://localhost:27017/ecommerce"
            )
            print("📡 Connecting to MongoDB...")
            # tlsAllowInvalidCertificates=True bypasses broken pyOpenSSL on Anaconda
            kwargs = {"serverSelectionTimeoutMS": 5000}
            if mongo_url.startswith("mongodb+srv://"):
                kwargs["tls"] = True
                kwargs["tlsAllowInvalidCertificates"] = True
            self.db_client = pymongo.MongoClient(mongo_url, **kwargs)
            self.db_client.admin.command("ping")
            self.db = self.db_client["ecommerce"]
            self.is_db_connected = True
            print("✅ Database connected successfully")
        except Exception as e:
            self.is_db_connected = False
            print(f"⚠️  Database connection failed (rule-based will still work): {e}")

    # ── Startup ───────────────────────────────────────────────────────────────
    def load(self):
        self._build_tfidf()
        self.connect_db()
        print("✅ Chatbot ready")

    def _build_tfidf(self):
        corpus, labels = [], []
        for intent, phrases in INTENT_PATTERNS.items():
            for phrase in phrases:
                corpus.append(phrase)
                labels.append(intent)
        self.intent_list = labels
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.vectorizer.fit(corpus)
        self._corpus_vectors = self.vectorizer.transform(corpus)

    # ════════════════════════════════════════════════════════════════════════════
    # STEP 1 — Groq parses message into structured query
    # ════════════════════════════════════════════════════════════════════════════
    def _groq_parse_query(self, message: str) -> dict:
        try:
            client = self._get_groq()
            prompt = f"""You are an e-commerce assistant that parses customer queries.

Extract information from the customer message and return ONLY valid JSON with these fields:
- "intent": one of [greeting, order_status, track_order, product_search, return_policy, refund, shipping, payment, discount, contact, account, cancel_order, complaint, unknown]
- "product_name": the product they are searching for (string or null)
- "category": product category like laptop, phone, shirt etc. (string or null)
- "order_id": specific order ID if mentioned (string or null)
- "price_max": maximum price if mentioned (number or null)
- "price_min": minimum price if mentioned (number or null)

Customer message: "{message}"

Return ONLY the JSON object, no explanation, no markdown backticks:"""

            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.1,
            )
            raw = response.choices[0].message.content.strip()
            raw = re.sub(r"```json|```", "", raw).strip()
            parsed = json.loads(raw)
            print(f"🤖 Groq parsed: {parsed}")
            return parsed

        except Exception as e:
            print(f"⚠️  Groq parse failed: {e} — using rule-based intent")
            intent = self._rule_intent(message)
            return {
                "intent": intent,
                "product_name": None,
                "category": None,
                "order_id": None,
                "price_max": None,
                "price_min": None,
            }

    # ════════════════════════════════════════════════════════════════════════════
    # STEP 2 — Query MongoDB based on parsed intent
    # ════════════════════════════════════════════════════════════════════════════
    def _query_db(self, parsed: dict, user_id: str = None) -> Optional[str]:
        if not self.is_db_connected:
            return None

        intent = parsed.get("intent", "unknown")

        # Convert user_id safely — if invalid, treat as not logged in
        uid_obj = self._to_object_id(user_id)

        try:
            # ── PRODUCT SEARCH ────────────────────────────────────────────────
            if intent == "product_search":
                product_name = parsed.get("product_name")
                category     = parsed.get("category")
                price_max    = parsed.get("price_max")
                price_min    = parsed.get("price_min")

                mongo_filter = {"isActive": True}
                search_terms = []

                if product_name:
                    search_terms += [
                        {"name":        {"$regex": product_name, "$options": "i"}},
                        {"description": {"$regex": product_name, "$options": "i"}},
                        {"tags":        {"$elemMatch": {"$regex": product_name, "$options": "i"}}},
                        {"brand":       {"$regex": product_name, "$options": "i"}},
                    ]
                if category:
                    search_terms += [
                        {"category":    {"$regex": category, "$options": "i"}},
                        {"subcategory": {"$regex": category, "$options": "i"}},
                    ]

                if search_terms:
                    mongo_filter["$or"] = search_terms

                price_filter = {}
                if price_max:
                    price_filter["$lte"] = float(price_max)
                if price_min:
                    price_filter["$gte"] = float(price_min)
                if price_filter:
                    mongo_filter["price"] = price_filter

                products = list(
                    self.db.products.find(
                        mongo_filter,
                        {"name": 1, "price": 1, "category": 1, "brand": 1,
                         "stock": 1, "discount": 1, "rating": 1}
                    ).sort("soldCount", -1).limit(5)
                )

                if products:
                    lines = []
                    for p in products:
                        disc  = p.get("discount", 0)
                        price = f"₹{p.get('price', 0)}"
                        if disc > 0:
                            price += f" ({disc}% off)"
                        stock = "✅ In Stock" if p.get("stock", 0) > 0 else "❌ Out of Stock"
                        lines.append(
                            f"  • {p.get('name','?')} — {price} | "
                            f"⭐ {p.get('rating', 0)} | {stock}"
                        )
                    header = f"🛍️ Found {len(products)} product(s)"
                    if product_name:
                        header += f" for '{product_name}'"
                    return header + ":\n" + "\n".join(lines)
                else:
                    term = product_name or category or "that"
                    return (
                        f"❌ No products found for '{term}'.\n"
                        "Try a different search term or browse our categories."
                    )

            # ── ORDER STATUS ──────────────────────────────────────────────────
            elif intent == "order_status":
                if not uid_obj:
                    return "🔒 Please log in to check your order status."

                # Specific order ID requested
                order_id_obj = self._to_object_id(parsed.get("order_id"))
                if order_id_obj:
                    order = self.db.orders.find_one(
                        {"_id": order_id_obj, "user": uid_obj}
                    )
                    if order:
                        return self._format_order(order)
                    return "❌ That order was not found in your account."

                # Latest 3 orders
                orders = list(
                    self.db.orders.find({"user": uid_obj})
                    .sort("createdAt", -1).limit(3)
                )
                if not orders:
                    return "📭 You have no orders yet. Start shopping now!"

                return "📋 Your recent orders:\n\n" + "\n\n".join(
                    self._format_order(o) for o in orders
                )

            # ── TRACK ORDER ───────────────────────────────────────────────────
            elif intent == "track_order":
                if not uid_obj:
                    return "🔒 Please log in to track your order."

                active = list(
                    self.db.orders.find(
                        {"user": uid_obj, "status": {"$nin": ["Delivered", "Cancelled"]}}
                    ).sort("createdAt", -1).limit(1)
                )
                if active:
                    o = active[0]
                    tracking = o.get("trackingId", "")
                    tracking_line = f"\n  🔢 Tracking ID: {tracking}" if tracking else ""
                    return (
                        f"🚚 Your latest active order:\n"
                        f"  • Order ID: #{str(o['_id'])[:8]}\n"
                        f"  • Status: {o.get('status', 'N/A')}\n"
                        f"  • Amount: ₹{o.get('totalPrice', 0)}\n"
                        f"  • Payment: {o.get('paymentStatus', 'N/A')}"
                        f"{tracking_line}"
                    )
                return "✅ Great news! All your orders have been delivered."

            # ── CANCEL ORDER ──────────────────────────────────────────────────
            elif intent == "cancel_order":
                if not uid_obj:
                    return "🔒 Please log in to cancel an order."

                pending = list(
                    self.db.orders.find({"user": uid_obj, "status": "Pending"})
                    .sort("createdAt", -1).limit(3)
                )
                if pending:
                    lines = [
                        f"  • Order #{str(o['_id'])[:8]} — ₹{o.get('totalPrice', 0)}"
                        for o in pending
                    ]
                    return (
                        "❌ Orders eligible for cancellation (Pending):\n"
                        + "\n".join(lines)
                        + "\n\nGo to My Orders in your dashboard to cancel."
                    )
                return (
                    "⚠️ No pending orders found.\n"
                    "Orders can only be cancelled while in Pending status."
                )

            return None  # Intent not handled by DB layer

        except Exception as e:
            print(f"❌ DB query error ({intent}): {e}")
            return None

    def _format_order(self, order: dict) -> str:
        oid     = str(order.get("_id", ""))[:8]
        status  = order.get("status", "N/A")
        payment = order.get("paymentStatus", "N/A")
        total   = order.get("totalPrice", 0)
        method  = order.get("paymentMethod", "N/A")
        address = order.get("shippingAddress", "N/A")
        created = order.get("createdAt", "")
        if hasattr(created, "strftime"):
            created = created.strftime("%d %b %Y")

        emoji = {"Pending": "⏳", "Processing": "⚙️", "Shipped": "🚚",
                 "Delivered": "✅", "Cancelled": "❌"}.get(status, "📦")

        return (
            f"{emoji} Order #{oid}\n"
            f"  • Status: {status}\n"
            f"  • Amount: ₹{total}\n"
            f"  • Payment: {payment} via {method}\n"
            f"  • Address: {address}\n"
            f"  • Date: {created}"
        )

    # ════════════════════════════════════════════════════════════════════════════
    # STEP 3 — Rule-based intent + response (fully offline)
    # ════════════════════════════════════════════════════════════════════════════
    def _rule_intent(self, message: str) -> str:
        msg = message.lower().strip()

        # Exact keyword match first
        for intent, phrases in INTENT_PATTERNS.items():
            for phrase in phrases:
                if phrase in msg:
                    return intent.replace(" ", "_")

        # TF-IDF similarity fallback
        if self.vectorizer is not None and self._corpus_vectors is not None:
            try:
                vec  = self.vectorizer.transform([msg])
                sims = cosine_similarity(vec, self._corpus_vectors)[0]
                if sims.max() > 0.25:
                    return self.intent_list[sims.argmax()].replace(" ", "_")
            except Exception:
                pass

        return "unknown"

    def _rule_response(self, intent: str) -> Optional[str]:
        key = intent.replace("_", " ")
        return RULE_RESPONSES.get(key)

    # ════════════════════════════════════════════════════════════════════════════
    # Admin ticket logging
    # ════════════════════════════════════════════════════════════════════════════
    def _log_admin_ticket(self, message: str, intent: str,
                          user_id: str = None, reason: str = "unresolved"):
        if not self.is_db_connected:
            print(f"⚠️  Admin ticket skipped (DB offline): {message}")
            return
        try:
            self.db.admin_tickets.insert_one({
                "message":   message,
                "intent":    intent,
                "user_id":   user_id,
                "reason":    reason,
                "timestamp": datetime.utcnow(),
                "status":    "pending",
            })
            print("📋 Admin ticket created")
        except Exception as e:
            print(f"❌ Admin ticket error: {e}")

    # ════════════════════════════════════════════════════════════════════════════
    # MAIN — respond()
    # ════════════════════════════════════════════════════════════════════════════
    # ── Build a personalized greeting based on user info ────────────────────
    def _greeting_response(self, user_name: str = None) -> str:
        first = user_name.split()[0] if user_name else None
        if first:
            return (
                f"👋 Hi {first}! Great to see you.\n\n"
                "I'm your personal shopping assistant. I can help you with:\n"
                "  📦 Your orders & tracking\n"
                "  🛍️ Product search & recommendations\n"
                "  🚚 Shipping & delivery info\n"
                "  ↩️ Returns & refunds\n"
                "  💳 Payment & billing\n"
                "  ❌ Order cancellation\n\n"
                f"What can I help you with today, {first}?"
            )
        return (
            "👋 Hello! I'm your AI shopping assistant.\n\n"
            "I can help you with:\n"
            "  📦 Orders & tracking\n"
            "  🛍️ Product search\n"
            "  🚚 Shipping info\n"
            "  ↩️ Returns & refunds\n"
            "  💳 Payment info\n\n"
            "How can I assist you today?"
        )

    def respond(self, message: str, user_id: str = None,
                user_name: str = None, user_email: str = None) -> Dict:

        first_name = user_name.split()[0] if user_name else None

        if not message or not message.strip():
            return {
                "response":   self._greeting_response(user_name),
                "intent":     "greeting",
                "confidence": 1.0,
                "source":     "system",
            }

        print(f"\n{'='*60}")
        print(f"📨 User: {message}  |  user_id: {user_id}  |  name: {user_name}")

        # ── STEP 1: Groq → structured query ──────────────────────────────────
        parsed = self._groq_parse_query(message)
        intent = parsed.get("intent", "unknown")
        print(f"🎯 Intent: {intent}")

        # ── Greeting intent → personalized reply ──────────────────────────────
        if intent == "greeting":
            return {
                "response":   self._greeting_response(user_name),
                "intent":     "greeting",
                "confidence": 1.0,
                "source":     "rules",
            }

        # ── Severe complaint → immediate admin escalation ─────────────────────
        severe = ["urgent", "emergency", "scam", "fraud", "stolen",
                  "dangerous", "defective", "threatening"]
        if intent == "complaint" and any(w in message.lower() for w in severe):
            self._log_admin_ticket(message, intent, user_id, "severe_complaint")
            name_line = f" {first_name}," if first_name else ","
            return {
                "response": (
                    f"🚨 I'm so sorry{name_line} this sounds serious!\n"
                    "Our admin team has been notified and will contact you ASAP.\n\n"
                    "📧 Immediate help: support@store.com\n"
                    "📞 Helpline: 1800-XXX-XXXX"
                ),
                "intent":        "escalation",
                "confidence":    1.0,
                "source":        "escalation",
                "ticketCreated": True,
            }

        # ── STEP 2: Database query ────────────────────────────────────────────
        db_response = self._query_db(parsed, user_id)
        if db_response:
            print("✅ Source: database")
            # Prepend a personalized prefix for order/track queries
            if intent in ("order_status", "track_order", "cancel_order") and first_name:
                db_response = f"Sure {first_name}, here's what I found:\n\n" + db_response
            return {"response": db_response, "intent": intent,
                    "confidence": 0.95, "source": "database"}

        # ── STEP 3: Rule-based response ───────────────────────────────────────
        rule_resp = self._rule_response(intent)
        if rule_resp:
            print("✅ Source: rules")
            if first_name:
                rule_resp = f"Hi {first_name}! " + rule_resp
            return {"response": rule_resp, "intent": intent,
                    "confidence": 0.80, "source": "rules"}

        # ── STEP 4: Groq LLM general response ────────────────────────────────
        # If intent is unknown or not ecommerce-related, log a ticket FIRST
        ecommerce_intents = {
            "order_status", "track_order", "product_search", "return_policy",
            "refund", "shipping", "payment", "discount", "contact",
            "account", "cancel_order", "complaint", "greeting"
        }
        is_off_topic = intent not in ecommerce_intents
        if is_off_topic:
            self._log_admin_ticket(message, intent, user_id, "off_topic_question")
            print("📋 Off-topic question logged as admin ticket")

        try:
            print("🤖 Trying Groq LLM general response...")
            client = self._get_groq()
            user_context = ""
            if user_name:
                user_context += f"The customer's name is {user_name}."
            if user_email:
                user_context += f" Their email is {user_email}."
            if user_id:
                user_context += f" They are a registered user (ID: {user_id})."
            if not user_id:
                user_context += " They are browsing as a guest."

            system_prompt = (
                "You are a warm, friendly, and knowledgeable e-commerce customer support assistant.\n"
                "Always address the customer by their first name if you know it.\n"
                "Be empathetic, helpful, and concise. Do not invent product or order details.\n"
                "If the question is not related to shopping, orders, or this e-commerce platform, "
                "politely say this is outside your scope and offer to help with shopping-related queries.\n"
                f"{user_context}"
            )
            resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": message}
                ],
                max_tokens=300,
                temperature=0.7,
            )
            answer = resp.choices[0].message.content.strip()
            print("✅ Source: groq_llm")
            return {"response": answer, "intent": "general",
                    "confidence": 0.65, "source": "groq_llm",
                    "ticketCreated": is_off_topic}
        except Exception as e:
            print(f"❌ Groq LLM failed: {e}")

        # ── STEP 5: Admin escalation (last resort) ────────────────────────────
        self._log_admin_ticket(message, intent, user_id, "no_answer_found")
        print("⚠️  Source: admin_escalation")
        sorry_name = f" {first_name}" if first_name else ""
        return {
            "response": (
                f"❓ I'm sorry{sorry_name}, I wasn't able to find a specific answer.\n\n"
                "Our support team has been notified and will reach out to you shortly.\n\n"
                "📧 Email: support@store.com\n"
                "⏱️ Response time: within 4-24 hours"
            ),
            "intent":        "escalation",
            "confidence":    0.2,
            "source":        "admin_escalation",
            "ticketCreated": True,
        }
