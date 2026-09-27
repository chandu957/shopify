"""
seed_db.py — Run once to populate MongoDB with sample products, users, and coupons.
Usage: python seed_db.py

Loads .env in this order so the Node server and seed use the SAME MONGO_URI:
  1) ../server/.env   (your Express app)
  2) ml-service/.env  (optional overrides)
  3) process cwd
"""
import os
from pathlib import Path
from pymongo import MongoClient
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / "server" / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ecommerce")
print(f"📦 Using MONGO_URI → {MONGO_URI.split('@')[-1] if '@' in MONGO_URI else MONGO_URI}")


def _mongo_client():
    uri = MONGO_URI
    kwargs = {}
    if uri.startswith("mongodb+srv://") or os.getenv("MONGO_TLS", "") == "1":
        kwargs["tls"] = True
        kwargs["tlsAllowInvalidCertificates"] = True
    return MongoClient(uri, **kwargs)


client = _mongo_client()
db = client["ecommerce"]

# ── Clear collections ─────────────────────────────────────────────────────
for name in ("orders", "carts", "useractivities", "products", "users", "coupons"):
    db[name].delete_many({})
print("🗑  Cleared existing data")

# ── Products ──────────────────────────────────────────────────────────────
PRODUCTS = [
    # Electronics - Smartphones (10 products)
    { "name": "iPhone 15 Pro Max", "category": "Electronics", "subcategory": "Smartphones", "brand": "Apple", "price": 159900, "discount": 5, "rating": 4.8, "stock": 50, "soldCount": 450, "tags": ["smartphone", "ios", "apple", "premium", "camera"], "images": ["iphone15.jpg"] },
    { "name": "Samsung Galaxy S24 Ultra", "category": "Electronics", "subcategory": "Smartphones", "brand": "Samsung", "price": 129999, "discount": 8, "rating": 4.7, "stock": 80, "soldCount": 380, "tags": ["smartphone", "android", "samsung", "s-pen", "camera"], "images": ["s24.jpg"] },
    { "name": "Google Pixel 8 Pro", "category": "Electronics", "subcategory": "Smartphones", "brand": "Google", "price": 99999, "discount": 6, "rating": 4.6, "stock": 60, "soldCount": 220, "tags": ["smartphone", "android", "google", "ai", "camera"], "images": ["pixel8.jpg"] },
    { "name": "OnePlus 12", "category": "Electronics", "subcategory": "Smartphones", "brand": "OnePlus", "price": 64999, "discount": 10, "rating": 4.5, "stock": 100, "soldCount": 180, "tags": ["smartphone", "android", "oneplus", "fast-charging", "gaming"], "images": ["oneplus12.jpg"] },
    { "name": "Xiaomi 14 Ultra", "category": "Electronics", "subcategory": "Smartphones", "brand": "Xiaomi", "price": 79999, "discount": 12, "rating": 4.4, "stock": 70, "soldCount": 150, "tags": ["smartphone", "android", "xiaomi", "camera", "leica"], "images": ["xiaomi14.jpg"] },
    { "name": "Sony Xperia 1 V", "category": "Electronics", "subcategory": "Smartphones", "brand": "Sony", "price": 89999, "discount": 7, "rating": 4.3, "stock": 40, "soldCount": 90, "tags": ["smartphone", "android", "sony", "cinematic", "professional"], "images": ["xperia1v.jpg"] },
    { "name": "Nothing Phone 2a", "category": "Electronics", "subcategory": "Smartphones", "brand": "Nothing", "price": 24999, "discount": 15, "rating": 4.2, "stock": 120, "soldCount": 300, "tags": ["smartphone", "android", "nothing", "budget", "glyph"], "images": ["nothing2a.jpg"] },
    { "name": "Asus ROG Phone 8", "category": "Electronics", "subcategory": "Smartphones", "brand": "Asus", "price": 99999, "discount": 5, "rating": 4.6, "stock": 30, "soldCount": 120, "tags": ["smartphone", "android", "asus", "gaming", "rgb"], "images": ["rog8.jpg"] },
    { "name": "Motorola Edge 40", "category": "Electronics", "subcategory": "Smartphones", "brand": "Motorola", "price": 29999, "discount": 8, "rating": 4.1, "stock": 90, "soldCount": 200, "tags": ["smartphone", "android", "motorola", "budget", "durable"], "images": ["edge40.jpg"] },
    { "name": "Realme GT 5", "category": "Electronics", "subcategory": "Smartphones", "brand": "Realme", "price": 34999, "discount": 10, "rating": 4.3, "stock": 110, "soldCount": 250, "tags": ["smartphone", "android", "realme", "performance", "racing"], "images": ["gt5.jpg"] },

    # Electronics - Laptops (8 products)
    { "name": "MacBook Pro 16-inch M3 Max", "category": "Electronics", "subcategory": "Laptops", "brand": "Apple", "price": 329900, "discount": 3, "rating": 4.9, "stock": 25, "soldCount": 85, "tags": ["laptop", "macbook", "apple", "m3", "professional"], "images": ["macbook_pro.jpg"] },
    { "name": "Dell XPS 13 Plus", "category": "Electronics", "subcategory": "Laptops", "brand": "Dell", "price": 149999, "discount": 7, "rating": 4.5, "stock": 35, "soldCount": 95, "tags": ["laptop", "dell", "windows", "ultrabook", "premium"], "images": ["xps13.jpg"] },
    { "name": "Lenovo ThinkPad X1 Carbon", "category": "Electronics", "subcategory": "Laptops", "brand": "Lenovo", "price": 179999, "discount": 5, "rating": 4.7, "stock": 40, "soldCount": 110, "tags": ["laptop", "lenovo", "business", "durable", "security"], "images": ["x1carbon.jpg"] },
    { "name": "HP Spectre x360 14", "category": "Electronics", "subcategory": "Laptops", "brand": "HP", "price": 129999, "discount": 8, "rating": 4.4, "stock": 45, "soldCount": 75, "tags": ["laptop", "hp", "2-in-1", "premium", "touchscreen"], "images": ["spectre.jpg"] },
    { "name": "Asus ZenBook Pro 16X OLED", "category": "Electronics", "subcategory": "Laptops", "brand": "Asus", "price": 199999, "discount": 6, "rating": 4.6, "stock": 30, "soldCount": 60, "tags": ["laptop", "asus", "creative", "oled", "performance"], "images": ["zenbook.jpg"] },
    { "name": "MSI Creator Z17", "category": "Electronics", "subcategory": "Laptops", "brand": "MSI", "price": 249999, "discount": 4, "rating": 4.5, "stock": 20, "soldCount": 45, "tags": ["laptop", "msi", "gaming", "creator", "high-end"], "images": ["creatorz17.jpg"] },
    { "name": "Acer Swift 5", "category": "Electronics", "subcategory": "Laptops", "brand": "Acer", "price": 79999, "discount": 10, "rating": 4.2, "stock": 55, "soldCount": 130, "tags": ["laptop", "acer", "budget", "lightweight", "student"], "images": ["swift5.jpg"] },
    { "name": "Samsung Galaxy Book3 Pro 360", "category": "Electronics", "subcategory": "Laptops", "brand": "Samsung", "price": 119999, "discount": 9, "rating": 4.3, "stock": 50, "soldCount": 85, "tags": ["laptop", "samsung", "2-in-1", "s-pen", "productivity"], "images": ["galaxybook.jpg"] },

    # Electronics - Audio (6 products)
    { "name": "Sony WH-1000XM5", "category": "Electronics", "subcategory": "Headphones", "brand": "Sony", "price": 29999, "discount": 12, "rating": 4.8, "stock": 100, "soldCount": 520, "tags": ["headphones", "noise-cancelling", "wireless", "sony", "premium"], "images": ["sony_xm5.jpg"] },
    { "name": "Bose QuietComfort Ultra", "category": "Electronics", "subcategory": "Headphones", "brand": "Bose", "price": 34999, "discount": 8, "rating": 4.7, "stock": 75, "soldCount": 280, "tags": ["headphones", "noise-cancelling", "bose", "comfort", "wireless"], "images": ["bose_qc.jpg"] },
    { "name": "Apple AirPods Pro (2nd gen)", "category": "Electronics", "subcategory": "Earbuds", "brand": "Apple", "price": 24900, "discount": 5, "rating": 4.6, "stock": 150, "soldCount": 680, "tags": ["earbuds", "apple", "wireless", "noise-cancelling", "compact"], "images": ["airpods_pro.jpg"] },
    { "name": "Samsung Galaxy Buds3 Pro", "category": "Electronics", "subcategory": "Earbuds", "brand": "Samsung", "price": 19999, "discount": 10, "rating": 4.4, "stock": 120, "soldCount": 340, "tags": ["earbuds", "samsung", "wireless", "gaming", "android"], "images": ["buds3.jpg"] },
    { "name": "JBL Live 500BTNC", "category": "Electronics", "subcategory": "Headphones", "brand": "JBL", "price": 8999, "discount": 15, "rating": 4.2, "stock": 200, "soldCount": 450, "tags": ["headphones", "jbl", "budget", "wireless", "bass"], "images": ["jbl_live.jpg"] },
    { "name": "Marshall Major III Bluetooth", "category": "Electronics", "subcategory": "Headphones", "brand": "Marshall", "price": 14999, "discount": 7, "rating": 4.5, "stock": 80, "soldCount": 290, "tags": ["headphones", "marshall", "vintage", "wireless", "premium"], "images": ["marshall.jpg"] },

    # Electronics - Wearables (4 products)
    { "name": "Apple Watch Series 9", "category": "Electronics", "subcategory": "Smartwatches", "brand": "Apple", "price": 41900, "discount": 3, "rating": 4.7, "stock": 60, "soldCount": 180, "tags": ["smartwatch", "apple", "fitness", "health", "ios"], "images": ["watch9.jpg"] },
    { "name": "Samsung Galaxy Watch 6", "category": "Electronics", "subcategory": "Smartwatches", "brand": "Samsung", "price": 29999, "discount": 8, "rating": 4.5, "stock": 70, "soldCount": 220, "tags": ["smartwatch", "samsung", "fitness", "android", "health"], "images": ["galaxy_watch.jpg"] },
    { "name": "Fitbit Charge 6", "category": "Electronics", "subcategory": "Fitness Trackers", "brand": "Fitbit", "price": 14999, "discount": 10, "rating": 4.3, "stock": 90, "soldCount": 350, "tags": ["fitness", "tracker", "health", "google", "wearable"], "images": ["fitbit.jpg"] },
    { "name": "Garmin Forerunner 265", "category": "Electronics", "subcategory": "Sports Watches", "brand": "Garmin", "price": 39999, "discount": 5, "rating": 4.6, "stock": 40, "soldCount": 95, "tags": ["sports", "running", "garmin", "gps", "fitness"], "images": ["garmin.jpg"] },

    # Clothing - Men's Fashion (6 products)
    { "name": "Levi's 511 Slim Fit Jeans", "category": "Fashion", "subcategory": "Jeans", "brand": "Levi's", "price": 3499, "discount": 20, "rating": 4.4, "stock": 200, "soldCount": 950, "tags": ["jeans", "denim", "men", "slim-fit", "casual"], "images": ["levis.jpg"] },
    { "name": "Nike Air Force 1 '07", "category": "Sports", "subcategory": "Shoes", "brand": "Nike", "price": 7995, "discount": 0, "rating": 4.6, "stock": 150, "soldCount": 720, "tags": ["sneakers", "nike", "men", "classic", "casual"], "images": ["af1.jpg"] },
    { "name": "Adidas Ultraboost 23", "category": "Sports", "subcategory": "Shoes", "brand": "Adidas", "price": 18999, "discount": 15, "rating": 4.5, "stock": 120, "soldCount": 580, "tags": ["running", "adidas", "men", "comfort", "sports"], "images": ["ultraboost.jpg"] },
    { "name": "H&M Slim Fit Chinos", "category": "Fashion", "subcategory": "Pants", "brand": "H&M", "price": 1999, "discount": 30, "rating": 4.1, "stock": 300, "soldCount": 680, "tags": ["pants", "chinos", "men", "slim-fit", "office"], "images": ["hm_chinos.jpg"] },
    { "name": "Puma RS-X Sneakers", "category": "Sports", "subcategory": "Shoes", "brand": "Puma", "price": 8999, "discount": 10, "rating": 4.3, "stock": 100, "soldCount": 420, "tags": ["sneakers", "puma", "men", "retro", "streetwear"], "images": ["puma_rsx.jpg"] },
    { "name": "Zara Cotton Polo Shirt", "category": "Fashion", "subcategory": "T-Shirts", "brand": "Zara", "price": 2999, "discount": 25, "rating": 4.2, "stock": 180, "soldCount": 390, "tags": ["polo", "zara", "men", "cotton", "casual"], "images": ["zara_polo.jpg"] },

    # Clothing - Women's Fashion (6 products)
    { "name": "H&M Oversized Hoodie", "category": "Fashion", "subcategory": "Tops", "brand": "H&M", "price": 1999, "discount": 30, "rating": 4.3, "stock": 250, "soldCount": 1200, "tags": ["hoodie", "women", "oversized", "casual", "winter"], "images": ["hm_hoodie.jpg"] },
    { "name": "Nike Air Max 270", "category": "Sports", "subcategory": "Shoes", "brand": "Nike", "price": 12995, "discount": 5, "rating": 4.5, "stock": 130, "soldCount": 650, "tags": ["sneakers", "nike", "women", "comfort", "style"], "images": ["airmax.jpg"] },
    { "name": "Levi's High-Waisted Jeans", "category": "Fashion", "subcategory": "Jeans", "brand": "Levi's", "price": 3999, "discount": 15, "rating": 4.4, "stock": 170, "soldCount": 780, "tags": ["jeans", "women", "high-waisted", "denim", "fashion"], "images": ["levis_women.jpg"] },
    { "name": "SS Kashmir Willow Cricket Bat", "category": "Sports", "subcategory": "Cricket", "brand": "SS", "price": 8999, "discount": 10, "rating": 4.4, "stock": 120, "soldCount": 410, "tags": ["cricket", "bat", "willow", "sports"], "images": ["cricket_bat.jpg"] },
    { "name": "Adidas Originals Superstar", "category": "Sports", "subcategory": "Shoes", "brand": "Adidas", "price": 8999, "discount": 8, "rating": 4.6, "stock": 140, "soldCount": 520, "tags": ["sneakers", "adidas", "women", "classic", "streetwear"], "images": ["superstar.jpg"] },
    { "name": "Nike Strike Football Size 5", "category": "Sports", "subcategory": "Football", "brand": "Nike", "price": 2499, "discount": 8, "rating": 4.5, "stock": 220, "soldCount": 920, "tags": ["football", "soccer", "training", "sports"], "images": ["football.jpg"] },

    # Books (5 products)
    { "name": "Atomic Habits", "category": "Books", "subcategory": "Self-Help", "brand": "James Clear", "price": 499, "discount": 10, "rating": 4.9, "stock": 500, "soldCount": 1450, "tags": ["book", "self-help", "habits", "productivity", "bestseller"], "images": ["atomic_habits.jpg"] },
    { "name": "Clean Code", "category": "Books", "subcategory": "Programming", "brand": "Robert C. Martin", "price": 899, "discount": 5, "rating": 4.8, "stock": 200, "soldCount": 720, "tags": ["book", "programming", "coding", "software", "development"], "images": ["clean_code.jpg"] },
    { "name": "The Alchemist", "category": "Books", "subcategory": "Fiction", "brand": "Paulo Coelho", "price": 299, "discount": 0, "rating": 4.7, "stock": 400, "soldCount": 1100, "tags": ["book", "fiction", "novel", "classic", "inspiration"], "images": ["alchemist.jpg"] },
    { "name": "Sapiens: A Brief History", "category": "Books", "subcategory": "History", "brand": "Yuval Noah Harari", "price": 699, "discount": 8, "rating": 4.6, "stock": 300, "soldCount": 680, "tags": ["book", "history", "science", "humanity", "bestseller"], "images": ["sapiens.jpg"] },
    { "name": "The Psychology of Money", "category": "Books", "subcategory": "Finance", "brand": "Morgan Housel", "price": 399, "discount": 12, "rating": 4.5, "stock": 350, "soldCount": 920, "tags": ["book", "finance", "money", "psychology", "wealth"], "images": ["psychology_money.jpg"] },

    # Home & Kitchen (5 products)
    { "name": "Philips Air Fryer HD9252", "category": "Home", "subcategory": "Kitchen", "brand": "Philips", "price": 8999, "discount": 15, "rating": 4.5, "stock": 80, "soldCount": 420, "tags": ["kitchen", "air-fryer", "cooking", "healthy", "philips"], "images": ["philips_fryer.jpg"] },
    { "name": "Dyson V15 Detect", "category": "Home", "subcategory": "Cleaning", "brand": "Dyson", "price": 64999, "discount": 5, "rating": 4.7, "stock": 30, "soldCount": 95, "tags": ["vacuum", "dyson", "cleaning", "cordless", "premium"], "images": ["dyson_v15.jpg"] },
    { "name": "Instant Pot Duo 7-in-1", "category": "Home", "subcategory": "Kitchen", "brand": "Instant Pot", "price": 7999, "discount": 10, "rating": 4.6, "stock": 90, "soldCount": 380, "tags": ["kitchen", "pressure-cooker", "multi-cooker", "cooking", "smart"], "images": ["instant_pot.jpg"] },
    { "name": "Nespresso Vertuo Coffee Maker", "category": "Home", "subcategory": "Kitchen", "brand": "Nespresso", "price": 24999, "discount": 8, "rating": 4.4, "stock": 60, "soldCount": 210, "tags": ["coffee", "maker", "nespresso", "espresso", "premium"], "images": ["nespresso.jpg"] },
    { "name": "KitchenAid Stand Mixer", "category": "Home", "subcategory": "Kitchen", "brand": "KitchenAid", "price": 39999, "discount": 6, "rating": 4.8, "stock": 40, "soldCount": 120, "tags": ["kitchen", "mixer", "baking", "kitchenaid", "professional"], "images": ["kitchenaid.jpg"] },
]

# Curated Unsplash images (order matches PRODUCTS) — realistic ecommerce visuals, not random placeholders
U = "auto=format&fit=crop&w=800&q=80"
PRODUCT_IMAGE_URLS = [
    f"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?{U}",  # smartphone
    f"https://images.unsplash.com/photo-1610945265064-0e44e4ceaa7e?{U}",
    f"https://images.unsplash.com/photo-1592899677857-8b9550d6b1a8?{U}",
    f"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?{U}",
    f"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?{U}",
    f"https://images.unsplash.com/photo-1610945265064-0e44e4ceaa7e?{U}",
    f"https://images.unsplash.com/photo-1592899677857-8b9550d6b1a8?{U}",
    f"https://images.unsplash.com/photo-1610945265064-0e44e4ceaa7e?{U}",
    f"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?{U}",
    f"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?{U}",
    f"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?{U}",  # laptop
    f"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?{U}",
    f"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?{U}",
    f"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?{U}",
    f"https://images.unsplash.com/photo-1525547719571-2fb84871b70d?{U}",
    f"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?{U}",
    f"https://images.unsplash.com/photo-1525547719571-2fb84871b70d?{U}",
    f"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?{U}",
    f"https://images.unsplash.com/photo-1505740420922-5e560c06d30e?{U}",  # headphones
    f"https://images.unsplash.com/photo-1546435770-a3e426bfbf8b?{U}",
    f"https://images.unsplash.com/photo-1572536140728-2ac9989a7e21?{U}",
    f"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?{U}",
    f"https://images.unsplash.com/photo-1505740420922-5e560c06d30e?{U}",
    f"https://images.unsplash.com/photo-1546435770-a3e426bfbf8b?{U}",
    f"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?{U}",  # watch
    f"https://images.unsplash.com/photo-1579586337278-3befd40fd17a?{U}",
    f"https://images.unsplash.com/photo-1575311374027-64e6489d6f2b?{U}",
    f"https://images.unsplash.com/photo-1508685095989-7925cd3b8c8c?{U}",
    f"https://images.unsplash.com/photo-1542272604-787c3835535d?{U}",  # jeans
    f"https://images.unsplash.com/photo-1542291026-7eec264c27ff?{U}",  # sneakers
    f"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?{U}",
    f"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?{U}",
    f"https://images.unsplash.com/photo-1608231387042-66d1773070a5?{U}",
    f"https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?{U}",
    f"https://images.unsplash.com/photo-1556821840-3a63f95609a7?{U}",  # hoodie
    f"https://images.unsplash.com/photo-1600185365928-3ab2b9519513?{U}",
    f"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?{U}",
    f"https://images.unsplash.com/photo-1531415074968-036ba1d5750d?{U}",  # cricket
    f"https://images.unsplash.com/photo-1542291026-7eec264c27ff?{U}",
    f"https://images.unsplash.com/photo-1579953873718-b91fc7e0e8a0?{U}",  # football
    f"https://images.unsplash.com/photo-1544947950-fa07a98d237f?{U}",  # books
    f"https://images.unsplash.com/photo-1517694712202-14dd9538aa97?{U}",
    f"https://images.unsplash.com/photo-1512820790803-83ca734da794?{U}",
    f"https://images.unsplash.com/photo-1589829085418-394fbc9d6cb2?{U}",
    f"https://images.unsplash.com/photo-1543002588-bfa74002ed7e?{U}",
    f"https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?{U}",  # kitchen / air fryer
    f"https://images.unsplash.com/photo-1558317374-067fb5f30001?{U}",  # vacuum
    f"https://images.unsplash.com/photo-1585515320310-259814833e62?{U}",
    f"https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?{U}",
    f"https://images.unsplash.com/photo-1594385208974-2f9228c2e147?{U}",
]

if len(PRODUCT_IMAGE_URLS) != len(PRODUCTS):
    raise SystemExit(f"Image list ({len(PRODUCT_IMAGE_URLS)}) must match products ({len(PRODUCTS)})")

for i, p in enumerate(PRODUCTS):
    p.pop("images", None)
    img = PRODUCT_IMAGE_URLS[i]
    p["image"] = img
    p["images"] = [img]
    p["isActive"] = True
    sold = int(p.get("soldCount", 100))
    p["numReviews"] = min(2000, max(24, sold // 2))
    p["reviews"] = []
    p["views"] = sold * 3
    p["purchases"] = sold
    p["soldCount"] = sold
    p["description"] = f"Premium quality {p['name']} from {p['brand']}. Highly rated by our customers."
    p["createdAt"] = datetime.utcnow()
    p["updatedAt"] = datetime.utcnow()

result = db.products.insert_many(PRODUCTS)
print(f"✅ Inserted {len(result.inserted_ids)} products")
for c in sorted(db.products.distinct("category")):
    print(f"   • {c}: {db.products.count_documents({'category': c})}")

# ── Users ──────────────────────────────────────────────────────────────────
product_ids = list(db.products.find({}, {"_id": 1}))

def hash_pw(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

USERS = [
    {
        "name": "Chetan Admin",
        "email": "chetan@gmail.com",
        "password": hash_pw("chetan123"),
        "role": "admin",
        "createdAt": datetime.utcnow(),
    },
    {
        "name": "Arjun Sharma",
        "email": "arjun@gmail.com",
        "password": hash_pw("user123"),
        "role": "user",
        "age": 25,
        "gender": "male",
        "location": "Hyderabad",
        "purchaseHistory": [
            {"productId": product_ids[0]["_id"], "category": "Electronics", "price": 159900, "date": datetime.utcnow() - timedelta(days=10)},
            {"productId": product_ids[18]["_id"], "category": "Electronics", "price": 29999, "date": datetime.utcnow() - timedelta(days=5)},
        ],
        "browsingHistory": [
            {"productId": product_ids[3]["_id"], "category": "Electronics", "timeSpent": 120},
            {"productId": product_ids[4]["_id"], "category": "Electronics", "timeSpent": 90},
        ],
        "wishlist": [product_ids[5]["_id"]],
        "createdAt": datetime.utcnow(),
    },
    {
        "name": "Priya Reddy",
        "email": "priya@gmail.com",
        "password": hash_pw("user123"),
        "role": "user",
        "age": 22,
        "gender": "female",
        "location": "Bangalore",
        "purchaseHistory": [
            {"productId": product_ids[29]["_id"], "category": "Sports", "price": 7995, "date": datetime.utcnow() - timedelta(days=7)},
            {"productId": product_ids[40]["_id"], "category": "Books", "price": 499, "date": datetime.utcnow() - timedelta(days=3)},
        ],
        "browsingHistory": [
            {"productId": product_ids[34]["_id"], "category": "Fashion", "timeSpent": 200},
            {"productId": product_ids[36]["_id"], "category": "Fashion", "timeSpent": 150},
        ],
        "wishlist": [],
        "createdAt": datetime.utcnow(),
    },
    {
        "name": "Rahul Verma",
        "email": "rahul@gmail.com",
        "password": hash_pw("user123"),
        "role": "user",
        "age": 28,
        "gender": "male",
        "location": "Mumbai",
        "purchaseHistory": [
            {"productId": product_ids[10]["_id"], "category": "Electronics", "price": 329900, "date": datetime.utcnow() - timedelta(days=14)},
            {"productId": product_ids[46]["_id"], "category": "Home", "price": 64999, "date": datetime.utcnow() - timedelta(days=2)},
        ],
        "browsingHistory": [
            {"productId": product_ids[11]["_id"], "category": "Electronics", "timeSpent": 95},
            {"productId": product_ids[24]["_id"], "category": "Electronics", "timeSpent": 110},
        ],
        "wishlist": [product_ids[22]["_id"]],
        "createdAt": datetime.utcnow(),
    },
    {
        "name": "Sneha Patel",
        "email": "sneha@gmail.com",
        "password": hash_pw("user123"),
        "role": "user",
        "age": 24,
        "gender": "female",
        "location": "Pune",
        "purchaseHistory": [
            {"productId": product_ids[35]["_id"], "category": "Sports", "price": 12995, "date": datetime.utcnow() - timedelta(days=6)},
            {"productId": product_ids[41]["_id"], "category": "Books", "price": 899, "date": datetime.utcnow() - timedelta(days=1)},
        ],
        "browsingHistory": [
            {"productId": product_ids[1]["_id"], "category": "Electronics", "timeSpent": 180},
            {"productId": product_ids[49]["_id"], "category": "Home", "timeSpent": 45},
        ],
        "wishlist": [product_ids[7]["_id"], product_ids[41]["_id"]],
        "createdAt": datetime.utcnow(),
    },
]

db.users.insert_many(USERS)
print(f"✅ Inserted {len(USERS)} users (1 admin + 4 customers)")
print("   → chetan@gmail.com / chetan123 (admin)")
print("   → arjun@gmail.com, priya@gmail.com, rahul@gmail.com, sneha@gmail.com / user123")

# ── Coupons ────────────────────────────────────────────────────────────────
COUPONS = [
    {"code": "WELCOME10",  "discountType": "percent", "discountValue": 10, "minOrderAmount": 500,  "maxUses": 1000, "usedCount": 0, "isActive": True, "expiresAt": datetime.utcnow() + timedelta(days=90)},
    {"code": "FLAT200",    "discountType": "flat",    "discountValue": 200,"minOrderAmount": 1000, "maxUses": 500,  "usedCount": 0, "isActive": True, "expiresAt": datetime.utcnow() + timedelta(days=30)},
    {"code": "TECH15",     "discountType": "percent", "discountValue": 15, "minOrderAmount": 5000, "maxUses": 200,  "usedCount": 0, "isActive": True, "expiresAt": datetime.utcnow() + timedelta(days=60)},
    {"code": "BOOKS20",    "discountType": "percent", "discountValue": 20, "minOrderAmount": 200,  "maxUses": 300,  "usedCount": 0, "isActive": True, "expiresAt": datetime.utcnow() + timedelta(days=45)},
]

db.coupons.insert_many(COUPONS)
print(f"✅ Inserted {len(COUPONS)} coupons: WELCOME10, FLAT200, TECH15, BOOKS20")

print("\n🎉 Database seeded successfully!")
print("Start backend: cd server && npm run dev")
print("Start ML:      cd ml-service && uvicorn main:app --reload")
# Force recommender to rebuild from new catalogue / users
_pkl = os.path.join(os.path.dirname(__file__), "models", "saved", "recommender.pkl")
if os.path.isfile(_pkl):
    os.remove(_pkl)
    print("♻  Removed models/saved/recommender.pkl — ML service will retrain on next start.")
