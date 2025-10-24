"""
Memory Vault Database Models
Stores user files and notes with embeddings for semantic search
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class MemoryItem(BaseModel):
    """Memory vault item stored in MongoDB"""
    item_id: str
    user_email: str
    file_name: str
    display_name: str
    azure_path: Optional[str] = None
    description: Optional[str] = None
    content: str
    embedding: List[float]
    faiss_index: int
    is_file: bool
    item_type: str  # 'file' or 'note'
    created_at: str
    updated_at: Optional[str] = None


class MemoryItemDB(BaseModel):
    """Memory item as stored in database"""
    _id: Optional[str] = Field(None, alias="_id")
    item_id: str
    user_email: str
    file_name: str
    display_name: str
    azure_path: Optional[str] = None
    description: Optional[str] = None
    content: str
    embedding: List[float]
    faiss_index: int
    is_file: bool
    item_type: str
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True

