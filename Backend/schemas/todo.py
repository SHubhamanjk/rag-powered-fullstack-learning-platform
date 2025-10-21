from pydantic import BaseModel, EmailStr
from typing import Optional, List

# ============================================================================
# CREATE TODO
# ============================================================================

class CreateTodoRequest(BaseModel):
    task: str
    date: Optional[str] = None  # If not provided, use today's date
    description: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "task": "Complete project documentation",
                    "date": "2024-01-20",
                    "description": "Write comprehensive API docs and user guide"
                }
            ]
        }
    }

class CreateTodoResponse(BaseModel):
    todo_id: str
    message: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "todo_id": "todo_abc123",
                    "message": "Todo created successfully"
                }
            ]
        }
    }

# ============================================================================
# UPDATE TODO
# ============================================================================

class UpdateTodoRequest(BaseModel):
    todo_id: str
    task: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # pending, in_progress, or done

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "todo_id": "todo_abc123",
                    "task": "Updated task name",
                    "date": "2024-01-25",
                    "description": "Updated description",
                    "status": "in_progress"
                }
            ]
        }
    }

class UpdateTodoResponse(BaseModel):
    todo_id: str
    message: str

# ============================================================================
# MARK AS DONE
# ============================================================================

class MarkDoneRequest(BaseModel):
    todo_id: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "todo_id": "todo_abc123"
                }
            ]
        }
    }

class MarkDoneResponse(BaseModel):
    todo_id: str
    message: str
    status: str

# ============================================================================
# DELETE TODO
# ============================================================================

class DeleteTodoResponse(BaseModel):
    todo_id: str
    message: str

# ============================================================================
# GET TODO
# ============================================================================

class TodoSchema(BaseModel):
    todo_id: str
    email: EmailStr
    task: str
    description: Optional[str]
    status: str
    date: str
    created_at: str
    updated_at: str

class GetTodosResponse(BaseModel):
    email: EmailStr
    todos: List[TodoSchema]

# ============================================================================
# TODO HELP (AI ASSISTANT)
# ============================================================================

class TodoHelpRequest(BaseModel):
    todo_id: str
    question: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "todo_id": "todo_abc123",
                    "question": "How should I start this task?"
                }
            ]
        }
    }

class TodoHelpResponse(BaseModel):
    todo_id: str
    response: str

# ============================================================================
# FILTER TODOS BY STATUS
# ============================================================================

class FilterTodosResponse(BaseModel):
    email: EmailStr
    status: str
    todos: List[TodoSchema]

# ============================================================================
# GET CHAT HISTORY
# ============================================================================

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

class GetChatHistoryResponse(BaseModel):
    todo_id: str
    task: str
    chat_history: List[ChatMessage]

