from fastapi import APIRouter, HTTPException, Depends
from schemas.dashboard import DashboardResponse
from services.dashboard_service import get_dashboard
from utils.jwt_auth import get_current_user

router = APIRouter()

@router.get("/", response_model=DashboardResponse)
async def dashboard_endpoint(
    current_user: str = Depends(get_current_user)
):
    """
    Get comprehensive dashboard analytics for authenticated user
    
    Returns:
    - Analytics summary (counts)
    - All study chats with details
    - All friend chats with details
    - All study sessions with quizzes and mindmaps
    - All tutorials with notes, quizzes, and mindmaps
    - All todos with status
    
    Requires JWT authentication - returns current user's dashboard.
    """
    try:
        data = await get_dashboard(current_user)
        return DashboardResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")
