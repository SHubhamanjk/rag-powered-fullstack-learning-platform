// Study Session service for managing study sessions with RAG

import { apiService } from "./api";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  StudySessionChatRequest,
  StudySessionChatResponse,
  GetSessionsResponse,
  GetSessionDetailsResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
  DeleteSessionResponse,
  GenerateQuizRequest,
  GenerateQuizResponse,
  GenerateMindmapRequest,
  GenerateMindmapResponse,
} from "@/types/studySession";

class StudySessionService {
  // Create a new study session
  async createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
    return apiService.post<CreateSessionResponse>("/study-session/create", data);
  }

  // Send a message in study session chat (with RAG)
  async chatWithSession(data: StudySessionChatRequest): Promise<StudySessionChatResponse> {
    return apiService.post<StudySessionChatResponse>("/study-session/chat", data);
  }

  // Get all study sessions for the user
  async getMySessions(): Promise<GetSessionsResponse> {
    return apiService.get<GetSessionsResponse>("/study-session/my-sessions");
  }

  // Get details of a specific study session
  async getSessionDetails(sessionId: string): Promise<GetSessionDetailsResponse> {
    return apiService.get<GetSessionDetailsResponse>(`/study-session/${sessionId}`);
  }

  // Update a study session
  async updateSession(data: UpdateSessionRequest): Promise<UpdateSessionResponse> {
    return apiService.put<UpdateSessionResponse>("/study-session/update", data);
  }

  // Delete a study session
  async deleteSession(sessionId: string): Promise<DeleteSessionResponse> {
    return apiService.delete<DeleteSessionResponse>(`/study-session/${sessionId}`);
  }

  // Generate quiz from study session
  async generateQuiz(data: GenerateQuizRequest): Promise<GenerateQuizResponse> {
    return apiService.post<GenerateQuizResponse>("/study-session/quiz/generate", data);
  }

  // Generate mindmaps from study session
  async generateMindmap(data: GenerateMindmapRequest): Promise<GenerateMindmapResponse> {
    return apiService.post<GenerateMindmapResponse>("/study-session/mindmap/generate", data);
  }

  // Evaluate study session quiz
  async evaluateQuiz(quizId: string, answers: Array<{ question_id: string; answer: string | number }>): Promise<any> {
    return apiService.post<any>("/study-session/quiz/evaluate", {
      quiz_id: quizId,
      answers
    });
  }

  // Get all quizzes for a session
  async getSessionQuizzes(sessionId: string): Promise<any> {
    return apiService.get<any>(`/study-session/${sessionId}/quizzes`);
  }

  // Get quiz details
  async getQuizDetails(quizId: string): Promise<any> {
    return apiService.get<any>(`/study-session/quiz/${quizId}`);
  }

  // Get all mindmaps for a session
  async getSessionMindmaps(sessionId: string): Promise<any> {
    return apiService.get<any>(`/study-session/${sessionId}/mindmaps`);
  }
}

export const studySessionService = new StudySessionService();

