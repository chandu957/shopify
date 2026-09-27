from models.chatbot import SupportChatbot
from dotenv import load_dotenv
import os
load_dotenv()

# Delete old model to force retraining
import os
model_path = "models/saved/chatbot.pkl"
if os.path.exists(model_path):
    os.remove(model_path)
    print("Deleted old model file")

chatbot = SupportChatbot()
chatbot.load()

# Test the problematic query
test_msg = 'help me find a product'
result = chatbot.respond(test_msg)
print(f'Query: "{test_msg}"')
print(f'Intent: {result["intent"]}')
print(f'Confidence: {result["confidence"]}')
print(f'Response: {result["response"][:100]}...')

# Test another query
test_msg2 = 'what is the meaning of life'
result2 = chatbot.respond(test_msg2)
print(f'\\nQuery: "{test_msg2}"')
print(f'Intent: {result2["intent"]}')
print(f'Confidence: {result2["confidence"]}')
print(f'Response: {result2["response"][:100]}...')