import React, { useRef, useState, useEffect } from "react";
import { Camera, Upload, Star } from "lucide-react";
import MatchaCupDetector from "./MatchaCupDetector";
import MatchaRatingCard from "./MatchaRatingCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { insertMatchaRating, uploadMatchaImage } from "@/supabase/matcha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        className="relative inline-block w-8 h-8 cursor-pointer"
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
        <Star className="w-8 h-8 text-muted-foreground/30 fill-muted-foreground/30" />
        {displayRating >= i - 0.5 && (
          <Star
            className="absolute top-0 left-0 w-8 h-8 text-yellow-400 fill-yellow-400"
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
    <div className="flex items-center gap-1">
      <div className="flex items-center">{stars}</div>
      <span className="ml-2 text-sm text-muted-foreground w-16">
        {rating > 0 ? `${rating.toFixed(1)}/5` : ""}
      </span>
    </div>
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
        setErrorMsg("Camera access denied or unavailable.");
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
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full flex flex-col gap-4 max-w-xs items-center mt-2">
        <span className="text-muted-foreground text-sm mb-2">
          Point to your matcha cup and tap capture, or upload an image.
        </span>
        {errorMsg && (
          <span className="text-red-500 text-sm mt-2">{errorMsg}</span>
        )}
      </div>
      <div className="w-full flex flex-col items-center">
        <div
          className={cn(
            "rounded-full border overflow-hidden w-60 h-60 flex items-center justify-center bg-card shadow-lg relative",
            !hasCamera && "opacity-50"
          )}
        >
          <svg width="0" height="0">
            <defs>
              <clipPath id="cup-mask" clipPathUnits="userSpaceOnUse">
                <path
                  d="M217.976 103H223.818C225.107 103 226.262 102.179 226.603 100.935C229.279 91.1834 229.161 77.8653 226.587 68.1038C226.254 66.8415 225.086 66 223.78 66C189.663 66 161.552 66 134.5 66M217.976 103H142.5M217.976 103L216.098 119M15.4759 103H10.3509C9.2037 103 8.14505 102.352 7.71696 101.287C3.99824 92.0421 4.17614 78.3778 7.77027 67.9041C8.1686 66.7433 9.28142 66 10.5086 66C44.7178 66 78.0422 66 105 66M15.4759 103H115M15.4759 103L19.8226 149.5M105 66C116.736 66 122.769 66 134.5 66M105 66L94.8825 8.52006C94.5592 6.68343 95.9722 5 97.8371 5H119.325C120.745 5 121.971 5.99628 122.261 7.38681L134.5 66M142.5 103L151 141M142.5 103H115M115 103L122.5 141M122.5 141C87.5 119 59.8103 117.739 19.8226 149.5M122.5 141C138.511 147.81 155.188 145.855 216.098 119M19.8226 149.5L36.7642 330.735C36.8894 332.074 37.9093 333.17 39.2332 333.408C97.2466 343.826 130.759 344.285 188.794 333.412C190.082 333.171 191.08 332.115 191.233 330.814L216.098 119"
                  transform="scale(1.0) translate(-60, -90)"
                />
              </clipPath>
            </defs>
          </svg>

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

          <svg
            viewBox="0 0 234 412"
            className="absolute pointer-events-none w-32 h-[300px]"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -45%)",
              opacity: 0.9,
              display: imageDataUrl ? "none" : "block",
            }}
          >
            <path
              d="M217.976 103H223.818C225.107 103 226.262 102.179 226.603 100.935C229.279 91.1834 229.161 77.8653 226.587 68.1038C226.254 66.8415 225.086 66 223.78 66C189.663 66 161.552 66 134.5 66M217.976 103H142.5M217.976 103L216.098 119M15.4759 103H10.3509C9.2037 103 8.14505 102.352 7.71696 101.287C3.99824 92.0421 4.17614 78.3778 7.77027 67.9041C8.1686 66.7433 9.28142 66 10.5086 66C44.7178 66 78.0422 66 105 66M15.4759 103H115M15.4759 103L19.8226 149.5M105 66C116.736 66 122.769 66 134.5 66M105 66L94.8825 8.52006C94.5592 6.68343 95.9722 5 97.8371 5H119.325C120.745 5 121.971 5.99628 122.261 7.38681L134.5 66M142.5 103L151 141M142.5 103H115M115 103L122.5 141M122.5 141C87.5 119 59.8103 117.739 19.8226 149.5M122.5 141C138.511 147.81 155.188 145.855 216.098 119M19.8226 149.5L36.7642 330.735C36.8894 332.074 37.9093 333.17 39.2332 333.408C97.2466 343.826 130.759 344.285 188.794 333.412C190.082 333.171 191.08 332.115 191.233 330.814L216.098 119"
              stroke="#FFFFFF"
              strokeWidth={10}
              fill="none"
            />
          </svg>
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
            className="px-8 py-2"
            onClick={handleTakePhoto}
            disabled={!hasCamera || step === "processing"}
          >
            <Camera className="mr-1" /> Capture
          </Button>
          <Button
            variant="outline"
            className="px-8 py-2"
            onClick={handleUploadClick}
            disabled={step === "processing"}
          >
            <Upload className="mr-1" /> Upload
          </Button>
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
          <>
            <MatchaRatingCard
              imageDataUrl={imageDataUrl}
              result={detectionResult}
            />
            <div className="w-80 mt-3 border rounded-lg bg-background/80 p-4 flex flex-col gap-4 items-stretch">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Your matcha rating:
                </Label>
                <InteractiveStarRating
                  rating={userScore}
                  onRatingChange={setUserScore}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="comment" className="text-sm font-medium">
                  Comment (optional):
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this matcha..."
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <span className="text-xs text-muted-foreground text-right">
                  {comment.length}/500
                </span>
              </div>

              <Button
                onClick={handleSaveRating}
                disabled={isSaving || userScore === 0}
                className="w-full"
              >
                {isSaving ? "Saving..." : "Save Rating"}
              </Button>
            </div>
            {imageDataUrl && (
              <Button variant="ghost" onClick={handleRetake} className="mt-4">
                <Camera className="mr-2 h-4 w-4" />
                Retake
              </Button>
            )}
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraMatchaApp;
