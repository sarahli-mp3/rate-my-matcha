import React, { useRef, useState, useEffect } from "react";
import { Star } from "lucide-react";
import MatchaCupDetector from "./MatchaCupDetector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { insertMatchaRating, uploadMatchaImage } from "@/supabase/matcha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const getRatingText = (score: number) => {
  if (score === 0) return "No matcha cup found";
  if (score === 5) return "Top grade: Vibrant ceremonial!";
  if (score >= 4) return "Great: Bright, latte-worthy green";
  if (score >= 3) return "Average: Slightly dull, 2nd flush?";
  if (score >= 2) return "Low: Faint green, maybe culinary";
  return "Poor: Not matcha-signature color";
};

type Step = "scanning" | "processing" | "done";

// Interactive Star Rating Component
const InteractiveStarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
}> = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const stars = [];
  const displayRating = hoverRating || rating;

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <div
        key={i}
        className="relative inline-block w-9 h-9 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const isHalf = (e.clientX - rect.left) / rect.width <= 0.5;
          const newRating = isHalf ? i - 0.5 : i;
          onRatingChange(newRating === rating ? 0 : newRating);
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const isHalf = (e.clientX - rect.left) / rect.width <= 0.5;
          setHoverRating(isHalf ? i - 0.5 : i);
        }}
        onMouseLeave={() => setHoverRating(0)}
      >
        <img src="/star-empty.png" alt="Empty Star" className="w-9 h-9" />
        {displayRating >= i - 0.5 && (
          <img
            src="/star-filled.png"
            alt="Filled Star"
            className="absolute top-0 left-0 w-9 h-9"
            style={{
              clipPath:
                displayRating >= i ? "inset(0 0 0 0)" : "inset(0 50% 0 0)",
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center gap-2 w-full">{stars}</div>
  );
};

const CameraMatchaApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("scanning");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [userScore, setUserScore] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start camera on mount
  useEffect(() => {
    let isMounted = true;
    setErrorMsg(null);
    const startCamera = async () => {
      try {
        const gotStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 1280, height: 720 },
        });
        if (!isMounted) return;
        setStream(gotStream);
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = gotStream;
        }
        setStep("scanning");
      } catch (e) {
        setHasCamera(false);
        toast({
          title: "Camera unavailable",
          description: "Could not access the camera.",
        });
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
      toast({
        title: "Camera is loading...",
        description: "Please wait a moment and try again.",
      });
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
    setUserScore(result.colorScore);
    setStep("done");
    if (!result.cupFound) {
      toast({
        title: "No matcha cup found",
        description: "Try again with a clearer photo!",
      });
    }
  };

  // Save the rating/info to Supabase
  const handleSaveRating = async () => {
    if (!imageDataUrl || !detectionResult) return;
    if (userScore === 0) {
      toast({
        title: "Rate your matcha!",
        description: "Please click on the stars to give your rating.",
      });
      return;
    }
    setIsSaving(true);

    // Upload the image to storage
    const imgUrl = await uploadMatchaImage(imageDataUrl);
    if (!imgUrl) {
      setIsSaving(false);
      toast({
        title: "Image upload failed",
        description: "Could not store your photo.",
      });
      return;
    }

    // Insert the record
    const res = await insertMatchaRating({
      image_url: imgUrl,
      ai_score: detectionResult.colorScore,
      user_score: userScore,
      comment: comment.trim() || null,
    });

    setIsSaving(false);
    if (res) {
      toast({
        title: "Rating saved!",
        description: "Your matcha cup has been recorded!",
      });
      // Reset for another rating
      setDetectionResult(null);
      setImageDataUrl(null);
      setUserScore(0);
      setComment("");
      setStep("scanning");
    } else {
      toast({
        title: "Failed to save",
        description: "Could not store your rating.",
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
      });
      return;
    }

    // Convert file to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);
      setStep("processing");
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 text-xl">
      <div className="w-full flex flex-col gap-4 max-w-xs items-center mt-2">
        {errorMsg && (
          <span className="text-red-500 text-sm mt-2">{errorMsg}</span>
        )}
      </div>
      <div className="w-full flex flex-col items-center">
        <div
          className={cn(
            "overflow-hidden w-60 h-60 flex items-center justify-center relative",
            !hasCamera && "opacity-50"
          )}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-60 h-60 object-cover rounded-full"
            style={{
              clipPath: "circle(50% at 50% 50%)",
              WebkitClipPath: "circle(50% at 50% 50%)",
              background: "#eee",
              display: imageDataUrl ? "none" : "block",
            }}
          />
          {imageDataUrl && (
            <img
              src={imageDataUrl}
              alt="Captured matcha"
              className="w-60 h-60 object-cover rounded-full"
              style={{
                clipPath: "circle(50% at 50% 50%)",
                WebkitClipPath: "circle(50% at 50% 50%)",
              }}
            />
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="image"
            size="xl"
            className="w-40"
            onClick={imageDataUrl ? handleRetake : handleTakePhoto}
            disabled={!imageDataUrl && (!hasCamera || step === "processing")}
          >
            {imageDataUrl ? "Retake" : "Capture"}
          </Button>
          {!imageDataUrl && (
            <Button
              variant="image"
              size="xl"
              className="w-40"
              onClick={handleUploadClick}
              disabled={step === "processing"}
            >
              Upload
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        {imageDataUrl && step === "processing" && (
          <MatchaCupDetector
            imageDataUrl={imageDataUrl}
            onResult={handleDetection}
            onRetake={handleRetake}
          />
        )}
        {step === "done" && detectionResult && imageDataUrl && (
          <div className="w-80 mt-3 border rounded-lg bg-background/80 p-1 flex flex-col gap-4 items-stretch">
            <div className="flex flex-col gap-1 items-center">
              <Label className="text-sm font-medium">Your matcha rating:</Label>
              <InteractiveStarRating
                rating={userScore}
                onRatingChange={setUserScore}
              />
            </div>

            <div className="flex flex-col gap-2">
              {/* <Label htmlFor="comment" className="text-sm font-medium">
                Comment (optional):
              </Label> */}
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this matcha..."
                className="min-h-[60px] resize-none"
                maxLength={500}
              />
            </div>

            {/* Center the Save Rating button */}
            <div className="flex justify-center w-full">
              <Button
                onClick={handleSaveRating}
                disabled={isSaving || userScore === 0}
                className="w-40"
                variant="image"
                size="sm"
              >
                {isSaving ? "Saving..." : "Save Rating"}
              </Button>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraMatchaApp;
