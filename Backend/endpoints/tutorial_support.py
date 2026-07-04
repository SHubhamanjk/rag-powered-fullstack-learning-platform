from fastapi import APIRouter, HTTPException, Body, Query, Depends
from fastapi.responses import Response
import requests
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
    EditTutorialRequest, EditTutorialResponse,
    DeleteTutorialResponse,
    GenerateConsolidatedNotesRequest, GenerateConsolidatedNotesResponse,
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
    edit_tutorial,
    delete_tutorial,
    generate_consolidated_notes,
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

@router.get("/download-image")
def download_image(url: str = Query(...), filename: str = Query("download.png")):
    """Proxy endpoint to download cross-origin images and bypass CORS"""
    if not url.startswith("https://storage.googleapis.com/"):
        raise HTTPException(status_code=400, detail="Invalid image URL domain")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        return Response(
            content=response.content,
            media_type="image/png",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")


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
        result = await create_tutorial_session(current_user, req.tutorial_link, req.group)
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
    Requires tutorial_id, timestamp, and at least one of: note (text) or image (base64).
    Image should be provided in base64 format (e.g., "data:image/png;base64,...").
    """
    try:
        result = await add_note(req.tutorial_id, current_user, req.note, req.image, req.timestamp)
        return AddNoteResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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
    Provide at least one of: updated_text or updated_image (base64) in the request body.
    Image should be provided in base64 format (e.g., "data:image/png;base64,...").
    """
    try:
        result = await update_note(note_id, req.updated_text, req.updated_image)
        return UpdateNoteResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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
    
    Optional: Provide current_timestamp (MM:SS or HH:MM:SS) to add recent video transcript as context.
    This helps the AI answer questions about what was just explained in the video.
    """
    try:
        result = await tutorial_ai_chat(req.tutorial_id, req.question, req.current_timestamp)
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

# IMPORTANT: Specific routes MUST come BEFORE parameterized routes like {quiz_id}
# Otherwise FastAPI will match "my-quizzes" or "tutorial" as a quiz_id parameter

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

@router.get("/quiz/tutorial/{tutorial_id}", response_model=TutorialQuizzesResponse)
async def get_tutorial_quizzes_endpoint(
    tutorial_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get all quizzes for a specific tutorial.
    Returns list of quizzes with full details including:
    - Quiz metadata (timestamps, total questions)
    - Evaluation status and scores
    - Complete evaluation report (if quiz was evaluated) with:
      * Overall feedback and suggestions
      * Strengths and areas for improvement
      * Detailed results for each question
    
    Sorted by most recently created first.
    """
    try:
        result = await get_tutorial_quizzes(tutorial_id)
        return TutorialQuizzesResponse(**result)
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

@router.patch("/{tutorial_id}", response_model=EditTutorialResponse)
async def edit_tutorial_endpoint(
    tutorial_id: str,
    req: EditTutorialRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Edit tutorial title or group.
    Requires JWT authentication - uses authenticated user's email.
    """
    try:
        result = await edit_tutorial(tutorial_id, current_user, req.title, req.group)
        return EditTutorialResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.delete("/{tutorial_id}", response_model=DeleteTutorialResponse)
async def delete_tutorial_endpoint(
    tutorial_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a tutorial.
    Requires JWT authentication - uses authenticated user's email.
    """
    try:
        result = await delete_tutorial(tutorial_id, current_user)
        return DeleteTutorialResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/consolidated-notes", response_model=GenerateConsolidatedNotesResponse)
async def generate_consolidated_notes_endpoint(
    req: GenerateConsolidatedNotesRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Generate consolidated notes from all tutorials in a specific group.
    Requires JWT authentication - uses authenticated user's email.
    Combines all notes from all tutorials in the group (oldest to newest).
    """
    try:
        result = await generate_consolidated_notes(current_user, req.group)
        return GenerateConsolidatedNotesResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

