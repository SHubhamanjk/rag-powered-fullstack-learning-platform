"""
Contact Form Endpoints
"""
from fastapi import APIRouter, HTTPException
from schemas.contact import ContactFormRequest, ContactFormResponse
from utils.email import send_email

router = APIRouter(prefix="/contact", tags=["Contact"])

@router.post("/submit", response_model=ContactFormResponse)
async def submit_contact_form(request: ContactFormRequest):
    """
    Submit contact form
    
    Sends an email notification to the admin with the contact form details.
    """
    try:
        # Prepare email content
        subject = f"New Contact Form Submission from {request.name}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #4299e1 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Contact Form Submission</h1>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">You've received a new message from Medha.ai Contact Form:</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; font-weight: bold; color: #667eea; width: 30%;">👤 Name:</td>
                            <td style="padding: 10px 0; color: #333;">{request.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; font-weight: bold; color: #667eea;">📱 Contact:</td>
                            <td style="padding: 10px 0; color: #333;">{request.contact}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin: 20px 0;">
                    <p style="font-weight: bold; color: #667eea; margin-bottom: 10px;">💬 Message:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px;">
                        <p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">{request.message}</p>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                        📧 Respond directly to: <a href="mailto:{request.contact}" style="color: #667eea; text-decoration: none;">{request.contact}</a>
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
                <p>This is an automated notification from Medha.ai Contact Form</p>
            </div>
        </div>
        """
        
        # Send email to admin
        admin_email = "shubham_2312res631@iitp.ac.in"
        
        # Plain text version
        plain_body = f"""
New Contact Form Submission from Medha.ai

Name: {request.name}
Contact: {request.contact}

Message:
{request.message}

---
Reply to: {request.contact}
"""
        
        await send_email(
            recipient=admin_email,
            subject=subject,
            body=plain_body,
            html_body=html_content
        )
        
        return ContactFormResponse(
            success=True,
            message="Thank you for reaching out! We'll get back to you soon."
        )
        
    except Exception as e:
        print(f"Error sending contact form email: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit contact form. Please try again later."
        )

