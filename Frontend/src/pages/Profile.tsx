import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User as UserIcon, 
  Mail, 
  GraduationCap, 
  Calendar, 
  Edit2, 
  Save, 
  X, 
  BarChart3,
  MessageSquare,
  BookOpen,
  Video,
  CheckSquare,
  Brain,
  FileText,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { dashboardService } from "@/services/dashboardService";
import type { User, UpdateUserRequest } from "@/types/user";
import type { DashboardResponse } from "@/types/dashboard";

const Profile = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState<UpdateUserRequest>({
    name: "",
    age: 0,
    gender: "",
    educational_details: {
      institution: "",
      degree: "",
      field_of_study: "",
      year_of_study: "",
      grade: "",
    },
  });

  // Fetch user data on mount
  useEffect(() => {
    if (!user) {
      setIsFetching(true);
      refreshUser().finally(() => setIsFetching(false));
    }
  }, []);

  // Fetch dashboard data when dashboard tab is active
  useEffect(() => {
    if (activeTab === "dashboard" && !dashboardData) {
      fetchDashboard();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    setIsDashboardLoading(true);
    try {
      const data = await dashboardService.getDashboard();
      setDashboardData(data);
    } catch (error: any) {
      toast({
        title: "Failed to Load Dashboard",
        description: error.message || "Could not fetch dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Update edit form when user data changes
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name,
        age: user.age,
        gender: user.gender,
        educational_details: user.educational_details,
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name,
        age: user.age,
        gender: user.gender,
        educational_details: user.educational_details,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editData.name || !editData.age || !editData.gender) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await userService.updateUser(editData);
      
      // Refresh user data
      await refreshUser();
      
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isFetching || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 relative overflow-hidden">
      {/* Futuristic Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
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
            className="absolute w-1 h-1 rounded-full bg-primary/40"
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
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl sm:text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 truncate">{user.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm sm:text-base truncate">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </motion.div>

        {/* Tabs for Profile and Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-sm sm:text-base py-2">
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-sm sm:text-base py-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-border"
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-semibold">Basic Information</h2>
                {!isEditing && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
        </div>

          {/* Basic Info */}
          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{user.age} years</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{user.gender}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editData.age}
                    onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) })}
                    disabled={isLoading}
                    min="10"
                    max="100"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select
                    value={editData.gender}
                    onValueChange={(value) => setEditData({ ...editData, gender: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Educational Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
              <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Educational Details
              </CardTitle>
                  <CardDescription>Your academic information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Institution</p>
                      <p className="font-medium">{user.educational_details.institution}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Degree</p>
                      <p className="font-medium">{user.educational_details.degree}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Field of Study</p>
                      <p className="font-medium">{user.educational_details.field_of_study}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Year of Study</p>
                      <p className="font-medium">{user.educational_details.year_of_study}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Grade / GPA</p>
                      <p className="font-medium">{user.educational_details.grade}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-institution">Institution</Label>
                      <Input
                        id="edit-institution"
                        value={editData.educational_details?.institution || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            educational_details: {
                              ...editData.educational_details!,
                              institution: e.target.value,
                            },
                          })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-degree">Degree</Label>
                      <Input
                        id="edit-degree"
                        value={editData.educational_details?.degree || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            educational_details: {
                              ...editData.educational_details!,
                              degree: e.target.value,
                            },
                          })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-field">Field of Study</Label>
                      <Input
                        id="edit-field"
                        value={editData.educational_details?.field_of_study || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            educational_details: {
                              ...editData.educational_details!,
                              field_of_study: e.target.value,
                            },
                          })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-year">Year of Study</Label>
                      <Input
                        id="edit-year"
                        value={editData.educational_details?.year_of_study || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            educational_details: {
                              ...editData.educational_details!,
                              year_of_study: e.target.value,
                            },
                          })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-grade">Grade / GPA</Label>
                      <Input
                        id="edit-grade"
                        value={editData.educational_details?.grade || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            educational_details: {
                              ...editData.educational_details!,
                              grade: e.target.value,
                            },
                          })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Account Created</span>
                  <span className="text-sm font-medium">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }) : "N/A"}
                  </span>
                      </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }) : "N/A"}
                  </span>
                      </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                    </div>
              </div>
            </CardContent>
          </Card>
                  </motion.div>
          </TabsContent>

          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {isDashboardLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading dashboard...</p>
              </div>
            ) : dashboardData ? (
              <>
                {/* Analytics Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Analytics Overview
                      </CardTitle>
                      <CardDescription>Your learning activity at a glance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        <div className="space-y-2 p-3 sm:p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                          <MessageSquare className="w-5 h-5 text-blue-500" />
                          <p className="text-xl sm:text-2xl font-bold">{dashboardData.analytics.total_study_chats}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Study Chats</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <MessageSquare className="w-5 h-5 text-purple-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.total_friend_chats}</p>
                          <p className="text-xs text-muted-foreground">Friend Chats</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <BookOpen className="w-5 h-5 text-green-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.total_study_sessions}</p>
                          <p className="text-xs text-muted-foreground">Study Sessions</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                          <Video className="w-5 h-5 text-orange-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.total_tutorials}</p>
                          <p className="text-xs text-muted-foreground">Tutorials</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                          <CheckSquare className="w-5 h-5 text-yellow-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.total_todos}</p>
                          <p className="text-xs text-muted-foreground">Total Todos</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20">
                          <Trophy className="w-5 h-5 text-red-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.total_quizzes}</p>
                          <p className="text-xs text-muted-foreground">Quizzes</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <Brain className="w-5 h-5 text-indigo-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.total_mindmaps}</p>
                          <p className="text-xs text-muted-foreground">Mindmaps</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20">
                          <CheckSquare className="w-5 h-5 text-green-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.todos_done}</p>
                          <p className="text-xs text-muted-foreground">Todos Done</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                          <CheckSquare className="w-5 h-5 text-blue-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.todos_in_progress}</p>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20">
                          <CheckSquare className="w-5 h-5 text-gray-500" />
                          <p className="text-2xl font-bold">{dashboardData.analytics.todos_pending}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Study Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
        >
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                          Study Sessions
                        </CardTitle>
                        <CardDescription>
                          {dashboardData.study_sessions.length} total sessions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="max-h-96 overflow-y-auto">
                        {dashboardData.study_sessions.length > 0 ? (
                          <div className="space-y-3">
                            {dashboardData.study_sessions.slice(0, 5).map((session) => (
                              <div
                                key={session.session_id}
                                className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-medium">{session.session_name}</p>
                                    <p className="text-sm text-muted-foreground">{session.subject} - {session.grade}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {session.quizzes.length} quizzes
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {session.chat_message_count} messages • {new Date(session.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No study sessions yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent Tutorials */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="glass border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" />
                          Tutorials
                        </CardTitle>
                        <CardDescription>
                          {dashboardData.tutorials.length} tutorials watched
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="max-h-96 overflow-y-auto">
                        {dashboardData.tutorials.length > 0 ? (
                          <div className="space-y-3">
                            {dashboardData.tutorials.slice(0, 5).map((tutorial) => (
                              <div
                                key={tutorial.tutorial_id}
                                className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-sm line-clamp-2">
                                    {tutorial.title}
                                  </p>
                                  <Badge variant="outline" className="text-xs shrink-0 ml-2">
                                    {tutorial.notes_count} notes
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {tutorial.chat_message_count} messages • {new Date(tutorial.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No tutorials yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent Todos */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="glass border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-primary" />
                          Recent Todos
              </CardTitle>
                        <CardDescription>
                          {dashboardData.todos.length} tasks created
                        </CardDescription>
            </CardHeader>
                      <CardContent className="max-h-96 overflow-y-auto">
                        {dashboardData.todos.length > 0 ? (
                          <div className="space-y-3">
                            {dashboardData.todos.slice(0, 5).map((todo) => (
                              <div
                                key={todo.todo_id}
                                className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium">{todo.task}</p>
                                  <Badge
                                    variant={
                                      todo.status === "done"
                                        ? "default"
                                        : todo.status === "in_progress"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {todo.status}
                                  </Badge>
                    </div>
                                {todo.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {todo.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(todo.created_at).toLocaleDateString()}
                                </p>
                  </div>
                ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No todos yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent Chats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="glass border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          Recent Chats
                        </CardTitle>
                        <CardDescription>
                          {dashboardData.study_chats.length + dashboardData.friend_chats.length} total chats
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                          {[...dashboardData.study_chats, ...dashboardData.friend_chats]
                            .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
                            .slice(0, 5)
                            .map((chat) => (
                              <div
                                key={chat.chat_id}
                                className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium">{chat.title}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {dashboardData.study_chats.find((c) => c.chat_id === chat.chat_id)
                                      ? "Study"
                                      : "Friend"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {chat.message_count} {chat.message_count === 1 ? 'message' : 'messages'} • {new Date(chat.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          {dashboardData.study_chats.length === 0 &&
                            dashboardData.friend_chats.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                No chats yet
                              </p>
                            )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No dashboard data available</p>
                <Button onClick={fetchDashboard} variant="outline" className="mt-4">
                  Retry
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
