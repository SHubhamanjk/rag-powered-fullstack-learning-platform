from fastapi import APIRouter, HTTPException, Body, Depends
from schemas.user import (
    UserCreateRequest, UserCreateResponse,
    UserLoginRequest, UserLoginResponse,
    UserUpdateRequest, UserUpdateResponse,
    UserDetails,
    ForgotPasswordRequest, ForgotPasswordResponse,
    VerifyOTPRequest, VerifyOTPResponse,
    ResetPasswordRequest, ResetPasswordResponse
)
from services.user_service import (
    create_user, login_user, update_user, get_user_by_email,
    initiate_password_reset, verify_otp, reset_password
)
from utils.jwt_auth import get_current_user
from utils.error_handler import get_user_friendly_error, get_error_message

router = APIRouter()

@router.post("/create", response_model=UserCreateResponse)
async def create_user_endpoint(user_data: UserCreateRequest = Body(...)):
    """
    Create a new user with basic details, educational details, email, and password
    """
    try:
        educational_details_dict = None
        if user_data.educational_details:
            educational_details_dict = user_data.educational_details.model_dump()
        
        result = await create_user(
            name=user_data.name,
            age=user_data.age,
            gender=user_data.gender,
            email=user_data.email,
            password=user_data.password,
            educational_details=educational_details_dict,
        )
        
        return UserCreateResponse(
            email=result["email"],
            message="Account created successfully! Welcome to Medha.ai",
            token=result["token"]
        )
    except ValueError as e:
        # Check for specific error messages
        error_msg = str(e).lower()
        if "already exists" in error_msg or "duplicate" in error_msg:
            raise HTTPException(status_code=400, detail=get_error_message("email_exists"))
        raise HTTPException(status_code=400, detail=get_user_friendly_error(e)["message"])
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to create your account. Please try again.")

@router.post("/login", response_model=UserLoginResponse)
async def login_user_endpoint(login_data: UserLoginRequest = Body(...)):
    """
    Login user with email and password
    """
    try:
        result = await login_user(
            email=login_data.email,
            password=login_data.password
        )
        
        return UserLoginResponse(
            email=result["email"],
            name=result["name"],
            message="Welcome back! Login successful",
            token=result["token"]
        )
    except ValueError as e:
        # Provide generic message for security (don't reveal if email exists)
        raise HTTPException(status_code=401, detail=get_error_message("invalid_credentials"))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to log you in. Please try again.")

@router.put("/me", response_model=UserUpdateResponse)
async def update_user_endpoint(
    update_data: UserUpdateRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Update authenticated user's information.
    Requires JWT authentication - only allows updating own profile.
    """
    try:
        educational_details_dict = None
        if update_data.educational_details:
            educational_details_dict = update_data.educational_details.model_dump()
        
        result = await update_user(
            email=current_user,
            name=update_data.name,
            age=update_data.age,
            gender=update_data.gender,
            password=update_data.password,
            educational_details=educational_details_dict,
        )
        
        return UserUpdateResponse(
            email=result["email"],
            message="User updated successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/me", response_model=UserDetails)
async def get_user_details(
    current_user: str = Depends(get_current_user)
):
    """
    Get authenticated user's details (without password).
    Requires JWT authentication - returns current user's data.
    """
    user = await get_user_by_email(current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Exclude password from response
    user_dict = user.model_dump(exclude={'password'})
    return UserDetails(**user_dict)

# ============================================================================
# PASSWORD RESET ENDPOINTS
# ============================================================================

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password_endpoint(request: ForgotPasswordRequest = Body(...)):
    """
    Initiate password reset process.
    Sends a 6-digit OTP to the user's email.
    OTP expires in 10 minutes.
    """
    try:
        result = await initiate_password_reset(request.email)
        return ForgotPasswordResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp_endpoint(request: VerifyOTPRequest = Body(...)):
    """
    Verify the OTP sent to user's email.
    Returns a reset_token if OTP is valid.
    Use this token to reset the password.
    """
    try:
        result = await verify_otp(request.email, request.otp)
        return VerifyOTPResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(request: ResetPasswordRequest = Body(...)):
    """
    Reset user password with verified reset token.
    The reset_token is obtained from the verify-otp endpoint.
    """
    try:
        result = await reset_password(request.email, request.reset_token, request.new_password)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return ResetPasswordResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
