import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera, User } from "lucide-react";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Pre-fill display name from existing profile if available
  useEffect(() => {
    if (profile?.display_name && profile.display_name !== "Cigar Enthusiast") {
      setDisplayName(profile.display_name);
    }
    if (profile?.avatar_url) {
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please select an image under 5MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("smoke-log-photos")
      .upload(fileName, avatarFile, { upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      throw new Error("Failed to upload avatar");
    }

    const { data: publicUrl } = supabase.storage
      .from("smoke-log-photos")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url || null;

      // Upload avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id);
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile created! Welcome to Ash Tag");

      navigate("/feed", { replace: true });
    } catch (error: unknown) {
      console.error("Profile setup error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/feed", { replace: true });
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
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Create Your Profile
          </h1>
          <p className="mt-3 text-muted-foreground">
            Let other enthusiasts know who you are
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative group"
            >
              <Avatar className="h-28 w-28 ring-4 ring-primary/20 transition-all group-hover:ring-primary/40">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                    <User className="h-12 w-12 text-primary/60" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute bottom-0 right-0 rounded-full bg-primary p-2 shadow-lg transition-transform group-hover:scale-110">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
            </button>
            <p className="text-sm text-muted-foreground">Tap to add photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-card text-center text-lg"
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-ember py-6 font-semibold shadow-ember"
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
