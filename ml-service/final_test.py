from models.chatbot import SupportChatbot
from dotenv import load_dotenv
import os
load_dotenv()

chatbot = SupportChatbot()
chatbot.load()

# Test individual queries
test_cases = [
    ('What is your return policy?', 'return_policy'),
    ('Where is my order?', 'order_status'),
    ('How much is shipping?', 'shipping'),
    ('Help me find a product', 'product_search'),
]

print('=== FINAL FUNCTIONALITY TEST ===')
for message, expected in test_cases:
    result = chatbot.respond(message)
    status = '✅' if result['intent'] == expected else '❌'
    print(f'{status} "{message}" -> {result["intent"]} (expected: {expected})')
    if result['intent'] != expected:
        print(f'   Response: {result["response"][:60]}...')

print('\n=== AI TEST ===')
ai_result = chatbot.respond('What is the meaning of life?')
print(f'AI Query -> {ai_result["intent"]}')
print(f'Response: {ai_result["response"][:100]}...')