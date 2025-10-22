from fastapi import APIRouter, HTTPException, Body, Depends
from utils.jwt_auth import get_current_user
from schemas.todo import (
    CreateTodoRequest, CreateTodoResponse,
    UpdateTodoRequest, UpdateTodoResponse,
    MarkDoneRequest, MarkDoneResponse,
    DeleteTodoResponse,
    GetTodosResponse,
    TodoHelpRequest, TodoHelpResponse,
    FilterTodosResponse,
    GetChatHistoryResponse
)
from services.todo_service import (
    create_todo,
    update_todo,
    mark_todo_done,
    delete_todo,
    get_user_todos,
    todo_ai_help,
    get_todos_by_status,
    get_todo_chat_history
)

router = APIRouter()

@router.post("/create", response_model=CreateTodoResponse)
async def create_todo_endpoint(
    req: CreateTodoRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Create a new todo.
    
    - **task**: Todo task name
    - **category**: Category for grouping todos
    - **date**: Target date (optional, defaults to today)
    - **description**: Optional description
    
    Requires JWT authentication - uses authenticated user's email.
    Returns the todo_id and success message.
    """
    try:
        result = await create_todo(
            email=current_user,
            task=req.task,
            category=req.category,
            target_date=req.date,
            description=req.description
        )
        return CreateTodoResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.put("/update", response_model=UpdateTodoResponse)
async def update_todo_endpoint(
    req: UpdateTodoRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Update an existing todo.
    
    - **todo_id**: Todo ID
    - **task**: Updated task (optional)
    - **category**: Updated category (optional)
    - **date**: Updated target date (optional)
    - **description**: Updated description (optional)
    - **status**: Updated status - pending, in_progress, or done (optional)
    """
    try:
        result = await update_todo(
            todo_id=req.todo_id,
            task=req.task,
            category=req.category,
            target_date=req.date,
            description=req.description,
            status=req.status
        )
        return UpdateTodoResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.put("/mark-done", response_model=MarkDoneResponse)
async def mark_done_endpoint(
    req: MarkDoneRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Mark a todo as done.
    
    - **todo_id**: Todo ID
    """
    try:
        result = await mark_todo_done(req.todo_id)
        return MarkDoneResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.delete("/{todo_id}", response_model=DeleteTodoResponse)
async def delete_todo_endpoint(
    todo_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a todo.
    
    - **todo_id**: Todo ID
    """
    try:
        result = await delete_todo(todo_id)
        return DeleteTodoResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/my-todos", response_model=GetTodosResponse)
async def get_todos_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Get all todos for authenticated user.
    
    Returns list of todos sorted by date (most recent first).
    Requires JWT authentication - returns current user's todos.
    """
    try:
        result = await get_user_todos(current_user)
        return GetTodosResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/help", response_model=TodoHelpResponse)
async def todo_help_endpoint(
    req: TodoHelpRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    AI assistant to help with todo completion.
    
    - **todo_id**: Todo ID
    - **question**: Your question about the task
    
    The AI will provide step-by-step guidance, ask clarifying questions,
    and help you complete your todo. Chat history is maintained for context.
    """
    try:
        result = await todo_ai_help(req.todo_id, req.question)
        return TodoHelpResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/filter", response_model=FilterTodosResponse)
async def filter_todos_endpoint(
    status: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get todos filtered by status for authenticated user.
    
    - **status**: Filter by status (pending, in_progress, or done)
    
    Returns todos matching the specified status, sorted by date (most recent first).
    Requires JWT authentication - returns current user's todos.
    """
    try:
        result = await get_todos_by_status(current_user, status)
        return FilterTodosResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/chat-history/{todo_id}", response_model=GetChatHistoryResponse)
async def get_chat_history_endpoint(
    todo_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get chat history for a todo.
    
    - **todo_id**: Todo ID
    
    Returns all chat messages between user and AI assistant for this todo.
    """
    try:
        result = await get_todo_chat_history(todo_id)
        return GetChatHistoryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

