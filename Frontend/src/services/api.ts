// API service for backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Get authorization header with JWT token
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Generic request handler
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch {
        data = { detail: "Invalid response from server" };
      }

      if (!response.ok) {
        // Handle specific status codes with user-friendly messages
        let errorMessage = this.extractErrorMessage(data);
        
        // Provide specific messages for common HTTP status codes
        if (response.status === 401) {
          errorMessage = errorMessage || "Your session has expired. Please log in again.";
          // Clear auth token on 401
          localStorage.removeItem("authToken");
        } else if (response.status === 403) {
          errorMessage = errorMessage || "You don't have permission to perform this action.";
        } else if (response.status === 404) {
          errorMessage = errorMessage || "The requested resource was not found.";
        } else if (response.status === 500) {
          errorMessage = errorMessage || "Server error. Please try again later.";
        } else if (response.status === 503) {
          errorMessage = "Service temporarily unavailable. Please try again later.";
        }
        
        throw {
          status: response.status,
          message: errorMessage,
          details: data,
        };
      }

      return data;
    } catch (error: any) {
      // If error already has status (thrown by us), rethrow it
      if (error.status) {
        throw error;
      }
      
      // Network or other errors
      if (error.name === "TypeError" || error.message?.includes("fetch")) {
        throw {
          status: 0,
          message: "Network error. Please check your internet connection and try again.",
          details: error,
        };
      }
      
      // Unknown errors
      throw {
        status: 0,
        message: "An unexpected error occurred. Please try again.",
        details: error,
      };
    }
  }

  // Extract user-friendly error message
  private extractErrorMessage(errorData: any): string {
    // Check for detail field (FastAPI standard)
    if (typeof errorData.detail === "string") {
      return errorData.detail;
    }
    
    // Handle validation errors (array of error objects)
    if (Array.isArray(errorData.detail)) {
      const errors = errorData.detail.map((e: any) => {
        if (e.msg) {
          return e.msg;
        }
        if (e.message) {
          return e.message;
        }
        return "Invalid input";
      });
      return errors.join(". ");
    }
    
    // Check for message field
    if (errorData.message && typeof errorData.message === "string") {
      return errorData.message;
    }
    
    // Check for error field
    if (errorData.error && typeof errorData.error === "string") {
      return errorData.error;
    }
    
    // Default fallback
    return "Something went wrong. Please try again.";
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Upload file (for future use with STT, etc.)
  async uploadFile<T>(endpoint: string, file: File, fieldName = "file"): Promise<T> {
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: this.extractErrorMessage(data),
        details: data,
      };
    }

    return data;
  }
}

export const apiService = new ApiService(API_BASE_URL);

