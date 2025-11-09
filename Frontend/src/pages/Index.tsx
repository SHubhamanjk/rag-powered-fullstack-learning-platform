import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Award,
  Play,
  ChevronRight,
  Target,
  Moon,
  Sun,
  Rocket,
  BarChart3,
  Lightbulb,
  Globe,
  Lock,
  Coffee,
  Headphones,
  X,
  ExternalLink,
  Puzzle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<typeof mainFeatures[0] | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<typeof aiCapabilities[0] | null>(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  const backgroundY = useTransform(scrollY, [0, 1000], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      title: "Study Buddy 24/7",
      subtitle: "AI That Gets You",
      description: "Homework stress? Exam prep panic? Chat with your AI buddy anytime for instant help, smart tips, or just some study vibes.",
      gradient: "from-blue-500 via-blue-600 to-cyan-500",
      iconBg: "from-blue-500/20 to-cyan-500/20",
      benefits: ["Always Online", "Voice & Text Chat", "Remembers Everything"],
    },
    {
      icon: Video,
      title: "Smart Video Notes",
      subtitle: "Notes? Handled.",
      description: "Binge your study videos without the hassle. AI grabs key points, makes detailed notes, quizzes you, and even drops visual mind maps while you watch.",
      gradient: "from-purple-500 via-purple-600 to-pink-500",
      iconBg: "from-purple-500/20 to-pink-500/20",
      benefits: ["Instant Doubt Help", "Auto Quizzes", "Visual Mind Maps"],
    },
    {
      icon: BookOpen,
      title: "Tailored Study Coach",
      subtitle: "Your Personal AI Coach",
      description: "Upload any notes, books, or past papers. AI breaks it down, gives detailed explanations, and creates tailored practice sessions just for you.",
      gradient: "from-orange-500 via-orange-600 to-red-500",
      iconBg: "from-orange-500/20 to-red-500/20",
      benefits: ["Reads All Your Stuff", "Detailed Answers", "Custom Practice"],
    },
    {
      icon: CheckSquare,
      title: "Never Miss Tasks",
      subtitle: "Smart AI To-Do",
      description: "Deadlines stacking up? AI slices big tasks, sets reminders, and prioritizes your schedule so you stay chill and on track.",
      gradient: "from-green-500 via-green-600 to-emerald-500",
      iconBg: "from-green-500/20 to-emerald-500/20",
      benefits: ["Smart Task Breakdown", "Auto-Prioritization", "Reminders That Work"],
    },
    {
      icon: Award,
      title: "Track Your Growth",
      subtitle: "Track & Level Up",
      description: "Watch your progress glow! Dashboard shows study time, mastered topics, and what to focus on next—study smarter, celebrate wins faster.",
      gradient: "from-indigo-500 via-indigo-600 to-purple-500",
      iconBg: "from-indigo-500/20 to-purple-500/20",
      benefits: ["Progress at a Glance", "Focus Where It Counts", "Celebrate Wins"],
    },
    {
      icon: Brain,
      title: "Smart Memory Vault",
      subtitle: "Your Personal Brain Backup",
      description: "Save notes, ideas, files, and passwords. Ask AI anytime to fetch anything instantly—your digital brain that actually gets you.",
      gradient: "from-cyan-500 via-teal-600 to-blue-500",
      iconBg: "from-cyan-500/20 to-blue-500/20",
      benefits: ["Instant Access", "Secure Storage", "Voice Retrieval"],
    },
  ];
  
  
  const aiCapabilities = [
    { icon: Target, text: "Adaptive Learning", description: "AI adjusts to your learning pace and style" },
    { icon: BarChart3, text: "Progress Tracking", description: "See your growth with detailed analytics" },
    { icon: Globe, text: "Always Available", description: "Learn anytime, anywhere you want" },
    { icon: Lightbulb, text: "Smart Insights", description: "Get personalized study recommendations" },
    { icon: Brain, text: "Contextual Memory", description: "AI remembers your learning journey" },
    { icon: Lock, text: "Secure & Private", description: "Your data is encrypted and protected" },
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
    {
      name: "Pranav Pratyush",
      role: "Engineering Student",
      avatar: "PP",
      rating: 5,
      text: "The AI-powered todo management and study planning features helped me organize my projects and assignments efficiently. I never miss deadlines anymore!",
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Lucy Kumari",
      role: "Medical Student",
      avatar: "LK",
      rating: 5,
      text: "Perfect for medical studies! The AI remembers all my previous questions and provides contextual answers. It's like having a study partner who never forgets anything.",
      color: "from-indigo-500 to-purple-500",
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
      description: "Start with AI Assistant, Tutorials, or Study Sessions.",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
    },
    {
      step: "3",
      title: "Learn & Grow",
      description: "Get personalized AI help and track your progress.",
      icon: Sparkles,
      color: "from-orange-500 to-red-500",
    },
    {
      step: "4",
      title: "Excel in Exams",
      description: "Use AI-generated quizzes and insights to succeed.",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"
        />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "backdrop-blur-2xl bg-background/80 border-b border-border/50 shadow-lg" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-8 h-8">
                <img src="/logo.png" alt="Medha.ai Logo" className="w-full h-full object-contain" />
                <div className="absolute inset-0 blur-md bg-primary/30 animate-pulse-slow" />
            </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Medha.ai
              </span>
            </motion.div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 rounded-xl glass-strong border border-border/50 hover:border-primary/50 transition-all"
              >
                  {isDarkMode ? (
                      <Moon className="w-5 h-5 text-primary" />
                ) : (
                      <Sun className="w-5 h-5 text-orange-500" />
                  )}
              </motion.button>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="hover:bg-primary/10 hidden sm:flex"
              >
                Login
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/25" 
                onClick={() => navigate("/signup")}
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Enhanced */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 relative">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            style={{ opacity }}
            className="text-center relative z-10"
            >
              <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full glass-strong border border-primary/30 mb-6 sm:mb-8 shadow-lg shadow-primary/10"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-semibold">Powered by Advanced AI Technology</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-[1.1]"
            >
              Study Smarter with
              <br />
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  AI-Powered Learning
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed px-4"
            >
              Transform your learning experience with AI-powered doubt solving, 
              <span className="text-primary font-semibold"> interactive tutorials</span>, and 
              <span className="text-secondary font-semibold"> personalized study sessions</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mx-auto mb-10 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-center shadow-lg shadow-primary/10 sm:flex-row sm:justify-between sm:text-left"
            >
              <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-primary">
                <Puzzle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Medha.ai Browser Extension is live on Microsoft Edge!</span>
              </div>
              <Button
                asChild
                size="sm"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <a
                  href="https://microsoftedge.microsoft.com/addons/detail/medhaai-tutorial-suppo/jmhcckcdckmhhfiloichlhbaineimbam"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add to Microsoft Edge
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12"
            >
              <Button 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-10 sm:h-12 md:h-14 px-6 sm:px-8 md:px-10 text-sm sm:text-base md:text-lg shadow-2xl shadow-primary/30 group"
                onClick={() => navigate("/signup")}
              >
                <Rocket className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-1 transition-transform" />
                Start Learning Free
                <ArrowRight className="ml-1.5 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                className="h-10 sm:h-12 md:h-14 px-6 sm:px-8 md:px-10 text-sm sm:text-base md:text-lg glass-strong border-border/50 hover:border-primary/50"
                onClick={() => navigate("/login")}
              >
                <Play className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Floating Decorative Elements */}
            <div className="relative h-32 mt-8">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-primary/30"
                  animate={{
                    y: [0, -40, 0],
                    x: [0, Math.random() * 40 - 20, 0],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: `${10 + i * 12}%`,
                    top: '50%',
                  }}
                />
              ))}
              
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-secondary/30" />
          </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Futuristic Transition Divider */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
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
            </motion.div>

            {/* Floating Particles */}
            {[...Array(8)].map((_, i) => (
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
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
                style={{
                  left: `${10 + i * 12}%`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-12 md:py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full glass-strong border border-secondary/30 mb-4 md:mb-6 shadow-lg">
                <Zap className="w-4 md:w-5 h-4 md:h-5 text-secondary" />
              <span className="text-xs md:text-sm font-semibold">Powerful Features</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 px-2">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Excel
              </span>
            </h2>
            
            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
              Six powerful AI-driven tools designed to revolutionize your learning journey
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 mb-3 md:mb-8">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedFeature(feature)}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl md:rounded-3xl blur-xl" 
                    style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
                  
                  <div className="relative glass-strong rounded-2xl md:rounded-3xl p-3 md:p-8 border border-border/50 group-hover:border-primary/50 transition-all h-full overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row items-start gap-2 md:gap-4 mb-2 md:mb-4">
                        <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          <Icon className="w-5 h-5 md:w-8 md:h-8 text-white" />
                        </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-2xl font-bold mb-0.5 md:mb-1 group-hover:text-primary transition-colors line-clamp-2">{feature.title}</h3>
                        <p className={`text-[8px] sm:text-[9px] md:text-xs lg:text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent whitespace-nowrap`}>
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>
                    
                      <p className="text-muted-foreground mb-2 md:mb-6 leading-relaxed text-xs md:text-base hidden md:block">
                      {feature.description}
                    </p>

                      <div className="space-y-1.5 md:space-y-3 hidden md:block">
                      {feature.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2 md:gap-3">
                            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0`}>
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                            <span className="text-xs md:text-sm text-muted-foreground">{benefit}</span>
                          </div>
                      ))}
                    </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 md:mt-6 group/btn hover:bg-primary/10 text-xs md:text-sm hidden md:flex"
                        onClick={() => navigate("/signup")}
                      >
                        Learn More
                        <ArrowRight className="ml-2 w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                    </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Detail Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFeature(null)}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 md:p-10 border border-border/50 max-w-2xl w-full relative overflow-hidden shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedFeature.gradient} opacity-5`} />
              
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${selectedFeature.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                    <selectedFeature.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">{selectedFeature.title}</h3>
                    <p className={`text-sm md:text-base font-semibold bg-gradient-to-r ${selectedFeature.gradient} bg-clip-text text-transparent`}>
                      {selectedFeature.subtitle}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFeature(null)}
                    className="shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed text-base md:text-lg">
                  {selectedFeature.description}
                </p>

                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-lg">Key Features:</h4>
                  {selectedFeature.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedFeature.gradient} flex items-center justify-center shrink-0`}>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm md:text-base">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    setSelectedFeature(null);
                    navigate("/signup");
                  }}
                  className={`w-full bg-gradient-to-r ${selectedFeature.gradient} hover:opacity-90`}
                  size="lg"
                >
                  Try {selectedFeature.title}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Capabilities - Horizontal Auto-Scrolling Carousel */}
      <section className="py-12 md:py-20 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full glass-strong border border-primary/30 mb-4 md:mb-6 shadow-lg">
              <Rocket className="w-4 md:w-5 h-4 md:h-5 text-primary" />
              <span className="text-xs md:text-sm font-semibold">AI-Powered Capabilities</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 px-2">
              Experience the{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Future of Learning
              </span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground px-2">
              Advanced AI features designed to enhance your educational journey
            </p>
          </motion.div>

          <div className="relative">
            {/* Auto-scrolling Container */}
            <div 
              className="overflow-hidden"
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
            >
              <motion.div
                className="flex gap-6"
                animate={!isCarouselPaused ? {
                  x: [0, -1920],
                } : {}}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 30,
                    ease: "linear",
                  },
                }}
              >
                {/* Render capabilities three times for seamless loop */}
                {[...aiCapabilities, ...aiCapabilities, ...aiCapabilities].map((capability, i) => {
                  const Icon = capability.icon;
                  const gradients = [
                    "from-blue-500 to-cyan-500",
                    "from-purple-500 to-pink-500",
                    "from-orange-500 to-red-500",
                    "from-green-500 to-emerald-500",
                    "from-indigo-500 to-purple-500",
                    "from-yellow-500 to-orange-500",
                  ];
                  const gradient = gradients[i % gradients.length];
                  
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => setSelectedCapability(capability)}
                      className="glass-strong rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all text-center group cursor-pointer flex-shrink-0 w-72"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{capability.text}</h3>
                      <p className="text-sm text-muted-foreground">{capability.description}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Capability Detail Modal */}
      <AnimatePresence>
        {selectedCapability && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCapability(null)}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 md:p-10 border border-border/50 max-w-lg w-full relative overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
              
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-lg">
                    <selectedCapability.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">{selectedCapability.text}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCapability(null)}
                    className="shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed text-base md:text-lg">
                  {selectedCapability.description}
                </p>

                <div className="bg-primary/5 rounded-xl p-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    This feature is integrated across all tools to provide you with a seamless learning experience. 
                    Sign up to experience how AI can transform your study sessions!
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setSelectedCapability(null);
                    navigate("/signup");
                  }}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works - Enhanced */}
      <section className="py-12 md:py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full glass-strong border border-green-500/30 mb-4 md:mb-6 shadow-lg">
              <Coffee className="w-4 md:w-5 h-4 md:h-5 text-green-500" />
              <span className="text-xs md:text-sm font-semibold">Simple Process</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 px-2">
              Get Started in{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                4 Easy Steps
              </span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground px-2">
              Your journey to smarter learning begins here
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  className="relative"
                >
                  {/* Connector Arrow - only on desktop */}
                  {i < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-14 -right-3 z-10">
                      <ChevronRight className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                  
                  <div className="glass-strong rounded-xl md:rounded-2xl p-3 md:p-6 border border-border/50 hover:border-primary/50 transition-all h-full relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-opacity duration-500`} />
                    
                    <div className="relative z-10">
                      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-2 md:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] md:text-xs font-bold text-primary">{step.step}</span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                      </div>
                      <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2">{step.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section className="py-12 md:py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full glass-strong border border-yellow-500/30 mb-4 md:mb-6 shadow-lg">
              <Star className="w-4 md:w-5 h-4 md:h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs md:text-sm font-semibold">Student Success Stories</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 px-2">
              Loved by{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Students Worldwide
              </span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground px-2">
              Join thousands of students achieving their academic goals
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="glass-strong rounded-2xl md:rounded-3xl p-5 md:p-10 border border-border/50 relative overflow-hidden shadow-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[activeTestimonial].color} opacity-5`} />
                
                <div className="relative z-10">
                  <div className="flex gap-1 mb-4 md:mb-6">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 md:w-6 md:h-6 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm md:text-xl text-foreground mb-5 md:mb-8 leading-relaxed italic">
                    "{testimonials[activeTestimonial].text}"
                  </p>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${testimonials[activeTestimonial].color} flex items-center justify-center text-white font-bold text-base md:text-xl shadow-lg shrink-0`}>
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div>
                      <div className="font-bold text-sm md:text-lg">{testimonials[activeTestimonial].name}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">{testimonials[activeTestimonial].role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeTestimonial ? 'w-10 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-12 md:py-20 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-2xl" />
            
            <div className="relative glass-strong rounded-3xl p-12 md:p-16 border border-primary/30 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl"
                >
                  <GraduationCap className="w-10 h-10 text-white" />
                </motion.div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Ready to Transform Your Learning?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join 10,000+ students already learning smarter with AI. Start your free journey today!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-16 px-10 text-lg shadow-2xl shadow-primary/30 group"
                    onClick={() => navigate("/signup")}
                  >
                    <Rocket className="mr-2 w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                    Start Free Trial
                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="h-16 px-10 text-lg glass-strong border-border/50 hover:border-primary/50"
                    onClick={() => navigate("/contact")}
                  >
                    <Headphones className="mr-2 w-5 h-5" />
                    Talk to Us
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-6">
                  No credit card required • Free forever • Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Medha.ai Logo" className="w-6 h-6 object-contain" />
              <span className="text-lg font-bold text-primary">
                Medha.ai
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Medha.ai. Empowering students with AI technology.
            </p>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => navigate("/privacy")}
              >
                Privacy Policy
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => navigate("/support")}
              >
                Support
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => navigate("/contact")}
              >
                Contact Us
              </Button>
            </div>
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
