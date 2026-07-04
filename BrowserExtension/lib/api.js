// Medha.ai API Service for Browser Extension
// Reuses existing backend endpoints

class MedhaAPI {
  constructor() {
    this.baseURL = 'https://me-be-prod-849608379958.asia-south1.run.app';
  }

  async getAuthToken() {
    const result = await chrome.storage.local.get(['authToken']);
    return result.authToken;
  }

  async setAuthToken(token) {
    await chrome.storage.local.set({ authToken: token });
  }

  async clearAuthToken() {
    await chrome.storage.local.remove(['authToken']);
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      let data;
      try {
        data = await response.json();
      } catch {
        data = { detail: 'Invalid response from server' };
      }

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthToken();
          throw new Error('Session expired. Please login again.');
        }
        
        const errorMessage = this.extractErrorMessage(data);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please check your internet connection.');
    }
  }

  extractErrorMessage(errorData) {
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    }
    if (errorData.message) {
      return errorData.message;
    }
    if (errorData.error) {
      return errorData.error;
    }
    return 'Something went wrong. Please try again.';
  }

  // ============================================================================
  // USER AUTHENTICATION
  // ============================================================================

  async signup(userData) {
    return this.request('/user/create', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password) {
    return this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/user/me');
  }

  async forgotPassword(email) {
    return this.request('/user/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email, otp) {
    return this.request('/user/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resetPassword(email, reset_token, new_password) {
    return this.request('/user/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, reset_token, new_password }),
    });
  }

  // ============================================================================
  // TUTORIAL SUPPORT
  // ============================================================================

  async createTutorial(tutorialLink, group) {
    return this.request('/tutorial-support/create', {
      method: 'POST',
      body: JSON.stringify({ tutorial_link: tutorialLink, group }),
    });
  }

  async updateTutorial(tutorialId, updates) {
    return this.request(`/tutorial-support/${tutorialId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async addNote(tutorialId, note, timestamp, image) {
    return this.request('/tutorial-support/notes/add', {
      method: 'POST',
      body: JSON.stringify({ 
        tutorial_id: tutorialId, 
        note: note || undefined,
        image: image || undefined,
        timestamp 
      }),
    });
  }

  async getNotes(tutorialId) {
    return this.request(`/tutorial-support/notes?tutorial_id=${tutorialId}`);
  }

  async updateNote(noteId, updatedText) {
    return this.request(`/tutorial-support/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ updated_text: updatedText }),
    });
  }

  async deleteNote(noteId) {
    return this.request(`/tutorial-support/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async chatWithAI(tutorialId, question, currentTimestamp) {
    return this.request('/tutorial-support/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        tutorial_id: tutorialId, 
        question,
        current_timestamp: currentTimestamp 
      }),
    });
  }

  async getChatHistory(tutorialId) {
    return this.request(`/tutorial-support/chat/history/${tutorialId}`);
  }

  async generateQuiz(tutorialId, fromTimestamp, toTimestamp) {
    return this.request('/tutorial-support/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        tutorial_id: tutorialId, 
        from_timestamp: fromTimestamp,
        to_timestamp: toTimestamp
      }),
    });
  }

  async getTutorialQuizzes(tutorialId) {
    return this.request(`/tutorial-support/quiz/tutorial/${tutorialId}`);
  }

  async getQuizDetails(quizId) {
    return this.request(`/tutorial-support/quiz/${quizId}`);
  }

  async evaluateQuiz(quizId, answers) {
    return this.request('/tutorial-support/quiz/evaluate', {
      method: 'POST',
      body: JSON.stringify({ 
        quiz_id: quizId, 
        answers: answers 
      }),
    });
  }

  async generateMindmap(tutorialId) {
    return this.request('/tutorial-support/mindmap/generate', {
      method: 'POST',
      body: JSON.stringify({ tutorial_id: tutorialId }),
    });
  }

  async getMindmaps(tutorialId) {
    return this.request(`/tutorial-support/mindmap/${tutorialId}`);
  }

  async getMyTutorials() {
    return this.request('/tutorial-support/my-tutorials');
  }

  async findTutorialByLink(tutorialLink) {
    const response = await this.getMyTutorials();
    const tutorials = response.tutorials || [];
    return tutorials.find(t => t.tutorial_link === tutorialLink);
  }

  async prettifyNotes(tutorialId) {
    return this.request('/tutorial-support/notes/prettify', {
      method: 'POST',
      body: JSON.stringify({ tutorial_id: tutorialId }),
    });
  }

  async generateDetailedNotes(tutorialId) {
    return this.request('/tutorial-support/notes/detailed', {
      method: 'POST',
      body: JSON.stringify({ tutorial_id: tutorialId }),
    });
  }
}

// Create global instance
const api = new MedhaAPI();

