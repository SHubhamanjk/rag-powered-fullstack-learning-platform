"""
Embedding and FAISS utilities for Memory Vault
"""

import os
import io
import numpy as np
import faiss
import torch
from typing import Optional, List
from transformers import AutoTokenizer, AutoModel
from dotenv import load_dotenv

# Text extraction libraries
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import easyocr
except ImportError:
    easyocr = None

try:
    import speech_recognition as sr
except ImportError:
    sr = None

try:
    from pydub import AudioSegment
except ImportError:
    AudioSegment = None


load_dotenv()

# Configuration
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DIM = 384
FAISS_INDEX_FILE = "faiss_memory_vault.index"

# Initialize embedding model
tokenizer = None
model = None
faiss_index = None
ocr_reader = None
speech_recognizer = None


def initialize_embedding_model():
    """Initialize the embedding model"""
    global tokenizer, model
    if tokenizer is None or model is None:
        print("🔄 Initializing embedding model...")
        tokenizer = AutoTokenizer.from_pretrained(EMBED_MODEL)
        model = AutoModel.from_pretrained(EMBED_MODEL)
        print("✅ Embedding model initialized")


def initialize_faiss_index():
    """Initialize or load FAISS index"""
    global faiss_index
    if faiss_index is None:
        if os.path.exists(FAISS_INDEX_FILE):
            print(f"📂 Loading existing FAISS index from {FAISS_INDEX_FILE}")
            try:
                faiss_index = faiss.read_index(FAISS_INDEX_FILE)
                print(f"✅ Loaded FAISS index with {faiss_index.ntotal} vectors")
            except Exception as e:
                print(f"⚠️ Error loading FAISS index: {e}")
                print("🆕 Creating new FAISS index")
                faiss_index = faiss.IndexFlatL2(DIM)
        else:
            print("🆕 Creating new FAISS index")
            faiss_index = faiss.IndexFlatL2(DIM)
            print("✅ Created new FAISS index")
    return faiss_index


def save_faiss_index():
    """Save FAISS index to disk"""
    if faiss_index is not None:
        faiss.write_index(faiss_index, FAISS_INDEX_FILE)
        print(f"💾 Saved FAISS index with {faiss_index.ntotal} vectors")


def get_embedding(text: str) -> np.ndarray:
    """Generate embedding for text"""
    initialize_embedding_model()
    
    # Truncate if too long
    max_length = 512
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=max_length)
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    embedding = outputs.last_hidden_state.mean(dim=1).cpu().numpy().flatten().astype("float32")
    return embedding


def add_to_faiss(embedding: np.ndarray) -> int:
    """Add embedding to FAISS index and return the index position"""
    initialize_faiss_index()
    
    # Get current count before adding
    index_position = faiss_index.ntotal
    
    # Add to index
    faiss_index.add(np.array([embedding]))
    save_faiss_index()
    
    return index_position


def search_faiss(query_embedding: np.ndarray, k: int = 5) -> tuple:
    """Search FAISS index for similar embeddings"""
    initialize_faiss_index()
    
    if faiss_index.ntotal == 0:
        print("⚠️ FAISS index is empty! Rebuild needed.")
        return np.array([[float('inf')]]), np.array([[-1]])
    
    D, I = faiss_index.search(query_embedding.reshape(1, -1), min(k, faiss_index.ntotal))
    return D, I


def rebuild_faiss_from_mongodb():
    """Rebuild FAISS index from MongoDB embeddings and update MongoDB indices"""
    global faiss_index
    
    try:
        # Import MongoDB client from environment
        import os
        from pymongo import MongoClient
        from dotenv import load_dotenv
        
        load_dotenv()
        
        # Get MongoDB connection (use same env var as rest of app)
        MONGO_URI = os.getenv("MONGO_URI")
        if not MONGO_URI:
            print("⚠️ MONGO_URI not found in environment")
            return
        
        client = MongoClient(MONGO_URI)
        db = client["medha_ai_backend"]  # Same database name as in db.py
        memory_vault_col = db["memory_vault"]
        
        # Get all documents with embeddings, sorted by creation time for consistency
        docs = list(memory_vault_col.find({"embedding": {"$exists": True}}).sort("created_at", 1))
        
        if not docs:
            print("ℹ️ No documents in MongoDB to rebuild FAISS index")
            return
        
        print(f"🔄 Rebuilding FAISS index from {len(docs)} MongoDB documents...")
        
        # Create new index
        faiss_index = faiss.IndexFlatL2(DIM)
        
        # Add all embeddings in order and update MongoDB with new indices
        embeddings_to_add = []
        for new_index, doc in enumerate(docs):
            embedding = np.array(doc["embedding"], dtype="float32")
            embeddings_to_add.append(embedding)
            
            # Update the document's faiss_index to match its new position
            old_index = doc.get("faiss_index", -1)
            if old_index != new_index:
                memory_vault_col.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"faiss_index": new_index}}
                )
                print(f"  📝 Updated {doc.get('display_name', doc['file_name'])}: faiss_index {old_index} → {new_index}")
        
        if embeddings_to_add:
            embeddings_array = np.array(embeddings_to_add)
            faiss_index.add(embeddings_array)
            save_faiss_index()
            print(f"✅ Rebuilt FAISS index with {faiss_index.ntotal} vectors and updated MongoDB indices")
        
    except Exception as e:
        print(f"⚠️ Error rebuilding FAISS index: {e}")
        import traceback
        traceback.print_exc()
        # Create empty index as fallback
        faiss_index = faiss.IndexFlatL2(DIM)


# Text extraction functions
def extract_text_plain(file_path: str) -> Optional[str]:
    """Extract text from plain text files"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"⚠️ Error reading plain text: {e}")
        return None


def extract_text_pdf(file_path: str) -> Optional[str]:
    """Extract text from PDF files"""
    if fitz is None:
        return None
    
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text.strip() if text.strip() else None
    except Exception as e:
        print(f"⚠️ Error extracting PDF text: {e}")
        return None


def extract_text_image(file_path: str) -> Optional[str]:
    """Extract text from images using OCR"""
    global ocr_reader
    
    if easyocr is None:
        return None
    
    try:
        if ocr_reader is None:
            ocr_reader = easyocr.Reader(['en'])
        
        results = ocr_reader.readtext(file_path)
        text = " ".join([res[1] for res in results])
        return text if text.strip() else None
    except Exception as e:
        print(f"⚠️ Error extracting image text: {e}")
        return None


def convert_audio_to_wav(file_path: str) -> Optional[str]:
    """Convert audio to WAV format"""
    if AudioSegment is None:
        return file_path
    
    try:
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".wav":
            return file_path
        
        print(f"🔄 Converting {ext} to WAV...")
        
        if ext == ".mp3":
            audio = AudioSegment.from_mp3(file_path)
        elif ext == ".flac":
            audio = AudioSegment.from_file(file_path, "flac")
        else:
            audio = AudioSegment.from_file(file_path)
        
        temp_wav = file_path.rsplit(".", 1)[0] + "_temp.wav"
        audio.export(temp_wav, format="wav")
        print("✅ Converted to WAV")
        return temp_wav
    except Exception as e:
        print(f"⚠️ Error converting audio: {e}")
        return file_path


def extract_text_audio(file_path: str) -> Optional[str]:
    """Extract text from audio files using speech recognition"""
    global speech_recognizer
    
    if sr is None:
        return None
    
    temp_wav = None
    try:
        if speech_recognizer is None:
            speech_recognizer = sr.Recognizer()
        
        wav_path = convert_audio_to_wav(file_path)
        temp_wav = wav_path if wav_path != file_path else None
        
        with sr.AudioFile(wav_path) as source:
            speech_recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio_data = speech_recognizer.record(source)
        
        print("🎤 Transcribing audio...")
        transcription = speech_recognizer.recognize_google(audio_data)
        print(f"✅ Transcription complete: {len(transcription)} characters")
        return transcription
    except sr.UnknownValueError:
        print("⚠️ Speech Recognition could not understand audio")
        return None
    except sr.RequestError as e:
        print(f"⚠️ Speech Recognition service error: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Error processing audio: {e}")
        return None
    finally:
        if temp_wav and os.path.exists(temp_wav):
            try:
                os.remove(temp_wav)
            except:
                pass


def extract_text_from_file(file_path: str) -> Optional[str]:
    """Extract text from various file types"""
    ext = os.path.splitext(file_path)[1].lower()
    
    # Text files
    if ext in [".txt", ".env", ".json", ".md", ".py", ".js", ".html", ".css", ".log"]:
        return extract_text_plain(file_path)
    
    # PDF files
    elif ext in [".pdf"]:
        return extract_text_pdf(file_path)
    
    # Image files
    elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"]:
        return extract_text_image(file_path)
    
    # Audio files
    elif ext in [".wav", ".flac", ".mp3", ".m4a", ".aac", ".ogg", ".webm"]:
        return extract_text_audio(file_path)
    
    else:
        print(f"⚠️ Unsupported file type: {ext}")
        return None


# Initialize on import
initialize_faiss_index()

