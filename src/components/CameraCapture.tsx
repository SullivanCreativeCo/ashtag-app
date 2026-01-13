import { useState, useRef, useCallback, useEffect } from "react";
import { X, Camera, RotateCcw, Check, SwitchCamera, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check for multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    
    return () => {
      if (!isOpen) {
        stopCamera();
        setCapturedImage(null);
      }
    };
  }, [isOpen, facingMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Compress image: resize to max 1024px on longest side for faster upload
    const MAX_SIZE = 1024;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    let targetWidth = videoWidth;
    let targetHeight = videoHeight;
    
    if (videoWidth > videoHeight && videoWidth > MAX_SIZE) {
      targetWidth = MAX_SIZE;
      targetHeight = Math.round((videoHeight / videoWidth) * MAX_SIZE);
    } else if (videoHeight > MAX_SIZE) {
      targetHeight = MAX_SIZE;
      targetWidth = Math.round((videoWidth / videoHeight) * MAX_SIZE);
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      // Lower quality (0.7) for faster upload while maintaining readability
      const imageData = canvas.toDataURL("image/jpeg", 0.7);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    console.log("handleConfirm called, capturedImage:", !!capturedImage);
    if (capturedImage) {
      // Parent should close the modal by updating isOpen after receiving the capture.
      // This avoids accidental navigation when onClose is wired to "go back".
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] bg-black flex flex-col",
        "animate-in fade-in zoom-in-95 duration-300"
      )}
    >
      {/* Close button - top left */}
      <div className="absolute top-4 left-4 z-10 safe-top">
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform active:scale-95"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Frame border around screen */}
      {!capturedImage && !error && (
        <div className="absolute inset-4 z-10 pointer-events-none rounded-2xl border-2 border-white/30" />
      )}

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-display text-white text-xl mb-2">Camera Access Required</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button
              onClick={startCamera}
              variant="outline"
              className="mt-6"
            >
              Try Again
            </Button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="h-full w-full object-contain animate-in fade-in duration-200"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Bottom capture button */}
      {!capturedImage && !error && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 safe-bottom">
          <button
            onClick={handleCapture}
            disabled={!stream}
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 active:scale-90",
              "bg-white/20 backdrop-blur-sm border-2 border-white/40",
              stream ? "opacity-100" : "opacity-40"
            )}
          >
            {/* Cigar band icon - concentric circles */}
            <div className="relative">
              <Circle className="h-10 w-10 text-white" strokeWidth={1.5} />
              <Circle className="h-6 w-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={1.5} />
            </div>
          </button>
          <span className="text-display text-white/70 text-xs tracking-wide text-center drop-shadow-lg">
            Capture Cigar Band
          </span>
        </div>
      )}

      {/* Switch camera button - bottom right when in capture mode */}
      {!capturedImage && !error && hasMultipleCameras && (
        <div className="absolute bottom-8 right-4 z-10 safe-bottom">
          <button
            onClick={handleSwitchCamera}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform active:scale-95"
          >
            <SwitchCamera className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Post-capture controls - bottom center */}
      {capturedImage && (
        <div className="absolute bottom-0 left-0 right-0 p-6 safe-bottom">
          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={handleRetake}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleRetake();
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform active:scale-95 touch-manipulation"
            >
              <RotateCcw className="h-6 w-6 text-white" />
            </button>
            
            <button
              type="button"
              onClick={handleConfirm}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-ember shadow-ember transition-transform active:scale-95 touch-manipulation"
            >
              <Check className="h-8 w-8 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
