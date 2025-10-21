from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

class Chat(BaseModel):
    id: Optional[str] = None  # MongoDB _id as string
    user_email: EmailStr
    title: Optional[str] = None
    messages: List[Message] = []
    created_at: datetime
    updated_at: datetime

