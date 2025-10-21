from fastapi import APIRouter, HTTPException, Body, Depends
from schemas.friend_chat import (
    FriendChatRequest, FriendChatResponse,
    CreateFriendChatResponse,
    FriendChatHistoryResponse, UserFriendChatsResponse,
    DeleteFriendChatResponse
)
from services.friend_chat_service import (
    generate_friend_reply, create_friend_chat, get_friend_chat_history,
    get_user_friend_chats, delete_friend_chat
)
from utils.jwt_auth import get_current_user

router = APIRouter()

@router.post("/create", response_model=CreateFriendChatResponse)
async def create_friend_chat_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Create a new friend chat session for a user.
    Returns a chat_id that can be used for future messages.
    Requires JWT authentication.
    """
    try:
        chat_id = await create_friend_chat(current_user)
        return CreateFriendChatResponse(
            chat_id=chat_id,
            message="Friend chat created successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/", response_model=FriendChatResponse)
async def friend_chat_endpoint(
    req: FriendChatRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Send a message to the AI friend companion.
    
    - If chat_id is provided: continues existing conversation
    - If chat_id is null/empty: creates new chat session
    - Returns the AI response along with chat_id and title
    Requires JWT authentication.
    """
    try:
        reply, chat_id, title = await generate_friend_reply(
            req.chat_id,
            req.message,
            current_user
        )
        
        return FriendChatResponse(
            chat_id=chat_id,
            response=reply,
            title=title
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/my-chats", response_model=UserFriendChatsResponse)
async def get_user_friend_chats_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Get all friend chats for the authenticated user.
    Returns list of chat summaries with chat_id, title, timestamps, and message count.
    Sorted by most recently updated first.
    Requires JWT authentication - uses authenticated user's email.
    """
    try:
        chats = await get_user_friend_chats(current_user)
        return UserFriendChatsResponse(email=current_user, chats=chats)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/{chat_id}", response_model=FriendChatHistoryResponse)
async def get_friend_chat_endpoint(
    chat_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get complete friend chat history by chat_id.
    Returns all messages, user email, title, and timestamps.
    Requires JWT authentication.
    """
    try:
        chat_data = await get_friend_chat_history(chat_id)
        if not chat_data:
            raise HTTPException(status_code=404, detail="Friend chat not found")
        
        return FriendChatHistoryResponse(**chat_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.delete("/{chat_id}", response_model=DeleteFriendChatResponse)
async def delete_friend_chat_endpoint(
    chat_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a friend chat by chat_id.
    Requires JWT authentication (must own the chat).
    """
    try:
        success = await delete_friend_chat(chat_id, current_user)
        if not success:
            raise HTTPException(status_code=404, detail="Friend chat not found")
        
        return DeleteFriendChatResponse(
            message="Friend chat deleted successfully",
            chat_id=chat_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
