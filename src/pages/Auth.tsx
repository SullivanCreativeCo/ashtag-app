import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { setRememberDevicePreference } from "@/lib/session-storage";

type AuthMode = "login" | "signup" | "forgot-password" | "set-new-password";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      return "set-new-password";
    }
    return "login";
  });
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const hasNavigatedRef = useRef(false);
  const isSigningUpRef = useRef(false);

  useEffect(() => {
    // Don't auto-redirect if we're in the middle of signup or setting new password after reset
    if (user && !authLoading && !hasNavigatedRef.current && !isSigningUpRef.current && mode !== "set-new-password") {
      hasNavigatedRef.current = true;
      navigate("/feed", { replace: true });
    }
  }, [user, authLoading, navigate, mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ageVerified) {
      toast.error("You must confirm you are 21 years or older to continue.");
      return;
    }

    // Save the remember device preference before auth
    setRememberDevicePreference(rememberDevice);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate("/feed");
      } else {
        // Mark that we're in signup flow to prevent useEffect redirect
        isSigningUpRef.current = true;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: displayName || "Cigar Enthusiast",
            },
          },
        });

        if (error) throw error;

        toast.success("Account created! Let's set up your profile.");
        // Send new users to profile setup
        hasNavigatedRef.current = true;
        navigate("/profile/setup", { replace: true });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast.success("Check your email. We've sent you a password reset link.");

      // Return to login mode after successful request
      setMode("login");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated. You can sign in with your new password.");
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
      window.history.replaceState(null, "", window.location.pathname);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading && mode !== "set-new-password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Forgot Password View
  if (mode === "forgot-password") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="mb-8 text-center">
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
              Ash<span className="text-primary">Tag</span>
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Reset your password
            </p>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-card"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>

              <Button
                type="submit"
                className="w-full bg-gradient-ember py-6 font-semibold shadow-ember disabled:opacity-50"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Set new password (after clicking reset link in email)
  if (mode === "set-new-password") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="mb-8 text-center">
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
              Ash<span className="text-primary">Tag</span>
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Set your new password
            </p>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-card pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-card"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-ember py-6 font-semibold shadow-ember disabled:opacity-50"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login / Signup View
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero section */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
            Ash<span className="text-primary">Tag</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Rate. Log. Share.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-card"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-card"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setMode("forgot-password")}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-card pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-2 min-h-[44px] touch-manipulation">
              <Checkbox
                id="ageVerification"
                checked={ageVerified}
                onCheckedChange={(checked) => setAgeVerified(checked === true)}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <Label
                htmlFor="ageVerification"
                className="text-sm text-muted-foreground leading-relaxed select-none cursor-pointer"
              >
                By checking this box, I certify that I am 21 years of age or older.
              </Label>
            </div>

            <div className="flex items-center space-x-3 min-h-[44px] touch-manipulation">
              <Checkbox
                id="rememberDevice"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked === true)}
                className="h-5 w-5 shrink-0"
              />
              <Label
                htmlFor="rememberDevice"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Remember this device
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-ember py-6 font-semibold shadow-ember disabled:opacity-50"
              disabled={loading || !ageVerified}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
            {!ageVerified && (
              <p className="text-center text-xs text-destructive">
                Please check the age verification box above to continue
              </p>
            )}
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
