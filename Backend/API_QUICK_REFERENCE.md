# Medha.ai API Quick Reference Guide

Quick reference for all API endpoints with request/response examples.

**Base URL:** `http://localhost:8000`  
**Authentication:** JWT Bearer Token (except where noted)

---

## 📋 Quick Index

| Module | Endpoints |
|--------|-----------|
| [User Management](#user-management) | Register, Login, Profile, Password Reset |
| [AI Study Chat](#ai-study-chat) | Create, Send Message, History, List, Delete |
| [AI Friend Chat](#ai-friend-chat) | Create, Send Message, History, List, Delete |
| [Study Sessions](#study-sessions) | Create, Chat with RAG, Update, Quiz, Mindmap |
| [Tutorial Support](#tutorial-support) | Create, Notes, Prettify, Quiz, Evaluate, Mindmap |
| [TODO Management](#todo-management) | CRUD, Filter, AI Help |
| [Media](#media-processing) | STT, TTS |
| [Dashboard](#dashboard) | Analytics |

---

## User Management

### Register User
```http
POST /user/create
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "secure123",
  "age": 20,
  "gender": "Female"
}

Response: { email, message, token }
```

### Login
```http
POST /user/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "secure123"
}

Response: { email, name, message, token }
```

### Get Profile
```http
GET /user/me
Authorization: Bearer {token}

Response: { email, name, age, gender, educational_details, created_at, updated_at }
```

### Update Profile
```http
PUT /user/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Alice Updated",
  "age": 21
}

Response: { email, message }
```

### Forgot Password
```http
POST /user/forgot-password
Content-Type: application/json

{ "email": "alice@example.com" }

Response: { message, email }
```

### Verify OTP
```http
POST /user/verify-otp
Content-Type: application/json

{
  "email": "alice@example.com",
  "otp": "123456"
}

Response: { message, verified, reset_token }
```

### Reset Password
```http
POST /user/reset-password
Content-Type: application/json

{
  "email": "alice@example.com",
  "reset_token": "abc123",
  "new_password": "NewPass123"
}

Response: { message, success }
```

---

## AI Study Chat

### Create Chat
```http
POST /chat/create
Authorization: Bearer {token}

Response: { chat_id, message }
```

### Send Message
```http
POST /chat/
Authorization: Bearer {token}
Content-Type: application/json

{
  "chat_id": "507f1f77bcf86cd799439011",  // null for new chat
  "message": "Explain quantum physics"
}

Response: { chat_id, response, title }
```

### Get Chat History
```http
GET /chat/{chat_id}
Authorization: Bearer {token}

Response: { chat_id, user_email, title, messages[], created_at, updated_at }
```

### Get All Chats
```http
GET /chat/my-chats
Authorization: Bearer {token}

Response: { email, chats[] }
```

### Delete Chat
```http
DELETE /chat/{chat_id}
Authorization: Bearer {token}

Response: { message, chat_id }
```

---

## AI Friend Chat

Same structure as Study Chat, but with `/friend-chat` prefix:

```http
POST /friend-chat/create
POST /friend-chat/
GET /friend-chat/{chat_id}
GET /friend-chat/my-chats
DELETE /friend-chat/{chat_id}
```

---

## Study Sessions

### Create Session
```http
POST /study-session/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "subject": "Physics",
  "grade": "12th Grade",
  "study_details": "Thermodynamics",
  "resources_text": "Chapter notes...",
  "pyq_text": "PYQ 2020-2023...",
  "syllabus_text": "Unit 1..."
}

Response: { session_id, session_name, message }
```

### Chat with AI (RAG)
```http
POST /study-session/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": "session_abc123",
  "question": "Explain first law of thermodynamics"
}

Response: { session_id, response }
```

### Get All Sessions
```http
GET /study-session/my-sessions
Authorization: Bearer {token}

Response: { email, sessions[] }
```

### Get Session Details
```http
GET /study-session/{session_id}
Authorization: Bearer {token}

Response: { session_id, session_name, email, metadata, chat_history[], created_at, updated_at }
```

### Update Session
```http
PUT /study-session/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": "session_abc123",
  "session_name": "Updated Name",
  "resources_text": "Updated content..."
}

Response: { session_id, message }
```

### Delete Session
```http
DELETE /study-session/{session_id}
Authorization: Bearer {token}

Response: { session_id, message }
```

### Generate Quiz
```http
POST /study-session/quiz/generate
Authorization: Bearer {token}
Content-Type: application/json

{ "session_id": "session_abc123" }

Response: { session_id, quiz_id, mcq_questions[], descriptive_questions[], message }
```

### Generate Mindmap
```http
POST /study-session/mindmap/generate
Authorization: Bearer {token}
Content-Type: application/json

{ "session_id": "session_abc123" }

Response: { session_id, mindmaps[], message }
```

---

## Tutorial Support

### Create Tutorial
```http
POST /tutorial-support/create
Authorization: Bearer {token}
Content-Type: application/json

{ "tutorial_link": "https://youtube.com/watch?v=abc123" }

Response: { tutorial_id, title, message }
```

### Add Note
```http
POST /tutorial-support/notes/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "note": "Important point about variables",
  "timestamp": "10:25"
}

Response: { message, note_id }
```

### Get Notes
```http
GET /tutorial-support/notes?tutorial_id={tutorial_id}
Authorization: Bearer {token}

Response: { tutorial_id, tutorial_link, title, notes[] }
```

### Update Note
```http
PUT /tutorial-support/notes/{note_id}
Authorization: Bearer {token}
Content-Type: application/json

{ "updated_text": "Updated note content" }

Response: { message, note_id }
```

### Delete Note
```http
DELETE /tutorial-support/notes/{note_id}
Authorization: Bearer {token}

Response: { message, note_id }
```

### Prettify Notes
```http
POST /tutorial-support/notes/prettify
Authorization: Bearer {token}
Content-Type: application/json

{ "tutorial_id": "507f1f77bcf86cd799439011" }

Response: { tutorial_id, title, prettified_notes }
```

### Generate Detailed Notes
```http
POST /tutorial-support/notes/detailed
Authorization: Bearer {token}
Content-Type: application/json

{ "tutorial_id": "507f1f77bcf86cd799439011" }

Response: { tutorial_id, title, detailed_notes }
```

### Get All Tutorials
```http
GET /tutorial-support/my-tutorials
Authorization: Bearer {token}

Response: { email, tutorials[] }
```

### AI Chat
```http
POST /tutorial-support/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "question": "Explain variables in detail"
}

Response: { tutorial_id, question, answer }
```

### Generate Quiz
```http
POST /tutorial-support/quiz/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "tutorial_id": "507f1f77bcf86cd799439011",
  "from_timestamp": "10:00",
  "to_timestamp": "25:00"
}

Response: { quiz_id, tutorial_id, tutorial_title, from_timestamp, to_timestamp, 
           mcq_questions[], descriptive_questions[], total_questions, created_at, message }
```

### Evaluate Quiz
```http
POST /tutorial-support/quiz/evaluate
Authorization: Bearer {token}
Content-Type: application/json

{
  "quiz_id": "quiz_abc123",
  "answers": [
    { "question_id": "q1", "answer": 0 },
    { "question_id": "q21", "answer": "Variables store data..." }
  ]
}

Response: { quiz_id, tutorial_id, total_score, max_score, percentage, 
           mcq_score, descriptive_score, results[], overall_feedback, 
           strengths[], areas_for_improvement[], study_suggestions[], evaluated_at }
```

### Get Quiz Details
```http
GET /tutorial-support/quiz/{quiz_id}
Authorization: Bearer {token}

Response: { quiz_id, tutorial_id, tutorial_title, mcq_questions[], 
           descriptive_questions[], is_evaluated, evaluation_report, created_at }
```

### Get Tutorial Quizzes
```http
GET /tutorial-support/quiz/tutorial/{tutorial_id}
Authorization: Bearer {token}

Response: { tutorial_id, tutorial_title, quizzes[] }
```

### Get All User Quizzes
```http
GET /tutorial-support/quiz/my-quizzes
Authorization: Bearer {token}

Response: { email, quizzes[] }
```

### Generate Mindmap
```http
POST /tutorial-support/mindmap/generate
Authorization: Bearer {token}
Content-Type: application/json

{ "tutorial_id": "tutorial_abc123" }

Response: { tutorial_id, mindmaps[], message }
```

### Get Mindmaps
```http
GET /tutorial-support/mindmap/{tutorial_id}
Authorization: Bearer {token}

Response: { tutorial_id, mindmaps[] }
```

---

## TODO Management

### Create TODO
```http
POST /todo/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "task": "Complete documentation",
  "date": "2024-01-20",
  "description": "Write API docs"
}

Response: { todo_id, message }
```

### Update TODO
```http
PUT /todo/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "todo_id": "todo_abc123",
  "task": "Updated task",
  "status": "in_progress"
}

Response: { todo_id, message }
```

### Mark as Done
```http
PUT /todo/mark-done
Authorization: Bearer {token}
Content-Type: application/json

{ "todo_id": "todo_abc123" }

Response: { todo_id, message, status }
```

### Delete TODO
```http
DELETE /todo/{todo_id}
Authorization: Bearer {token}

Response: { todo_id, message }
```

### Get All TODOs
```http
GET /todo/my-todos
Authorization: Bearer {token}

Response: { email, todos[] }
```

### Filter by Status
```http
GET /todo/filter?status=pending
Authorization: Bearer {token}

Response: { email, status, todos[] }
```
Status options: `pending`, `in_progress`, `done`

### AI Help
```http
POST /todo/help
Authorization: Bearer {token}
Content-Type: application/json

{
  "todo_id": "todo_abc123",
  "question": "How should I start?"
}

Response: { todo_id, response }
```

### Get Chat History
```http
GET /todo/chat-history/{todo_id}
Authorization: Bearer {token}

Response: { todo_id, task, chat_history[] }
```

---

## Media Processing

### Speech-to-Text
```http
POST /stt
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
  audio: [audio file]

Response: { text }
```

### Text-to-Speech
```http
POST /tts
Authorization: Bearer {token}
Content-Type: application/json

{ "text": "Generate audio for this" }

Response: { audio_url }  // base64 encoded WAV
```

---

## Dashboard

### Get Dashboard Analytics
```http
GET /dashboard/
Authorization: Bearer {token}

Response: {
  email,
  analytics: {
    total_study_chats,
    total_friend_chats,
    total_study_sessions,
    total_tutorials,
    total_todos,
    todos_pending,
    todos_in_progress,
    todos_done,
    total_quizzes,
    total_mindmaps
  },
  study_chats[],
  friend_chats[],
  study_sessions[],
  tutorials[],
  todos[]
}
```

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not Found |
| 500 | Server Error |

---

## Authentication Flow

1. **Register/Login** → Get JWT token
2. **Store token** → `localStorage.setItem('jwt_token', token)`
3. **Use token** → `Authorization: Bearer ${token}`
4. **Token expires** → Re-login after 7 days

---

## JavaScript Helper

```javascript
const API_BASE = 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('jwt_token');
}

async function api(endpoint, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API Error');
  }
  
  return response.json();
}

// Usage examples:
await api('/user/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

await api('/chat/', {
  method: 'POST',
  body: JSON.stringify({ chat_id: null, message: 'Hello' })
});

await api('/dashboard/');
```

---

## Important Notes

- **All times are in ISO 8601 format**: `2025-01-15T10:30:00`
- **Base64 images/audio**: Use in `<img src={base64}>` or `<audio src={base64}>`
- **Chat context**: Last 40 messages maintained
- **Quiz scoring**: MCQ = 1 mark, Descriptive = 10 marks
- **Timestamps**: Format "MM:SS" or "HH:MM:SS"
- **RAG optimization**: Pre-computed embeddings for fast queries
- **Token expiry**: 7 days

---

**Quick Docs Version:** 1.0.0  
**For detailed documentation see:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

