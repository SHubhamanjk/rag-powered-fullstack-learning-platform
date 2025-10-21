// Dashboard type definitions based on backend API

export interface Analytics {
  total_study_chats: number;
  total_friend_chats: number;
  total_study_sessions: number;
  total_tutorials: number;
  total_todos: number;
  todos_pending: number;
  todos_in_progress: number;
  todos_done: number;
  total_quizzes: number;
  total_mindmaps: number;
}

export interface ChatSummary {
  chat_id: string;
  title: string;
  message_count: number;
  created_at: string;
  last_updated: string;
}

export interface Quiz {
  _id: string;
  quiz_type: string;
  created_at: string;
}

export interface Mindmap {
  _id: string;
  created_at: string;
  image_url?: string;
}

export interface StudySessionSummary {
  session_id: string;
  session_name: string;
  subject: string;
  grade: string;
  chat_message_count: number;
  quizzes: Quiz[];
  mindmaps: Mindmap[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  note_id: string;
  timestamp: string;
  note: string;
  created_at: string;
}

export interface TutorialSummary {
  tutorial_id: string;
  title: string;
  tutorial_link: string;
  notes_count: number;
  chat_message_count: number;
  quizzes: Quiz[];
  mindmaps: Mindmap[];
  created_at: string;
  updated_at: string;
}

export interface TodoSummary {
  todo_id: string;
  task: string;
  description?: string;
  status: "pending" | "in_progress" | "done";
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardResponse {
  email: string;
  analytics: Analytics;
  study_chats: ChatSummary[];
  friend_chats: ChatSummary[];
  study_sessions: StudySessionSummary[];
  tutorials: TutorialSummary[];
  todos: TodoSummary[];
}

