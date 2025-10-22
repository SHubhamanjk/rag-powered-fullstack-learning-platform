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
    """
    client = get_groq_client()
    
    kwargs = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    
    if max_tokens:
        kwargs["max_tokens"] = max_tokens
    
    if response_format:
        kwargs["response_format"] = response_format
    
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content

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
    
    # Build request
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=config
    )
    return response.text

def gemini_chat_completion(
    messages: List[Dict[str, str]],
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None
) -> str:
    """
    Generate chat completion using Gemini with conversation history
    
    Args:
        messages: List of message dicts with 'role' and 'content'
                 Roles should be 'user' or 'assistant' (will be converted to Gemini format)
        system_instruction: Optional system instruction for behavior
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens to generate
    
    Returns:
        Generated text response
    """
    client = get_gemini_client()
    
    # Extract system messages and merge them with system_instruction
    system_messages = []
    user_assistant_messages = []
    
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        
        # Skip empty messages
        if not content or not content.strip():
            continue
            
        if role == "system":
            system_messages.append(content)
        else:
            user_assistant_messages.append(msg)
    
    # Merge all system instructions
    if system_messages:
        merged_system = "\n\n".join(system_messages)
        if system_instruction:
            system_instruction = system_instruction + "\n\n" + merged_system
        else:
            system_instruction = merged_system
    
    # Convert messages to Gemini format
    # Gemini uses 'user' and 'model' roles
    gemini_messages = []
    for msg in user_assistant_messages:
        role = msg["role"]
        content = msg["content"].strip()
        
        # Skip empty content
        if not content:
            continue
        
        # Convert 'assistant' to 'model' for Gemini
        if role == "assistant":
            role = "model"
        
        gemini_messages.append({
            "role": role,
            "parts": [{"text": content}]
        })
    
    # Ensure we have at least one message
    if not gemini_messages:
        raise ValueError("No valid messages to send to Gemini")
    
    # Build configuration using GenerateContentConfig
    config_params = {
        "temperature": temperature,
    }
    
    if max_tokens:
        config_params["max_output_tokens"] = max_tokens
    
    if system_instruction:
        config_params["system_instruction"] = system_instruction
    
    config = types.GenerateContentConfig(**config_params)
    
    # Build request
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=gemini_messages,
        config=config
    )
    return response.text

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

