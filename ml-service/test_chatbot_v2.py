#!/usr/bin/env python3
"""
Test script for improved chatbot with database integration
Tests: Database queries, intent classification, admin ticket logging
"""
import os
import sys
import json
from dotenv import load_dotenv
from models.chatbot import SupportChatbot
from datetime import datetime

load_dotenv()

def test_chatbot():
    """Test comprehensive chatbot functionality."""
    print("\n" + "="*70)
    print("🤖 CHATBOT V2 COMPREHENSIVE TEST")
    print("="*70)
    
    # Initialize chatbot
    chatbot = SupportChatbot()
    chatbot.load()
    
    # Test cases with expected intent
    test_cases = [
        # (message, user_id, description, expected_source)
        ("hello", None, "Greeting", "system"),
        ("find laptops", None, "Product search (no user_id)", "database or rules"),
        ("order status", None, "Order status (no user_id)", "rules"),
        ("track my order", "user123", "Track order with user_id", "database or rules"),
        ("what's your return policy", None, "Return policy query", "database or rules"),
        ("i want a refund", None, "Refund request", "database or rules"),
        ("shipping cost", None, "Shipping info", "database or rules"),
        ("urgent: product broke on arrival", None, "Urgent complaint", "escalation"),
        ("show me phone cases", None, "Product search (no user_id)", "database or rules"),
        ("what's the status of order 12345", "user456", "Specific order query", "database"),
    ]
    
    print("\n📝 Testing various user queries:\n")
    
    for i, (message, user_id, description, expected_source) in enumerate(test_cases, 1):
        print(f"\n{i}. {description}")
        print(f"   └─ Message: '{message}'")
        print(f"   └─ User ID: {user_id or 'None (guest)'}")
        
        try:
            result = chatbot.respond(message, user_id)
            
            print(f"   ✅ Response received:")
            print(f"      • Intent: {result.get('intent', 'N/A')}")
            print(f"      • Source: {result.get('source', 'N/A')} {'✓' if result.get('source') else '✗'}")
            print(f"      • Confidence: {result.get('confidence', 0):.2f}")
            print(f"      • Message: {result.get('response', 'N/A')[:80]}..." if len(result.get('response', '')) > 80 else f"      • Message: {result.get('response', 'N/A')}")
            
            if result.get('ticketCreated'):
                print(f"      • 🎫 Admin Ticket Created")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    # Check admin tickets
    print("\n" + "="*70)
    print("📋 CHECKING ADMIN TICKETS")
    print("="*70)
    
    if chatbot.is_db_connected:
        try:
            tickets = list(chatbot.db.admin_tickets.find().sort("timestamp", -1).limit(5))
            print(f"\n📊 Total admin tickets: {chatbot.db.admin_tickets.count_documents({})}")
            
            if tickets:
                print(f"\n📌 Latest tickets:\n")
                for i, ticket in enumerate(tickets, 1):
                    print(f"{i}. Reason: {ticket.get('reason')}")
                    print(f"   Message: {ticket.get('message')}")
                    print(f"   Status: {ticket.get('status')}")
                    print(f"   Created: {ticket.get('timestamp')}\n")
        except Exception as e:
            print(f"❌ Error reading admin tickets: {e}")
    else:
        print("⚠️  Database not connected - cannot check tickets")
    
    print("\n" + "="*70)
    print("✅ TEST COMPLETED")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_chatbot()
