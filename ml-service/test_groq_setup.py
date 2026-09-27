"""
Test script to verify Groq API connection and chatbot functionality
Run this FIRST to make sure everything is set up correctly
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 70)
print("🧪 GROQ API CONNECTION TEST")
print("=" * 70)

# ─── STEP 1: Check Environment Variables ───────────────────────────────
print("\n📋 STEP 1: Checking Environment Variables...")
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    print("❌ ERROR: GROQ_API_KEY not found in environment!")
    print("\n📝 TO FIX:")
    print("   1. Create a .env file in ml-service/ directory")
    print("   2. Add: GROQ_API_KEY=your_actual_groq_api_key")
    print("   3. Get free API key from: https://console.groq.com/keys")
    sys.exit(1)
else:
    print(f"✅ GROQ_API_KEY found: {groq_api_key[:10]}...***")

# ─── STEP 2: Check if groq package is installed ─────────────────────────
print("\n📦 STEP 2: Checking if groq package is installed...")
try:
    from groq import Groq
    print("✅ groq package is installed")
except ImportError:
    print("❌ ERROR: groq package not installed!")
    print("\n📝 TO FIX:")
    print("   1. Run: pip install -r requirements.txt")
    print("   2. Or: pip install groq")
    sys.exit(1)

# ─── STEP 3: Test Groq API Connection ───────────────────────────────────
print("\n🔌 STEP 3: Testing Groq API Connection...")
try:
    client = Groq(api_key=groq_api_key)
    
    # Make a simple test request
    response = client.chat.completions.create(
        model="llama-3.2-90b-vision-preview",
        messages=[{"role": "user", "content": "Say 'Groq API is working!' in one sentence."}],
        max_tokens=20,
        temperature=0.1
    )
    
    result = response.choices[0].message.content.strip()
    print(f"✅ Groq API Connection SUCCESS!")
    print(f"   Response: {result}")
    
except Exception as e:
    print(f"❌ ERROR: Groq API Connection Failed!")
    print(f"   Error: {str(e)}")
    print("\n📝 TROUBLESHOOTING:")
    print("   1. Verify your GROQ_API_KEY is correct")
    print("   2. Check if API key is active: https://console.groq.com/keys")
    print("   3. Verify internet connection")
    sys.exit(1)

# ─── STEP 4: Test Intent Classification ─────────────────────────────────
print("\n🎯 STEP 4: Testing Chatbot Intent Classification...")
try:
    client = Groq(api_key=groq_api_key)
    
    test_messages = [
        "Where is my order?",
        "I want to buy a laptop",
        "What's your return policy?",
        "My product is broken!"
    ]
    
    for msg in test_messages:
        prompt = f"""Classify this e-commerce query into ONE category.
Categories: order status, product search, track order, return policy, refund, shipping, complaint, greeting, unknown

Query: "{msg}"

Return ONLY the category name:"""
        
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=20,
            temperature=0.1
        )
        
        intent = response.choices[0].message.content.strip().lower()
        print(f"   ✓ '{msg}' → {intent}")
        
    print("✅ Intent Classification Working!")
    
except Exception as e:
    print(f"❌ ERROR in Intent Classification: {str(e)}")
    sys.exit(1)

# ─── STEP 5: Check MongoDB Connection ────────────────────────────────────
print("\n🗄️  STEP 5: Checking MongoDB Connection...")
try:
    import pymongo
    mongo_url = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/ecommerce"
    
    client_db = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
    client_db.admin.command('ping')
    
    print(f"✅ MongoDB Connection SUCCESS!")
    print(f"   Connected to: {mongo_url.split('/')[-1]}")
    
except Exception as e:
    print(f"⚠️  MongoDB Connection Failed (Optional)")
    print(f"   Note: Chatbot works without DB, but features like order lookup won't work")
    print(f"   Error: {str(e)}")

# ─── SUMMARY ───────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("✅ ALL TESTS PASSED! Your setup is ready!")
print("=" * 70)
print("\n📊 Next Steps:")
print("   1. Start ML Service: python main.py")
print("   2. Test Chatbot endpoint: POST http://localhost:8000/chat")
print("   3. Example payload: {\"message\": \"Where is my order?\", \"userId\": \"user123\"}")
print("\n" + "=" * 70)
