import { useState, useEffect, useRef } from "react";
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
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { todoService } from "@/services/todoService";
import MarkdownMessage from "@/components/MarkdownMessage";
import type { Todo, TodoStatus, ChatMessage } from "@/types/todo";

const TodoPage = () => {
  const { toast } = useToast();
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  
  // State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | TodoStatus>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Create todo form
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]); // Default to today in YYYY-MM-DD format

  // Edit todo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  // AI Chat helper
  const [showAIChat, setShowAIChat] = useState(false);
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Filter todos when filter changes
  useEffect(() => {
    filterTodos();
  }, [activeFilter, todos]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  const fetchTodos = async () => {
    setIsFetching(true);
    try {
      const response = await todoService.getMyTodos();
      setTodos(response.todos);
    } catch (error: any) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const filterTodos = () => {
    if (activeFilter === "all") {
      setFilteredTodos(todos);
    } else {
      setFilteredTodos(todos.filter((todo) => todo.status === activeFilter));
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

    setIsLoading(true);
    try {
      await todoService.createTodo({
        task: newTask,
        description: newDescription || undefined,
        date: newDate || undefined,
      });

      toast({
        title: "Todo Created",
        description: "Your task has been added successfully.",
      });

      setNewTask("");
      setNewDescription("");
      setNewDate(new Date().toISOString().split('T')[0]); // Reset to today
      setIsCreating(false);
      await fetchTodos();
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
    setIsLoading(true);
    try {
      await todoService.updateTodo({
        todo_id: todoId,
        task: editTask,
        description: editDescription || undefined,
        date: editDate || undefined,
      });

      toast({
        title: "Todo Updated",
        description: "Your task has been updated successfully.",
      });

      setEditingId(null);
      await fetchTodos();
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

      await fetchTodos();
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
      await fetchTodos();
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
    setEditDescription(todo.description || "");
    setEditDate(todo.date || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTask("");
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
      console.log("No chat history");
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

  // Date categorization helpers
  const getDateCategory = (dateString: string | undefined) => {
    if (!dateString) return "no_date";
    
    const todoDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    todoDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    if (todoDate < yesterday) return "overdue";
    if (todoDate.getTime() === yesterday.getTime()) return "yesterday";
    if (todoDate.getTime() === today.getTime()) return "today";
    if (todoDate.getTime() === tomorrow.getTime()) return "tomorrow";
    if (todoDate <= weekFromNow) return "this_week";
    return "later";
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "overdue": return "Overdue";
      case "yesterday": return "Yesterday";
      case "today": return "Today";
      case "tomorrow": return "Tomorrow";
      case "this_week": return "This Week";
      case "later": return "Later";
      case "no_date": return "No Due Date";
      default: return "Other";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "overdue": return <AlertCircle className="w-4 h-4" />;
      case "today": return <Clock className="w-4 h-4" />;
      case "tomorrow": return <CalendarIcon className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "overdue": return "text-red-500";
      case "today": return "text-blue-500";
      case "tomorrow": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const categorizeTodos = (todosList: Todo[]) => {
    const categories = {
      overdue: [] as Todo[],
      yesterday: [] as Todo[],
      today: [] as Todo[],
      tomorrow: [] as Todo[],
      this_week: [] as Todo[],
      later: [] as Todo[],
      no_date: [] as Todo[],
    };

    todosList.forEach((todo) => {
      const category = getDateCategory(todo.date);
      categories[category as keyof typeof categories].push(todo);
    });

    return categories;
  };

  const activeTodo = todos.find((t) => t.todo_id === activeTodoId);
  const categorizedTodos = categorizeTodos(filteredTodos);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 relative overflow-hidden">
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
          className="flex items-center justify-between"
        >
          <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Smart To-Do</h1>
            <p className="text-muted-foreground">Manage your tasks with AI assistance</p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
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
                    <Input
                      id="task"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Enter task name"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Add details about this task"
                      rows={3}
                      disabled={isLoading}
                    />
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

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="all">All ({todos.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({todos.filter((t) => t.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({todos.filter((t) => t.status === "in_progress").length})
              </TabsTrigger>
              <TabsTrigger value="done">
                Done ({todos.filter((t) => t.status === "done").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Todos List - Categorized by Date */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTodos.length > 0 ? (
            <div className="space-y-6">
              {(["overdue", "yesterday", "today", "tomorrow", "this_week", "later", "no_date"] as const).map((category) => {
                const categoryTodos = categorizedTodos[category];
                if (categoryTodos.length === 0) return null;

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-2 px-2">
                      <div className={getCategoryColor(category)}>
                        {getCategoryIcon(category)}
                      </div>
                      <h3 className={`font-semibold text-lg ${getCategoryColor(category)}`}>
                        {getCategoryTitle(category)}
                      </h3>
                      <Badge variant="secondary" className="ml-auto">
                        {categoryTodos.length}
                      </Badge>
                    </div>

                    {/* Category Todos */}
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {categoryTodos.map((todo, index) => (
                          <motion.div
                            key={todo.todo_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card
                              className={`glass border-border hover:border-primary/50 transition-all ${
                                todo.status === "done" ? "opacity-60" : ""
                              } ${category === "overdue" ? "border-red-500/30" : ""}`}
                            >
                      <CardContent className="p-4">
                        {editingId === todo.todo_id ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <Input
                              value={editTask}
                              onChange={(e) => setEditTask(e.target.value)}
                              className="font-medium"
                            />
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Description"
                              rows={2}
                            />
                            <div className="relative">
                              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <Input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateTodo(todo.todo_id)}
                                size="sm"
                                disabled={isLoading}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                              <Button onClick={cancelEdit} size="sm" variant="outline">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getStatusIcon(todo.status)}
                                  <h3
                                    className={`font-medium ${
                                      todo.status === "done" ? "line-through" : ""
                                    }`}
                                  >
                                    {todo.task}
                                  </h3>
                                </div>
                                {todo.description && (
                                  <p className="text-sm text-muted-foreground">{todo.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="outline" className={getStatusColor(todo.status)}>
                                    {todo.status.replace("_", " ")}
                                  </Badge>
                                  {todo.date && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <CalendarIcon className="w-3 h-3" />
                                      {formatDate(todo.date)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => openAIChat(todo.todo_id)}
                                  size="icon"
                                  variant="ghost"
                                  title="Get AI help"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                      <Button
                                  onClick={() => startEdit(todo)}
                                  size="icon"
                        variant="ghost"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => deleteTodo(todo.todo_id)}
                        size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                            </div>
                            {todo.status !== "done" && (
                              <div className="flex gap-2">
                                {todo.status === "pending" && (
                                  <Button
                                    onClick={() => changeStatus(todo.todo_id, "in_progress")}
                                    size="sm"
                                    variant="outline"
                                  >
                                    Start Progress
                                  </Button>
                                )}
                                <Button
                                  onClick={() => changeStatus(todo.todo_id, "done")}
                                  size="sm"
                                  variant="outline"
                                  className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Mark as Done
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="glass border-border">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeFilter === "all"
                    ? "Start by creating your first task!"
                    : `No ${activeFilter.replace("_", " ")} tasks`}
                </p>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
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
            className="fixed bottom-6 right-6 w-96 h-[500px] glass rounded-2xl border border-border shadow-2xl flex flex-col z-50"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
