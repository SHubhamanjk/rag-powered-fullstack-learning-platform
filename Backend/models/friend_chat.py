from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class FriendMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

class FriendChat(BaseModel):
    id: Optional[str] = None  # MongoDB _id as string
    user_email: EmailStr
    title: Optional[str] = None
    messages: List[FriendMessage] = []
    created_at: datetime
    updated_at: datetime

