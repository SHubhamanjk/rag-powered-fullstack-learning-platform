from fastapi import APIRouter, UploadFile, File, Depends
from schemas.stt import STTResponse
from services.stt_service import speech_to_text_from_file
from utils.jwt_auth import get_current_user

router = APIRouter()

@router.post("/", response_model=STTResponse)
async def stt_endpoint(
    audio: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Speech-to-Text endpoint. Requires JWT authentication."""
    text = await speech_to_text_from_file(audio)
    return STTResponse(text=text)
