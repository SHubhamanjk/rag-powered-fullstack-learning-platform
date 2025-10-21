from fastapi import APIRouter, HTTPException, Body, Depends
from schemas.chat import (
    ChatRequest, ChatResponse,
    CreateChatResponse,
    ChatHistoryResponse, UserChatsResponse,
    DeleteChatResponse
)
from services.chat_service import (
    generate_reply, create_chat, get_chat_history,
    get_user_chats, delete_chat
)
from utils.jwt_auth import get_current_user

router = APIRouter()

@router.post("/create", response_model=CreateChatResponse)
async def create_chat_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Create a new chat session for a user.
    Returns a chat_id that can be used for future messages.
    Requires JWT authentication.
    """
    try:
        chat_id = await create_chat(current_user)
        return CreateChatResponse(
            chat_id=chat_id,
            message="Chat created successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Send a message to the AI assistant.
    
    - If chat_id is provided: continues existing conversation
    - If chat_id is null/empty: creates new chat session
    - Returns the AI response along with chat_id and title
    Requires JWT authentication.
    """
    try:
        reply, chat_id, title = await generate_reply(
            req.chat_id,
            req.message,
            current_user
        )
        
        return ChatResponse(
            chat_id=chat_id,
            response=reply,
            title=title
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/my-chats", response_model=UserChatsResponse)
async def get_user_chats_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Get all chats for the authenticated user.
    Returns list of chat summaries with chat_id, title, timestamps, and message count.
    Sorted by most recently updated first.
    Requires JWT authentication - uses authenticated user's email.
    """
    try:
        chats = await get_user_chats(current_user)
        return UserChatsResponse(email=current_user, chats=chats)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/{chat_id}", response_model=ChatHistoryResponse)
async def get_chat_endpoint(
    chat_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get complete chat history by chat_id.
    Returns all messages, user email, title, and timestamps.
    Requires JWT authentication.
    """
    try:
        chat_data = await get_chat_history(chat_id)
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return ChatHistoryResponse(**chat_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.delete("/{chat_id}", response_model=DeleteChatResponse)
async def delete_chat_endpoint(
    chat_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a chat by chat_id.
    Requires JWT authentication (must own the chat).
    """
    try:
        success = await delete_chat(chat_id, current_user)
        if not success:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return DeleteChatResponse(
            message="Chat deleted successfully",
            chat_id=chat_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
