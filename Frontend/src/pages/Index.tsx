import { motion } from "framer-motion";
import { Brain, Video, BookOpen, CheckSquare, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI Doubt Assistant",
      description: "Get instant answers to your questions with our ChatGPT-like AI assistant. Support for text and voice input.",
    },
    {
      icon: Video,
      title: "Interactive Tutorial Watch",
      description: "Watch tutorials with AI-powered notes, auto-pause on questions, and generate quizzes & mind maps.",
    },
    {
      icon: BookOpen,
      title: "Smart Study Mode",
      description: "Create study sessions, upload notes, generate summaries, and build mind maps with AI assistance.",
    },
    {
      icon: CheckSquare,
      title: "Smart To-Do",
      description: "Manage tasks with AI suggestions and smart organization. Stay productive with ease.",
    },
    {
      icon: BarChart3,
      title: "Learning Analytics",
      description: "Track your progress, quiz performance, and study patterns with beautiful visualizations.",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Everything",
      description: "Voice input/output, auto-save, intelligent recommendations, and personalized learning paths.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full glass border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary animate-glow-pulse" />
              <span className="text-xl font-bold gradient-text">Medha.ai</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" onClick={() => navigate("/signup")}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Learn Smarter with{" "}
              <span className="gradient-text">AI-Powered</span>
              <br />
              Study Companion
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your learning experience with Medha.ai - the future of intelligent education. 
              Get instant doubt solving, interactive tutorials, and personalized study sessions.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 px-8 text-lg glow-on-hover"
                onClick={() => navigate("/signup")}
              >
                Start Learning Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                Watch Demo
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 relative"
          >
            <div className="glass rounded-2xl p-8 border border-border max-w-4xl mx-auto">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                <Brain className="w-24 h-24 text-primary animate-glow-pulse" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Excel</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI-driven features designed to make learning engaging, efficient, and personalized.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="glass rounded-2xl p-6 border border-border hover:border-primary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 border border-primary/20 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
            <div className="relative z-10">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-6 animate-glow-pulse" />
              <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Learning?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of students already learning smarter with Medha.ai
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-14 px-10 text-lg glow-on-hover"
                onClick={() => navigate("/signup")}
              >
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold gradient-text">Medha.ai</span>
          </div>
          <p>© 2025 Medha.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
