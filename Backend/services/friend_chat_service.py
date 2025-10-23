import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from utils.db import get_friend_chat_collection, get_user_collection
from utils.timezone import get_current_time
from utils.llm import groq_chat_completion, chat_completion_with_fallback
from prompts import FRIEND_MODE_SYSTEM_PROMPT

def generate_title(message: str) -> str:
    """Generate title from first 5 words of message"""
    words = message.split()[:5]
    return " ".join(words)

def get_chat_context(messages: List[Dict], limit_per_role: int = 20) -> List[Dict]:
    """Get last N messages per role for context"""
    user_messages = [msg for msg in messages if msg["role"] == "user"][-limit_per_role:]
    assistant_messages = [msg for msg in messages if msg["role"] == "assistant"][-limit_per_role:]
    
    # Combine and sort by timestamp
    all_messages = user_messages + assistant_messages
    all_messages.sort(key=lambda x: x["timestamp"])
    
    return [{"role": msg["role"], "content": msg["content"]} for msg in all_messages]

async def create_friend_chat(email: str) -> str:
    """Create a new friend chat session"""
    user_coll = get_user_collection()
    user = user_coll.find_one({"email": email})
    
    if not user:
        raise ValueError(f"User with email {email} not found")
    
    chat_coll = get_friend_chat_collection()
    chat_doc = {
        "user_email": email,
        "title": None,
        "messages": [],
        "created_at": get_current_time(),
        "updated_at": get_current_time(),
    }
    
    result = chat_coll.insert_one(chat_doc)
    return str(result.inserted_id)

async def generate_friend_reply(chat_id: Optional[str], message: str, email: str) -> tuple[str, str, Optional[str]]:
    """Generate AI friend reply for a message"""
    chat_coll = get_friend_chat_collection()
    
    # If no chat_id, create new chat
    if not chat_id:
        chat_id = await create_friend_chat(email)
    
    # Verify chat exists
    try:
        chat_doc = chat_coll.find_one({"_id": ObjectId(chat_id)})
    except:
        raise ValueError("Invalid chat_id format")
    
    if not chat_doc:
        raise ValueError(f"Chat with id {chat_id} not found")
    
    # Verify user owns this chat
    if chat_doc["user_email"] != email:
        raise ValueError("Unauthorized: This chat belongs to another user")
    
    # Generate title from first message if not set
    title = chat_doc.get("title")
    if not title and len(chat_doc["messages"]) == 0:
        title = generate_title(message)
    
    # Get chat context (last 20 user + 20 assistant messages)
    context_messages = get_chat_context(chat_doc["messages"], limit_per_role=20)
    
    # Build messages for LLM
    messages = [{"role": "system", "content": FRIEND_MODE_SYSTEM_PROMPT}]
    messages += context_messages
    messages.append({"role": "user", "content": message})
    
    # Call LLM with automatic fallback (Groq -> Gemini)
    try:
        # Extract system instruction
        system_instruction = None
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
            else:
                user_messages.append(msg)
        
        reply, provider_used = chat_completion_with_fallback(
            messages=user_messages,
            system_instruction=system_instruction,
            temperature=0.7,
            prefer_gemini=False  # Prefer Groq for friend chat (faster)
        )
        print(f"[Friend Chat] Response generated using: {provider_used}")
        
    except Exception as e:
        # Log error and provide fallback response
        print(f"[Friend Chat] All providers failed: {str(e)}")
        reply = "I'm temporarily unable to respond. Please try again in a moment."
    
    # Prepare new messages
    current_time = get_current_time()
    new_messages = [
        {
            "role": "user",
            "content": message,
            "timestamp": current_time,
        },
        {
            "role": "assistant",
            "content": reply,
            "timestamp": current_time,
        }
    ]
    
    # Update chat document
    update_doc = {
        "$push": {"messages": {"$each": new_messages}},
        "$set": {"updated_at": current_time}
    }
    
    # Set title only if it's the first message
    if title and not chat_doc.get("title"):
        update_doc["$set"]["title"] = title
    
    chat_coll.update_one({"_id": ObjectId(chat_id)}, update_doc)
    
    return reply, chat_id, title or chat_doc.get("title")

async def get_friend_chat_history(chat_id: str) -> Optional[Dict[str, Any]]:
    """Get complete friend chat history by chat_id"""
    chat_coll = get_friend_chat_collection()
    
    try:
        chat_doc = chat_coll.find_one({"_id": ObjectId(chat_id)})
    except:
        raise ValueError("Invalid chat_id format")
    
    if not chat_doc:
        return None
    
    # Convert ObjectId to string
    chat_doc["chat_id"] = str(chat_doc.pop("_id"))
    return chat_doc

async def get_user_friend_chats(email: str) -> List[Dict[str, Any]]:
    """Get all friend chats for a user"""
    user_coll = get_user_collection()
    user = user_coll.find_one({"email": email})
    
    if not user:
        raise ValueError(f"User with email {email} not found")
    
    chat_coll = get_friend_chat_collection()
    chats = list(chat_coll.find({"user_email": email}).sort("updated_at", -1))
    
    result = []
    for chat in chats:
        result.append({
            "chat_id": str(chat["_id"]),
            "title": chat.get("title"),
            "created_at": chat["created_at"],
            "updated_at": chat["updated_at"],
            "message_count": len(chat.get("messages", []))
        })
    
    return result

async def delete_friend_chat(chat_id: str, email: str) -> bool:
    """Delete a friend chat by chat_id"""
    chat_coll = get_friend_chat_collection()
    
    try:
        chat_doc = chat_coll.find_one({"_id": ObjectId(chat_id)})
    except:
        raise ValueError("Invalid chat_id format")
    
    if not chat_doc:
        raise ValueError(f"Chat with id {chat_id} not found")
    
    # Verify user owns this chat
    if chat_doc["user_email"] != email:
        raise ValueError("Unauthorized: This chat belongs to another user")
    
    result = chat_coll.delete_one({"_id": ObjectId(chat_id)})
    return result.deleted_count > 0

