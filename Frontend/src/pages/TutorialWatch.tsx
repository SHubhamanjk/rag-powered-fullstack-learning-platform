import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  FileText,
  Play,
  Send,
  Loader2,
  Edit2,
  Edit3,
  Trash2,
  Search,
  Filter,
  Clock,
  Download,
  Sparkles,
  BookOpen,
  Brain,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Menu,
  BookMarked,
  Eye,
  Wand2,
  Mic,
  MicOff,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUndoRewrite } from "@/hooks/use-undo-rewrite";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { tutorialService } from "@/services/tutorialService";
import utilityService from "@/services/utilityService";
import MarkdownMessage from "@/components/MarkdownMessage";
import type {
  Tutorial,
  Note,
  ChatMessage,
  Mindmap,
  Quiz,
} from "@/types/tutorial";

const TutorialWatch = () => {
  const { toast } = useToast();
  const { saveForUndo } = useUndoRewrite();
  const navigate = useNavigate();

  // Voice input for notes
  const { isRecording: isRecordingNote, isTranscribing: isTranscribingNote, startRecording: startRecordingNote, stopRecording: stopRecordingNote } = useVoiceInput({
    onTranscriptionComplete: (text) => {
      setNewNote(text); // Set transcribed text in note field
    },
  });

  // Voice input for chat
  const { isRecording: isRecordingChat, isTranscribing: isTranscribingChat, startRecording: startRecordingChat, stopRecording: stopRecordingChat } = useVoiceInput({
    onTranscriptionComplete: (text) => {
      setChatInput(text); // Set transcribed text in chat input field
    },
  });
  
  // State
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("All");

  // Quiz list modal
  const [showQuizListModal, setShowQuizListModal] = useState(false);

  // Create tutorial
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tutorialLink, setTutorialLink] = useState("");
  const [tutorialGroup, setTutorialGroup] = useState("");
  const [customNewGroup, setCustomNewGroup] = useState("");

  // Edit/Delete
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [customEditGroup, setCustomEditGroup] = useState("");

  // Notes preview modal
  const [showNotesPreview, setShowNotesPreview] = useState(false);
  const [previewNotes, setPreviewNotes] = useState("");
  const [notesType, setNotesType] = useState<"prettified" | "detailed" | "consolidated">("prettified");

  // Consolidated notes generation
  const [isGeneratingConsolidated, setIsGeneratingConsolidated] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newNoteImage, setNewNoteImage] = useState<string | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isRewritingNote, setIsRewritingNote] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  
  // Image viewer modal
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRewritingChat, setIsRewritingChat] = useState(false);

  // Mindmaps
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [showMindmaps, setShowMindmaps] = useState(false);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);

  // Quizzes
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizFromTime, setQuizFromTime] = useState("");
  const [quizToTime, setQuizToTime] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);


  // Active tab
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("notes");
  
  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Quick add next video
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [nextVideoUrl, setNextVideoUrl] = useState("");
  const [isCreatingNext, setIsCreatingNext] = useState(false);

  // Video player ref
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if YouTube IFrame API is already loaded
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        // YouTube IFrame API loaded
      };
    }
  }, []);

  // Fetch tutorials on mount
  useEffect(() => {
    fetchTutorials();
  }, []);

  // Auto-scroll chat messages to bottom when new messages arrive or when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat" && chatMessagesRef.current) {
      // Use setTimeout to ensure DOM is fully rendered before scrolling
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [chatMessages, isChatLoading, activeTab]);

  // Initialize YouTube player when tutorial selected
  useEffect(() => {
    if (selectedTutorial) {
      fetchNotes();
      fetchMindmaps();
      fetchQuizzes();
      loadChatHistory();

      // Initialize YouTube player
      const loadPlayer = () => {
        if ((window as any).YT && (window as any).YT.Player) {
          const videoId = getYouTubeVideoId(selectedTutorial.tutorial_link);
          if (videoId && playerContainerRef.current) {
            playerRef.current = new (window as any).YT.Player(playerContainerRef.current, {
              videoId: videoId,
              playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
              },
              events: {
                onReady: () => {
                  // Get video duration
                  if (playerRef.current && playerRef.current.getDuration) {
                    const duration = playerRef.current.getDuration();
                    setVideoDuration(duration);
                    
                    // Set initial quiz timestamps
                    setQuizFromTime("0:00");
                    setQuizToTime(formatTime(duration));
                  }

                  // Resume from last position
                  const savedPosition = localStorage.getItem(`video_pos_${selectedTutorial.tutorial_id}`);
                  if (savedPosition) {
                    const position = parseFloat(savedPosition);
                    if (position > 5) { // Only resume if more than 5 seconds in
                      playerRef.current.seekTo(position, true);
                      toast({
                        title: "Resumed",
                        description: `Continuing from ${formatTime(position)}`,
                      });
                    }
                  }

                  // Start tracking time
                  if (timeUpdateIntervalRef.current) {
                    clearInterval(timeUpdateIntervalRef.current);
                  }
                  timeUpdateIntervalRef.current = setInterval(() => {
                    if (playerRef.current && playerRef.current.getCurrentTime) {
                      const time = playerRef.current.getCurrentTime();
                      setCurrentVideoTime(time);
                      // Save position every 5 seconds
                      if (Math.floor(time) % 5 === 0) {
                        localStorage.setItem(`video_pos_${selectedTutorial.tutorial_id}`, time.toString());
                      }
                    }
                  }, 1000);
                },
              },
            });
          }
        } else {
          // API not ready yet, retry
          setTimeout(loadPlayer, 100);
        }
      };

      loadPlayer();
    }

    // Cleanup
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [selectedTutorial]);

  const fetchTutorials = async () => {
    setIsFetching(true);
    try {
      const response = await tutorialService.getMyTutorials();
      setTutorials(response.tutorials);
    } catch (error: any) {
      // Failed to fetch tutorials
    } finally {
      setIsFetching(false);
    }
  };

  // Get unique groups from tutorials
  const availableGroups = useMemo(() => {
    const groups = new Set(tutorials.map((t) => t.group));
    return ["All", ...Array.from(groups).sort()];
  }, [tutorials]);

  // Filter tutorials based on search and group
  const filteredTutorials = useMemo(() => {
    return tutorials.filter((tutorial) => {
      // Group filter
      if (selectedGroupFilter !== "All" && tutorial.group !== selectedGroupFilter) {
        return false;
      }
      
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          tutorial.title.toLowerCase().includes(query) ||
          tutorial.group.toLowerCase().includes(query) ||
          tutorial.tutorial_link.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [tutorials, selectedGroupFilter, searchQuery]);

  const openEditModal = (tutorial: Tutorial, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTutorial(tutorial);
    setEditTitle(tutorial.title);
    setEditGroup(tutorial.group);
    setShowEditModal(true);
  };

  const editTutorial = async () => {
    if (!editingTutorial) return;
    
    // Use custom group if "custom" is selected, otherwise use selected group
    const groupToUse = editGroup === "custom" ? customEditGroup.trim() : editGroup;
    
    if (!editTitle.trim() && !groupToUse) {
      toast({
        title: "Error",
        description: "Please provide at least one field to update",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await tutorialService.editTutorial(editingTutorial.tutorial_id, {
        title: editTitle.trim() || undefined,
        group: groupToUse || undefined,
      });

      toast({
        title: "Tutorial Updated",
        description: "Your changes have been saved!",
      });

      // Update local state
      setTutorials((prev) =>
        prev.map((t) =>
          t.tutorial_id === editingTutorial.tutorial_id
            ? { ...t, title: editTitle.trim() || t.title, group: groupToUse || t.group }
            : t
        )
      );

      if (selectedTutorial?.tutorial_id === editingTutorial.tutorial_id) {
        setSelectedTutorial({
          ...selectedTutorial,
          title: editTitle.trim() || selectedTutorial.title,
          group: groupToUse || selectedTutorial.group,
        });
      }

      setShowEditModal(false);
      setEditingTutorial(null);
      setEditTitle("");
      setEditGroup("");
      setCustomEditGroup("");
    } catch (error: any) {
      toast({
        title: "Failed to Update",
        description: error.message || "Could not update tutorial.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTutorial = async (tutorialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this tutorial? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      await tutorialService.deleteTutorial(tutorialId);

      toast({
        title: "Tutorial Deleted",
        description: "The tutorial has been removed.",
      });

      // Update local state
      setTutorials((prev) => prev.filter((t) => t.tutorial_id !== tutorialId));

      // If the deleted tutorial was selected, clear selection
      if (selectedTutorial?.tutorial_id === tutorialId) {
        setSelectedTutorial(null);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Delete",
        description: error.message || "Could not delete tutorial.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTutorial = async () => {
    if (!tutorialLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tutorial link",
        variant: "destructive",
      });
      return;
    }

    // Use custom group if "custom" is selected, otherwise use selected group
    const groupToUse = tutorialGroup === "custom" ? customNewGroup.trim() : tutorialGroup;

    if (!groupToUse) {
      toast({
        title: "Error",
        description: "Please select or enter a group",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await tutorialService.createTutorial({
        tutorial_link: tutorialLink,
        group: groupToUse,
      });

      toast({
        title: "Tutorial Created",
        description: `"${response.title}" is ready to watch!`,
      });

      // Save link and group before clearing
      const savedLink = tutorialLink.trim();
      const savedGroup = groupToUse;
      
      setTutorialLink("");
      setTutorialGroup("");
      setCustomNewGroup("");
      setShowCreateModal(false);
      
      // Fetch updated tutorials list
      await fetchTutorials();
      
      // Immediately auto-select the new tutorial
      const newTutorial = {
        tutorial_id: response.tutorial_id,
        title: response.title,
        tutorial_link: savedLink,
        group: savedGroup,
        notes_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSelectedTutorial(newTutorial);
    } catch (error: any) {
      toast({
        title: "Failed to Create Tutorial",
        description: error.message || "Could not create tutorial session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      
      // Handle youtu.be short links
      if (urlObj.hostname.includes("youtu.be")) {
        return urlObj.pathname.slice(1).split('?')[0]; // Remove query params
      }
      
      // Handle youtube.com links
      if (urlObj.hostname.includes("youtube.com")) {
        // Handle /live/VIDEO_ID format
        if (urlObj.pathname.includes("/live/")) {
          return urlObj.pathname.split("/live/")[1].split('?')[0];
        }
        // Handle /watch?v=VIDEO_ID format
        if (urlObj.searchParams.has("v")) {
          return urlObj.searchParams.get("v");
        }
        // Handle /embed/VIDEO_ID format
        if (urlObj.pathname.includes("/embed/")) {
          return urlObj.pathname.split("/embed/")[1].split('?')[0];
        }
        // Handle /v/VIDEO_ID format
        if (urlObj.pathname.includes("/v/")) {
          return urlObj.pathname.split("/v/")[1].split('?')[0];
        }
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
      return null;
    }
    return null;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    const textarea = noteTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Auto-resize on note change
  useEffect(() => {
    autoResizeTextarea();
  }, [newNote, autoResizeTextarea]);

  const fetchNotes = async () => {
    if (!selectedTutorial) return;

    try {
      const response = await tutorialService.getNotes(selectedTutorial.tutorial_id);
      setNotes(response.notes);
    } catch (error: any) {
      // Failed to fetch notes
    }
  };

  const loadChatHistory = async () => {
    if (!selectedTutorial) return;

    try {
      const response = await tutorialService.getChatHistory(selectedTutorial.tutorial_id);
      if (response.chat_history && response.chat_history.length > 0) {
        setChatMessages(response.chat_history);
      }
    } catch (error: any) {
      // No chat history yet, that's okay
    }
  };

  const rewriteNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Nothing to Rewrite",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }

    setIsRewritingNote(true);
    try {
      const response = await utilityService.rewriteText({
        text: newNote,
        context: 'note',
      });

      if (response.improvement_applied) {
        // Save original text for undo before replacing
        saveForUndo(newNote, 'tutorial-note', setNewNote);
        
        setNewNote(response.rewritten_text);
        toast({
          title: "✨ Text Enhanced",
          description: "Your note has been improved! (Press Ctrl+Z to undo)",
        });
      } else {
        toast({
          title: "Already Perfect!",
          description: "Your note looks great as is.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Rewrite Failed",
        description: error.message || "Could not enhance text",
        variant: "destructive",
      });
    } finally {
      setIsRewritingNote(false);
    }
  };

  // Process image file (validate and convert to base64)
  const processImageFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setNewNoteImage(base64String);
      toast({
        title: "Image Added",
        description: "Image ready to be added to note",
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload Failed",
        description: "Failed to read image file",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // Handle image upload from file input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    // Reset input
    e.target.value = '';
  };

  // Handle paste from clipboard
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    // Only handle if user is focused on note input area or textarea
    const target = e.target as HTMLElement;
    const isInNoteArea = target.closest('[data-note-input-area]') || 
                         target === noteTextareaRef.current ||
                         document.activeElement === noteTextareaRef.current;
    
    if (!isInNoteArea) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
        }
        break;
      }
    }
  }, [processImageFile]);

  // Handle drag and drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please drop an image file",
          variant: "destructive",
        });
      }
    }
  }, [processImageFile, toast]);

  // Add paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const removeImage = () => {
    setNewNoteImage(null);
  };

  const addNote = async () => {
    if (!selectedTutorial || (!newNote.trim() && !newNoteImage)) {
      toast({
        title: "Error",
        description: "Please enter a note or upload an image",
        variant: "destructive",
      });
      return;
    }

    const timestamp = formatTime(currentVideoTime);

    setIsLoading(true);
    try {
      await tutorialService.addNote({
        tutorial_id: selectedTutorial.tutorial_id,
        note: newNote.trim() || undefined,
        image: newNoteImage || undefined,
        timestamp: timestamp,
      });

      toast({
        title: "Note Added",
        description: `Saved at ${timestamp}`,
      });

      setNewNote("");
      setNewNoteImage(null);
      // Reset textarea height
      if (noteTextareaRef.current) {
        noteTextareaRef.current.style.height = '60px';
      }
      await fetchNotes();
    } catch (error: any) {
      toast({
        title: "Failed to Add Note",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateNote = async (noteId: string) => {
    if (!editNoteText.trim()) return;

    setIsLoading(true);
    try {
      await tutorialService.updateNote(noteId, {
        updated_text: editNoteText,
      });

      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully.",
      });

      setEditingNoteId(null);
      setEditNoteText("");
      await fetchNotes();
    } catch (error: any) {
      toast({
        title: "Failed to Update Note",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await tutorialService.deleteNote(noteId);
      toast({
        title: "Note Deleted",
        description: "Your note has been removed.",
      });
      await fetchNotes();
    } catch (error: any) {
      toast({
        title: "Failed to Delete Note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const prettifyNotes = async () => {
    if (!selectedTutorial) return;

    setIsLoading(true);
    try {
      const response = await tutorialService.prettifyNotes({
        tutorial_id: selectedTutorial.tutorial_id,
      });

      // Show preview modal instead of direct download
      setPreviewNotes(response.prettified_notes);
      setNotesType("prettified");
      setIsEditingPreview(false);
      setShowNotesPreview(true);

      toast({
        title: "Notes Organized",
        description: "Review and edit before downloading!",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Organize Notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDetailedNotes = async () => {
    if (!selectedTutorial) return;

    setIsLoading(true);
    try {
      const response = await tutorialService.detailedNotes({
        tutorial_id: selectedTutorial.tutorial_id,
      });

      // Show preview modal instead of direct download
      setPreviewNotes(response.detailed_notes);
      setNotesType("detailed");
      setIsEditingPreview(false);
      setShowNotesPreview(true);

      toast({
        title: "Detailed Notes Created",
        description: "Review and edit before downloading!",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Create Detailed Notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPreviewedNotes = () => {
    if (!selectedTutorial && notesType !== "consolidated") return;
    if (!previewNotes) return;
    
    const title = notesType === "consolidated" 
      ? `${selectedGroupFilter} - All-in-One Notes`
      : selectedTutorial!.title;
    
    exportNotesToPDF(previewNotes, title, notesType);
    setShowNotesPreview(false);
    toast({
      title: "Notes Downloaded",
      description: "Your notes have been saved as PDF!",
    });
  };

  const generateConsolidatedNotes = async () => {
    if (selectedGroupFilter === "All" || !selectedGroupFilter) {
      toast({
        title: "Select a Group",
        description: "Please filter by a specific group first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingConsolidated(true);
    try {
      const response = await tutorialService.generateConsolidatedNotes({
        group: selectedGroupFilter,
      });

      // Show preview modal
      setPreviewNotes(response.notes_content);
      setNotesType("consolidated");
      setIsEditingPreview(false);
      setShowNotesPreview(true);

      toast({
        title: "All-in-One Notes Ready!",
        description: `Combined ${response.tutorials_included} tutorial(s) into one complete guide. Review and download!`,
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate all-in-one notes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingConsolidated(false);
    }
  };

  const downloadMindmap = async (imageUrl: string, filename: string) => {
    try {
      const proxyUrl = `${import.meta.env.VITE_API_BASE_URL}/tutorial-support/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename + '.png')}`;
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.download = `${filename}.png`; // fallback if header is ignored
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Mindmap Downloaded",
        description: "Visual map saved to your downloads.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the mindmap.",
        variant: "destructive",
      });
    }
  };

  const exportNotesToPDF = (content: string, title: string, type: "notes" | "prettified" | "detailed" | "consolidated") => {
    // Create a hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Remove first H1 if it exists (to avoid duplicate title)
    let cleanContent = content.replace(/^#\s+.+\n/, "");
    
    // Convert markdown-style content to HTML
    const htmlContent = cleanContent
      .replace(/#{1,6}\s(.+)/g, (match, p1) => {
        const level = match.split(" ")[0].length;
        return `<h${level} style="color: #6366f1; margin-top: 1.5em; margin-bottom: 0.5em;">${p1}</h${level}>`;
      })
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/\n\n/g, "</p><p style='margin: 0.75em 0;'>")
      .replace(/\n/g, "<br>");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${type === "notes" ? "Notes" : type === "prettified" ? "Organized Notes" : type === "consolidated" ? "All-in-One Notes" : "Detailed Study Notes"}</title>
          <style>
            @page {
              margin: 2cm;
              size: A4;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #6366f1;
              border-bottom: 3px solid #6366f1;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2, h3, h4 {
              color: #6366f1;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            p {
              margin: 0.75em 0;
            }
            code {
              background: #f3f4f6;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 0.875em;
              color: #6b7280;
            }
            .timestamp {
              background: #e0e7ff;
              color: #6366f1;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 0.875em;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p style="color: #6b7280; margin: 5px 0;">
              ${type === "notes" ? "Study Notes" : type === "prettified" ? "Organized Notes" : type === "consolidated" ? "All-in-One Notes" : "Detailed Study Notes"}
            </p>
            <p style="color: #9ca3af; font-size: 0.875em;">
              Generated on ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div class="content">
            <p>${htmlContent}</p>
          </div>
          <div class="footer">
            <p>Created with Medha AI Learning Hub</p>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Wait for content to load, then print
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 100);
    }, 250);

    toast({
      title: "Export to PDF",
      description: "Print dialog opened. Save as PDF to export.",
    });
  };

  const createAndPlayNextVideo = async () => {
    if (!nextVideoUrl.trim() || !selectedTutorial) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingNext(true);
    try {
      // Create new tutorial in the same group
      const response = await tutorialService.createTutorial({
        tutorial_link: nextVideoUrl.trim(),
        group: selectedTutorial.group, // Same group as current tutorial
      });

      toast({
        title: "✨ Next Tutorial Ready",
        description: `${response.title} - Now playing!`,
      });

      // Refresh tutorials list
      await fetchTutorials();

      // Find the newly created tutorial
      const newTutorial = {
        tutorial_id: response.tutorial_id,
        title: response.title,
        tutorial_link: nextVideoUrl.trim(),
        group: selectedTutorial.group,
        notes_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Close modal and reset
      setShowQuickAddModal(false);
      setNextVideoUrl("");

      // Switch to the new tutorial (this will trigger video load)
      setSelectedTutorial(newTutorial);
      setChatMessages([]);
      setNotes([]);
      setMindmaps([]);
      setQuizzes([]);
      setCurrentVideoTime(0);

    } catch (error: any) {
      toast({
        title: "Failed to Create Tutorial",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingNext(false);
    }
  };

  // Helper function to format seconds to MM:SS or HH:MM:SS
  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (videoUrl: string): string => {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) {
      return ""; // Fallback to gradient if can't extract ID
    }
    // Use hqdefault for reliable thumbnails (maxresdefault may not exist for all videos)
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const rewriteChat = async () => {
    if (!chatInput.trim()) {
      toast({
        title: "Nothing to Rewrite",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }

    setIsRewritingChat(true);
    try {
      const response = await utilityService.rewriteText({
        text: chatInput,
        context: 'message',
      });

      if (response.improvement_applied) {
        // Save original text for undo before replacing
        saveForUndo(chatInput, 'tutorial-chat', setChatInput);
        
        setChatInput(response.rewritten_text);
        toast({
          title: "✨ Text Enhanced",
          description: "Your message has been improved! (Press Ctrl+Z to undo)",
        });
      } else {
        toast({
          title: "Already Perfect!",
          description: "Your message looks great as is.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Rewrite Failed",
        description: error.message || "Could not enhance text",
        variant: "destructive",
      });
    } finally {
      setIsRewritingChat(false);
    }
  };

  const sendChatMessage = async () => {
    if (!selectedTutorial || !chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Get current video timestamp if player is available
      let currentTimestamp: string | undefined;
      try {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentSeconds = playerRef.current.getCurrentTime();
          currentTimestamp = formatTimestamp(currentSeconds);
          console.log(`[Tutorial Chat] Sending with video context at ${currentTimestamp}`);
        }
      } catch (e) {
        // Player not ready or unavailable, proceed without timestamp
        console.log('[Tutorial Chat] No video timestamp available');
      }

      const response = await tutorialService.chatWithAI({
        tutorial_id: selectedTutorial.tutorial_id,
        question: userMessage.content,
        current_timestamp: currentTimestamp,
      });

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      toast({
        title: "Failed to Get Response",
        description: error.message,
        variant: "destructive",
      });
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

  const fetchMindmaps = async () => {
    if (!selectedTutorial) return;

    try {
      const response = await tutorialService.getMindmaps(selectedTutorial.tutorial_id);
      setMindmaps(response.mindmaps);
    } catch (error: any) {
      // Failed to fetch mindmaps
    }
  };

  const generateMindmap = async () => {
    if (!selectedTutorial) return;

    setIsGeneratingMindmap(true);
    try {
      const response = await tutorialService.generateMindmap({
        tutorial_id: selectedTutorial.tutorial_id,
      });

      setMindmaps(response.mindmaps);
      setShowMindmaps(true);

      toast({
        title: "Visual Maps Created",
        description: response.message,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Create Visual Maps",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  const fetchQuizzes = async () => {
    if (!selectedTutorial) return;

    try {
      const response = await tutorialService.getTutorialQuizzes(selectedTutorial.tutorial_id);
      setQuizzes(response.quizzes);
    } catch (error: any) {
      // Failed to fetch quizzes
    }
  };

  const generateQuiz = async () => {
    if (!selectedTutorial || !quizFromTime || !quizToTime) {
      toast({
        title: "Error",
        description: "Please enter both start and end timestamps",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const response = await tutorialService.generateQuiz({
        tutorial_id: selectedTutorial.tutorial_id,
        from_timestamp: quizFromTime,
        to_timestamp: quizToTime,
      });

      toast({
        title: "Practice Test Ready",
        description: `Created ${response.total_questions} questions!`,
      });

      setShowQuizModal(false);
      setQuizFromTime("");
      setQuizToTime("");
      await fetchQuizzes();

      // Navigate to quiz page immediately after generation
      navigate(`/quiz/${response.quiz_id}`, {
        state: {
          quizData: response,
          tutorialTitle: selectedTutorial.title,
          isTutorialQuiz: true,
        },
      });
    } catch (error: any) {
      toast({
        title: "Failed to Create Practice Test",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };


  // Tutorial List View
  if (!selectedTutorial) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-6 relative overflow-hidden">
        {/* Futuristic Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -50, 0],
              y: [0, -30, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Floating particles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40"
              animate={{
                y: [0, -100, 0],
                x: [0, (Math.random() - 0.5) * 100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
              style={{
                left: `${10 + i * 9}%`,
                top: `${20 + (i % 5) * 15}%`,
              }}
            />
          ))}
        </div>

        <div className="container max-w-6xl mx-auto space-y-4 sm:space-y-6 relative z-10 px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">Learning Hub</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Watch, Learn, Remember - Your AI study companion for videos</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full sm:w-auto"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tutorial
            </Button>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 glass border-border"
              />
            </div>
            
            {/* Group Filter */}
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 glass border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableGroups.map((group) => (
                  <option key={group} value={group}>
                    {group === "All" ? "All Groups" : group}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Create Tutorial Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => !isLoading && setShowCreateModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md glass rounded-2xl p-6 border border-border"
                >
                  <h2 className="text-xl font-bold mb-4">Start Learning</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="link">Tutorial Link (YouTube, etc.)</Label>
                      <Input
                        id="link"
                        value={tutorialLink}
                        onChange={(e) => setTutorialLink(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group">Category / Group *</Label>
                      <Select value={tutorialGroup} onValueChange={setTutorialGroup} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select or create category" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroups.filter(g => g !== "All").map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">+ Add New Group</SelectItem>
                        </SelectContent>
                      </Select>
                      {tutorialGroup === "custom" && (
                        <Input
                          value={customNewGroup}
                          onChange={(e) => setCustomNewGroup(e.target.value)}
                          placeholder="Enter new group name"
                          disabled={isLoading}
                          className="mt-2"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        💡 Group similar tutorials to generate comprehensive study guides later
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={createTutorial}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Watching"}
                      </Button>
                      <Button
                        onClick={() => setShowCreateModal(false)}
                        variant="outline"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Tutorial Modal */}
          <AnimatePresence>
            {showEditModal && editingTutorial && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => !isLoading && setShowEditModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md glass rounded-2xl p-6 border border-border"
                >
                  <h2 className="text-xl font-bold mb-4">Edit Tutorial</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Tutorial title"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-group">Category / Group</Label>
                      <Select value={editGroup} onValueChange={setEditGroup} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select or create category" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroups.filter(g => g !== "All").map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">+ Add New Group</SelectItem>
                        </SelectContent>
                      </Select>
                      {editGroup === "custom" && (
                        <Input
                          value={customEditGroup}
                          onChange={(e) => setCustomEditGroup(e.target.value)}
                          placeholder="Enter new group name"
                          disabled={isLoading}
                          className="mt-2"
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={editTutorial}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                      </Button>
                      <Button
                        onClick={() => setShowEditModal(false)}
                        variant="outline"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes Preview Modal */}
          <AnimatePresence>
            {showNotesPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => !isLoading && setShowNotesPreview(false)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-4xl max-h-[90vh] glass rounded-2xl border border-border flex flex-col"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        {notesType === "prettified" 
                          ? "Organized Notes" 
                          : notesType === "consolidated"
                          ? `All-in-One Notes - ${selectedGroupFilter}`
                          : "Detailed Study Notes"}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notesType === "consolidated"
                          ? "Complete notes combining all tutorials in this group"
                          : "Review and edit your notes before downloading"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPreview(!isEditingPreview)}
                      >
                        {isEditingPreview ? (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowNotesPreview(false)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div 
                    className="flex-1 overflow-y-auto scrollbar-hide p-6"
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none' 
                    }}
                  >
                {isEditingPreview ? (
                  <Textarea
                    value={previewNotes}
                    onChange={(e) => setPreviewNotes(e.target.value)}
                    className="w-full min-h-[500px] font-mono text-sm glass border-border resize-none scrollbar-hide"
                    placeholder="Your notes will appear here..."
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <MarkdownMessage content={previewNotes} />
                  </div>
                )}
                  </div>

                  {/* Actions */}
                  <div className="p-6 border-t border-border flex gap-3">
                    <Button
                      onClick={downloadPreviewedNotes}
                      disabled={isLoading || !previewNotes.trim()}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download as PDF
                    </Button>
                    <Button
                      onClick={() => setShowNotesPreview(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Comprehensive Notes Button */}
          {selectedGroupFilter !== "All" && filteredTutorials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mb-4"
            >
              <Button
                onClick={generateConsolidatedNotes}
                disabled={isGeneratingConsolidated}
                className="w-full bg-gradient-to-r from-primary via-purple-600 to-secondary hover:opacity-90"
                size="lg"
              >
                {isGeneratingConsolidated ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating All-in-One Notes...
                  </>
                ) : (
                  <>
                    <BookMarked className="w-5 h-5 mr-2" />
                    Generate All-in-One Notes
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Combine all {filteredTutorials.length} tutorial(s) from "{selectedGroupFilter}" into one complete guide
              </p>
            </motion.div>
          )}

          {/* Tutorials Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {filteredTutorials.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredTutorials.map((tutorial) => (
                    <motion.div
                      key={tutorial.tutorial_id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedTutorial(tutorial)}
                      className="cursor-pointer relative group"
                    >
                      <Card className="glass border-border hover:border-primary/50 transition-all">
                        <CardContent className="p-3 sm:p-4">
                          <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-2 sm:mb-3 flex items-center justify-center relative overflow-hidden">
                            {/* YouTube Thumbnail */}
                            {getYouTubeThumbnail(tutorial.tutorial_link) ? (
                              <>
                                <img 
                                  src={getYouTubeThumbnail(tutorial.tutorial_link)} 
                                  alt={tutorial.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Play overlay */}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                  <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
                                </div>
                              </>
                            ) : (
                              <Play className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                            )}
                            {/* Edit/Delete buttons - shown on hover */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="w-7 h-7"
                                onClick={(e) => openEditModal(tutorial, e)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="w-7 h-7"
                                onClick={(e) => deleteTutorial(tutorial.tutorial_id, e)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <h3 className="text-sm sm:text-base font-semibold line-clamp-2 flex-1">{tutorial.title}</h3>
                          </div>
                          <Badge variant="secondary" className="mb-2 text-[10px]">
                            {tutorial.group}
                          </Badge>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            <span>{tutorial.notes_count} notes</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{new Date(tutorial.updated_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : tutorials.length === 0 ? (
              <Card className="glass border-border">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Play className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">🎥 Start Learning from Videos!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Add any tutorial video and get AI-powered notes, quizzes, and mindmaps automatically!
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Tutorial
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass border-border">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No tutorials found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tutorial
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Tutorial Watch View
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Futuristic Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            animate={{
              y: [0, -100, 0],
              x: [0, (Math.random() - 0.5) * 100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
            style={{
              left: `${20 + i * 10}%`,
              top: "50%",
            }}
          />
        ))}
      </div>
      {/* Mobile Sidebar Toggle Button */}
      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        size="icon"
        className="fixed bottom-4 right-4 lg:hidden z-30 h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Main Video Area */}
      <div className="flex-1 lg:flex-[0.7] flex flex-col bg-black/50">
        {/* Header - Back & Next Buttons */}
        <div className="glass border-b border-border p-2 sm:p-3 md:p-4 flex items-center justify-between">
          <Button
            onClick={() => {
              setSelectedTutorial(null);
              setChatMessages([]);
              setNotes([]);
              setMindmaps([]);
              setQuizzes([]);
              setCurrentVideoTime(0);
            }}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Back to Tutorials</span>
          </Button>

          <Button
            onClick={() => setShowQuickAddModal(true)}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <span className="text-xs sm:text-sm">Next Video</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Video Player */}
        <div className="flex-1 relative bg-black">
          <div ref={playerContainerRef} className="w-full h-full" />
        </div>

        {/* Video Info & Actions */}
        <div className="glass border-t border-border p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold line-clamp-2">{selectedTutorial.title}</h2>
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button
              onClick={() => setShowQuizModal(true)}
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Practice Test</span>
              <span className="sm:hidden">Quiz</span>
            </Button>
            <Button
              onClick={generateMindmap}
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
              disabled={isGeneratingMindmap}
            >
              {isGeneratingMindmap ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">Visual Maps</span>
              <span className="sm:hidden">Maps</span>
            </Button>
            {quizzes.length > 0 && (
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setShowQuizListModal(true)}
              >
                <Trophy className="w-3 h-3" />
                {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
              </Badge>
            )}
            {mindmaps.length > 0 && (
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setShowMindmaps(true)}
              >
                <Brain className="w-3 h-3" />
                {mindmaps.length} {mindmaps.length === 1 ? "map" : "maps"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ 
          x: sidebarOpen || window.innerWidth >= 1024 ? 0 : 300,
          opacity: sidebarOpen || window.innerWidth >= 1024 ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
        className={`w-full lg:flex-[0.3] glass border-t lg:border-t-0 lg:border-l border-border flex flex-col overflow-hidden ${
          sidebarOpen ? "fixed inset-y-0 right-0 z-30 flex max-w-sm" : "hidden lg:flex"
        }`}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 m-2 sm:m-3 md:m-4 flex-shrink-0">
            <TabsTrigger value="notes" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              AI Chat
            </TabsTrigger>
          </TabsList>

          {/* Notes Tab */}
          <TabsContent value="notes" className="flex-2 flex flex-col m-0 p-0 overflow-hidden data-[state=active]:flex">
            <div className="flex-1 flex flex-col p-2 sm:p-3 md:p-4 overflow-hidden ">
              {/* Fixed Header Section */}
              <div className="space-y-4 flex-shrink-0">
              {/* Add Note Form */}
              <Card className="glass border-border">
                <CardContent 
                  className="p-2 sm:p-3 space-y-2"
                  data-note-input-area
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    <span>At {formatTime(currentVideoTime)}</span>
                  </div>
                  <div className={`relative ${isDragging ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''}`}>
                    {isDragging && (
                      <div className="absolute inset-0 bg-primary/10 rounded-md flex items-center justify-center z-10 pointer-events-none">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm font-medium text-primary">Drop image here</p>
                        </div>
                      </div>
                    )}
                    <Textarea
                      ref={noteTextareaRef}
                      placeholder={
                        isRecordingNote 
                          ? "Recording... Click stop when done" 
                          : isTranscribingNote 
                          ? "Transcribing audio..." 
                          : "What's important here? Jot it down... (timestamp saved automatically)"
                      }
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="resize-none pr-20 min-h-[60px] max-h-[200px] overflow-y-auto scrollbar-hide transition-all duration-150"
                      style={{ height: '60px' }}
                      disabled={isRecordingNote || isTranscribingNote}
                      onPaste={(e) => {
                        // Let the global paste handler deal with images
                        // This is just for text paste
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={isRecordingNote || isTranscribingNote}
                      />
                      <label htmlFor="image-upload">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-primary/20"
                          title="Upload image"
                          disabled={isRecordingNote || isTranscribingNote}
                          asChild
                        >
                          <span>
                            <ImageIcon className="w-4 h-4 text-primary" />
                          </span>
                        </Button>
                      </label>
                      <Button
                        onClick={isRecordingNote ? stopRecordingNote : startRecordingNote}
                        disabled={isRewritingNote || isTranscribingNote}
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 ${
                          isRecordingNote 
                            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                            : "hover:bg-primary/20"
                        }`}
                        title={isRecordingNote ? "Stop recording" : "Record voice note"}
                      >
                        {isTranscribingNote ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : isRecordingNote ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                      <Button
                        onClick={rewriteNote}
                        disabled={isRewritingNote || !newNote.trim() || isRecordingNote || isTranscribingNote}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-primary/20"
                        title="Enhance with AI"
                      >
                        {isRewritingNote ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Wand2 className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {newNoteImage && (
                    <div className="relative">
                      <img
                        src={newNoteImage}
                        alt="Uploaded note"
                        className="w-full h-32 object-contain rounded-md border border-border"
                      />
                      <Button
                        onClick={removeImage}
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={addNote}
                    disabled={isLoading || isRecordingNote || isTranscribingNote}
                    size="sm"
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Note"}
                  </Button>
                </CardContent>
              </Card>

              {/* Notes Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={prettifyNotes}
                  disabled={isLoading || notes.length === 0}
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Organize
                </Button>
                <Button
                  onClick={generateDetailedNotes}
                  disabled={isLoading || notes.length === 0}
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  Expand
                </Button>
              </div>
            </div>

            {/* Scrollable Notes List */}
            <div className="flex-1 mt-4 overflow-y-auto scrollbar-hide">
              <div className="space-y-2 pb-4">
                {notes.map((note) => (
                  <Card key={note.note_id} className="glass border-border">
                    <CardContent className="p-3">
                      {editingNoteId === note.note_id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            rows={2}
                            className="scrollbar-hide"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateNote(note.note_id)}
                              size="sm"
                              disabled={isLoading}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditNoteText("");
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              {note.timestamp}
                            </Badge>
                            <div className="flex gap-1">
                              {note.note && (
                                <Button
                                  onClick={() => {
                                    setEditingNoteId(note.note_id);
                                    setEditNoteText(note.note || "");
                                  }}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                onClick={() => deleteNote(note.note_id)}
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {note.note && <p className="text-sm mb-2">{note.note}</p>}
                          {note.image && (
                            <div className="mt-2">
                              <img
                                src={note.image}
                                alt="Note image"
                                className="w-full max-h-48 object-contain rounded-md border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setViewingImage(note.image!)}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0 overflow-hidden data-[state=active]:flex">
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {/* Scrollable Chat Messages */}
              <div ref={chatMessagesRef} className="flex-1 mb-4 overflow-y-auto scrollbar-hide">
              <div className="space-y-4 pb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">Got Questions?</p>
                    <p className="text-xs">Ask me anything about this video - I can explain, clarify, or dive deeper!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-primary to-secondary text-white"
                            : "glass border border-border"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="text-sm">{msg.content}</p>
                        ) : (
                          <MarkdownMessage content={msg.content} className="text-sm" />
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="glass border border-border p-3 rounded-2xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Chat Input */}
            <div className="flex gap-2 flex-shrink-0">
              {/* Voice Recording Button */}
              <Button
                onClick={isRecordingChat ? stopRecordingChat : startRecordingChat}
                size="icon"
                disabled={isChatLoading || isTranscribingChat || isRewritingChat}
                className={`shrink-0 ${
                  isRecordingChat
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "glass"
                }`}
                variant={isRecordingChat ? "default" : "outline"}
                title={isRecordingChat ? "Stop recording" : "Record voice question"}
              >
                {isTranscribingChat ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecordingChat ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>

              {/* Rewrite Button */}
              <Button
                onClick={rewriteChat}
                size="icon"
                disabled={isRewritingChat || !chatInput.trim() || isChatLoading || isRecordingChat || isTranscribingChat}
                variant="outline"
                className="glass shrink-0"
                title="Enhance with AI"
              >
                {isRewritingChat ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Wand2 className="w-4 h-4 text-primary" />
                )}
              </Button>

              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                placeholder={
                  isRecordingChat
                    ? "Recording... Click stop when done"
                    : isTranscribingChat
                    ? "Transcribing audio..."
                    : "Ask a question..."
                }
                disabled={isChatLoading || isRecordingChat || isTranscribingChat}
                className="glass"
              />
              <Button
                onClick={sendChatMessage}
                size="icon"
                disabled={isChatLoading || !chatInput.trim() || isRecordingChat || isTranscribingChat || isRewritingChat}
                className="bg-gradient-to-br from-primary to-secondary shrink-0"
              >
                {isChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Quiz Generation Modal */}
      <AnimatePresence>
        {showQuizModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isGeneratingQuiz && setShowQuizModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-6 border border-border"
            >
              <h2 className="text-xl font-bold mb-2">Create Practice Test</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the video section you want to test your knowledge on. By default, it covers the entire video.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from">Start Time</Label>
                  <Input
                    id="from"
                    value={quizFromTime}
                    onChange={(e) => setQuizFromTime(e.target.value)}
                    placeholder="0:00"
                    disabled={isGeneratingQuiz}
                  />
                  <p className="text-xs text-muted-foreground">Beginning of the section</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">End Time</Label>
                  <Input
                    id="to"
                    value={quizToTime}
                    onChange={(e) => setQuizToTime(e.target.value)}
                    placeholder={formatTime(videoDuration)}
                    disabled={isGeneratingQuiz}
                  />
                  <p className="text-xs text-muted-foreground">End of the section</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={generateQuiz}
                    disabled={isGeneratingQuiz}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary"
                  >
                    {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Test"}
                  </Button>
                  <Button
                    onClick={() => setShowQuizModal(false)}
                    variant="outline"
                    disabled={isGeneratingQuiz}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Mindmaps Modal */}
      <AnimatePresence>
        {showMindmaps && mindmaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMindmaps(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl h-[80vh] glass rounded-2xl p-6 border border-border flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Visual Maps</h2>
                <Button
                  onClick={() => setShowMindmaps(false)}
                  size="icon"
                  variant="ghost"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-6">
                  {mindmaps.map((mindmap, index) => (
                    <Card key={mindmap.mindmap_id} className="glass border-border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{mindmap.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{mindmap.description}</p>
                          </div>
                          <Button
                            onClick={() => downloadMindmap(
                              mindmap.image_url,
                              `${selectedTutorial.title}-mindmap-${index + 1}`
                            )}
                            size="sm"
                            variant="outline"
                            className="gap-2 shrink-0 ml-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <img
                          src={mindmap.image_url}
                          alt={mindmap.title}
                          className="w-full rounded-lg"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz List Modal */}
      <AnimatePresence>
        {showQuizListModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuizListModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl glass rounded-2xl border border-border"
            >
              {/* Quiz List Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold">Practice Tests</h2>
                  <p className="text-sm text-muted-foreground">
                    {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} available
                  </p>
                </div>
                <Button onClick={() => setShowQuizListModal(false)} variant="ghost" size="icon">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Quiz List */}
              <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <Card key={quiz.quiz_id} className="glass border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/quiz/${quiz.quiz_id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium mb-2">{quiz.tutorial_title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {quiz.total_questions} questions
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {quiz.from_timestamp} - {quiz.to_timestamp}
                              </span>
                            </div>
                            {quiz.is_evaluated && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/50">
                                Completed: {quiz.percentage}%
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quiz/${quiz.quiz_id}`);
                            }}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {quiz.is_evaluated ? "Retake" : "Start"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Preview Modal */}
      <AnimatePresence>
        {showNotesPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isLoading && setShowNotesPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] glass rounded-2xl border border-border flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {notesType === "prettified" 
                      ? "Organized Notes" 
                      : notesType === "consolidated"
                      ? `All-in-One Notes - ${selectedGroupFilter}`
                      : "Detailed Study Notes"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notesType === "consolidated"
                      ? "Complete notes combining all tutorials in this group"
                      : "Review and edit your notes before downloading"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                  >
                    {isEditingPreview ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotesPreview(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div 
                className="flex-1 overflow-y-auto scrollbar-hide p-6"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none' 
                }}
              >
                {isEditingPreview ? (
                  <Textarea
                    value={previewNotes}
                    onChange={(e) => setPreviewNotes(e.target.value)}
                    className="w-full min-h-[500px] font-mono text-sm glass border-border resize-none scrollbar-hide"
                    placeholder="Your notes will appear here..."
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <MarkdownMessage content={previewNotes} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-border flex gap-3">
                <Button
                  onClick={downloadPreviewedNotes}
                  disabled={isLoading || !previewNotes.trim()}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download as PDF
                </Button>
                <Button
                  onClick={() => setShowNotesPreview(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Next Video Modal */}
      <AnimatePresence>
        {showQuickAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isCreatingNext && setShowQuickAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl border border-border"
            >
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Add Next Video</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paste the YouTube URL of the next video to watch
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Group: <span className="font-semibold">{selectedTutorial?.group}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next-video-url">YouTube URL</Label>
                  <Input
                    id="next-video-url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={nextVideoUrl}
                    onChange={(e) => setNextVideoUrl(e.target.value)}
                    disabled={isCreatingNext}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCreatingNext) {
                        createAndPlayNextVideo();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowQuickAddModal(false);
                      setNextVideoUrl("");
                    }}
                    disabled={isCreatingNext}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createAndPlayNextVideo}
                    disabled={isCreatingNext || !nextVideoUrl.trim()}
                  >
                    {isCreatingNext ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Create & Play
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none">
          {viewingImage && (
            <div className="relative bg-background rounded-lg overflow-hidden">
              <img
                src={viewingImage}
                alt="Full size note image"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const filename = `note-image-${Date.now()}.png`;
                      const proxyUrl = `${import.meta.env.VITE_API_BASE_URL}/tutorial-support/download-image?url=${encodeURIComponent(viewingImage)}&filename=${encodeURIComponent(filename)}`;
                      const link = document.createElement('a');
                      link.href = proxyUrl;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      toast({
                        title: "Download Failed",
                        description: "Could not download the image.",
                        variant: "destructive",
                      });
                    }
                  }}
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  onClick={() => setViewingImage(null)}
                  size="icon"
                  variant="secondary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorialWatch;

