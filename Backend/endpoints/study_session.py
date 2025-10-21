from fastapi import APIRouter, HTTPException, Body, Depends
from utils.jwt_auth import get_current_user
from schemas.study_session import (
    CreateStudySessionRequest, CreateStudySessionResponse,
    StudyAssistantRequest, StudyAssistantResponse,
    GetStudySessionsResponse,
    GetSessionDetailsResponse,
    UpdateStudySessionRequest, UpdateStudySessionResponse,
    DeleteStudySessionResponse,
    GenerateSessionQuizRequest, GenerateSessionQuizResponse,
    GenerateSessionMindmapRequest, GenerateSessionMindmapResponse,
    EvaluateSessionQuizRequest, EvaluateSessionQuizResponse,
    GetSessionQuizzesResponse, GetQuizDetailsResponse, GetSessionMindmapsResponse
)
from services.study_session_service import (
    create_study_session,
    get_user_study_sessions,
    get_session_details,
    update_study_session,
    delete_study_session,
    study_assistant_chat,
    generate_session_quiz,
    generate_session_mindmaps,
    evaluate_session_quiz,
    get_session_quizzes,
    get_quiz_details,
    get_session_mindmaps
)

router = APIRouter()

@router.post("/create", response_model=CreateStudySessionResponse)
async def create_session_endpoint(
    req: CreateStudySessionRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Create a new study session with RAG indexing.
    
    Requires JWT authentication - uses authenticated user's email.
    
    - **subject**: Subject name (e.g., Physics, Mathematics)
    - **grade**: Grade level (e.g., 12th Grade)
    - **study_details**: Main topic or chapter details
    - **resources_text**: Optional study materials/notes
    - **pyq_text**: Optional previous year questions
    - **syllabus_text**: Optional syllabus content
    
    Creates a FAISS index from all text content for contextual RAG search.
    """
    try:
        result = await create_study_session(
            email=current_user,
            subject=req.subject,
            grade=req.grade,
            study_details=req.study_details,
            resources_text=req.resources_text,
            pyq_text=req.pyq_text,
            syllabus_text=req.syllabus_text
        )
        return CreateStudySessionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/chat", response_model=StudyAssistantResponse)
async def study_assistant_endpoint(
    req: StudyAssistantRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    AI Study Assistant with RAG and contextual chat.
    
    - **session_id**: Study session ID
    - **question**: Your study question
    
    Features:
    - Uses RAG to retrieve relevant content from uploaded materials
    - Maintains last 40 messages (20 exchanges) for context
    - Provides detailed, comprehensive explanations
    - Suggests follow-up questions and learning activities
    - Can offer to generate quizzes and mindmaps
    """
    try:
        result = await study_assistant_chat(req.session_id, req.question)
        return StudyAssistantResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/my-sessions", response_model=GetStudySessionsResponse)
async def get_sessions_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Get all study sessions for authenticated user.
    
    Returns list of all study sessions sorted by most recently updated.
    Requires JWT authentication - returns current user's sessions.
    """
    try:
        result = await get_user_study_sessions(current_user)
        return GetStudySessionsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/{session_id}", response_model=GetSessionDetailsResponse)
async def get_session_details_endpoint(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get complete session details including chat history.
    
    - **session_id**: Study session ID
    
    Returns all session metadata, chat history, and study materials.
    """
    try:
        result = await get_session_details(session_id)
        return GetSessionDetailsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.put("/update", response_model=UpdateStudySessionResponse)
async def update_session_endpoint(
    req: UpdateStudySessionRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Update study session details.
    
    - **session_id**: Study session ID
    - **session_name**: Optional updated name
    - **subject**: Optional updated subject
    - **grade**: Optional updated grade
    - **study_details**: Optional updated topic details
    - **resources_text**: Optional updated resources
    - **pyq_text**: Optional updated PYQ content
    - **syllabus_text**: Optional updated syllabus
    
    Note: Updating text content will rebuild the RAG index.
    """
    try:
        result = await update_study_session(
            session_id=req.session_id,
            session_name=req.session_name,
            subject=req.subject,
            grade=req.grade,
            study_details=req.study_details,
            resources_text=req.resources_text,
            pyq_text=req.pyq_text,
            syllabus_text=req.syllabus_text
        )
        return UpdateStudySessionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.delete("/{session_id}", response_model=DeleteStudySessionResponse)
async def delete_session_endpoint(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a study session.
    
    - **session_id**: Study session ID
    
    Permanently deletes the session and all associated data.
    """
    try:
        result = await delete_study_session(session_id)
        return DeleteStudySessionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/quiz/generate", response_model=GenerateSessionQuizResponse)
async def generate_quiz_endpoint(
    req: GenerateSessionQuizRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Generate a quiz based on the study session.
    
    - **session_id**: Study session ID
    
    Generates 20 MCQs and 5 descriptive questions based on:
    - Chat history (topics discussed)
    - Syllabus content
    - PYQ patterns
    - Study materials
    
    Quiz is stored in the session for future reference.
    """
    try:
        result = await generate_session_quiz(req.session_id)
        return GenerateSessionQuizResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/mindmap/generate", response_model=GenerateSessionMindmapResponse)
async def generate_mindmap_endpoint(
    req: GenerateSessionMindmapRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Generate mindmaps from the study session.
    
    - **session_id**: Study session ID
    
    Analyzes chat history and study materials to generate 1-3 mindmaps
    visualizing the key concepts covered in the session.
    
    Mindmaps are stored in the session and returned as base64 PNG images.
    """
    try:
        result = await generate_session_mindmaps(req.session_id)
        return GenerateSessionMindmapResponse(**result)
    except ValueError as e:
        print(f"ValueError in mindmap generation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Exception in mindmap generation: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/quiz/evaluate", response_model=EvaluateSessionQuizResponse)
async def evaluate_quiz_endpoint(
    req: EvaluateSessionQuizRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Evaluate a study session quiz.
    
    - **quiz_id**: Quiz ID from generated quiz
    - **answers**: List of answers with question_id and answer (int for MCQ, str for descriptive)
    
    Returns detailed evaluation with:
    - Individual question feedback
    - Overall score and percentage
    - Strengths and areas for improvement
    - Personalized study suggestions
    """
    try:
        # Convert Pydantic models to dicts for service
        answers_list = [{"question_id": ans.question_id, "answer": ans.answer} for ans in req.answers]
        result = await evaluate_session_quiz(req.quiz_id, answers_list)
        return EvaluateSessionQuizResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/{session_id}/quizzes", response_model=GetSessionQuizzesResponse)
async def get_session_quizzes_endpoint(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get all quizzes for a study session.
    
    - **session_id**: Study session ID
    
    Returns list of all quizzes with their evaluation status and scores.
    """
    try:
        result = await get_session_quizzes(session_id)
        return GetSessionQuizzesResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/quiz/{quiz_id}", response_model=GetQuizDetailsResponse)
async def get_quiz_details_endpoint(
    quiz_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get quiz details including questions and evaluation results.
    
    - **quiz_id**: Quiz ID
    
    Returns full quiz details. If quiz is evaluated, includes correct answers and evaluation report.
    If not evaluated, correct answers are hidden.
    """
    try:
        result = await get_quiz_details(quiz_id)
        return GetQuizDetailsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/{session_id}/mindmaps", response_model=GetSessionMindmapsResponse)
async def get_session_mindmaps_endpoint(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get all mindmaps for a study session.
    
    - **session_id**: Study session ID
    
    Returns list of all mindmaps with their images.
    """
    try:
        result = await get_session_mindmaps(session_id)
        return GetSessionMindmapsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

