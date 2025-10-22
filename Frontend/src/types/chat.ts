// Chat type definitions for Study and Friend modes

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Chat {
  chat_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatHistory {
  chat_id: string;
  user_email: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface CreateChatResponse {
  chat_id: string;
  message: string;
}

export interface SendMessageRequest {
  chat_id?: string | null;
  message: string;
}

export interface SendMessageResponse {
  chat_id: string;
  response: string;
  title: string;
}

export interface GetChatsResponse {
  email: string;
  chats: Chat[];
}

export interface DeleteChatResponse {
  chat_id: string;
  message: string;
}

export interface TemporaryChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TemporaryChatRequest {
  message: string;
  conversation_history: TemporaryChatMessage[];
}

export interface TemporaryChatResponse {
  response: string;
}

export type ChatMode = "study" | "friend";

