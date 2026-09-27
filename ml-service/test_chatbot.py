#!/usr/bin/env python3
"""Safe Chatbot Test Script"""
from models.chatbot import SupportChatbot
from dotenv import load_dotenv
import os

load_dotenv()
print('🤖 Safe Chatbot Test Suite')
print('=' * 50)

print('Loading CHATBOT (Safe - no deletion)...')
chatbot = SupportChatbot()
chatbot.load()
print('✅ Chatbot loaded!')

print('\nRULE-BASED TEST:')
test_cases = [
    ('What is your return policy?', 'return_policy'),
    ('Where is my order?', 'order_status'),
    ('How much is shipping?', 'shipping'),
    ('Help me find a product', 'product_search'),
    ('I have a complaint', 'complaint'),
]

passed = 0
for message, expected in test_cases:
    result = chatbot.respond(message)
    status = '✅' if result['intent'] == expected else '❌'
    print(f'{status} "{message}" -> {result["intent"]} (exp: {expected})')
    if result['intent'] == expected:
        passed += 1

print(f'\nRule-based: {passed}/{len(test_cases)} passed')

print('\nAI TEST:')
ai_tests = ['What is the meaning of life?', 'Password reset?']
for message in ai_tests:
    result = chatbot.respond(message)
    print(f'"{message}"')
    print(f'Intent: {result["intent"]} | Conf: {result["confidence"]:.1f}')
    print(f'Resp: {result["response"][:80]}...')
    print()

print('✅ Test complete!')

