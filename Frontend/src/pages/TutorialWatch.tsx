import { useState, useEffect, useRef, useCallback } from "react";
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
  Trash2,
  Clock,
  Download,
  Sparkles,
  BookOpen,
  Brain,
  Trophy,
  ChevronLeft,
  Save,
  X,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { tutorialService } from "@/services/tutorialService";
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
  const navigate = useNavigate();
  
  // State
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Quiz list modal
  const [showQuizListModal, setShowQuizListModal] = useState(false);

  // Create tutorial
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tutorialLink, setTutorialLink] = useState("");

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  // Video player ref
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll chat messages to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

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

  const createTutorial = async () => {
    if (!tutorialLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tutorial link",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await tutorialService.createTutorial({
        tutorial_link: tutorialLink,
      });

      toast({
        title: "Tutorial Created",
        description: `"${response.title}" is ready to watch!`,
      });

      setTutorialLink("");
      setShowCreateModal(false);
      
      // Fetch updated tutorials list
      const tutorialsResponse = await tutorialService.getMyTutorials();
      setTutorials(tutorialsResponse.tutorials);
      
      // Automatically select and open the newly created tutorial
      const newTutorial = tutorialsResponse.tutorials.find(
        t => t.tutorial_id === response.tutorial_id
      );
      if (newTutorial) {
        setSelectedTutorial(newTutorial);
      }
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
      if (urlObj.hostname.includes("youtu.be")) {
        return urlObj.pathname.slice(1);
      }
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      }
    } catch {
      return null;
    }
    return null;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

  const addNote = async () => {
    if (!selectedTutorial || !newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive",
      });
      return;
    }

    const timestamp = formatTime(currentVideoTime);

    setIsLoading(true);
    try {
      await tutorialService.addNote({
        tutorial_id: selectedTutorial.tutorial_id,
        note: newNote,
        timestamp: timestamp,
      });

      toast({
        title: "Note Added",
        description: `Saved at ${timestamp}`,
      });

      setNewNote("");
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

      // Export directly to PDF
      exportNotesToPDF(response.prettified_notes, selectedTutorial.title, "prettified");

      toast({
        title: "Notes Organized",
        description: "Your notes have been beautifully formatted!",
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

      // Export directly to PDF
      exportNotesToPDF(response.detailed_notes, selectedTutorial.title, "detailed");

      toast({
        title: "Detailed Notes Created",
        description: "Comprehensive study notes are ready!",
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

  const downloadMindmap = (imageData: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Mindmap Downloaded",
      description: "Visual map saved to your downloads.",
    });
  };

  const exportNotesToPDF = (content: string, title: string, type: "notes" | "prettified" | "detailed") => {
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
          <title>${title} - ${type === "notes" ? "Notes" : type === "prettified" ? "Organized Notes" : "Detailed Study Notes"}</title>
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
              ${type === "notes" ? "Study Notes" : type === "prettified" ? "Organized Notes" : "Detailed Study Notes"}
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
      const response = await tutorialService.chatWithAI({
        tutorial_id: selectedTutorial.tutorial_id,
        question: userMessage.content,
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
              <p className="text-sm sm:text-base text-muted-foreground">Watch tutorials and take smart notes</p>
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

          {/* Tutorials Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tutorials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {tutorials.map((tutorial) => (
                  <motion.div
                    key={tutorial.tutorial_id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedTutorial(tutorial)}
                    className="cursor-pointer"
                  >
                    <Card className="glass border-border hover:border-primary/50 transition-all">
                      <CardContent className="p-3 sm:p-4">
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-2 sm:mb-3 flex items-center justify-center">
                          <Play className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 line-clamp-2">{tutorial.title}</h3>
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
            ) : (
              <Card className="glass border-border">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Play className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No tutorials yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Start your learning journey by adding a tutorial!
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
        {/* Back Button */}
        <div className="glass border-b border-border p-2 sm:p-3 md:p-4">
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
                <CardContent className="p-2 sm:p-3 space-y-2 ">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    <span>Current time: {formatTime(currentVideoTime)}</span>
                  </div>
                  <Textarea
                    placeholder="Write your note... (timestamp will be captured automatically)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <Button
                    onClick={addNote}
                    disabled={isLoading}
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
                              <Button
                                onClick={() => {
                                  setEditingNoteId(note.note_id);
                                  setEditNoteText(note.note);
                                }}
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
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
                          <p className="text-sm">{note.note}</p>
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
                    <p>Ask me anything about this tutorial!</p>
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
                    <div className="glass border border-border p-3 rounded-2xl">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Chat Input */}
            <div className="flex gap-2 flex-shrink-0">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                placeholder="Ask a question..."
                disabled={isChatLoading}
                className="glass"
              />
              <Button
                onClick={sendChatMessage}
                size="icon"
                disabled={isChatLoading || !chatInput.trim()}
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
              <div className="flex-1 overflow-y-auto">
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
                              mindmap.image_b64,
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
                          src={mindmap.image_b64}
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
              <div className="p-6 max-h-[60vh] overflow-y-auto">
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
    </div>
  );
};

export default TutorialWatch;

