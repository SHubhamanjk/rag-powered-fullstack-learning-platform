# AI Prompts Directory

This directory contains all centralized system prompts and user prompt templates used across the Medha.ai backend services.

## Directory Structure

### 📁 Prompt Files

| File | Purpose | Used By |
|------|---------|---------|
| `study_chat_prompts.py` | Teaching assistant prompts for study chat | `services/chat_service.py` |
| `friend_mode_prompts.py` | Mental health companion prompts | `services/friend_chat_service.py` |
| `todo_assistant_prompts.py` | Todo task assistant prompts | `services/todo_service.py` |
| `study_session_prompts.py` | Study session AI with RAG | `services/study_session_service.py` |
| `tutorial_support_prompts.py` | Tutorial notes, quiz, mindmap, and AI companion | `services/tutorial_support_service.py` |

### 📄 `__init__.py`

Exports all prompts for easy importing:
```python
from prompts import STUDY_CHAT_SYSTEM_PROMPT, FRIEND_CHAT_SYSTEM_PROMPT
```

## Prompt Categories

### 1. **Study Chat** (`study_chat_prompts.py`)
- **STUDY_CHAT_SYSTEM_PROMPT**: Meticulous, student-centric teaching assistant
- **Role**: Help students understand topics deeply and answer doubts
- **Tone**: Friendly, patient, motivating
- **Use Case**: AI Study Chat feature with persistent conversation history

### 2. **Friend Chat** (`friend_mode_prompts.py`)
- **FRIEND_MODE_SYSTEM_PROMPT**: Mental health professional with CBT expertise
- **Role**: Provide empathetic support and practical guidance
- **Tone**: Professional yet friendly, multilingual (Hindi/Hinglish)
- **Use Case**: Friend chat with persistent conversation history and session management

### 3. **Todo Assistant** (`todo_assistant_prompts.py`)
- **TODO_ASSISTANT_PROMPT**: Focused study assistant for task completion
- **Role**: Break down tasks with actionable steps
- **Tone**: Positive, concise, practical
- **Use Case**: AI help for todo items with contextual chat history

### 4. **Study Session** (`study_session_prompts.py`)
- **STUDY_SESSION_ASSISTANT_PROMPT**: AI tutor with RAG-powered contextual responses
- **Role**: Answer questions using study materials, syllabus, PYQ, and LLM knowledge
- **Features**: RAG integration, detailed explanations, follow-up suggestions
- **Use Case**: Study sessions with uploaded resources and FAISS-based retrieval

### 5. **Tutorial Support** (`tutorial_support_prompts.py`)
- **PRETTIFY_NOTES_PROMPT**: Format and organize raw notes without adding info
- **DETAILED_NOTES_PROMPT**: Expand notes into comprehensive study material
- **TUTORIAL_AI_COMPANION_PROMPT**: Conversational AI study companion for Q&A
- **QUIZ_GENERATION_PROMPT**: Generate challenging quiz (20 MCQs + 5 descriptive) from transcripts
- **QUIZ_EVALUATION_PROMPT**: Evaluate quiz answers with detailed feedback and scoring
- **MINDMAP_ANALYSIS_PROMPT**: Analyze notes to determine optimal mindmap count
- **MINDMAP_GENERATION_PROMPT**: Generate mindmap structure as JSON from notes
- **Use Case**: Transform tutorial notes, generate quizzes/mindmaps, provide interactive learning support

## Usage Examples

### Importing Prompts

```python
# Import specific prompts
from prompts import (
    STUDY_CHAT_SYSTEM_PROMPT,
    FRIEND_MODE_SYSTEM_PROMPT,
    TODO_ASSISTANT_PROMPT,
    STUDY_SESSION_ASSISTANT_PROMPT,
    QUIZ_GENERATION_PROMPT,
    QUIZ_EVALUATION_PROMPT,
    MINDMAP_ANALYSIS_PROMPT,
    MINDMAP_GENERATION_PROMPT
)

# Use in Groq API calls
response = client.chat.completions.create(
    model="gemma2-9b-it",
    messages=[
        {"role": "system", "content": STUDY_CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]
)
```

## Best Practices

1. **Centralization**: All prompts live here - never define prompts in service files
2. **Consistency**: Use descriptive constant names (e.g., `STUDY_CHAT_SYSTEM_PROMPT`)
3. **Documentation**: Add clear docstrings explaining each prompt's purpose
4. **Templates**: Use `.format()` for dynamic user prompts with placeholders
5. **Testing**: Test prompt changes independently before deploying
6. **Versioning**: Document major prompt changes in git commits

## Modifying Prompts

When updating prompts:
1. Edit the appropriate `.py` file in this directory
2. Test with sample inputs to verify behavior
3. Update this README if adding new prompt files
4. Restart the FastAPI server to load changes

## Notes

- All prompts are strings (multi-line or template strings)
- System prompts define AI personality and behavior
- User templates include JSON schemas and input formatting
- Import from `prompts` module, not individual files

