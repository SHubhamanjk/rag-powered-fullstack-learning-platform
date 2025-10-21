from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class EducationalDetailsSchema(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    grade: Optional[str] = None
    year_of_study: Optional[str] = None

class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    age: Optional[int] = Field(None, ge=1, le=150)
    gender: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=6)
    educational_details: Optional[EducationalDetailsSchema] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "Alice Johnson",
                "age": 20,
                "gender": "Female",
                "email": "alice@example.com",
                "password": "securepass123",
                "educational_details": {
                    "institution": "Stanford University",
                    "degree": "Bachelor's",
                    "field_of_study": "Computer Science",
                    "grade": "A",
                    "year_of_study": "3rd Year"
                }
            }]
        }
    }

class UserCreateResponse(BaseModel):
    email: EmailStr
    message: str
    token: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "alice@example.com",
                "message": "User created successfully",
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }]
        }
    }

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "alice@example.com",
                "password": "securepass123"
            }]
        }
    }

class UserLoginResponse(BaseModel):
    email: EmailStr
    name: str
    message: str
    token: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "alice@example.com",
                "name": "Alice Johnson",
                "message": "Login successful",
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }]
        }
    }

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=150)
    gender: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    educational_details: Optional[EducationalDetailsSchema] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "Alice Johnson Updated",
                "age": 21
            }]
        }
    }

class UserUpdateResponse(BaseModel):
    email: EmailStr
    message: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "alice@example.com",
                "message": "User updated successfully"
            }]
        }
    }

class UserDetails(BaseModel):
    email: EmailStr
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    educational_details: Optional[EducationalDetailsSchema] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "alice@example.com",
                "name": "Alice Johnson",
                "age": 20,
                "gender": "Female",
                "educational_details": {
                    "institution": "Stanford University",
                    "degree": "Bachelor's",
                    "field_of_study": "Computer Science",
                    "grade": "A",
                    "year_of_study": "3rd Year"
                },
                "created_at": "2025-01-15T10:30:00",
                "updated_at": "2025-01-16T14:20:00"
            }]
        }
    }

# ============================================================================
# FORGOT PASSWORD SCHEMAS
# ============================================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "user@example.com"
            }]
        }
    }

class ForgotPasswordResponse(BaseModel):
    message: str
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "user@example.com",
                "otp": "123456"
            }]
        }
    }

class VerifyOTPResponse(BaseModel):
    message: str
    verified: bool
    reset_token: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "user@example.com",
                "reset_token": "abc123xyz",
                "new_password": "NewSecurePassword123"
            }]
        }
    }

class ResetPasswordResponse(BaseModel):
    message: str
    success: bool
