import os
import uuid
from datetime import datetime, date
from typing import Dict, Any, List
from utils.db import get_todo_collection
from utils.timezone import get_current_time
from utils.llm import groq_chat_completion
from prompts import TODO_ASSISTANT_PROMPT

async def create_todo(
    email: str,
    task: str,
    category: str,
    target_date: str = None,
    description: str = None
) -> Dict[str, Any]:
    """Create a new todo"""
    collection = get_todo_collection()
    
    # Generate todo_id
    todo_id = f"todo_{uuid.uuid4().hex[:12]}"
    
    # Use today's date if not provided
    if not target_date:
        target_date = date.today().isoformat()
    
    # Create todo document
    current_time = get_current_time().isoformat()
    
    todo_doc = {
        "todo_id": todo_id,
        "email": email,
        "task": task,
        "category": category,
        "description": description,
        "status": "pending",
        "date": target_date,
        "chat_history": [],
        "created_at": current_time,
        "updated_at": current_time
    }
    
    collection.insert_one(todo_doc)
    
    return {
        "todo_id": todo_id,
        "message": "Todo created successfully"
    }

async def update_todo(
    todo_id: str,
    task: str = None,
    category: str = None,
    target_date: str = None,
    description: str = None,
    status: str = None
) -> Dict[str, Any]:
    """Update an existing todo"""
    collection = get_todo_collection()
    
    # Find todo
    todo = collection.find_one({"todo_id": todo_id})
    if not todo:
        raise ValueError("Todo not found")
    
    # Validate status if provided
    if status is not None:
        valid_statuses = ["pending", "in_progress", "done"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Prepare update document
    update_doc = {
        "updated_at": get_current_time().isoformat()
    }
    
    if task is not None:
        update_doc["task"] = task
    if category is not None:
        update_doc["category"] = category
    if target_date is not None:
        update_doc["date"] = target_date
    if description is not None:
        update_doc["description"] = description
    if status is not None:
        update_doc["status"] = status
    
    # Update todo
    collection.update_one(
        {"todo_id": todo_id},
        {"$set": update_doc}
    )
    
    return {
        "todo_id": todo_id,
        "message": "Todo updated successfully"
    }

async def mark_todo_done(todo_id: str) -> Dict[str, Any]:
    """Mark a todo as done"""
    collection = get_todo_collection()
    
    # Find todo
    todo = collection.find_one({"todo_id": todo_id})
    if not todo:
        raise ValueError("Todo not found")
    
    # Update status
    collection.update_one(
        {"todo_id": todo_id},
        {
            "$set": {
                "status": "done",
                "updated_at": get_current_time().isoformat()
            }
        }
    )
    
    return {
        "todo_id": todo_id,
        "message": "Todo marked as done",
        "status": "done"
    }

async def delete_todo(todo_id: str) -> Dict[str, Any]:
    """Delete a todo"""
    collection = get_todo_collection()
    
    # Find and delete todo
    result = collection.delete_one({"todo_id": todo_id})
    
    if result.deleted_count == 0:
        raise ValueError("Todo not found")
    
    return {
        "todo_id": todo_id,
        "message": "Todo deleted successfully"
    }

async def get_user_todos(email: str) -> Dict[str, Any]:
    """Get all todos for a user"""
    collection = get_todo_collection()
    
    # Find all todos for user
    todos = list(collection.find({"email": email}))
    
    # Convert to response format (exclude _id and chat_history for list view)
    todo_list = []
    for todo in todos:
        todo_list.append({
            "todo_id": todo["todo_id"],
            "email": todo["email"],
            "task": todo["task"],
            "category": todo.get("category", "Uncategorized"),
            "description": todo.get("description"),
            "status": todo["status"],
            "date": todo["date"],
            "created_at": todo["created_at"],
            "updated_at": todo["updated_at"]
        })
    
    # Sort by date (most recent first)
    todo_list.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "email": email,
        "todos": todo_list
    }

async def todo_ai_help(todo_id: str, question: str) -> Dict[str, Any]:
    """AI assistant to help with todo completion"""
    collection = get_todo_collection()
    
    # Get todo
    todo = collection.find_one({"todo_id": todo_id})
    if not todo:
        raise ValueError("Todo not found")
    
    # Get chat history (last 20 messages)
    chat_history = todo.get("chat_history", [])
    recent_chat = chat_history[-20:] if len(chat_history) > 20 else chat_history
    
    # Prepare context
    task = todo["task"]
    description = todo.get("description", "No description provided")
    status = todo["status"]
    target_date = todo["date"]
    
    # Build system context
    context = f"""
TASK: {task}
DESCRIPTION: {description}
STATUS: {status}
TARGET DATE: {target_date}

Help the user complete this task by providing specific, actionable guidance.
"""
    
    # Build messages for LLM
    messages = [
        {"role": "system", "content": TODO_ASSISTANT_PROMPT + "\n\n" + context}
    ]
    
    # Add chat history
    for msg in recent_chat:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Add current question
    messages.append({
        "role": "user",
        "content": question
    })
    
    # Call Groq API via centralized LLM utility
    ai_response = groq_chat_completion(
        messages=messages,
        temperature=0.7,
        max_tokens=2000  # Increased to allow complete responses
    )
    
    # Update chat history
    current_time = get_current_time().isoformat()
    
    new_messages = [
        {
            "role": "user",
            "content": question,
            "timestamp": current_time
        },
        {
            "role": "assistant",
            "content": ai_response,
            "timestamp": current_time
        }
    ]
    
    collection.update_one(
        {"todo_id": todo_id},
        {
            "$push": {
                "chat_history": {
                    "$each": new_messages
                }
            },
            "$set": {
                "updated_at": current_time
            }
        }
    )
    
    return {
        "todo_id": todo_id,
        "response": ai_response
    }

async def get_todos_by_status(email: str, status: str) -> Dict[str, Any]:
    """Get todos filtered by status"""
    collection = get_todo_collection()
    
    # Validate status
    valid_statuses = ["pending", "in_progress", "done"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Find all todos for user with matching status
    todos = list(collection.find({"email": email, "status": status}))
    
    # Convert to response format (exclude _id and chat_history for list view)
    todo_list = []
    for todo in todos:
        todo_list.append({
            "todo_id": todo["todo_id"],
            "email": todo["email"],
            "task": todo["task"],
            "category": todo.get("category", "Uncategorized"),
            "description": todo.get("description"),
            "status": todo["status"],
            "date": todo["date"],
            "created_at": todo["created_at"],
            "updated_at": todo["updated_at"]
        })
    
    # Sort by date (most recent first)
    todo_list.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "email": email,
        "status": status,
        "todos": todo_list
    }

async def get_todo_chat_history(todo_id: str) -> Dict[str, Any]:
    """Get chat history for a todo"""
    collection = get_todo_collection()
    
    # Get todo
    todo = collection.find_one({"todo_id": todo_id})
    if not todo:
        raise ValueError("Todo not found")
    
    # Get chat history
    chat_history = todo.get("chat_history", [])
    
    # Format response
    formatted_chat = [
        {
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"]
        }
        for msg in chat_history
    ]
    
    return {
        "todo_id": todo_id,
        "task": todo["task"],
        "chat_history": formatted_chat
    }

