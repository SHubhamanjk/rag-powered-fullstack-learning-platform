/**
 * Voice Input Hook
 * Reusable hook for voice recording and transcription
 */

import { useState, useRef } from "react";
import { sttService } from "@/services/sttService";
import { useToast } from "@/hooks/use-toast";

export interface UseVoiceInputOptions {
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceInput = (options?: UseVoiceInputOptions) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      });
      
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await processRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Visual indicator (red pulsing button) is enough, no toast needed
    } catch (error: any) {
      const errorMessage = error.name === "NotAllowedError"
        ? "Microphone access denied. Please allow microphone access and try again."
        : "Could not access microphone. Please check your device settings.";
      
      toast({
        title: "Recording error",
        description: errorMessage,
        variant: "destructive",
      });

      if (options?.onError) {
        options.onError(errorMessage);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast({
        title: "No audio recorded",
        description: "Please try recording again.",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4' 
      });

      // Create File object from Blob
      const fileName = `recording_${Date.now()}.webm`;
      let audioFile: File;
      
      try {
        audioFile = new File([audioBlob], fileName, { 
          type: audioBlob.type 
        });
      } catch (e) {
        // Fallback for browsers that don't support File constructor
        audioFile = Object.assign(audioBlob, {
          name: fileName,
          lastModified: Date.now(),
        }) as File;
      }

      // Transcribe audio using service with fallback
      const result = await sttService.transcribeAudio(audioFile);

      if (!result.text || !result.text.trim()) {
        throw new Error("No speech detected. Please speak clearly and try again.");
      }

      // Don't show success toast - text appearing in input is enough feedback
      if (options?.onTranscriptionComplete) {
        options.onTranscriptionComplete(result.text);
      }
    } catch (error: any) {
      toast({
        title: "Transcription failed",
        description: error.message || "Could not transcribe audio. Please try typing instead.",
        variant: "destructive",
      });

      if (options?.onError) {
        options.onError(error.message);
      }
    } finally {
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop the recording but don't process it
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      
      setIsRecording(false);
      audioChunksRef.current = [];

      // Visual indicator (button state change) is enough feedback
    }
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};

