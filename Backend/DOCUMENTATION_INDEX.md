# 📚 Medha.ai API Documentation Index

Complete documentation for frontend developers integrating with the Medha.ai Backend API.

---

## 📖 Documentation Overview

This repository contains comprehensive documentation for the Medha.ai educational platform backend API. All documentation has been created specifically for **frontend developers** to understand and integrate with the API easily.

---

## 📄 Documentation Files

### 1. **API_DOCUMENTATION.md** 🔵 [Primary Resource]
**Full comprehensive API documentation**

- Complete overview of all endpoints
- Detailed request/response schemas
- Authentication guide
- Code examples in JavaScript/TypeScript
- React hooks examples
- Error handling
- Best practices
- 60+ pages of detailed documentation

**Use this when:** You need detailed information about any endpoint, authentication flow, or implementation details.

**Link:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

### 2. **API_QUICK_REFERENCE.md** 🟢 [Quick Lookup]
**Concise quick reference guide**

- All endpoints in compact format
- Quick HTTP request examples
- Response formats
- Common status codes
- JavaScript helper functions
- 10-page quick lookup

**Use this when:** You already know what you're looking for and need a quick syntax reference.

**Link:** [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)

---

### 3. **FRONTEND_INTEGRATION_GUIDE.md** 🟡 [Implementation Guide]
**Step-by-step frontend integration guide**

- 8-week implementation timeline
- Feature-by-feature checklist
- Code examples and patterns
- React hooks and services
- UI/UX best practices
- Performance optimization tips
- Common issues and solutions

**Use this when:** Starting a new frontend project and need guidance on what to build and in what order.

**Link:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)

---

### 4. **Medha_AI_Postman_Collection.json** 🟠 [Testing Tool]
**Ready-to-use Postman collection**

- All API endpoints pre-configured
- Example requests with sample data
- Auto-saves JWT token on login
- Organized by feature modules
- Easy testing and debugging

**Use this when:** You want to test API endpoints before implementing them in your frontend.

**How to use:**
1. Open Postman
2. Import → Upload Files → Select `Medha_AI_Postman_Collection.json`
3. Set `base_url` variable to your backend URL
4. Start testing!

**Link:** [Medha_AI_Postman_Collection.json](./Medha_AI_Postman_Collection.json)

---

### 5. **JWT_AUTHENTICATION.md** 🔴 [Security Guide]
**Detailed JWT authentication documentation**

- Authentication flow diagrams
- Token management
- Security best practices
- Troubleshooting guide
- Testing examples

**Use this when:** You need to understand the authentication system in detail.

**Link:** [JWT_AUTHENTICATION.md](./JWT_AUTHENTICATION.md)

---

## 🎯 Quick Start Guide

### For New Developers

1. **Start here:** Read the [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) Overview and Authentication sections
2. **Import Postman Collection:** Test endpoints using [Medha_AI_Postman_Collection.json](./Medha_AI_Postman_Collection.json)
3. **Follow the plan:** Use [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) to structure your development
4. **Quick reference:** Keep [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) open for quick lookups

### For Experienced Developers

1. **Quick overview:** Skim through [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
2. **Import Postman:** Load [Medha_AI_Postman_Collection.json](./Medha_AI_Postman_Collection.json)
3. **Deep dive:** Refer to [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) as needed
4. **Best practices:** Check [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) for patterns

---

## 🏗️ API Architecture Overview

### Base Information
- **Base URL:** `http://localhost:8000` (Development)
- **Protocol:** REST API
- **Authentication:** JWT Bearer Token
- **Content Type:** `application/json`
- **Response Format:** JSON

### Core Modules

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **User Management** | 7 | Registration, login, profile, password reset |
| **AI Study Chat** | 5 | Study-focused AI conversations with context |
| **AI Friend Chat** | 5 | Mental health companion, supportive chat |
| **Study Sessions** | 8 | RAG-powered study sessions with materials |
| **Tutorial Support** | 16 | YouTube tutorial notes, quizzes, mindmaps |
| **TODO Management** | 8 | Task management with AI assistance |
| **Media Processing** | 2 | Speech-to-Text, Text-to-Speech |
| **Dashboard** | 1 | Comprehensive analytics overview |

**Total:** 52+ API endpoints

---

## 🔑 Key Features

### 1. Authentication & Security
- JWT-based authentication
- 7-day token expiration
- Password reset with email OTP
- Secure user profile management

### 2. AI-Powered Features
- **Study Chat:** Context-aware study assistance (last 40 messages)
- **Friend Chat:** Empathetic mental health support (Hinglish-friendly)
- **RAG System:** Retrieval-Augmented Generation for study materials
- **AI TODO Help:** Step-by-step task guidance

### 3. Learning Tools
- **Quiz Generation:** 20 MCQs + 5 Descriptive questions
- **Quiz Evaluation:** AI-powered grading with detailed feedback
- **Mindmaps:** Visual concept mapping (base64 PNG)
- **Note Prettification:** AI-enhanced note organization
- **Detailed Notes:** AI-generated comprehensive study notes

### 4. Multimedia
- **Speech-to-Text:** Groq Whisper transcription
- **Text-to-Speech:** Kokoro TTS (24kHz WAV)
- **YouTube Integration:** Video tutorials with timestamped notes

### 5. Progress Tracking
- Comprehensive dashboard with analytics
- TODO progress tracking
- Quiz performance history
- Study session insights

---

## 📊 API Endpoint Categories

### Public Endpoints (No Authentication Required)
```
POST   /user/create           - Register new user
POST   /user/login            - Login user
POST   /user/forgot-password  - Initiate password reset
POST   /user/verify-otp       - Verify OTP
POST   /user/reset-password   - Reset password
GET    /                      - Health check
```

### Protected Endpoints (JWT Required)
All other endpoints require `Authorization: Bearer {token}` header.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Database:** MongoDB
- **Authentication:** JWT (python-jose)
- **Validation:** Pydantic v2

### AI & ML
- **LLM:** Groq API (gemma2-9b-it)
- **Speech-to-Text:** Groq Whisper
- **Text-to-Speech:** Kokoro
- **RAG:** FAISS + SentenceTransformers
- **Embeddings:** all-MiniLM-L6-v2

### Media Processing
- **Mindmaps:** Graphviz
- **Audio:** WAV, 24kHz
- **Images:** Base64 PNG

---

## 📈 Performance Metrics

- **RAG Query Time:** 0.1-0.3s (with pre-computed embeddings)
- **AI Response Time:** 2-10s (depends on complexity)
- **Quiz Generation:** 30-60s
- **Mindmap Generation:** 20-40s
- **Chat Context:** Last 40 messages (20 exchanges)
- **Token Expiry:** 7 days

---

## 🎨 Integration Examples

### Example 1: Send a Chat Message
```javascript
const response = await fetch('http://localhost:8000/chat/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chat_id: null,  // null creates new chat
    message: 'Explain quantum physics'
  })
});

const data = await response.json();
// { chat_id, response, title }
```

### Example 2: Create Study Session with RAG
```javascript
const response = await fetch('http://localhost:8000/study-session/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subject: 'Physics',
    grade: '12th Grade',
    study_details: 'Thermodynamics',
    resources_text: 'Chapter 1: Laws of thermodynamics...',
    pyq_text: 'Previous year questions...',
    syllabus_text: 'Unit 1: Thermodynamics...'
  })
});

const data = await response.json();
// { session_id, session_name, message }
```

### Example 3: Generate and Evaluate Quiz
```javascript
// Generate quiz
const quizResponse = await fetch('http://localhost:8000/tutorial-support/quiz/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tutorial_id: 'tutorial_123',
    from_timestamp: '10:00',
    to_timestamp: '25:00'
  })
});

const quiz = await quizResponse.json();

// Evaluate quiz
const evalResponse = await fetch('http://localhost:8000/tutorial-support/quiz/evaluate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    quiz_id: quiz.quiz_id,
    answers: [
      { question_id: 'q1', answer: 0 },
      { question_id: 'q21', answer: 'Variables store data...' }
    ]
  })
});

const results = await evalResponse.json();
// Detailed evaluation with scores, feedback, and suggestions
```

---

## 🔍 Interactive API Documentation

### Swagger UI (Recommended for Testing)
**URL:** http://localhost:8000/docs

**Features:**
- Interactive API testing
- Auto-generated from code
- Try endpoints directly
- See request/response schemas
- Authentication support

### ReDoc (Recommended for Reading)
**URL:** http://localhost:8000/redoc

**Features:**
- Clean, readable format
- Searchable documentation
- Better for browsing
- Export to PDF/HTML

---

## 🧩 Common Integration Patterns

### Pattern 1: Protected Route Wrapper
```typescript
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

### Pattern 2: API Service Layer
```typescript
class APIService {
  private baseURL = 'http://localhost:8000';
  
  private getHeaders() {
    const token = localStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  async get(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }
  
  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }
  
  private async handleResponse(response: Response) {
    if (response.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API Error');
    }
    
    return response.json();
  }
}
```

### Pattern 3: Custom Hook for API Calls
```typescript
function useAPI<T>(endpoint: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.get(endpoint);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, execute };
}
```

---

## 💡 Pro Tips

1. **Always handle 401 errors** - Implement global error handling for expired tokens
2. **Use TypeScript** - Define interfaces for all API responses
3. **Cache responses** - Reduce API calls with smart caching
4. **Show loading states** - AI responses can take 2-10 seconds
5. **Debounce inputs** - Especially for search and chat
6. **Test with Postman first** - Verify endpoints before frontend integration
7. **Read error messages** - API provides detailed error descriptions
8. **Use environment variables** - Never hardcode API URLs
9. **Implement retry logic** - For failed requests
10. **Monitor performance** - Track API response times

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** CORS errors
- **Solution:** Backend has CORS enabled. Check browser console for details.

**Issue:** 401 Unauthorized
- **Solution:** Token expired or missing. Redirect to login.

**Issue:** 400 Bad Request
- **Solution:** Check request body matches schema in documentation.

**Issue:** 404 Not Found
- **Solution:** Verify resource ID is correct and resource exists.

**Issue:** 500 Internal Server Error
- **Solution:** Backend error. Check backend logs.

---

## 📞 Support & Resources

### Documentation
- [API Documentation](./API_DOCUMENTATION.md) - Full details
- [Quick Reference](./API_QUICK_REFERENCE.md) - Quick lookup
- [Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) - Step-by-step
- [Postman Collection](./Medha_AI_Postman_Collection.json) - Testing

### Interactive Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Backend Repository
- Main README: [README.md](./README.md)
- JWT Authentication: [JWT_AUTHENTICATION.md](./JWT_AUTHENTICATION.md)

---

## 📋 Checklist for Frontend Developers

Before starting development:
- [ ] Read API_DOCUMENTATION.md overview section
- [ ] Import and test Postman collection
- [ ] Understand JWT authentication flow
- [ ] Set up base API URL in environment
- [ ] Create authentication service
- [ ] Implement token management
- [ ] Set up error handling for 401/403
- [ ] Test login/register flow

During development:
- [ ] Follow FRONTEND_INTEGRATION_GUIDE.md timeline
- [ ] Use API_QUICK_REFERENCE.md for syntax lookup
- [ ] Test each feature with Postman before implementing
- [ ] Handle loading states for AI responses
- [ ] Implement proper error messages
- [ ] Add responsive design
- [ ] Test with different user scenarios

Before deployment:
- [ ] Replace localhost with production API URL
- [ ] Enable HTTPS
- [ ] Remove console.logs
- [ ] Test authentication flow end-to-end
- [ ] Test all critical user paths
- [ ] Check performance metrics
- [ ] Verify error handling
- [ ] Test on multiple browsers/devices

---

## 🎓 Learning Path

### Week 1: Fundamentals
- Read API Documentation
- Understand authentication
- Test endpoints with Postman
- Build login/register pages

### Week 2: Core Features
- Implement AI Study Chat
- Build chat interface
- Handle AI responses
- Add error handling

### Week 3: Advanced Features
- Study Sessions with RAG
- Tutorial support
- Quiz system
- TODO management

### Week 4: Polish
- Dashboard and analytics
- Media features
- Performance optimization
- Testing and deployment

---

## 🚀 Quick Commands

```bash
# Test health check
curl http://localhost:8000/

# Register user (save token from response)
curl -X POST http://localhost:8000/user/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'

# Get user profile (replace TOKEN)
curl http://localhost:8000/user/me \
  -H "Authorization: Bearer TOKEN"

# Send chat message
curl -X POST http://localhost:8000/chat/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":null,"message":"Hello!"}'
```

---

## 📈 Statistics

- **Total Documentation Pages:** 150+
- **Code Examples:** 50+
- **API Endpoints Documented:** 52
- **Request/Response Schemas:** 100+
- **Integration Patterns:** 20+
- **Time to Read All Docs:** ~3-4 hours
- **Time to Implement MVP:** 4-6 weeks

---

## 🎯 Next Steps

1. **Choose your starting document** based on your needs:
   - New to project? → Start with [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
   - Need quick reference? → Use [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
   - Starting development? → Follow [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
   - Testing first? → Import [Medha_AI_Postman_Collection.json](./Medha_AI_Postman_Collection.json)

2. **Set up your development environment**
3. **Test authentication flow**
4. **Build one feature at a time**
5. **Refer back to documentation as needed**

---

## 📝 Documentation Version

- **Version:** 1.0.0
- **Last Updated:** October 19, 2025
- **Backend API Version:** 1.0.0
- **Compatible with:** FastAPI Backend v1.0.0

---

## ✨ Special Features Highlight

### 🤖 AI-Powered
- Context-aware conversations
- RAG for study materials
- Intelligent quiz generation
- AI-powered evaluation

### 📚 Educational Focus
- Study sessions with materials
- Tutorial support for learning
- Progress tracking
- Performance analytics

### 🎨 Developer-Friendly
- Comprehensive documentation
- Code examples in multiple languages
- Postman collection for testing
- Interactive API docs

### 🔒 Secure
- JWT authentication
- Token expiration
- Password reset flow
- Secure user data

---

**Happy Coding! 🚀**

*This documentation is maintained by the Medha.ai Backend Team. For updates, bug reports, or questions, please contact the development team.*

---

© 2025 Medha.ai - All Rights Reserved

