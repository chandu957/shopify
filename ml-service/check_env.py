import os
from dotenv import load_dotenv

load_dotenv()

groq_key = os.getenv("GROQ_API_KEY")
if groq_key:
    print(f"✅ GROQ_API_KEY is set: {groq_key[:10]}...***")
else:
    print("❌ GROQ_API_KEY is NOT set")
