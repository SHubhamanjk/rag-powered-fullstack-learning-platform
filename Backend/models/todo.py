from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class TodoMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

class Todo(BaseModel):
    todo_id: str
    email: EmailStr
    task: str
    description: Optional[str] = None
    category: str  # Category for grouping todos
    status: str  # "pending", "in_progress", "done"
    date: str  # Target date for the todo
    chat_history: List[TodoMessage] = []
    created_at: datetime
    updated_at: datetime

