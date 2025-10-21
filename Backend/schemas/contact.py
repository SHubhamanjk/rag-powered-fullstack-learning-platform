"""
Contact Form Schemas
"""
from pydantic import BaseModel, Field

class ContactFormRequest(BaseModel):
    """Contact form submission request"""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the person")
    contact: str = Field(..., min_length=1, max_length=200, description="Mobile number or email")
    message: str = Field(..., min_length=1, max_length=500, description="Message content")

class ContactFormResponse(BaseModel):
    """Contact form submission response"""
    success: bool
    message: str

