// Chat service for Study Mode

import { apiService } from "./api";
import type {
  CreateChatResponse,
  SendMessageRequest,
  SendMessageResponse,
  ChatHistory,
  GetChatsResponse,
  DeleteChatResponse,
} from "@/types/chat";

class ChatService {
  // Create a new chat session
  async createChat(): Promise<CreateChatResponse> {
    return apiService.post<CreateChatResponse>("/chat/create");
  }

  // Send a message (creates new chat if chat_id is null/empty)
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    // Remove chat_id if it's undefined or empty
    const payload = {
      message: data.message,
      ...(data.chat_id && { chat_id: data.chat_id }),
    };
    return apiService.post<SendMessageResponse>("/chat/", payload);
  }

  // Get chat history by chat_id
  async getChatHistory(chatId: string): Promise<ChatHistory> {
    return apiService.get<ChatHistory>(`/chat/${chatId}`);
  }

  // Get all chats for the authenticated user
  async getMyChats(): Promise<GetChatsResponse> {
    return apiService.get<GetChatsResponse>("/chat/my-chats");
  }

  // Delete a chat
  async deleteChat(chatId: string): Promise<DeleteChatResponse> {
    return apiService.delete<DeleteChatResponse>(`/chat/${chatId}`);
  }
}

export const chatService = new ChatService();

