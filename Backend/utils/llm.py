"""
Centralized LLM (Large Language Model) client management
Supports multiple providers for better rate limit distribution and easy switching
"""

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types

load_dotenv()

# ============================================================================
# CLIENT INITIALIZATION
# ============================================================================

# Groq Client - Used for general chat, friend chat, todo assistant
_groq_client = None
def get_groq_client() -> Groq:
    """Get or create Groq client instance"""
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        _groq_client = Groq(api_key=api_key)
    return _groq_client

# Gemini Client - Used for study sessions and tutorial support (heavy features)
_gemini_client = None
def get_gemini_client() -> genai.Client:
    """Get or create Gemini client instance"""
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client

# Model configurations
GROQ_MODEL = os.getenv("GROQ_MODEL")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")

# Timeout configuration
GROQ_TIMEOUT = 60  # seconds

# ============================================================================
# GROQ HELPER FUNCTIONS
# ============================================================================

def groq_chat_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    response_format: Optional[Dict[str, str]] = None
) -> str:
    """
    Generate chat completion using Groq
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens to generate
        response_format: Optional response format (e.g., {"type": "json_object"})
    
    Returns:
        Generated text response
    
    Raises:
        ValueError: If response is empty or None
        Exception: For other API errors
    """
    client = get_groq_client()
    
    kwargs = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "timeout": GROQ_TIMEOUT,
    }
    
    if max_tokens:
        kwargs["max_tokens"] = max_tokens
    
    if response_format:
        kwargs["response_format"] = response_format
    
    try:
        response = client.chat.completions.create(**kwargs)
        
        # Validate response
        if not response or not response.choices or len(response.choices) == 0:
            print(f"[Groq] No choices in response: {response}")
            raise ValueError("Unable to generate response")
        
        content = response.choices[0].message.content
        
        if content is None or not content.strip():
            # Log finish reason if available
            choice = response.choices[0]
            finish_reason = choice.finish_reason if hasattr(choice, 'finish_reason') else 'unknown'
            print(f"[Groq] Empty response. Finish reason: {finish_reason}")
            raise ValueError("Unable to generate response")
        
        return content
        
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower():
            print(f"[Groq] Timeout error: {error_msg}")
            raise ValueError("Request timeout")
        print(f"[Groq] Error: {error_msg}")
        raise

# ============================================================================
# GEMINI HELPER FUNCTIONS
# ============================================================================

def gemini_generate_content(
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None
) -> str:
    """
    Generate content using Gemini
    
    Args:
        prompt: The user prompt/question
        system_instruction: Optional system instruction for behavior
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens to generate
    
    Returns:
        Generated text response
    
    Raises:
        ValueError: If response is empty or None
        Exception: For other API errors
    """
    client = get_gemini_client()
    
    # Build configuration using GenerateContentConfig
    config_params = {
        "temperature": temperature,
    }
    
    if max_tokens:
        config_params["max_output_tokens"] = max_tokens
    
    if system_instruction:
        config_params["system_instruction"] = system_instruction
    
    config = types.GenerateContentConfig(**config_params)
    
    # Build request with error handling
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=config
        )
        
        # Check if response text is valid
        if not response or not hasattr(response, 'text'):
            raise ValueError("Unable to generate response")
        
        response_text = response.text
        
        # Check if response is None or empty
        if response_text is None or not response_text.strip():
            raise ValueError("Unable to generate response")
        
        return response_text
        
    except Exception as e:
        # Re-raise with more context (for internal logging)
        error_msg = str(e)
        if "content" in error_msg.lower() and "filter" in error_msg.lower():
            # Log internally but don't expose details
            print(f"[LLM] Content filtering triggered: {error_msg}")
            raise ValueError("Unable to process request")
        print(f"[LLM] Gemini generate error: {error_msg}")
        raise

def gemini_chat_completion(
    messages: List[Dict[str, str]],
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None
) -> str:
    """
    Generate chat completion using Gemini - Simple version that works
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        system_instruction: Optional system instruction
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens to generate
    
    Returns:
        Generated text response
    """
    client = get_gemini_client()
    
    # Build configuration
    config_params = {"temperature": temperature}
    if max_tokens:
        config_params["max_output_tokens"] = max_tokens
    if system_instruction:
        config_params["system_instruction"] = system_instruction
    
    config = types.GenerateContentConfig(**config_params)
    
    # Convert messages to Gemini format
    gemini_messages = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        
        if not content or not content.strip():
            continue
        
        # Convert 'assistant' to 'model' for Gemini
        if role == "assistant":
            role = "model"
        elif role == "system":
            continue  # Skip system messages (handled by system_instruction)
        
        gemini_messages.append({
            "role": role,
            "parts": [{"text": content}]
        })
    
    if not gemini_messages:
        raise ValueError("No valid messages")
    
    # Call API
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=gemini_messages,
            config=config
        )
        
        # Check if response is valid
        if not response or not hasattr(response, 'text'):
            print(f"[Gemini] Invalid response structure: {response}")
            raise ValueError("Invalid response from Gemini")
        
        # Check if response text is empty
        response_text = response.text
        if not response_text or not response_text.strip():
            # Log candidates to see what happened
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                print(f"[Gemini] Empty response. Finish reason: {candidate.finish_reason if hasattr(candidate, 'finish_reason') else 'unknown'}")
                if hasattr(candidate, 'safety_ratings'):
                    print(f"[Gemini] Safety ratings: {candidate.safety_ratings}")
            raise ValueError("Empty response from Gemini")
        
        return response_text
        
    except Exception as e:
        error_msg = str(e)
        print(f"[Gemini] Error details: {error_msg}")
        raise

# ============================================================================
# FALLBACK & RESILIENT CHAT FUNCTIONS
# ============================================================================

def chat_completion_with_fallback(
    messages: List[Dict[str, str]],
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    prefer_gemini: bool = True
) -> tuple[str, str]:
    """
    Chat completion with automatic fallback between Gemini and Groq
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        system_instruction: Optional system instruction for behavior
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens to generate
        prefer_gemini: If True, try Gemini first, then Groq. If False, reverse order.
    
    Returns:
        Tuple of (response_text, provider_used)
        provider_used will be either "gemini" or "groq"
    
    Raises:
        Exception: If both providers fail
    """
    providers = ["gemini", "groq"] if prefer_gemini else ["groq", "gemini"]
    last_error = None
    
    # Debug logging - print message preview
    print(f"[LLM Fallback] Processing {len(messages)} messages")
    if messages:
        last_msg = messages[-1]
        preview = last_msg.get('content', '')[:100]
        print(f"[LLM Fallback] Last message preview: {preview}...")
    
    for provider in providers:
        try:
            if provider == "gemini":
                print(f"[LLM Fallback] Trying Gemini...")
                response = gemini_chat_completion(
                    messages=messages,
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                # Log response preview
                response_preview = response[:100] if response else "None"
                print(f"[LLM Fallback] Gemini response preview: {response_preview}...")
                return (response, "gemini")
            else:  # groq
                print(f"[LLM Fallback] Trying Groq...")
                # Convert to Groq format (add system instruction as first message if provided)
                groq_messages = []
                if system_instruction:
                    groq_messages.append({"role": "system", "content": system_instruction})
                groq_messages.extend(messages)
                
                response = groq_chat_completion(
                    messages=groq_messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                # Log response preview
                response_preview = response[:100] if response else "None"
                print(f"[LLM Fallback] Groq response preview: {response_preview}...")
                return (response, "groq")
                
        except Exception as e:
            last_error = e
            # Log internally only
            print(f"[LLM Fallback] {provider.capitalize()} failed: {str(e)[:100]}")
            continue
    
    # If we get here, all providers failed - use generic user-friendly message
    print(f"[LLM Fallback] All providers failed. Last error: {str(last_error)}")
    raise Exception("Unable to generate response at this time")

# ============================================================================
# PROVIDER INFORMATION
# ============================================================================

def get_provider_info() -> Dict[str, Any]:
    """Get information about configured LLM providers"""
    return {
        "groq": {
            "model": GROQ_MODEL,
            "available": bool(os.getenv("GROQ_API_KEY")),
            "use_cases": ["general_chat", "friend_chat", "todo_assistant", "temporary_chat"]
        },
        "gemini": {
            "model": GEMINI_MODEL,
            "available": bool(os.getenv("GEMINI_API_KEY")),
            "use_cases": ["study_sessions", "tutorial_support", "quiz_generation", "mindmap_generation"]
        }
    }

# ============================================================================
# USAGE GUIDELINES
# ============================================================================

"""
USAGE GUIDELINES:

1. For General Chat, Friend Chat, Todo Assistant:
   from utils.llm import groq_chat_completion
   
   messages = [
       {"role": "system", "content": "You are a helpful assistant"},
       {"role": "user", "content": "Hello!"}
   ]
   response = groq_chat_completion(messages)

2. For Study Sessions, Tutorial Support (with chat history):
   from utils.llm import gemini_chat_completion
   
   messages = [
       {"role": "user", "content": "Explain quantum physics"},
       {"role": "assistant", "content": "Quantum physics is..."},
       {"role": "user", "content": "Can you explain more?"}
   ]
   response = gemini_chat_completion(
       messages=messages,
       system_instruction="You are a patient tutor",
       temperature=0.7
   )

3. For Simple Generation (no history):
   from utils.llm import gemini_generate_content
   
   response = gemini_generate_content(
       prompt="Generate a quiz question about biology",
       system_instruction="You are an exam creator",
       temperature=0.3
   )

4. Check Provider Availability:
   from utils.llm import get_provider_info
   
   info = get_provider_info()
   print(info)
"""

