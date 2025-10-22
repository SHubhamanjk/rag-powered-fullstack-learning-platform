from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
import secrets
import random
from utils.db import get_user_collection, get_otp_collection, get_password_reset_tokens_collection
from utils.email import send_otp_email
from utils.jwt_auth import create_access_token
from utils.timezone import get_current_time
from utils.cache import cache_response, invalidate_user_cache
from models.user import UserProfile

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt (truncates to 72 bytes for bcrypt compatibility)"""
    # Bcrypt has a 72-byte limit, truncate password to be safe
    password_bytes = password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password_truncated)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

async def create_user(
    *,
    name: str,
    age: Optional[int],
    gender: Optional[str],
    email: str,
    password: str,
    educational_details: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Create a new user """
    user_coll = get_user_collection()
    
    # Check if user already exists
    existing_user = user_coll.find_one({"email": email})
    if existing_user:
        raise ValueError("User with this email already exists")
   
    
    # Create user document
    current_time = get_current_time().isoformat()
    
    doc: Dict[str, Any] = {
        "email": email,
        "name": name,
        "age": age,
        "gender": gender,
        "password": password,  # Plain text for now
        "educational_details": educational_details,
        "created_at": current_time,
        "updated_at": current_time,
    }
    
    user_coll.insert_one(doc)
    
    # Generate JWT token
    token = create_access_token(data={"email": email})
    
    return {"email": email, "token": token}

async def login_user(email: str, password: str) -> Dict[str, Any]:
    """Authenticate user and return user info"""
    user_coll = get_user_collection()
    
    # Find user by email
    user_doc = user_coll.find_one({"email": email})
    if not user_doc:
        raise ValueError("Invalid email or password")
    

    if password != user_doc["password"]:
        raise ValueError("Invalid email or password")
    
    # Generate JWT token
    token = create_access_token(data={"email": user_doc["email"]})
    
    return {
        "email": user_doc["email"],
        "name": user_doc["name"],
        "token": token
    }

async def update_user(
    email: str,
    *,
    name: Optional[str] = None,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    password: Optional[str] = None,
    educational_details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Update user information"""
    user_coll = get_user_collection()
    
    # Check if user exists
    existing_user = user_coll.find_one({"email": email})
    if not existing_user:
        raise ValueError("User not found")
    
    # Prepare update document
    update_doc: Dict[str, Any] = {
        "updated_at": get_current_time().isoformat()
    }
    
    if name is not None:
        update_doc["name"] = name
    if age is not None:
        update_doc["age"] = age
    if gender is not None:
        update_doc["gender"] = gender
    if password is not None:
        update_doc["password"] = password
    if educational_details is not None:
        update_doc["educational_details"] = educational_details
    
    # Update user
    user_coll.update_one(
        {"email": email},
        {"$set": update_doc}
    )
    
    return {"email": email}

async def get_user_by_email(email: str) -> Optional[UserProfile]:
    """Get user by email (without password in response)"""
    user_coll = get_user_collection()
    doc = user_coll.find_one({"email": email})
    if not doc:
        return None
    return UserProfile(**doc)

# ============================================================================
# PASSWORD RESET FUNCTIONS
# ============================================================================

async def generate_and_send_otp(email: str) -> str:
    """Generate and send OTP via email"""
    # 1. Generate random 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # 2. Store OTP in database
    otp_collection = get_otp_collection()
    otp_collection.insert_one({
        "email": email,
        "otp": otp,
        "timestamp": get_current_time(),
        "expires_at": get_current_time() + timedelta(minutes=10)  # 10 min expiry
    })
    
    # 3. Send OTP via email
    success = await send_otp_email(email, otp)
    if not success:
        raise Exception("Failed to send OTP email")
    
    return otp

async def initiate_password_reset(email: str) -> Dict[str, Any]:
    """Initiate password reset process"""
    # 1. Check if user exists
    user = await get_user_by_email(email)
    if not user:
        # Don't reveal if email exists or not for security
        return {
            "message": "If this email exists, an OTP has been sent",
            "email": email
        }
    
    # 2. Generate secure reset token (for tracking)
    reset_token = secrets.token_urlsafe(32)
    expiry = get_current_time() + timedelta(hours=1)  # 1 hour expiry
    
    # 3. Store reset token in database
    reset_tokens_collection = get_password_reset_tokens_collection()
    reset_tokens_collection.insert_one({
        "email": email,
        "token": reset_token,
        "expires_at": expiry,
        "used": False,
        "created_at": get_current_time()
    })
    
    # 4. Generate and send OTP via email
    try:
        await generate_and_send_otp(email)
        return {
            "message": "OTP sent successfully to your email",
            "email": email
        }
    except Exception as e:
        return {
            "message": "Failed to send OTP. Please try again.",
            "email": email
        }

async def verify_otp(email: str, otp: str) -> Dict[str, Any]:
    """Verify OTP and return reset token"""
    otp_collection = get_otp_collection()
    
    # Check if OTP exists and not expired
    record = otp_collection.find_one({
        "email": email,
        "otp": otp,
        "expires_at": {"$gt": get_current_time()}
    })
    
    if not record:
        return {
            "message": "Invalid or expired OTP",
            "verified": False,
            "reset_token": None
        }
    
    # Get the latest unused reset token for this email
    reset_tokens_collection = get_password_reset_tokens_collection()
    token_doc = reset_tokens_collection.find_one({
        "email": email,
        "used": False,
        "expires_at": {"$gt": get_current_time()}
    }, sort=[("created_at", -1)])
    
    if not token_doc:
        return {
            "message": "Reset token expired. Please request a new password reset.",
            "verified": False,
            "reset_token": None
        }
    
    # Delete the OTP after successful verification
    otp_collection.delete_one({"_id": record["_id"]})
    
    return {
        "message": "OTP verified successfully",
        "verified": True,
        "reset_token": token_doc["token"]
    }

async def reset_password(email: str, reset_token: str, new_password: str) -> Dict[str, Any]:
    """Reset user password with verified token"""
    reset_tokens_collection = get_password_reset_tokens_collection()
    
    # 1. Verify reset token
    token_doc = reset_tokens_collection.find_one({
        "email": email,
        "token": reset_token,
        "used": False,
        "expires_at": {"$gt": get_current_time()}
    })
    
    if not token_doc:
        return {
            "message": "Invalid or expired reset token",
            "success": False
        }
    
    # 2. Update password
    user_coll = get_user_collection()
    user_coll.update_one(
        {"email": email},
        {
            "$set": {
                "password": new_password,  # Plain text for now
                "updated_at": get_current_time().isoformat()
            }
        }
    )
    
    # 3. Mark token as used
    reset_tokens_collection.update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"used": True}}
    )
    
    # 4. Clean up any remaining OTPs for this email
    otp_collection = get_otp_collection()
    otp_collection.delete_many({"email": email})
    
    return {
        "message": "Password reset successfully",
        "success": True
    }

