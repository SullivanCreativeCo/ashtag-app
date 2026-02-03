import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { setRememberDevicePreference } from "@/lib/session-storage";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const hasNavigatedRef = useRef(false);

  const toggleAgeVerified = () => setAgeVerified((v) => !v);

  useEffect(() => {
    if (user && !authLoading && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      navigate("/feed", { replace: true });
    }
  }, [user, authLoading, navigate]);

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
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate("/feed");
      } else {
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
          description: "Welcome to Ash Tag. Start logging your cigars!",
        });
        navigate("/feed");
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {!isLogin && (
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
              <Label htmlFor="password">Password</Label>
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

            <div
              className="flex items-start space-x-3 pt-2 min-h-[44px] touch-manipulation cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={toggleAgeVerified}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleAgeVerified();
              }}
            >
              <Checkbox
                id="ageVerification"
                checked={ageVerified}
                onCheckedChange={(checked) => setAgeVerified(checked === true)}
                className="mt-0.5 h-5 w-5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm text-muted-foreground leading-relaxed select-none">
                By checking this box, I certify that I am 21 years of age or older.
              </span>
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
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
            {!ageVerified && (
              <p className="text-center text-xs text-destructive">
                Please check the age verification box above to continue
              </p>
            )}
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
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
