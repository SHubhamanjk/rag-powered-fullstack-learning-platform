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
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatService } from "@/services/chatService";
import { friendChatService } from "@/services/friendChatService";
import MarkdownMessage from "@/components/MarkdownMessage";
import type { ChatMode, Message, Chat } from "@/types/chat";

const Home = () => {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Mode state
  const [mode, setMode] = useState<ChatMode>("study");
  
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

  // Get the appropriate service based on mode
  const getService = () => mode === "study" ? chatService : friendChatService;

  // Fetch user's chats when mode changes
  useEffect(() => {
    fetchChats();
    setCurrentChatId(null);
    setMessages([]);
  }, [mode]);

  // Automatically load the most recent chat when chatList changes (but not if user wants a new chat)
  useEffect(() => {
    if (chatList.length > 0 && !currentChatId && !isFetchingHistory && !isNewChatMode) {
      // Load the most recent chat (first in the list, as they're sorted by updated_at desc)
      loadChatHistory(chatList[0].chat_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatList, currentChatId, isFetchingHistory, isNewChatMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch all chats for current mode
  const fetchChats = async () => {
    setIsFetchingChats(true);
    try {
      const response = await getService().getMyChats();
      setChatList(response.chats);
    } catch (error: any) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsFetchingChats(false);
    }
  };

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
          title: "Failed to Load Chat",
          description: error.message || "Could not load chat history.",
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
    } catch (error: any) {
      console.error("Send message error:", error);
      toast({
        title: "Failed to Send Message",
        description: error.message || "Could not send your message. Please try again.",
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
        title: "Failed to Delete Chat",
        description: error.message || "Could not delete the chat.",
        variant: "destructive",
      });
    }
  };

  // Toggle mode
  const toggleMode = () => {
    setMode((prev) => (prev === "study" ? "friend" : "study"));
  };

  // Get welcome message based on mode
  const getWelcomeMessage = () => {
    if (mode === "study") {
      return "Hi! I'm your AI study assistant. I'm here to help you learn, understand complex topics, and ace your studies. Ask me anything!";
    } else {
      return "Hey there! I'm your AI friend, here to chat, listen, and support you. How are you doing today?";
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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`w-64 border-r border-border glass hidden lg:flex flex-col ${
          mode === "study" 
            ? "bg-gradient-to-b from-blue-500/5 to-purple-500/5" 
            : "bg-gradient-to-b from-pink-500/5 to-rose-500/5"
        }`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-border">
          <Button 
            onClick={startNewChat}
            className={`w-full gap-2 ${
              mode === "study"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
                : "bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90"
            }`}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-4">
          {isFetchingChats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : chatList.length > 0 ? (
            <div className="space-y-2">
              {chatList.map((chat) => (
                <motion.div
                  key={chat.chat_id}
                  whileHover={{ x: 4 }}
                  onClick={() => loadChatHistory(chat.chat_id)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center gap-2 group relative ${
                    currentChatId === chat.chat_id
                      ? mode === "study"
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "bg-pink-500/20 border border-pink-500/30"
                      : "bg-card hover:bg-accent/50 border border-transparent"
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${
                    currentChatId === chat.chat_id 
                      ? mode === "study" ? "text-blue-500" : "text-pink-500"
                      : "text-muted-foreground group-hover:text-primary"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{chat.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{chat.message_count} {chat.message_count === 1 ? 'message' : 'messages'}</span>
                      <span>•</span>
                      <span>{formatTimestamp(chat.updated_at)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0"
                    onClick={(e) => handleDeleteChat(chat.chat_id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No chats yet. Start a new conversation!
            </div>
          )}
        </ScrollArea>

        {/* Mode Toggle */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={toggleMode}
            variant="outline"
            className={`w-full gap-2 ${
              mode === "study"
                ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/30 hover:bg-pink-500/20"
                : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:bg-blue-500/20"
            }`}
          >
            {mode === "study" ? (
              <>
                <Heart className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Switch to Friend Mode</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-medium">Switch to Study Mode</span>
              </>
            )}
          </Button>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mode Header */}
        <div className={`border-b border-border glass p-4 ${
          mode === "study"
            ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10"
            : "bg-gradient-to-r from-pink-500/10 to-rose-500/10"
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === "study" ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Study Mode</h2>
                    <p className="text-xs text-muted-foreground">AI-powered learning assistant</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Smile className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Friend Mode</h2>
                    <p className="text-xs text-muted-foreground">Your caring companion</p>
                  </div>
                </>
              )}
            </div>
            <Button
              onClick={toggleMode}
              variant="ghost"
              size="sm"
              className="lg:hidden"
            >
              {mode === "study" ? <Heart className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {isFetchingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  mode === "study"
                    ? "bg-gradient-to-br from-blue-500 to-purple-500"
                    : "bg-gradient-to-br from-pink-500 to-rose-500"
                }`}>
                  {mode === "study" ? (
                    <GraduationCap className="w-10 h-10 text-white" />
                  ) : (
                    <Heart className="w-10 h-10 text-white animate-pulse" />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {mode === "study" ? "Ready to Learn!" : "Here for You!"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {getWelcomeMessage()}
                </p>
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
                      className={`max-w-[80%] p-4 rounded-2xl ${
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border glass p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                mode === "study" 
                  ? "Ask me anything you want to learn..." 
                  : "Share what's on your mind..."
              }
              className="h-12 rounded-xl glass border-border"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={isLoading || !input.trim()}
              className={`h-12 w-12 rounded-xl hover:opacity-90 glow-on-hover ${
                mode === "study"
                  ? "bg-gradient-to-br from-blue-500 to-purple-500"
                  : "bg-gradient-to-br from-pink-500 to-rose-500"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
