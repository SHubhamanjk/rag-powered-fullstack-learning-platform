"""
User-friendly error handling utilities
"""

from typing import Dict, Any

class UserFriendlyError(Exception):
    """Exception with user-friendly message"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def get_user_friendly_error(error: Exception) -> Dict[str, Any]:
    """
    Convert technical errors to user-friendly messages
    
    Args:
        error: The original exception
        
    Returns:
        Dictionary with user-friendly error details
    """
    error_str = str(error).lower()
    
    # Database/Connection errors
    if "connection" in error_str or "timeout" in error_str:
        return {
            "message": "We're having trouble connecting to our servers. Please check your internet connection and try again.",
            "type": "connection_error"
        }
    
    # Authentication errors
    if "unauthorized" in error_str or "authentication" in error_str or "token" in error_str:
        return {
            "message": "Your session has expired. Please log in again to continue.",
            "type": "auth_error"
        }
    
    # Not found errors
    if "not found" in error_str or "does not exist" in error_str:
        return {
            "message": "The item you're looking for doesn't exist or has been removed.",
            "type": "not_found"
        }
    
    # Validation errors
    if "invalid" in error_str or "validation" in error_str or "required" in error_str:
        return {
            "message": "Please check your input and try again. Some required information may be missing or incorrect.",
            "type": "validation_error"
        }
    
    # Permission errors
    if "permission" in error_str or "forbidden" in error_str or "access denied" in error_str:
        return {
            "message": "You don't have permission to perform this action.",
            "type": "permission_error"
        }
    
    # Duplicate errors
    if "duplicate" in error_str or "already exists" in error_str:
        return {
            "message": "This item already exists. Please try with different information.",
            "type": "duplicate_error"
        }
    
    # Rate limit errors
    if "rate limit" in error_str or "too many requests" in error_str:
        return {
            "message": "You're sending too many requests. Please wait a moment and try again.",
            "type": "rate_limit_error"
        }
    
    # File/Upload errors
    if "file" in error_str or "upload" in error_str or "size" in error_str:
        return {
            "message": "There was a problem with the file. Please check the file size and format, then try again.",
            "type": "file_error"
        }
    
    # API/External service errors
    if "api" in error_str or "groq" in error_str or "external" in error_str:
        return {
            "message": "We're having trouble communicating with our AI service. Please try again in a moment.",
            "type": "external_service_error"
        }
    
    # Default fallback
    return {
        "message": "Something went wrong. Please try again, and if the problem persists, contact support.",
        "type": "unknown_error"
    }

def format_validation_error(field: str, issue: str) -> str:
    """
    Format field validation errors in a user-friendly way
    
    Args:
        field: The field name
        issue: The validation issue
        
    Returns:
        User-friendly error message
    """
    field_names = {
        "email": "email address",
        "password": "password",
        "name": "name",
        "title": "title",
        "description": "description",
        "task": "task",
        "message": "message",
        "chat_id": "chat",
        "tutorial_link": "tutorial link",
        "session_id": "session",
        "todo_id": "task",
    }
    
    friendly_field = field_names.get(field, field.replace("_", " "))
    
    if "required" in issue.lower():
        return f"Please provide a {friendly_field}."
    elif "invalid" in issue.lower():
        return f"The {friendly_field} you entered is invalid."
    elif "too short" in issue.lower() or "minimum" in issue.lower():
        return f"Your {friendly_field} is too short. Please provide more information."
    elif "too long" in issue.lower() or "maximum" in issue.lower():
        return f"Your {friendly_field} is too long. Please shorten it."
    elif "format" in issue.lower():
        return f"The {friendly_field} format is incorrect. Please check and try again."
    else:
        return f"There's an issue with the {friendly_field}. {issue}"

# Common user-friendly messages for specific scenarios
ERROR_MESSAGES = {
    # Authentication
    "invalid_credentials": "The email or password you entered is incorrect. Please try again.",
    "email_not_found": "We couldn't find an account with that email address.",
    "email_exists": "An account with this email already exists. Please log in instead.",
    "invalid_otp": "The verification code you entered is incorrect or has expired. Please try again.",
    "otp_expired": "Your verification code has expired. Please request a new one.",
    "session_expired": "Your session has expired. Please log in again.",
    
    # Chat
    "chat_not_found": "This conversation doesn't exist or has been deleted.",
    "chat_empty": "You haven't started any conversations yet. Send a message to get started!",
    "message_too_long": "Your message is too long. Please break it into smaller messages.",
    "no_chat_history": "No conversation history available.",
    
    # Todo
    "todo_not_found": "This task doesn't exist or has been deleted.",
    "todo_empty": "You don't have any tasks yet. Create one to get started!",
    "invalid_status": "The task status you selected is not valid.",
    "invalid_date": "The date you entered is not valid. Please check and try again.",
    
    # Study Session
    "session_not_found": "This study session doesn't exist or has been deleted.",
    "session_empty": "You haven't created any study sessions yet.",
    "quiz_not_found": "This quiz doesn't exist or has been completed.",
    "invalid_answers": "Please answer all questions before submitting.",
    
    # Tutorial
    "tutorial_not_found": "This tutorial doesn't exist or has been deleted.",
    "invalid_youtube_link": "The YouTube link you provided is not valid. Please check and try again.",
    "transcript_unavailable": "This video doesn't have captions available. Please try a video with captions enabled.",
    "video_too_long": "This video is too long to process. Please try a shorter video.",
    
    # General
    "server_error": "We're experiencing technical difficulties. Please try again in a moment.",
    "network_error": "Please check your internet connection and try again.",
    "unknown_error": "Something unexpected happened. Please try again.",
}

def get_error_message(error_key: str, default: str = None) -> str:
    """
    Get a user-friendly error message by key
    
    Args:
        error_key: The error message key
        default: Default message if key not found
        
    Returns:
        User-friendly error message
    """
    return ERROR_MESSAGES.get(error_key, default or ERROR_MESSAGES["unknown_error"])

