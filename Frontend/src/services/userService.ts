// User management service

import { apiService } from "./api";
import type {
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
  User,
  UpdateUserRequest,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResetPasswordRequest,
} from "@/types/user";

class UserService {
  // Create new user (signup)
  async createUser(userData: CreateUserRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>("/user/create", userData);
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem("authToken", response.token);
    }
    
    return response;
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>("/user/login", credentials);
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem("authToken", response.token);
    }
    
    return response;
  }

  // Get current user details
  async getCurrentUser(): Promise<User> {
    return apiService.get<User>("/user/me");
  }

  // Update user profile
  async updateUser(userData: UpdateUserRequest): Promise<{ message: string; email: string }> {
    return apiService.put("/user/me", userData);
  }

  // Forgot password - send OTP
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string; email: string }> {
    return apiService.post("/user/forgot-password", data);
  }

  // Verify OTP
  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return apiService.post("/user/verify-otp", data);
  }

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string; success: boolean }> {
    return apiService.post("/user/reset-password", data);
  }

  // Logout (clear local storage)
  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }
}

export const userService = new UserService();

