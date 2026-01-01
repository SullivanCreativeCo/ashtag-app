import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { LitMatchRating } from "@/components/LitMatchRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Loader2, ArrowLeft, Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Cigar {
  id: string;
  brand: string;
  line: string;
  vitola: string;
  wrapper: string | null;
  strength_profile: string | null;
}

interface LocationState {
  capturedImage?: string;
  selectedCigarId?: string;
}

export default function Rate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const locationState = location.state as LocationState | null;
  const capturedImage = locationState?.capturedImage || null;
  const preselectedCigarId = locationState?.selectedCigarId || null;
  
  const [step, setStep] = useState<"search" | "log">(preselectedCigarId ? "log" : "search");
  const [searchQuery, setSearchQuery] = useState("");
  const [cigars, setCigars] = useState<Cigar[]>([]);
  const [selectedCigar, setSelectedCigar] = useState<Cigar | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPreselected, setLoadingPreselected] = useState(!!preselectedCigarId);

  // Log form state
  const [construction, setConstruction] = useState(3);
  const [flavor, setFlavor] = useState(3);
  const [strength, setStrength] = useState(3);
  const [burn, setBurn] = useState(3);
  const [notes, setNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Load preselected cigar if coming from match flow
  useEffect(() => {
    if (preselectedCigarId) {
      loadPreselectedCigar(preselectedCigarId);
    }
  }, [preselectedCigarId]);

  const loadPreselectedCigar = async (cigarId: string) => {
    setLoadingPreselected(true);
    const { data, error } = await supabase
      .from("cigars")
      .select("id, brand, line, vitola, wrapper, strength_profile")
      .eq("id", cigarId)
      .single();

    if (!error && data) {
      setSelectedCigar(data);
      setStep("log");
    }
    setLoadingPreselected(false);
  };

  useEffect(() => {
    const searchCigars = async () => {
      if (searchQuery.length < 2) {
        setCigars([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("cigars")
        .select("id, brand, line, vitola, wrapper, strength_profile")
        .or(`brand.ilike.%${searchQuery}%,line.ilike.%${searchQuery}%`)
        .limit(20);

      if (!error && data) {
        setCigars(data);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchCigars, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectCigar = (cigar: Cigar) => {
    setSelectedCigar(cigar);
    setStep("log");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedCigar) return;

    setSaving(true);
    let photoUrl: string | null = null;

    // Upload photo if selected
    if (photoFile) {
      setUploadingPhoto(true);
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cigar-bands")
        .upload(fileName, photoFile);

      if (uploadError) {
        toast({
          title: "Photo upload failed",
          description: "Your rating will be saved without the photo",
          variant: "destructive",
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("cigar-bands")
          .getPublicUrl(fileName);
        photoUrl = publicUrl;
      }
      setUploadingPhoto(false);
    }

    const { error } = await supabase.from("smoke_logs").insert({
      user_id: user.id,
      cigar_id: selectedCigar.id,
      construction,
      flavor,
      strength,
      burn,
      notes,
      photo_url: photoUrl,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save your smoke log",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged!",
        description: "Your smoke log has been saved",
      });
      navigate("/feed");
    }
    setSaving(false);
  };

  const handleRequestCigar = async () => {
    if (!user || !searchQuery.trim()) return;

    const { error } = await supabase.from("cigar_requests").insert({
      user_id: user.id,
      requested_name: searchQuery,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request submitted!",
        description: "We'll review your cigar request",
      });
      setSearchQuery("");
    }
  };

  const overallScore = ((construction + flavor + strength + burn) / 4).toFixed(1);

  if (loadingPreselected) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-4">
        {step === "search" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-foreground">
                Rate a Cigar
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/match-cigar")}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Scan Band
              </Button>
            </div>

            {/* Show captured image if available */}
            {capturedImage && (
              <div className="rounded-xl overflow-hidden border border-border">
                <img 
                  src={capturedImage} 
                  alt="Captured cigar band" 
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand or line..."
                className="bg-card pl-10"
              />
            </div>

            {/* Results */}
            <div className="space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {!loading && cigars.length > 0 && (
                <div className="space-y-2">
                  {cigars.map((cigar) => (
                    <button
                      key={cigar.id}
                      onClick={() => handleSelectCigar(cigar)}
                      className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
                    >
                      <h3 className="font-display font-semibold text-foreground">
                        {cigar.brand} {cigar.line}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {cigar.vitola}
                        {cigar.wrapper && ` • ${cigar.wrapper}`}
                        {cigar.strength_profile && ` • ${cigar.strength_profile}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {!loading && searchQuery.length >= 2 && cigars.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No cigars found matching "{searchQuery}"
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleRequestCigar}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Request this cigar
                  </Button>
                </div>
              )}

              {searchQuery.length < 2 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Start typing to search for a cigar
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={() => {
                setStep("search");
                setSelectedCigar(null);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </button>

            {/* Selected cigar */}
            <div className="rounded-lg border border-primary bg-card p-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {selectedCigar?.brand} {selectedCigar?.line}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCigar?.vitola}
              </p>
            </div>

            {/* Rating categories */}
            <div className="space-y-5">
              {[
                { label: "Construction", value: construction, setter: setConstruction },
                { label: "Flavor", value: flavor, setter: setFlavor },
                { label: "Strength", value: strength, setter: setStrength },
                { label: "Burn", value: burn, setter: setBurn },
              ].map((category) => (
                <div key={category.label} className="space-y-2">
                  <Label className="text-sm font-medium">{category.label}</Label>
                  <LitMatchRating
                    value={category.value}
                    onChange={category.setter}
                    size="lg"
                  />
                </div>
              ))}
            </div>

            {/* Overall score display */}
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
              <p className="font-display text-3xl font-bold text-primary">
                {overallScore}
              </p>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              ref={fileInputRef}
              className="hidden"
            />

            {/* Photo preview (if photo selected) */}
            {photoPreview && (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img 
                  src={photoPreview} 
                  alt="Photo preview" 
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Tasting Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your experience..."
                className="min-h-[120px] bg-card"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={saving || uploadingPhoto}
              className="w-full bg-gradient-ember py-6 font-semibold shadow-ember"
            >
              {(saving || uploadingPhoto) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {uploadingPhoto ? "Uploading Photo..." : "Rate This Cigar"}
            </Button>
          </div>
        )}
      </div>

      {/* Floating camera button - mobile pattern */}
      {step === "log" && !photoPreview && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gradient-ember shadow-ember flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
      )}
    </AppLayout>
  );
}
