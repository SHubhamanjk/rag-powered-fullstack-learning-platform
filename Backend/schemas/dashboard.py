from pydantic import BaseModel, EmailStr
from typing import List, Optional

# ============================================================================
# TODO SCHEMAS
# ============================================================================

class TodoSummary(BaseModel):
    todo_id: str
    task: str
    description: Optional[str] = None
    status: str  # pending, in_progress, done
    date: str
    created_at: str
    updated_at: str

# ============================================================================
# CHAT SCHEMAS
# ============================================================================

class ChatSummary(BaseModel):
    chat_id: str
    title: str
    message_count: int
    created_at: str
    last_updated: str

# ============================================================================
# STUDY SESSION SCHEMAS
# ============================================================================

class StudySessionQuizSummary(BaseModel):
    quiz_id: str
    generated_at: str
    total_questions: int
    mcq_count: int
    descriptive_count: int

class StudySessionMindmapSummary(BaseModel):
    mindmap_id: str
    generated_at: str
    mindmap_count: int

class StudySessionSummary(BaseModel):
    session_id: str
    session_name: str
    subject: str
    grade: str
    chat_message_count: int
    quizzes: List[StudySessionQuizSummary]
    mindmaps: List[StudySessionMindmapSummary]
    created_at: str
    updated_at: str

# ============================================================================
# TUTORIAL SUPPORT SCHEMAS
# ============================================================================

class TutorialQuizSummary(BaseModel):
    quiz_id: str
    from_timestamp: Optional[str] = None
    to_timestamp: Optional[str] = None
    generated_at: str
    total_questions: int
    mcq_count: int
    descriptive_count: int
    evaluated: bool
    marks_obtained: Optional[float] = None
    total_marks: Optional[float] = None

class TutorialMindmapSummary(BaseModel):
    mindmap_id: str
    generated_at: str
    mindmap_count: int

class TutorialSummary(BaseModel):
    tutorial_id: str
    title: str
    tutorial_link: str
    notes_count: int
    chat_message_count: int
    quizzes: List[TutorialQuizSummary]
    mindmaps: List[TutorialMindmapSummary]
    created_at: str
    updated_at: str

# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class DashboardRequest(BaseModel):
    email: EmailStr
    model_config = {"json_schema_extra": {"examples": [{"email": "alice@example.com"}]}}

class DashboardAnalytics(BaseModel):
    """High-level analytics counts"""
    total_study_chats: int
    total_friend_chats: int
    total_study_sessions: int
    total_tutorials: int
    total_todos: int
    todos_pending: int
    todos_in_progress: int
    todos_done: int
    total_quizzes: int  # Combined from study sessions + tutorials
    total_mindmaps: int  # Combined from study sessions + tutorials

class DashboardResponse(BaseModel):
    email: EmailStr
    analytics: DashboardAnalytics
    
    # Detailed data
    study_chats: List[ChatSummary]
    friend_chats: List[ChatSummary]
    study_sessions: List[StudySessionSummary]
    tutorials: List[TutorialSummary]
    todos: List[TodoSummary]
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "alice@example.com",
                "analytics": {
                    "total_study_chats": 5,
                    "total_friend_chats": 3,
                    "total_study_sessions": 4,
                    "total_tutorials": 2,
                    "total_todos": 10,
                    "todos_pending": 3,
                    "todos_in_progress": 2,
                    "todos_done": 5,
                    "total_quizzes": 8,
                    "total_mindmaps": 6
                },
                "study_chats": [],
                "friend_chats": [],
                "study_sessions": [],
                "tutorials": [],
                "todos": []
            }]
        }
    }
