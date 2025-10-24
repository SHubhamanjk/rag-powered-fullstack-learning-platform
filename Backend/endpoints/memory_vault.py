"""
Memory Vault API Endpoints
Store and retrieve files/notes with semantic search and chat history
"""

import os
import shutil
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from utils.jwt_auth import get_current_user
from services.memory_vault_service import MemoryVaultService
from utils.embedding import extract_text_from_file
from schemas.memory_vault import (
    ChatRequest,
    ChatResponse,
    SaveNoteRequest,
    SaveNoteResponse,
    UploadFileResponse,
    QueryMemoryRequest,
    QueryMemoryResponse,
    GetMyItemsResponse,
    DeleteItemResponse,
    DownloadLinkResponse,
    ChatHistoryResponse
)

router = APIRouter(prefix="/memory-vault", tags=["Memory Vault"])


@router.post("/chat", response_model=ChatResponse)
async def chat_with_memory(
    request: ChatRequest,
    current_user: str = Depends(get_current_user)
):
    """
    **Unified Chat Interface for Memory Vault**
    
    This is the main endpoint for interacting with your Memory Vault through natural conversation.
    
    **Features:**
    - 💬 Ask questions about your stored files and notes
    - 📚 Get answers based on document content (RAG)
    - 🧠 Maintains conversation history for context-aware responses
    - 🔍 Semantic search across all your stored items
    
    **How to Use:**
    1. **Query your vault**: "What's in my resume file?"
    2. **Ask follow-up questions**: "Can you summarize the key points?"
    3. **Search for specific info**: "Show me my password for email"
    
    **Parameters:**
    - **message**: Your question or query
    - **similarity_threshold**: How strict the matching should be (30-60, default: 50)
    - **provide_link**: Set to true to get download link if a file is found
    
    **Response:**
    - AI-generated answer based on your stored content
    - Source information (which file/note was used)
    - Optional download link
    - Full conversation history maintained automatically
    
    **Tips:**
    - Be specific in your questions for better results
    - Use follow-up questions - the system remembers context
    - Lower threshold (30-40) for exact matches
    - Higher threshold (50-60) for broader searches
    """
    try:
        user_email = current_user  # current_user is already the email string
        
        result = await MemoryVaultService.chat_with_memory(
            user_email=user_email,
            message=request.message,
            similarity_threshold=request.similarity_threshold,
            provide_link=request.provide_link
        )
        
        return ChatResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-note", response_model=SaveNoteResponse)
async def save_note(
    request: SaveNoteRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Save a text note to memory vault
    
    - **message**: Text content to save (required)
    - **description**: Description/title of the note (optional)
    
    Use this to store:
    - Passwords and credentials
    - Quick notes and reminders
    - Important information
    - API keys and tokens
    """
    try:
        user_email = current_user  # current_user is already the email string
        
        result = await MemoryVaultService.save_note(
            user_email=user_email,
            message=request.message,
            description=request.description
        )
        
        return SaveNoteResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-file", response_model=UploadFileResponse)
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: str = Depends(get_current_user)
):
    """
    Upload a file to memory vault
    
    - **file**: File to upload (required)
    - **description**: Description of the file (optional)
    
    Supported file types:
    - **Documents**: PDF, TXT, MD, JSON, PY, JS, HTML, CSS
    - **Images**: JPG, PNG, BMP, GIF, WEBP (with OCR)
    - **Audio**: WAV, MP3, FLAC, M4A (with speech-to-text)
    
    The system will:
    1. Upload file to Azure Blob Storage
    2. Extract text content (OCR for images, STT for audio)
    3. Generate embeddings for semantic search
    4. Store metadata in MongoDB
    """
    temp_file_path = None
    try:
        user_email = current_user  # current_user is already the email string
        
        # Save uploaded file temporarily
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Upload and index
        result = await MemoryVaultService.upload_and_index_file(
            file_path=temp_file_path,
            user_email=user_email,
            original_filename=file.filename,
            description=description
        )
        
        return UploadFileResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as cleanup_error:
                print(f"⚠️ Could not remove temp file: {cleanup_error}")


@router.post("/query", response_model=QueryMemoryResponse)
async def query_memory(
    request: QueryMemoryRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Query memory vault with semantic search and chat history
    
    - **query**: Search query (required)
    - **session_id**: Session ID for chat continuity (optional, generated if not provided)
    - **similarity_threshold**: Distance threshold for matching (default: 50.0, lower = stricter)
    - **provide_link**: Include download link in response (default: false)
    
    How it works:
    1. Maintains chat history per session for context-aware responses
    2. Uses RAG (Retrieval-Augmented Generation) to find relevant documents
    3. Generates responses based on document content and conversation history
    4. Stores conversation for follow-up queries
    
    Tips:
    - Use the same session_id for related follow-up questions
    - Lower threshold (30-40) for stricter matching
    - Higher threshold (50-60) for broader matching
    """
    try:
        user_email = current_user  # current_user is already the email string
        
        result = await MemoryVaultService.query_memory(
            user_email=user_email,
            query=request.query,
            session_id=request.session_id,
            similarity_threshold=request.similarity_threshold,
            provide_link=request.provide_link
        )
        
        return QueryMemoryResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-items", response_model=GetMyItemsResponse)
async def get_my_items(current_user: str = Depends(get_current_user)):
    """
    Get all items in your memory vault
    
    Returns a list of all files and notes you've saved, including:
    - Files uploaded from various sources
    - Text notes and passwords
    - Metadata for each item
    """
    try:
        user_email = current_user  # current_user is already the email string
        
        items = await MemoryVaultService.get_user_items(user_email)
        
        # Ensure items is a list
        if not isinstance(items, list):
            items = []
        
        return GetMyItemsResponse(
            user_email=user_email,
            total_items=len(items),
            items=items
        )
    
    except Exception as e:
        print(f"Error in get_my_items: {str(e)}")
        # Return empty list instead of error
        return GetMyItemsResponse(
            user_email=current_user if isinstance(current_user, str) else "",
            total_items=0,
            items=[]
        )


@router.delete("/{item_id}", response_model=DeleteItemResponse)
async def delete_item(
    item_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete an item from memory vault
    
    - **item_id**: ID of the item to delete
    
    Note: This only deletes the metadata. Azure blob files are not automatically deleted.
    """
    try:
        user_email = current_user  # current_user is already the email string
        
        result = await MemoryVaultService.delete_item(user_email, item_id)
        
        return DeleteItemResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/download/{item_id}", response_model=DownloadLinkResponse)
async def get_download_link(
    item_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Generate download link for a file
    
    - **item_id**: ID of the item to download
    
    Returns a temporary SAS URL valid for 24 hours
    """
    try:
        user_email = current_user  # current_user is already the email string
        
        result = await MemoryVaultService.get_download_link(user_email, item_id)
        
        return DownloadLinkResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/chat-history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):
    """
    Get your complete chat history
    
    - **limit**: Maximum number of messages to return (default: 100)
    
    Returns all your conversations with the Memory Vault, useful for:
    - Reviewing past interactions
    - Understanding conversation context  
    - Exporting chat data
    - Debugging or analysis
    """
    try:
        user_email = current_user  # current_user is already the email string
        
        result = await MemoryVaultService.get_full_chat_history(user_email, limit)
        
        # Ensure result is a dict with proper structure
        if not isinstance(result, dict):
            result = {
                "user_email": user_email,
                "chat_history": [],
                "total_messages": 0
            }
        
        return ChatHistoryResponse(**result)
    
    except Exception as e:
        print(f"Error in get_chat_history: {str(e)}")
        # Return empty history instead of error
        return ChatHistoryResponse(
            user_email=current_user if isinstance(current_user, str) else "",
            chat_history=[],
            total_messages=0
        )


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """
    Transcribe audio to text without saving
    
    Used for voice search - transcribes audio and returns text for querying.
    Does not save the audio or transcription to the vault.
    """
    temp_file_path = None
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)
        
        # Extract text (transcribe)
        transcribed_text = extract_text_from_file(temp_file_path)
        
        if not transcribed_text or not transcribed_text.strip():
            raise HTTPException(status_code=400, detail="No speech detected in audio")
        
        return {
            "text": transcribed_text.strip()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as cleanup_error:
                print(f"⚠️ Could not remove temp file: {cleanup_error}")
