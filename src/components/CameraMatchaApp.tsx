
import React, { useRef, useState, useEffect } from "react";
import { Camera } from "lucide-react";
import MatchaCupDetector from "./MatchaCupDetector";
import MatchaRatingCard from "./MatchaRatingCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Step = "scanning" | "processing" | "done";

const CameraMatchaApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("scanning");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const { toast } = useToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start camera on mount
  useEffect(() => {
    let isMounted = true;
    setErrorMsg(null);
    const startCamera = async () => {
      try {
        const gotStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 1280, height: 720 } });
        if (!isMounted) return;
        setStream(gotStream);
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = gotStream;
        }
        setStep("scanning");
      } catch (e) {
        setHasCamera(false);
        setErrorMsg("Camera access denied or unavailable.");
        toast({ title: "Camera unavailable", description: "Could not access the camera." });
        setStep("scanning");
      }
    };
    startCamera();
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line
  }, []);

  // Attach stream to video element whenever it changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Take snapshot and analyze
  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    if (!(w > 0 && h > 0)) {
      toast({ title: "Camera is loading...", description: "Please wait a moment and try again." });
      return;
    }
    canvasRef.current.width = w;
    canvasRef.current.height = h;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, w, h);
    const dataUrl = canvasRef.current.toDataURL();
    setImageDataUrl(dataUrl);
    setStep("processing");
  };

  // Reset for another rating
  const handleRetake = () => {
    setDetectionResult(null);
    setImageDataUrl(null);
    setStep("scanning");
  };

  // Get results from detector
  const handleDetection = (result: any) => {
    setDetectionResult(result);
    setStep("done");
    if (!result.cupFound) {
      toast({ title: "No matcha cup found", description: "Try again with a clearer photo!" });
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full flex flex-col gap-4 max-w-xs items-center mt-2">
        <span className="text-muted-foreground text-sm mb-2">
          Camera is always on! Point to your matcha cup and tap capture.
        </span>
        {errorMsg && <span className="text-red-500 text-sm mt-2">{errorMsg}</span>}
      </div>
      <div className="w-full flex flex-col items-center">
        <div className={cn(
          "rounded-lg border overflow-hidden w-80 h-60 flex items-center justify-center bg-card shadow-lg relative",
          !hasCamera && "opacity-50"
        )}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ background: "#eee" }}
          />
          <Button
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-8 py-2"
            onClick={handleTakePhoto}
            disabled={!hasCamera || step === "processing"}
          >
            <Camera className="mr-1" /> Capture
          </Button>
        </div>
        {imageDataUrl && step === "processing" && (
          <MatchaCupDetector
            imageDataUrl={imageDataUrl}
            onResult={handleDetection}
            onRetake={handleRetake}
          />
        )}
        {step === "done" && detectionResult && imageDataUrl && (
          <MatchaRatingCard
            imageDataUrl={imageDataUrl}
            result={detectionResult}
            onRetake={handleRetake}
          />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraMatchaApp;
