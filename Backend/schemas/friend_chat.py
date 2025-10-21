from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class FriendMessageSchema(BaseModel):
    role: str
    content: str
    timestamp: datetime

class FriendChatRequest(BaseModel):
    chat_id: Optional[str] = None
    message: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "message": "Hey, how's your day going?"
                }
            ]
        }
    }

class FriendChatResponse(BaseModel):
    chat_id: str
    response: str
    title: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "response": "My day is going great! Thanks for asking. How about yours?",
                    "title": "Hey, how's your day"
                }
            ]
        }
    }


class CreateFriendChatResponse(BaseModel):
    chat_id: str
    message: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "message": "Friend chat created successfully"
                }
            ]
        }
    }

class FriendChatHistoryResponse(BaseModel):
    chat_id: str
    user_email: EmailStr
    title: Optional[str] = None
    messages: List[FriendMessageSchema]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "user_email": "alice@example.com",
                    "title": "Hey, how's your day",
                    "messages": [
                        {
                            "role": "user",
                            "content": "Hey, how's your day going?",
                            "timestamp": "2025-01-15T10:30:00"
                        },
                        {
                            "role": "assistant",
                            "content": "My day is going great!",
                            "timestamp": "2025-01-15T10:30:05"
                        }
                    ],
                    "created_at": "2025-01-15T10:30:00",
                    "updated_at": "2025-01-15T10:30:05"
                }
            ]
        }
    }

class FriendChatSummary(BaseModel):
    chat_id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int

class UserFriendChatsResponse(BaseModel):
    email: EmailStr
    chats: List[FriendChatSummary]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "alice@example.com",
                    "chats": [
                        {
                            "chat_id": "507f1f77bcf86cd799439011",
                            "title": "Hey, how's your day",
                            "created_at": "2025-01-15T10:30:00",
                            "updated_at": "2025-01-15T10:35:00",
                            "message_count": 10
                        }
                    ]
                }
            ]
        }
    }

class DeleteFriendChatResponse(BaseModel):
    message: str
    chat_id: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Friend chat deleted successfully",
                    "chat_id": "507f1f77bcf86cd799439011"
                }
            ]
        }
    }

