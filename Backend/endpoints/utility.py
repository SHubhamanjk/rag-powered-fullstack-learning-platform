from fastapi import APIRouter, Depends
from schemas.utility import RewriteTextRequest, RewriteTextResponse
from services.utility_service import rewrite_text
from utils.jwt_auth import get_current_user

router = APIRouter()


@router.post("/rewrite-text", response_model=RewriteTextResponse)
async def rewrite_text_endpoint(
    request: RewriteTextRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Rewrite text to improve clarity and grammar while maintaining similar length.
    """
    result = await rewrite_text(request.text, request.context)
    return RewriteTextResponse(**result)

