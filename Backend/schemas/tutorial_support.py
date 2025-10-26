from pydantic import BaseModel, EmailStr
from typing import List, Optional, Union
from datetime import datetime

# Create Tutorial Session
class CreateTutorialRequest(BaseModel):
    tutorial_link: str
    group: Optional[str] = "General"  # Category/Group for organization
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_link": "https://youtube.com/watch?v=abc123",
                    "group": "Web Development"
                }
            ]
        }
    }

class CreateTutorialResponse(BaseModel):
    tutorial_id: str
    title: str
    message: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "title": "Introduction to Python Programming",
                    "message": "Tutorial session created successfully"
                }
            ]
        }
    }

# Add Note
class AddNoteRequest(BaseModel):
    tutorial_id: str
    note: str
    timestamp: str  # Video timestamp like "10:25"
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "note": "Important: Variables are declared using let or const",
                    "timestamp": "10:25"
                }
            ]
        }
    }

class AddNoteResponse(BaseModel):
    message: str
    note_id: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Note added successfully",
                    "note_id": "note_123abc"
                }
            ]
        }
    }

# Get Notes
class NoteSchema(BaseModel):
    note_id: str
    note: str
    timestamp: str
    datetime: datetime

class GetNotesResponse(BaseModel):
    tutorial_id: str
    tutorial_link: str
    title: str
    notes: List[NoteSchema]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "tutorial_link": "https://youtube.com/watch?v=abc123",
                    "title": "Introduction to Python Programming",
                    "notes": [
                        {
                            "note_id": "note_123",
                            "note": "Variables are declared using let or const",
                            "timestamp": "10:25",
                            "datetime": "2025-01-15T10:30:00"
                        }
                    ]
                }
            ]
        }
    }

# Update Note
class UpdateNoteRequest(BaseModel):
    updated_text: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "updated_text": "Variables in JavaScript are declared using let, const, or var"
                }
            ]
        }
    }

class UpdateNoteResponse(BaseModel):
    message: str
    note_id: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Note updated successfully",
                    "note_id": "note_123abc"
                }
            ]
        }
    }

# Delete Note
class DeleteNoteResponse(BaseModel):
    message: str
    note_id: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Note deleted successfully",
                    "note_id": "note_123abc"
                }
            ]
        }
    }

# Prettify Notes
class PrettifyNotesRequest(BaseModel):
    tutorial_id: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011"
                }
            ]
        }
    }

class PrettifyNotesResponse(BaseModel):
    tutorial_id: str
    title: str
    prettified_notes: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "title": "Introduction to Python Programming",
                    "prettified_notes": "# Introduction to Python Programming\n\n## Variables (10:25)\n- Variables are declared using let or const..."
                }
            ]
        }
    }

# Detailed Notes
class DetailedNotesRequest(BaseModel):
    tutorial_id: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011"
                }
            ]
        }
    }

class DetailedNotesResponse(BaseModel):
    tutorial_id: str
    title: str
    detailed_notes: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "title": "Introduction to Python Programming",
                    "detailed_notes": "# Complete Study Notes: Introduction to Python Programming\n\n## Overview\nThis tutorial covers..."
                }
            ]
        }
    }

# Get All Tutorials
class TutorialSummary(BaseModel):
    tutorial_id: str
    title: str
    tutorial_link: str
    group: str
    notes_count: int
    created_at: datetime
    updated_at: datetime

class GetAllTutorialsResponse(BaseModel):
    email: EmailStr
    tutorials: List[TutorialSummary]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "student@example.com",
                    "tutorials": [
                        {
                            "tutorial_id": "507f1f77bcf86cd799439011",
                            "title": "Introduction to Python Programming",
                            "tutorial_link": "https://youtube.com/watch?v=abc123",
                            "group": "Programming",
                            "notes_count": 15,
                            "created_at": "2025-01-15T10:00:00",
                            "updated_at": "2025-01-15T15:30:00"
                        }
                    ]
                }
            ]
        }
    }

# Edit Tutorial
class EditTutorialRequest(BaseModel):
    title: Optional[str] = None
    group: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "Updated Tutorial Title",
                    "group": "Advanced Programming"
                }
            ]
        }
    }

class EditTutorialResponse(BaseModel):
    message: str
    tutorial_id: str
    
# Delete Tutorial
class DeleteTutorialResponse(BaseModel):
    message: str
    tutorial_id: str

# Generate Consolidated Notes
class GenerateConsolidatedNotesRequest(BaseModel):
    group: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "group": "Web Development"
                }
            ]
        }
    }

class GenerateConsolidatedNotesResponse(BaseModel):
    group: str
    notes_content: str
    tutorials_included: int
    message: str

# AI Companion Chat
class TutorialChatRequest(BaseModel):
    tutorial_id: str
    question: str
    current_timestamp: Optional[str] = None  # Current video position (MM:SS or HH:MM:SS) for context
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "question": "Can you explain what variables are in more detail?",
                    "current_timestamp": "15:30"
                }
            ]
        }
    }

class TutorialChatResponse(BaseModel):
    tutorial_id: str
    question: str
    answer: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "question": "Can you explain what variables are in more detail?",
                    "answer": "Great question! Variables are like containers that store data in your program..."
                }
            ]
        }
    }

# Chat History
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "role": "user",
                    "content": "Can you explain what variables are in more detail?",
                    "timestamp": "2024-01-15T10:30:00Z"
                },
                {
                    "role": "assistant",
                    "content": "Great question! Variables are like containers that store data in your program...",
                    "timestamp": "2024-01-15T10:30:00Z"
                }
            ]
        }
    }

class TutorialChatHistoryResponse(BaseModel):
    tutorial_id: str
    title: str
    chat_history: List[ChatMessage]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "title": "Introduction to Python Programming",
                    "chat_history": [
                        {
                            "question": "Can you explain what variables are in more detail?",
                            "answer": "Great question! Variables are like containers that store data in your program...",
                            "timestamp": "2024-01-15T10:30:00Z"
                        }
                    ]
                }
            ]
        }
    }

# ============================================================================
# QUIZ SYSTEM SCHEMAS
# ============================================================================

# Generate Quiz
class GenerateQuizRequest(BaseModel):
    tutorial_id: str
    from_timestamp: Optional[str] = "0:00"
    to_timestamp: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "from_timestamp": "10:00",
                    "to_timestamp": "25:00"
                }
            ]
        }
    }

class MCQQuestionSchema(BaseModel):
    question_id: str
    question: str
    options: List[str]
    correct_answer_index: Optional[int] = None  # Optional so we can hide it before quiz submission

class DescriptiveQuestionSchema(BaseModel):
    question_id: str
    question: str
    expected_answer: Optional[str] = None  # Optional so we can hide it before quiz submission

class GenerateQuizResponse(BaseModel):
    quiz_id: str
    tutorial_id: str
    tutorial_title: str
    from_timestamp: str
    to_timestamp: str
    mcq_questions: List[MCQQuestionSchema]
    descriptive_questions: List[DescriptiveQuestionSchema]
    total_questions: int
    created_at: datetime
    message: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "quiz_id": "quiz_abc123",
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "tutorial_title": "Python Tutorial",
                    "from_timestamp": "10:00",
                    "to_timestamp": "25:00",
                    "mcq_questions": [
                        {
                            "question_id": "q1",
                            "question": "What is a variable?",
                            "options": ["A", "B", "C", "D"],
                            "correct_answer_index": 2
                        }
                    ],
                    "descriptive_questions": [
                        {
                            "question_id": "q21",
                            "question": "Explain...",
                            "expected_answer": "..."
                        }
                    ],
                    "total_questions": 25,
                    "created_at": "2025-01-19T10:00:00",
                    "message": "Quiz generated successfully"
                }
            ]
        }
    }

# Evaluate Quiz
class AnswerSubmission(BaseModel):
    question_id: str
    answer: Union[int, str]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "question_id": "q1",
                    "answer": 2
                },
                {
                    "question_id": "q21",
                    "answer": "Variables are containers..."
                }
            ]
        }
    }

class EvaluateQuizRequest(BaseModel):
    quiz_id: str
    answers: List[AnswerSubmission]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "quiz_id": "quiz_abc123",
                    "answers": [
                        {"question_id": "q1", "answer": 2},
                        {"question_id": "q2", "answer": 1}
                    ]
                }
            ]
        }
    }

class QuestionResultSchema(BaseModel):
    question_id: str
    question: str
    user_answer: Union[int, str]
    correct_answer: Union[int, str]
    is_correct: bool
    score: float
    max_score: float
    feedback: Optional[str] = None

class EvaluateQuizResponse(BaseModel):
    quiz_id: str
    tutorial_id: str
    total_score: float
    max_score: float
    percentage: float
    mcq_score: float
    descriptive_score: float
    results: List[QuestionResultSchema]
    overall_feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    study_suggestions: List[str]
    evaluated_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "quiz_id": "quiz_abc123",
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "total_score": 38.5,
                    "max_score": 70,
                    "percentage": 55.0,
                    "mcq_score": 15.0,
                    "descriptive_score": 23.5,
                    "results": [],
                    "overall_feedback": "Good effort!",
                    "strengths": ["Clear understanding of basics"],
                    "areas_for_improvement": ["Advanced concepts need work"],
                    "study_suggestions": ["Review chapter 3", "Practice more"],
                    "evaluated_at": "2025-01-19T11:00:00"
                }
            ]
        }
    }

# Get Quiz Details
class QuizDetailsResponse(BaseModel):
    quiz_id: str
    tutorial_id: str
    tutorial_title: str
    from_timestamp: str
    to_timestamp: str
    mcq_questions: List[MCQQuestionSchema]
    descriptive_questions: List[DescriptiveQuestionSchema]
    is_evaluated: bool
    evaluation_report: Optional[EvaluateQuizResponse] = None
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "quiz_id": "quiz_abc123",
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "tutorial_title": "Python Tutorial",
                    "from_timestamp": "10:00",
                    "to_timestamp": "25:00",
                    "mcq_questions": [],
                    "descriptive_questions": [],
                    "is_evaluated": True,
                    "evaluation_report": None,
                    "created_at": "2025-01-19T10:00:00"
                }
            ]
        }
    }

# Quiz Summary
class QuizSummarySchema(BaseModel):
    quiz_id: str
    tutorial_id: str
    tutorial_title: str
    from_timestamp: str
    to_timestamp: str
    total_questions: int
    is_evaluated: bool
    score: Optional[float] = None
    percentage: Optional[float] = None
    created_at: datetime

class TutorialQuizzesResponse(BaseModel):
    tutorial_id: str
    tutorial_title: str
    quizzes: List[QuizSummarySchema]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "507f1f77bcf86cd799439011",
                    "tutorial_title": "Python Tutorial",
                    "quizzes": [
                        {
                            "quiz_id": "quiz_abc123",
                            "tutorial_id": "507f1f77bcf86cd799439011",
                            "tutorial_title": "Python Tutorial",
                            "from_timestamp": "10:00",
                            "to_timestamp": "25:00",
                            "total_questions": 25,
                            "is_evaluated": True,
                            "score": 38.5,
                            "percentage": 55.0,
                            "created_at": "2025-01-19T10:00:00"
                        }
                    ]
                }
            ]
        }
    }

class UserQuizzesResponse(BaseModel):
    email: EmailStr
    quizzes: List[QuizSummarySchema]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "student@example.com",
                    "quizzes": []
                }
            ]
        }
    }

# ============================================================================
# MINDMAP SCHEMAS
# ============================================================================

class GenerateMindmapsRequest(BaseModel):
    tutorial_id: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "tutorial_abc123"
                }
            ]
        }
    }

class MindmapSchema(BaseModel):
    mindmap_id: str
    title: str
    description: str
    image_b64: str  # base64 encoded PNG image
    created_at: str

class GenerateMindmapsResponse(BaseModel):
    tutorial_id: str
    mindmaps: List[MindmapSchema]
    message: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "tutorial_abc123",
                    "mindmaps": [
                        {
                            "mindmap_id": "mindmap_1",
                            "title": "Introduction to Python",
                            "description": "Covers basic syntax, variables, and data types",
                            "image_b64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
                            "created_at": "2024-01-15T10:30:00"
                        }
                    ],
                    "message": "Generated 2 mindmaps successfully"
                }
            ]
        }
    }

class GetMindmapsResponse(BaseModel):
    tutorial_id: str
    mindmaps: List[MindmapSchema]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tutorial_id": "tutorial_abc123",
                    "mindmaps": [
                        {
                            "mindmap_id": "mindmap_1",
                            "title": "Introduction to Python",
                            "description": "Covers basic syntax, variables, and data types",
                            "image_b64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
                            "created_at": "2024-01-15T10:30:00"
                        }
                    ]
                }
            ]
        }
    }

