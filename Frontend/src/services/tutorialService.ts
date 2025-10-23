// Tutorial service

import { apiService } from "./api";
import type {
  CreateTutorialRequest,
  CreateTutorialResponse,
  AddNoteRequest,
  AddNoteResponse,
  GetNotesResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  DeleteNoteResponse,
  PrettifyNotesRequest,
  PrettifyNotesResponse,
  DetailedNotesRequest,
  DetailedNotesResponse,
  GetAllTutorialsResponse,
  TutorialChatRequest,
  TutorialChatResponse,
  EditTutorialRequest,
  ConsolidatedNotesRequest,
  ConsolidatedNotesResponse,
  GenerateQuizRequest,
  GenerateQuizResponse,
  EvaluateQuizRequest,
  EvaluateQuizResponse,
  GetQuizDetailsResponse,
  GetTutorialQuizzesResponse,
  GetUserQuizzesResponse,
  GenerateMindmapRequest,
  GenerateMindmapResponse,
  GetMindmapsResponse,
  QuizSubmission,
  QuizResult,
  TutorialChatHistoryResponse,
} from "@/types/tutorial";

class TutorialService {
  // Create a new tutorial session
  async createTutorial(data: CreateTutorialRequest): Promise<CreateTutorialResponse> {
    return apiService.post<CreateTutorialResponse>("/tutorial-support/create", data);
  }

  // Add a note to a tutorial
  async addNote(data: AddNoteRequest): Promise<AddNoteResponse> {
    return apiService.post<AddNoteResponse>("/tutorial-support/notes/add", data);
  }

  // Get all notes for a tutorial
  async getNotes(tutorialId: string): Promise<GetNotesResponse> {
    return apiService.get<GetNotesResponse>(`/tutorial-support/notes?tutorial_id=${tutorialId}`);
  }

  // Update a specific note
  async updateNote(noteId: string, data: UpdateNoteRequest): Promise<UpdateNoteResponse> {
    return apiService.put<UpdateNoteResponse>(`/tutorial-support/notes/${noteId}`, data);
  }

  // Delete a specific note
  async deleteNote(noteId: string): Promise<DeleteNoteResponse> {
    return apiService.delete<DeleteNoteResponse>(`/tutorial-support/notes/${noteId}`);
  }

  // Generate prettified notes
  async prettifyNotes(data: PrettifyNotesRequest): Promise<PrettifyNotesResponse> {
    return apiService.post<PrettifyNotesResponse>("/tutorial-support/notes/prettify", data);
  }

  // Generate detailed notes
  async detailedNotes(data: DetailedNotesRequest): Promise<DetailedNotesResponse> {
    return apiService.post<DetailedNotesResponse>("/tutorial-support/notes/detailed", data);
  }

  // Get all tutorials for authenticated user
  async getMyTutorials(): Promise<GetAllTutorialsResponse> {
    return apiService.get<GetAllTutorialsResponse>("/tutorial-support/my-tutorials");
  }

  // Chat with AI about the tutorial
  async chatWithAI(data: TutorialChatRequest): Promise<TutorialChatResponse> {
    return apiService.post<TutorialChatResponse>("/tutorial-support/chat", data);
  }


  // Generate a quiz
  async generateQuiz(data: GenerateQuizRequest): Promise<GenerateQuizResponse> {
    return apiService.post<GenerateQuizResponse>("/tutorial-support/quiz/generate", data);
  }

  // Evaluate quiz answers
  async evaluateQuiz(data: EvaluateQuizRequest): Promise<EvaluateQuizResponse> {
    return apiService.post<EvaluateQuizResponse>("/tutorial-support/quiz/evaluate", data);
  }

  // Get quiz details
  async getQuizDetails(quizId: string): Promise<GetQuizDetailsResponse> {
    return apiService.get<GetQuizDetailsResponse>(`/tutorial-support/quiz/${quizId}`);
  }

  // Get all quizzes for a tutorial
  async getTutorialQuizzes(tutorialId: string): Promise<GetTutorialQuizzesResponse> {
    return apiService.get<GetTutorialQuizzesResponse>(`/tutorial-support/quiz/tutorial/${tutorialId}`);
  }

  // Get all quizzes for authenticated user
  async getMyQuizzes(): Promise<GetUserQuizzesResponse> {
    return apiService.get<GetUserQuizzesResponse>("/tutorial-support/quiz/my-quizzes");
  }

  // Generate mindmaps
  async generateMindmap(data: GenerateMindmapRequest): Promise<GenerateMindmapResponse> {
    return apiService.post<GenerateMindmapResponse>("/tutorial-support/mindmap/generate", data);
  }

  // Get mindmaps for a tutorial
  async getMindmaps(tutorialId: string): Promise<GetMindmapsResponse> {
    return apiService.get<GetMindmapsResponse>(`/tutorial-support/mindmap/${tutorialId}`);
  }

  // Submit quiz answers
  async submitQuiz(data: QuizSubmission): Promise<QuizResult> {
    return apiService.post<QuizResult>("/tutorial-support/quiz/evaluate", data);
  }

  // Get chat history for a tutorial
  async getChatHistory(tutorialId: string): Promise<TutorialChatHistoryResponse> {
    return apiService.get<TutorialChatHistoryResponse>(`/tutorial-support/chat/history/${tutorialId}`);
  }

  // Edit tutorial
  async editTutorial(tutorialId: string, data: EditTutorialRequest): Promise<{message: string; tutorial_id: string}> {
    return apiService.patch<{message: string; tutorial_id: string}>(`/tutorial-support/${tutorialId}`, data);
  }

  // Delete tutorial
  async deleteTutorial(tutorialId: string): Promise<{message: string; tutorial_id: string}> {
    return apiService.delete<{message: string; tutorial_id: string}>(`/tutorial-support/${tutorialId}`);
  }

  // Generate consolidated notes from group
  async generateConsolidatedNotes(data: ConsolidatedNotesRequest): Promise<ConsolidatedNotesResponse> {
    return apiService.post<ConsolidatedNotesResponse>("/tutorial-support/consolidated-notes", data);
  }
}

export const tutorialService = new TutorialService();

