from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class MessageSchema(BaseModel):
    role: str
    content: str
    timestamp: datetime

class ChatRequest(BaseModel):
    chat_id: Optional[str] = None
    message: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "message": "Explain quantum physics"
                }
            ]
        }
    }

class ChatResponse(BaseModel):
    chat_id: str
    response: str
    title: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "response": "Quantum physics is the study of matter and energy at the atomic level...",
                    "title": "Explain quantum physics"
                }
            ]
        }
    }


class CreateChatResponse(BaseModel):
    chat_id: str
    message: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "message": "Chat created successfully"
                }
            ]
        }
    }

class ChatHistoryResponse(BaseModel):
    chat_id: str
    user_email: EmailStr
    title: Optional[str] = None
    messages: List[MessageSchema]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "chat_id": "507f1f77bcf86cd799439011",
                    "user_email": "alice@example.com",
                    "title": "Explain quantum physics",
                    "messages": [
                        {
                            "role": "user",
                            "content": "Explain quantum physics",
                            "timestamp": "2025-01-15T10:30:00"
                        },
                        {
                            "role": "assistant",
                            "content": "Quantum physics is...",
                            "timestamp": "2025-01-15T10:30:05"
                        }
                    ],
                    "created_at": "2025-01-15T10:30:00",
                    "updated_at": "2025-01-15T10:30:05"
                }
            ]
        }
    }

class ChatSummary(BaseModel):
    chat_id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int

class UserChatsResponse(BaseModel):
    email: EmailStr
    chats: List[ChatSummary]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "alice@example.com",
                    "chats": [
                        {
                            "chat_id": "507f1f77bcf86cd799439011",
                            "title": "Explain quantum physics",
                            "created_at": "2025-01-15T10:30:00",
                            "updated_at": "2025-01-15T10:35:00",
                            "message_count": 10
                        }
                    ]
                }
            ]
        }
    }

class DeleteChatResponse(BaseModel):
    message: str
    chat_id: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Chat deleted successfully",
                    "chat_id": "507f1f77bcf86cd799439011"
                }
            ]
        }
    }

class TemporaryChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class TemporaryChatRequest(BaseModel):
    message: str
    conversation_history: List[TemporaryChatMessage] = []
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "What is machine learning?",
                    "conversation_history": [
                        {
                            "role": "user",
                            "content": "Tell me about AI"
                        },
                        {
                            "role": "assistant",
                            "content": "AI stands for Artificial Intelligence..."
                        }
                    ]
                }
            ]
        }
    }

class TemporaryChatResponse(BaseModel):
    response: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "response": "Machine learning is a subset of AI that enables computers to learn from data..."
                }
            ]
        }
    }
