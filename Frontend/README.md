# Medha.ai - AI-Powered Learning Platform

An intelligent learning companion that transforms education through AI-powered features including doubt solving, interactive tutorials, smart study sessions, and personalized learning paths.

## 📸 Screenshots

| Landing Page | Study Companion | Tutorial Companion |
|---|---|---|
| ![Landing Page](../images/landingpage.png) | ![Study Companion](../images/study%20companion.png) | ![Tutorial Companion](../images/tutorial%20companion.png) |

| Notes | Smart Quizzes | Smart To-Dos |
|---|---|---|
| ![Notes](../images/notes.png) | ![Smart Quizzes](../images/smart%20quizzes.png) | ![Smart To-Dos](../images/smarttodos.png) |

## 🚀 Features

- **AI Doubt Assistant**: Get instant answers with ChatGPT-like AI assistant with text and voice input support
- **Interactive Tutorial Watch**: Watch videos with AI-powered notes, auto-pause on questions, quiz generation, and mind maps
- **Smart Study Mode**: Create study sessions, upload materials, chat with AI about your content, and generate quizzes
- **Memory Vault**: Save notes and upload files, then search and chat with your personal knowledge base (RAG + download links)
- **Smart To-Do**: Manage tasks with AI suggestions and intelligent organization
- **Learning Analytics**: Track progress, quiz performance, and study patterns with beautiful visualizations
- **Voice I/O**: Speak your questions and hear responses with text-to-speech support

## 🛠️ Technologies Used

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **State Management**: React Context + Hooks
- **API Client**: Axios with JWT authentication
- **PDF Processing**: PDF.js
- **Markdown**: React Markdown with syntax highlighting

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Medha.ai/Frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the Frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GA_MEASUREMENT_ID=G-EXAMPLE123
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 📦 Build for Production

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
Frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── Layout.tsx   # Layout wrapper
│   │   ├── Navbar.tsx   # Navigation bar
│   │   └── MarkdownMessage.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   │   ├── Index.tsx    # Landing page
│   │   ├── Home.tsx     # AI Chat
│   │   ├── TutorialWatch.tsx
│   │   ├── StudyMode.tsx
│   │   ├── Quiz.tsx
│   │   ├── Todo.tsx
│   │   └── Profile.tsx
│   ├── services/        # API services
│   │   ├── api.ts       # Base API client
│   │   ├── chatService.ts
│   │   ├── tutorialService.ts
│   │   ├── studySessionService.ts
│   │   └── ...
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Utility functions
│   └── main.tsx         # Application entry point
├── public/              # Static assets
│   ├── logo.png         # Medha.ai logo and favicon
│   ├── robots.txt       # SEO crawler instructions
│   └── site.webmanifest # PWA manifest
└── index.html           # HTML template
```

## 🎨 Key Features Implementation

### Authentication
- JWT-based authentication
- Protected routes
- Auto-refresh on token expiration

### AI Chat
- Study mode: Subject-specific doubt solving
- Friend mode: Casual conversation
- Voice input/output support
- Chat history management

### Tutorial Support
- YouTube video integration with transcript
- AI-powered note generation
- Interactive Q&A during videos
- Auto-generated quizzes and mind maps

### Study Sessions
- Upload PDF materials (syllabus, resources, PYQs)
- RAG-based AI chat with your materials
- Generate custom quizzes
- Create visual mind maps

### Memory Vault
- **Two modes**: `/add` (save notes / upload files) and `/search` (query your vault)
- Upload files with optional description and get them indexed for semantic search
- Save quick notes/snippets that become searchable
- Voice notes: record audio → transcribe → save as a searchable note
- Ask questions in natural language; when you request a file, the UI can show a **download button** (time-limited link)

### Quiz System
- MCQ and descriptive questions
- AI-powered evaluation
- Detailed feedback and scoring
- Performance tracking

## 🔌 API Integration

The frontend communicates with the FastAPI backend at the configured `VITE_API_BASE_URL`. All authenticated requests include JWT tokens in the Authorization header.

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 🐛 Known Issues

- None at the moment

## 📧 Contact

### Project Owner

- **Name**: Shubham Kumar Gupta
- **Role**: AI/ML Engineer & Full-Stack Developer
- **Email**: [shubham07kumargupta@gmail.com](mailto:shubham07kumargupta@gmail.com)
- **Mobile**: `+91 8002007238`
- **LinkedIn**: [linkedin.com/in/shubhamiitpatna](https://linkedin.com/in/shubhamiitpatna)
- **GitHub**: [github.com/SHubhamanjk](https://github.com/SHubhamanjk)

---

**Built with ❤️ for better learning**
