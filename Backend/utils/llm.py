"""
Centralized LLM (Large Language Model) client management
Supports multiple providers with separate, clean implementations
Each provider has its own dedicated functions
"""

import os
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types

load_dotenv()

# ============================================================================
# CLIENT INITIALIZATION
# ============================================================================

# Groq Client - Used for general chat, friend chat, todo assistant, utility functions
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
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

# Timeout configuration
GROQ_TIMEOUT = 120  # seconds

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
# GEMINI FUNCTIONS - Using Official Gemini SDK
# ============================================================================

def gemini_generate_content(
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    thinking_budget: Optional[int] = None
) -> str:
    """
    Generate content using Gemini API (for simple prompts without chat history)
    Uses the official Gemini SDK client.models.generate_content method
    
    Args:
        prompt: The user prompt/question
        system_instruction: Optional system instruction for behavior
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens to generate
        thinking_budget: Optional thinking budget (0 to disable thinking for Gemini 2.5+)
    
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
    
    # Add thinking config if specified (for Gemini 2.5+ models)
    if thinking_budget is not None:
        config_params["thinking_config"] = types.ThinkingConfig(thinking_budget=thinking_budget)
    
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
            print("[Gemini] Invalid response structure")
            raise ValueError("Unable to generate response")
        
        response_text = response.text
        
        # Check if response is None or empty
        if response_text is None or not response_text.strip():
            print("[Gemini] Empty response")
            raise ValueError("Unable to generate response")
        
        return response_text
        
    except Exception as e:
        # Re-raise with more context (for internal logging)
        error_msg = str(e)
        if "content" in error_msg.lower() and "filter" in error_msg.lower():
            # Log internally but don't expose details
            print(f"[Gemini] Content filtering triggered: {error_msg}")
            raise ValueError("Unable to process request")
        print(f"[Gemini] Generate error: {error_msg}")
        raise

def gemini_chat_completion(
    messages: List[Dict[str, str]],
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    thinking_budget: Optional[int] = None
) -> str:
    """
    Generate chat completion using Gemini API (for multi-turn conversations)
    Uses the official Gemini SDK client.models.generate_content method
    
    Args:
        messages: List of message dicts with 'role' ('user' or 'assistant') and 'content'
        system_instruction: Optional system instruction for behavior
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens to generate
        thinking_budget: Optional thinking budget (0 to disable thinking for Gemini 2.5+)
    
    Returns:
        Generated text response
    
    Raises:
        ValueError: If response is empty or invalid
        Exception: For other API errors
    """
    client = get_gemini_client()
    
    # Build configuration
    config_params = {"temperature": temperature}
    if max_tokens:
        config_params["max_output_tokens"] = max_tokens
    if system_instruction:
        config_params["system_instruction"] = system_instruction
    
    # Add thinking config if specified (for Gemini 2.5+ models)
    if thinking_budget is not None:
        config_params["thinking_config"] = types.ThinkingConfig(thinking_budget=thinking_budget)
    
    config = types.GenerateContentConfig(**config_params)
    
    # Convert messages to Gemini format (Content objects with parts)
    gemini_contents = []
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
        
        # Build Content object with parts
        gemini_contents.append({
            "role": role,
            "parts": [{"text": content}]
        })
    
    if not gemini_contents:
        raise ValueError("No valid messages provided")
    
    # Call Gemini API
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=gemini_contents,
            config=config
        )
        
        # Check if response is valid
        if not response or not hasattr(response, 'text'):
            print("[Gemini] Invalid response structure")
            raise ValueError("Invalid response from Gemini")
        
        response_text = response.text
        
        # Log finish reason for diagnostics
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            finish_reason = candidate.finish_reason if hasattr(candidate, 'finish_reason') else 'unknown'
            print(f"[Gemini Chat] Finish reason: {finish_reason}")
            
            # Warn if response was truncated
            if finish_reason in ['MAX_TOKENS', 'LENGTH']:
                print("[Gemini Chat] WARNING: Response truncated due to token limit!")
        
        if not response_text or not response_text.strip():
            # Log candidates to see what happened
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'safety_ratings'):
                    print(f"[Gemini Chat] Safety ratings: {candidate.safety_ratings}")
            raise ValueError("Empty response from Gemini")
        
        return response_text
        
    except Exception as e:
        error_msg = str(e)
        print(f"[Gemini Chat] Error: {error_msg}")
        raise

# ============================================================================
# ORCHESTRATION FUNCTIONS WITH FALLBACK
# ============================================================================

def chat_completion_with_fallback(
    messages: List[Dict[str, str]],
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    prefer_gemini: bool = True
) -> Tuple[str, str]:
    """
    Orchestrates chat completion with automatic fallback between providers
    This function calls separate provider functions and handles fallback logic
    
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
    
    # Debug logging
    print(f"[Fallback] Processing {len(messages)} messages (prefer: {providers[0]})")
    if messages:
        last_msg = messages[-1]
        preview = last_msg.get('content', '')[:100]
        print(f"[Fallback] Last message: {preview}...")
    
    for provider in providers:
        try:
            if provider == "gemini":
                print("[Fallback] Calling Gemini...")
                response = gemini_chat_completion(
                    messages=messages,
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                print(f"[Fallback] Gemini succeeded ({len(response)} chars)")
                return (response, "gemini")
                
            else:  # groq
                print("[Fallback] Calling Groq...")
                # For Groq, add system instruction as first message if provided
                groq_messages = []
                if system_instruction:
                    groq_messages.append({"role": "system", "content": system_instruction})
                groq_messages.extend(messages)
                
                response = groq_chat_completion(
                    messages=groq_messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                print(f"[Fallback] Groq succeeded ({len(response)} chars)")
                return (response, "groq")
                
        except Exception as e:
            last_error = e
            error_preview = str(e)[:150]
            print(f"[Fallback] {provider.capitalize()} failed: {error_preview}")
            continue
    
    # If we get here, all providers failed
    print(f"[Fallback] All providers failed. Last error: {str(last_error)}")
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

RECOMMENDED: Use separate provider functions directly for better control

1. For General Chat, Friend Chat, Todo Assistant (GROQ - Fast):
   from utils.llm import groq_chat_completion
   
   messages = [
       {"role": "system", "content": "You are a helpful assistant"},
       {"role": "user", "content": "Hello!"}
   ]
   response = groq_chat_completion(
       messages=messages,
       temperature=0.7,
       max_tokens=2000
   )

2. For Study Sessions, Tutorial Support (GEMINI - Powerful):
   from utils.llm import gemini_chat_completion
   
   messages = [
       {"role": "user", "content": "Explain quantum physics"},
       {"role": "assistant", "content": "Quantum physics is..."},
       {"role": "user", "content": "Can you explain more?"}
   ]
   response = gemini_chat_completion(
       messages=messages,
       system_instruction="You are a patient tutor",
       temperature=0.7,
       max_tokens=4000
   )

3. For Simple Generation (no chat history):
   from utils.llm import gemini_generate_content
   
   response = gemini_generate_content(
       prompt="Generate a quiz question about biology",
       system_instruction="You are an exam creator",
       temperature=0.3,
       thinking_budget=0  # Disable thinking for faster responses
   )

4. For Fallback Support (tries one provider, falls back to another):
   from utils.llm import chat_completion_with_fallback
   
   response, provider = chat_completion_with_fallback(
       messages=messages,
       system_instruction="You are a helpful assistant",
       temperature=0.7,
       prefer_gemini=False  # Try Groq first, fallback to Gemini
   )
   print(f"Response from: {provider}")

5. Check Provider Availability:
   from utils.llm import get_provider_info
   
   info = get_provider_info()
   print(info)

ARCHITECTURE:
- Each provider (Groq, Gemini) has separate, independent functions
- Fallback function is an orchestrator that calls provider functions
- Use provider functions directly when you don't need fallback
- Use fallback function when you need automatic failover
"""

