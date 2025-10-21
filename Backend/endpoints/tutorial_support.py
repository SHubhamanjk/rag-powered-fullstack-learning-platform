from fastapi import APIRouter, HTTPException, Body, Query, Depends
from utils.jwt_auth import get_current_user
from schemas.tutorial_support import (
    CreateTutorialRequest, CreateTutorialResponse,
    AddNoteRequest, AddNoteResponse,
    GetNotesResponse,
    UpdateNoteRequest, UpdateNoteResponse,
    DeleteNoteResponse,
    PrettifyNotesRequest, PrettifyNotesResponse,
    DetailedNotesRequest, DetailedNotesResponse,
    GetAllTutorialsResponse,
    TutorialChatRequest, TutorialChatResponse,
    TutorialChatHistoryResponse,
    # Quiz schemas
    GenerateQuizRequest, GenerateQuizResponse,
    EvaluateQuizRequest, EvaluateQuizResponse,
    QuizDetailsResponse,
    TutorialQuizzesResponse,
    UserQuizzesResponse,
    # Mindmap schemas
    GenerateMindmapsRequest, GenerateMindmapsResponse,
    GetMindmapsResponse
)
from services.tutorial_support_service import (
    create_tutorial_session,
    add_note,
    get_notes,
    update_note,
    delete_note,
    prettify_notes,
    generate_detailed_notes,
    get_all_tutorials,
    tutorial_ai_chat,
    get_tutorial_chat_history,
    # Quiz functions
    generate_quiz_from_transcript,
    evaluate_quiz,
    get_quiz_details,
    get_tutorial_quizzes,
    get_user_quizzes,
    # Mindmap functions
    generate_tutorial_mindmaps,
    get_tutorial_mindmaps
)

router = APIRouter()

@router.post("/create", response_model=CreateTutorialResponse)
async def create_tutorial_endpoint(
    req: CreateTutorialRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Create a new tutorial support session.
    Requires JWT authentication - uses authenticated user's email.
    Returns tutorial_id and title for the tutorial.
    """
    try:
        result = await create_tutorial_session(current_user, req.tutorial_link)
        return CreateTutorialResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/notes/add", response_model=AddNoteResponse)
async def add_note_endpoint(
    req: AddNoteRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Add a note to a tutorial at a specific timestamp.
    Requires JWT authentication - uses authenticated user's email.
    Requires tutorial_id, note content, and video timestamp.
    """
    try:
        result = await add_note(req.tutorial_id, current_user, req.note, req.timestamp)
        return AddNoteResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/notes", response_model=GetNotesResponse)
async def get_notes_endpoint(
    tutorial_id: str = Query(...),
    current_user: str = Depends(get_current_user)
):
    """
    Get all notes for a tutorial in chronological order (by timestamp).
    Requires tutorial_id as query parameter.
    """
    try:
        result = await get_notes(tutorial_id)
        return GetNotesResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.put("/notes/{note_id}", response_model=UpdateNoteResponse)
async def update_note_endpoint(
    note_id: str,
    req: UpdateNoteRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Update a specific note by note_id.
    Provide the updated text in the request body.
    """
    try:
        result = await update_note(note_id, req.updated_text)
        return UpdateNoteResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.delete("/notes/{note_id}", response_model=DeleteNoteResponse)
async def delete_note_endpoint(
    note_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a specific note by note_id.
    """
    try:
        result = await delete_note(note_id)
        return DeleteNoteResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/notes/prettify", response_model=PrettifyNotesResponse)
async def prettify_notes_endpoint(
    req: PrettifyNotesRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Generate prettified, well-organized notes using AI.
    Takes raw notes and formats them nicely without adding new information.
    Requires tutorial_id.
    """
    try:
        result = await prettify_notes(req.tutorial_id)
        return PrettifyNotesResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/notes/detailed", response_model=DetailedNotesResponse)
async def generate_detailed_notes_endpoint(
    req: DetailedNotesRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Generate comprehensive, detailed study notes using AI.
    Expands on the concepts mentioned in notes to create complete study material.
    Requires tutorial_id.
    """
    try:
        result = await generate_detailed_notes(req.tutorial_id)
        return DetailedNotesResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/my-tutorials", response_model=GetAllTutorialsResponse)
async def get_all_tutorials_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Get all tutorial sessions for authenticated user.
    Returns list of tutorials with metadata (title, link, notes count, timestamps).
    Sorted by most recently updated first.
    Requires JWT authentication - returns current user's tutorials.
    """
    try:
        result = await get_all_tutorials(current_user)
        return GetAllTutorialsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/chat", response_model=TutorialChatResponse)
async def tutorial_ai_chat_endpoint(
    req: TutorialChatRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    AI companion chat for asking questions about the tutorial.
    Maintains conversation context and references tutorial notes.
    Perfect for clarifying concepts, asking follow-up questions, or getting deeper explanations.
    """
    try:
        result = await tutorial_ai_chat(req.tutorial_id, req.question)
        return TutorialChatResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# ============================================================================
# QUIZ ENDPOINTS
# ============================================================================

@router.post("/quiz/generate", response_model=GenerateQuizResponse)
async def generate_quiz_endpoint(
    req: GenerateQuizRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Generate a quiz from video transcript for a specific time range.
    Creates 20 MCQ questions (4 options each) and 5 descriptive questions.
    Based on the actual content of the video transcript.
    """
    try:
        result = await generate_quiz_from_transcript(
            req.tutorial_id,
            req.from_timestamp,
            req.to_timestamp
        )
        return GenerateQuizResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/quiz/evaluate", response_model=EvaluateQuizResponse)
async def evaluate_quiz_endpoint(
    req: EvaluateQuizRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Evaluate quiz answers and generate detailed performance report.
    Auto-evaluates MCQs and uses AI to evaluate descriptive answers.
    Provides scores, feedback, strengths, weaknesses, and study suggestions.
    """
    try:
        result = await evaluate_quiz(req.quiz_id, req.answers)
        return EvaluateQuizResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/quiz/{quiz_id}", response_model=QuizDetailsResponse)
async def get_quiz_details_endpoint(
    quiz_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get complete quiz details including questions, options, and evaluation report.
    Returns MCQ questions, descriptive questions, and evaluation results if quiz was evaluated.
    """
    try:
        result = await get_quiz_details(quiz_id)
        return QuizDetailsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/quiz/tutorial/{tutorial_id}", response_model=TutorialQuizzesResponse)
async def get_tutorial_quizzes_endpoint(
    tutorial_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get all quizzes for a specific tutorial.
    Returns list of quizzes with summaries including scores and timestamps.
    Sorted by most recently created first.
    """
    try:
        result = await get_tutorial_quizzes(tutorial_id)
        return TutorialQuizzesResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/quiz/my-quizzes", response_model=UserQuizzesResponse)
async def get_user_quizzes_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Get all quizzes across all tutorials for authenticated user.
    Returns comprehensive list of all quizzes with their evaluation status and scores.
    Sorted by most recently created first.
    Requires JWT authentication - returns current user's quizzes.
    """
    try:
        result = await get_user_quizzes(current_user)
        return UserQuizzesResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# ============================================================================
# MINDMAP ENDPOINTS
# ============================================================================

@router.post("/mindmap/generate", response_model=GenerateMindmapsResponse)
async def generate_mindmaps(
    request: GenerateMindmapsRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Generate mindmaps from tutorial notes.
    
    This endpoint:
    - Analyzes all notes from the tutorial
    - Determines the optimal number of mindmaps (1-5)
    - Generates mindmap structures using AI
    - Renders them as base64 encoded PNG images
    - Saves them to the tutorial document
    """
    try:
        result = await generate_tutorial_mindmaps(request.tutorial_id)
        return GenerateMindmapsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/mindmap/{tutorial_id}", response_model=GetMindmapsResponse)
async def get_mindmaps(
    tutorial_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get all mindmaps for a tutorial.
    
    Returns all previously generated mindmaps with their images in base64 format.
    """
    try:
        result = await get_tutorial_mindmaps(tutorial_id)
        return GetMindmapsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/chat/history/{tutorial_id}", response_model=TutorialChatHistoryResponse)
async def get_chat_history_endpoint(
    tutorial_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get chat history for a specific tutorial.
    
    Returns all previous chat messages between the user and AI for the given tutorial.
    """
    try:
        result = await get_tutorial_chat_history(tutorial_id)
        return TutorialChatHistoryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

