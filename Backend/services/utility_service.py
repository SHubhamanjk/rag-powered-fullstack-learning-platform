from utils.llm import groq_chat_completion
from prompts import REWRITE_SYSTEM_PROMPT, get_rewrite_prompt


async def rewrite_text(text: str, context: str = "general") -> dict:
    """
    Rewrite text to be clearer, more concise, and grammatically correct
    while maintaining similar length and original meaning.
    
    Args:
        text: Text to be rewritten
        context: Context for rewriting (note, todo, message, general)
    
    Returns:
        Dictionary with original_text, rewritten_text, and improvement_applied
    """
    
    # If text is too short, return as-is
    if len(text.strip()) < 5:
        return {
            "original_text": text,
            "rewritten_text": text,
            "improvement_applied": False
        }
    
    try:
        # Build messages using modular prompts
        messages = [
            {"role": "system", "content": REWRITE_SYSTEM_PROMPT},
            {"role": "user", "content": get_rewrite_prompt(text, context)}
        ]
        
        # Use Groq for fast response
        rewritten = groq_chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=2000  # Increased to ensure complete rewrites
        )
        
        rewritten = rewritten.strip()
        
        # Check if text was actually improved
        improvement_applied = rewritten.lower() != text.lower()
        
        return {
            "original_text": text,
            "rewritten_text": rewritten,
            "improvement_applied": improvement_applied
        }
        
    except Exception as e:
        # If rewriting fails, return original text
        print(f"Error in rewrite_text: {str(e)}")
        return {
            "original_text": text,
            "rewritten_text": text,
            "improvement_applied": False
        }

