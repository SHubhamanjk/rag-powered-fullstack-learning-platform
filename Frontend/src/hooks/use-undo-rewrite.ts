import { useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface UndoHistory {
  originalText: string;
  fieldId: string;
  setText: (value: string) => void;
}

/**
 * Custom hook to manage undo functionality for rewritten text
 * Supports Ctrl+Z to restore original text after AI rewrite
 */
export const useUndoRewrite = () => {
  const { toast } = useToast();
  const undoHistoryRef = useRef<UndoHistory | null>(null);

  /**
   * Save the original text before rewriting
   */
  const saveForUndo = useCallback((
    originalText: string,
    fieldId: string,
    setText: (value: string) => void
  ) => {
    undoHistoryRef.current = {
      originalText,
      fieldId,
      setText
    };
  }, []);

  /**
   * Perform undo - restore the original text
   */
  const performUndo = useCallback(() => {
    if (undoHistoryRef.current) {
      const { originalText, setText } = undoHistoryRef.current;
      setText(originalText);
      
      toast({
        title: "↩️ Undone",
        description: "Original text has been restored",
      });

      // Clear undo history after use
      undoHistoryRef.current = null;
    }
  }, [toast]);

  /**
   * Check if undo is available
   */
  const canUndo = useCallback(() => {
    return undoHistoryRef.current !== null;
  }, []);

  /**
   * Clear undo history
   */
  const clearUndo = useCallback(() => {
    undoHistoryRef.current = null;
  }, []);

  /**
   * Handle keyboard shortcuts (Ctrl+Z)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z (for Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (canUndo()) {
          e.preventDefault(); // Prevent default browser undo
          performUndo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, performUndo]);

  return {
    saveForUndo,
    performUndo,
    canUndo,
    clearUndo
  };
};

