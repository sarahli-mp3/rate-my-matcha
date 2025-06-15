import React, { useRef, useState, useEffect } from "react";
import { Camera } from "lucide-react";
import MatchaCupDetector from "./MatchaCupDetector";
import MatchaRatingCard from "./MatchaRatingCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { insertMatchaRating, uploadMatchaImage } from "@/supabase/matcha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "scanning" | "processing" | "done";

const CameraMatchaApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("scanning");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  // Prompt user for GPS location  
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not supported", description: "Your browser doesn't support geolocation." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation(`${pos.coords.latitude},${pos.coords.longitude}`);
        toast({ title: "Location fetched", description: "Location attached to this rating." });
      },
      err => {
        setLocation(null);
        toast({ title: "Location error", description: "Could not get your position." });
      }
    );
  };

  // Save the rating/info to Supabase
  const handleSaveRating = async () => {
    if (!imageDataUrl || !detectionResult) return;
    if (userScore == null) {
      toast({ title: "Enter your own rating too!", description: "Please add your manual rating (0-10)" });
      return;
    }
    setIsSaving(true);

    // Upload the image to storage
    const imgUrl = await uploadMatchaImage(imageDataUrl);
    if (!imgUrl) {
      setIsSaving(false);
      toast({ title: "Image upload failed", description: "Could not store your photo." });
      return;
    }

    // Insert the record
    const res = await insertMatchaRating({
      image_url: imgUrl,
      ai_score: detectionResult.colorScore,
      user_score: userScore,
      location: location,
    });

    setIsSaving(false);
    if (res) {
      toast({ title: "Rating saved!", description: "Your matcha cup has been recorded!" });
      handleRetake();
    } else {
      toast({ title: "Failed to save", description: "Could not store your rating." });
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
          <>
            <MatchaRatingCard
              imageDataUrl={imageDataUrl}
              result={detectionResult}
              onRetake={handleRetake}
            />
            <div className="w-80 mt-3 border rounded-lg bg-background/80 p-4 flex flex-col gap-2 items-stretch">
              <Label htmlFor="user-rating" className="mb-1">Your own matcha rating (0–10):</Label>
              <Input
                id="user-rating"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={userScore ?? ""}
                onChange={e => setUserScore(Number(e.target.value))}
                placeholder="Your rating"
                className="mb-2"
              />
              <Label htmlFor="location" className="mb-1 flex items-center gap-2">
                Location {location && <span className="text-xs text-green-600">(added)</span>}
                <Button
                  onClick={handleGetLocation}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-2"
                >
                  {location ? "Refresh" : "Add"} Location
                </Button>
              </Label>
              <div className="flex flex-row justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={handleRetake} disabled={isSaving}>
                  Retake
                </Button>
                <Button onClick={handleSaveRating} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Rating"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraMatchaApp;
