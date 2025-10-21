import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Book, Brain, FileText, Sparkles, Upload, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

const StudyMode = () => {
  const [sessions, setSessions] = useState([
    { id: 1, subject: "Machine Learning", progress: 65 },
    { id: 2, subject: "Data Structures", progress: 40 },
  ]);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 border-r border-border glass hidden lg:flex flex-col"
      >
        <div className="p-4 border-b border-border">
          <Button className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ x: 4 }}
                className="p-3 rounded-lg bg-card hover:bg-accent/50 cursor-pointer border border-border group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{session.subject}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${session.progress}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold gradient-text mb-2">Study Mode</h1>
            <p className="text-muted-foreground">Create and manage your study sessions with AI assistance</p>
          </motion.div>

          {/* Create Session Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-border hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Create New Study Session
                </CardTitle>
                <CardDescription>Set up a personalized study session with AI-powered tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Name</label>
                    <Input placeholder="e.g., Machine Learning" className="glass border-border" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Resources</label>
                    <Button variant="outline" className="w-full gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Study Details</label>
                  <Textarea
                    placeholder="Add any specific topics or areas you want to focus on..."
                    className="glass border-border resize-none h-24"
                  />
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  Start Study Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Brain, title: "AI Quiz", description: "Generate custom quizzes", color: "from-purple-500 to-pink-500" },
              { icon: FileText, title: "Mind Maps", description: "Visual concept mapping", color: "from-blue-500 to-cyan-500" },
              { icon: Book, title: "Smart Notes", description: "AI-enhanced note taking", color: "from-green-500 to-emerald-500" },
            ].map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Card className="glass border-border hover-lift cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 glow-on-hover`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle>Recent Study Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session, i) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-lg bg-card border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{session.subject}</h4>
                        <span className="text-sm text-muted-foreground">{session.progress}% complete</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${session.progress}%` }}
                          transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudyMode;
