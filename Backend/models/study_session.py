from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

class StudySessionMetadata(BaseModel):
    subject: str
    grade: str
    study_details: str
    resources_text: Optional[str] = None
    pyq_text: Optional[str] = None
    syllabus_text: Optional[str] = None

class StudySession(BaseModel):
    session_id: str
    session_name: str
    email: EmailStr
    metadata: StudySessionMetadata
    chat_history: List[ChatMessage] = []
    quizzes: List[Dict[str, Any]] = []
    mindmaps: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

