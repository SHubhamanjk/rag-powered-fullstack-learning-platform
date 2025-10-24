"""
Memory Vault Request/Response Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field


# Chat Message Schema
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (user or assistant)")
    content: str = Field(..., description="Content of the message")
    timestamp: str = Field(..., description="ISO format timestamp")


# Request Schemas
class ChatRequest(BaseModel):
    message: str = Field(..., description="User message - can be a query or command")
    similarity_threshold: Optional[float] = Field(30.0, description="Similarity threshold for matching")
    provide_link: Optional[bool] = Field(False, description="Include download link in response")


class SaveNoteRequest(BaseModel):
    message: str = Field(..., description="Text content to save")
    description: Optional[str] = Field(None, description="Description/title of the note")


class QueryMemoryRequest(BaseModel):
    query: str = Field(..., description="Search query")
    similarity_threshold: Optional[float] = Field(30.0, description="Similarity threshold for matching")
    provide_link: Optional[bool] = Field(False, description="Include download link in response")


class UploadFileRequest(BaseModel):
    description: Optional[str] = Field(None, description="Description of the file")


# Response Schemas
class MemoryItemResponse(BaseModel):
    item_id: str
    display_name: str
    description: Optional[str]
    item_type: str
    is_file: bool
    file_name: str
    created_at: str
    has_file: bool


class SaveNoteResponse(BaseModel):
    item_id: str
    message: str
    display_name: str


class UploadFileResponse(BaseModel):
    item_id: str
    message: str
    file_name: str
    azure_path: Optional[str] = None  # Optional for audio files (transcribed as notes)


class ChatResponse(BaseModel):
    response: str
    matched_item: Optional[str] = None
    is_file: Optional[bool] = None
    distance: Optional[float] = None
    status: str
    action: str  # 'query', 'upload', 'note', 'general'
    download_link: Optional[str] = None
    file_name: Optional[str] = None  # For displaying download button


class QueryMemoryResponse(BaseModel):
    response: str
    matched_item: Optional[str]
    is_file: Optional[bool]
    distance: Optional[float]
    status: str
    download_link: Optional[str] = None


class GetMyItemsResponse(BaseModel):
    user_email: str
    total_items: int
    items: List[MemoryItemResponse]


class DeleteItemResponse(BaseModel):
    item_id: str
    message: str


class DownloadLinkResponse(BaseModel):
    item_id: str
    file_name: str
    download_link: str
    expires_in_hours: int


class ChatHistoryResponse(BaseModel):
    user_email: str
    chat_history: List[ChatMessage]
    total_messages: int

