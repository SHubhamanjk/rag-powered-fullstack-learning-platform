import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, ArrowRight, GraduationCap, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import type { CreateUserRequest } from "@/types/user";

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Basic info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Educational details
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [grade, setGrade] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name || !email || !password || !confirmPassword || !age || !gender) {
      toast({
        title: "Error",
        description: "Please fill in all basic information fields",
        variant: "destructive",
      });
      return;
    }

    if (!institution || !degree || !fieldOfStudy || !yearOfStudy || !grade) {
      toast({
        title: "Error",
        description: "Please fill in all educational details",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(age) < 10 || parseInt(age) > 100) {
      toast({
        title: "Error",
        description: "Please enter a valid age",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const userData: CreateUserRequest = {
        name,
        email,
        password,
        age: parseInt(age),
        gender,
        educational_details: {
          institution,
          degree,
          field_of_study: fieldOfStudy,
          year_of_study: yearOfStudy,
          grade,
        },
      };

      const response = await userService.createUser(userData);
      
      // Login with the received token
      login(response.token);
      
      toast({
        title: "Account created!",
        description: "Welcome to Medha.ai",
      });
      
      navigate("/home");
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-10 h-10 text-primary animate-glow-pulse" />
            <span className="text-2xl font-bold gradient-text">Medha.ai</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Start your AI-powered learning journey</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="20"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="glass"
                    min="10"
                    max="100"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender} disabled={isLoading}>
                    <SelectTrigger className="glass">
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

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Educational Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Educational Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="institution">Institution / University</Label>
                  <Input
                    id="institution"
                    type="text"
                    placeholder="e.g., Stanford University"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    type="text"
                    placeholder="e.g., Bachelor's, Master's"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input
                    id="fieldOfStudy"
                    type="text"
                    placeholder="e.g., Computer Science"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfStudy">Year of Study</Label>
                  <Input
                    id="yearOfStudy"
                    type="text"
                    placeholder="e.g., 3rd Year, Final Year"
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade / GPA</Label>
                  <Input
                    id="grade"
                    type="text"
                    placeholder="e.g., A, 3.8"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="glass"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-11 glow-on-hover"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="text-primary p-0 h-auto"
                onClick={() => navigate("/login")}
                disabled={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
