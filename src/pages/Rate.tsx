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
import { Search, Plus, Loader2, ArrowLeft, Camera, X, ImagePlus } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { format } from "date-fns";

interface Cigar {
  id: string;
  brand: string;
  line: string;
  vitola: string;
  wrapper: string | null;
  strength_profile: string | null;
}

interface BandImage {
  id: string;
  image_url: string;
  is_primary: boolean | null;
}

interface LocationState {
  capturedImage?: string;
  selectedCigarId?: string;
}

interface RatingHistoryItem {
  id: string;
  created_at: string;
  overall_score: number | null;
  photo_url: string | null;
  cigar: {
    id: string;
    brand: string;
    line: string;
    vitola: string;
  };
}

export default function Rate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const locationState = location.state as LocationState | null;
  const capturedImage = locationState?.capturedImage || null;
  
  // Check for cigarId in query params first, then fall back to location state
  const searchParams = new URLSearchParams(location.search);
  const preselectedCigarId = searchParams.get("cigarId") || locationState?.selectedCigarId || null;
  
  const [step, setStep] = useState<"search" | "log">(preselectedCigarId ? "log" : "search");
  
  // Auto-set captured image as photo preview (like Instagram post)
  const [initializedCapturedPhoto, setInitializedCapturedPhoto] = useState(false);
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
  const [bandImages, setBandImages] = useState<BandImage[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  // Rating history state
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Load preselected cigar if coming from match flow
  useEffect(() => {
    if (preselectedCigarId) {
      loadPreselectedCigar(preselectedCigarId);
    }
  }, [preselectedCigarId]);

  // Auto-set captured image as the rating photo (Instagram-style)
  useEffect(() => {
    if (capturedImage && !initializedCapturedPhoto) {
      // Convert base64 to file for upload
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `cigar-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setPhotoFile(file);
          setPhotoPreview(capturedImage);
          setInitializedCapturedPhoto(true);
        });
    }
  }, [capturedImage, initializedCapturedPhoto]);

  // Fetch user's rating history
  useEffect(() => {
    if (user) {
      fetchRatingHistory();
    } else {
      setHistoryLoading(false);
    }
  }, [user]);

  const fetchRatingHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("smoke_logs")
      .select(`
        id,
        created_at,
        overall_score,
        photo_url,
        cigar:cigars(id, brand, line, vitola)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setRatingHistory(data as RatingHistoryItem[]);
    }
    setHistoryLoading(false);
  };

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

  const handleSelectCigar = async (cigar: Cigar) => {
    setSelectedCigar(cigar);
    setStep("log");
    
    // Fetch band images for this cigar
    const { data: images } = await supabase
      .from("cigar_band_images")
      .select("id, image_url, is_primary")
      .eq("cigar_id", cigar.id);
    
    if (images && images.length > 0) {
      setBandImages(images);
    } else {
      setBandImages([]);
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    // Convert base64 to file
    const response = await fetch(imageData);
    const blob = await response.blob();
    const file = new File([blob], `band-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setPhotoFile(file);
    setPhotoPreview(imageData);
    setShowCamera(false);
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
    if (!selectedCigar) {
      toast({
        title: "Select a cigar",
        description: "Please choose a cigar before saving a rating.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your rating.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setSaving(true);
    let photoUrl: string | null = null;

    // Upload photo if selected
    if (photoFile) {
      setUploadingPhoto(true);
      const fileExt = photoFile.name.split('.').pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("smoke-log-photos")
        .upload(fileName, photoFile);

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        toast({
          title: "Photo upload failed",
          description: "Your rating will be saved without the photo.",
          variant: "destructive",
        });
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("smoke-log-photos").getPublicUrl(fileName);
        photoUrl = publicUrl;
      }
      setUploadingPhoto(false);
    }

    const payload = {
      user_id: user.id,
      cigar_id: selectedCigar.id,
      construction,
      flavor,
      strength,
      burn,
      notes,
      photo_url: photoUrl,
      overall_score: Number(overallScore),
    };

    const { data: inserted, error } = await supabase
      .from("smoke_logs")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Smoke log insert error:", error, payload);
      toast({
        title: "Error",
        description: error.message || "Failed to save your smoke log",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged!",
        description: "Your smoke log has been saved.",
      });
      navigate("/feed", { state: { highlightLogId: inserted?.id } });
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

            {/* Rating History */}
            {user && (
              <div className="mt-8 space-y-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Your Recent Ratings
                </h2>
                {historyLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : ratingHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No ratings yet. Rate your first cigar!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ratingHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectCigar(item.cigar as Cigar)}
                        className="w-full flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary"
                      >
                        {item.photo_url ? (
                          <img 
                            src={item.photo_url} 
                            alt="Rating photo"
                            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm truncate">
                            {item.cigar.brand} {item.cigar.line}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        {item.overall_score && (
                          <div className="flex-shrink-0 text-right">
                            <span className="font-display font-bold text-primary">
                              {Number(item.overall_score).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={() => {
                setStep("search");
                setSelectedCigar(null);
                setBandImages([]);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </button>

            {/* Selected cigar with band image */}
            <div className="rounded-lg border border-primary bg-card p-4">
              <div className="flex gap-4">
                {/* Band image from database */}
                {bandImages.length > 0 && (
                  <div className="flex-shrink-0">
                    <img 
                      src={bandImages.find(img => img.is_primary)?.image_url || bandImages[0].image_url}
                      alt="Cigar band"
                      className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {selectedCigar?.brand} {selectedCigar?.line}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedCigar?.vitola}
                  </p>
                </div>
              </div>
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

            {/* Photo suggestion card - prominent when no photo */}
            {!photoPreview && (
              <div 
                onClick={() => setShowCamera(true)}
                className="rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors"
              >
                <ImagePlus className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-display font-semibold text-foreground mb-1">Add a Photo</h3>
                <p className="text-sm text-muted-foreground">Share your smoke with the community!</p>
              </div>
            )}

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

            {/* Spacer for sticky button */}
            <div className="h-24" />
          </div>
        )}
      </div>

      {/* Sticky Done Button - always visible when on log step */}
      {step === "log" && selectedCigar && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 pb-24 bg-gradient-to-t from-background via-background/95 to-transparent safe-bottom">
          <Button
            onClick={handleSubmit}
            disabled={saving || uploadingPhoto}
            size="lg"
            className="w-full bg-gradient-ember py-6 text-lg font-bold shadow-ember touch-manipulation"
          >
            {(saving || uploadingPhoto) ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            {uploadingPhoto ? "Uploading Photo..." : saving ? "Saving..." : "Done"}
          </Button>
        </div>
      )}

      {/* Floating camera button - mobile pattern */}
      {step === "log" && !photoPreview && (
        <button
          onClick={() => setShowCamera(true)}
          className="fixed bottom-44 right-4 z-[61] h-14 w-14 rounded-full bg-gradient-ember shadow-ember flex items-center justify-center hover:scale-105 transition-transform active:scale-95 touch-manipulation"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Camera capture modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </AppLayout>
  );
}
