import os
import uuid
import requests
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from utils.db import get_tutorial_support_collection
from utils.timezone import get_current_time
from utils.cache import cache_response, invalidate_cache
from utils.llm import gemini_chat_completion, gemini_generate_content, groq_chat_completion
from prompts import (
    PRETTIFY_NOTES_PROMPT, 
    DETAILED_NOTES_PROMPT, 
    TUTORIAL_AI_COMPANION_PROMPT,
    QUIZ_GENERATION_PROMPT,
    QUIZ_EVALUATION_PROMPT,
    MINDMAP_ANALYSIS_PROMPT,
    MINDMAP_GENERATION_PROMPT,
    CONSOLIDATED_NOTES_PROMPT
)
from graphviz import Digraph
import base64

def extract_title_from_link(tutorial_link: str) -> str:
    """Extract title from YouTube link using oEmbed API"""
    if "youtube.com" in tutorial_link or "youtu.be" in tutorial_link:
        try:
            # YouTube oEmbed endpoint - no API key needed
            oembed_url = f"https://www.youtube.com/oembed?url={tutorial_link}&format=json"
            response = requests.get(oembed_url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                title = data.get('title', 'Untitled Tutorial')
                return title
            else:
                raise Exception("oEmbed request failed")
        except Exception as e:
            # Fallback to video ID
            if "v=" in tutorial_link:
                video_id = tutorial_link.split("v=")[1].split("&")[0]
                return f"Tutorial {video_id[:8]}"
            elif "youtu.be/" in tutorial_link:
                video_id = tutorial_link.split("youtu.be/")[1].split("?")[0]
                return f"Tutorial {video_id[:8]}"
    
    # Fallback for non-YouTube links
    return f"Tutorial - {tutorial_link[:50]}"

async def create_tutorial_session(email: str, tutorial_link: str, group: str = "General") -> Dict[str, Any]:
    """Create a new tutorial support session or return existing one"""
    collection = get_tutorial_support_collection()
    
    # Check if tutorial already exists for this user
    existing = collection.find_one({"email": email, "tutorial_link": tutorial_link})
    if existing:
        return {
            "tutorial_id": existing["tutorial_id"],
            "title": existing["title"],
            "message": "Tutorial session already exists! You can continue with this and access all your notes and chat history."
        }
    
    # Generate tutorial ID and fetch real title from YouTube
    tutorial_id = str(uuid.uuid4())
    title = extract_title_from_link(tutorial_link)
    current_time = get_current_time()
    
    # Create document
    doc = {
        "tutorial_id": tutorial_id,
        "email": email,
        "tutorial_link": tutorial_link,
        "title": title,
        "group": group,
        "notes": [],
        "ai_chat": [],
        "created_at": current_time.isoformat(),
        "updated_at": current_time.isoformat()
    }
    
    collection.insert_one(doc)
    
    return {
        "tutorial_id": tutorial_id,
        "title": title,
        "message": "Tutorial session created successfully"
    }

async def add_note(tutorial_id: str, email: str, note: Optional[str] = None, image: Optional[str] = None, timestamp: str = "") -> Dict[str, Any]:
    """Add a note to a tutorial. At least one of note or image must be provided."""
    collection = get_tutorial_support_collection()
    
    # Validate that at least one of note or image is provided
    if not note and not image:
        raise ValueError("At least one of 'note' or 'image' must be provided")
    
    # Find tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id, "email": email})
    if not tutorial:
        raise ValueError("Tutorial not found or access denied")
    
    # Create note
    note_id = f"note_{uuid.uuid4().hex[:12]}"
    new_note = {
        "note_id": note_id,
        "timestamp": timestamp,
        "datetime": get_current_time().isoformat()
    }
    
    # Add note text if provided
    if note:
        new_note["note"] = note
    
    # Add image if provided
    if image:
        import base64
        from services.blob.gcs_client import GCSClient
        
        if image.startswith("data:image/"):
            header, base64_data = image.split(",", 1)
            content_type = header.split(":")[1].split(";")[0]
        else:
            base64_data = image
            content_type = "image/png"
            
        try:
            image_bytes = base64.b64decode(base64_data)
            file_key = f"notes/{uuid.uuid4().hex}.png"
            gcs = GCSClient()
            if gcs.is_available():
                blob = gcs.get_bucket().blob(file_key)
                blob.upload_from_string(image_bytes, content_type=content_type)
                public_url = f"https://storage.googleapis.com/{gcs.get_bucket_name()}/{file_key}"
                new_note["image"] = public_url
            else:
                raise ValueError("GCS is unavailable")
        except Exception as e:
            raise ValueError(f"Failed to upload image: {str(e)}")
    
    # Add note to array
    collection.update_one(
        {"tutorial_id": tutorial_id},
        {
            "$push": {"notes": new_note},
            "$set": {"updated_at": get_current_time().isoformat()}
        }
    )
    
    return {
        "message": "Note added successfully",
        "note_id": note_id
    }

def parse_timestamp(timestamp: str) -> int:
    """Convert timestamp string like '10:25' to seconds for sorting"""
    try:
        parts = timestamp.split(":")
        if len(parts) == 2:
            minutes, seconds = int(parts[0]), int(parts[1])
            return minutes * 60 + seconds
        elif len(parts) == 3:
            hours, minutes, seconds = int(parts[0]), int(parts[1]), int(parts[2])
            return hours * 3600 + minutes * 60 + seconds
        return 0
    except:
        return 0

async def get_notes(tutorial_id: str) -> Dict[str, Any]:
    """Get all notes for a tutorial in chronological order"""
    collection = get_tutorial_support_collection()
    
    # Find tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    # Sort notes by timestamp
    notes = tutorial.get("notes", [])
    sorted_notes = sorted(notes, key=lambda x: parse_timestamp(x.get("timestamp", "0:00")))
    
    return {
        "tutorial_id": tutorial["tutorial_id"],
        "tutorial_link": tutorial["tutorial_link"],
        "title": tutorial["title"],
        "notes": sorted_notes
    }

async def update_note(note_id: str, updated_text: Optional[str] = None, updated_image: Optional[str] = None) -> Dict[str, Any]:
    """Update a specific note. At least one of updated_text or updated_image must be provided."""
    collection = get_tutorial_support_collection()
    
    # Validate that at least one of updated_text or updated_image is provided
    if not updated_text and not updated_image:
        raise ValueError("At least one of 'updated_text' or 'updated_image' must be provided")
    
    # Find tutorial containing this note
    tutorial = collection.find_one({"notes.note_id": note_id})
    if not tutorial:
        raise ValueError("Note not found")
    
    # Build update fields
    update_fields = {
        "updated_at": get_current_time().isoformat()
    }
    
    # Update note text if provided
    if updated_text is not None:
        update_fields["notes.$.note"] = updated_text
    
    # Update image if provided
    if updated_image is not None:
        import base64
        import uuid
        from services.blob.gcs_client import GCSClient
        
        if updated_image.startswith("data:image/"):
            header, base64_data = updated_image.split(",", 1)
            content_type = header.split(":")[1].split(";")[0]
        else:
            base64_data = updated_image
            content_type = "image/png"
            
        try:
            image_bytes = base64.b64decode(base64_data)
            file_key = f"notes/{uuid.uuid4().hex}.png"
            gcs = GCSClient()
            if gcs.is_available():
                blob = gcs.get_bucket().blob(file_key)
                blob.upload_from_string(image_bytes, content_type=content_type)
                public_url = f"https://storage.googleapis.com/{gcs.get_bucket_name()}/{file_key}"
                update_fields["notes.$.image"] = public_url
            else:
                raise ValueError("GCS is unavailable")
        except Exception as e:
            raise ValueError(f"Failed to upload image: {str(e)}")
    
    # Update the note
    result = collection.update_one(
        {"notes.note_id": note_id},
        {
            "$set": update_fields
        }
    )
    
    if result.modified_count == 0:
        raise ValueError("Failed to update note")
    
    return {
        "message": "Note updated successfully",
        "note_id": note_id
    }

async def delete_note(note_id: str) -> Dict[str, Any]:
    """Delete a specific note"""
    collection = get_tutorial_support_collection()
    
    # Find and remove note
    result = collection.update_one(
        {"notes.note_id": note_id},
        {
            "$pull": {"notes": {"note_id": note_id}},
            "$set": {"updated_at": get_current_time().isoformat()}
        }
    )
    
    if result.modified_count == 0:
        raise ValueError("Note not found")
    
    return {
        "message": "Note deleted successfully",
        "note_id": note_id
    }

async def prettify_notes(tutorial_id: str) -> Dict[str, Any]:
    """Generate prettified version of notes using LLM"""
    collection = get_tutorial_support_collection()
    
    # Get tutorial and notes
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    notes = tutorial.get("notes", [])
    if not notes:
        raise ValueError("No notes found for this tutorial")
    
    # Sort notes by timestamp
    sorted_notes = sorted(notes, key=lambda x: parse_timestamp(x["timestamp"]))
    
    # Build notes text for LLM (without timestamps in output)
    notes_text = f"Tutorial: {tutorial['title']}\n\n"
    notes_text += "Raw Notes:\n"
    for note in sorted_notes:
        note_text = note.get('note', '')
        if note_text:  # Only include notes with text content
            notes_text += f"- {note_text}\n"
    
    # Call LLM
    user_prompt = (
        f"Please prettify and organize the following tutorial notes:\n\n"
        f"{notes_text}\n\n"
        f"Remember: Only format and organize the existing information. "
        f"Do not add new topics or information not present in the notes. "
        f"DO NOT include any timestamps in your output."
    )
    
    # Prettify Notes: Gemini first, fallback to Groq
    prettified_notes = None
    try:
        print("[Prettify Notes] Calling Gemini...")
        prettified_notes = gemini_generate_content(
            prompt=user_prompt,
            system_instruction=PRETTIFY_NOTES_PROMPT,
            temperature=0.3,
            max_tokens=3000
        )
        print(f"[Prettify Notes] Gemini succeeded ({len(prettified_notes)} chars)")
        
    except Exception as gemini_error:
        print(f"[Prettify Notes] Gemini failed: {str(gemini_error)[:100]}")
        
        # Fallback to Groq
        try:
            print("[Prettify Notes] Falling back to Groq...")
            prettified_notes = groq_chat_completion(
                messages=[
                    {"role": "system", "content": PRETTIFY_NOTES_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=3000
            )
            print(f"[Prettify Notes] Groq succeeded ({len(prettified_notes)} chars)")
            
        except Exception as groq_error:
            print(f"[Prettify Notes] Groq also failed: {str(groq_error)[:100]}")
            raise ValueError("Failed to prettify notes using both providers")
    
    return {
        "tutorial_id": tutorial["tutorial_id"],
        "title": tutorial["title"],
        "prettified_notes": prettified_notes
    }

async def generate_detailed_notes(tutorial_id: str) -> Dict[str, Any]:
    """Generate detailed comprehensive notes using LLM"""
    collection = get_tutorial_support_collection()
    
    # Get tutorial and notes
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    notes = tutorial.get("notes", [])
    if not notes:
        raise ValueError("No notes found for this tutorial")
    
    # Sort notes by timestamp
    sorted_notes = sorted(notes, key=lambda x: parse_timestamp(x["timestamp"]))
    
    # Build notes text for LLM (without timestamps in output)
    notes_text = f"Tutorial: {tutorial['title']}\n"
    notes_text += f"Tutorial Link: {tutorial['tutorial_link']}\n\n"
    notes_text += "Raw Notes:\n"
    for note in sorted_notes:
        note_text = note.get('note', '')
        if note_text:  # Only include notes with text content
            notes_text += f"- {note_text}\n"
    
    # Call LLM
    user_prompt = (
        f"Please create comprehensive, detailed study notes from the following tutorial notes:\n\n"
        f"{notes_text}\n\n"
        f"Expand on the concepts mentioned, provide detailed explanations, and create "
        f"a complete study resource. Stay focused on the topics mentioned in the notes. "
        f"DO NOT include any timestamps in your output."
    )
    
    # Detailed Notes: Gemini first, fallback to Groq
    detailed_notes = None
    try:
        print("[Detailed Notes] Calling Gemini...")
        detailed_notes = gemini_generate_content(
            prompt=user_prompt,
            system_instruction=DETAILED_NOTES_PROMPT,
            temperature=0.4,
            max_tokens=5000
        )
        print(f"[Detailed Notes] Gemini succeeded ({len(detailed_notes)} chars)")
        
    except Exception as gemini_error:
        print(f"[Detailed Notes] Gemini failed: {str(gemini_error)[:100]}")
        
        # Fallback to Groq
        try:
            print("[Detailed Notes] Falling back to Groq...")
            detailed_notes = groq_chat_completion(
                messages=[
                    {"role": "system", "content": DETAILED_NOTES_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.4,
                max_tokens=5000
            )
            print(f"[Detailed Notes] Groq succeeded ({len(detailed_notes)} chars)")
            
        except Exception as groq_error:
            print(f"[Detailed Notes] Groq also failed: {str(groq_error)[:100]}")
            raise ValueError("Failed to generate detailed notes using both providers")
            
    return {
        "tutorial_id": tutorial_id,
        "title": tutorial["title"],
        "detailed_notes": detailed_notes
    }

async def get_all_tutorials(email: str) -> Dict[str, Any]:
    """Get all tutorials for a user"""
    collection = get_tutorial_support_collection()
    
    # Count total
    total = collection.count_documents({"email": email})
    
    # Find tutorials for user
    tutorials = collection.find(
        {"email": email}
    ).sort("updated_at", -1)
    
    results = []
    for tut in tutorials:
        results.append({
            "tutorial_id": tut["tutorial_id"],
            "title": tut["title"],
            "tutorial_link": tut["tutorial_link"],
            "group": tut.get("group", "General"),
            "notes_count": len(tut.get("notes", [])),
            "created_at": tut["created_at"],
            "updated_at": tut["updated_at"]
        })
        
    return {
        "email": email,
        "tutorials": results,
        "total": total
    }

async def tutorial_ai_chat(tutorial_id: str, question: str, current_timestamp: Optional[str] = None) -> Dict[str, Any]:
    """AI companion chat for tutorial questions with context
    
    Args:
        tutorial_id: Tutorial ID
        question: User's question
        current_timestamp: Current video timestamp (MM:SS or HH:MM:SS) - if provided, adds recent transcript context
    """
    collection = get_tutorial_support_collection()
    
    # Get tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    # Build context from notes and previous chat
    context_parts = []
    
    # Add tutorial info
    context_parts.append(f"Tutorial: {tutorial['title']}")
    context_parts.append(f"Link: {tutorial['tutorial_link']}")
    
    # Add recent transcript if current timestamp is provided
    if current_timestamp:
        recent_transcript = get_last_n_minutes_transcript(
            tutorial['tutorial_link'],
            current_timestamp,
            minutes=5
        )
        if recent_transcript:
            context_parts.append("\n📝 WHAT WAS JUST DISCUSSED (Last 5 minutes of video):")
            # Take the LAST 1500 chars (most recent content) if transcript is longer
            transcript_excerpt = recent_transcript[-1500:] if len(recent_transcript) > 1500 else recent_transcript
            context_parts.append(f"[Leading up to ~{current_timestamp}] {transcript_excerpt}")
            print(f"[Tutorial Chat] Added {len(transcript_excerpt)} chars of transcript context (from {len(recent_transcript)} total)")
    
    # Add notes as context
    notes = tutorial.get("notes", [])
    if notes:
        sorted_notes = sorted(notes, key=lambda x: parse_timestamp(x.get("timestamp", "0:00")))
        context_parts.append("\nNotes from the tutorial:")
        for note in sorted_notes:
            note_text = note.get('note', '')
            if note_text:  # Only include notes with text content
                context_parts.append(f"- {note_text}")
    
    # Add recent chat history (last 10 exchanges for context)
    chat_history = tutorial.get("ai_chat", [])
    recent_chat = chat_history[-30:] if len(chat_history) > 30 else chat_history
    
    # Build messages for LLM
    messages = [{"role": "system", "content": TUTORIAL_AI_COMPANION_PROMPT}]
    
    # Add context as user message if we have notes
    if context_parts:
        context_message = "\n".join(context_parts)
        messages.append({
            "role": "system",
            "content": f"Context for this conversation:\n{context_message}"
        })
    
    # Add recent chat history
    for chat_entry in recent_chat:
        messages.append({"role": "user", "content": chat_entry["question"]})
        messages.append({"role": "assistant", "content": chat_entry["answer"]})
    
    # Add current question
    messages.append({"role": "user", "content": question})
    
    # Call LLM with automatic fallback (Gemini -> Groq)
    try:
        # Remove system instruction from messages and pass separately
        system_prompt = None
        chat_messages = []
        for msg in messages:
            if msg["role"] == "system":
                if system_prompt:
                    system_prompt += "\n\n" + msg["content"]
                else:
                    system_prompt = msg["content"]
            else:
                chat_messages.append(msg)
        
        # Tutorial Chat: Groq first (fast), fallback to Gemini
        answer = None
        provider_used = None
        
        # Try Groq first
        try:
            print("[Tutorial Chat] Calling Groq...")
            # For Groq, add system instruction as first message
            groq_messages = []
            if system_prompt:
                groq_messages.append({"role": "system", "content": system_prompt})
            groq_messages.extend(chat_messages)
            
            answer = groq_chat_completion(
                messages=groq_messages,
                temperature=0.6,
                max_tokens=4000
            )
            provider_used = "groq"
            print(f"[Tutorial Chat] Groq succeeded ({len(answer)} chars)")
            
        except Exception as groq_error:
            print(f"[Tutorial Chat] Groq failed: {str(groq_error)[:100]}")
            
            # Fallback to Gemini
            try:
                print("[Tutorial Chat] Falling back to Gemini...")
                answer = gemini_chat_completion(
                    messages=chat_messages,
                    system_instruction=system_prompt,
                    temperature=0.6,
                    max_tokens=4000
                )
                provider_used = "gemini"
                print(f"[Tutorial Chat] Gemini succeeded ({len(answer)} chars)")
                
            except Exception as gemini_error:
                print(f"[Tutorial Chat] Gemini also failed: {str(gemini_error)[:100]}")
                answer = "I'm temporarily unable to respond. Please try again in a moment."
                provider_used = "none"
        
        if provider_used and provider_used != "none":
            print(f"[Tutorial Chat] Response generated using: {provider_used}")
            print(f"[Tutorial Chat] Response length: {len(answer) if answer else 0} characters")
        
        # Check if answer is None or empty
        if not answer or not answer.strip():
            print("[Tutorial Chat] WARNING: Empty response received")
            answer = "I'm having trouble understanding that right now. Could you try rephrasing your question?"
            
    except Exception as e:
        # Log the error for debugging
        print(f"Error in tutorial AI chat: {str(e)}")
        answer = "I'm temporarily unable to respond. Please try again in a moment."
    
    # Save to chat history
    chat_entry = {
        "question": question,
        "answer": answer,
        "timestamp": get_current_time().isoformat()
    }
    
    collection.update_one(
        {"tutorial_id": tutorial_id},
        {
            "$push": {"ai_chat": chat_entry},
            "$set": {"updated_at": get_current_time().isoformat()}
        }
    )
    
    return {
        "tutorial_id": tutorial_id,
        "question": question,
        "answer": answer
    }

@cache_response(ttl_seconds=60)  # Cache for 1 minute
async def get_tutorial_chat_history(tutorial_id: str) -> Dict[str, Any]:
    """Get chat history for a tutorial"""
    collection = get_tutorial_support_collection()
    
    # Get tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    # Get chat history
    chat_history = tutorial.get("ai_chat", [])
    
    # Convert to response format with role-based messages
    chat_messages = []
    for chat_entry in chat_history:
        # Skip entries with None values
        question = chat_entry.get("question")
        answer = chat_entry.get("answer")
        
        if not question or not answer:
            continue
        
        timestamp = chat_entry.get("timestamp", get_current_time().isoformat())
        
        # Add user message
        chat_messages.append({
            "role": "user",
            "content": question,
            "timestamp": timestamp
        })
        # Add assistant message
        chat_messages.append({
            "role": "assistant",
            "content": answer,
            "timestamp": timestamp
        })
    
    return {
        "tutorial_id": tutorial_id,
        "title": tutorial["title"],
        "chat_history": chat_messages
    }

# ============================================================================
# QUIZ SYSTEM FUNCTIONS
# ============================================================================

def extract_video_id(tutorial_link: str) -> str:
    """Extract YouTube video ID from URL"""
    if "v=" in tutorial_link:
        return tutorial_link.split("v=")[1].split("&")[0]
    elif "youtu.be/" in tutorial_link:
        return tutorial_link.split("youtu.be/")[1].split("?")[0]
    else:
        raise ValueError("Invalid YouTube URL")

def timestamp_to_seconds(timestamp: str) -> int:
    """Convert timestamp string (MM:SS or HH:MM:SS) to seconds"""
    parts = timestamp.split(":")
    if len(parts) == 2:
        minutes, seconds = int(parts[0]), int(parts[1])
        return minutes * 60 + seconds
    elif len(parts) == 3:
        hours, minutes, seconds = int(parts[0]), int(parts[1]), int(parts[2])
        return hours * 3600 + minutes * 60 + seconds
    return 0

def get_last_n_minutes_transcript(tutorial_link: str, current_timestamp: str, minutes: int = 5) -> Optional[str]:
    """
    Get transcript for the last N minutes before current timestamp
    
    Args:
        tutorial_link: YouTube video URL
        current_timestamp: Current video position (MM:SS or HH:MM:SS)
        minutes: Number of minutes to look back (default 5)
    
    Returns:
        Transcript text from the time range, or None if not available
    """
    try:
        video_id = extract_video_id(tutorial_link)
        
        # Try to get transcript
        language_codes = ['en', 'hi', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'it', 'ar', 'zh']
        transcript_list = None
        
        try:
            available_transcripts = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Try preferred languages
            for lang_code in language_codes:
                try:
                    transcript = available_transcripts.find_transcript([lang_code])
                    transcript_list = transcript.fetch()
                    break
                except:
                    continue
            
            # Try any manually created transcript
            if not transcript_list:
                try:
                    transcript = available_transcripts.find_manually_created_transcript()
                    transcript_list = transcript.fetch()
                except:
                    pass
            
            # Try any generated transcript
            if not transcript_list:
                try:
                    transcript = available_transcripts.find_generated_transcript()
                    transcript_list = transcript.fetch()
                except:
                    pass
                    
        except Exception:
            pass
        
        # Fallback: try without specifying language
        if not transcript_list:
            try:
                transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            except Exception:
                # No transcript available
                return None
        
        if not transcript_list:
            return None
        
        # Convert current timestamp to seconds
        current_seconds = timestamp_to_seconds(current_timestamp)
        
        # Calculate start time (N minutes before current time)
        lookback_seconds = minutes * 60
        from_seconds = max(0, current_seconds - lookback_seconds)
        
        # Extract transcript from time range
        filtered_transcript = []
        for entry in transcript_list:
            entry_start = entry['start']
            # Include entries that start within our time range
            if from_seconds <= entry_start <= current_seconds:
                filtered_transcript.append(entry['text'])
        
        if not filtered_transcript:
            return None
        
        return " ".join(filtered_transcript)
        
    except Exception as e:
        # Silently fail - transcript is optional context
        print(f"[Transcript Context] Could not fetch: {str(e)}")
        return None

def get_transcript_by_timerange(tutorial_link: str, from_timestamp: str, to_timestamp: Optional[str]) -> str:
    """Extract YouTube transcript for specified time range"""
    try:
        video_id = extract_video_id(tutorial_link)
        
        # Try to get transcript in multiple languages (in order of preference)
        language_codes = ['en', 'hi', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'it', 'ar', 'zh']
        transcript_list = None
        used_language = None
        
        # First, try to list available transcripts
        try:
            available_transcripts = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Try to get transcript in preferred order
            for lang_code in language_codes:
                try:
                    transcript = available_transcripts.find_transcript([lang_code])
                    transcript_list = transcript.fetch()
                    used_language = lang_code
                    break
                except:
                    continue
            
            # If no preferred language found, try any manually created transcript
            if not transcript_list:
                try:
                    transcript = available_transcripts.find_manually_created_transcript()
                    transcript_list = transcript.fetch()
                    used_language = transcript.language_code
                except:
                    pass
            
            # If still no transcript, try any generated transcript
            if not transcript_list:
                try:
                    transcript = available_transcripts.find_generated_transcript()
                    transcript_list = transcript.fetch()
                    used_language = transcript.language_code
                except:
                    pass
                    
        except Exception as e:
            pass
        
        # If all else fails, try getting transcript without specifying language
        if not transcript_list:
            try:
                transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
                used_language = "default"
            except Exception as e:
                # Don't raise error here, we'll handle it in the calling function
                transcript_list = None
        
        if not transcript_list:
            return None
        
        # Convert timestamps to seconds
        from_seconds = timestamp_to_seconds(from_timestamp)
        
        # Get video duration if to_timestamp not provided
        if to_timestamp:
            to_seconds = timestamp_to_seconds(to_timestamp)
        else:
            # Use last transcript entry's time
            to_seconds = transcript_list[-1]['start'] + transcript_list[-1]['duration']
        
        # Filter transcript by time range
        filtered_transcript = []
        for entry in transcript_list:
            if from_seconds <= entry['start'] <= to_seconds:
                filtered_transcript.append(entry['text'])
        
        transcript_text = " ".join(filtered_transcript)
        
        if not transcript_text:
            raise ValueError("No transcript found for the specified time range")
        
        return transcript_text
        
    except Exception as e:
        error_msg = str(e)
        if "No transcripts" in error_msg or "Could not retrieve" in error_msg:
            raise ValueError(
                "This video doesn't have captions/transcripts available. "
                "Please try a video with captions enabled, or add your own notes to generate quizzes."
            )
        raise ValueError(f"Could not extract transcript: {error_msg}")

async def generate_quiz_from_transcript(
    tutorial_id: str, 
    from_timestamp: str, 
    to_timestamp: Optional[str]
) -> Dict[str, Any]:
    """Generate quiz from video transcript"""
    collection = get_tutorial_support_collection()
    
    # Get tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    # Get transcript for time range
    transcript_text = get_transcript_by_timerange(
        tutorial["tutorial_link"],
        from_timestamp,
        to_timestamp
    )
    
    # Get tutorial title
    tutorial_title = tutorial.get("title", "")
    
    # Prepare prompt for LLM
    if transcript_text:
        # Use transcript content to guide quiz generation
        user_prompt = f"""
TOPIC/TITLE: {tutorial_title}

REFERENCE CONTENT (use this to understand what specific aspects to focus on):
{transcript_text[:6000]}

Your task: Generate a comprehensive quiz to test understanding of "{tutorial_title}".
The reference content above is ONLY to guide you on which specific aspects are covered.
Generate questions about the topic itself, as if testing a student's knowledge in an exam setting.
"""
    else:
        # Fallback: Generate quiz based on topic/title only
        user_prompt = f"""
TOPIC/TITLE: {tutorial_title}

Your task: Generate a comprehensive quiz to test understanding of "{tutorial_title}".
Since no transcript is available, create questions based on the general knowledge and concepts typically covered in this topic.
Generate questions that would test a student's understanding of the fundamental concepts, principles, and practical applications related to this topic.
Make the questions educational and comprehensive, covering both theoretical and practical aspects.
"""
    
    # Quiz Generation: Gemini first, fallback to Groq
    quiz_json = None
    try:
        print("[Tutorial Quiz] Calling Gemini...")
        quiz_json = gemini_generate_content(
            prompt=user_prompt,
            system_instruction=QUIZ_GENERATION_PROMPT,
            temperature=0.3,
            max_tokens=4000
        )
        print(f"[Tutorial Quiz] Gemini succeeded ({len(quiz_json)} chars)")
        
    except Exception as gemini_error:
        print(f"[Tutorial Quiz] Gemini failed: {str(gemini_error)[:100]}")
        
        # Fallback to Groq
        try:
            print("[Tutorial Quiz] Falling back to Groq...")
            quiz_json = groq_chat_completion(
                messages=[
                    {"role": "system", "content": QUIZ_GENERATION_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=4000
            )
            print(f"[Tutorial Quiz] Groq succeeded ({len(quiz_json)} chars)")
            
        except Exception as groq_error:
            print(f"[Tutorial Quiz] Groq also failed: {str(groq_error)[:100]}")
            raise ValueError("Failed to generate tutorial quiz using both providers")
    
    # Try to extract JSON from response
    try:
        # Remove markdown code blocks if present
        if "```json" in quiz_json:
            quiz_json = quiz_json.split("```json")[1].split("```")[0].strip()
        elif "```" in quiz_json:
            quiz_json = quiz_json.split("```")[1].split("```")[0].strip()
        
        quiz_data = json.loads(quiz_json)
    except json.JSONDecodeError as e:
        # Try to find JSON in the response
        start = quiz_json.find("{")
        end = quiz_json.rfind("}") + 1
        if start != -1 and end > start:
            try:
                quiz_data = json.loads(quiz_json[start:end])
            except json.JSONDecodeError as e2:
                raise ValueError(f"Failed to parse quiz JSON: {str(e2)}")
        else:
            raise ValueError("Failed to parse quiz JSON from LLM response")
    
    # Generate quiz ID and prepare questions
    quiz_id = f"quiz_{uuid.uuid4().hex[:12]}"
    current_time = get_current_time()
    
    # Format MCQ questions
    mcq_questions = []
    for idx, mcq in enumerate(quiz_data.get("mcq_questions", [])[:20], 1):
        mcq_questions.append({
            "question_id": f"q{idx}",
            "question": mcq["question"],
            "options": mcq["options"],
            "correct_answer_index": mcq["correct_answer_index"]
        })
    
    # Format descriptive questions
    descriptive_questions = []
    for idx, desc in enumerate(quiz_data.get("descriptive_questions", [])[:5], 21):
        descriptive_questions.append({
            "question_id": f"q{idx}",
            "question": desc["question"],
            "expected_answer": desc["expected_answer"]
        })
    
    # Create quiz object
    quiz_object = {
        "quiz_id": quiz_id,
        "from_timestamp": from_timestamp,
        "to_timestamp": to_timestamp or "end",
        "created_at": current_time.isoformat(),
        "mcq_questions": mcq_questions,
        "descriptive_questions": descriptive_questions,
        "user_answers": None,
        "evaluation_report": None,
        "is_evaluated": False
    }
    
    # Store quiz in tutorial document
    collection.update_one(
        {"tutorial_id": tutorial_id},
        {
            "$push": {"quizzes": quiz_object},
            "$set": {"updated_at": current_time.isoformat()}
        }
    )
    
    # Ensure quizzes field exists
    if "quizzes" not in tutorial:
        collection.update_one(
            {"tutorial_id": tutorial_id},
            {"$set": {"quizzes": [quiz_object]}}
        )
    
    # Invalidate cache for this tutorial
    invalidate_cache(tutorial_id)
    
    # Remove correct answers from response (students shouldn't see these before submission)
    mcq_for_display = []
    for mcq in mcq_questions:
        mcq_for_display.append({
            "question_id": mcq["question_id"],
            "question": mcq["question"],
            "options": mcq["options"]
            # Don't include correct_answer_index
        })
    
    desc_for_display = []
    for desc in descriptive_questions:
        desc_for_display.append({
            "question_id": desc["question_id"],
            "question": desc["question"]
            # Don't include expected_answer
        })
    
    return {
        "quiz_id": quiz_id,
        "tutorial_id": tutorial_id,
        "tutorial_title": tutorial["title"],
        "from_timestamp": from_timestamp,
        "to_timestamp": to_timestamp or "end",
        "mcq_questions": mcq_for_display,
        "descriptive_questions": desc_for_display,
        "total_questions": len(mcq_questions) + len(descriptive_questions),
        "created_at": current_time,
        "message": "Quiz generated successfully"
    }

async def evaluate_quiz(quiz_id: str, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Evaluate quiz answers and generate detailed report"""
    collection = get_tutorial_support_collection()
    
    # Find quiz in database
    tutorial = collection.find_one({"quizzes.quiz_id": quiz_id})
    if not tutorial:
        raise ValueError("Quiz not found")
    
    # Get the specific quiz
    quiz = next((q for q in tutorial.get("quizzes", []) if q["quiz_id"] == quiz_id), None)
    if not quiz:
        raise ValueError("Quiz not found")
    
    # Convert answers list to dict for easy lookup
    answers_dict = {ans.question_id: ans.answer for ans in answers}
    
    # Evaluate MCQs
    mcq_results = []
    mcq_correct = 0
    mcq_total = len(quiz["mcq_questions"])
    
    for mcq in quiz["mcq_questions"]:
        user_answer = answers_dict.get(mcq["question_id"])
        is_correct = user_answer == mcq["correct_answer_index"]
        if is_correct:
            mcq_correct += 1
        
        mcq_results.append({
            "question_id": mcq["question_id"],
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
    for desc in quiz["descriptive_questions"]:
        user_answer = answers_dict.get(desc["question_id"], "")
        
        eval_prompt = f"""
Question: {desc["question"]}

Expected Answer: {desc["expected_answer"]}

Student Answer: {user_answer}

Evaluate the student's answer and provide a score (0-10) and detailed feedback.
"""
        
        descriptive_evaluations.append({
            "question_id": desc["question_id"],
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
    
    # Tutorial Quiz Evaluation: Gemini first, fallback to Groq
    eval_json = None
    try:
        print("[Tutorial Quiz Eval] Calling Gemini...")
        eval_json = gemini_generate_content(
            prompt=llm_eval_prompt,
            system_instruction=QUIZ_EVALUATION_PROMPT,
            temperature=0.3,
            max_tokens=3000
        )
        print(f"[Tutorial Quiz Eval] Gemini succeeded ({len(eval_json)} chars)")
        
    except Exception as gemini_error:
        print(f"[Tutorial Quiz Eval] Gemini failed: {str(gemini_error)[:100]}")
        
        # Fallback to Groq
        try:
            print("[Tutorial Quiz Eval] Falling back to Groq...")
            eval_json = groq_chat_completion(
                messages=[
                    {"role": "system", "content": QUIZ_EVALUATION_PROMPT},
                    {"role": "user", "content": llm_eval_prompt}
                ],
                temperature=0.3,
                max_tokens=3000
            )
            print(f"[Tutorial Quiz Eval] Groq succeeded ({len(eval_json)} chars)")
            
        except Exception as groq_error:
            print(f"[Tutorial Quiz Eval] Groq also failed: {str(groq_error)[:100]}")
            raise ValueError("Failed to evaluate tutorial quiz using both providers")
    
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
    
    for eval_item in eval_data.get("question_evaluations", []):
        desc_q = next((d for d in quiz["descriptive_questions"] 
                      if d["question_id"] == eval_item["question_id"]), None)
        if desc_q:
            score = eval_item.get("score", 0)
            descriptive_total_score += score
            
            descriptive_results.append({
                "question_id": eval_item["question_id"],
                "question": desc_q["question"],
                "user_answer": answers_dict.get(eval_item["question_id"], ""),
                "correct_answer": desc_q["expected_answer"],
                "is_correct": score >= 7.0,
                "score": score,
                "max_score": 10.0,
                "feedback": eval_item.get("feedback", "")
            })
    
    # Combine all results
    all_results = mcq_results + descriptive_results
    
    # Calculate total scores
    mcq_score = float(mcq_correct)
    descriptive_score = descriptive_total_score
    total_score = mcq_score + descriptive_score
    max_score = float(mcq_total) + (len(quiz["descriptive_questions"]) * 10)
    percentage = (total_score / max_score * 100) if max_score > 0 else 0
    
    # Create evaluation report
    evaluated_at = get_current_time()
    evaluation_report = {
        "quiz_id": quiz_id,
        "tutorial_id": tutorial["tutorial_id"],
        "total_score": total_score,
        "max_score": max_score,
        "percentage": round(percentage, 2),
        "mcq_score": mcq_score,
        "descriptive_score": round(descriptive_score, 2),
        "results": all_results,
        "overall_feedback": eval_data.get("overall_feedback", "Good effort!"),
        "strengths": eval_data.get("strengths", []),
        "areas_for_improvement": eval_data.get("areas_for_improvement", []),
        "study_suggestions": eval_data.get("study_suggestions", []),
        "evaluated_at": evaluated_at
    }
    
    # Update quiz in database
    collection.update_one(
        {"tutorial_id": tutorial["tutorial_id"], "quizzes.quiz_id": quiz_id},
        {
            "$set": {
                "quizzes.$.user_answers": answers_dict,
                "quizzes.$.evaluation_report": evaluation_report,
                "quizzes.$.is_evaluated": True,
                "updated_at": evaluated_at.isoformat()
            }
        }
    )
    
    # Invalidate cache for this tutorial
    invalidate_cache(tutorial["tutorial_id"])
    
    return evaluation_report

@cache_response(ttl_seconds=300)  # Cache for 5 minutes
async def get_quiz_details(quiz_id: str) -> Dict[str, Any]:
    """Get quiz details including questions and evaluation"""
    collection = get_tutorial_support_collection()
    
    # Find quiz
    tutorial = collection.find_one({"quizzes.quiz_id": quiz_id})
    if not tutorial:
        raise ValueError("Quiz not found")
    
    quiz = next((q for q in tutorial.get("quizzes", []) if q["quiz_id"] == quiz_id), None)
    if not quiz:
        raise ValueError("Quiz not found")
    
    return {
        "quiz_id": quiz["quiz_id"],
        "tutorial_id": tutorial["tutorial_id"],
        "tutorial_title": tutorial["title"],
        "from_timestamp": quiz["from_timestamp"],
        "to_timestamp": quiz["to_timestamp"],
        "mcq_questions": quiz["mcq_questions"],
        "descriptive_questions": quiz["descriptive_questions"],
        "is_evaluated": quiz.get("is_evaluated", False),
        "evaluation_report": quiz.get("evaluation_report"),
        "created_at": quiz["created_at"]
    }

@cache_response(ttl_seconds=300)  # Cache for 5 minutes
async def get_tutorial_quizzes(tutorial_id: str) -> Dict[str, Any]:
    """Get all quizzes for a tutorial with full evaluation reports"""
    collection = get_tutorial_support_collection()
    
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    quizzes = tutorial.get("quizzes", [])
    
    # Build quiz summaries with full evaluation reports
    quiz_summaries = []
    for quiz in quizzes:
        eval_report = quiz.get("evaluation_report")
        
        quiz_data = {
            "quiz_id": quiz["quiz_id"],
            "tutorial_id": tutorial_id,
            "tutorial_title": tutorial["title"],
            "from_timestamp": quiz["from_timestamp"],
            "to_timestamp": quiz["to_timestamp"],
            "total_questions": len(quiz["mcq_questions"]) + len(quiz["descriptive_questions"]),
            "is_evaluated": quiz.get("is_evaluated", False),
            "score": eval_report["total_score"] if eval_report else None,
            "percentage": eval_report["percentage"] if eval_report else None,
            "created_at": quiz["created_at"]
        }
        
        # Include full evaluation report if available
        if eval_report:
            quiz_data["evaluation_report"] = eval_report
        
        quiz_summaries.append(quiz_data)
    
    # Sort by created_at descending
    quiz_summaries.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "tutorial_id": tutorial_id,
        "tutorial_title": tutorial["title"],
        "quizzes": quiz_summaries
    }

async def get_user_quizzes(email: str) -> Dict[str, Any]:
    """Get all quizzes across all tutorials for a user"""
    collection = get_tutorial_support_collection()
    
    # Find all tutorials for user
    tutorials = list(collection.find({"email": email}))
    
    # Collect all quizzes
    all_quizzes = []
    for tutorial in tutorials:
        quizzes = tutorial.get("quizzes", [])
        for quiz in quizzes:
            eval_report = quiz.get("evaluation_report")
            all_quizzes.append({
                "quiz_id": quiz["quiz_id"],
                "tutorial_id": tutorial["tutorial_id"],
                "tutorial_title": tutorial["title"],
                "from_timestamp": quiz["from_timestamp"],
                "to_timestamp": quiz["to_timestamp"],
                "total_questions": len(quiz["mcq_questions"]) + len(quiz["descriptive_questions"]),
                "is_evaluated": quiz.get("is_evaluated", False),
                "score": eval_report["total_score"] if eval_report else None,
                "percentage": eval_report["percentage"] if eval_report else None,
                "created_at": quiz["created_at"]
            })
    
    # Sort by created_at descending
    all_quizzes.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "email": email,
        "quizzes": all_quizzes
    }

# ============================================================================
# MINDMAP GENERATION
# ============================================================================

def render_mindmap_image(mindmap: Dict[str, Any]) -> str:
    """Render mindmap JSON structure to base64 encoded PNG image"""
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
        nid = str(uuid.uuid4())
        dot.node(nid, _label(node.get("title", ""), node.get("description", "")))
        for child in node.get("children", []):
            cid = _add(child)
            dot.edge(nid, cid)
        return nid

    _add(mindmap)
    # Render to bytes and return base64 data URL
    png_bytes = dot.pipe(format="png")
    b64 = base64.b64encode(png_bytes).decode("utf-8")
    return f"data:image/png;base64,{b64}"

async def generate_tutorial_mindmaps(tutorial_id: str) -> Dict[str, Any]:
    """Generate mindmaps from tutorial notes"""
    collection = get_tutorial_support_collection()
    
    # Get tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    # Get all notes
    notes = tutorial.get("notes", [])
    if not notes:
        raise ValueError("No notes found for this tutorial. Please add notes first.")
    
    # Combine all notes into text
    notes_text = "\n\n".join([
        f"[{note.get('timestamp', 'N/A')}] {note.get('note', '')}"
        for note in sorted(notes, key=lambda x: parse_timestamp(x.get("timestamp", "0:00")))
    ])
    
    tutorial_title = tutorial.get("title", "")
    
    # Step 1: Analyze notes and determine how many mindmaps to create
    analysis_prompt = f"""
TUTORIAL TITLE: {tutorial_title}

NOTES:
{notes_text[:8000]}  # Limit to avoid token overflow

Analyze these notes and determine the optimal number of mindmaps (1-5) to visualize the content effectively.
"""
    
    # Tutorial Mindmap Analysis: Gemini first, fallback to Groq
    analysis_json = None
    try:
        print("[Tutorial Mindmap Analysis] Calling Gemini...")
        analysis_json = gemini_generate_content(
            prompt=analysis_prompt,
            system_instruction=MINDMAP_ANALYSIS_PROMPT,
            temperature=0.3,
            max_tokens=2000
        )
        print(f"[Tutorial Mindmap Analysis] Gemini succeeded ({len(analysis_json)} chars)")
        
    except Exception as gemini_error:
        print(f"[Tutorial Mindmap Analysis] Gemini failed: {str(gemini_error)[:100]}")
        
        # Fallback to Groq
        try:
            print("[Tutorial Mindmap Analysis] Falling back to Groq...")
            analysis_json = groq_chat_completion(
                messages=[
                    {"role": "system", "content": MINDMAP_ANALYSIS_PROMPT},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            print(f"[Tutorial Mindmap Analysis] Groq succeeded ({len(analysis_json)} chars)")
            
        except Exception as groq_error:
            print(f"[Tutorial Mindmap Analysis] Groq also failed: {str(groq_error)[:100]}")
            raise ValueError("Failed to analyze tutorial mindmap using both providers")
    
    try:
        # Remove markdown code blocks if present
        if "```json" in analysis_json:
            analysis_json = analysis_json.split("```json")[1].split("```")[0].strip()
        elif "```" in analysis_json:
            analysis_json = analysis_json.split("```")[1].split("```")[0].strip()
        
        analysis_data = json.loads(analysis_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse analysis JSON: {str(e)}")
    
    # Step 2: Generate each mindmap
    mindmaps = []
    
    # Safely extract mindmap topics with multiple fallbacks
    mindmap_topics = []
    if analysis_data and isinstance(analysis_data, dict):
        mindmap_topics = analysis_data.get("mindmaps") or analysis_data.get("topics") or analysis_data.get("concepts") or []
    
    if not isinstance(mindmap_topics, list):
        mindmap_topics = []
    
    # If no topics found, create a default one based on the tutorial
    if not mindmap_topics:
        mindmap_topics = [{
            "title": f"{tutorial_title} - Key Concepts",
            "description": f"Overview of main topics from the notes",
            "focus_area": "general concepts"
        }]
    
    for idx, topic_data in enumerate(mindmap_topics[:5], 1):  # Max 5 mindmaps
        # Safely extract topic information
        if not isinstance(topic_data, dict):
            topic_data = {"title": f"Topic {idx}", "description": "", "focus_area": ""}
        
        topic_title = topic_data.get("title") or f"Topic {idx}"
        topic_desc = topic_data.get("description") or ""
        focus_area = topic_data.get("focus_area") or ""
        
        # Generate mindmap structure for this topic
        generation_prompt = f"""
MAIN TOPIC: {topic_title}
DESCRIPTION: {topic_desc}
FOCUS AREA: {focus_area}

REFERENCE NOTES:
{notes_text[:6000]}

Create a detailed mindmap structure for this specific topic based on the notes provided.
Focus specifically on the concepts and details related to: {focus_area}
"""
        
        # Tutorial Mindmap Generation: Gemini first, fallback to Groq
        mindmap_json = None
        try:
            print(f"[Tutorial Mindmap Gen {idx}] Calling Gemini...")
            mindmap_json = gemini_generate_content(
                prompt=generation_prompt,
                system_instruction=MINDMAP_GENERATION_PROMPT,
                temperature=0.3,
                max_tokens=3000
            )
            print(f"[Tutorial Mindmap Gen {idx}] Gemini succeeded ({len(mindmap_json)} chars)")
            
        except Exception as gemini_error:
            print(f"[Tutorial Mindmap Gen {idx}] Gemini failed: {str(gemini_error)[:100]}")
            
            # Fallback to Groq
            try:
                print(f"[Tutorial Mindmap Gen {idx}] Falling back to Groq...")
                mindmap_json = groq_chat_completion(
                    messages=[
                        {"role": "system", "content": MINDMAP_GENERATION_PROMPT},
                        {"role": "user", "content": generation_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=3000
                )
                print(f"[Tutorial Mindmap Gen {idx}] Groq succeeded ({len(mindmap_json)} chars)")
                
            except Exception as groq_error:
                print(f"[Tutorial Mindmap Gen {idx}] Both providers failed")
                continue  # Skip this mindmap if both fail
        
        try:
            # Remove markdown code blocks if present
            if "```json" in mindmap_json:
                mindmap_json = mindmap_json.split("```json")[1].split("```")[0].strip()
            elif "```" in mindmap_json:
                mindmap_json = mindmap_json.split("```")[1].split("```")[0].strip()
            
            mindmap_structure = json.loads(mindmap_json)
            
            # Validate structure has required fields
            if not isinstance(mindmap_structure, dict):
                continue
                
        except (json.JSONDecodeError, IndexError, AttributeError) as e:
            continue  # Skip this mindmap if parsing fails
        
        # Render mindmap to base64 image and upload to GCS
        try:
            image_b64 = render_mindmap_image(mindmap_structure)
            
            from services.blob.gcs_client import GCSClient
            import base64
            
            if image_b64.startswith("data:image/"):
                header, base64_data = image_b64.split(",", 1)
            else:
                base64_data = image_b64
                
            image_bytes = base64.b64decode(base64_data)
            file_key = f"mindmaps/{uuid.uuid4().hex}.png"
            
            gcs = GCSClient()
            if gcs.is_available():
                blob = gcs.get_bucket().blob(file_key)
                blob.upload_from_string(image_bytes, content_type="image/png")
                image_url = f"https://storage.googleapis.com/{gcs.get_bucket_name()}/{file_key}"
            else:
                raise ValueError("GCS is unavailable")
                
        except Exception as e:
            print(f"Mindmap upload failed: {e}")
            continue  # Skip if rendering or uploading fails
        
        # Create mindmap entry
        mindmap_id = f"mindmap_{uuid.uuid4().hex[:12]}"
        current_time = get_current_time().isoformat()
        
        mindmap_entry = {
            "mindmap_id": mindmap_id,
            "title": topic_title,
            "description": topic_desc,
            "image_url": image_url,
            "structure": mindmap_structure,  # Save the JSON structure too
            "created_at": current_time
        }
        
        mindmaps.append(mindmap_entry)
    
    if not mindmaps:
        raise ValueError("Failed to generate any mindmaps")
    
    # Step 3: Save mindmaps to tutorial document
    collection.update_one(
        {"tutorial_id": tutorial_id},
        {
            "$set": {
                "mindmaps": mindmaps,
                "updated_at": get_current_time().isoformat()
            }
        }
    )
    
    # Invalidate cache for this tutorial
    invalidate_cache(tutorial_id)
    
    return {
        "tutorial_id": tutorial_id,
        "mindmaps": [
            {
                "mindmap_id": m["mindmap_id"],
                "title": m["title"],
                "description": m["description"],
                "image_url": m["image_url"],
                "created_at": m["created_at"]
            }
            for m in mindmaps
        ],
        "message": f"Generated {len(mindmaps)} mindmap(s) successfully"
    }

@cache_response(ttl_seconds=300)  # Cache for 5 minutes
async def get_tutorial_mindmaps(tutorial_id: str) -> Dict[str, Any]:
    """Get all mindmaps for a tutorial"""
    collection = get_tutorial_support_collection()
    
    # Get tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id})
    if not tutorial:
        raise ValueError("Tutorial not found")
    
    # Get mindmaps
    mindmaps = tutorial.get("mindmaps", [])
    
    if not mindmaps:
        return {
            "tutorial_id": tutorial_id,
            "mindmaps": []
        }
    
    # Format response (exclude structure field to reduce payload)
    formatted_mindmaps = [
        {
            "mindmap_id": m["mindmap_id"],
            "title": m["title"],
            "description": m["description"],
            "image_url": m.get("image_url", ""),
            "created_at": m["created_at"]
        }
        for m in mindmaps
    ]
    
    return {
        "tutorial_id": tutorial_id,
        "mindmaps": formatted_mindmaps
    }

async def edit_tutorial(tutorial_id: str, email: str, title: Optional[str] = None, group: Optional[str] = None) -> Dict[str, Any]:
    """Edit tutorial title or group"""
    collection = get_tutorial_support_collection()
    
    # Find tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id, "email": email})
    if not tutorial:
        raise ValueError("Tutorial not found or access denied")
    
    # Prepare update
    update_fields = {}
    if title:
        update_fields["title"] = title
    if group:
        update_fields["group"] = group
    
    if not update_fields:
        raise ValueError("No fields to update")
    
    # Update
    update_fields["updated_at"] = get_current_time().isoformat()
    collection.update_one(
        {"tutorial_id": tutorial_id, "email": email},
        {"$set": update_fields}
    )
    
    # Invalidate cache
    invalidate_cache(f"get_all_tutorials:{email}")
    
    return {
        "message": "Tutorial updated successfully",
        "tutorial_id": tutorial_id
    }

async def delete_tutorial(tutorial_id: str, email: str) -> Dict[str, Any]:
    """Delete a tutorial"""
    collection = get_tutorial_support_collection()
    
    # Find tutorial
    tutorial = collection.find_one({"tutorial_id": tutorial_id, "email": email})
    if not tutorial:
        raise ValueError("Tutorial not found or access denied")
    
    # Delete
    collection.delete_one({"tutorial_id": tutorial_id, "email": email})
    
    # Invalidate cache
    invalidate_cache(f"get_all_tutorials:{email}")
    
    return {
        "message": "Tutorial deleted successfully",
        "tutorial_id": tutorial_id
    }

async def generate_consolidated_notes(email: str, group: str) -> Dict[str, Any]:
    """Generate comprehensive notes from all tutorials in a group"""
    collection = get_tutorial_support_collection()
    
    # Find all tutorials in this group for this user
    tutorials = list(collection.find({
        "email": email,
        "group": group
    }).sort("created_at", 1))  # Oldest first
    
    if not tutorials:
        raise ValueError(f"No tutorials found in group '{group}'")
    
    # Collect all notes from all tutorials (ordered by creation date)
    all_notes_content = []
    
    for tutorial in tutorials:
        notes = tutorial.get("notes", [])
        if notes:
            all_notes_content.append(f"## {tutorial['title']}\n")
            all_notes_content.append(f"**Tutorial Link:** {tutorial['tutorial_link']}\n\n")
            
            # Sort notes by timestamp
            sorted_notes = sorted(notes, key=lambda x: x.get("timestamp", "0:00"))
            
            for note in sorted_notes:
                timestamp = note.get("timestamp", "N/A")
                note_text = note.get("note", "")
                if note_text:  # Only add if note text exists
                    all_notes_content.append(f"**[{timestamp}]** {note_text}\n\n")
            
            all_notes_content.append("---\n\n")
    
    if not all_notes_content:
        raise ValueError(f"No notes found in tutorials of group '{group}'")
    
    # Combine all notes
    combined_notes = "".join(all_notes_content)
    
    # Generate comprehensive notes using AI with detailed prompt
    user_prompt = f"""Subject Category: {group}

Notes from {len(tutorials)} tutorial(s) (ordered chronologically from oldest to newest):

{combined_notes}"""
    
    # Note Consolidation: Gemini first, fallback to Groq
    try:
        print("[Consolidated Notes] Calling Gemini...")
        consolidated_notes = gemini_chat_completion(
            messages=[{"role": "user", "content": user_prompt}],
            system_instruction=CONSOLIDATED_NOTES_PROMPT,
            temperature=0.6,
            max_tokens=8000
        )
        print(f"[Consolidated Notes] Gemini succeeded ({len(consolidated_notes)} chars)")
        
    except Exception as gemini_error:
        print(f"[Consolidated Notes] Gemini failed: {str(gemini_error)[:100]}")
        
        # Fallback to Groq
        try:
            print("[Consolidated Notes] Falling back to Groq...")
            # For Groq, add system instruction as first message
            messages = [
                {"role": "system", "content": CONSOLIDATED_NOTES_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
            
            consolidated_notes = groq_chat_completion(
                messages=messages,
                temperature=0.6,
                max_tokens=8000
            )
            print(f"[Consolidated Notes] Groq succeeded ({len(consolidated_notes)} chars)")
            
        except Exception as groq_error:
            print(f"[Consolidated Notes] Groq also failed: {str(groq_error)[:100]}")
            # Fallback: just return the combined notes
            consolidated_notes = combined_notes
    
    return {
        "group": group,
        "notes_content": consolidated_notes,
        "tutorials_included": len(tutorials),
        "message": f"Consolidated notes generated from {len(tutorials)} tutorial(s)"
    }

