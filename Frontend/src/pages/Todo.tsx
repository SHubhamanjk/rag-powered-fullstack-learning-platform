import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  MessageCircle,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Save,
  Search,
  Filter,
  Wand2,
  Sparkles,
  Mic,
  MicOff,
} from "lucide-react";
import { DailyThemedClock } from "@/components/DailyThemedClock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { todoService } from "@/services/todoService";
import utilityService from "@/services/utilityService";
import MarkdownMessage from "@/components/MarkdownMessage";
import type { Todo, TodoStatus, ChatMessage } from "@/types/todo";
import quotesData from "@/data/quotes.json";

// Get daily quote based on current date
const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % quotesData.quotes.length;
  return quotesData.quotes[index];
};

const TodoPage = () => {
  const { toast } = useToast();
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice input for new task description
  const { isRecording: isRecordingNewDesc, isTranscribing: isTranscribingNewDesc, startRecording: startRecordingNewDesc, stopRecording: stopRecordingNewDesc } = useVoiceInput({
    onTranscriptionComplete: (text) => {
      setNewDescription(text); // Set transcribed text in new description field
    },
  });

  // Voice input for edit task description
  const { isRecording: isRecordingEditDesc, isTranscribing: isTranscribingEditDesc, startRecording: startRecordingEditDesc, stopRecording: stopRecordingEditDesc } = useVoiceInput({
    onTranscriptionComplete: (text) => {
      setEditDescription(text); // Set transcribed text in edit description field
    },
  });
  
  // Get daily quote (memoized)
  const dailyQuote = getDailyQuote();
  
  // Current time for the clock
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [activeFilter, setActiveFilter] = useState<TodoStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(""); // For mobile/tablet category navigation

  // Create todo form
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [customNewCategory, setCustomNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]); // Default to today in YYYY-MM-DD format
  const [isRewritingNewTask, setIsRewritingNewTask] = useState(false);
  const [isRewritingNewDesc, setIsRewritingNewDesc] = useState(false);

  // Edit todo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [customEditCategory, setCustomEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [isRewritingEditTask, setIsRewritingEditTask] = useState(false);
  const [isRewritingEditDesc, setIsRewritingEditDesc] = useState(false);

  // AI Chat helper
  const [showAIChat, setShowAIChat] = useState(false);
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodos = async () => {
    setIsFetching(true);
    try {
      const response = await todoService.getMyTodos();
      setTodos(response.todos);
    } catch (error: any) {
      // Error fetching todos
    } finally {
      setIsFetching(false);
    }
  };

  // Extract unique categories from all todos
  const getUniqueCategories = useCallback(() => {
    const categories = new Set<string>();
    todos.forEach((todo) => {
      if (todo.category) {
        categories.add(todo.category);
      }
    });
    return Array.from(categories).sort();
  }, [todos]);

  // Check if a todo matches the date filter
  const matchesDateFilter = useCallback((todoDate: string) => {
    if (dateFilter === "all") return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todo = new Date(todoDate);
    todo.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (dateFilter) {
      case "yesterday":
        return todo.getTime() === yesterday.getTime();
      case "today":
        return todo.getTime() === today.getTime();
      case "tomorrow":
        return todo.getTime() === tomorrow.getTime();
      case "this_week":
        return todo >= today && todo <= weekFromNow;
      default:
        return true;
    }
  }, [dateFilter]);

  const filterTodos = useCallback(() => {
    let filtered = todos.filter((todo) => todo.status === activeFilter);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((todo) => 
        todo.task.toLowerCase().includes(query) || 
        (todo.description && todo.description.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((todo) => 
        selectedCategories.includes(todo.category)
      );
    }

    // Apply date filter
    if (dateFilter !== "all") {
      filtered = filtered.filter((todo) => 
        todo.date && matchesDateFilter(todo.date)
      );
    }
    
    setFilteredTodos(filtered);
  }, [todos, activeFilter, searchQuery, selectedCategories, dateFilter, matchesDateFilter]);

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Filter todos when filter or search changes
  useEffect(() => {
    filterTodos();
  }, [filterTodos]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('category-filter-dropdown');
      const button = document.getElementById('category-filter-button');
      if (dropdown && button && !dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
        dropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rewriteText = async (
    text: string,
    setText: (value: string) => void,
    setIsRewriting: (value: boolean) => void,
    context: 'todo' | 'message' = 'todo',
    additionalContext?: string
  ) => {
    if (!text.trim()) {
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
        text,
        context,
        additional_context: additionalContext
      });

      if (response.improvement_applied) {
        setText(response.rewritten_text);
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

  const createTodo = async () => {
    if (!newTask.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task",
        variant: "destructive",
      });
      return;
    }

    // Use custom category if "custom" is selected, otherwise use selected category
    const categoryToUse = newCategory === "custom" ? customNewCategory.trim() : newCategory;

    if (!categoryToUse) {
      toast({
        title: "Error",
        description: "Please select or enter a category",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await todoService.createTodo({
        task: newTask,
        category: categoryToUse,
        description: newDescription || undefined,
        date: newDate || undefined,
      });

      toast({
        title: "Todo Created",
        description: "Your task has been added successfully.",
      });

      setNewTask("");
      setNewCategory("");
      setCustomNewCategory("");
      setNewDescription("");
      setNewDate(new Date().toISOString().split('T')[0]); // Reset to today
      setIsCreating(false);
      await fetchTodos(); // Instant refresh
    } catch (error: any) {
      toast({
        title: "Failed to Create Todo",
        description: error.message || "Could not create todo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTodo = async (todoId: string) => {
    // Use custom category if "custom" is selected, otherwise use selected category
    const categoryToUse = editCategory === "custom" ? customEditCategory.trim() : editCategory;

    setIsLoading(true);
    try {
      await todoService.updateTodo({
        todo_id: todoId,
        task: editTask,
        category: categoryToUse,
        description: editDescription || undefined,
        date: editDate || undefined,
      });

      toast({
        title: "Todo Updated",
        description: "Your task has been updated successfully.",
      });

      setEditingId(null);
      await fetchTodos(); // Instant refresh
    } catch (error: any) {
      toast({
        title: "Failed to Update Todo",
        description: error.message || "Could not update todo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changeStatus = async (todoId: string, newStatus: TodoStatus) => {
    try {
      await todoService.updateTodo({
        todo_id: todoId,
        status: newStatus,
      });

      if (newStatus === "done") {
        toast({
          title: "Task Completed! 🎉",
          description: "Great job on finishing this task!",
        });
      }

      await fetchTodos(); // Instant refresh
    } catch (error: any) {
      toast({
        title: "Failed to Update Status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      await todoService.deleteTodo(todoId);
      toast({
        title: "Todo Deleted",
        description: "Your task has been removed.",
      });
      await fetchTodos(); // Instant refresh
    } catch (error: any) {
      toast({
        title: "Failed to Delete Todo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.todo_id);
    setEditTask(todo.task);
    setEditCategory(todo.category);
    setEditDescription(todo.description || "");
    setEditDate(todo.date || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTask("");
    setEditCategory("");
    setCustomEditCategory("");
    setEditDescription("");
    setEditDate("");
  };

  // AI Chat functions
  const openAIChat = async (todoId: string) => {
    setActiveTodoId(todoId);
    setShowAIChat(true);
    setChatMessages([]);

    // Load chat history
    try {
      const history = await todoService.getChatHistory(todoId);
      setChatMessages(history.chat_history);
    } catch (error) {
      // No history yet, start fresh
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !activeTodoId) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await todoService.getTodoHelp({
        todo_id: activeTodoId,
        question: userMessage.content,
      });

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      toast({
        title: "Failed to Get Help",
        description: error.message,
        variant: "destructive",
      });
      // Remove user message on error
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case "done":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get date label for a todo
  const getDateLabel = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todoDate = new Date(dateString);
    todoDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    if (todoDate.getTime() === yesterday.getTime()) return "Yesterday";
    if (todoDate.getTime() === today.getTime()) return "Today";
    if (todoDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    if (todoDate >= today && todoDate <= weekFromNow) return "This Week";
    if (todoDate < yesterday) return "Overdue";
    return "Later";
  };

  // Get color for date label
  const getDateLabelColor = (label: string) => {
    switch (label) {
      case "Overdue":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      case "Yesterday":
        return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      case "Today":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "Tomorrow":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "This Week":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  // Group todos by category and sort by date (most recent first)
  const groupTodosByCategory = (todosList: Todo[]) => {
    const grouped: { [key: string]: Todo[] } = {};
    
    todosList.forEach((todo) => {
      const category = todo.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(todo);
    });
    
    // Sort todos within each category by date (most recent/closest first)
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => {
        // If both have dates, compare them
        if (a.date && b.date) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        // Todos without dates go to the end
        if (!a.date) return 1;
        if (!b.date) return -1;
        return 0;
      });
    });
    
    return grouped;
  };

  const activeTodo = todos.find((t) => t.todo_id === activeTodoId);
  const categorizedTodos = groupTodosByCategory(filteredTodos);
  const uniqueCategories = getUniqueCategories();
  const visibleCategoryCount = Object.keys(categorizedTodos).length;
  
  // Set initial active category tab when categories change
  useEffect(() => {
    const categories = Object.keys(categorizedTodos);
    if (categories.length > 0 && !categories.includes(activeCategoryTab)) {
      setActiveCategoryTab(categories[0]);
    }
  }, [categorizedTodos, activeCategoryTab]);
  
  // Calculate column width based on number of visible categories
  const getColumnWidth = () => {
    if (visibleCategoryCount === 1) return "w-full max-w-2xl mx-auto";
    if (visibleCategoryCount === 2) return "w-full sm:w-[calc(50%-0.5rem)] md:w-[450px]";
    return "w-full sm:w-[340px] md:w-[380px] lg:w-[420px] xl:w-[450px]";
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 relative overflow-hidden">
      {/* Futuristic Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
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
            className="absolute w-1 h-1 rounded-full bg-green-500/40"
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

      <div className="container max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">Smart To-Do</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Get things done faster with AI-powered task management</p>
            </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full sm:w-auto"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </motion.div>

        {/* Daily Motivational Quote - "Aaj ka gyan" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-primary/30 bg-gradient-to-br from-purple-500/5 via-primary/5 to-secondary/5 overflow-hidden relative">
            {/* Background mystical effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]"></div>
            
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Quote content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>आज का ज्ञान</span>
                    <span className="text-2xl">✨</span>
                  </h3>
                  
                  <div className="relative pl-3 sm:pl-4 border-l-4 border-gradient-to-b from-primary to-secondary">
                    <p className="text-sm sm:text-base text-foreground leading-relaxed mb-3 font-medium">
                      "{dailyQuote.text}"
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground italic flex items-center gap-2">
                      <span className="w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></span>
                      <span>{dailyQuote.author}</span>
                    </p>
                  </div>
                </div>

                {/* Daily Themed Clock - Changes each day */}
                <DailyThemedClock currentTime={currentTime} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Todo Modal */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !isLoading && setIsCreating(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md glass rounded-2xl p-6 border border-border"
              >
                <h2 className="text-xl font-bold mb-4">Create New Task</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="task">Task *</Label>
                    <div className="relative">
                      <Input
                        id="task"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Enter task name"
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        onClick={() => rewriteText(
                          newTask, 
                          setNewTask, 
                          setIsRewritingNewTask, 
                          'todo',
                          `Task Title Context`
                        )}
                        disabled={isRewritingNewTask || !newTask.trim()}
                        size="icon"
                        variant="ghost"
                        className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 hover:bg-primary/20"
                        title="Enhance with AI"
                      >
                        {isRewritingNewTask ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Wand2 className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newCategory} onValueChange={setNewCategory} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or create category" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">+ Add New Category</SelectItem>
                      </SelectContent>
                    </Select>
                    {newCategory === "custom" && (
                      <Input
                        value={customNewCategory}
                        onChange={(e) => setCustomNewCategory(e.target.value)}
                        placeholder="Enter new category name"
                        disabled={isLoading}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <div className="relative">
                      <Textarea
                        id="description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder={
                          isRecordingNewDesc
                            ? "Recording... Click stop when done"
                            : isTranscribingNewDesc
                            ? "Transcribing audio..."
                            : "Add details about this task"
                        }
                        rows={3}
                        disabled={isLoading || isRecordingNewDesc || isTranscribingNewDesc}
                        className="pr-20 scrollbar-hide"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          onClick={isRecordingNewDesc ? stopRecordingNewDesc : startRecordingNewDesc}
                          disabled={isRewritingNewDesc || isTranscribingNewDesc || isLoading}
                          size="icon"
                          variant="ghost"
                          className={`h-8 w-8 ${
                            isRecordingNewDesc
                              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                              : "hover:bg-primary/20"
                          }`}
                          title={isRecordingNewDesc ? "Stop recording" : "Record voice"}
                        >
                          {isTranscribingNewDesc ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : isRecordingNewDesc ? (
                            <MicOff className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4 text-primary" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            const contextInfo = `Task: ${newTask || 'New Task'}`;
                            rewriteText(newDescription, setNewDescription, setIsRewritingNewDesc, 'todo', contextInfo);
                          }}
                          disabled={isRewritingNewDesc || !newDescription.trim() || isRecordingNewDesc || isTranscribingNewDesc}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-primary/20"
                          title="Enhance with AI"
                        >
                          {isRewritingNewDesc ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <Wand2 className="w-4 h-4 text-primary" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Due Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={createTodo}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
                    </Button>
                    <Button
                      onClick={() => setIsCreating(false)}
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

        {/* Filter Tabs and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 sm:space-y-4"
        >
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as TodoStatus)}>
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="pending" className="text-xs sm:text-sm py-2">
                Pending ({todos.filter((t) => t.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs sm:text-sm py-2">
                In Progress ({todos.filter((t) => t.status === "in_progress").length})
              </TabsTrigger>
              <TabsTrigger value="done" className="text-xs sm:text-sm py-2">
                Done ({todos.filter((t) => t.status === "done").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Filters Row */}
          <div className="flex flex-row flex-wrap gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search todos..."
                className="pl-10 glass text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-auto sm:w-[180px] glass h-9 sm:h-10 text-sm sm:text-base shrink-0">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter - Desktop Only */}
            <div className="relative w-auto shrink-0 hidden lg:block">
              <Button
                id="category-filter-button"
                variant="outline"
                size="sm"
                className="glass w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
                onClick={() => {
                  // Toggle dropdown
                  const dropdown = document.getElementById('category-filter-dropdown');
                  if (dropdown) {
                    dropdown.classList.toggle('hidden');
                  }
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
              </Button>
              <div
                id="category-filter-dropdown"
                className="hidden absolute right-0 mt-2 w-56 glass rounded-lg border border-border shadow-lg z-10 p-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-medium">Filter by Category</span>
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategories([])}
                        className="h-6 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="border-t border-border my-1" />
                  {uniqueCategories.length > 0 ? (
                    uniqueCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/10 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{category}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {todos.filter(t => t.category === category && t.status === activeFilter).length}
                        </Badge>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground px-2 py-2">No categories yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategories.length > 0 || dateFilter !== "all") && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {selectedCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleCategory(cat)}
                >
                  {cat} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {dateFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => setDateFilter("all")}
                >
                  {dateFilter === "this_week" ? "This Week" : dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* Todos List - Grouped by Category in Columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pb-4 space-y-4"
        >
          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTodos.length > 0 ? (
            <>
              {/* Category Tabs - Mobile/Tablet Only */}
              {Object.keys(categorizedTodos).length > 1 && (
                <div className="lg:hidden">
                  <Tabs value={activeCategoryTab} onValueChange={setActiveCategoryTab}>
                    <TabsList className="w-full h-auto flex-wrap justify-start p-1 gap-1">
                      {Object.keys(categorizedTodos).map((category) => (
                        <TabsTrigger 
                          key={category} 
                          value={category}
                          className="text-xs sm:text-sm py-2 px-3"
                        >
                          {category} ({categorizedTodos[category].length})
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Category Columns */}
              <div className="flex flex-col lg:flex-row gap-4 lg:overflow-x-auto lg:pb-4 scrollbar-hide">
                {Object.entries(categorizedTodos).map(([category, categoryTodos]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`w-full lg:flex-shrink-0 lg:w-auto ${
                    category === activeCategoryTab ? 'block' : 'hidden lg:block'
                  }`}
                >
                  {/* Category Column */}
                  <Card className="glass border-border h-full flex flex-col lg:min-w-[380px] lg:max-w-[450px]">
                    {/* Category Header */}
                    <CardHeader className="py-3 px-3 sm:px-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-primary">
                          {category}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {categoryTodos.length}
                        </Badge>
                      </div>
                    </CardHeader>

                    {/* Category Todos */}
                    <CardContent className="p-2 sm:p-3 flex-1 overflow-y-auto lg:max-h-[calc(100vh-18rem)] scrollbar-hide">
                      <div className="space-y-2.5">
                        <AnimatePresence mode="popLayout">
                          {categoryTodos.map((todo, index) => (
                            <motion.div
                              key={todo.todo_id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.03 }}
                              className={`p-3 rounded-lg border ${
                                todo.status === "done" ? "opacity-60 border-border/50" : "border-border hover:border-primary/50"
                              } transition-all bg-background/50`}
                            >
                        {editingId === todo.todo_id ? (
                          // Edit Mode
                          <div className="space-y-2">
                            <Input
                              value={editTask}
                              onChange={(e) => setEditTask(e.target.value)}
                              placeholder="Task"
                              className="font-medium text-sm h-9"
                            />
                            <Select value={editCategory} onValueChange={setEditCategory}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {uniqueCategories.map((cat) => (
                                  <SelectItem key={cat} value={cat} className="text-sm">
                                    {cat}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom" className="text-sm">+ Add New Category</SelectItem>
                              </SelectContent>
                            </Select>
                            {editCategory === "custom" && (
                              <Input
                                value={customEditCategory}
                                onChange={(e) => setCustomEditCategory(e.target.value)}
                                placeholder="Enter new category name"
                                className="text-sm h-9"
                              />
                            )}
                            <div className="relative">
                              <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder={
                                  isRecordingEditDesc
                                    ? "Recording... Click stop when done"
                                    : isTranscribingEditDesc
                                    ? "Transcribing audio..."
                                    : "Description"
                                }
                                rows={2}
                                className="text-sm resize-none pr-10 scrollbar-hide"
                                disabled={isRecordingEditDesc || isTranscribingEditDesc}
                              />
                              <Button
                                type="button"
                                onClick={isRecordingEditDesc ? stopRecordingEditDesc : startRecordingEditDesc}
                                disabled={isTranscribingEditDesc || isLoading}
                                size="icon"
                                variant="ghost"
                                className={`absolute top-1 right-1 h-7 w-7 ${
                                  isRecordingEditDesc
                                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                                    : "hover:bg-primary/20"
                                }`}
                                title={isRecordingEditDesc ? "Stop recording" : "Record voice"}
                              >
                                {isTranscribingEditDesc ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                ) : isRecordingEditDesc ? (
                                  <MicOff className="w-3 h-3" />
                                ) : (
                                  <Mic className="w-3 h-3 text-primary" />
                                )}
                              </Button>
                            </div>
                            <div className="relative">
                              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                              <Input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="pl-9 text-sm h-9"
                              />
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                onClick={() => updateTodo(todo.todo_id)}
                                size="sm"
                                disabled={isLoading}
                                className="h-8 text-xs"
                              >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                Save
                              </Button>
                              <Button onClick={cancelEdit} size="sm" variant="outline" className="h-8 text-xs">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <button
                                    onClick={() => {
                                      if (todo.status !== "done") {
                                        changeStatus(todo.todo_id, "done");
                                      }
                                    }}
                                    className={`${
                                      todo.status !== "done" ? "cursor-pointer hover:scale-110" : "cursor-default"
                                    } transition-transform`}
                                    title={todo.status !== "done" ? "Mark as done" : ""}
                                    disabled={todo.status === "done"}
                                  >
                                    {getStatusIcon(todo.status)}
                                  </button>
                                  <h3
                                    className={`font-medium text-sm ${
                                      todo.status === "done" ? "line-through" : ""
                                    }`}
                                  >
                                    {todo.task}
                                  </h3>
                                </div>
                                {todo.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{todo.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getStatusColor(todo.status)}`}>
                                    {todo.status.replace("_", " ")}
                                  </Badge>
                                  {todo.date && (
                                    <>
                                      {/* Only show date label if not "Overdue" when status is done */}
                                      {!(todo.status === "done" && getDateLabel(todo.date) === "Overdue") && (
                                        <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getDateLabelColor(getDateLabel(todo.date))}`}>
                                          {getDateLabel(todo.date)}
                                        </Badge>
                                      )}
                                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                        <CalendarIcon className="w-2.5 h-2.5" />
                                        {formatDate(todo.date)}
                                      </div>
                                    </>
                                  )}
                                  {!todo.date && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-muted/50 text-muted-foreground border-border">
                                      No Date
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <Button
                                  onClick={() => openAIChat(todo.todo_id)}
                                  size="icon"
                                  variant="ghost"
                                  title="Get AI help"
                                  className="h-7 w-7"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  onClick={() => startEdit(todo)}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  onClick={() => deleteTodo(todo.todo_id)}
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive h-7 w-7"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            {todo.status !== "done" && (
                              <div className="flex gap-1.5">
                                {todo.status === "pending" && (
                                  <Button
                                    onClick={() => changeStatus(todo.todo_id, "in_progress")}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                  >
                                    Start Progress
                                  </Button>
                                )}
                                <Button
                                  onClick={() => changeStatus(todo.todo_id, "done")}
                                  size="sm"
                                  variant="outline"
                                  className="border-green-500/30 text-green-500 hover:bg-green-500/10 h-7 text-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Mark as Done
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
            </>
          ) : (
            <Card className="glass border-border">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{activeFilter === "done" ? "🎉 All caught up!" : "Ready to get started?"}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery.trim() 
                    ? "No tasks match your search. Try different keywords!" 
                    : activeFilter === "done" 
                    ? "You haven't completed any tasks yet. Keep going!" 
                    : "Create your first task and let AI help you accomplish it!"}
                </p>
                {!searchQuery.trim() && (
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                )}
            </CardContent>
          </Card>
          )}
        </motion.div>
      </div>

      {/* Floating AI Chat */}
      <AnimatePresence>
        {showAIChat && activeTodo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 h-[500px] max-h-[80vh] glass rounded-2xl border border-border shadow-2xl flex flex-col z-50"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">AI Assistant</h3>
                <p className="text-xs text-muted-foreground truncate">{activeTodo.task}</p>
              </div>
              <Button
                onClick={() => setShowAIChat(false)}
                size="icon"
                variant="ghost"
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ask me anything about this task!</p>
                  <p className="text-xs mt-1">I can help you break it down, provide guidance, or answer questions.</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
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
              
              {/* Scroll anchor */}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                  placeholder="Ask for help..."
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TodoPage;
