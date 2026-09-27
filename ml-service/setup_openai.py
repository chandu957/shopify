#!/usr/bin/env python3
"""
OpenAI API Key Setup Script
Helps you configure your OpenAI API key for the chatbot
"""
import os
import re
from dotenv import load_dotenv

def setup_openai_key():
    """Setup OpenAI API key in .env file"""

    # Load existing .env file
    load_dotenv()

    print("🤖 OpenAI API Key Setup for E-Commerce Chatbot")
    print("=" * 50)

    # Check if key already exists
    existing_key = os.getenv("OPENAI_API_KEY")
    if existing_key and existing_key != "your_openai_api_key_here":
        print("✅ OpenAI API key is already configured!")
        choice = input("Do you want to update it? (y/N): ").lower().strip()
        if choice != 'y':
            print("Setup cancelled.")
            return

    print("\n📋 To get your OpenAI API key:")
    print("1. Visit: https://platform.openai.com/")
    print("2. Sign up/Login to your account")
    print("3. Go to API Keys section")
    print("4. Create a new secret key")
    print("5. Copy the key (keep it safe!)")

    print("\n🔑 Enter your OpenAI API key:")
    print("(It should start with 'sk-' and be about 50+ characters long)")

    while True:
        api_key = input("\nEnter your API key: ").strip()

        if not api_key:
            print("❌ API key cannot be empty.")
            continue

        if not api_key.startswith("sk-"):
            print("❌ Invalid API key format. OpenAI keys should start with 'sk-'")
            continue

        if len(api_key) < 20:
            print("❌ API key seems too short. Please check and try again.")
            continue

        # Basic validation - OpenAI keys are typically 51 characters for sk- keys
        if not re.match(r'^sk-[a-zA-Z0-9]{48,}$', api_key):
            print("⚠️  API key format looks unusual. Are you sure this is correct?")
            confirm = input("Continue anyway? (y/N): ").lower().strip()
            if confirm != 'y':
                continue

        break

    # Update .env file
    env_path = ".env"
    env_content = ""

    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            env_content = f.read()

    # Replace or add OPENAI_API_KEY
    if "OPENAI_API_KEY=" in env_content:
        env_content = re.sub(r'OPENAI_API_KEY=.*', f'OPENAI_API_KEY={api_key}', env_content)
    else:
        if env_content and not env_content.endswith('\n'):
            env_content += '\n'
        env_content += f'OPENAI_API_KEY={api_key}\n'

    with open(env_path, "w") as f:
        f.write(env_content)

    print("\n✅ OpenAI API key has been configured successfully!")
    print("🔄 Please restart your ML service for the changes to take effect.")
    print("\n🚀 You can now test AI-powered responses with complex questions!")

if __name__ == "__main__":
    try:
        setup_openai_key()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        print("Please try again or manually edit the .env file.")