// Study Session type definitions

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface StudySessionMetadata {
  subject: string;
  grade: string;
  study_details: string;
  resources_text?: string;
  pyq_text?: string;
  syllabus_text?: string;
}

export interface StudySession {
  session_id: string;
  session_name: string;
  email: string;
  subject: string;
  grade: string;
  metadata: StudySessionMetadata;
  chat_history: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  subject: string;
  grade: string;
  study_details: string;
  resources_text?: string;
  pyq_text?: string;
  syllabus_text?: string;
}

export interface CreateSessionResponse {
  session_id: string;
  session_name: string;
  message: string;
}

export interface StudySessionChatRequest {
  session_id: string;
  question: string;
}

export interface StudySessionChatResponse {
  session_id: string;
  response: string;
}

export interface GetSessionsResponse {
  email: string;
  sessions: {
    session_id: string;
    session_name: string;
    subject: string;
    grade: string;
    created_at: string;
    updated_at: string;
  }[];
}

export interface GetSessionDetailsResponse {
  session_id: string;
  session_name: string;
  email: string;
  metadata: StudySessionMetadata;
  chat_history: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface UpdateSessionRequest {
  session_id: string;
  session_name?: string;
  subject?: string;
  grade?: string;
  study_details?: string;
  resources_text?: string;
  pyq_text?: string;
  syllabus_text?: string;
}

export interface UpdateSessionResponse {
  session_id: string;
  message: string;
}

export interface DeleteSessionResponse {
  session_id: string;
  message: string;
}

export interface MCQQuestion {
  question_id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
}

export interface DescriptiveQuestion {
  question_id: string;
  question: string;
  expected_answer: string;
}

export interface GenerateQuizRequest {
  session_id: string;
}

export interface GenerateQuizResponse {
  session_id: string;
  quiz_id: string;
  mcq_questions: MCQQuestion[];
  descriptive_questions: DescriptiveQuestion[];
  message: string;
}

export interface Mindmap {
  mindmap_id: string;
  title: string;
  description: string;
  image_b64: string;
  created_at: string;
}

export interface GenerateMindmapRequest {
  session_id: string;
}

export interface GenerateMindmapResponse {
  session_id: string;
  mindmaps: Mindmap[];
  message: string;
}

