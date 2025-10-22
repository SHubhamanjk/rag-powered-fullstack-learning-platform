# TTS ENDPOINT - COMMENTED OUT TO REDUCE MEMORY USAGE
# from fastapi import APIRouter, Depends
# from schemas.tts import TTSRequest, TTSResponse
# from services.tts_service import text_to_speech
# from utils.jwt_auth import get_current_user

# router = APIRouter()

# @router.post("/", response_model=TTSResponse)
# async def tts_endpoint(
#     req: TTSRequest,
#     current_user: str = Depends(get_current_user)
# ):
#     """Text-to-Speech endpoint. Requires JWT authentication."""
#     audio_url = await text_to_speech(req.text)
#     return TTSResponse(audio_url=audio_url)
