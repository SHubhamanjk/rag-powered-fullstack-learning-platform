# Medha.ai Backend API Documentation for Frontend Developers

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000` (Development)  
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [User Management](#1-user-management)
   - [AI Study Chat](#2-ai-study-chat)
   - [AI Friend Chat](#3-ai-friend-chat)
   - [Study Session Management](#4-study-session-management)
   - [Tutorial Support](#5-tutorial-support)
   - [Task Management (TODO)](#6-task-management-todo)
   - [Media Processing](#7-media-processing)
   - [Dashboard & Analytics](#8-dashboard--analytics)
4. [Error Handling](#error-handling)
5. [Code Examples](#code-examples)
6. [Best Practices](#best-practices)

---

## Overview

Medha.ai is an AI-powered educational platform that provides:
- **AI Study Chat**: Personalized study assistance with context-aware conversations
- **AI Friend Chat**: Mental health companion with CBT/mindfulness approach
- **Study Sessions with RAG**: Create study sessions with materials and get AI assistance using Retrieval-Augmented Generation
- **Tutorial Support**: Take notes on YouTube tutorials, generate quizzes, and create mindmaps
- **Task Management**: Create and manage todos with AI assistance
- **Media Processing**: Speech-to-Text and Text-to-Speech capabilities
- **Analytics Dashboard**: Comprehensive overview of user activities

### Tech Stack
- **Backend:** FastAPI, Python 3.11
- **Database:** MongoDB
- **AI/LLM:** Groq API (gemma2-9b-it)
- **Speech:** Groq Whisper (STT), Kokoro (TTS)
- **RAG:** FAISS + SentenceTransformers
- **Graphs:** Graphviz

---

## Authentication

### 🔐 JWT Authentication

All API endpoints require JWT authentication **except**:
- `POST /user/create` - User registration
- `POST /user/login` - User login
- `POST /user/forgot-password` - Password reset initiation
- `POST /user/verify-otp` - OTP verification
- `GET /` - Health check

### How It Works

1. **Register or Login** to get a JWT token
2. **Include the token** in all subsequent requests using the `Authorization` header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN_HERE
   ```
3. **Token expires after 7 days** - users need to re-login after expiration

### Authentication Flow

```
1. User registers/logs in
   ↓
2. Backend returns JWT token + user details
   ↓
3. Frontend stores token securely
   ↓
4. Include token in Authorization header for all requests
   ↓
5. Token validated on each request
```

### Token Format

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Authentication Errors

| Status Code | Error | Description |
|------------|-------|-------------|
| 401 | Unauthorized | Invalid, missing, or expired token |
| 403 | Forbidden | Valid token but insufficient permissions |

---

## API Endpoints

## 1. User Management

**Prefix:** `/user`  
**Tag:** User Management

### 1.1 Create User (Register)

**Endpoint:** `POST /user/create`  
**Authentication:** ❌ Not Required  
**Description:** Register a new user and receive JWT token

**Request Body:**
```json
{
  "name": "Alice Johnson",
  "age": 20,
  "gender": "Female",
  "email": "alice@example.com",
  "password": "securepass123",
  "educational_details": {
    "institution": "Stanford University",
    "degree": "Bachelor's",
    "field_of_study": "Computer Science",
    "grade": "A",
    "year_of_study": "3rd Year"
  }
}
```

**Required Fields:**
- `name` (string, min 1 character)
- `email` (valid email)
- `password` (string, min 6 characters)

**Optional Fields:**
- `age` (integer, 1-150)
- `gender` (string)
- `educational_details` (object)

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input or email already exists
- `500 Internal Server Error` - Server error

---

### 1.2 Login User

**Endpoint:** `POST /user/login`  
**Authentication:** ❌ Not Required  
**Description:** Login with email and password, receive JWT token

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "securepass123"
}
```

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

---

### 1.3 Get User Details

**Endpoint:** `GET /user/me`  
**Authentication:** ✅ Required  
**Description:** Get authenticated user's profile details (without password)

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "age": 20,
  "gender": "Female",
  "educational_details": {
    "institution": "Stanford University",
    "degree": "Bachelor's",
    "field_of_study": "Computer Science",
    "grade": "A",
    "year_of_study": "3rd Year"
  },
  "created_at": "2025-01-15T10:30:00",
  "updated_at": "2025-01-16T14:20:00"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

### 1.4 Update User Profile

**Endpoint:** `PUT /user/me`  
**Authentication:** ✅ Required  
**Description:** Update authenticated user's profile information

**Request Body:** (All fields optional)
```json
{
  "name": "Alice Johnson Updated",
  "age": 21,
  "gender": "Female",
  "password": "newsecurepass123",
  "educational_details": {
    "institution": "Stanford University",
    "year_of_study": "4th Year"
  }
}
```

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "message": "User updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid token
- `404 Not Found` - User not found

---

### 1.5 Forgot Password

**Endpoint:** `POST /user/forgot-password`  
**Authentication:** ❌ Not Required  
**Description:** Initiate password reset process. Sends a 6-digit OTP to user's email (expires in 10 minutes)

**Request Body:**
```json
{
  "email": "alice@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent to your email",
  "email": "alice@example.com"
}
```

---

### 1.6 Verify OTP

**Endpoint:** `POST /user/verify-otp`  
**Authentication:** ❌ Not Required  
**Description:** Verify the OTP sent to user's email. Returns a reset_token if valid

**Request Body:**
```json
{
  "email": "alice@example.com",
  "otp": "123456"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP verified successfully",
  "verified": true,
  "reset_token": "abc123xyz456"
}
```

---

### 1.7 Reset Password

**Endpoint:** `POST /user/reset-password`  
**Authentication:** ❌ Not Required  
**Description:** Reset user password with verified reset token

**Request Body:**
```json
{
  "email": "alice@example.com",
  "reset_token": "abc123xyz456",
  "new_password": "NewSecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully",
  "success": true
}
```

---

## 2. AI Study Chat

**Prefix:** `/chat`  
**Tag:** AI Study Chat

AI-powered study assistant with persistent chat sessions and context-aware responses.

### 2.1 Create Chat Session

**Endpoint:** `POST /chat/create`  
**Authentication:** ✅ Required  
**Description:** Create a new empty chat session for the authenticated user

**Request Body:** None

**Response:** `200 OK`
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "message": "Chat created successfully"
}
```

---

### 2.2 Send Message to AI

**Endpoint:** `POST /chat/`  
**Authentication:** ✅ Required  
**Description:** Send a message to the AI study assistant

**Request Body:**
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "message": "Explain quantum physics"
}
```

**Fields:**
- `chat_id` (optional): If provided, continues existing conversation. If null/empty, creates new chat
- `message` (required): Your question or message to the AI

**Response:** `200 OK`
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "response": "Quantum physics is the study of matter and energy at the atomic and subatomic level...",
  "title": "Explain quantum physics"
}
```

**Notes:**
- Auto-generates chat title from first message
- Maintains context of last 40 messages (20 exchanges)
- Responses are comprehensive and educational

---

### 2.3 Get Chat History

**Endpoint:** `GET /chat/{chat_id}`  
**Authentication:** ✅ Required  
**Description:** Get complete chat history for a specific chat

**Path Parameters:**
- `chat_id` (required): Chat ID

**Response:** `200 OK`
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "user_email": "alice@example.com",
  "title": "Explain quantum physics",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum physics",
      "timestamp": "2025-01-15T10:30:00"
    },
    {
      "role": "assistant",
      "content": "Quantum physics is the study of...",
      "timestamp": "2025-01-15T10:30:05"
    }
  ],
  "created_at": "2025-01-15T10:30:00",
  "updated_at": "2025-01-15T10:30:05"
}
```

---

### 2.4 Get All User Chats

**Endpoint:** `GET /chat/my-chats`  
**Authentication:** ✅ Required  
**Description:** Get all chat sessions for the authenticated user

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "chats": [
    {
      "chat_id": "507f1f77bcf86cd799439011",
      "title": "Explain quantum physics",
      "created_at": "2025-01-15T10:30:00",
      "updated_at": "2025-01-15T10:35:00",
      "message_count": 10
    }
  ]
}
```

**Notes:**
- Chats are sorted by most recently updated first
- Includes chat summaries with message counts

---

### 2.5 Delete Chat

**Endpoint:** `DELETE /chat/{chat_id}`  
**Authentication:** ✅ Required  
**Description:** Delete a chat session

**Path Parameters:**
- `chat_id` (required): Chat ID to delete

**Response:** `200 OK`
```json
{
  "message": "Chat deleted successfully",
  "chat_id": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**
- `404 Not Found` - Chat not found or user doesn't own the chat

---

## 3. AI Friend Chat

**Prefix:** `/friend-chat`  
**Tag:** AI Friend Chat

AI mental health companion with CBT/mindfulness approach. Provides empathetic, supportive conversations in a friendly tone (supports Hinglish).

### 3.1 Create Friend Chat Session

**Endpoint:** `POST /friend-chat/create`  
**Authentication:** ✅ Required  
**Description:** Create a new friend chat session

**Request Body:** None

**Response:** `200 OK`
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "message": "Friend chat created successfully"
}
```

---

### 3.2 Send Message to AI Friend

**Endpoint:** `POST /friend-chat/`  
**Authentication:** ✅ Required  
**Description:** Send a message to your AI friend companion

**Request Body:**
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "message": "Hey, how's your day going?"
}
```

**Response:** `200 OK`
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "response": "My day is going great! Thanks for asking. How about yours?",
  "title": "Hey, how's your day"
}
```

**Notes:**
- Similar to Study Chat, but with a more casual, friendly tone
- Focuses on emotional support and mental wellness
- Can handle mix of English and Hindi (Hinglish)

---

### 3.3 Get Friend Chat History

**Endpoint:** `GET /friend-chat/{chat_id}`  
**Authentication:** ✅ Required  
**Description:** Get complete friend chat history

**Path Parameters:**
- `chat_id` (required): Chat ID

**Response:** `200 OK`
```json
{
  "chat_id": "507f1f77bcf86cd799439011",
  "user_email": "alice@example.com",
  "title": "Hey, how's your day",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how's your day going?",
      "timestamp": "2025-01-15T10:30:00"
    },
    {
      "role": "assistant",
      "content": "My day is going great!",
      "timestamp": "2025-01-15T10:30:05"
    }
  ],
  "created_at": "2025-01-15T10:30:00",
  "updated_at": "2025-01-15T10:30:05"
}
```

---

### 3.4 Get All Friend Chats

**Endpoint:** `GET /friend-chat/my-chats`  
**Authentication:** ✅ Required  
**Description:** Get all friend chat sessions for authenticated user

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "chats": [
    {
      "chat_id": "507f1f77bcf86cd799439011",
      "title": "Hey, how's your day",
      "created_at": "2025-01-15T10:30:00",
      "updated_at": "2025-01-15T10:35:00",
      "message_count": 10
    }
  ]
}
```

---

### 3.5 Delete Friend Chat

**Endpoint:** `DELETE /friend-chat/{chat_id}`  
**Authentication:** ✅ Required  
**Description:** Delete a friend chat session

**Path Parameters:**
- `chat_id` (required): Chat ID to delete

**Response:** `200 OK`
```json
{
  "message": "Friend chat deleted successfully",
  "chat_id": "507f1f77bcf86cd799439011"
}
```

---

## 4. Study Session Management

**Prefix:** `/study-session`  
**Tag:** Study Session Management

Create study sessions with materials and get AI assistance using RAG (Retrieval-Augmented Generation). Upload study resources, syllabus, and PYQs to get context-aware AI responses.

### 4.1 Create Study Session

**Endpoint:** `POST /study-session/create`  
**Authentication:** ✅ Required  
**Description:** Create a new study session with RAG indexing

**Request Body:**
```json
{
  "subject": "Physics",
  "grade": "12th Grade",
  "study_details": "Thermodynamics and Heat Transfer",
  "resources_text": "Chapter notes on laws of thermodynamics...",
  "pyq_text": "Previous year questions from 2020-2023",
  "syllabus_text": "Unit 1: Thermodynamics, Unit 2: Heat Transfer..."
}
```

**Required Fields:**
- `subject` (string): Subject name
- `grade` (string): Grade level
- `study_details` (string): Main topic or chapter details

**Optional Fields:**
- `resources_text` (string): Study materials/notes
- `pyq_text` (string): Previous year questions
- `syllabus_text` (string): Syllabus content

**Response:** `200 OK`
```json
{
  "session_id": "session_abc123",
  "session_name": "Physics - Thermodynamics and Heat Transfer",
  "message": "Study session created successfully with RAG indexing"
}
```

**Notes:**
- Creates FAISS index from all text content for RAG
- Embeddings are pre-computed and stored in DB for fast retrieval
- Session name is auto-generated from subject and study details

---

### 4.2 AI Study Assistant with RAG

**Endpoint:** `POST /study-session/chat`  
**Authentication:** ✅ Required  
**Description:** Ask questions about your study materials. AI uses RAG to retrieve relevant content

**Request Body:**
```json
{
  "session_id": "session_abc123",
  "question": "Explain the first law of thermodynamics"
}
```

**Response:** `200 OK`
```json
{
  "session_id": "session_abc123",
  "response": "Based on your study materials, the first law of thermodynamics states..."
}
```

**Features:**
- Uses RAG to retrieve relevant content from uploaded materials
- Maintains last 40 messages for context
- Provides detailed, comprehensive explanations
- Suggests follow-up questions and learning activities
- Can offer to generate quizzes and mindmaps

---

### 4.3 Get All Study Sessions

**Endpoint:** `GET /study-session/my-sessions`  
**Authentication:** ✅ Required  
**Description:** Get all study sessions for authenticated user

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "sessions": [
    {
      "session_id": "session_abc123",
      "session_name": "Physics - Thermodynamics",
      "subject": "Physics",
      "grade": "12th Grade",
      "created_at": "2025-01-15T10:00:00",
      "updated_at": "2025-01-15T15:30:00"
    }
  ]
}
```

---

### 4.4 Get Session Details

**Endpoint:** `GET /study-session/{session_id}`  
**Authentication:** ✅ Required  
**Description:** Get complete session details including chat history

**Path Parameters:**
- `session_id` (required): Study session ID

**Response:** `200 OK`
```json
{
  "session_id": "session_abc123",
  "session_name": "Physics - Thermodynamics",
  "email": "alice@example.com",
  "metadata": {
    "subject": "Physics",
    "grade": "12th Grade",
    "study_details": "Thermodynamics and Heat Transfer",
    "resources_text": "Chapter notes...",
    "pyq_text": "Previous year questions...",
    "syllabus_text": "Unit 1: Thermodynamics..."
  },
  "chat_history": [
    {
      "role": "user",
      "content": "Explain the first law",
      "timestamp": "2025-01-15T10:30:00"
    }
  ],
  "created_at": "2025-01-15T10:00:00",
  "updated_at": "2025-01-15T15:30:00"
}
```

---

### 4.5 Update Study Session

**Endpoint:** `PUT /study-session/update`  
**Authentication:** ✅ Required  
**Description:** Update study session details

**Request Body:** (All fields optional)
```json
{
  "session_id": "session_abc123",
  "session_name": "Updated Session Name",
  "subject": "Physics",
  "grade": "12th Grade",
  "study_details": "Updated details",
  "resources_text": "Updated resources",
  "pyq_text": "Updated PYQ",
  "syllabus_text": "Updated syllabus"
}
```

**Response:** `200 OK`
```json
{
  "session_id": "session_abc123",
  "message": "Study session updated successfully"
}
```

**Note:** Updating text content will rebuild the RAG index

---

### 4.6 Delete Study Session

**Endpoint:** `DELETE /study-session/{session_id}`  
**Authentication:** ✅ Required  
**Description:** Delete a study session

**Path Parameters:**
- `session_id` (required): Session ID to delete

**Response:** `200 OK`
```json
{
  "session_id": "session_abc123",
  "message": "Study session deleted successfully"
}
```

---

### 4.7 Generate Quiz from Session

**Endpoint:** `POST /study-session/quiz/generate`  
**Authentication:** ✅ Required  
**Description:** Generate a quiz based on the study session

**Request Body:**
```json
{
  "session_id": "session_abc123"
}
```

**Response:** `200 OK`
```json
{
  "session_id": "session_abc123",
  "quiz_id": "quiz_xyz789",
  "mcq_questions": [
    {
      "question_id": "q1",
      "question": "What is the first law of thermodynamics?",
      "options": [
        "Energy cannot be created or destroyed",
        "Heat flows from hot to cold",
        "Entropy always increases",
        "Work equals force times distance"
      ],
      "correct_answer_index": 0
    }
  ],
  "descriptive_questions": [
    {
      "question_id": "q21",
      "question": "Explain the concept of entropy in thermodynamics",
      "expected_answer": "Entropy is a measure of disorder..."
    }
  ],
  "message": "Quiz generated successfully: 20 MCQs + 5 Descriptive questions"
}
```

**Features:**
- Generates 20 MCQs and 5 descriptive questions
- Based on chat history, syllabus, PYQ patterns, and study materials
- Quiz is stored in the session for future reference

---

### 4.8 Generate Mindmap from Session

**Endpoint:** `POST /study-session/mindmap/generate`  
**Authentication:** ✅ Required  
**Description:** Generate mindmaps visualizing concepts from the session

**Request Body:**
```json
{
  "session_id": "session_abc123"
}
```

**Response:** `200 OK`
```json
{
  "session_id": "session_abc123",
  "mindmaps": [
    {
      "mindmap_id": "mindmap_1",
      "title": "Laws of Thermodynamics",
      "description": "Overview of the four laws",
      "image_b64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "created_at": "2025-01-15T10:30:00"
    }
  ],
  "message": "Generated 2 mindmaps successfully"
}
```

**Features:**
- Analyzes chat history and study materials
- Generates 1-3 mindmaps visualizing key concepts
- Returns base64 PNG images
- Mindmaps are stored in the session

---

## 5. Tutorial Support

**Prefix:** `/tutorial-support`  
**Tag:** Tutorial Support Management

Take notes on YouTube tutorials, generate quizzes from transcripts, create mindmaps, and chat with AI about tutorial content.

### 5.1 Create Tutorial Session

**Endpoint:** `POST /tutorial-support/create`  
**Authentication:** ✅ Required  
**Description:** Create a new tutorial support session from YouTube link

**Request Body:**
```json
{
  "tutorial_link": "https://youtube.com/watch?v=abc123"
}
```

**Response:** `200 OK`
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "title": "Introduction to Python Programming",
  "message": "Tutorial session created successfully"
}
```

**Note:** Title is automatically extracted from the YouTube video

---

### 5.2 Add Note to Tutorial

**Endpoint:** `POST /tutorial-support/notes/add`  
**Authentication:** ✅ Required  
**Description:** Add a timestamped note to a tutorial

**Request Body:**
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "note": "Important: Variables are declared using let or const",
  "timestamp": "10:25"
}
```

**Fields:**
- `tutorial_id` (required): Tutorial ID
- `note` (required): Note content
- `timestamp` (required): Video timestamp in format "MM:SS" or "HH:MM:SS"

**Response:** `200 OK`
```json
{
  "message": "Note added successfully",
  "note_id": "note_123abc"
}
```

---

### 5.3 Get All Notes

**Endpoint:** `GET /tutorial-support/notes?tutorial_id={tutorial_id}`  
**Authentication:** ✅ Required  
**Description:** Get all notes for a tutorial in chronological order

**Query Parameters:**
- `tutorial_id` (required): Tutorial ID

**Response:** `200 OK`
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "tutorial_link": "https://youtube.com/watch?v=abc123",
  "title": "Introduction to Python Programming",
  "notes": [
    {
      "note_id": "note_123",
      "note": "Variables are declared using let or const",
      "timestamp": "10:25",
      "datetime": "2025-01-15T10:30:00"
    }
  ]
}
```

---

### 5.4 Update Note

**Endpoint:** `PUT /tutorial-support/notes/{note_id}`  
**Authentication:** ✅ Required  
**Description:** Update a specific note

**Path Parameters:**
- `note_id` (required): Note ID

**Request Body:**
```json
{
  "updated_text": "Variables in JavaScript are declared using let, const, or var"
}
```

**Response:** `200 OK`
```json
{
  "message": "Note updated successfully",
  "note_id": "note_123abc"
}
```

---

### 5.5 Delete Note

**Endpoint:** `DELETE /tutorial-support/notes/{note_id}`  
**Authentication:** ✅ Required  
**Description:** Delete a specific note

**Path Parameters:**
- `note_id` (required): Note ID

**Response:** `200 OK`
```json
{
  "message": "Note deleted successfully",
  "note_id": "note_123abc"
}
```

---

### 5.6 Prettify Notes

**Endpoint:** `POST /tutorial-support/notes/prettify`  
**Authentication:** ✅ Required  
**Description:** Generate prettified, well-organized notes using AI

**Request Body:**
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011"
}
```

**Response:** `200 OK`
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "title": "Introduction to Python Programming",
  "prettified_notes": "# Introduction to Python Programming\n\n## Variables (10:25)\n- Variables are declared using let or const...\n\n## Data Types (15:30)\n- JavaScript has several data types..."
}
```

**Note:** Formats existing notes nicely without adding new information

---

### 5.7 Generate Detailed Notes

**Endpoint:** `POST /tutorial-support/notes/detailed`  
**Authentication:** ✅ Required  
**Description:** Generate comprehensive, detailed study notes using AI

**Request Body:**
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011"
}
```

**Response:** `200 OK`
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "title": "Introduction to Python Programming",
  "detailed_notes": "# Complete Study Notes: Introduction to Python Programming\n\n## Overview\nThis tutorial covers fundamental concepts...\n\n## Variables\nVariables are named storage locations in memory..."
}
```

**Note:** Expands on concepts to create complete study material

---

### 5.8 Get All Tutorials

**Endpoint:** `GET /tutorial-support/my-tutorials`  
**Authentication:** ✅ Required  
**Description:** Get all tutorial sessions for authenticated user

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "tutorials": [
    {
      "tutorial_id": "507f1f77bcf86cd799439011",
      "title": "Introduction to Python Programming",
      "tutorial_link": "https://youtube.com/watch?v=abc123",
      "notes_count": 15,
      "created_at": "2025-01-15T10:00:00",
      "updated_at": "2025-01-15T15:30:00"
    }
  ]
}
```

---

### 5.9 AI Companion Chat

**Endpoint:** `POST /tutorial-support/chat`  
**Authentication:** ✅ Required  
**Description:** Ask AI questions about the tutorial content

**Request Body:**
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "question": "Can you explain what variables are in more detail?"
}
```

**Response:** `200 OK`
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "question": "Can you explain what variables are in more detail?",
  "answer": "Great question! Variables are like containers that store data in your program..."
}
```

**Features:**
- Maintains conversation context
- References tutorial notes and content
- Perfect for clarifying concepts

---

### 5.10 Generate Quiz from Transcript

**Endpoint:** `POST /tutorial-support/quiz/generate`  
**Authentication:** ✅ Required  
**Description:** Generate quiz from YouTube video transcript

**Request Body:**
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "from_timestamp": "10:00",
  "to_timestamp": "25:00"
}
```

**Fields:**
- `tutorial_id` (required): Tutorial ID
- `from_timestamp` (optional): Start timestamp, defaults to "0:00"
- `to_timestamp` (optional): End timestamp, defaults to video end

**Response:** `200 OK`
```json
{
  "quiz_id": "quiz_abc123",
  "tutorial_id": "507f1f77bcf86cd799439011",
  "tutorial_title": "Python Tutorial",
  "from_timestamp": "10:00",
  "to_timestamp": "25:00",
  "mcq_questions": [
    {
      "question_id": "q1",
      "question": "What is a variable in Python?",
      "options": [
        "A storage container for data",
        "A function",
        "A loop",
        "A class"
      ],
      "correct_answer_index": 0
    }
  ],
  "descriptive_questions": [
    {
      "question_id": "q21",
      "question": "Explain how to declare variables in Python",
      "expected_answer": "In Python, variables are declared by..."
    }
  ],
  "total_questions": 25,
  "created_at": "2025-01-19T10:00:00",
  "message": "Quiz generated successfully"
}
```

**Features:**
- Generates 20 MCQs and 5 descriptive questions
- Based on actual video transcript content
- Supports time range selection

---

### 5.11 Evaluate Quiz

**Endpoint:** `POST /tutorial-support/quiz/evaluate`  
**Authentication:** ✅ Required  
**Description:** Evaluate quiz answers and generate performance report

**Request Body:**
```json
{
  "quiz_id": "quiz_abc123",
  "answers": [
    {
      "question_id": "q1",
      "answer": 0
    },
    {
      "question_id": "q21",
      "answer": "Variables in Python are declared by assigning a value..."
    }
  ]
}
```

**Answer Format:**
- MCQ answers: integer (0-3, the option index)
- Descriptive answers: string (your written answer)

**Response:** `200 OK`
```json
{
  "quiz_id": "quiz_abc123",
  "tutorial_id": "507f1f77bcf86cd799439011",
  "total_score": 38.5,
  "max_score": 70.0,
  "percentage": 55.0,
  "mcq_score": 15.0,
  "descriptive_score": 23.5,
  "results": [
    {
      "question_id": "q1",
      "question": "What is a variable?",
      "user_answer": 0,
      "correct_answer": 0,
      "is_correct": true,
      "score": 1.0,
      "max_score": 1.0,
      "feedback": "Correct!"
    }
  ],
  "overall_feedback": "Good effort! You have a solid understanding of basics.",
  "strengths": ["Clear understanding of variable concepts", "Good explanations"],
  "areas_for_improvement": ["Advanced concepts need more practice"],
  "study_suggestions": ["Review loops and functions", "Practice more coding exercises"],
  "evaluated_at": "2025-01-19T11:00:00"
}
```

**Features:**
- Auto-evaluates MCQs
- AI evaluates descriptive answers
- Provides detailed feedback, strengths, weaknesses, and study suggestions
- Scoring: MCQs (1 mark each), Descriptive (10 marks each)

---

### 5.12 Get Quiz Details

**Endpoint:** `GET /tutorial-support/quiz/{quiz_id}`  
**Authentication:** ✅ Required  
**Description:** Get complete quiz details including evaluation report

**Path Parameters:**
- `quiz_id` (required): Quiz ID

**Response:** `200 OK`
```json
{
  "quiz_id": "quiz_abc123",
  "tutorial_id": "507f1f77bcf86cd799439011",
  "tutorial_title": "Python Tutorial",
  "from_timestamp": "10:00",
  "to_timestamp": "25:00",
  "mcq_questions": [...],
  "descriptive_questions": [...],
  "is_evaluated": true,
  "evaluation_report": {
    "total_score": 38.5,
    "percentage": 55.0,
    ...
  },
  "created_at": "2025-01-19T10:00:00"
}
```

---

### 5.13 Get Tutorial Quizzes

**Endpoint:** `GET /tutorial-support/quiz/tutorial/{tutorial_id}`  
**Authentication:** ✅ Required  
**Description:** Get all quizzes for a specific tutorial

**Path Parameters:**
- `tutorial_id` (required): Tutorial ID

**Response:** `200 OK`
```json
{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "tutorial_title": "Python Tutorial",
  "quizzes": [
    {
      "quiz_id": "quiz_abc123",
      "tutorial_id": "507f1f77bcf86cd799439011",
      "tutorial_title": "Python Tutorial",
      "from_timestamp": "10:00",
      "to_timestamp": "25:00",
      "total_questions": 25,
      "is_evaluated": true,
      "score": 38.5,
      "percentage": 55.0,
      "created_at": "2025-01-19T10:00:00"
    }
  ]
}
```

---

### 5.14 Get All User Quizzes

**Endpoint:** `GET /tutorial-support/quiz/my-quizzes`  
**Authentication:** ✅ Required  
**Description:** Get all quizzes across all tutorials for authenticated user

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "quizzes": [
    {
      "quiz_id": "quiz_abc123",
      "tutorial_id": "507f1f77bcf86cd799439011",
      "tutorial_title": "Python Tutorial",
      "from_timestamp": "10:00",
      "to_timestamp": "25:00",
      "total_questions": 25,
      "is_evaluated": true,
      "score": 38.5,
      "percentage": 55.0,
      "created_at": "2025-01-19T10:00:00"
    }
  ]
}
```

---

### 5.15 Generate Mindmaps from Notes

**Endpoint:** `POST /tutorial-support/mindmap/generate`  
**Authentication:** ✅ Required  
**Description:** Generate mindmaps from tutorial notes

**Request Body:**
```json
{
  "tutorial_id": "tutorial_abc123"
}
```

**Response:** `200 OK`
```json
{
  "tutorial_id": "tutorial_abc123",
  "mindmaps": [
    {
      "mindmap_id": "mindmap_1",
      "title": "Introduction to Python",
      "description": "Covers basic syntax, variables, and data types",
      "image_b64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "created_at": "2024-01-15T10:30:00"
    }
  ],
  "message": "Generated 2 mindmaps successfully"
}
```

**Features:**
- Analyzes all notes from the tutorial
- Determines optimal number of mindmaps (1-5)
- Generates mindmap structures using AI
- Renders as base64 PNG images
- Saves to tutorial document

---

### 5.16 Get Tutorial Mindmaps

**Endpoint:** `GET /tutorial-support/mindmap/{tutorial_id}`  
**Authentication:** ✅ Required  
**Description:** Get all mindmaps for a tutorial

**Path Parameters:**
- `tutorial_id` (required): Tutorial ID

**Response:** `200 OK`
```json
{
  "tutorial_id": "tutorial_abc123",
  "mindmaps": [
    {
      "mindmap_id": "mindmap_1",
      "title": "Introduction to Python",
      "description": "Covers basic syntax, variables, and data types",
      "image_b64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

## 6. Task Management (TODO)

**Prefix:** `/todo`  
**Tag:** Task Management

Create and manage todos with AI assistance. AI can help you break down tasks, provide guidance, and answer questions.

### 6.1 Create TODO

**Endpoint:** `POST /todo/create`  
**Authentication:** ✅ Required  
**Description:** Create a new todo task

**Request Body:**
```json
{
  "task": "Complete project documentation",
  "date": "2024-01-20",
  "description": "Write comprehensive API docs and user guide"
}
```

**Required Fields:**
- `task` (string): Task name

**Optional Fields:**
- `date` (string): Target date in format "YYYY-MM-DD", defaults to today
- `description` (string): Task description

**Response:** `200 OK`
```json
{
  "todo_id": "todo_abc123",
  "message": "Todo created successfully"
}
```

---

### 6.2 Update TODO

**Endpoint:** `PUT /todo/update`  
**Authentication:** ✅ Required  
**Description:** Update an existing todo

**Request Body:** (All fields except todo_id are optional)
```json
{
  "todo_id": "todo_abc123",
  "task": "Updated task name",
  "date": "2024-01-25",
  "description": "Updated description",
  "status": "in_progress"
}
```

**Status Values:**
- `pending` - Not started yet
- `in_progress` - Currently working on it
- `done` - Completed

**Response:** `200 OK`
```json
{
  "todo_id": "todo_abc123",
  "message": "Todo updated successfully"
}
```

---

### 6.3 Mark TODO as Done

**Endpoint:** `PUT /todo/mark-done`  
**Authentication:** ✅ Required  
**Description:** Mark a todo as done

**Request Body:**
```json
{
  "todo_id": "todo_abc123"
}
```

**Response:** `200 OK`
```json
{
  "todo_id": "todo_abc123",
  "message": "Todo marked as done",
  "status": "done"
}
```

---

### 6.4 Delete TODO

**Endpoint:** `DELETE /todo/{todo_id}`  
**Authentication:** ✅ Required  
**Description:** Delete a todo

**Path Parameters:**
- `todo_id` (required): TODO ID

**Response:** `200 OK`
```json
{
  "todo_id": "todo_abc123",
  "message": "Todo deleted successfully"
}
```

---

### 6.5 Get All TODOs

**Endpoint:** `GET /todo/my-todos`  
**Authentication:** ✅ Required  
**Description:** Get all todos for authenticated user

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "todos": [
    {
      "todo_id": "todo_abc123",
      "email": "alice@example.com",
      "task": "Complete project documentation",
      "description": "Write comprehensive API docs",
      "status": "in_progress",
      "date": "2024-01-20",
      "created_at": "2024-01-15T10:00:00",
      "updated_at": "2024-01-16T14:30:00"
    }
  ]
}
```

**Note:** Todos are sorted by date (most recent first)

---

### 6.6 Filter TODOs by Status

**Endpoint:** `GET /todo/filter?status={status}`  
**Authentication:** ✅ Required  
**Description:** Get todos filtered by status

**Query Parameters:**
- `status` (required): Filter by status - `pending`, `in_progress`, or `done`

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "status": "in_progress",
  "todos": [...]
}
```

---

### 6.7 AI TODO Help

**Endpoint:** `POST /todo/help`  
**Authentication:** ✅ Required  
**Description:** Get AI assistance for completing a todo

**Request Body:**
```json
{
  "todo_id": "todo_abc123",
  "question": "How should I start this task?"
}
```

**Response:** `200 OK`
```json
{
  "todo_id": "todo_abc123",
  "response": "Great question! Here's a step-by-step approach to get started:\n\n1. First, gather all necessary resources...\n2. Create an outline...\n3. Break down into smaller subtasks..."
}
```

**Features:**
- Provides step-by-step guidance
- Asks clarifying questions when needed
- Maintains chat history for context
- Helps with task breakdown and planning

---

### 6.8 Get TODO Chat History

**Endpoint:** `GET /todo/chat-history/{todo_id}`  
**Authentication:** ✅ Required  
**Description:** Get chat history between user and AI for a specific todo

**Path Parameters:**
- `todo_id` (required): TODO ID

**Response:** `200 OK`
```json
{
  "todo_id": "todo_abc123",
  "task": "Complete project documentation",
  "chat_history": [
    {
      "role": "user",
      "content": "How should I start this task?",
      "timestamp": "2025-01-15T10:30:00"
    },
    {
      "role": "assistant",
      "content": "Great question! Here's a step-by-step approach...",
      "timestamp": "2025-01-15T10:30:05"
    }
  ]
}
```

---

## 7. Media Processing

**Prefix:** `/stt` and `/tts`  
**Tag:** Media Processing

Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities.

### 7.1 Speech-to-Text

**Endpoint:** `POST /stt`  
**Authentication:** ✅ Required  
**Description:** Convert audio file to text using Groq Whisper

**Request:** `multipart/form-data`
- `audio` (file): Audio file upload

**Response:** `200 OK`
```json
{
  "text": "Hello, this is a test transcription of the audio file."
}
```

**Supported Audio Formats:**
- MP3, WAV, M4A, FLAC, OGG, WebM
- Max file size depends on Groq API limits

---

### 7.2 Text-to-Speech

**Endpoint:** `POST /tts`  
**Authentication:** ✅ Required  
**Description:** Convert text to speech using Kokoro TTS

**Request Body:**
```json
{
  "text": "Generate audio for this sentence."
}
```

**Response:** `200 OK`
```json
{
  "audio_url": "data:audio/wav;base64,UklGRiQAAABXQVZFZm10..."
}
```

**Notes:**
- Returns base64 encoded WAV audio
- Sample rate: 24kHz
- Format: WAV

---

## 8. Dashboard & Analytics

**Prefix:** `/dashboard`  
**Tag:** Analytics & Dashboard

Get comprehensive overview of all user activities in one endpoint.

### 8.1 Get Dashboard

**Endpoint:** `GET /dashboard/`  
**Authentication:** ✅ Required  
**Description:** Get comprehensive dashboard analytics for authenticated user

**Response:** `200 OK`
```json
{
  "email": "alice@example.com",
  "analytics": {
    "total_study_chats": 5,
    "total_friend_chats": 3,
    "total_study_sessions": 4,
    "total_tutorials": 2,
    "total_todos": 10,
    "todos_pending": 3,
    "todos_in_progress": 2,
    "todos_done": 5,
    "total_quizzes": 8,
    "total_mindmaps": 6
  },
  "study_chats": [
    {
      "chat_id": "507f1f77bcf86cd799439011",
      "title": "Quantum Physics",
      "message_count": 15,
      "created_at": "2025-01-15T10:00:00",
      "last_updated": "2025-01-15T15:30:00"
    }
  ],
  "friend_chats": [
    {
      "chat_id": "507f1f77bcf86cd799439012",
      "title": "Mental Health Check-in",
      "message_count": 8,
      "created_at": "2025-01-14T09:00:00",
      "last_updated": "2025-01-14T10:00:00"
    }
  ],
  "study_sessions": [
    {
      "session_id": "session_abc123",
      "session_name": "Physics - Thermodynamics",
      "subject": "Physics",
      "grade": "12th Grade",
      "chat_message_count": 25,
      "quizzes": [
        {
          "quiz_id": "quiz_xyz789",
          "generated_at": "2025-01-15T12:00:00",
          "total_questions": 25,
          "mcq_count": 20,
          "descriptive_count": 5
        }
      ],
      "mindmaps": [
        {
          "mindmap_id": "mindmap_1",
          "generated_at": "2025-01-15T13:00:00",
          "mindmap_count": 2
        }
      ],
      "created_at": "2025-01-15T10:00:00",
      "updated_at": "2025-01-15T15:30:00"
    }
  ],
  "tutorials": [
    {
      "tutorial_id": "507f1f77bcf86cd799439011",
      "title": "Python Programming Basics",
      "tutorial_link": "https://youtube.com/watch?v=abc123",
      "notes_count": 12,
      "chat_message_count": 8,
      "quizzes": [
        {
          "quiz_id": "quiz_abc123",
          "from_timestamp": "10:00",
          "to_timestamp": "25:00",
          "generated_at": "2025-01-16T10:00:00",
          "total_questions": 25,
          "mcq_count": 20,
          "descriptive_count": 5,
          "evaluated": true,
          "marks_obtained": 38.5,
          "total_marks": 70.0
        }
      ],
      "mindmaps": [
        {
          "mindmap_id": "mindmap_1",
          "generated_at": "2025-01-16T11:00:00",
          "mindmap_count": 3
        }
      ],
      "created_at": "2025-01-16T09:00:00",
      "updated_at": "2025-01-16T14:00:00"
    }
  ],
  "todos": [
    {
      "todo_id": "todo_abc123",
      "task": "Complete project documentation",
      "description": "Write comprehensive API docs",
      "status": "in_progress",
      "date": "2024-01-20",
      "created_at": "2024-01-15T10:00:00",
      "updated_at": "2024-01-16T14:30:00"
    }
  ]
}
```

**Features:**
- All data in one endpoint
- High-level analytics summary
- Detailed lists of all resources
- All quizzes and mindmaps with results
- TODO progress tracking

---

## Error Handling

### Standard HTTP Error Codes

| Status Code | Description | Common Causes |
|------------|-------------|---------------|
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing/invalid/expired JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side errors |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Scenarios

#### 1. Authentication Errors (401)
```json
{
  "detail": "Invalid authentication credentials: Signature has expired"
}
```
**Solution:** Re-login to get a new token

#### 2. Validation Errors (400)
```json
{
  "detail": "Invalid input: email is required"
}
```
**Solution:** Check request body against schema requirements

#### 3. Resource Not Found (404)
```json
{
  "detail": "Chat not found"
}
```
**Solution:** Verify the resource ID is correct

#### 4. User Errors (400)
```json
{
  "detail": "User with this email already exists"
}
```
**Solution:** Use a different email or login instead

---

## Code Examples

### JavaScript/TypeScript Examples

#### 1. User Registration & Login

```javascript
// Register a new user
async function registerUser(userData) {
  const response = await fetch('http://localhost:8000/user/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      age: userData.age,
      gender: userData.gender
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Store token securely
    localStorage.setItem('jwt_token', data.token);
    return data;
  } else {
    throw new Error(data.detail);
  }
}

// Login user
async function loginUser(email, password) {
  const response = await fetch('http://localhost:8000/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('jwt_token', data.token);
    return data;
  } else {
    throw new Error(data.detail);
  }
}
```

#### 2. Making Authenticated Requests

```javascript
// Get JWT token from storage
function getToken() {
  return localStorage.getItem('jwt_token');
}

// Helper function for authenticated API calls
async function authenticatedFetch(url, options = {}) {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please login.');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Handle token expiration
  if (response.status === 401) {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
}
```

#### 3. AI Study Chat

```javascript
// Create a new chat and send first message
async function startStudyChat(message) {
  const response = await authenticatedFetch('http://localhost:8000/chat/', {
    method: 'POST',
    body: JSON.stringify({
      chat_id: null, // null creates new chat
      message: message
    })
  });
  
  const data = await response.json();
  return data;
}

// Continue existing chat
async function continueChat(chatId, message) {
  const response = await authenticatedFetch('http://localhost:8000/chat/', {
    method: 'POST',
    body: JSON.stringify({
      chat_id: chatId,
      message: message
    })
  });
  
  const data = await response.json();
  return data;
}

// Get all user's chats
async function getMyChats() {
  const response = await authenticatedFetch('http://localhost:8000/chat/my-chats');
  const data = await response.json();
  return data;
}

// Get specific chat history
async function getChatHistory(chatId) {
  const response = await authenticatedFetch(`http://localhost:8000/chat/${chatId}`);
  const data = await response.json();
  return data;
}
```

#### 4. Study Sessions with RAG

```javascript
// Create a study session
async function createStudySession(sessionData) {
  const response = await authenticatedFetch('http://localhost:8000/study-session/create', {
    method: 'POST',
    body: JSON.stringify({
      subject: sessionData.subject,
      grade: sessionData.grade,
      study_details: sessionData.study_details,
      resources_text: sessionData.resources_text,
      pyq_text: sessionData.pyq_text,
      syllabus_text: sessionData.syllabus_text
    })
  });
  
  const data = await response.json();
  return data;
}

// Chat with AI in study session
async function studySessionChat(sessionId, question) {
  const response = await authenticatedFetch('http://localhost:8000/study-session/chat', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      question: question
    })
  });
  
  const data = await response.json();
  return data;
}

// Generate quiz
async function generateQuiz(sessionId) {
  const response = await authenticatedFetch('http://localhost:8000/study-session/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId })
  });
  
  const data = await response.json();
  return data;
}

// Generate mindmaps
async function generateMindmaps(sessionId) {
  const response = await authenticatedFetch('http://localhost:8000/study-session/mindmap/generate', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId })
  });
  
  const data = await response.json();
  return data;
}
```

#### 5. Tutorial Support

```javascript
// Create tutorial session
async function createTutorial(youtubeLink) {
  const response = await authenticatedFetch('http://localhost:8000/tutorial-support/create', {
    method: 'POST',
    body: JSON.stringify({
      tutorial_link: youtubeLink
    })
  });
  
  const data = await response.json();
  return data;
}

// Add a note
async function addNote(tutorialId, note, timestamp) {
  const response = await authenticatedFetch('http://localhost:8000/tutorial-support/notes/add', {
    method: 'POST',
    body: JSON.stringify({
      tutorial_id: tutorialId,
      note: note,
      timestamp: timestamp
    })
  });
  
  const data = await response.json();
  return data;
}

// Generate quiz from transcript
async function generateTutorialQuiz(tutorialId, fromTimestamp, toTimestamp) {
  const response = await authenticatedFetch('http://localhost:8000/tutorial-support/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({
      tutorial_id: tutorialId,
      from_timestamp: fromTimestamp,
      to_timestamp: toTimestamp
    })
  });
  
  const data = await response.json();
  return data;
}

// Evaluate quiz
async function evaluateQuiz(quizId, answers) {
  const response = await authenticatedFetch('http://localhost:8000/tutorial-support/quiz/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      quiz_id: quizId,
      answers: answers // Array of { question_id, answer }
    })
  });
  
  const data = await response.json();
  return data;
}
```

#### 6. TODO Management

```javascript
// Create TODO
async function createTodo(task, date, description) {
  const response = await authenticatedFetch('http://localhost:8000/todo/create', {
    method: 'POST',
    body: JSON.stringify({
      task: task,
      date: date,
      description: description
    })
  });
  
  const data = await response.json();
  return data;
}

// Get all todos
async function getMyTodos() {
  const response = await authenticatedFetch('http://localhost:8000/todo/my-todos');
  const data = await response.json();
  return data;
}

// Update TODO
async function updateTodo(todoId, updates) {
  const response = await authenticatedFetch('http://localhost:8000/todo/update', {
    method: 'PUT',
    body: JSON.stringify({
      todo_id: todoId,
      ...updates
    })
  });
  
  const data = await response.json();
  return data;
}

// AI Help
async function getTodoHelp(todoId, question) {
  const response = await authenticatedFetch('http://localhost:8000/todo/help', {
    method: 'POST',
    body: JSON.stringify({
      todo_id: todoId,
      question: question
    })
  });
  
  const data = await response.json();
  return data;
}
```

#### 7. Dashboard Analytics

```javascript
// Get complete dashboard
async function getDashboard() {
  const response = await authenticatedFetch('http://localhost:8000/dashboard/');
  const data = await response.json();
  return data;
}
```

#### 8. Media Processing

```javascript
// Speech to Text
async function speechToText(audioFile) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const token = getToken();
  const response = await fetch('http://localhost:8000/stt', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data;
}

// Text to Speech
async function textToSpeech(text) {
  const response = await authenticatedFetch('http://localhost:8000/tts', {
    method: 'POST',
    body: JSON.stringify({ text: text })
  });
  
  const data = await response.json();
  
  // data.audio_url is base64 encoded audio
  // You can use it in an <audio> element
  return data.audio_url;
}
```

### React Hooks Example

```typescript
// useAuth.ts - Authentication hook
import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserDetails(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUserDetails(token: string) {
    try {
      const response = await fetch('http://localhost:8000/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch('http://localhost:8000/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('jwt_token', data.token);
      setToken(data.token);
      setUser(data);
      return { success: true, data };
    } else {
      return { success: false, error: data.detail };
    }
  }

  function logout() {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  }

  return {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    login,
    logout
  };
}
```

---

## Best Practices

### 1. Token Management

✅ **DO:**
- Store JWT tokens securely (httpOnly cookies for web, secure storage for mobile)
- Include token in Authorization header for all authenticated requests
- Handle token expiration gracefully (redirect to login on 401)
- Clear token on logout

❌ **DON'T:**
- Store tokens in localStorage if dealing with highly sensitive data
- Expose tokens in URLs or logs
- Share tokens between users
- Keep expired tokens

### 2. Error Handling

```javascript
async function safeApiCall(apiFunction) {
  try {
    const result = await apiFunction();
    return { success: true, data: result };
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('token')) {
      // Redirect to login
      window.location.href = '/login';
      return { success: false, error: 'Session expired' };
    }
    return { success: false, error: error.message };
  }
}
```

### 3. Request Optimization

- **Debounce chat messages** to avoid rapid-fire requests
- **Cache responses** when appropriate (e.g., chat history)
- **Lazy load** dashboard data (load sections as needed)
- **Paginate** long lists if frontend implements pagination

### 4. UI/UX Considerations

- Show **loading indicators** during AI response generation (can take 2-10 seconds)
- Implement **retry logic** for failed requests
- Display **clear error messages** to users
- Use **optimistic updates** for better perceived performance
- **Stream responses** if possible (consider WebSocket for real-time updates)

### 5. Data Validation

- Validate input on frontend before sending to API
- Handle **required vs optional** fields correctly
- Check **data types** match schema expectations
- Validate **email format**, **password strength**, etc.

### 6. Image/Audio Handling

- **Base64 images/audio** are returned for mindmaps and TTS
- Display using data URLs: `<img src={data.image_b64} />`
- For audio: `<audio src={data.audio_url} controls />`
- Consider **caching** large base64 strings

### 7. Performance Tips

- **RAG Sessions**: Pre-compute embeddings by uploading all materials upfront
- **Chat Context**: Last 40 messages are kept for context (optimal balance)
- **Batch Requests**: Fetch related data together (e.g., dashboard endpoint)
- **Quiz Evaluation**: Can take 30-60 seconds for AI evaluation of descriptive answers

### 8. Security Best Practices

- Always use **HTTPS** in production
- Validate all user input on frontend
- Don't expose sensitive data in error messages
- Implement **rate limiting** on frontend if needed
- Log out users after inactivity period

---

## Additional Resources

### API Documentation
- **Swagger UI**: `http://localhost:8000/docs` (Interactive API documentation)
- **ReDoc**: `http://localhost:8000/redoc` (Alternative documentation view)

### Authentication
- See [JWT_AUTHENTICATION.md](./JWT_AUTHENTICATION.md) for detailed authentication guide

### Tech Stack
- **FastAPI**: https://fastapi.tiangolo.com/
- **Pydantic**: https://docs.pydantic.dev/
- **MongoDB**: https://www.mongodb.com/docs/

### Support
For issues, questions, or feature requests, please contact the backend team.

---

**Document Version:** 1.0.0  
**Last Updated:** October 19, 2025  
**Maintained by:** Medha.ai Backend Team

