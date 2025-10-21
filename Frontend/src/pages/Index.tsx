import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Video, 
  BookOpen, 
  CheckSquare, 
  MessageSquare,
  ArrowRight, 
  Zap,
  Heart,
  GraduationCap,
  Sparkles,
  FileText,
  Users,
  Star,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Play,
  ChevronRight,
  Shield,
  Mic,
  Volume2,
  PenTool,
  Target,
  Moon,
  Sun,
  Rocket,
  BarChart3,
  Smile,
  Lightbulb,
  Code,
  Globe,
  Database,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or default to true
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  const [isScrolled, setIsScrolled] = useState(false);

  const backgroundY = useTransform(scrollY, [0, 1000], [0, 300]);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);


  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Theme toggle with localStorage persistence
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const mainFeatures = [
    {
      icon: MessageSquare,
      title: "AI Doubt Assistant",
      subtitle: "Two Intelligent Modes",
      description: "Get instant help with Study Mode for academic excellence, or switch to Friend Mode for emotional support and casual conversations.",
      gradient: "from-blue-500 via-cyan-500 to-blue-600",
      benefits: ["24/7 AI Assistance", "Voice Input Support", "Context-Aware Responses"],
      demoText: "Ask me anything - from calculus to career advice!",
      icon2: Heart,
    },
    {
      icon: Video,
      title: "Smart Tutorial Watch",
      subtitle: "Learn from YouTube Videos",
      description: "Watch educational videos while AI takes notes, answers questions in real-time, and generates interactive quizzes and visual mind maps.",
      gradient: "from-purple-500 via-pink-500 to-purple-600",
      benefits: ["AI-Powered Notes", "Auto-Generated Quizzes", "Visual Mind Maps"],
      demoText: "Paste any YouTube URL and start learning smarter!",
      icon2: Play,
    },
    {
      icon: BookOpen,
      title: "Smart Study Sessions",
      subtitle: "AI-Powered Learning",
      description: "Upload your study materials, syllabus, and past papers for detailed and focused exam preparation. Chat with AI about specific topics and get personalized quizzes based on your content to ace your exams.",
      gradient: "from-orange-500 via-red-500 to-orange-600",
      benefits: ["PDF Text Extraction", "Context-Aware Chat", "Custom Quizzes"],
      demoText: "Upload PDFs and get instant AI-powered insights!",
      icon2: FileText,
    },
    {
      icon: CheckSquare,
      title: "Smart To-Do Manager",
      subtitle: "Stay Organized",
      description: "Intelligent task management with AI-powered suggestions, priority detection, and smart organization to keep you productive.",
      gradient: "from-green-500 via-emerald-500 to-green-600",
      benefits: ["AI Suggestions", "Smart Prioritization", "Progress Tracking"],
      demoText: "Let AI help you organize your tasks efficiently!",
      icon2: Target,
    },
    {
      icon: Award,
      title: "Learning Analytics",
      subtitle: "Track Your Progress",
      description: "Comprehensive dashboard showing your study patterns, quiz performance, session history, and personalized insights for improvement.",
      gradient: "from-indigo-500 via-purple-500 to-indigo-600",
      benefits: ["Performance Metrics", "Study Patterns", "Improvement Tips"],
      demoText: "See your learning journey visualized beautifully!",
      icon2: TrendingUp,
    },
  ];

  const aiCapabilities = [
    { icon: Target, text: "Adaptive Learning", description: "AI adjusts to your pace" },
    { icon: BarChart3, text: "Progress Tracking", description: "See your growth daily" },
    { icon: Globe, text: "Always Available", description: "Learn anytime, anywhere" },
    { icon: PenTool, text: "Auto Note-Taking", description: "Notes made for you" },
    { icon: Brain, text: "Remembers Everything", description: "Never repeat yourself" },
    { icon: Lock, text: "Secure & Private", description: "Your data stays safe" },
  ];

  const testimonials = [
    {
      name: "Nidhi Nupur",
      role: "Engineering Student",
      avatar: "NN",
      rating: 5,
      text: "Medha.ai transformed my study routine! The AI assistant helped me ace my exams with personalized quizzes and instant doubt solving. It's like having a tutor available 24/7!",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Mamta Kumari",
      role: "Medical Student",
      avatar: "MK",
      rating: 5,
      text: "The tutorial watch feature is a game-changer. I can learn from YouTube videos while AI takes notes and creates mind maps automatically! Saved me hours of manual note-taking.",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Ashish Kumar",
      role: "Competitive Exam Prep",
      avatar: "AK",
      rating: 5,
      text: "Study sessions with uploaded materials made my preparation so much easier. The AI understands context and provides relevant answers instantly. My scores improved by 30%!",
      color: "from-orange-500 to-red-500",
    },
  ];


  const howItWorks = [
    {
      step: "1",
      title: "Sign Up Free",
      description: "Create your account in seconds. No credit card required.",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      step: "2",
      title: "Choose Your Mode",
      description: "Start with AI Assistant, Tutorial Watch, or Study Sessions.",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
    },
    {
      step: "3",
      title: "Learn & Grow",
      description: "Ask questions, upload content, and get personalized AI help.",
      icon: Sparkles,
      color: "from-orange-500 to-red-500",
    },
    {
      step: "4",
      title: "Track Progress",
      description: "Monitor your improvement with detailed analytics and insights.",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        
        {/* Floating Gradient Orbs with dynamic colors */}
        <motion.div
          animate={{
            x: mousePosition.x / 25,
            y: mousePosition.y / 25,
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            x: { type: "spring", damping: 30, stiffness: 150 },
            y: { type: "spring", damping: 30, stiffness: 150 },
            scale: { duration: 5, repeat: Infinity },
            opacity: { duration: 5, repeat: Infinity }
          }}
          className="absolute top-20 -left-20 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            x: -mousePosition.x / 35,
            y: -mousePosition.y / 35,
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            x: { type: "spring", damping: 30, stiffness: 100 },
            y: { type: "spring", damping: 30, stiffness: 100 },
            scale: { duration: 7, repeat: Infinity },
            opacity: { duration: 7, repeat: Infinity }
          }}
          className="absolute bottom-20 -right-20 w-[600px] h-[600px] bg-secondary/25 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: mousePosition.x / 40,
            y: -mousePosition.y / 40,
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            x: { type: "spring", damping: 40, stiffness: 120 },
            y: { type: "spring", damping: 40, stiffness: 120 },
            scale: { duration: 6, repeat: Infinity },
            opacity: { duration: 6, repeat: Infinity }
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Enhanced Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 backdrop-blur-xl transition-all duration-300 ${
          isScrolled 
            ? "glass-strong border-b border-border/50 shadow-lg" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-8 h-8 text-primary relative z-10" />
                </motion.div>
                <div className="absolute inset-0 blur-lg bg-primary/50 animate-pulse-slow" />
            </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Medha.ai
              </span>
            </motion.div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-full glass-strong border border-border/50 hover:border-primary/50 transition-all"
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div
                      key="moon"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5 text-primary" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sun"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5 text-orange-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="hover:bg-primary/10 hidden sm:flex"
              >
                Login
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-on-hover group" 
                onClick={() => navigate("/signup")}
              >
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 relative">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center relative z-10">
            {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong border border-primary/30 mb-8 group cursor-pointer hover:border-primary/50 transition-colors"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium">Advanced AI Technology • Trusted by 10,000+ Students</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.div>

            {/* Main Heading with animated text */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1]"
            >
              Your Personal AI
              <br />
              <motion.span 
                className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
              Study Companion
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Master any subject with <span className="text-primary font-semibold">AI-powered assistance</span>. 
              Get instant doubt solving, interactive tutorials, and personalized study sessions — all in one place.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Futuristic Transition Divider */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          {/* Animated Line with Pulse */}
          <div className="relative h-32 flex items-center justify-center">
            {/* Main Line */}
            <motion.div 
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            
            {/* Traveling Pulse */}
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
              animate={{
                x: ["-50vw", "50vw"],
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.5, 1.5, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 1
              }}
            />
            
            {/* Center Glow Effect */}
            <motion.div
              className="relative"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center relative z-10">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary blur-xl"
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
              {/* Orbiting Dots */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.25
                  }}
                  style={{
                    top: "50%",
                    left: "50%",
                    transformOrigin: `0 ${30 + i * 5}px`,
                  }}
                />
              ))}
            </motion.div>

            {/* Floating Particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/50"
                initial={{ opacity: 0, y: 50 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [50, -50],
                  x: [0, (Math.random() - 0.5) * 100]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
                style={{
                  left: `${10 + i * 7}%`,
                }}
              />
            ))}

            {/* Wavy Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 100" preserveAspectRatio="none">
              <motion.path
                d="M0,50 Q250,20 500,50 T1000,50"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="currentColor" className="text-primary" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* Features Showcase - Enhanced */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{
              duration: 8,
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
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-strong border border-secondary/30 mb-8 group hover:border-secondary/60 transition-all"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-5 h-5 text-secondary" />
              </motion.div>
              <span className="text-sm font-semibold">Powerful Features</span>
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            </motion.div>
            
            <motion.h2 
              className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Everything You Need to{" "}
              <motion.span 
                className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Excel
              </motion.span>
            </motion.h2>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Five powerful tools designed to make your learning journey{" "}
              <span className="text-primary font-semibold">effortless and effective</span>.
            </motion.p>

            {/* Decorative Elements */}
            <div className="relative mt-8 flex items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-12 h-1 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Interactive Features Grid */}
          <div className="space-y-32">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const Icon2 = feature.icon2;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 80 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center relative`}
                >
                  {/* Connecting Line */}
                  {index < mainFeatures.length - 1 && (
                    <motion.div
                      className={`absolute ${isEven ? 'left-1/2' : 'right-1/2'} bottom-0 w-px h-32 bg-gradient-to-b from-primary/50 to-transparent hidden lg:block`}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      style={{ transform: 'translateY(100%)' }}
                    />
                  )}

                  {/* Content Side */}
                  <motion.div 
                    className="flex-1 space-y-8 relative"
                    whileHover={{ x: isEven ? 10 : -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Number Badge */}
                    <motion.div
                      className="absolute -top-8 -left-4 w-20 h-20 rounded-full bg-gradient-to-br from-background to-muted border-2 border-primary/20 flex items-center justify-center font-bold text-3xl text-primary/50"
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      {index + 1}
                    </motion.div>

                    <div className="inline-flex items-center gap-4 group">
                      <motion.div 
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-2xl relative`}
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className="w-8 h-8 text-white relative z-10" />
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} blur-lg`}
                          animate={{
                            scale: [1, 1.3, 1],
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
                        <h3 className="text-3xl md:text-4xl font-bold group-hover:text-primary transition-colors">{feature.title}</h3>
                        <p className={`text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="space-y-4">
                      {feature.benefits.map((benefit, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.15 }}
                          whileHover={{ x: 10 }}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 transition-all group cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-foreground font-medium">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className="pt-4"
                    >
                      <Button
                        size="lg"
                        className={`bg-gradient-to-r ${feature.gradient} hover:opacity-90 group h-14 px-8 text-lg shadow-xl hover:shadow-2xl transition-all`}
                        onClick={() => navigate("/signup")}
                      >
                        <Rocket className="mr-2 w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        Try {feature.title}
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Visual Side */}
                  <motion.div 
                    className="flex-1 w-full"
                    whileHover={{ x: isEven ? -10 : 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.03, rotateY: isEven ? 5 : -5 }}
                      transition={{ duration: 0.4 }}
                      className="relative"
                    >
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity`} />
                      
                      <div className="glass-strong rounded-3xl p-8 border-2 border-border/50 transition-all relative overflow-hidden group hover:border-primary/50">
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                        
                        {/* Scan line effect */}
                        <motion.div
                          className="absolute inset-0 opacity-20"
                          animate={{
                            backgroundPosition: ["0% 0%", "100% 100%"]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          style={{
                            backgroundImage: "linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%)",
                            backgroundSize: "200% 200%"
                          }}
                        />
                        
                        <div className="relative z-10 space-y-6">
                          {/* Mock Interface */}
                          <div className="aspect-video bg-gradient-to-br from-background to-muted rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                            <motion.div 
                              className="relative z-10 text-center p-8"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.div
                                animate={{
                                  y: [0, -15, 0]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <Icon2 className="w-24 h-24 mx-auto mb-4 text-primary drop-shadow-lg" />
                              </motion.div>
                              <p className="text-base md:text-lg text-muted-foreground font-semibold">{feature.demoText}</p>
                            </motion.div>
                          </div>
                          
                          {/* Feature Indicator */}
                          <div className="flex items-center justify-between px-2">
                            <div className="flex gap-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div 
                                  key={i} 
                                  className={`h-2 rounded-full transition-all ${
                                    i === 0 ? `w-10 bg-gradient-to-r ${feature.gradient}` : 'w-2 bg-muted'
                                  }`}
                                  whileHover={{ scale: 1.2 }}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Interactive Demo
                            </span>
                          </div>
                        </div>

                        {/* Corner decorations */}
                        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                        <div className={`absolute bottom-4 left-4 w-3 h-3 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Futuristic AI Capabilities Showcase */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong border border-primary/30 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Powered by Advanced AI</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Experience the{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Future of Learning
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {aiCapabilities.map((capability, i) => {
              const Icon = capability.icon;
              const gradients = [
                "from-blue-500 to-cyan-500",
                "from-purple-500 to-pink-500",
                "from-orange-500 to-red-500",
                "from-green-500 to-emerald-500",
                "from-indigo-500 to-purple-500",
                "from-yellow-500 to-orange-500"
              ];
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    rotateY: 5,
                    z: 50
                  }}
                  className="relative group cursor-pointer"
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[i]} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                  
                  {/* Card */}
                  <div className="relative glass-strong rounded-3xl p-8 border border-border/50 group-hover:border-primary/50 transition-all backdrop-blur-2xl overflow-hidden h-full">
                    {/* Animated background gradient */}
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-br ${gradients[i]} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                    
                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {[...Array(5)].map((_, idx) => (
                        <motion.div
                          key={idx}
                          className={`absolute w-1 h-1 bg-gradient-to-r ${gradients[i]} rounded-full`}
                          animate={{
                            y: [0, -100],
                            x: [0, Math.random() * 30 - 15],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: Math.random() * 2 + 1,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "easeInOut"
                          }}
                          style={{
                            left: `${Math.random() * 100}%`,
                            bottom: 0,
                          }}
                        />
                      ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center h-full">
                      {/* Icon container with rotation effect */}
                      <motion.div
                        className="relative mb-6"
                        animate={{
                          y: [0, -10, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.2
                        }}
                      >
                        <motion.div
                          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradients[i]} flex items-center justify-center shadow-2xl relative`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Icon className="w-10 h-10 text-white relative z-10" />
                          {/* Pulsing glow */}
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-br ${gradients[i]} rounded-2xl blur-md`}
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
                        
                        {/* Orbiting ring */}
                        <motion.div
                          className={`absolute inset-0 border-2 border-primary/30 rounded-2xl`}
                          animate={{
                            rotate: 360,
                            scale: [1.2, 1.4, 1.2]
                          }}
                          transition={{
                            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                          }}
                        />
                      </motion.div>

                      {/* Text content */}
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {capability.text}
                      </h3>
                      <p className="text-base text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                        {capability.description}
                      </p>

                      {/* Bottom accent line */}
                      <motion.div
                        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[i]} opacity-0 group-hover:opacity-100 transition-opacity`}
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {/* Corner accent */}
                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r ${gradients[i]} opacity-50 group-hover:opacity-100 transition-opacity`} />
                    <div className={`absolute bottom-4 left-4 w-2 h-2 rounded-full bg-gradient-to-r ${gradients[i]} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Get Started in{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Minutes
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to transform your learning experience with AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative"
                >
                  {/* Connector Line */}
                  {i < howItWorks.length - 1 && (
                    <div className={`hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r ${step.color} opacity-30`} />
                  )}
                  
                  <div className="glass-strong rounded-3xl p-8 border border-border/50 hover:border-primary/50 transition-all relative z-10 h-full">
                    <motion.div 
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="text-2xl font-bold text-white">{step.step}</span>
                    </motion.div>
                    <Icon className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials with Carousel */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong border border-yellow-500/30 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">Loved by Students</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              What Our{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Students Say
              </span>
            </h2>
          </motion.div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className={`glass-strong rounded-3xl p-12 border border-border/50 hover:border-primary/50 transition-all relative overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[activeTestimonial].color} opacity-5`} />
                <div className="relative z-10">
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xl text-foreground mb-8 leading-relaxed">
                    "{testimonials[activeTestimonial].text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${testimonials[activeTestimonial].color} flex items-center justify-center text-white font-bold text-xl`}>
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{testimonials[activeTestimonial].name}</div>
                      <div className="text-sm text-muted-foreground">{testimonials[activeTestimonial].role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Controls */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeTestimonial ? 'w-8 bg-primary' : 'w-2 bg-muted'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Medha.ai
              </span>
            </div>
            
            <p className="text-muted-foreground text-sm">
              © 2025 Medha.ai. Empowering students with AI technology.
            </p>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary"
              onClick={() => navigate("/contact")}
            >
              Contact Us
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Made with <Heart className="w-4 h-4 inline text-red-500 fill-red-500" /> for students worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
