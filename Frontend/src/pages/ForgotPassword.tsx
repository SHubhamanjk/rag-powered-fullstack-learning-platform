import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, ArrowRight, ArrowLeft, Lock, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";

type Step = "email" | "otp" | "password" | "success";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("email");
  
  // Form data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await userService.forgotPassword({ email });
      
      toast({
        title: "OTP Sent!",
        description: "Check your email for the 6-digit verification code.",
      });
      
      setCurrentStep("otp");
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "User not found. Please check your email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await userService.verifyOtp({ email, otp });
      
      if (response.verified && response.reset_token) {
        setResetToken(response.reset_token);
        
        toast({
          title: "OTP Verified!",
          description: "You can now reset your password.",
        });
        
        setCurrentStep("password");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await userService.resetPassword({
        email,
        reset_token: resetToken,
        new_password: newPassword,
      });
      
      toast({
        title: "Password Reset Successful!",
        description: "You can now login with your new password.",
      });
      
      setCurrentStep("success");
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step title and description
  const getStepInfo = () => {
    switch (currentStep) {
      case "email":
        return {
          title: "Forgot Password?",
          description: "Enter your email to receive a verification code",
        };
      case "otp":
        return {
          title: "Verify OTP",
          description: "Enter the 6-digit code sent to your email",
        };
      case "password":
        return {
          title: "Reset Password",
          description: "Enter your new password",
        };
      case "success":
        return {
          title: "Success!",
          description: "Your password has been reset",
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.png" alt="Medha.ai Logo" className="w-10 h-10 object-contain animate-glow-pulse" />
            <span className="text-xl sm:text-2xl font-bold gradient-text">Medha.ai</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{stepInfo.title}</h1>
          <p className="text-muted-foreground">{stepInfo.description}</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 border border-border">
          {/* Step 1: Email Input */}
          {currentStep === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 glass"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-11 glow-on-hover"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Login
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  OTP sent to <span className="font-semibold text-foreground">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Code expires in 10 minutes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="glass text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-11 glow-on-hover"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setCurrentStep("email");
                  setOtp("");
                }}
                disabled={isLoading}
              >
                Resend OTP
              </Button>
            </form>
          )}

          {/* Step 3: New Password */}
          {currentStep === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 glass"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 glass"
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
                {isLoading ? "Resetting..." : "Reset Password"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {currentStep === "success" && (
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Password Reset Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to login page...
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
