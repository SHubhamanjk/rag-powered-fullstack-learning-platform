from pydantic import BaseModel, EmailStr
from typing import Optional

class EducationalDetails(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    grade: Optional[str] = None
    year_of_study: Optional[str] = None

class UserProfile(BaseModel):
    email: EmailStr
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    password: str 
    educational_details: Optional[EducationalDetails] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
