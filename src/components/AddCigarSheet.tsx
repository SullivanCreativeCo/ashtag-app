import { useState } from "react";
import { Plus, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SuggestedCigar {
  brand: string | null;
  line: string | null;
  vitola: string | null;
  wrapper: string | null;
  origin: string | null;
}

interface AddCigarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedCigar?: SuggestedCigar;
  capturedImage?: string;
  onSuccess?: () => void;
}

const VITOLA_OPTIONS = [
  "Robusto",
  "Toro",
  "Gordo",
  "Churchill",
  "Corona",
  "Lancero",
  "Torpedo",
  "Belicoso",
  "Perfecto",
  "Petit Corona",
  "Double Corona",
  "Lonsdale",
  "Panatela",
  "Rothschild",
  "Figurado",
];

const WRAPPER_OPTIONS = [
  "Natural",
  "Maduro",
  "Connecticut",
  "Habano",
  "Corojo",
  "Oscuro",
  "Candela",
  "Cameroon",
  "Sumatra",
  "Broadleaf",
];

const ORIGIN_OPTIONS = [
  "Nicaragua",
  "Dominican Republic",
  "Honduras",
  "Cuba",
  "Mexico",
  "Costa Rica",
  "Ecuador",
  "United States",
  "Brazil",
  "Philippines",
];

const STRENGTH_OPTIONS = [
  "Mild",
  "Mild-Medium",
  "Medium",
  "Medium-Full",
  "Full",
];

export function AddCigarSheet({
  isOpen,
  onClose,
  suggestedCigar,
  capturedImage,
  onSuccess,
}: AddCigarSheetProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [brand, setBrand] = useState(suggestedCigar?.brand || "");
  const [line, setLine] = useState(suggestedCigar?.line || "");
  const [vitola, setVitola] = useState(suggestedCigar?.vitola || "");
  const [wrapper, setWrapper] = useState(suggestedCigar?.wrapper || "");
  const [origin, setOrigin] = useState(suggestedCigar?.origin || "");
  const [strength, setStrength] = useState("");
  const [size, setSize] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brand.trim() || !line.trim()) {
      toast({
        title: "Missing fields",
        description: "Brand and line are required",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to submit cigars",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload the image if we have one
      let imageUrl: string | null = null;
      if (capturedImage) {
        const fileName = `pending/${user.id}/${Date.now()}.jpg`;
        const base64Data = capturedImage.replace(/^data:image\/\w+;base64,/, "");
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const { error: uploadError } = await supabase.storage
          .from("cigar-bands")
          .upload(fileName, binaryData, {
            contentType: "image/jpeg",
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("cigar-bands")
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // Submit to cigar_requests for admin approval
      const { error } = await supabase.from("cigar_requests").insert({
        user_id: user.id,
        requested_name: `${brand.trim()} ${line.trim()}`,
        details: `Vitola: ${vitola || "Not specified"}`,
        vitola: vitola || null,
        wrapper: wrapper || null,
        origin: origin || null,
        strength_profile: strength || null,
        size: size || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Submitted for review!",
        description: "An admin will review your submission shortly",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error submitting cigar:", error);
      toast({
        title: "Failed to submit",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setBrand(suggestedCigar?.brand || "");
    setLine(suggestedCigar?.line || "");
    setVitola(suggestedCigar?.vitola || "");
    setWrapper(suggestedCigar?.wrapper || "");
    setOrigin(suggestedCigar?.origin || "");
    setStrength("");
    setSize("");
    onClose();
  };

  if (submitted) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="bottom" className="h-auto">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Submitted for Review
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Your cigar submission has been sent to our admins. 
              Once approved, it will be added to the Ashtag database!
            </p>
            <Button onClick={handleClose} className="mt-6">
              Got it
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Submit to Ashtag Database
          </SheetTitle>
          <SheetDescription>
            Help us grow! Your submission will be reviewed by an admin before being added.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {capturedImage && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={capturedImage}
                alt="Captured cigar"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Padron"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line">Line/Series *</Label>
              <Input
                id="line"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="e.g., 1926 Serie"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vitola">Vitola</Label>
              <Select value={vitola} onValueChange={setVitola}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vitola" />
                </SelectTrigger>
                <SelectContent>
                  {VITOLA_OPTIONS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wrapper">Wrapper</Label>
              <Select value={wrapper} onValueChange={setWrapper}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wrapper" />
                </SelectTrigger>
                <SelectContent>
                  {WRAPPER_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strength">Strength</Label>
              <Select value={strength} onValueChange={setStrength}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strength" />
                </SelectTrigger>
                <SelectContent>
                  {STRENGTH_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size (e.g., 5 x 50)</Label>
            <Input
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Length x Ring Gauge"
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <Clock className="inline h-4 w-4 mr-1" />
            Submissions are reviewed by admins before being added to the database.
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
