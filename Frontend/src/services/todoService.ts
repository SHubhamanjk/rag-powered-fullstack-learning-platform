// TODO service

import { apiService } from "./api";
import type {
  CreateTodoRequest,
  CreateTodoResponse,
  UpdateTodoRequest,
  UpdateTodoResponse,
  MarkDoneRequest,
  MarkDoneResponse,
  DeleteTodoResponse,
  GetTodosResponse,
  FilterTodosResponse,
  TodoHelpRequest,
  TodoHelpResponse,
  TodoChatHistoryResponse,
  TodoStatus,
} from "@/types/todo";

class TodoService {
  // Create a new todo
  async createTodo(data: CreateTodoRequest): Promise<CreateTodoResponse> {
    return apiService.post<CreateTodoResponse>("/todo/create", data);
  }

  // Update an existing todo
  async updateTodo(data: UpdateTodoRequest): Promise<UpdateTodoResponse> {
    return apiService.put<UpdateTodoResponse>("/todo/update", data);
  }

  // Mark a todo as done
  async markDone(data: MarkDoneRequest): Promise<MarkDoneResponse> {
    return apiService.put<MarkDoneResponse>("/todo/mark-done", data);
  }

  // Delete a todo
  async deleteTodo(todoId: string): Promise<DeleteTodoResponse> {
    return apiService.delete<DeleteTodoResponse>(`/todo/${todoId}`);
  }

  // Get all todos for authenticated user
  async getMyTodos(): Promise<GetTodosResponse> {
    return apiService.get<GetTodosResponse>("/todo/my-todos");
  }

  // Filter todos by status
  async filterTodos(status: TodoStatus): Promise<FilterTodosResponse> {
    return apiService.get<FilterTodosResponse>(`/todo/filter?status=${status}`);
  }

  // Get AI help for a todo
  async getTodoHelp(data: TodoHelpRequest): Promise<TodoHelpResponse> {
    return apiService.post<TodoHelpResponse>("/todo/help", data);
  }

  // Get chat history for a todo
  async getChatHistory(todoId: string): Promise<TodoChatHistoryResponse> {
    return apiService.get<TodoChatHistoryResponse>(`/todo/chat-history/${todoId}`);
  }
}

export const todoService = new TodoService();

