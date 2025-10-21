from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from endpoints import (
    # User Management
    user,
    
    # AI Study Chat
    chat,
    
    # AI Friend Chat
    friend_chat,
    
    # Media Processing
    tts,
    stt,
    
    # Task Management
    todo,
    
    # Study Session Management
    study_session,
    
    # Tutorial Support Management
    tutorial_support,
    
    # Analytics & Dashboard
    dashboard,
)

app = FastAPI(
    title="Medha.ai Backend API",
    description="AI-powered educational platform backend",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# USER MANAGEMENT
# ============================================================================
app.include_router(
    user.router,
    prefix="/user",
    tags=["User Management"]
)

# ============================================================================
# AI STUDY CHAT
# ============================================================================
app.include_router(
    chat.router,
    prefix="/chat",
    tags=["AI Study Chat"]
)

# ============================================================================
# AI FRIEND CHAT
# ============================================================================
app.include_router(
    friend_chat.router,
    prefix="/friend-chat",
    tags=["AI Friend Chat"]
)

# ============================================================================
# MEDIA PROCESSING
# ============================================================================
app.include_router(
    tts.router,
    prefix="/tts",
    tags=["Media Processing"]
)

app.include_router(
    stt.router,
    prefix="/stt",
    tags=["Media Processing"]
)

# ============================================================================
# TASK MANAGEMENT
# ============================================================================
app.include_router(
    todo.router,
    prefix="/todo",
    tags=["Task Management"]
)

# ============================================================================
# STUDY SESSION MANAGEMENT
# ============================================================================
app.include_router(
    study_session.router,
    prefix="/study-session",
    tags=["Study Session Management"]
)

# ============================================================================
# TUTORIAL SUPPORT MANAGEMENT
# ============================================================================
app.include_router(
    tutorial_support.router,
    prefix="/tutorial-support",
    tags=["Tutorial Support Management"]
)

# ============================================================================
# ANALYTICS & DASHBOARD
# ============================================================================
app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Analytics & Dashboard"]
)

# ============================================================================
# HEALTH CHECK
# ============================================================================
@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Medha.ai Backend API",
        "version": "1.0.0"
    }
