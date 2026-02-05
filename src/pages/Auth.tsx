import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { setRememberDevicePreference } from "@/lib/session-storage";
import { signInWithLovableOAuthPopup, isInIframe } from "@/lib/lovable-oauth";
import { isNativeApp } from "@/lib/capacitor-auth";

type AuthMode = "login" | "signup" | "forgot-password";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const hasNavigatedRef = useRef(false);
  const isSigningUpRef = useRef(false);

  useEffect(() => {
    // Don't auto-redirect if we're in the middle of signup flow
    if (user && !authLoading && !hasNavigatedRef.current && !isSigningUpRef.current) {
      hasNavigatedRef.current = true;
      navigate("/feed", { replace: true });
    }
  }, [user, authLoading, navigate]);


  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    if (!ageVerified) {
      toast({
        title: "Age Verification Required",
        description: "You must confirm you are 21 years or older to continue.",
        variant: "destructive",
      });
      return;
    }

    // OAuth is not available in native apps - show message
    if (isNativeApp()) {
      toast({
        title: "Use Email Sign In",
        description: "Social sign-in is coming soon to the mobile app. Please use email/password for now.",
        variant: "default",
      });
      return;
    }

    setRememberDevicePreference(rememberDevice);
    setOauthLoading(provider);

    try {
      // Check if we're in an iframe (Lovable preview)
      if (isInIframe() && provider === "google") {
        toast({
          title: "Unable to sign in",
          description: "Google sign-in is not available in preview mode. Please use email/password or open in a new tab.",
          variant: "destructive",
        });
        setOauthLoading(null);
        return;
      }

      // Use Lovable OAuth popup for web
      const result = await signInWithLovableOAuthPopup(provider);

      if (result.error) {
        throw result.error;
      }

      if (result.tokens) {
        // Set the session with the received tokens
        const { error } = await supabase.auth.setSession({
          access_token: result.tokens.access_token,
          refresh_token: result.tokens.refresh_token,
        });

        if (error) throw error;

        toast({
          title: "Signed in!",
          description: "Welcome to AshTag.",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Sign in failed";
      // Don't show error for user cancellation
      if (!errorMessage.includes("cancelled")) {
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ageVerified) {
      toast({
        title: "Age Verification Required",
        description: "You must confirm you are 21 years or older to continue.",
        variant: "destructive",
      });
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

        toast({
          title: "Account created!",
          description: "Let's set up your profile.",
        });
        // Send new users to profile setup
        hasNavigatedRef.current = true;
        navigate("/profile/setup", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link. Please check your inbox.",
      });
      
      // Return to login mode after successful request
      setMode("login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-card"
              />
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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full py-6"
              onClick={() => handleOAuthSignIn("google")}
              disabled={oauthLoading !== null || !ageVerified}
            >
              {oauthLoading === "google" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full py-6"
              onClick={() => handleOAuthSignIn("apple")}
              disabled={oauthLoading !== null || !ageVerified}
            >
              {oauthLoading === "apple" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              Apple
            </Button>
          </div>

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
