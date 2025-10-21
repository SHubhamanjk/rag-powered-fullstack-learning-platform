from typing import Dict, Any, List
from utils.db import (
    get_chat_collection,
    get_friend_chat_collection,
    get_study_sessions_collection,
    get_tutorial_support_collection,
    get_todo_collection
)
from utils.cache import cache_response

@cache_response(ttl_seconds=60)  # Cache for 1 minute
async def get_dashboard(email: str) -> Dict[str, Any]:
    """
    Fetch comprehensive dashboard analytics for a user
    """
    
    # ========================================================================
    # FETCH DATA FROM COLLECTIONS
    # ========================================================================
    
    # Study chats
    study_chat_coll = get_chat_collection()
    study_chats = list(study_chat_coll.find({"email": email}))
    
    # Friend chats
    friend_chat_coll = get_friend_chat_collection()
    friend_chats = list(friend_chat_coll.find({"email": email}))
    
    # Study sessions
    study_session_coll = get_study_sessions_collection()
    study_sessions = list(study_session_coll.find({"email": email}))
    
    # Tutorial support
    tutorial_coll = get_tutorial_support_collection()
    tutorials = list(tutorial_coll.find({"email": email}))
    
    # Todos
    todo_coll = get_todo_collection()
    todos = list(todo_coll.find({"email": email}))
    
    # ========================================================================
    # PROCESS STUDY CHATS
    # ========================================================================
    
    study_chat_summaries = []
    for chat in study_chats:
        messages = chat.get("messages", [])
        study_chat_summaries.append({
            "chat_id": chat.get("chat_id", ""),
            "title": chat.get("title", "Untitled Chat"),
            "message_count": len(messages),
            "created_at": chat.get("created_at", ""),
            "last_updated": chat.get("updated_at", chat.get("created_at", ""))
        })
    
    # ========================================================================
    # PROCESS FRIEND CHATS
    # ========================================================================
    
    friend_chat_summaries = []
    for chat in friend_chats:
        messages = chat.get("messages", [])
        friend_chat_summaries.append({
            "chat_id": chat.get("chat_id", ""),
            "title": chat.get("title", "Untitled Chat"),
            "message_count": len(messages),
            "created_at": chat.get("created_at", ""),
            "last_updated": chat.get("updated_at", chat.get("created_at", ""))
        })
    
    # ========================================================================
    # PROCESS STUDY SESSIONS
    # ========================================================================
    
    study_session_summaries = []
    total_session_quizzes = 0
    total_session_mindmaps = 0
    
    for session in study_sessions:
        metadata = session.get("metadata", {})
        quizzes = session.get("quizzes", [])
        mindmaps = session.get("mindmaps", [])
        chat_history = session.get("chat_history", [])
        
        # Process quizzes
        quiz_summaries = []
        for quiz in quizzes:
            questions = quiz.get("questions", [])
            mcq_count = sum(1 for q in questions if q.get("type") == "mcq")
            descriptive_count = sum(1 for q in questions if q.get("type") == "descriptive")
            
            quiz_summaries.append({
                "quiz_id": quiz.get("quiz_id", ""),
                "generated_at": quiz.get("generated_at", ""),
                "total_questions": len(questions),
                "mcq_count": mcq_count,
                "descriptive_count": descriptive_count
            })
            total_session_quizzes += 1
        
        # Process mindmaps
        mindmap_summaries = []
        for mindmap in mindmaps:
            mindmap_data = mindmap.get("mindmaps", [])
            mindmap_summaries.append({
                "mindmap_id": mindmap.get("mindmap_id", ""),
                "generated_at": mindmap.get("generated_at", ""),
                "mindmap_count": len(mindmap_data)
            })
            total_session_mindmaps += 1
        
        study_session_summaries.append({
            "session_id": session.get("session_id", ""),
            "session_name": session.get("session_name", ""),
            "subject": metadata.get("subject", ""),
            "grade": metadata.get("grade", ""),
            "chat_message_count": len(chat_history),
            "quizzes": quiz_summaries,
            "mindmaps": mindmap_summaries,
            "created_at": session.get("created_at", ""),
            "updated_at": session.get("updated_at", "")
        })
    
    # ========================================================================
    # PROCESS TUTORIALS
    # ========================================================================
    
    tutorial_summaries = []
    total_tutorial_quizzes = 0
    total_tutorial_mindmaps = 0
    
    for tutorial in tutorials:
        notes = tutorial.get("notes", [])
        quizzes = tutorial.get("quizzes", [])
        mindmaps = tutorial.get("mindmaps", [])
        ai_chat = tutorial.get("ai_chat", [])
        
        # Process quizzes
        quiz_summaries = []
        for quiz in quizzes:
            questions = quiz.get("questions", [])
            mcq_count = sum(1 for q in questions if q.get("type") == "mcq")
            descriptive_count = sum(1 for q in questions if q.get("type") == "descriptive")
            
            # Check if evaluated
            report = quiz.get("report")
            evaluated = report is not None
            marks_obtained = None
            total_marks = None
            
            if evaluated and report:
                marks_obtained = report.get("marks_obtained")
                total_marks = report.get("total_marks")
            
            quiz_summaries.append({
                "quiz_id": quiz.get("quiz_id", ""),
                "from_timestamp": quiz.get("from_timestamp"),
                "to_timestamp": quiz.get("to_timestamp"),
                "generated_at": quiz.get("generated_at", ""),
                "total_questions": len(questions),
                "mcq_count": mcq_count,
                "descriptive_count": descriptive_count,
                "evaluated": evaluated,
                "marks_obtained": marks_obtained,
                "total_marks": total_marks
            })
            total_tutorial_quizzes += 1
        
        # Process mindmaps
        mindmap_summaries = []
        for mindmap in mindmaps:
            mindmap_data = mindmap.get("mindmaps", [])
            mindmap_summaries.append({
                "mindmap_id": mindmap.get("mindmap_id", ""),
                "generated_at": mindmap.get("generated_at", ""),
                "mindmap_count": len(mindmap_data)
            })
            total_tutorial_mindmaps += 1
        
        tutorial_summaries.append({
            "tutorial_id": tutorial.get("tutorial_id", ""),
            "title": tutorial.get("title", ""),
            "tutorial_link": tutorial.get("tutorial_link", ""),
            "notes_count": len(notes),
            "chat_message_count": len(ai_chat),
            "quizzes": quiz_summaries,
            "mindmaps": mindmap_summaries,
            "created_at": tutorial.get("created_at", ""),
            "updated_at": tutorial.get("updated_at", "")
        })
    
    # ========================================================================
    # PROCESS TODOS
    # ========================================================================
    
    todo_summaries = []
    todos_pending = 0
    todos_in_progress = 0
    todos_done = 0
    
    for todo in todos:
        status = todo.get("status", "pending")
        
        if status == "pending":
            todos_pending += 1
        elif status == "in_progress":
            todos_in_progress += 1
        elif status == "done":
            todos_done += 1
        
        todo_summaries.append({
            "todo_id": todo.get("todo_id", ""),
            "task": todo.get("task", ""),
            "description": todo.get("description"),
            "status": status,
            "date": todo.get("date", ""),
            "created_at": todo.get("created_at", ""),
            "updated_at": todo.get("updated_at", "")
        })
    
    # ========================================================================
    # BUILD ANALYTICS
    # ========================================================================
    
    analytics = {
        "total_study_chats": len(study_chats),
        "total_friend_chats": len(friend_chats),
        "total_study_sessions": len(study_sessions),
        "total_tutorials": len(tutorials),
        "total_todos": len(todos),
        "todos_pending": todos_pending,
        "todos_in_progress": todos_in_progress,
        "todos_done": todos_done,
        "total_quizzes": total_session_quizzes + total_tutorial_quizzes,
        "total_mindmaps": total_session_mindmaps + total_tutorial_mindmaps
    }
    
    # ========================================================================
    # RETURN COMPLETE DASHBOARD
    # ========================================================================
    
    return {
        "email": email,
        "analytics": analytics,
        "study_chats": study_chat_summaries,
        "friend_chats": friend_chat_summaries,
        "study_sessions": study_session_summaries,
        "tutorials": tutorial_summaries,
        "todos": todo_summaries
    }
