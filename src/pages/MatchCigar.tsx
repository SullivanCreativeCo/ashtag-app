import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CigarMatchResults } from "@/components/CigarMatchResults";
import { CameraCapture } from "@/components/CameraCapture";

interface MatchResult {
  identified: boolean;
  confidence: number;
  extractedInfo: {
    brand: string | null;
    line: string | null;
    otherText: string | null;
  };
  matches: Array<{
    cigarId: string;
    brand: string;
    line: string;
    vitola: string;
    confidence: number;
    matchReason: string;
  }>;
}

export default function MatchCigar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [capturedImage, setCapturedImage] = useState<string | null>(
    location.state?.capturedImage || null,
  );
  const [cameraOpen, setCameraOpen] = useState(!location.state?.capturedImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // Prevent double-invocation when we analyze on capture + also have capturedImage set.
  const lastAnalyzedImageRef = useRef<string | null>(null);

  const analyzeImage = async (imageData: string) => {
    // Avoid charging/processing the same image more than once.
    if (lastAnalyzedImageRef.current === imageData) return;
    lastAnalyzedImageRef.current = imageData;

    setLoading(true);
    setError(null);
    setMatchResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("match-cigar-band", {
        body: { imageBase64: imageData },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setMatchResult(data);

      if (data?.identified && data?.matches?.length > 0 && data.matches[0].confidence >= 85) {
        toast({
          title: "Cigar identified!",
          description: `${data.matches[0].brand} ${data.matches[0].line}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  // If we arrive here already holding a captured image (deep link from elsewhere), analyze it once.
  useEffect(() => {
    if (capturedImage) analyzeImage(capturedImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCameraCapture = (imageData: string) => {
    setCameraOpen(false);
    setCapturedImage(imageData);
    analyzeImage(imageData);
  };

  const handleSelectMatch = (cigarId: string) => {
    navigate("/rate", {
      state: {
        capturedImage,
        selectedCigarId: cigarId,
      },
    });
  };

  const handleManualSearch = () => {
    navigate("/rate", {
      state: {
        capturedImage,
      },
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMatchResult(null);
    setError(null);
    lastAnalyzedImageRef.current = null;
    setCameraOpen(true);
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted transition-colors touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">Identify Cigar</h1>
            <p className="text-xs text-muted-foreground">Capture the band for auto-recognition</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-20">
        {capturedImage ? (
          <CigarMatchResults
            result={matchResult}
            loading={loading}
            error={error}
            capturedImage={capturedImage}
            onSelectMatch={handleSelectMatch}
            onManualSearch={handleManualSearch}
            onRetake={handleRetake}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">Opening camera...</p>
          </div>
        )}
      </main>

      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
