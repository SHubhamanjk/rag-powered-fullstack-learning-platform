import os
from pymongo import MongoClient
from pymongo.collection import Collection
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["medha_ai_backend"]  # database

def get_user_collection() -> Collection:
    return db["users"]

def get_chat_collection() -> Collection:
    """Get study chat collection"""
    return db["chat_history_study"]

def get_friend_chat_collection() -> Collection:
    """Get friend chat collection"""
    return db["chat_history_friend"]

def get_todo_collection() -> Collection:
    return db["todos"]

def get_tutorial_support_collection() -> Collection:
    return db["tutorial_support"]

def get_otp_collection() -> Collection:
    return db["otp_verification"]

def get_password_reset_tokens_collection() -> Collection:
    return db["password_reset_tokens"]

def get_study_sessions_collection() -> Collection:
    return db["study_sessions"]