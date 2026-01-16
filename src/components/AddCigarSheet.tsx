import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
  onSuccess?: (cigarId: string) => void;
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
  const [loading, setLoading] = useState(false);
  
  const [brand, setBrand] = useState(suggestedCigar?.brand || "");
  const [line, setLine] = useState(suggestedCigar?.line || "");
  const [vitola, setVitola] = useState(suggestedCigar?.vitola || "");
  const [wrapper, setWrapper] = useState(suggestedCigar?.wrapper || "");
  const [origin, setOrigin] = useState(suggestedCigar?.origin || "");
  const [strength, setStrength] = useState("");
  const [size, setSize] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brand.trim() || !line.trim() || !vitola.trim()) {
      toast({
        title: "Missing fields",
        description: "Brand, line, and vitola are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Insert the new cigar
      const { data: cigar, error: cigarError } = await supabase
        .from("cigars")
        .insert({
          brand: brand.trim(),
          line: line.trim(),
          vitola: vitola.trim(),
          wrapper: wrapper.trim() || null,
          origin: origin.trim() || null,
          strength_profile: strength || null,
          size: size.trim() || null,
        })
        .select()
        .single();

      if (cigarError) throw cigarError;

      // If we have a captured image, add it as the band reference
      if (capturedImage && cigar) {
        // Upload the image to storage
        const fileName = `${cigar.id}/${Date.now()}.jpg`;
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

          // Add to cigar_band_images
          await supabase.from("cigar_band_images").insert({
            cigar_id: cigar.id,
            image_url: urlData.publicUrl,
            is_primary: true,
          });
        }
      }

      toast({
        title: "Cigar added!",
        description: `${brand} ${line} has been added to the database`,
      });

      onSuccess?.(cigar.id);
      onClose();
    } catch (error) {
      console.error("Error adding cigar:", error);
      toast({
        title: "Failed to add cigar",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add to Ashtag Database
          </SheetTitle>
          <SheetDescription>
            This cigar wasn't found in our database. Help us grow by adding it!
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
              <Label htmlFor="vitola">Vitola *</Label>
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Cigar"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
