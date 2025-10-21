// User type definitions based on backend API

export interface EducationalDetails {
  institution: string;
  degree: string;
  field_of_study: string;
  year_of_study: string;
  grade: string;
}

export interface User {
  email: string;
  name: string;
  age: number;
  gender: string;
  educational_details: EducationalDetails;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  age: number;
  gender: string;
  educational_details: EducationalDetails;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  name?: string;
  message: string;
}

export interface UpdateUserRequest {
  name?: string;
  age?: number;
  gender?: string;
  educational_details?: EducationalDetails;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  verified: boolean;
  reset_token: string;
}

export interface ResetPasswordRequest {
  email: string;
  reset_token: string;
  new_password: string;
}

export interface ApiError {
  detail: string | Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

