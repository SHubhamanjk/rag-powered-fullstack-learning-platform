import os
import uuid
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from graphviz import Digraph
import base64

from utils.db import get_study_sessions_collection
from utils.timezone import get_current_time
from utils.cache import cache_response, invalidate_cache
from utils.llm import gemini_chat_completion, gemini_generate_content, chat_completion_with_fallback
from prompts import (
    STUDY_SESSION_ASSISTANT_PROMPT,
    QUIZ_GENERATION_PROMPT,
    QUIZ_EVALUATION_PROMPT,
    MINDMAP_ANALYSIS_PROMPT,
    MINDMAP_GENERATION_PROMPT
)

# Initialize sentence transformer for embeddings
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ============================================================================
# RAG HELPER FUNCTIONS
# ============================================================================

def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    """Chunk text into smaller pieces for embedding"""
    if not text or not text.strip():
        return []
    
    chunks = []
    for i in range(0, len(text), chunk_size):
        chunk = text[i:i + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
    return chunks

def create_corpus_from_session(session: Dict[str, Any]) -> List[str]:
    """Create corpus from all text content in session"""
    corpus = []
    metadata = session.get("metadata", {})
    
    # Add all available text sources
    if metadata.get("resources_text"):
        corpus.extend(chunk_text(metadata["resources_text"]))
    
    if metadata.get("pyq_text"):
        corpus.extend(chunk_text(metadata["pyq_text"]))
    
    if metadata.get("syllabus_text"):
        corpus.extend(chunk_text(metadata["syllabus_text"]))
    
    if metadata.get("study_details"):
        corpus.extend(chunk_text(metadata["study_details"]))
    
    return corpus

def create_embeddings_for_corpus(corpus: List[str]) -> Optional[np.ndarray]:
    """Create embeddings for corpus text"""
    if not corpus:
        return None
    
    try:
        corpus_embeddings = embedding_model.encode(corpus, convert_to_numpy=True)
        return corpus_embeddings
    except Exception as e:
        return None

def rag_search_optimized(query: str, corpus: List[str], embeddings: np.ndarray, top_k: int = 3) -> List[str]:
    """Perform RAG search using pre-computed embeddings"""
    if not corpus or embeddings is None or len(embeddings) == 0:
        return []
    
    try:
        # Create FAISS index from stored embeddings
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(embeddings)
        
        # Only encode the query (fast!)
        query_embedding = embedding_model.encode([query], convert_to_numpy=True)
        distances, indices = index.search(np.array(query_embedding), k=min(top_k, len(corpus)))
        
        # Return relevant chunks
        results = [corpus[i] for i in indices[0] if i < len(corpus)]
        return results
    except Exception as e:
        return []

# ============================================================================
# STUDY SESSION CRUD
# ============================================================================

async def create_study_session(
    email: str,
    subject: str,
    grade: str,
    study_details: str,
    resources_text: Optional[str] = None,
    pyq_text: Optional[str] = None,
    syllabus_text: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new study session with RAG index"""
    collection = get_study_sessions_collection()
    
    # Generate session ID
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    session_name = f"{subject} - {grade}"
    
    # Create session document
    current_time = get_current_time().isoformat()
    
    session_doc = {
        "session_id": session_id,
        "session_name": session_name,
        "email": email,
        "metadata": {
            "subject": subject,
            "grade": grade,
            "study_details": study_details,
            "resources_text": resources_text,
            "pyq_text": pyq_text,
            "syllabus_text": syllabus_text
        },
        "chat_history": [],
        "quizzes": [],
        "mindmaps": [],
        "created_at": current_time,
        "updated_at": current_time
    }
    
    # Create RAG corpus and embeddings
    corpus = create_corpus_from_session(session_doc)
    if corpus:
        embeddings = create_embeddings_for_corpus(corpus)
        if embeddings is not None:
            session_doc["rag_data"] = {
                "corpus": corpus,
                "embeddings": embeddings.tolist()  # Convert numpy array to list for MongoDB
            }
        else:
            session_doc["rag_data"] = None
    else:
        session_doc["rag_data"] = None
    
    collection.insert_one(session_doc)
    
    # Invalidate cache for user's sessions list
    invalidate_cache(email)

    return {
        "session_id": session_id,
        "session_name": session_name,
        "message": "Study session created successfully"
    }

async def get_user_study_sessions(email: str) -> Dict[str, Any]:
    """Get all study sessions for a user"""
    collection = get_study_sessions_collection()
    
    # Find all sessions for user
    sessions = list(collection.find({"email": email}))
    
    # Format response
    session_list = []
    for session in sessions:
        metadata = session.get("metadata", {})
        session_list.append({
            "session_id": session["session_id"],
            "session_name": session["session_name"],
            "subject": metadata.get("subject", ""),
            "grade": metadata.get("grade", ""),
            "created_at": session["created_at"],
            "updated_at": session["updated_at"]
        })
    
    # Sort by updated_at (most recent first)
    session_list.sort(key=lambda x: x["updated_at"], reverse=True)
    
    return {
        "email": email,
        "sessions": session_list
    }

@cache_response(ttl_seconds=60)  # Cache for 1 minute
async def get_session_details(session_id: str) -> Dict[str, Any]:
    """Get complete session details including chat history"""
    collection = get_study_sessions_collection()
    
    # Find session
    session = collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Study session not found")
    
    # Format chat history
    chat_history = [
        {
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"]
        }
        for msg in session.get("chat_history", [])
    ]
    
    return {
        "session_id": session["session_id"],
        "session_name": session["session_name"],
        "email": session["email"],
        "metadata": session["metadata"],
        "chat_history": chat_history,
        "created_at": session["created_at"],
        "updated_at": session["updated_at"]
    }

async def update_study_session(
    session_id: str,
    session_name: Optional[str] = None,
    subject: Optional[str] = None,
    grade: Optional[str] = None,
    study_details: Optional[str] = None,
    resources_text: Optional[str] = None,
    pyq_text: Optional[str] = None,
    syllabus_text: Optional[str] = None
) -> Dict[str, Any]:
    """Update study session"""
    collection = get_study_sessions_collection()
    
    # Find session
    session = collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Study session not found")
    
    # Prepare update
    update_doc = {
        "updated_at": get_current_time().isoformat()
    }
    
    if session_name is not None:
        update_doc["session_name"] = session_name
    
    # Update metadata fields
    metadata_updates = {}
    if subject is not None:
        metadata_updates["metadata.subject"] = subject
    if grade is not None:
        metadata_updates["metadata.grade"] = grade
    if study_details is not None:
        metadata_updates["metadata.study_details"] = study_details
    if resources_text is not None:
        metadata_updates["metadata.resources_text"] = resources_text
    if pyq_text is not None:
        metadata_updates["metadata.pyq_text"] = pyq_text
    if syllabus_text is not None:
        metadata_updates["metadata.syllabus_text"] = syllabus_text
    
    update_doc.update(metadata_updates)
    
    # Update session
    collection.update_one(
        {"session_id": session_id},
        {"$set": update_doc}
    )
    
    # If any text content was updated, regenerate embeddings
    if any([resources_text is not None, pyq_text is not None, 
            syllabus_text is not None, study_details is not None]):
        # Get updated session
        updated_session = collection.find_one({"session_id": session_id})
        
        # Regenerate corpus and embeddings
        corpus = create_corpus_from_session(updated_session)
        if corpus:
            embeddings = create_embeddings_for_corpus(corpus)
            if embeddings is not None:
                collection.update_one(
                    {"session_id": session_id},
                    {
                        "$set": {
                            "rag_data": {
                                "corpus": corpus,
                                "embeddings": embeddings.tolist()
                            }
                        }
                    }
                )
            else:
                collection.update_one(
                    {"session_id": session_id},
                    {"$set": {"rag_data": None}}
                )
        else:
            collection.update_one(
                {"session_id": session_id},
                {"$set": {"rag_data": None}}
            )
    
    return {
        "session_id": session_id,
        "message": "Study session updated successfully"
    }

async def delete_study_session(session_id: str) -> Dict[str, Any]:
    """Delete study session"""
    collection = get_study_sessions_collection()
    
    # Delete session
    result = collection.delete_one({"session_id": session_id})
    
    if result.deleted_count == 0:
        raise ValueError("Study session not found")
    
    # Invalidate cache
    invalidate_cache(session_id)
    
    return {
        "session_id": session_id,
        "message": "Study session deleted successfully"
    }

# ============================================================================
# AI STUDY ASSISTANT WITH RAG
# ============================================================================

async def study_assistant_chat(session_id: str, question: str) -> Dict[str, Any]:
    """AI study assistant with RAG and contextual chat"""
    collection = get_study_sessions_collection()
    
    # Get session
    session = collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Study session not found")
    
    # Get chat history (last 40 messages = 20 exchanges)
    chat_history = session.get("chat_history", [])
    recent_chat = chat_history[-40:] if len(chat_history) > 40 else chat_history
    
    # Get pre-computed RAG data
    rag_data = session.get("rag_data")
    relevant_chunks = []
    
    if rag_data and rag_data.get("corpus") and rag_data.get("embeddings"):
        corpus = rag_data["corpus"]
        embeddings = np.array(rag_data["embeddings"])  # Convert back from list to numpy array
        
        # Perform optimized RAG search using pre-computed embeddings
        relevant_chunks = rag_search_optimized(question, corpus, embeddings, top_k=3)
    else:
        pass  # No RAG data available for this session
    
    # Build context from RAG results
    rag_context = ""
    if relevant_chunks:
        rag_context = "\n\nRELEVANT STUDY MATERIALS:\n" + "\n\n".join([
            f"[Excerpt {i+1}]: {chunk}" 
            for i, chunk in enumerate(relevant_chunks)
        ])
    
    # Build metadata context
    metadata = session.get("metadata", {})
    metadata_context = f"""
STUDY SESSION INFORMATION:
- Subject: {metadata.get('subject', 'N/A')}
- Grade: {metadata.get('grade', 'N/A')}
- Topic: {metadata.get('study_details', 'N/A')}
"""
    
    # Build full system prompt
    full_system_prompt = STUDY_SESSION_ASSISTANT_PROMPT + "\n\n" + metadata_context
    if rag_context:
        full_system_prompt += rag_context
    
    # Build messages for LLM
    messages = [
        {"role": "system", "content": full_system_prompt}
    ]
    
    # Add chat history
    for msg in recent_chat:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Add current question
    messages.append({
        "role": "user",
        "content": question
    })
    
    # Call LLM with automatic fallback (Gemini -> Groq)
    # Extract system instruction from first message
    system_instruction = None
    user_messages = messages
    if messages and messages[0]["role"] == "system":
        system_instruction = messages[0]["content"]
        user_messages = messages[1:]
    
    try:
        ai_response, provider_used = chat_completion_with_fallback(
            messages=user_messages,
            system_instruction=system_instruction,
            temperature=0.7,
            max_tokens=1500,
            prefer_gemini=True  # Try Gemini first
        )
        print(f"[Study Session] Response generated using: {provider_used}")
        
    except Exception as e:
        # Log error and provide fallback response
        print(f"[Study Session] All providers failed: {str(e)}")
        ai_response = "I'm temporarily unable to respond. Please try again in a moment."
    
    # Update chat history
    current_time = get_current_time().isoformat()
    
    new_messages = [
        {
            "role": "user",
            "content": question,
            "timestamp": current_time
        },
        {
            "role": "assistant",
            "content": ai_response,
            "timestamp": current_time
        }
    ]
    
    collection.update_one(
        {"session_id": session_id},
        {
            "$push": {
                "chat_history": {
                    "$each": new_messages
                }
            },
            "$set": {
                "updated_at": current_time
            }
        }
    )
    
    return {
        "session_id": session_id,
        "response": ai_response
    }

# ============================================================================
# QUIZ GENERATION IN SESSION
# ============================================================================

async def generate_session_quiz(session_id: str) -> Dict[str, Any]:
    """Generate quiz based on session chat history, syllabus, and PYQs"""
    collection = get_study_sessions_collection()
    
    # Get session
    session = collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Study session not found")
    
    metadata = session.get("metadata", {})
    chat_history = session.get("chat_history", [])
    
    # Build context for quiz generation
    subject = metadata.get("subject") or ""
    topic = metadata.get("study_details") or ""
    syllabus = metadata.get("syllabus_text") or ""
    pyq = metadata.get("pyq_text") or ""
    
    # Extract key topics from chat history
    recent_topics = []
    for msg in chat_history[-40:]:  # Last 10 exchanges
        if msg["role"] == "user":
            recent_topics.append(msg["content"][:100])  # First 100 chars
    
    topics_discussed = " | ".join(recent_topics) if recent_topics else "General topics"
    
    # Build prompt
    quiz_prompt = f"""
SUBJECT: {subject}
MAIN TOPIC: {topic}

TOPICS DISCUSSED IN STUDY SESSION:
{topics_discussed}

SYLLABUS CONTEXT:
{syllabus[:2000] if syllabus else "No specific syllabus provided"}

PREVIOUS YEAR QUESTIONS PATTERN:
{pyq[:2000] if pyq else "No PYQ patterns provided"}

Generate a comprehensive quiz covering the topics studied in this session.
Focus on the concepts discussed and align with the syllabus and PYQ patterns.
"""
    
    # Call Gemini via centralized LLM utility
    quiz_json = gemini_generate_content(
        prompt=quiz_prompt,
        system_instruction=QUIZ_GENERATION_PROMPT,
        temperature=0.3,
        max_tokens=4000
    )
    
    # quiz_json already contains the response from gemini_generate_content
    
    try:
        if "```json" in quiz_json:
            quiz_json = quiz_json.split("```json")[1].split("```")[0].strip()
        elif "```" in quiz_json:
            quiz_json = quiz_json.split("```")[1].split("```")[0].strip()
        
        quiz_data = json.loads(quiz_json)
    except json.JSONDecodeError as e:
        raise ValueError("Failed to parse quiz JSON")
    
    # Generate quiz ID
    quiz_id = f"quiz_{uuid.uuid4().hex[:12]}"
    current_time = get_current_time().isoformat()
    
    # Format quiz and ensure question IDs
    mcq_questions = []
    for idx, mcq in enumerate(quiz_data.get("mcq_questions", [])[:20], 1):
        if "question_id" not in mcq or not mcq["question_id"]:
            mcq["question_id"] = f"mcq_{idx}"
        mcq_questions.append(mcq)
    
    descriptive_questions = []
    for idx, desc in enumerate(quiz_data.get("descriptive_questions", [])[:5], 1):
        if "question_id" not in desc or not desc["question_id"]:
            desc["question_id"] = f"desc_{idx}"
        descriptive_questions.append(desc)
    
    quiz_entry = {
        "quiz_id": quiz_id,
        "mcq_questions": mcq_questions,
        "descriptive_questions": descriptive_questions,
        "created_at": current_time,
        "is_evaluated": False,
        "evaluation_report": None
    }
    
    # Store in session
    collection.update_one(
        {"session_id": session_id},
        {
            "$push": {"quizzes": quiz_entry},
            "$set": {"updated_at": current_time}
        }
    )
    
    # Remove correct answers from response (they shouldn't see these before submission)
    mcq_for_display = []
    for mcq in quiz_entry["mcq_questions"]:
        mcq_for_display.append({
            "question_id": mcq["question_id"],
            "question": mcq["question"],
            "options": mcq["options"]
            # Don't include correct_answer_index
        })
    
    desc_for_display = []
    for desc in quiz_entry["descriptive_questions"]:
        desc_for_display.append({
            "question_id": desc["question_id"],
            "question": desc["question"]
            # Don't include expected_answer
        })
    
    return {
        "session_id": session_id,
        "quiz_id": quiz_id,
        "mcq_questions": mcq_for_display,
        "descriptive_questions": desc_for_display,
        "message": "Quiz generated successfully"
    }

# ============================================================================
# MINDMAP GENERATION IN SESSION
# ============================================================================

def render_mindmap_image(mindmap: Dict[str, Any]) -> str:
    """Render mindmap to base64 PNG image"""
    dot = Digraph("mindmap", format="png")
    dot.attr(rankdir="TB", splines="spline", nodesep="0.4", ranksep="0.6")
    dot.attr("node", shape="box", style="rounded,filled", color="#4f46e5", fillcolor="#eef2ff", fontname="Helvetica", fontsize="10")
    dot.attr("edge", color="#64748b")

    def _label(title: str, desc: str) -> str:
        def wrap(txt: str, width: int) -> str:
            words, line, out = txt.split(), [], []
            for w in words:
                if sum(len(x) for x in line) + len(line) + len(w) <= width:
                    line.append(w)
                else:
                    out.append(" ".join(line))
                    line = [w]
            if line:
                out.append(" ".join(line))
            return out or [txt]
        desc_lines = wrap(desc, 50)[:6]
        desc_text = "\\n".join(desc_lines)
        title = title.strip() or "Untitled"
        return f"{title}\\n{desc_text}" if desc_text else title

    def _add(node: Dict[str, Any]) -> str:
        if not node or not isinstance(node, dict):
            return str(uuid.uuid4())
        
        nid = str(uuid.uuid4())
        dot.node(nid, _label(node.get("title", ""), node.get("description", "")))
        children = node.get("children", [])
        if children and isinstance(children, list):
            for child in children:
                if child:  # Only process non-None children
                    cid = _add(child)
                    dot.edge(nid, cid)
        return nid

    if not mindmap or not isinstance(mindmap, dict):
        raise ValueError("Invalid mindmap structure: must be a dictionary")
    
    _add(mindmap)
    png_bytes = dot.pipe(format="png")
    b64 = base64.b64encode(png_bytes).decode("utf-8")
    return f"data:image/png;base64,{b64}"

async def generate_session_mindmaps(session_id: str) -> Dict[str, Any]:
    """Generate mindmaps from session chat history and study materials"""
    collection = get_study_sessions_collection()
    
    # Get session
    session = collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Study session not found")
    
    metadata = session.get("metadata", {})
    chat_history = session.get("chat_history", [])
    
    # Build content for mindmap analysis (handle None values)
    subject = metadata.get("subject") or ""
    topic = metadata.get("study_details") or ""
    syllabus_text = metadata.get("syllabus_text")
    syllabus = (syllabus_text or "")[:1000]
    
    # Extract chat summary
    chat_summary = []
    for msg in chat_history[-20:]:
        if msg["role"] == "user":
            chat_summary.append(f"Q: {msg['content'][:80]}")
        elif msg["role"] == "assistant":
            chat_summary.append(f"A: {msg['content'][:80]}")
    
    chat_context = "\n".join(chat_summary) if chat_summary else "No chat history"
    
    # Step 1: Analyze and determine mindmaps
    analysis_prompt = f"""
SUBJECT: {subject}
TOPIC: {topic}

SYLLABUS OVERVIEW:
{syllabus if syllabus else "General study"}

STUDY SESSION DISCUSSION:
{chat_context[:1500]}

Analyze the study session and determine the optimal number of mindmaps (1-3) to visualize the concepts covered.
"""
    
    # Call Gemini via centralized LLM utility
    analysis_json = gemini_generate_content(
        prompt=analysis_prompt,
        system_instruction=MINDMAP_ANALYSIS_PROMPT,
        temperature=0.3,
        max_tokens=2000
    )
    
    # analysis_json already contains the response from gemini_generate_content
    if not analysis_json or not analysis_json.strip():
        raise ValueError("Empty response from mindmap analysis")
    
    try:
        if "```json" in analysis_json:
            analysis_json = analysis_json.split("```json")[1].split("```")[0].strip()
        elif "```" in analysis_json:
            analysis_json = analysis_json.split("```")[1].split("```")[0].strip()
        
        analysis_data = json.loads(analysis_json)
    except json.JSONDecodeError as e:
        raise ValueError("Failed to parse mindmap analysis")
    
    # Step 2: Generate each mindmap
    mindmaps = []
    
    # Safely extract mindmap topics with multiple fallbacks
    mindmap_topics = []
    if analysis_data and isinstance(analysis_data, dict):
        mindmap_topics = analysis_data.get("mindmaps") or analysis_data.get("topics") or analysis_data.get("concepts") or []
    
    if not isinstance(mindmap_topics, list):
        mindmap_topics = []
    
    # If no topics found, create a default one based on the subject
    if not mindmap_topics:
        mindmap_topics = [{
            "title": f"{subject} - Key Concepts",
            "description": f"Overview of main topics in {subject}",
            "focus_area": topic or "general concepts"
        }]
    
    mindmap_topics = mindmap_topics[:3]  # Max 3
    
    for idx, topic_data in enumerate(mindmap_topics, 1):
        # Safely extract topic information
        if not isinstance(topic_data, dict):
            topic_data = {"title": f"Concept {idx}", "description": "", "focus_area": ""}
        
        topic_title = topic_data.get("title") or f"Concept {idx}"
        topic_desc = topic_data.get("description") or ""
        focus_area = topic_data.get("focus_area") or topic or ""
        
        generation_prompt = f"""
MAIN TOPIC: {topic_title}
DESCRIPTION: {topic_desc}
FOCUS: {focus_area}

CONTEXT:
{chat_context[:1000]}

Create a detailed mindmap structure for this topic.
"""
        
        # Call Gemini via centralized LLM utility
        try:
            mindmap_json = gemini_generate_content(
                prompt=generation_prompt,
                system_instruction=MINDMAP_GENERATION_PROMPT,
                temperature=0.3,
                max_tokens=3000
            )
            if not mindmap_json or not mindmap_json.strip():
                continue
            mindmap_json = mindmap_json.strip()
        except Exception as e:
            continue
        
        try:
            if "```json" in mindmap_json:
                mindmap_json = mindmap_json.split("```json")[1].split("```")[0].strip()
            elif "```" in mindmap_json:
                mindmap_json = mindmap_json.split("```")[1].split("```")[0].strip()
            
            mindmap_structure = json.loads(mindmap_json)
            
            # Validate structure has required fields
            if not isinstance(mindmap_structure, dict):
                continue
                
        except (json.JSONDecodeError, IndexError, AttributeError) as e:
            continue
        
        # Render mindmap
        try:
            image_b64 = render_mindmap_image(mindmap_structure)
        except Exception as e:
            continue
        
        mindmap_id = f"mindmap_{uuid.uuid4().hex[:12]}"
        current_time = get_current_time().isoformat()
        
        mindmap_entry = {
            "mindmap_id": mindmap_id,
            "title": topic_title,
            "description": topic_desc,
            "image_b64": image_b64,
            "structure": mindmap_structure,
            "created_at": current_time
        }
        
        mindmaps.append(mindmap_entry)
    
    if not mindmaps:
        raise ValueError("Failed to generate mindmaps")
    
    # Store in session
    collection.update_one(
        {"session_id": session_id},
        {
            "$push": {
                "mindmaps": {
                    "$each": mindmaps
                }
            },
            "$set": {
                "updated_at": get_current_time().isoformat()
            }
        }
    )
    
    # Format response
    formatted_mindmaps = [
        {
            "mindmap_id": m["mindmap_id"],
            "title": m["title"],
            "description": m["description"],
            "image_b64": m["image_b64"],
            "created_at": m["created_at"]
        }
        for m in mindmaps
    ]
    
    return {
        "session_id": session_id,
        "mindmaps": formatted_mindmaps,
        "message": f"Generated {len(mindmaps)} mindmap(s) successfully"
    }

# ============================================================================
# QUIZ EVALUATION IN SESSION
# ============================================================================

async def evaluate_session_quiz(quiz_id: str, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Evaluate quiz answers for a study session quiz"""
    collection = get_study_sessions_collection()
    
    # Find the session containing this quiz
    session = collection.find_one({"quizzes.quiz_id": quiz_id})
    if not session:
        raise ValueError("Quiz not found")
    
    # Get the specific quiz
    quiz = next((q for q in session.get("quizzes", []) if q["quiz_id"] == quiz_id), None)
    if not quiz:
        raise ValueError("Quiz not found")
    
    # Convert answers list to dict for easy lookup
    answers_dict = {ans["question_id"]: ans["answer"] for ans in answers}
    
    # Evaluate MCQs
    mcq_results = []
    mcq_correct = 0
    mcq_total = len(quiz["mcq_questions"])
    
    for idx, mcq in enumerate(quiz["mcq_questions"], 1):
        # Handle old quizzes without question_id
        question_id = mcq.get("question_id", f"mcq_{idx}")
        user_answer = answers_dict.get(question_id)
        is_correct = user_answer == mcq["correct_answer_index"]
        if is_correct:
            mcq_correct += 1
        
        mcq_results.append({
            "question_id": question_id,
            "question": mcq["question"],
            "user_answer": user_answer if user_answer is not None else -1,
            "correct_answer": mcq["correct_answer_index"],
            "is_correct": is_correct,
            "score": 1.0 if is_correct else 0.0,
            "max_score": 1.0,
            "feedback": None
        })
    
    # Evaluate descriptive questions using LLM
    descriptive_evaluations = []
    for idx, desc in enumerate(quiz["descriptive_questions"], 1):
        # Handle old quizzes without question_id
        question_id = desc.get("question_id", f"desc_{idx}")
        user_answer = answers_dict.get(question_id, "")
        
        descriptive_evaluations.append({
            "question_id": question_id,
            "question": desc["question"],
            "user_answer": user_answer,
            "expected_answer": desc["expected_answer"]
        })
    
    # Call LLM for descriptive evaluation
    llm_eval_prompt = f"""
Evaluate the following descriptive answers:

{json.dumps(descriptive_evaluations, indent=2)}

Provide scores and feedback for each question, plus overall analysis.
"""
    
    # Call Gemini via centralized LLM utility
    eval_json = gemini_generate_content(
        prompt=llm_eval_prompt,
        system_instruction=QUIZ_EVALUATION_PROMPT,
        temperature=0.3,
        max_tokens=3000
    )
    
    try:
        if "```json" in eval_json:
            eval_json = eval_json.split("```json")[1].split("```")[0].strip()
        elif "```" in eval_json:
            eval_json = eval_json.split("```")[1].split("```")[0].strip()
        
        eval_data = json.loads(eval_json)
    except json.JSONDecodeError:
        start = eval_json.find("{")
        end = eval_json.rfind("}") + 1
        if start != -1 and end > start:
            eval_data = json.loads(eval_json[start:end])
        else:
            raise ValueError("Failed to parse evaluation JSON")
    
    # Build descriptive results
    descriptive_results = []
    descriptive_total_score = 0
    descriptive_max_score = len(quiz["descriptive_questions"]) * 10.0
    
    for idx, desc in enumerate(quiz["descriptive_questions"], 1):
        # Handle old quizzes without question_id
        question_id = desc.get("question_id", f"desc_{idx}")
        eval_item = next(
            (e for e in eval_data.get("question_evaluations", []) 
             if e.get("question_id") == question_id),
            None
        )
        
        if eval_item:
            score = float(eval_item.get("score", 0))
            feedback = eval_item.get("feedback", "")
        else:
            score = 0.0
            feedback = "No evaluation available"
        
        descriptive_total_score += score
        
        descriptive_results.append({
            "question_id": question_id,
            "question": desc["question"],
            "user_answer": answers_dict.get(question_id, ""),
            "correct_answer": desc["expected_answer"],
            "is_correct": score >= 7.0,  # 70% threshold
            "score": score,
            "max_score": 10.0,
            "feedback": feedback
        })
    
    # Combine all results
    all_results = mcq_results + descriptive_results
    total_score = mcq_correct + descriptive_total_score
    max_score = mcq_total + descriptive_max_score
    percentage = (total_score / max_score * 100) if max_score > 0 else 0
    
    # Extract overall feedback
    overall_feedback = eval_data.get("overall_feedback", "Great effort! Keep practicing to improve further.")
    strengths = eval_data.get("strengths", [])
    areas_for_improvement = eval_data.get("areas_for_improvement", [])
    study_suggestions = eval_data.get("study_suggestions", [])
    
    # Store evaluation in quiz
    current_time = get_current_time().isoformat()
    collection.update_one(
        {"session_id": session["session_id"], "quizzes.quiz_id": quiz_id},
        {
            "$set": {
                "quizzes.$.is_evaluated": True,
                "quizzes.$.evaluation_report": {
                    "total_score": total_score,
                    "max_score": max_score,
                    "percentage": percentage,
                    "results": all_results,
                    "overall_feedback": overall_feedback,
                    "strengths": strengths,
                    "areas_for_improvement": areas_for_improvement,
                    "study_suggestions": study_suggestions,
                    "evaluated_at": current_time
                },
                "updated_at": current_time
            }
        }
    )
    
    return {
        "quiz_id": quiz_id,
        "session_id": session["session_id"],
        "total_questions": mcq_total + len(quiz["descriptive_questions"]),
        "correct_answers": mcq_correct + sum(1 for r in descriptive_results if r["is_correct"]),
        "total_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "results": all_results,
        "overall_feedback": overall_feedback,
        "strengths": strengths,
        "areas_for_improvement": areas_for_improvement,
        "study_suggestions": study_suggestions
    }

# ============================================================================
# GET QUIZZES FOR SESSION
# ============================================================================

@cache_response(ttl_seconds=300)  # Cache for 5 minutes
async def get_session_quizzes(session_id: str) -> Dict[str, Any]:
    """Get all quizzes for a study session"""
    collection = get_study_sessions_collection()
    
    # Find session
    session = collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Study session not found")
    
    # Format quiz summaries
    quiz_summaries = []
    for quiz in session.get("quizzes", []):
        mcq_count = len(quiz.get("mcq_questions", []))
        desc_count = len(quiz.get("descriptive_questions", []))
        
        summary = {
            "quiz_id": quiz["quiz_id"],
            "created_at": quiz["created_at"],
            "is_evaluated": quiz.get("is_evaluated", False),
            "total_questions": mcq_count + desc_count
        }
        
        # Add evaluation scores if available
        if quiz.get("evaluation_report"):
            eval_report = quiz["evaluation_report"]
            summary["score"] = eval_report.get("total_score")
            summary["percentage"] = eval_report.get("percentage")
        
        quiz_summaries.append(summary)
    
    # Sort by created_at (most recent first)
    quiz_summaries.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "session_id": session_id,
        "quizzes": quiz_summaries
    }

async def get_quiz_details(quiz_id: str) -> Dict[str, Any]:
    """Get quiz details including evaluation results if available"""
    collection = get_study_sessions_collection()
    
    # Find the session containing this quiz
    session = collection.find_one({"quizzes.quiz_id": quiz_id})
    if not session:
        raise ValueError("Quiz not found")
    
    # Get the specific quiz
    quiz = next((q for q in session.get("quizzes", []) if q["quiz_id"] == quiz_id), None)
    if not quiz:
        raise ValueError("Quiz not found")
    
    # Remove correct answers from response if not yet evaluated
    if not quiz.get("is_evaluated", False):
        mcq_for_display = []
        for idx, mcq in enumerate(quiz["mcq_questions"], 1):
            # Handle old quizzes without question_id
            question_id = mcq.get("question_id", f"mcq_{idx}")
            mcq_for_display.append({
                "question_id": question_id,
                "question": mcq["question"],
                "options": mcq.get("options", [])
            })
        
        desc_for_display = []
        for idx, desc in enumerate(quiz["descriptive_questions"], 1):
            # Handle old quizzes without question_id
            question_id = desc.get("question_id", f"desc_{idx}")
            desc_for_display.append({
                "question_id": question_id,
                "question": desc["question"]
            })
        
        return {
            "quiz_id": quiz["quiz_id"],
            "session_id": session["session_id"],
            "mcq_questions": mcq_for_display,
            "descriptive_questions": desc_for_display,
            "created_at": quiz["created_at"],
            "is_evaluated": False,
            "evaluation_report": None
        }
    else:
        # If evaluated, include all details including correct answers for review
        return {
            "quiz_id": quiz["quiz_id"],
            "session_id": session["session_id"],
            "mcq_questions": quiz["mcq_questions"],
            "descriptive_questions": quiz["descriptive_questions"],
            "created_at": quiz["created_at"],
            "is_evaluated": True,
            "evaluation_report": quiz.get("evaluation_report")
        }

@cache_response(ttl_seconds=300)  # Cache for 5 minutes
async def get_session_mindmaps(session_id: str) -> Dict[str, Any]:
    """Get all mindmaps for a study session"""
    collection = get_study_sessions_collection()
    
    # Find session
    session = collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Study session not found")
    
    # Format mindmap list
    mindmaps = session.get("mindmaps", [])
    
    formatted_mindmaps = [
        {
            "mindmap_id": m["mindmap_id"],
            "title": m["title"],
            "description": m["description"],
            "image_b64": m["image_b64"],
            "created_at": m["created_at"]
        }
        for m in mindmaps
    ]
    
    # Sort by created_at (most recent first)
    formatted_mindmaps.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "session_id": session_id,
        "mindmaps": formatted_mindmaps
    }

