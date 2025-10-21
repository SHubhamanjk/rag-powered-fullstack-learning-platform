from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class Note(BaseModel):
    note_id: str
    note: str
    timestamp: str  # Video timestamp like "10:25"
    datetime: datetime  # When note was created

class TutorialSupport(BaseModel):
    tutorial_id: str
    email: EmailStr
    tutorial_link: str
    title: str
    notes: List[Note] = []
    ai_chat: List[dict] = []  # Chat history for tutorial-specific questions
    created_at: datetime
    updated_at: datetime

