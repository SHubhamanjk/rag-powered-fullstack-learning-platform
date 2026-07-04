// Tutorial type definitions

export interface Tutorial {
  tutorial_id: string;
  email?: string;
  tutorial_link: string;
  title: string;
  group: string;
  notes_count: number;
  created_at: string;
  updated_at: string;
  last_position?: number;
}

export interface Note {
  note_id: string;
  note?: string;
  image?: string; // Base64 encoded image
  timestamp: string;
  datetime: string;
}

export interface CreateTutorialRequest {
  tutorial_link: string;
  group?: string;
}

export interface CreateTutorialResponse {
  message: string;
  title: string;
  tutorial_id: string;
}

export interface EditTutorialRequest {
  title?: string;
  group?: string;
}

export interface ConsolidatedNotesRequest {
  group: string;
}

export interface ConsolidatedNotesResponse {
  group: string;
  notes_content: string;
  tutorials_included: number;
  message: string;
}

export interface AddNoteRequest {
  tutorial_id: string;
  note?: string;
  image?: string; // Base64 encoded image
  timestamp: string;
}

export interface AddNoteResponse {
  message: string;
  note_id: string;
}

export interface GetNotesResponse {
  tutorial_id: string;
  tutorial_link: string;
  title: string;
  notes: Note[];
}

export interface UpdateNoteRequest {
  updated_text?: string;
  updated_image?: string; // Base64 encoded image
}

export interface UpdateNoteResponse {
  message: string;
  note_id: string;
}

export interface DeleteNoteResponse {
  message: string;
  note_id: string;
}

export interface PrettifyNotesRequest {
  tutorial_id: string;
}

export interface PrettifyNotesResponse {
  tutorial_id: string;
  title: string;
  prettified_notes: string;
}

export interface DetailedNotesRequest {
  tutorial_id: string;
}

export interface DetailedNotesResponse {
  tutorial_id: string;
  title: string;
  detailed_notes: string;
}

export interface GetAllTutorialsResponse {
  email: string;
  tutorials: Tutorial[];
  total: number;
  page: number;
  limit: number;
}

export interface TutorialChatRequest {
  tutorial_id: string;
  question: string;
  current_timestamp?: string; // Optional: Current video position (MM:SS or HH:MM:SS) for context
}

export interface TutorialChatResponse {
  tutorial_id: string;
  question: string;
  answer: string;
}

export interface TutorialChatHistoryResponse {
  tutorial_id: string;
  title: string;
  chat_history: ChatMessage[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
  tutorial_id: string;
  from_timestamp: string;
  to_timestamp: string;
}

export interface GenerateQuizResponse {
  message: string;
  quiz_id: string;
  tutorial_id: string;
  tutorial_title: string;
  from_timestamp: string;
  to_timestamp: string;
  total_questions: number;
  mcq_questions: MCQQuestion[];
  descriptive_questions: DescriptiveQuestion[];
  created_at: string;
}

export interface QuizAnswer {
  question_id: string;
  answer: number | string;
}

export interface EvaluateQuizRequest {
  quiz_id: string;
  answers: QuizAnswer[];
}

export interface QuestionResult {
  question_id: string;
  is_correct: boolean;
  user_answer: number | string;
  correct_answer?: number | string;
  feedback?: string;
  score?: number;
}

export interface EvaluateQuizResponse {
  quiz_id: string;
  tutorial_id: string;
  mcq_score: number;
  descriptive_score: number;
  total_score: number;
  max_score: number;
  percentage: number;
  results: QuestionResult[];
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  study_suggestions: string[];
  evaluated_at: string;
}

export interface Quiz {
  quiz_id: string;
  tutorial_id: string;
  tutorial_title: string;
  from_timestamp: string;
  to_timestamp: string;
  total_questions: number;
  is_evaluated: boolean;
  score?: number;
  percentage?: number;
  created_at: string;
  mcq_questions?: MCQQuestion[];
  descriptive_questions?: DescriptiveQuestion[];
  evaluation?: EvaluateQuizResponse;
}

export interface GetQuizDetailsResponse extends Quiz {
  mcq_questions: MCQQuestion[];
  descriptive_questions: DescriptiveQuestion[];
}

export interface GetTutorialQuizzesResponse {
  tutorial_id: string;
  tutorial_title: string;
  quizzes: Quiz[];
}

export interface GetUserQuizzesResponse {
  email: string;
  quizzes: Quiz[];
}

export interface QuizAnswer {
  question_id: string;
  question_type: 'mcq' | 'descriptive';
  selected_option?: string; // For MCQ
  answer_text?: string; // For descriptive
}

export interface QuizSubmission {
  quiz_id: string;
  answers: QuizAnswer[];
}

export interface QuizResult {
  quiz_id: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  percentage: number;
  detailed_results: {
    question_id: string;
    question: string;
    question_type: 'mcq' | 'descriptive';
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation?: string;
  }[];
}

export interface Mindmap {
  mindmap_id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
}

export interface GenerateMindmapRequest {
  tutorial_id: string;
}

export interface GenerateMindmapResponse {
  message: string;
  tutorial_id: string;
  mindmaps: Mindmap[];
}

export interface GetMindmapsResponse {
  tutorial_id: string;
  mindmaps: Mindmap[];
}

