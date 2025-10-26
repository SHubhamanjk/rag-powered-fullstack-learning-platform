/**
 * Speech-to-Text Service
 * Handles audio transcription with fallback support
 */

import { apiService } from "./api";

export interface TranscriptionResponse {
  text: string;
}

class STTService {
  /**
   * Transcribe audio file using primary endpoint with fallback
   * Tries /stt/ first, then /memory-vault/transcribe
   */
  async transcribeAudio(audioFile: File): Promise<TranscriptionResponse> {
    // Try primary STT endpoint first
    try {
      const result = await this.transcribeWithPrimaryEndpoint(audioFile);
      return result;
    } catch (primaryError: any) {
      console.warn("Primary STT endpoint failed, trying fallback:", primaryError.message);
      
      // Try fallback endpoint
      try {
        const result = await this.transcribeWithFallbackEndpoint(audioFile);
        return result;
      } catch (fallbackError: any) {
        console.error("Both STT endpoints failed:", fallbackError.message);
        throw new Error(
          "Unable to transcribe audio. Please check your microphone and try again, or type your message instead."
        );
      }
    }
  }

  /**
   * Primary transcription endpoint: /stt/
   */
  private async transcribeWithPrimaryEndpoint(audioFile: File): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append("audio", audioFile);

    const token = localStorage.getItem("authToken");
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stt/`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Primary transcription failed" }));
      throw new Error(error.detail || error.message || "Primary transcription failed");
    }

    return response.json();
  }

  /**
   * Fallback transcription endpoint: /memory-vault/transcribe
   */
  private async transcribeWithFallbackEndpoint(audioFile: File): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append("file", audioFile);

    const token = localStorage.getItem("authToken");
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/memory-vault/transcribe`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Fallback transcription failed" }));
      throw new Error(error.detail || error.message || "Fallback transcription failed");
    }

    return response.json();
  }
}

export const sttService = new STTService();

