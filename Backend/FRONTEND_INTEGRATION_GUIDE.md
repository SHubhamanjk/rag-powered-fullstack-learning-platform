# Frontend Integration Guide for Medha.ai API

This guide helps frontend developers integrate with the Medha.ai backend API step by step.

---

## 🚀 Quick Start Checklist

### Phase 1: Setup & Authentication (Week 1)

- [ ] **Environment Setup**
  - [ ] Set up base API URL as environment variable
  - [ ] Install HTTP client (axios/fetch)
  - [ ] Set up state management (Redux/Context/Zustand)

- [ ] **Authentication System**
  - [ ] Create authentication service/utility
  - [ ] Implement token storage (localStorage/sessionStorage)
  - [ ] Build Login page
  - [ ] Build Registration page
  - [ ] Implement JWT token management
  - [ ] Add authentication middleware/guards
  - [ ] Handle token expiration (401 errors)
  - [ ] Implement auto-redirect on token expiry

- [ ] **Password Reset Flow**
  - [ ] Build "Forgot Password" page
  - [ ] Build "Verify OTP" page
  - [ ] Build "Reset Password" page
  - [ ] Connect all three pages in flow

- [ ] **User Profile**
  - [ ] Build Profile view page
  - [ ] Build Profile edit page
  - [ ] Implement profile update functionality

---

### Phase 2: Core Chat Features (Week 2)

- [ ] **AI Study Chat**
  - [ ] Build chat list view (all chats)
  - [ ] Build chat interface/conversation view
  - [ ] Implement send message functionality
  - [ ] Display AI responses with typing indicators
  - [ ] Show chat history
  - [ ] Add create new chat button
  - [ ] Implement delete chat functionality
  - [ ] Auto-scroll to latest message
  - [ ] Add markdown rendering for AI responses
  - [ ] Show timestamps

- [ ] **AI Friend Chat**
  - [ ] Build friend chat list view
  - [ ] Build friend chat interface
  - [ ] Implement friend chat messaging
  - [ ] Display friend chat history
  - [ ] Add emotional tone indicators/emojis
  - [ ] Support Hinglish text

---

### Phase 3: Study Sessions with RAG (Week 3)

- [ ] **Study Session Management**
  - [ ] Build "Create Session" form
    - [ ] Subject input
    - [ ] Grade selection
    - [ ] Study details textarea
    - [ ] Resources upload/paste
    - [ ] PYQ upload/paste
    - [ ] Syllabus upload/paste
  - [ ] Build session list view
  - [ ] Build session detail view
  - [ ] Implement session update functionality
  - [ ] Implement session delete functionality

- [ ] **RAG Chat Interface**
  - [ ] Build RAG-powered chat interface
  - [ ] Show context sources (where info came from)
  - [ ] Display "searching knowledge base" indicator
  - [ ] Show chat history within session

- [ ] **Quiz Generation**
  - [ ] Add "Generate Quiz" button in session
  - [ ] Display generated MCQ questions
  - [ ] Display generated descriptive questions
  - [ ] Show correct answers (for review)
  - [ ] Store quiz for later access

- [ ] **Mindmap Visualization**
  - [ ] Add "Generate Mindmap" button
  - [ ] Display base64 mindmap images
  - [ ] Create image gallery for multiple mindmaps
  - [ ] Add zoom/pan functionality for mindmaps
  - [ ] Download mindmap functionality

---

### Phase 4: Tutorial Support (Week 4)

- [ ] **Tutorial Management**
  - [ ] Build "Add Tutorial" form (YouTube link)
  - [ ] Display tutorial list
  - [ ] Show embedded YouTube player

- [ ] **Note-taking System**
  - [ ] Build timestamped note editor
  - [ ] Sync notes with video timeline
  - [ ] Display notes in chronological order
  - [ ] Implement edit note functionality
  - [ ] Implement delete note functionality
  - [ ] Click note to jump to video timestamp

- [ ] **AI-Powered Notes**
  - [ ] Add "Prettify Notes" button
  - [ ] Display prettified notes with formatting
  - [ ] Add "Generate Detailed Notes" button
  - [ ] Display detailed notes
  - [ ] Export notes functionality

- [ ] **Tutorial AI Chat**
  - [ ] Build tutorial-specific chat interface
  - [ ] Reference notes in chat context
  - [ ] Show related timestamps in responses

- [ ] **Tutorial Quizzes**
  - [ ] Build quiz generation form (timestamp range)
  - [ ] Display quiz questions
  - [ ] Build quiz taking interface
  - [ ] Build answer submission form
  - [ ] Display evaluation results
  - [ ] Show detailed feedback
  - [ ] Display strengths/weaknesses
  - [ ] Show study suggestions
  - [ ] Quiz history view

- [ ] **Tutorial Mindmaps**
  - [ ] Generate mindmaps from notes
  - [ ] Display mindmap gallery
  - [ ] Mindmap viewer with zoom

---

### Phase 5: TODO Management (Week 5)

- [ ] **TODO CRUD**
  - [ ] Build TODO list view
  - [ ] Build "Add TODO" form
  - [ ] Display TODOs with status badges
  - [ ] Implement TODO update
  - [ ] Implement TODO delete
  - [ ] Mark as done functionality
  - [ ] Filter by status (pending/in_progress/done)

- [ ] **TODO Organization**
  - [ ] Sort by date
  - [ ] Color code by status
  - [ ] Show completion percentage
  - [ ] Due date reminders

- [ ] **AI TODO Assistant**
  - [ ] Build TODO chat interface
  - [ ] "Get Help" button on each TODO
  - [ ] Display AI guidance
  - [ ] Show chat history per TODO
  - [ ] Step-by-step breakdown display

---

### Phase 6: Media Features (Week 6)

- [ ] **Speech-to-Text**
  - [ ] Build audio recorder component
  - [ ] File upload for audio
  - [ ] Display transcription results
  - [ ] Copy transcription to clipboard

- [ ] **Text-to-Speech**
  - [ ] Add "Read Aloud" buttons
  - [ ] Audio player for TTS output
  - [ ] Playback controls
  - [ ] Download audio functionality

---

### Phase 7: Dashboard & Analytics (Week 7)

- [ ] **Dashboard Overview**
  - [ ] Build analytics summary cards
    - [ ] Total study chats
    - [ ] Total friend chats
    - [ ] Total study sessions
    - [ ] Total tutorials
    - [ ] TODO statistics
    - [ ] Quiz statistics
  - [ ] Display recent activity
  - [ ] Show progress charts/graphs
  - [ ] Quick links to all sections

- [ ] **Data Visualization**
  - [ ] Study time charts
  - [ ] Quiz performance graphs
  - [ ] TODO completion trends
  - [ ] Activity heatmap (optional)

---

### Phase 8: Polish & Optimization (Week 8)

- [ ] **UI/UX Improvements**
  - [ ] Loading states for all API calls
  - [ ] Error boundaries
  - [ ] Toast notifications for success/errors
  - [ ] Skeleton loaders
  - [ ] Empty states
  - [ ] Responsive design (mobile/tablet)
  - [ ] Dark mode (optional)

- [ ] **Performance**
  - [ ] Implement pagination for long lists
  - [ ] Cache API responses
  - [ ] Debounce search/input
  - [ ] Lazy load images
  - [ ] Code splitting

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] ARIA labels
  - [ ] Focus management

---

## 📦 Recommended Tech Stack

### Core
- **Framework**: React / Vue / Angular / Next.js
- **State Management**: Redux Toolkit / Zustand / Context API
- **HTTP Client**: Axios / Fetch
- **Routing**: React Router / Vue Router

### UI Libraries
- **Component Library**: Material-UI / Chakra UI / Ant Design / Tailwind UI
- **Icons**: React Icons / Heroicons
- **Markdown**: react-markdown / marked
- **Charts**: Chart.js / Recharts / D3.js

### Utilities
- **Date Formatting**: date-fns / dayjs
- **Form Handling**: React Hook Form / Formik
- **Validation**: Zod / Yup
- **File Upload**: react-dropzone

---

## 🛠️ Implementation Examples

### 1. API Service Setup

```typescript
// api/config.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getAuthHeader = () => {
  const token = localStorage.getItem('jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

```typescript
// api/client.ts
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader();
    config.headers = { ...config.headers, ...authHeader };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Authentication Service

```typescript
// services/authService.ts
import apiClient from '../api/client';

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/user/login', { email, password });
    const { token, ...user } = response.data;
    localStorage.setItem('jwt_token', token);
    return { token, user };
  },

  async register(userData: RegisterData) {
    const response = await apiClient.post('/user/create', userData);
    const { token, ...user } = response.data;
    localStorage.setItem('jwt_token', token);
    return { token, user };
  },

  logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  },

  async getProfile() {
    const response = await apiClient.get('/user/me');
    return response.data;
  },

  async updateProfile(updates: Partial<UserProfile>) {
    const response = await apiClient.put('/user/me', updates);
    return response.data;
  },
};
```

### 3. Chat Service

```typescript
// services/chatService.ts
import apiClient from '../api/client';

export const chatService = {
  async createChat() {
    const response = await apiClient.post('/chat/create');
    return response.data;
  },

  async sendMessage(chatId: string | null, message: string) {
    const response = await apiClient.post('/chat/', {
      chat_id: chatId,
      message,
    });
    return response.data;
  },

  async getChatHistory(chatId: string) {
    const response = await apiClient.get(`/chat/${chatId}`);
    return response.data;
  },

  async getAllChats() {
    const response = await apiClient.get('/chat/my-chats');
    return response.data;
  },

  async deleteChat(chatId: string) {
    const response = await apiClient.delete(`/chat/${chatId}`);
    return response.data;
  },
};
```

### 4. React Hook for Chat

```typescript
// hooks/useChat.ts
import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

export function useChat(chatId: string | null) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (chatId) {
      loadChatHistory();
    }
  }, [chatId]);

  async function loadChatHistory() {
    try {
      setLoading(true);
      const data = await chatService.getChatHistory(chatId!);
      setMessages(data.messages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(message: string) {
    try {
      setLoading(true);
      const response = await chatService.sendMessage(chatId, message);
      
      // Add user message
      setMessages(prev => [...prev, {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }]);
      
      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      }]);
      
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    reload: loadChatHistory,
  };
}
```

### 5. Chat Component Example

```tsx
// components/ChatInterface.tsx
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';

export function ChatInterface({ chatId }: { chatId: string | null }) {
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useChat(chatId);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    try {
      await sendMessage(input);
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

---

## 🎨 UI/UX Best Practices

### Loading States
- Show skeleton loaders for content loading
- Use spinners for button actions
- Display "Thinking..." for AI responses
- Show progress bars for file uploads

### Error Handling
- Display user-friendly error messages
- Use toast notifications for feedback
- Implement retry mechanisms
- Provide fallback UI

### Empty States
- Show helpful messages when no data
- Provide CTA buttons to create content
- Use illustrations or icons

### Responsive Design
- Mobile-first approach
- Collapsible sidebars
- Bottom navigation for mobile
- Touch-friendly button sizes

---

## 🔒 Security Checklist

- [ ] Never log JWT tokens
- [ ] Use HTTPS in production
- [ ] Implement CSRF protection
- [ ] Sanitize user input
- [ ] Validate file uploads
- [ ] Implement rate limiting on frontend
- [ ] Clear sensitive data on logout
- [ ] Use secure storage for tokens

---

## ⚡ Performance Tips

1. **Optimize API Calls**
   - Debounce search inputs (300ms)
   - Cache frequently accessed data
   - Use pagination for lists
   - Implement infinite scroll

2. **Image Optimization**
   - Lazy load base64 images
   - Use image placeholders
   - Compress before upload
   - Cache mindmap images

3. **Code Optimization**
   - Code splitting by route
   - Lazy load components
   - Memoize expensive computations
   - Use virtual scrolling for long lists

4. **Bundle Size**
   - Tree shake unused code
   - Use dynamic imports
   - Analyze bundle size
   - Remove console logs in production

---

## 🧪 Testing Strategy

### Unit Tests
- Test API service functions
- Test custom hooks
- Test utility functions
- Test form validation

### Integration Tests
- Test authentication flow
- Test chat functionality
- Test CRUD operations
- Test quiz submission

### E2E Tests
- Test complete user workflows
- Test critical paths
- Test error scenarios
- Test cross-browser compatibility

---

## 📱 Mobile Considerations

- Touch-friendly UI (min 44x44px tap targets)
- Pull-to-refresh functionality
- Swipe gestures for navigation
- Offline mode with service workers
- Push notifications for updates
- Camera access for profile pictures
- File picker for audio/documents

---

## 🎯 Key Features Priority

**Must Have (MVP)**
1. Authentication (login/register)
2. AI Study Chat
3. Study Sessions with RAG
4. Basic TODO management
5. Dashboard overview

**Should Have**
6. AI Friend Chat
7. Tutorial support with notes
8. Quiz generation and evaluation
9. Profile management
10. Password reset

**Nice to Have**
11. Mindmap visualization
12. Text-to-Speech
13. Speech-to-Text
14. Advanced analytics
15. Dark mode

---

## 📚 Additional Resources

- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Quick Reference**: [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
- **Postman Collection**: [Medha_AI_Postman_Collection.json](./Medha_AI_Postman_Collection.json)
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🐛 Common Issues & Solutions

### Issue: CORS errors
**Solution**: Backend already has CORS enabled for all origins. If issues persist, check browser console and backend logs.

### Issue: Token expired errors
**Solution**: Implement automatic redirect to login on 401. Show user-friendly message about session expiration.

### Issue: Large base64 images slow down UI
**Solution**: Implement lazy loading, use image placeholders, consider caching decoded images.

### Issue: AI responses take too long
**Solution**: Show typing indicators, implement streaming if possible, or show "this may take a moment" message.

### Issue: Chat messages not updating in real-time
**Solution**: Use polling (every 5 seconds) or implement WebSocket for real-time updates (requires backend changes).

---

## 💡 Tips for Success

1. **Start Simple**: Build authentication and one feature at a time
2. **Test Early**: Test API endpoints with Postman before frontend integration
3. **Use TypeScript**: Define types/interfaces for all API responses
4. **Component Library**: Use a UI library to speed up development
5. **Git Workflow**: Commit frequently, use feature branches
6. **Documentation**: Document your components and utilities
7. **Code Review**: Get feedback on your code
8. **User Testing**: Test with real users early and often

---

## 🎓 Learning Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- Axios Documentation: https://axios-http.com/
- JWT Best Practices: https://jwt.io/introduction

---

**Happy Coding! 🚀**

For questions or support, contact the backend team or refer to the API documentation.

