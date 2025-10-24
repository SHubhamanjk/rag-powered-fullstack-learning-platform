/**
 * Memory Vault Service
 * API calls for Memory Vault functionality
 */

import { apiService } from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  similarity_threshold?: number;
  provide_link?: boolean;
}

export interface ChatResponse {
  response: string;
  matched_item?: string | null;
  is_file?: boolean | null;
  distance?: number | null;
  status: string;
  action: string;
  download_link?: string | null;
  file_name?: string | null;
}

export interface UploadFileResponse {
  item_id: string;
  message: string;
  file_name: string;
  azure_path: string;
}

export interface SaveNoteResponse {
  item_id: string;
  message: string;
  display_name: string;
}

export interface MemoryItem {
  item_id: string;
  display_name: string;
  description?: string;
  item_type: string;
  is_file: boolean;
  file_name: string;
  created_at: string;
  has_file: boolean;
}

export interface GetMyItemsResponse {
  user_email: string;
  total_items: number;
  items: MemoryItem[];
}

export interface ChatHistoryResponse {
  user_email: string;
  chat_history: ChatMessage[];
  total_messages: number;
}

export interface DownloadLinkResponse {
  item_id: string;
  file_name: string;
  download_link: string;
  expires_in_hours: number;
}

class MemoryVaultService {
  /**
   * Main chat endpoint - send messages to Memory Vault
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return apiService.post<ChatResponse>("/memory-vault/chat", request);
  }

  /**
   * Upload a file to Memory Vault
   */
  async uploadFile(file: File, description?: string): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);
    // Only append description if it has actual content
    if (description && description.trim()) {
      formData.append("description", description.trim());
    }

    // Use custom fetch for FormData to let browser set Content-Type with boundary
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/memory-vault/upload-file`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || error.message || "Upload failed");
    }

    return response.json();
  }

  /**
   * Save a text note
   */
  async saveNote(message: string, description?: string): Promise<SaveNoteResponse> {
    return apiService.post<SaveNoteResponse>("/memory-vault/save-note", {
      message,
      description,
    });
  }

  /**
   * Get all items in vault
   */
  async getMyItems(): Promise<GetMyItemsResponse> {
    return apiService.get<GetMyItemsResponse>("/memory-vault/my-items");
  }

  /**
   * Get chat history
   */
  async getChatHistory(limit: number = 100): Promise<ChatHistoryResponse> {
    return apiService.get<ChatHistoryResponse>(`/memory-vault/chat-history?limit=${limit}`);
  }

  /**
   * Get download link for a file
   */
  async getDownloadLink(itemId: string): Promise<DownloadLinkResponse> {
    return apiService.get<DownloadLinkResponse>(`/memory-vault/download/${itemId}`);
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<{ item_id: string; message: string }> {
    return apiService.delete(`/memory-vault/${itemId}`);
  }

  /**
   * Transcribe audio without saving
   */
  async transcribeAudio(audioFile: File): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append("file", audioFile);

    // Use custom fetch for FormData
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/memory-vault/transcribe`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Transcription failed" }));
      throw new Error(error.detail || error.message || "Transcription failed");
    }

    return response.json();
  }
}

export const memoryVaultService = new MemoryVaultService();

