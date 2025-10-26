import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Search,
  Plus,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Loader2,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MarkdownMessage from "@/components/MarkdownMessage";
import { memoryVaultService, type ChatMessage, type MemoryItem } from "@/services/memoryVaultService";

type Mode = "search" | "add";

const MemoryVault = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [mode, setMode] = useState<Mode>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  
  // File upload
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Items list
  const [items, setItems] = useState<MemoryItem[]>([]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch chat history on mount
  useEffect(() => {
    fetchChatHistory();
    fetchItems();
  }, []);

  const fetchChatHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const response = await memoryVaultService.getChatHistory(50);
      
      // Handle empty or invalid response
      if (response && response.chat_history && Array.isArray(response.chat_history)) {
        setMessages(response.chat_history.map(msg => ({
          role: msg.role || "user",
          content: msg.content || "",
          timestamp: msg.timestamp || new Date().toISOString()
        })));
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch chat history:", error);
      setMessages([]); // Set empty messages on error
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await memoryVaultService.getMyItems();
      
      // Handle empty or invalid response
      if (response && response.items && Array.isArray(response.items)) {
        setItems(response.items);
      } else {
        setItems([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch items:", error);
      setItems([]); // Set empty items on error
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check for slash commands
    if (inputMessage.startsWith("/")) {
      handleSlashCommand(inputMessage);
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      if (mode === "add") {
        // Save as note in ADD mode
        const response = await memoryVaultService.saveNote(inputMessage);
        
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: "✅ Note saved to Memory Vault!",
          timestamp: new Date().toISOString(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        toast({
          title: "Saved",
          description: "Note saved successfully",
        });
        
        await fetchItems();
      } else {
        // Query in SEARCH mode
        // Check if user is explicitly asking for a file/download
        const isAskingForFile = /\b(download|send|give|share|file|document|pdf|link|show\s+me\s+the|attach|get\s+me|provide|want)\b/i.test(inputMessage);
        
        const response = await memoryVaultService.chat({
          message: inputMessage,
          similarity_threshold: 30,
          provide_link: isAskingForFile, // Only provide link if explicitly asking
        });

        // Extract any Azure Blob URLs from the response
        const azureUrlRegex = /(https:\/\/[^\s]+\.blob\.core\.windows\.net[^\s]+)/g;
        const urls = response.response.match(azureUrlRegex);
        
        // Remove URLs from the response text
        let cleanedResponse = response.response;
        if (urls && urls.length > 0) {
          urls.forEach(url => {
            cleanedResponse = cleanedResponse.replace(url, '').trim();
          });
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: cleanedResponse,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // If there's a download link (either from backend or extracted from response), add it as a button
        if (response.download_link && response.file_name) {
          const linkMessage: ChatMessage = {
            role: "assistant",
            content: `download_button:${response.file_name}:${response.download_link}`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, linkMessage]);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process message",
        variant: "destructive",
      });
      
      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlashCommand = (command: string) => {
    const cmd = command.toLowerCase().trim();
    
    if (cmd === "/add") {
      setMode("add");
      setInputMessage("");
      toast({
        title: "Switched to ADD Mode",
        description: "You can now upload files or save notes",
      });
    } else if (cmd === "/search") {
      setMode("search");
      setInputMessage("");
      toast({
        title: "Switched to SEARCH Mode",
        description: "You can now query your vault",
      });
    } else {
      toast({
        title: "Unknown Command",
        description: "Available commands: /add, /search",
        variant: "destructive",
      });
      setInputMessage("");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadDialog(true);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const response = await memoryVaultService.uploadFile(selectedFile, fileDescription);
      
      // Add system message showing file upload
      const uploadMessage: ChatMessage = {
        role: "assistant",
        content: `📎 **File Uploaded Successfully**\n\n**File**: ${response.file_name}\n**Description**: ${fileDescription || "No description"}\n\nFile has been indexed and is now searchable!`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, uploadMessage]);
      
      toast({
        title: "File Uploaded",
        description: response.file_name,
      });

      setShowUploadDialog(false);
      setSelectedFile(null);
      setFileDescription("");
      
      await fetchItems();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      setAudioChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak now...",
      });
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Processing audio...",
      });
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      // In search mode, transcribe and search instead of saving
      if (mode === "search") {
        await transcribeAndSearch(audioBlob);
        return;
      }

      // In add mode, transcribe and save as note
      const fileName = `recording_${Date.now()}.webm`;
      
      // Create a proper File object from the Blob
      let audioFile: File;
      try {
        audioFile = new globalThis.File([audioBlob], fileName, { type: "audio/webm" });
      } catch (e) {
        audioFile = Object.assign(audioBlob, { 
          name: fileName,
          lastModified: Date.now()
        }) as File;
      }

      setIsUploading(true);
      const response = await memoryVaultService.uploadFile(audioFile, "Voice recording");

      const uploadMessage: ChatMessage = {
        role: "assistant",
        content: `🎤 **Audio Transcribed & Saved**\n\nYour voice note has been converted to text and saved!`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, uploadMessage]);
      
      toast({
        title: "Audio Saved",
        description: "Voice note transcribed and saved",
      });

      await fetchItems();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload audio",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const transcribeAndSearch = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Show user message
      const userMessage: ChatMessage = {
        role: "user",
        content: "🎤 [Voice message]",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Create File from Blob
      const fileName = `voice_search_${Date.now()}.webm`;
      let audioFile: File;
      try {
        audioFile = new globalThis.File([audioBlob], fileName, { type: "audio/webm" });
      } catch (e) {
        audioFile = Object.assign(audioBlob, { 
          name: fileName,
          lastModified: Date.now()
        }) as File;
      }

      // Call transcription endpoint
      const transcriptionResult = await memoryVaultService.transcribeAudio(audioFile);
      
      if (!transcriptionResult.text || !transcriptionResult.text.trim()) {
        throw new Error("No speech detected in audio");
      }

      // Show what was heard
      const transcribedMessage: ChatMessage = {
        role: "user",
        content: `"${transcriptionResult.text}"`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, transcribedMessage]);

      // Now search using the transcribed text
      // Check if asking for file in transcribed text
      const isAskingForFile = /\b(download|send|give|share|file|document|pdf|link|show\s+me\s+the|attach|get\s+me|provide|want)\b/i.test(transcriptionResult.text);
      
      const response = await memoryVaultService.chat({
        message: transcriptionResult.text,
        similarity_threshold: 30,
        provide_link: isAskingForFile,
      });

      // Extract any Azure Blob URLs from the response
      const azureUrlRegex = /(https:\/\/[^\s]+\.blob\.core\.windows\.net[^\s]+)/g;
      const urls = response.response.match(azureUrlRegex);
      
      // Remove URLs from the response text
      let cleanedResponse = response.response;
      if (urls && urls.length > 0) {
        urls.forEach(url => {
          cleanedResponse = cleanedResponse.replace(url, '').trim();
        });
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: cleanedResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If there's a download link, add it as a button
      if (response.download_link && response.file_name) {
        const linkMessage: ChatMessage = {
          role: "assistant",
          content: `download_button:${response.file_name}:${response.download_link}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, linkMessage]);
      }
      
      toast({
        title: "Voice Search Complete",
        description: "Found results for your query",
      });
    } catch (error: any) {
      toast({
        title: "Voice Search Failed",
        description: error.message || "Could not process audio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return <ImageIcon className="w-4 h-4" />;
    } else if (ext === "pdf") {
      return <File className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Chat Header - Fixed */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container max-w-5xl mx-auto px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold">Memory Vault</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {mode === "search" ? "Ask to find anything instantly" : "Store notes & files"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Info badges - visible on mobile and desktop */}
              <div className="hidden md:flex items-center gap-2 mr-2">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  <Plus className="w-2.5 h-2.5 mr-1" />
                  Add to store
                </Badge>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  <Search className="w-2.5 h-2.5 mr-1" />
                  Search to find
                </Badge>
              </div>
              
              {/* Mode Toggle */}
              <Badge 
                variant={mode === "search" ? "default" : "secondary"}
                className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setMode(mode === "search" ? "add" : "search")}
              >
                {mode === "search" ? (
                  <>
                    <Search className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Add</span>
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-muted/10">
        <div className="container max-w-5xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          {isFetchingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-10 rounded-2xl animate-pulse"></div>
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-primary relative z-10" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                Your Personal Cloud
              </h2>
              
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mb-6 leading-relaxed">
                Store everything — notes, files, ideas. Just ask when you need something, AI finds it instantly. No manual search needed.
              </p>

              <div className="flex flex-wrap gap-4 justify-center mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Use <Badge variant="outline" className="text-xs mx-1">Add</Badge> to store</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Use <Badge variant="outline" className="text-xs mx-1">Search</Badge> to find</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMode("add");
                    toast({ title: "Add Mode", description: "Type your note below" });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3 pb-2">
              <AnimatePresence>
                {messages.map((msg, idx) => {
                  // Check if this is a download button message
                  const isDownloadButton = msg.content.startsWith("download_button:");
                  
                  if (isDownloadButton) {
                    // Split only on the first two colons to preserve the full URL
                    const parts = msg.content.split(":");
                    const fileName = parts[1];
                    const downloadLink = parts.slice(2).join(":"); // Rejoin rest for full URL
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%] sm:max-w-[75%] p-2.5 sm:p-3 rounded-2xl bg-muted/50 border border-border rounded-bl-md">
                          <a
                            href={downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs sm:text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
                          >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Download {fileName}
                          </a>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                            Link expires in 24 hours
                          </p>
                          <p className="text-[10px] sm:text-xs mt-1 text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  }
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-2.5 sm:p-3 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-primary to-secondary text-white rounded-br-md"
                            : "bg-muted/50 border border-border rounded-bl-md"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        ) : (
                          <MarkdownMessage content={msg.content} className="text-xs sm:text-sm" />
                        )}
                        <p className={`text-[10px] sm:text-xs mt-1.5 ${msg.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted/50 border border-border p-2.5 sm:p-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-end gap-1.5 sm:gap-2">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.txt,.md,.json,.jpg,.jpeg,.png,.gif,.webp,.wav,.mp3,.flac"
              className="hidden"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10"
              title="Upload file"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Audio Recording Button */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isUploading}
              className={`shrink-0 h-9 w-9 sm:h-10 sm:w-10 ${
                isRecording ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-primary/10"
              }`}
              title={isRecording ? "Stop recording" : "Record audio"}
            >
              {isRecording ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            {/* Message Input */}
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  mode === "search"
                    ? "Message Memory Vault..."
                    : "Type a note or use /search..."
                }
                disabled={isLoading || isUploading || isRecording}
                className="min-h-[42px] sm:min-h-[44px] max-h-28 text-sm resize-none pr-11 scrollbar-hide rounded-3xl border-2 focus:border-primary"
                rows={1}
              />
              
              {/* Send Button - Inside Input */}
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || isUploading || !inputMessage.trim() || isRecording}
                className="absolute right-1.5 bottom-1.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-primary to-secondary p-0"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Command Hints */}
          {inputMessage.startsWith("/") && (
            <div className="mt-1.5 flex gap-1.5 sm:gap-2 animate-in slide-in-from-bottom-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 text-[10px] sm:text-xs py-0.5" 
                onClick={() => setInputMessage("/add")}
              >
                /add
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 text-[10px] sm:text-xs py-0.5" 
                onClick={() => setInputMessage("/search")}
              >
                /search
              </Badge>
            </div>
          )}
        </div>

      </div>

      {/* File Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a file to your Memory Vault. Add an optional description to help with searching later.
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {getFileIcon(selectedFile.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Describe what this file contains..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
                <Button onClick={() => setShowUploadDialog(false)} variant="outline" disabled={isUploading}>
                  Cancel
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemoryVault;

