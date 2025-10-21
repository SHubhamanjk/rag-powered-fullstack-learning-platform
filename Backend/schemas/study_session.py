from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# ============================================================================
# CREATE STUDY SESSION
# ============================================================================

class CreateStudySessionRequest(BaseModel):
    subject: str
    grade: str
    study_details: str
    resources_text: Optional[str] = None
    pyq_text: Optional[str] = None
    syllabus_text: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "subject": "Physics",
                "grade": "12th Grade",
                "study_details": "Thermodynamics and Heat Transfer",
                "resources_text": "Chapter notes on laws of thermodynamics...",
                "pyq_text": "Previous year questions from 2020-2023",
                "syllabus_text": "Unit 1: Thermodynamics, Unit 2: Heat Transfer..."
            }]
        }
    }

class CreateStudySessionResponse(BaseModel):
    session_id: str
    session_name: str
    message: str

# ============================================================================
# AI STUDY ASSISTANT
# ============================================================================

class StudyAssistantRequest(BaseModel):
    session_id: str
    question: str

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "session_id": "session_abc123",
                "question": "Explain the first law of thermodynamics"
            }]
        }
    }

class StudyAssistantResponse(BaseModel):
    session_id: str
    response: str

# ============================================================================
# GET STUDY SESSIONS
# ============================================================================

class SessionSummary(BaseModel):
    session_id: str
    session_name: str
    subject: str
    grade: str
    created_at: str
    updated_at: str

class GetStudySessionsResponse(BaseModel):
    email: EmailStr
    sessions: List[SessionSummary]

# ============================================================================
# GET SESSION DETAILS
# ============================================================================

class ChatMessageSchema(BaseModel):
    role: str
    content: str
    timestamp: str

class SessionMetadata(BaseModel):
    subject: str
    grade: str
    study_details: str
    resources_text: Optional[str]
    pyq_text: Optional[str]
    syllabus_text: Optional[str]

class GetSessionDetailsResponse(BaseModel):
    session_id: str
    session_name: str
    email: EmailStr
    metadata: SessionMetadata
    chat_history: List[ChatMessageSchema]
    created_at: str
    updated_at: str

# ============================================================================
# UPDATE SESSION
# ============================================================================

class UpdateStudySessionRequest(BaseModel):
    session_id: str
    session_name: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[str] = None
    study_details: Optional[str] = None
    resources_text: Optional[str] = None
    pyq_text: Optional[str] = None
    syllabus_text: Optional[str] = None

class UpdateStudySessionResponse(BaseModel):
    session_id: str
    message: str

# ============================================================================
# DELETE SESSION
# ============================================================================

class DeleteStudySessionResponse(BaseModel):
    session_id: str
    message: str

# ============================================================================
# GENERATE QUIZ IN SESSION
# ============================================================================

class GenerateSessionQuizRequest(BaseModel):
    session_id: str

class GenerateSessionQuizResponse(BaseModel):
    session_id: str
    quiz_id: str
    mcq_questions: List[Dict[str, Any]]
    descriptive_questions: List[Dict[str, Any]]
    message: str

# ============================================================================
# GENERATE MINDMAP IN SESSION
# ============================================================================

class GenerateSessionMindmapRequest(BaseModel):
    session_id: str

class MindmapItem(BaseModel):
    mindmap_id: str
    title: str
    description: str
    image_b64: str
    created_at: str

class GenerateSessionMindmapResponse(BaseModel):
    session_id: str
    mindmaps: List[MindmapItem]
    message: str

# ============================================================================
# EVALUATE QUIZ IN SESSION
# ============================================================================

class QuizAnswerInput(BaseModel):
    question_id: str
    answer: Any  # Can be int (for MCQ) or str (for descriptive)

class EvaluateSessionQuizRequest(BaseModel):
    quiz_id: str
    answers: List[QuizAnswerInput]

class QuestionResult(BaseModel):
    question_id: str
    question: str
    user_answer: Any
    correct_answer: Any
    is_correct: bool
    score: float
    max_score: float
    feedback: Optional[str]

class EvaluateSessionQuizResponse(BaseModel):
    quiz_id: str
    session_id: str
    total_questions: int
    correct_answers: int
    total_score: float
    max_score: float
    percentage: float
    results: List[QuestionResult]
    overall_feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    study_suggestions: List[str]

# ============================================================================
# GET QUIZZES FOR SESSION
# ============================================================================

class QuizSummary(BaseModel):
    quiz_id: str
    created_at: str
    is_evaluated: bool
    total_questions: int
    score: Optional[float] = None
    percentage: Optional[float] = None

class GetSessionQuizzesResponse(BaseModel):
    session_id: str
    quizzes: List[QuizSummary]

# ============================================================================
# GET QUIZ DETAILS
# ============================================================================

class GetQuizDetailsResponse(BaseModel):
    quiz_id: str
    session_id: str
    mcq_questions: List[Dict[str, Any]]
    descriptive_questions: List[Dict[str, Any]]
    created_at: str
    is_evaluated: bool
    evaluation_report: Optional[Dict[str, Any]]

# ============================================================================
# GET MINDMAPS FOR SESSION
# ============================================================================

class GetSessionMindmapsResponse(BaseModel):
    session_id: str
    mindmaps: List[MindmapItem]

