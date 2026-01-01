import { useState, useRef, useCallback, useEffect } from "react";
import { X, Camera, RotateCcw, Check, SwitchCamera } from "lucide-react";
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
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      onClose();
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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-top">
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        
        <p className="text-white font-medium text-sm">
          Capture Cigar Band
        </p>
        
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-white text-lg font-medium mb-2">Camera Access Required</p>
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
            className="h-full w-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            
            {/* Guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] max-w-[300px] aspect-[3/2] border-2 border-white/40 rounded-xl">
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                  <p className="text-white/70 text-xs">
                    Center the cigar band in the frame
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 safe-bottom">
        <div className="flex items-center justify-around">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform active:scale-95"
              >
                <RotateCcw className="h-6 w-6 text-white" />
              </button>
              
              <button
                onClick={handleConfirm}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary transition-transform active:scale-95"
              >
                <Check className="h-8 w-8 text-white" />
              </button>
              
              <div className="w-14" />
            </>
          ) : (
            <>
              {hasMultipleCameras ? (
                <button
                  onClick={handleSwitchCamera}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform active:scale-95"
                >
                  <SwitchCamera className="h-6 w-6 text-white" />
                </button>
              ) : (
                <div className="w-14" />
              )}
              
              <button
                onClick={handleCapture}
                disabled={!stream}
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition-transform active:scale-95",
                  stream ? "bg-white/20" : "bg-white/5 opacity-50"
                )}
              >
                <div className="h-16 w-16 rounded-full bg-white" />
              </button>
              
              <div className="w-14" />
            </>
          )}
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
