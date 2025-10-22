import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  Github, 
  Linkedin,
  MessageSquare,
  Users,
  Lightbulb,
  Code,
  GraduationCap,
  Briefcase,
  Heart,
  Send,
  ArrowRight,
  Sparkles,
  Brain,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiService.post("/contact/submit", formData);
      
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon!",
      });
      setFormData({ name: "", contact: "", message: "" });
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "Please try again or contact us directly via email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "shubham07kumargupta@gmail.com",
      href: "mailto:shubham07kumargupta@gmail.com",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+91 8002007238",
      href: "tel:+918002007238",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Github,
      label: "GitHub",
      value: "SHubhamanjk",
      href: "https://github.com/SHubhamanjk",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "shubhamiitpatna",
      href: "https://linkedin.com/in/shubhamiitpatna",
      gradient: "from-blue-600 to-blue-400",
    },
  ];

  const collaborationAreas = [
    {
      icon: Users,
      title: "Open Source Contribution",
      description: "Contribute to Medha.ai's development and help improve AI-powered education for students worldwide.",
    },
    {
      icon: Lightbulb,
      title: "Feature Suggestions",
      description: "Have ideas for new features? Share your suggestions to make Medha.ai even better for learners.",
    },
    {
      icon: MessageSquare,
      title: "Feedback & Bug Reports",
      description: "Help us improve by reporting bugs, usability issues, or sharing your experience using the platform.",
    },
    {
      icon: Code,
      title: "Technical Collaboration",
      description: "Interested in AI/ML, NLP, or full-stack development? Let's collaborate on exciting projects!",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        
        {/* Floating Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/25 rounded-full blur-[100px]"
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full glass-strong border-b border-border/50 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <Brain className="w-8 h-8 text-primary relative z-10" />
                <div className="absolute inset-0 blur-lg bg-primary/50 animate-pulse-slow" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Medha.ai
              </span>
            </motion.div>
            <Button 
              variant="ghost"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong border border-primary/30 mb-6">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">Let's Connect</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6">
              Get in{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions, feedback, or want to collaborate? We'd love to hear from you!
            </p>
          </motion.div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {contactInfo.map((contact, i) => {
              const Icon = contact.icon;
              return (
                <motion.a
                  key={i}
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="glass-strong rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">{contact.label}</div>
                  <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {contact.value}
                  </div>
                </motion.a>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-16 sm:mb-20">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-strong border-border/50 p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Send className="w-6 h-6 text-primary" />
                  Send a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="glass border-border/50"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Mobile Number or Email"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      required
                      className="glass border-border/50"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Your Message (Keep it concise)"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={5}
                      maxLength={500}
                      className="glass border-border/50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.message.length}/500 characters
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-on-hover group disabled:opacity-50"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Developer Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              {/* About Developer */}
              <Card className="glass-strong border-border/50 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                    SK
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">Shubham Kumar Gupta</h3>
                    <p className="text-primary font-medium">AI/ML Engineer & Full-Stack Developer</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <span>IIT Patna • CS & Data Analytics</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <span>AI/ML Intern @ Humantics</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Code className="w-5 h-5 text-primary" />
                    <span>Specializing in AI, ML, NLP & Gen AI</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Passionate about leveraging AI and machine learning to create impactful solutions 
                    in education, healthcare, and beyond. Building Medha.ai to make learning accessible 
                    and effective for students worldwide.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Collaboration Areas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Let's{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Collaborate
                </span>
              </h2>
              <p className="text-muted-foreground">
                Here's how you can contribute and be part of Medha.ai's journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collaborationAreas.map((area, i) => {
                const Icon = area.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="glass-strong border-border/50 p-6 h-full hover:border-primary/50 transition-all">
                      <Icon className="w-10 h-10 text-primary mb-4" />
                      <h3 className="text-xl font-bold mb-2">{area.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {area.description}
                      </p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-20"
          >
            <Card className="glass-strong border-primary/30 p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
              <div className="relative z-10">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Your Feedback Matters!
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Medha.ai is built with love for students. Help us make it better by sharing 
                  your thoughts, reporting bugs, or suggesting new features.
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-on-hover"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Share Feedback
                  <Send className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Medha.ai
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 Medha.ai. Built with <Heart className="w-4 h-4 inline text-red-500 fill-red-500" /> for students worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;

