"""
Memory Vault Service
Business logic for storing and retrieving files/notes with semantic search and chat history
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from pymongo import MongoClient
from dotenv import load_dotenv

from utils.embedding import (
    get_embedding,
    add_to_faiss,
    search_faiss,
    extract_text_from_file,
    rebuild_faiss_from_mongodb
)
from utils.llm import groq_chat_completion
from prompts.memory_vault_prompts import (
    get_query_system_prompt,
    get_query_user_prompt,
    get_rephrase_suggestion_prompt
)

load_dotenv()

# Azure configuration
CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
CONTAINER_NAME = "userfiles"

# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["medha_ai_backend"]
memory_vault_col = db["memory_vault"]
memory_chat_history_col = db["memory_vault_chat_history"]

# Azure Blob client
blob_service_client = None
container_client = None

if CONNECTION_STRING:
    blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
    container_client = blob_service_client.get_container_client(CONTAINER_NAME)


class MemoryVaultService:
    """Service for memory vault operations"""
    
    @staticmethod
    async def upload_file_to_azure(file_path: str, user_email: str, original_filename: str) -> Optional[str]:
        """Upload file to Azure Blob Storage"""
        if not container_client:
            raise Exception("Azure Blob Storage not configured")
        
        try:
            # Create unique blob path
            blob_name = f"{user_email}/memory_vault/{uuid.uuid4()}_{original_filename}"
            
            with open(file_path, "rb") as data:
                container_client.upload_blob(name=blob_name, data=data, overwrite=True)
            
            print(f"✅ Uploaded to Azure: {blob_name}")
            return blob_name
        except Exception as e:
            print(f"⚠️ Error uploading to Azure: {e}")
            raise
    
    @staticmethod
    async def generate_download_link(azure_path: str, expiry_hours: int = 24) -> Optional[str]:
        """Generate SAS URL for downloading a file"""
        if not blob_service_client or not azure_path:
            return None
        
        try:
            sas_token = generate_blob_sas(
                account_name=blob_service_client.account_name,
                container_name=CONTAINER_NAME,
                blob_name=azure_path,
                account_key=blob_service_client.credential.account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
            )
            
            blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{azure_path}?{sas_token}"
            return blob_url
        except Exception as e:
            print(f"⚠️ Error generating SAS URL: {e}")
            return None
    
    @staticmethod
    async def save_audio_as_note(
        file_path: str,
        user_email: str,
        original_filename: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Convert audio to text and save as note (no Azure upload)"""
        try:
            print(f"🎤 Processing audio file: {original_filename}")
            
            # Extract text from audio
            audio_text = extract_text_from_file(file_path)
            
            if not audio_text or not audio_text.strip():
                audio_text = "[Audio transcription failed - no speech detected]"
            
            # Save as note with the transcribed text
            note_description = description or f"Voice note from {original_filename}"
            result = await MemoryVaultService.save_note(
                user_email=user_email,
                message=audio_text,
                description=note_description
            )
            
            print("✅ Audio transcribed and saved as note")
            
            # Return file upload format for compatibility
            return {
                "item_id": result["item_id"],
                "file_name": original_filename,
                "azure_path": None,  # No Azure upload for audio
                "message": "Audio transcribed and saved as note"
            }
        except Exception as e:
            print(f"⚠️ Error processing audio: {e}")
            raise
    
    @staticmethod
    async def save_note(user_email: str, message: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Save a text note to memory vault"""
        try:
            item_id = str(uuid.uuid4())
            filename = f"note_{int(datetime.now().timestamp())}.txt"
            
            # Create a simple preview of the note (first 50 chars)
            preview = message[:50] + "..." if len(message) > 50 else message
            display_name = preview
            
            # Create enhanced text for embedding: description + content
            embedding_text = message
            if description:
                embedding_text = f"Description: {description}\n{message}"
            
            # Generate embedding from enhanced text
            embedding = get_embedding(embedding_text)
            
            # Add to FAISS
            faiss_index_position = add_to_faiss(embedding)
            
            # Save to MongoDB
            doc = {
                "item_id": item_id,
                "user_email": user_email,
                "file_name": filename,
                "display_name": display_name,
                "azure_path": None,
                "description": description,
                "content": message,
                "embedding": embedding.tolist(),
                "faiss_index": faiss_index_position,
                "is_file": False,
                "item_type": "note",
                "created_at": datetime.now().isoformat()
            }
            
            memory_vault_col.insert_one(doc)
            print(f"✅ Saved note at FAISS index {faiss_index_position}")
            
            # Save user message to chat history
            await MemoryVaultService.save_chat_message(
                user_email, "user", message
            )
            
            # Save simple confirmation to chat history
            note_message = "✅ Note saved to Memory Vault!"
            await MemoryVaultService.save_chat_message(
                user_email, "assistant", note_message,
                metadata={
                    "action": "save_note",
                    "item_id": item_id
                }
            )
            
            return {
                "item_id": item_id,
                "display_name": display_name,
                "message": "Note saved successfully"
            }
        except Exception as e:
            print(f"⚠️ Error saving note: {e}")
            raise
    
    @staticmethod
    async def upload_and_index_file(
        file_path: str,
        user_email: str,
        original_filename: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Upload file and index it in memory vault"""
        try:
            # Check if it's an audio file - convert to text and save as note instead
            audio_extensions = ['.wav', '.mp3', '.flac', '.m4a', '.webm', '.ogg']
            if any(original_filename.lower().endswith(ext) for ext in audio_extensions):
                return await MemoryVaultService.save_audio_as_note(file_path, user_email, original_filename, description)
            
            # Upload to Azure
            azure_path = await MemoryVaultService.upload_file_to_azure(file_path, user_email, original_filename)
            
            # Extract text
            content = extract_text_from_file(file_path)
            if not content:
                content = description or original_filename
            
            # Create enhanced text for embedding: filename + description + content
            embedding_text = f"Filename: {original_filename}\n"
            if description:
                embedding_text += f"Description: {description}\n"
            embedding_text += f"Content:\n{content}"
            
            # Generate embedding from enhanced text
            embedding = get_embedding(embedding_text)
            
            # Add to FAISS
            faiss_index_position = add_to_faiss(embedding)
            
            # Save to MongoDB
            item_id = str(uuid.uuid4())
            display_name = description or original_filename
            
            doc = {
                "item_id": item_id,
                "user_email": user_email,
                "file_name": original_filename,
                "display_name": display_name,
                "azure_path": azure_path,
                "description": description,
                "content": content,
                "embedding": embedding.tolist(),
                "faiss_index": faiss_index_position,
                "is_file": True,
                "item_type": "file",
                "created_at": datetime.now().isoformat()
            }
            
            memory_vault_col.insert_one(doc)
            print(f"✅ Uploaded and indexed: {original_filename} at FAISS index {faiss_index_position}")
            
            # Save upload action to chat history
            upload_message = f"📎 **File Uploaded Successfully**\n\n**File**: {original_filename}\n**Description**: {description or 'No description'}\n\nFile has been indexed and is now searchable!"
            await MemoryVaultService.save_chat_message(
                user_email, "assistant", upload_message,
                metadata={
                    "action": "upload",
                    "item_id": item_id,
                    "file_name": original_filename
                }
            )
            
            return {
                "item_id": item_id,
                "file_name": original_filename,
                "azure_path": azure_path,
                "message": "File uploaded and indexed successfully"
            }
        except Exception as e:
            print(f"⚠️ Error uploading file: {e}")
            raise
    
    @staticmethod
    async def save_chat_message(
        user_email: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None
    ):
        """Save a chat message to user's history"""
        try:
            message = {
                "user_email": user_email,
                "role": role,
                "content": content,
                "metadata": metadata or {},  # Can store action type, matched_item, etc.
                "timestamp": datetime.now().isoformat()
            }
            memory_chat_history_col.insert_one(message)
        except Exception as e:
            print(f"⚠️ Error saving chat message: {e}")
    
    @staticmethod
    async def get_chat_history(user_email: str, limit: int = 10) -> List[Dict]:
        """Get recent chat history for a user"""
        try:
            messages = list(memory_chat_history_col.find({
                "user_email": user_email
            }).sort("timestamp", -1).limit(limit))
            
            # Reverse to get chronological order
            messages.reverse()
            
            # Format messages
            formatted_messages = []
            for msg in messages:
                try:
                    formatted_messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", ""),
                        "timestamp": msg.get("timestamp", datetime.now().isoformat())
                    })
                except Exception as e:
                    print(f"⚠️ Error formatting message: {e}")
                    continue
            
            return formatted_messages
        except Exception as e:
            print(f"⚠️ Error getting chat history: {e}")
            return []
    
    @staticmethod
    async def suggest_rephrase(query_text: str, available_items: List[Dict]) -> str:
        """Use LLM to suggest better query phrasing"""
        prompt = get_rephrase_suggestion_prompt(query_text, available_items)
        
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that suggests better ways to phrase search queries."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        try:
            response = groq_chat_completion(messages, temperature=0.7)
            return response
        except Exception as e:
            print(f"⚠️ Error generating suggestions: {e}")
            return """Try rephrasing your question to be more specific. For example:
• Use the exact file name if you know it
• Mention specific topics or keywords
• Be more descriptive about what you need"""
    
    @staticmethod
    async def chat_with_memory(
        user_email: str,
        message: str,
        similarity_threshold: float = 50.0,
        provide_link: bool = False
    ) -> Dict[str, Any]:
        """Unified chat interface for querying memory vault with chat history - retrieves top 3 documents"""
        try:
            # Save user message to chat history
            await MemoryVaultService.save_chat_message(
                user_email, "user", message
            )
            
            # Get chat history for context
            chat_history = await MemoryVaultService.get_chat_history(user_email, limit=10)
            
            # Remove the current message from history (it was just added)
            if chat_history and chat_history[-1]["content"] == message:
                chat_history = chat_history[:-1]
            
            # Generate query embedding
            query_emb = get_embedding(message)
            
            # Check if user has any documents at all
            all_user_items = list(memory_vault_col.find({"user_email": user_email}))
            
            if not all_user_items:
                # No documents at all
                response_text = """❌ Your Memory Vault is empty.

Upload files or save notes to start using Memory Vault!"""
                
                await MemoryVaultService.save_chat_message(
                    user_email, "assistant", response_text, 
                    metadata={"action": "query", "status": "empty_vault"}
                )
                
                return {
                    "response": response_text,
                    "matched_item": None,
                    "is_file": None,
                    "distance": None,
                    "status": "empty_vault",
                    "action": "query",
                    "download_link": None
                }
            
            # Search FAISS for top 5 most similar documents (ALWAYS retrieve, no threshold check)
            distances, indices = search_faiss(query_emb, k=min(5, len(all_user_items)))
            
            # If FAISS index is empty but MongoDB has documents, rebuild it
            if indices[0][0] == -1 and len(all_user_items) > 0:
                print("⚠️ FAISS index empty but MongoDB has documents. Rebuilding...")
                rebuild_faiss_from_mongodb()
                # Retry search after rebuild
                distances, indices = search_faiss(query_emb, k=min(5, len(all_user_items)))
            
            print("🔍 Top 5 search results:")
            for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
                print(f"  {i+1}. FAISS Index: {idx}, Distance: {distance:.4f}")
            
            # Retrieve top 5 documents from MongoDB (ALWAYS retrieve if they exist)
            retrieved_docs = []
            for idx, distance in zip(indices[0], distances[0]):
                if idx == -1:  # No more results
                    break
                
                print(f"  🔎 Looking for document with faiss_index={int(idx)} for user={user_email}")
                    
                doc = memory_vault_col.find_one({
                    "user_email": user_email,
                    "faiss_index": int(idx)
                })
                
                if doc:
                    print(f"  ✅ Found: {doc.get('display_name', doc['file_name'])}")
                    retrieved_docs.append({
                        "name": doc.get('display_name', doc['file_name']),
                        "description": doc.get('description', ''),
                        "content": doc['content'],
                        "is_file": doc.get('is_file', True),
                        "item_type": doc.get('item_type', 'file'),
                        "similarity": float(distance),
                        "item_id": doc.get('item_id'),
                        "azure_path": doc.get('azure_path')
                    })
                else:
                    print(f"  ❌ Not found: faiss_index={int(idx)} doesn't exist in MongoDB for this user")
            
            if not retrieved_docs:
                print("❌ No documents found in database")
                error_response = "Items not found in database."
                
                await MemoryVaultService.save_chat_message(
                    user_email, "assistant", error_response,
                    metadata={"action": "query", "status": "error"}
                )
                
                return {
                    "response": error_response,
                    "matched_item": None,
                    "is_file": None,
                    "distance": None,
                    "status": "error",
                    "action": "query",
                    "download_link": None
                }
            
            print(f"✅ Retrieved {len(retrieved_docs)} documents")
            for i, doc in enumerate(retrieved_docs, 1):
                print(f"  {i}. {doc['name']} (distance: {doc['similarity']:.4f})")
            
            # Create LLM prompt with ALL retrieved documents
            system_prompt = get_query_system_prompt()
            user_prompt = get_query_user_prompt(
                query=message,
                documents=retrieved_docs,
                chat_history=chat_history
            )
            
            messages_for_llm = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response_text = groq_chat_completion(messages_for_llm, temperature=0.3)
            
            # Get the best matched document for metadata
            best_doc = retrieved_docs[0]
            
            # Check if LLM wants to share a file (by looking for [SHARE_FILE:item_id] tag)
            download_link = None
            file_name = None
            
            if provide_link and "[SHARE_FILE:" in response_text:
                # Extract item_id from response
                import re
                match = re.search(r'\[SHARE_FILE:([^\]]+)\]', response_text)
                if match:
                    requested_item_id = match.group(1).strip()
                    print(f"🔍 LLM requested file with item_id: {requested_item_id}")
                    
                    # Find the document with this item_id
                    requested_doc = None
                    for doc in retrieved_docs:
                        if doc.get('item_id') == requested_item_id:
                            requested_doc = doc
                            break
                    
                    if requested_doc and requested_doc.get('is_file') and requested_doc.get('azure_path'):
                        download_link = await MemoryVaultService.generate_download_link(requested_doc['azure_path'])
                        file_name = requested_doc['name']
                        print(f"✅ Generated download link for LLM-selected file: {file_name}")
                    else:
                        print(f"⚠️ Could not find file with item_id: {requested_item_id}")
                    
                    # Remove the [SHARE_FILE:...] tag from response
                    response_text = re.sub(r'\[SHARE_FILE:[^\]]+\]', '', response_text).strip()
            
            # Save assistant response to chat history (WITHOUT download link)
            # Download link is only sent in API response, not stored in chat history
            await MemoryVaultService.save_chat_message(
                user_email, "assistant", response_text,
                metadata={
                    "action": "query",
                    "status": "success",
                    "matched_items": [doc['name'] for doc in retrieved_docs],
                    "item_id": best_doc.get('item_id'),
                    "has_download_link": bool(download_link)  # Flag only, not the link itself
                }
            )
            
            return {
                "response": response_text,
                "matched_item": ", ".join([doc['name'] for doc in retrieved_docs]),
                "is_file": best_doc['is_file'],
                "distance": float(best_doc['similarity']),
                "status": "success",
                "action": "query",
                "download_link": download_link,
                "file_name": file_name  # Use LLM-selected file name, not best_doc
            }
        except Exception as e:
            print(f"⚠️ Error querying memory: {e}")
            raise
    
    @staticmethod
    async def get_user_items(user_email: str) -> List[Dict[str, Any]]:
        """Get all items for a user"""
        try:
            items = list(memory_vault_col.find({"user_email": user_email}))
            
            result = []
            for item in items:
                try:
                    result.append({
                        "item_id": item.get("item_id", ""),
                        "display_name": item.get("display_name", item.get("file_name", "Unnamed")),
                        "description": item.get("description"),
                        "item_type": item.get("item_type", "file"),
                        "is_file": item.get("is_file", True),
                        "file_name": item.get("file_name", ""),
                        "created_at": item.get("created_at", ""),
                        "has_file": bool(item.get("azure_path"))
                    })
                except Exception as e:
                    print(f"⚠️ Error processing item: {e}")
                    continue
            
            return result
        except Exception as e:
            print(f"⚠️ Error getting user items: {e}")
            return []
    
    @staticmethod
    async def delete_item(user_email: str, item_id: str) -> Dict[str, Any]:
        """Delete an item from memory vault"""
        try:
            result = memory_vault_col.delete_one({
                "user_email": user_email,
                "item_id": item_id
            })
            
            if result.deleted_count == 0:
                raise Exception("Item not found or not authorized")
            
            print(f"✅ Deleted item: {item_id}")
            return {
                "item_id": item_id,
                "message": "Item deleted successfully"
            }
        except Exception as e:
            print(f"⚠️ Error deleting item: {e}")
            raise
    
    @staticmethod
    async def get_download_link(user_email: str, item_id: str) -> Dict[str, Any]:
        """Generate download link for an item"""
        try:
            item = memory_vault_col.find_one({
                "user_email": user_email,
                "item_id": item_id
            })
            
            if not item:
                raise Exception("Item not found or not authorized")
            
            if not item.get("is_file") or not item.get("azure_path"):
                raise Exception("No file available for download")
            
            download_link = await MemoryVaultService.generate_download_link(item["azure_path"])
            
            if not download_link:
                raise Exception("Unable to generate download link")
            
            return {
                "item_id": item_id,
                "file_name": item["file_name"],
                "download_link": download_link,
                "expires_in_hours": 24
            }
        except Exception as e:
            print(f"⚠️ Error getting download link: {e}")
            raise
    
    @staticmethod
    async def get_full_chat_history(user_email: str, limit: int = 100) -> Dict[str, Any]:
        """Get full chat history for a user"""
        try:
            chat_history = await MemoryVaultService.get_chat_history(user_email, limit=limit)
            
            # Ensure chat_history is a list
            if not isinstance(chat_history, list):
                chat_history = []
            
            return {
                "user_email": user_email,
                "chat_history": chat_history,
                "total_messages": len(chat_history)
            }
        except Exception as e:
            print(f"⚠️ Error getting chat history: {e}")
            # Return empty history instead of raising
            return {
                "user_email": user_email,
                "chat_history": [],
                "total_messages": 0
            }
