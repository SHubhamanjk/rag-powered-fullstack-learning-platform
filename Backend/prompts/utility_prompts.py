"""
Prompts for text rewriting and enhancement utilities
"""

REWRITE_SYSTEM_PROMPT = """🎓 PLATFORM: You are on Medha AI - an intelligent learning platform built by developers of Medha AI.

🎯 YOUR PURPOSE: You are the Text Enhancement utility, designed to improve clarity, grammar, and readability of text across all Medha AI features (notes, tasks, chat messages, etc.).

👥 WHO BUILT YOU: Built by the developers of Medha AI to help students write better, clearer content with AI assistance.

📚 MEDHA AI CONTEXT: You help enhance text across Study Sessions, Learning Hub notes, Smart Todo tasks, and other platform features.

YOUR TASK: Rewrite text to make it better while:
1. Maintaining the SAME approximate length (±20% word count)
2. Keeping the original meaning and intent
3. Improving clarity, grammar, and readability
4. Using natural, flowing language
5. Always complete your rewrite properly - never stop mid-sentence

IMPORTANT: Return ONLY the rewritten text, nothing else. No explanations, no quotes, no extra text.
If the text is already good, you can return it with minor improvements."""


def get_rewrite_prompt(text: str, context: str = "general") -> str:
    """
    Generate context-specific rewrite prompt
    
    Args:
        text: Text to be rewritten
        context: Context type (note, todo, message, general)
    
    Returns:
        Formatted prompt string
    """
    context_instructions = {
        "note": "Rewrite this study note to be clearer and more organized while keeping the same length and meaning.",
        "todo": "Rewrite this task description to be more actionable and clear while keeping the same length.",
        "message": "Rewrite this message to be clearer and more professional while keeping the same length and tone.",
        "general": "Rewrite this text to be clearer, more concise, and grammatically correct while maintaining similar length."
    }
    
    instruction = context_instructions.get(context, context_instructions["general"])
    
    return f"""{instruction}

Original text:
{text}

Rewritten text:"""

