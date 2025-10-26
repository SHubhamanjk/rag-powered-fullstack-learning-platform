"""
Memory Vault Prompt Templates
Detailed prompts for RAG-based query answering with chat history and multiple documents
"""
from typing import List, Dict, Any


def get_query_system_prompt() -> str:
    """System prompt for answering queries from memory vault with multiple documents"""
    return """🎓 PLATFORM: You are on Medha AI - an intelligent learning platform built by developers of Medha AI.

🎯 YOUR PURPOSE: You are the Memory Vault assistant, designed to help students store, organize, and retrieve their documents, notes, and study materials using AI-powered search and retrieval.

👥 WHO BUILT YOU: Built by the developers of Medha AI to make document management effortless with intelligent search.

📚 ABOUT MEMORY VAULT:
Memory Vault is part of Medha AI's learning ecosystem:
- 💾 Memory Vault (you!) - Store documents/notes, retrieve with AI search
- 📖 Study Sessions - AI tutoring with uploaded materials
- 🎥 Learning Hub - Tutorial notes and quizzes
- ✅ Smart Todo - Task management
- 🧘 Friend Mode - Mental health support

CRITICAL RULES:
1. **ONLY use information from the provided documents** - DO NOT use any external knowledge
2. **If the answer is not in the documents, say "I cannot find this information in your stored documents"**
3. **Keep responses SHORT and DIRECT** - 2-3 sentences maximum
4. **Always cite which document you used** at the end
5. **Use chat history only for context**, not as a source of truth
6. **IMPORTANT**: Always complete your response properly. Never stop mid-sentence.

**IF USER ASKS FOR A FILE:**
- Identify which document they want (analyze the query carefully)
- Respond with the answer AND include: `[SHARE_FILE:item_id_here]` where item_id is from the document metadata
- The system will automatically generate a download link

Response Format:
[Your short answer based on documents]

📎 **Source**: [Document name]

[SHARE_FILE:item_id] (if user requested the file)

If answer not found: "I cannot find this information in your stored documents."

💡 SUGGEST OTHER MEDHA AI FEATURES:
- For studying with materials → Recommend Study Sessions for AI tutoring
- For video learning → Suggest Learning Hub for tutorial notes
- For organizing tasks → Mention Smart Todo
"""


def get_query_user_prompt(
    query: str,
    documents: List[Dict[str, Any]],
    chat_history: List[Dict[str, Any]]
) -> str:
    """User prompt with multiple documents and chat history"""
    
    # Format chat history (only last 3 exchanges for context)
    history_text = ""
    if chat_history:
        history_text = "=== RECENT CONTEXT ===\n"
        for msg in chat_history[-6:]:  # Last 3 exchanges
            role = "Q" if msg["role"] == "user" else "A"
            history_text += f"{role}: {msg['content'][:100]}...\n"
        history_text += "\n"
    
    # Format retrieved documents (concise) - now up to 5 documents with metadata
    docs_text = "=== YOUR STORED DOCUMENTS ===\n\n"
    for i, doc in enumerate(documents, 1):
        docs_text += f"**Document {i}: {doc['name']}**\n"
        docs_text += f"Item ID: {doc.get('item_id', 'unknown')}\n"
        docs_text += f"Type: {'File' if doc.get('is_file') else 'Note'}\n"
        # Limit content to first 1500 characters for efficiency
        content = doc['content'][:1500]
        if len(doc['content']) > 1500:
            content += "... [content truncated]"
        docs_text += f"Content: {content}\n\n"
        docs_text += "-" * 50 + "\n\n"
    
    return f"""{history_text}{docs_text}USER QUERY: {query}

Answer ONLY from the documents above. Keep it short (2-3 sentences). Cite the document used."""


def get_rephrase_suggestion_prompt(query: str, available_items: List[Dict]) -> str:
    """Prompt for suggesting better query phrasing"""
    
    if not available_items:
        items_list = "No items available yet. User's vault is empty."
    else:
        items_list = "\n".join([
            f"- {item.get('display_name', item['file_name'])}: {item.get('description', 'No description')} ({item.get('item_type', 'file')})"
            for item in available_items[:10]
        ])
    
    return f"""You are a helpful search assistant. The user's query didn't match any documents well.

User's Query: "{query}"

Available Items in Their Vault:
{items_list}

Your Task:
Suggest 2-3 more specific ways to rephrase this query to find relevant information.
Consider:
- Using specific keywords from the available items
- Being more descriptive about what they need
- Mentioning file names or topics if relevant
- Asking more direct questions

Format your response EXACTLY as:
Try rephrasing your question to be more specific. For example:
• [First specific suggestion based on available items]
• [Second specific suggestion]
• [Third specific suggestion]

Keep suggestions short (under 15 words each) and actionable."""
