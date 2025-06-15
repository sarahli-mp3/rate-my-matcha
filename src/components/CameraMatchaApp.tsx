
import React, { useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import MatchaCupDetector from "./MatchaCupDetector";
import MatchaRatingCard from "./MatchaRatingCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Step = "idle" | "scanning" | "processing" | "done";

const CameraMatchaApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const { toast } = useToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera setup
  const handleStartCamera = async () => {
    setErrorMsg(null);
    setStep("scanning");
    try {
      const gotStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width:1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = gotStream;
      }
      setStream(gotStream);
      setHasCamera(true);
      setStep("scanning");
    } catch (e) {
      setHasCamera(false);
      setErrorMsg("Camera access denied or unavailable. Try uploading a photo.");
      toast({ title: "Camera unavailable", description: "Could not access the camera." });
      setStep("idle");
    }
  };

  // Take snapshot
  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    canvasRef.current.width = w;
    canvasRef.current.height = h;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, w, h);
    const dataUrl = canvasRef.current.toDataURL();
    setImageDataUrl(dataUrl);
    setStep("processing");
    stopStream();
  };

  // Handle upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageDataUrl(event.target?.result as string);
      setStep("processing");
    };
    reader.readAsDataURL(file);
  };

  // Cleanup
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setHasCamera(false);
  };

  // Handle reset
  const handleRetake = () => {
    setDetectionResult(null);
    setImageDataUrl(null);
    setStep("idle");
    stopStream();
  };

  // Handle detection finish
  const handleDetection = (result: any) => {
    setDetectionResult(result);
    setStep("done");
    if (!result.cupFound) {
      toast({ title: "No matcha cup found", description: "Try again with a clearer photo!" });
    }
  };

  // Responsive controls
  return (
    <div className="w-full flex flex-col items-center gap-8">
      {!imageDataUrl && (
        <div className="w-full flex flex-col gap-4 max-w-xs items-center">
          <Button
            variant="outline"
            className={cn("w-full flex items-center gap-2", { "opacity-60 pointer-events-none": hasCamera })}
            onClick={handleStartCamera}
            disabled={hasCamera}
          >
            <Camera className="mr-1" /> Use Camera
          </Button>
          <input
            type="file"
            accept="image/*"
            className="block w-full"
            onChange={handleUpload}
            disabled={hasCamera}
          />
          {errorMsg && <span className="text-red-500 text-sm mt-2">{errorMsg}</span>}
        </div>
      )}
      <div className="w-full flex flex-col items-center">
        {/* Live camera preview or still image */}
        {hasCamera && (
          <div className="rounded-lg border overflow-hidden w-80 h-60 flex items-center justify-center bg-card shadow-lg relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <Button
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-8 py-2"
              onClick={handleTakePhoto}
            >
              Capture
            </Button>
            <Button
              variant="ghost"
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              size="icon"
              onClick={stopStream}
              title="Close camera"
            >
              <CameraOff />
            </Button>
          </div>
        )}
        {imageDataUrl && (
          <MatchaCupDetector
            imageDataUrl={imageDataUrl}
            onResult={handleDetection}
            onRetake={handleRetake}
          />
        )}
        {!hasCamera && !imageDataUrl && (
          <div className="mt-8 w-80 h-60 border rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex flex-col items-center justify-center text-muted-foreground text-lg font-semibold gap-2">
            <Camera className="opacity-30" size={48} />
            Camera preview or image will appear here
          </div>
        )}
      </div>
      {/* Results */}
      {step === "done" && detectionResult && (
        <MatchaRatingCard
          imageDataUrl={imageDataUrl!}
          result={detectionResult}
          onRetake={handleRetake}
        />
      )}
      {/* Canvas for capture (hidden) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraMatchaApp;
