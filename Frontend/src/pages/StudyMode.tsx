import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Send,
  Loader2,
  Book,
  Brain,
  X,
  FileText,
  Upload,
  Sparkles,
  Download,
  MessageSquare,
  Trash2,
  ChevronRight,
  Pencil,
  Menu,
  Wand2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { studySessionService } from "@/services/studySessionService";
import utilityService from "@/services/utilityService";
import MarkdownMessage from "@/components/MarkdownMessage";
import type {
  StudySession,
  ChatMessage,
  Mindmap,
} from "@/types/studySession";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const StudyMode = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create session modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    subject: "",
    grade: "",
    study_details: "",
  });
  const [isRewritingSubject, setIsRewritingSubject] = useState(false);
  const [isRewritingGrade, setIsRewritingGrade] = useState(false);
  const [isRewritingDetails, setIsRewritingDetails] = useState(false);
  const [resourcesFile, setResourcesFile] = useState<File | null>(null);
  const [pyqFile, setPyqFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Edit session modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSessionData, setEditSessionData] = useState({
    session_id: "",
    session_name: "",
    subject: "",
    grade: "",
    study_details: "",
  });

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRewritingChat, setIsRewritingChat] = useState(false);

  // Mindmaps
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [showMindmaps, setShowMindmaps] = useState(false);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);

  // Quiz
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [showQuizzes, setShowQuizzes] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Mindmaps list
  const [showMindmapsList, setShowMindmapsList] = useState(false);

  // Refs
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  const fetchSessions = async () => {
    setIsFetching(true);
    try {
      const response = await studySessionService.getMySessions();
      setSessions(response.sessions || []);

      // Auto-select most recent session
      if (response.sessions && response.sessions.length > 0) {
        const mostRecent = response.sessions[0];
        setSelectedSession(mostRecent);
        await loadSessionDetails(mostRecent.session_id);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Load Sessions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const sessionNameMatch = session.session_name.toLowerCase().includes(query);
    const subjectMatch = session.subject?.toLowerCase().includes(query);
    const gradeMatch = session.grade?.toLowerCase().includes(query);
    
    return sessionNameMatch || subjectMatch || gradeMatch;
  });

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const response = await studySessionService.getSessionDetails(sessionId);
      setChatMessages(response.chat_history || []);
    } catch (error: any) {
      // Failed to load session details
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0,
      }).promise;
      
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }

      // Check if text was actually extracted
      if (fullText.trim().length < 50) {
        throw new Error("This PDF doesn't contain readable text. Please use a text-based PDF, not a scanned image.");
      }

      return fullText;
    } catch (error: any) {
      // PDF extraction error
      
      // More specific error messages
      if (error.message?.includes("Invalid PDF")) {
        throw new Error("This file doesn't appear to be a valid PDF. Please check the file and try again.");
      }
      
      if (error.message?.includes("password") || error.message?.includes("encrypted")) {
        throw new Error("This PDF is password-protected. Please use an unprotected PDF.");
      }
      
      if (error.message?.includes("worker") || error.message?.includes("fetch") || error.message?.includes("module")) {
        throw new Error("Unable to process PDF at the moment. Please try again or use a different file.");
      }
      
      // Generic fallback
      throw new Error(
        "Couldn't read the PDF. Please ensure it's a valid text-based PDF (not a scanned image)."
      );
    }
  };

  const rewriteSessionField = async (
    field: 'subject' | 'grade' | 'study_details',
    setIsRewriting: (value: boolean) => void
  ) => {
    const value = newSessionData[field];
    if (!value.trim()) {
      toast({
        title: "Nothing to Rewrite",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }

    setIsRewriting(true);
    try {
      const response = await utilityService.rewriteText({
        text: value,
        context: 'general'
      });

      if (response.improvement_applied) {
        setNewSessionData({ ...newSessionData, [field]: response.rewritten_text });
        toast({
          title: "✨ Text Enhanced",
          description: "Your text has been improved!",
        });
      } else {
        toast({
          title: "Already Perfect!",
          description: "Your text looks great as is.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Rewrite Failed",
        description: error.message || "Could not enhance text",
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const createSession = async () => {
    if (!newSessionData.subject || !newSessionData.grade) {
      toast({
        title: "Missing Required Fields",
        description: "Please provide both subject and grade level.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let resourcesText = "";
      let pyqText = "";
      let syllabusText = "";

      // Extract PDF text
      if (resourcesFile) {
        setLoadingMessage("Reading your study materials...");
        resourcesText = await extractTextFromPdf(resourcesFile);
      }

      if (pyqFile) {
        setLoadingMessage("Processing previous year questions...");
        pyqText = await extractTextFromPdf(pyqFile);
      }

      if (syllabusFile) {
        setLoadingMessage("Analyzing your syllabus...");
        syllabusText = await extractTextFromPdf(syllabusFile);
      }

      setLoadingMessage("Setting up your study session...");

      const response = await studySessionService.createSession({
        subject: newSessionData.subject,
        grade: newSessionData.grade,
        study_details: newSessionData.study_details,
        resources_text: resourcesText || undefined,
        pyq_text: pyqText || undefined,
        syllabus_text: syllabusText || undefined,
      });

      setLoadingMessage("Almost ready...");

      toast({
        title: "Study Session Created",
        description: response.message,
      });

      // Reset form
      setShowCreateModal(false);
      setNewSessionData({ subject: "", grade: "", study_details: "" });
      setResourcesFile(null);
      setPyqFile(null);
      setSyllabusFile(null);
      setLoadingMessage("");

      // Refresh sessions list
      await fetchSessions();
    } catch (error: any) {
      toast({
        title: "Failed to Create Session",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const openEditModal = (session: any) => {
    setEditSessionData({
      session_id: session.session_id,
      session_name: session.session_name,
      subject: session.subject,
      grade: session.grade,
      study_details: session.study_details,
    });
    setShowEditModal(true);
  };

  const updateSession = async () => {
    if (!editSessionData.session_name.trim() || !editSessionData.subject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide session name and subject.",
        variant: "destructive",
      });
      return;
    }

    try {
      await studySessionService.updateSession(editSessionData);
      
      toast({
        title: "Session Updated",
        description: "Study session has been updated successfully.",
      });

      setShowEditModal(false);
      
      // Refresh sessions list
      await fetchSessions();
      
      // If this session was selected, reload its details
      if (selectedSession?.session_id === editSessionData.session_id) {
        await loadSessionDetails(editSessionData.session_id);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Update Session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await studySessionService.deleteSession(sessionId);
      toast({
        title: "Session Deleted",
        description: "Study session has been removed.",
      });

      // If deleted session was selected, clear selection
      if (selectedSession?.session_id === sessionId) {
        setSelectedSession(null);
        setChatMessages([]);
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (error: any) {
      toast({
        title: "Failed to Delete Session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rewriteChatInput = async () => {
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
        context: 'message'
      });

      if (response.improvement_applied) {
        setChatInput(response.rewritten_text);
        toast({
          title: "✨ Text Enhanced",
          description: "Your message has been improved!",
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
    if (!chatInput.trim() || !selectedSession) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await studySessionService.chatWithSession({
        session_id: selectedSession.session_id,
        question: chatInput,
      });

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      toast({
        title: "Failed to Send Message",
        description: error.message,
        variant: "destructive",
      });

      // Remove user message on error
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadQuizzes = async () => {
    if (!selectedSession) return;

    try {
      const response = await studySessionService.getSessionQuizzes(selectedSession.session_id);
      setQuizzes(response.quizzes || []);
    } catch (error: any) {
      // Failed to load quizzes
    }
  };

  const loadMindmaps = async () => {
    if (!selectedSession) return;

    try {
      const response = await studySessionService.getSessionMindmaps(selectedSession.session_id);
      setMindmaps(response.mindmaps || []);
    } catch (error: any) {
      // Failed to load mindmaps
    }
  };

  const generateQuiz = async () => {
    if (!selectedSession) return;

    setIsGeneratingQuiz(true);
    try {
      const response = await studySessionService.generateQuiz({
        session_id: selectedSession.session_id,
      });

      toast({
        title: "Practice Test Ready",
        description: response.message,
      });

      // Reload quizzes list
      await loadQuizzes();

      // Navigate to quiz page with quiz data
      navigate(`/quiz/${response.quiz_id}`, {
        state: {
          quizData: response,
          sessionName: selectedSession.session_name,
          isStudySession: true,
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

  const openQuiz = async (quizId: string) => {
    try {
      const response = await studySessionService.getQuizDetails(quizId);
      
      // Navigate to quiz page with quiz data
      navigate(`/quiz/${quizId}`, {
        state: {
          quizData: response,
          sessionName: selectedSession?.session_name,
          isStudySession: true,
        },
      });
    } catch (error: any) {
      toast({
        title: "Failed to Load Quiz",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateMindmap = async () => {
    if (!selectedSession) return;

    setIsGeneratingMindmap(true);
    try {
      const response = await studySessionService.generateMindmap({
        session_id: selectedSession.session_id,
      });

      // Reload mindmaps list
      await loadMindmaps();

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

  const downloadMindmap = (imageData: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Mindmap Downloaded",
      description: `Saved as ${filename}`,
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex relative overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        size="icon"
        className="fixed bottom-4 left-4 lg:hidden z-30 h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

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

      {/* Sidebar - Sessions List */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ 
          x: sidebarOpen || window.innerWidth >= 1024 ? 0 : -300,
          opacity: sidebarOpen || window.innerWidth >= 1024 ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
        className={`w-72 sm:w-80 border-r border-border/50 backdrop-blur-xl bg-gradient-to-b from-primary/5 to-secondary/5 flex-col relative z-30 ${
          sidebarOpen ? "fixed inset-y-0 left-0 flex lg:relative" : "hidden lg:flex"
        }`}
      >
        <div className="p-4 border-b border-border">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New Study Session
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 glass border-border"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 pt-0">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredSessions.length === 0 && searchQuery.trim() ? (
            <div className="text-center py-8 px-4">
              <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No sessions found for "{searchQuery}"
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Book className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Start Your Learning Journey!</p>
              <p className="text-xs text-muted-foreground">
                Create your first study session to get instant help, generate quizzes, and ace your exams!
              </p>
            </div>
          ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <motion.div
                  key={session.session_id}
                whileHover={{ x: 4 }}
                  onClick={() => {
                    setSelectedSession(session);
                    loadSessionDetails(session.session_id);
                    setSidebarOpen(false);
                  }}
                  className={`p-3 rounded-lg cursor-pointer border transition-all ${
                    selectedSession?.session_id === session.session_id
                      ? "bg-primary/10 border-primary"
                      : "bg-card hover:bg-accent/50 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">
                        {session.session_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Grade: {session.grade}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 transition-all hover:bg-primary/10 hover:text-primary text-muted-foreground/60 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(session);
                        }}
                        title="Edit session"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 transition-all hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this session?")) {
                            deleteSession(session.session_id);
                          }
                        }}
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                </div>
                </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {session.study_details}
                  </p>
              </motion.div>
            ))}
          </div>
          )}
        </ScrollArea>
      </motion.aside>

      {/* Main Content - Chat & Actions */}
      <div className="flex-1 flex flex-col relative">
        {/* Loading Overlay for Quiz/Mindmap Generation */}
        <AnimatePresence>
          {(isGeneratingQuiz || isGeneratingMindmap) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  {isGeneratingQuiz ? (
                    <FileText className="w-16 h-16 text-primary" />
                  ) : (
                    <Brain className="w-16 h-16 text-primary" />
                  )}
                </motion.div>
                <h3 className="text-xl font-semibold mt-4 mb-2">
                  {isGeneratingQuiz ? "Generating Practice Test..." : "Creating Visual Maps..."}
                </h3>
                <p className="text-muted-foreground">
                  {isGeneratingQuiz 
                    ? "AI is creating questions based on your study materials" 
                    : "AI is analyzing your session and building mindmaps"}
                </p>
                <motion.div
                  className="flex justify-center gap-1 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedSession ? (
          <>
          {/* Header */}
            <div className="p-3 sm:p-4 border-b border-border glass">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">{selectedSession.session_name}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Grade {selectedSession.grade}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => {
                      loadQuizzes();
                      setShowQuizzes(true);
                    }}
                    size="sm"
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Quizzes</span>
                  </Button>
                  <Button
                    onClick={() => {
                      loadMindmaps();
                      setShowMindmapsList(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Mindmaps</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-3 sm:p-4">
              <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 opacity-80">
                      <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">🚀 Your Personal Study AI is Ready!</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-6">
                      Get instant answers from your notes & textbooks • Create practice tests • Generate visual mindmaps • Never study alone again!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {[
                        "What should I focus on to score well?",
                        "Explain this topic like I'm 5 years old",
                        "Create a study plan to ace my exams",
                        "What questions might appear in my test?",
                        "Give me practice problems to solve now",
                      ].map((question) => (
                        <motion.button
                          key={question}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setChatInput(question);
                            setTimeout(() => chatInputRef.current?.focus(), 100);
                          }}
                          className="p-4 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                            <span className="text-sm">{question}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <MarkdownMessage content={msg.content} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}

                {isChatLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground animate-pulse">Thinking...</span>
                    </div>
                  </motion.div>
                )}
                
                {/* Scroll anchor */}
                <div ref={chatMessagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-3 sm:p-4 border-t border-border glass">
              <div className="max-w-4xl mx-auto flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    placeholder="Ask anything... I've read all your study materials!"
                    className="flex-1 text-sm sm:text-base pr-12"
                    disabled={isChatLoading}
                  />
                  <Button
                    onClick={rewriteChatInput}
                    disabled={isRewritingChat || !chatInput.trim()}
                    size="icon"
                    variant="ghost"
                    className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 hover:bg-primary/20"
                    title="Enhance with AI"
                  >
                    {isRewritingChat ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Wand2 className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  size="icon"
                  className="h-10 w-10 sm:h-10 sm:w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <Book className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">📚 Ready to Study Smarter?</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Select a session from the sidebar or create a new one to unlock AI-powered study help!
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2 bg-gradient-to-r from-primary to-secondary"
              >
                <Plus className="w-4 h-4" />
                Start Your First Session
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        showModal={showCreateModal}
        setShowModal={setShowCreateModal}
        newSessionData={newSessionData}
        setNewSessionData={setNewSessionData}
        resourcesFile={resourcesFile}
        setResourcesFile={setResourcesFile}
        pyqFile={pyqFile}
        setPyqFile={setPyqFile}
        syllabusFile={syllabusFile}
        setSyllabusFile={setSyllabusFile}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        createSession={createSession}
        rewriteSessionField={rewriteSessionField}
        isRewritingSubject={isRewritingSubject}
        setIsRewritingSubject={setIsRewritingSubject}
        isRewritingGrade={isRewritingGrade}
        setIsRewritingGrade={setIsRewritingGrade}
        isRewritingDetails={isRewritingDetails}
        setIsRewritingDetails={setIsRewritingDetails}
      />

      {/* Quizzes List Modal */}
      <AnimatePresence>
        {showQuizzes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuizzes(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl glass rounded-2xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Practice Tests</h2>
                <Button onClick={() => setShowQuizzes(false)} size="icon" variant="ghost">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => {
                  setShowQuizzes(false);
                  generateQuiz();
                }}
                disabled={isGeneratingQuiz}
                className="w-full mb-4 gap-2"
              >
                {isGeneratingQuiz ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Generate New Quiz
              </Button>

              <ScrollArea className="max-h-96">
                {quizzes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No quizzes yet. Generate your first one!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quizzes.map((quiz) => (
                      <Card
                        key={quiz.quiz_id}
                        className="glass border-border hover:border-primary/50 cursor-pointer transition-all"
                        onClick={() => {
                          setShowQuizzes(false);
                          openQuiz(quiz.quiz_id);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="font-medium">
                                  Quiz - {new Date(quiz.created_at).toLocaleDateString()}
                                </span>
                                {quiz.is_evaluated && (
                                  <Badge variant="outline" className="text-xs">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {quiz.total_questions} questions
                                {quiz.is_evaluated && ` • ${quiz.percentage?.toFixed(0)}% score`}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mindmaps List Modal */}
      <AnimatePresence>
        {showMindmapsList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMindmapsList(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl glass rounded-2xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Visual Maps</h2>
                <Button onClick={() => setShowMindmapsList(false)} size="icon" variant="ghost">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => {
                  setShowMindmapsList(false);
                  generateMindmap();
                }}
                disabled={isGeneratingMindmap}
                className="w-full mb-4 gap-2"
              >
                {isGeneratingMindmap ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Generate New Mindmap
              </Button>

              <ScrollArea className="max-h-96">
                {mindmaps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No mindmaps yet. Generate your first one!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mindmaps.map((mindmap) => (
                      <Card
                        key={mindmap.mindmap_id}
                        className="glass border-border hover:border-primary/50 cursor-pointer transition-all"
                        onClick={() => {
                          setShowMindmapsList(false);
                          setShowMindmaps(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={mindmap.image_b64}
                              alt={mindmap.title}
                              className="w-16 h-16 rounded border border-border object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{mindmap.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {mindmap.description}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
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
                <Button onClick={() => setShowMindmaps(false)} size="icon" variant="ghost">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-6">
                  {mindmaps.map((mindmap, index) => (
                    <Card key={mindmap.mindmap_id} className="glass border-border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Visual Map {index + 1}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {mindmap.description}
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              downloadMindmap(
                                mindmap.image_b64,
                                `mindmap-${index + 1}.png`
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <img
                          src={mindmap.image_b64}
                          alt={mindmap.description}
                          className="w-full rounded-lg border border-border"
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

      {/* Edit Session Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Edit Study Session</h2>
                <Button onClick={() => setShowEditModal(false)} size="icon" variant="ghost">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-session-name">Session Name</Label>
                  <Input
                    id="edit-session-name"
                    placeholder="e.g., Physics Chapter 5 Revision"
                    value={editSessionData.session_name}
                    onChange={(e) =>
                      setEditSessionData({ ...editSessionData, session_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Input
                    id="edit-subject"
                    placeholder="e.g., Physics, Mathematics"
                    value={editSessionData.subject}
                    onChange={(e) =>
                      setEditSessionData({ ...editSessionData, subject: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="edit-grade">Grade/Level</Label>
                  <Input
                    id="edit-grade"
                    placeholder="e.g., 12th Grade, College"
                    value={editSessionData.grade}
                    onChange={(e) =>
                      setEditSessionData({ ...editSessionData, grade: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="edit-study-details">Study Details</Label>
                  <Textarea
                    id="edit-study-details"
                    placeholder="What do you want to focus on?"
                    rows={4}
                    value={editSessionData.study_details}
                    onChange={(e) =>
                      setEditSessionData({ ...editSessionData, study_details: e.target.value })
                    }
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> To update PDF materials (Resources, PYQs, Syllabus), please create a new session.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={updateSession}
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-secondary"
                  >
                    <Sparkles className="w-4 h-4" />
                    Update Session
                  </Button>
                  <Button
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Create Session Modal Component
interface CreateSessionModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  newSessionData: { subject: string; grade: string; study_details: string };
  setNewSessionData: (data: any) => void;
  resourcesFile: File | null;
  setResourcesFile: (file: File | null) => void;
  pyqFile: File | null;
  setPyqFile: (file: File | null) => void;
  syllabusFile: File | null;
  setSyllabusFile: (file: File | null) => void;
  isLoading: boolean;
  loadingMessage: string;
  createSession: () => void;
  rewriteSessionField: (field: 'subject' | 'grade' | 'study_details', setIsRewriting: (value: boolean) => void) => void;
  isRewritingSubject: boolean;
  setIsRewritingSubject: (value: boolean) => void;
  isRewritingGrade: boolean;
  setIsRewritingGrade: (value: boolean) => void;
  isRewritingDetails: boolean;
  setIsRewritingDetails: (value: boolean) => void;
}

const CreateSessionModal = ({
  showModal,
  setShowModal,
  newSessionData,
  setNewSessionData,
  resourcesFile,
  setResourcesFile,
  pyqFile,
  setPyqFile,
  syllabusFile,
  setSyllabusFile,
  isLoading,
  loadingMessage,
  createSession,
  rewriteSessionField,
  isRewritingSubject,
  setIsRewritingSubject,
  isRewritingGrade,
  setIsRewritingGrade,
  isRewritingDetails,
  setIsRewritingDetails,
}: CreateSessionModalProps) => {
  return (
    <AnimatePresence>
      {showModal && (
              <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isLoading && setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl glass rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Create Study Session</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up your study session with materials and get personalized AI help
                </p>
              </div>
              <Button
                onClick={() => setShowModal(false)}
                size="icon"
                variant="ghost"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject / Topic *</Label>
                  <div className="relative">
                    <Input
                      id="subject"
                      value={newSessionData.subject}
                      onChange={(e) =>
                        setNewSessionData({ ...newSessionData, subject: e.target.value })
                      }
                      placeholder="e.g., Machine Learning"
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      onClick={() => rewriteSessionField('subject', setIsRewritingSubject)}
                      disabled={isRewritingSubject || !newSessionData.subject.trim()}
                      size="icon"
                      variant="ghost"
                      className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 hover:bg-primary/20"
                      title="Enhance with AI"
                    >
                      {isRewritingSubject ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Wand2 className="w-4 h-4 text-primary" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade Level *</Label>
                  <div className="relative">
                    <Input
                      id="grade"
                      value={newSessionData.grade}
                      onChange={(e) =>
                        setNewSessionData({ ...newSessionData, grade: e.target.value })
                      }
                      placeholder="e.g., 12, College, Graduate"
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      onClick={() => rewriteSessionField('grade', setIsRewritingGrade)}
                      disabled={isRewritingGrade || !newSessionData.grade.trim()}
                      size="icon"
                      variant="ghost"
                      className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 hover:bg-primary/20"
                      title="Enhance with AI"
                    >
                      {isRewritingGrade ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Wand2 className="w-4 h-4 text-primary" />
                      )}
                    </Button>
                  </div>
                </div>
                      </div>

              <div className="space-y-2">
                <Label htmlFor="details">Study Details</Label>
                <div className="relative">
                  <Textarea
                    id="details"
                    value={newSessionData.study_details}
                    onChange={(e) =>
                      setNewSessionData({ ...newSessionData, study_details: e.target.value })
                    }
                    placeholder="What do you want to focus on? Any specific topics or areas?"
                    className="resize-none h-24 pr-12"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    onClick={() => rewriteSessionField('study_details', setIsRewritingDetails)}
                    disabled={isRewritingDetails || !newSessionData.study_details.trim()}
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 hover:bg-primary/20"
                    title="Enhance with AI"
                  >
                    {isRewritingDetails ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Wand2 className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                </div>
                      </div>

              <div className="space-y-3">
                <Label>Upload Study Materials (PDF)</Label>
                <p className="text-xs text-muted-foreground">
                  Upload PDF files containing text (not scanned images). The AI will use these to answer your questions.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="resources" className="text-sm">
                      Study Resources
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="resources"
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setResourcesFile(e.target.files?.[0] || null)
                        }
                        className="flex-1"
                        disabled={isLoading}
                      />
                      {resourcesFile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResourcesFile(null)}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pyq" className="text-sm">
                      Previous Year Questions (PYQ)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="pyq"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPyqFile(e.target.files?.[0] || null)}
                        className="flex-1"
                        disabled={isLoading}
                      />
                      {pyqFile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPyqFile(null)}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="syllabus" className="text-sm">
                      Syllabus
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="syllabus"
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setSyllabusFile(e.target.files?.[0] || null)
                        }
                        className="flex-1"
                        disabled={isLoading}
                      />
                      {syllabusFile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSyllabusFile(null)}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {loadingMessage && (
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-sm text-primary font-medium">{loadingMessage}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createSession}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                  disabled={
                    isLoading ||
                    !newSessionData.subject ||
                    !newSessionData.grade
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Session"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
  );
};

export default StudyMode;
