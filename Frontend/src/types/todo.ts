// TODO type definitions

export type TodoStatus = "pending" | "in_progress" | "done";

export interface Todo {
  todo_id: string;
  email: string;
  task: string;
  category: string;
  description?: string;
  status: TodoStatus;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  task: string;
  category: string;
  description?: string;
  date?: string;
}

export interface CreateTodoResponse {
  todo_id: string;
  message: string;
}

export interface UpdateTodoRequest {
  todo_id: string;
  task?: string;
  category?: string;
  description?: string;
  date?: string;
  status?: TodoStatus;
}

export interface UpdateTodoResponse {
  todo_id: string;
  message: string;
}

export interface MarkDoneRequest {
  todo_id: string;
}

export interface MarkDoneResponse {
  todo_id: string;
  message: string;
  status: string;
}

export interface DeleteTodoResponse {
  todo_id: string;
  message: string;
}

export interface GetTodosResponse {
  email: string;
  todos: Todo[];
}

export interface FilterTodosResponse {
  email: string;
  status: string;
  todos: Todo[];
}

export interface TodoHelpRequest {
  todo_id: string;
  question: string;
}

export interface TodoHelpResponse {
  todo_id: string;
  response: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface TodoChatHistoryResponse {
  todo_id: string;
  task: string;
  chat_history: ChatMessage[];
}

