import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Trash2,
  Loader2,
  GraduationCap,
  Smile,
  Zap,
  Menu,
  X,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatService } from "@/services/chatService";
import { friendChatService } from "@/services/friendChatService";
import MarkdownMessage from "@/components/MarkdownMessage";
import type { ChatMode, Message, Chat, TemporaryChatMessage } from "@/types/chat";

const Home = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mode state
  const [mode, setMode] = useState<ChatMode>("study");
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  
  // Chat state
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatList, setChatList] = useState<Chat[]>([]);
  
  // UI state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isNewChatMode, setIsNewChatMode] = useState(false); // Track if user wants a new chat
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  // Get the appropriate service based on mode
  const getService = () => mode === "study" ? chatService : friendChatService;

  // Fetch user's chats when mode changes or temporary mode is disabled
  useEffect(() => {
    if (!isTemporaryMode) {
      fetchChats();
      setCurrentChatId(null);
      setMessages([]);
    }
  }, [mode, isTemporaryMode]);

  // Automatically load the most recent chat when chatList changes (but not if user wants a new chat or in temporary mode)
  useEffect(() => {
    if (chatList.length > 0 && !currentChatId && !isFetchingHistory && !isNewChatMode && !isTemporaryMode) {
      // Load the most recent chat (first in the list, as they're sorted by updated_at desc)
      loadChatHistory(chatList[0].chat_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatList, currentChatId, isFetchingHistory, isNewChatMode, isTemporaryMode]);

  // Auto-scroll to bottom when messages change or chat is loaded
  useEffect(() => {
    // Scroll to bottom using smooth behavior
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Fetch all chats for current mode
  const fetchChats = async () => {
    setIsFetchingChats(true);
    try {
      const response = await getService().getMyChats();
      setChatList(response.chats);
    } catch (error: any) {
      // Failed to fetch chats
    } finally {
      setIsFetchingChats(false);
    }
  };

  // Filter chats based on search query
  const filteredChatList = chatList.filter((chat) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const titleMatch = chat.title.toLowerCase().includes(query);
    
    // Note: We can only search in title as messages are loaded separately
    // For message content search, we'd need backend support
    return titleMatch;
  });

  // Load chat history
  const loadChatHistory = async (chatId: string) => {
    setIsFetchingHistory(true);
    setIsNewChatMode(false); // Exiting new chat mode when loading existing chat
    try {
      const history = await getService().getChatHistory(chatId);
      setMessages(history.messages);
      setCurrentChatId(chatId);
    } catch (error: any) {
      // Handle 404 gracefully - chat might have been deleted
      if (error.status === 404) {
        // Silently remove the chat from list and start a new chat
        setChatList((prev) => prev.filter((chat) => chat.chat_id !== chatId));
        startNewChat();
      } else {
        // Show error for other issues
      toast({
        title: "Unable to Load Chat",
        description: error.message || "Couldn't load this conversation. Please try again.",
        variant: "destructive",
      });
      }
    } finally {
      setIsFetchingHistory(false);
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
    setIsNewChatMode(true); // Flag that user wants a new chat
    
    toast({
      title: "New Chat Started",
      description: "Start typing your message below.",
    });
  };

  // Send a message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (isTemporaryMode) {
        // Handle temporary chat
        const conversationHistory: TemporaryChatMessage[] = messages.map(({ role, content }) => ({
          role,
          content,
        }));

        const aiResponse = await chatService.sendTemporaryMessage(
          userMessage.content,
          conversationHistory
        );

        // Add AI response
        const aiMessage: Message = {
          role: "assistant",
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle regular chat
        const response = await getService().sendMessage({
          chat_id: currentChatId || undefined, // Send undefined instead of null
          message: userMessage.content,
        });

        // Add AI response
        const aiMessage: Message = {
          role: "assistant",
          content: response.response,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        
        // Update current chat ID if it was a new chat
        if (!currentChatId && response.chat_id) {
          setCurrentChatId(response.chat_id);
          setIsNewChatMode(false); // Exit new chat mode after first message
        }
        
        // Always refresh chat list after sending a message to keep it updated
        await fetchChats();
      }
    } catch (error: any) {
      // Send message error with user-friendly message
      toast({
        title: "Message Failed",
        description: error.message || "Unable to send your message. Please try again.",
        variant: "destructive",
      });
      
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a chat
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      await getService().deleteChat(chatId);
      
      // Remove from list
      setChatList((prev) => prev.filter((chat) => chat.chat_id !== chatId));
      
      // Clear current chat if it was deleted
      if (currentChatId === chatId) {
        startNewChat();
      }
      
      toast({
        title: "Chat Deleted",
        description: "The chat has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Unable to delete this conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle mode
  const toggleMode = () => {
    setMode((prev) => (prev === "study" ? "friend" : "study"));
  };

  // Toggle temporary mode
  const toggleTemporaryMode = () => {
    if (!isTemporaryMode) {
      // Entering temporary mode
      if (messages.length > 0 && !confirm("Switch to Temporary Chat? Your current conversation will be hidden (but saved).")) {
        return;
      }
      setIsTemporaryMode(true);
      setMessages([]); // Clear all messages for fresh start
      setCurrentChatId(null);
      setInput(""); // Clear input field
      setChatList([]); // Clear chat list to prevent auto-loading
      toast({
        title: "Temporary Chat Active",
        description: "Messages won't be saved. Click again to exit and return to saved chats.",
      });
    } else {
      // Exiting temporary mode
      if (messages.length > 0) {
        if (!confirm("Exit Temporary Chat? All temporary messages will be permanently deleted.")) {
          return;
        }
      }
      setIsTemporaryMode(false);
      setMessages([]); // Clear temporary messages
      setCurrentChatId(null);
      setInput(""); // Clear input field
      setIsNewChatMode(false); // Reset new chat mode flag
      fetchChats(); // Reload saved chats (this will trigger auto-load of most recent)
      toast({
        title: "Back to Regular Chat",
        description: "Your conversations will now be saved.",
      });
    }
  };

  // Get welcome message based on mode
  const getWelcomeMessage = () => {
    if (isTemporaryMode) {
      return "⚡ Quick Chat Mode - Your privacy matters! These messages won't be saved anywhere. Perfect for sensitive questions or quick help. Click 'Exit Temp' when done.";
    } else if (mode === "study") {
      return "🎓 Welcome to Study Mode! Get instant help with homework, understand tough concepts in simple words, prepare for exams, or learn anything new. No question is too small!";
    } else {
      return "👋 Hey! Need someone to talk to? I'm here to listen, chat about anything, help you destress, or just be a friendly voice. How's your day going?";
    }
  };

  // Format timestamp to human readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than a minute
    if (diffInSeconds < 60) {
      return "Just now";
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Show full date for older messages
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      {!isTemporaryMode && (
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          size="icon"
          className="fixed bottom-4 left-4 lg:hidden z-30 h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      )}

      {/* Futuristic Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl ${
            mode === "study" ? "bg-blue-500/10" : "bg-pink-500/10"
          }`}
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
          className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl ${
            mode === "study" ? "bg-purple-500/10" : "bg-rose-500/10"
          }`}
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
        {/* Animated particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              mode === "study" ? "bg-blue-500/30" : "bg-pink-500/30"
            }`}
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

      {/* Sidebar - Hidden in temporary mode */}
      {!isTemporaryMode && (
        <>
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
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ 
              x: sidebarOpen || window.innerWidth >= 1024 ? 0 : -300,
              opacity: sidebarOpen || window.innerWidth >= 1024 ? 1 : 0 
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`w-64 border-r border-border/50 backdrop-blur-xl flex-col relative z-30 ${
              sidebarOpen ? "fixed inset-y-0 left-0 flex lg:relative" : "hidden lg:flex"
            } ${
              mode === "study" 
                ? "bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-blue-500/5" 
                : "bg-gradient-to-b from-pink-500/5 via-rose-500/5 to-pink-500/5"
            }`}
          >
        {/* New Chat Button */}
        <div className="p-4 border-b border-border/50">
          <motion.div
            whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            <Button 
              onClick={() => {
                startNewChat();
                setSidebarOpen(false);
              }}
              className={`w-full gap-2 relative overflow-hidden group shadow-lg hover:shadow-xl transition-all ${
              mode === "study"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
                : "bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90"
            }`}
          >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <Plus className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative z-10">New Chat</span>
              <Sparkles className="w-3 h-3 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Button>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 glass border-border"
            />
          </div>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-4 pt-0">
          {isFetchingChats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredChatList.length > 0 ? (
            <div className="space-y-2">
              {filteredChatList.map((chat, index) => (
                <motion.div
                  key={chat.chat_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    loadChatHistory(chat.chat_id);
                    setSidebarOpen(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 group relative overflow-hidden transition-all ${
                    currentChatId === chat.chat_id
                      ? mode === "study"
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 shadow-lg"
                        : "bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/40 shadow-lg"
                      : "bg-card/50 hover:bg-accent/60 border border-border/30 hover:border-primary/30"
                  }`}
                >
                  {/* Glow effect on hover */}
                  <motion.div
                    className={`absolute inset-0 ${
                      mode === "study" ? "bg-blue-500/5" : "bg-pink-500/5"
                    } opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  
                  <div className={`w-8 h-8 rounded-lg ${
                    mode === "study" 
                      ? "bg-gradient-to-br from-blue-500 to-purple-500" 
                      : "bg-gradient-to-br from-pink-500 to-rose-500"
                  } flex items-center justify-center shrink-0 relative z-10 shadow-md`}>
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-sm truncate font-semibold">{chat.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className={`w-1 h-1 rounded-full ${
                          mode === "study" ? "bg-blue-500" : "bg-pink-500"
                        }`} />
                        {chat.message_count} {chat.message_count === 1 ? 'msg' : 'msgs'}
                      </span>
                      <span>•</span>
                      <span>{formatTimestamp(chat.updated_at)}</span>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="relative z-10"
                  >
                  <Button
                    variant="ghost"
                    size="icon"
                      className="h-7 w-7 shrink-0 hover:bg-destructive/20 hover:text-destructive"
                    onClick={(e) => handleDeleteChat(chat.chat_id, e)}
                  >
                      <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No chats found for "{searchQuery}"</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 px-4 text-sm text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium mb-1">Ready to chat?</p>
              <p className="text-xs">Start a conversation to get instant help with your studies or have a friendly chat anytime!</p>
            </div>
          )}
        </ScrollArea>

        {/* Mode Toggle */}
        <div className="p-4 border-t border-border/50">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
          <Button
            onClick={toggleMode}
            variant="outline"
              className={`w-full gap-2 relative overflow-hidden group border-2 ${
              mode === "study"
                  ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-500/50"
                  : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50"
              }`}
            >
              <motion.div
                className={`absolute inset-0 ${
                  mode === "study" ? "bg-pink-500/10" : "bg-blue-500/10"
                }`}
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            {mode === "study" ? (
              <>
                  <Heart className="w-4 h-4 animate-pulse relative z-10 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold relative z-10">Switch to Friend Mode</span>
              </>
            ) : (
              <>
                  <GraduationCap className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold relative z-10">Switch to Study Mode</span>
              </>
            )}
          </Button>
          </motion.div>
        </div>
      </motion.aside>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mode Header */}
        <motion.div 
          className={`border-b border-border/50 backdrop-blur-xl p-4 relative z-10 ${
          mode === "study"
              ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
              : "bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/10"
          }`}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between px-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {mode === "study" ? (
                <>
                  <motion.div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg relative"
                    animate={{
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10" />
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 blur-md"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg">Study Mode</h2>
                    <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Your 24/7 study buddy - Homework help & exam prep
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg relative"
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10" />
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 blur-md"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg">Friend Mode</h2>
                    <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                      <Heart className="w-3 h-3 animate-pulse" />
                      Always here to listen - Chat anytime about anything
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={toggleTemporaryMode}
                  size="sm"
                  className={`gap-2 transition-all shadow-lg ${
                    isTemporaryMode
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                      : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
                  }`}
                  title={isTemporaryMode ? "Exit Private Chat (messages will be deleted)" : "Start Private Chat (messages won't be saved - perfect for sensitive questions)"}
                >
                  <Zap className={`w-4 h-4 ${isTemporaryMode ? "animate-pulse" : ""}`} />
                  <span className="hidden md:inline">{isTemporaryMode ? "Exit Private" : "Private Chat"}</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="lg:hidden">
                <Button
                  onClick={toggleMode}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  {mode === "study" ? <Heart className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {isFetchingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <motion.div 
                  className={`w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl relative ${
                  isTemporaryMode
                    ? "bg-gradient-to-br from-amber-500 to-orange-500"
                    : mode === "study"
                    ? "bg-gradient-to-br from-blue-500 to-purple-500"
                    : "bg-gradient-to-br from-pink-500 to-rose-500"
                  }`}
                  animate={{
                    y: [0, -10, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {isTemporaryMode ? (
                    <Zap className="w-12 h-12 text-white animate-pulse relative z-10" />
                  ) : mode === "study" ? (
                    <GraduationCap className="w-12 h-12 text-white relative z-10" />
                  ) : (
                    <Heart className="w-12 h-12 text-white animate-pulse relative z-10" />
                  )}
                  <motion.div
                    className={`absolute inset-0 rounded-2xl ${
                      isTemporaryMode
                        ? "bg-gradient-to-br from-amber-500 to-orange-500"
                        : mode === "study"
                        ? "bg-gradient-to-br from-blue-500 to-purple-500"
                        : "bg-gradient-to-br from-pink-500 to-rose-500"
                    } blur-xl`}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {isTemporaryMode ? "🔒 Private Chat Mode" : mode === "study" ? "🎯 Let's Ace Your Studies!" : "💙 I'm Here to Listen"}
                </motion.h3>
                <motion.p 
                  className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {getWelcomeMessage()}
                </motion.p>
                
                {/* Floating sparkles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${
                      isTemporaryMode 
                        ? "bg-amber-500/30" 
                        : mode === "study" 
                        ? "bg-blue-500/30" 
                        : "bg-pink-500/30"
                    }`}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, (Math.random() - 0.5) * 40, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut"
                    }}
                    style={{
                      left: `${30 + i * 10}%`,
                      top: "30%",
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={`${message.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl ${
                        message.role === "user"
                          ? mode === "study"
                            ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                            : "bg-gradient-to-br from-pink-500 to-rose-500 text-white"
                          : "glass border border-border"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <MarkdownMessage 
                          content={message.content} 
                          className="text-sm"
                        />
                      )}
                      <span className={`text-xs mt-2 block ${
                        message.role === "user" ? "opacity-80" : "opacity-60"
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="glass border border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground animate-pulse">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/50 backdrop-blur-xl p-3 sm:p-4 relative z-10">
          <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
            <motion.div 
              className="flex-1 relative"
              whileFocus={{ scale: 1.01 }}
            >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                mode === "study" 
                  ? "Ask me anything you want to learn..." 
                  : "Share what's on your mind..."
              }
                className="h-12 sm:h-14 rounded-2xl glass border-2 border-border/50 focus:border-primary/50 pr-12 text-sm sm:text-base"
              disabled={isLoading}
            />
              {input.trim() && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Sparkles className={`w-5 h-5 ${
                    mode === "study" ? "text-blue-500" : "text-pink-500"
                  }`} />
                </motion.div>
              )}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <Button
              onClick={handleSend}
              size="icon"
              disabled={isLoading || !input.trim()}
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl hover:opacity-90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group ${
                mode === "study"
                  ? "bg-gradient-to-br from-blue-500 to-purple-500"
                  : "bg-gradient-to-br from-pink-500 to-rose-500"
              }`}
            >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 2, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin relative z-10" />
              ) : (
                  <Send className="w-6 h-6 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
