import React, { useRef, useState, useEffect } from "react";
import { Camera, Star } from "lucide-react";
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
    <div className="w-full flex flex-col items-center gap-8 p-4">
      <div className="w-full flex flex-col gap-4 max-w-xs items-center mt-2">
        <div className="flex items-center gap-2 text-center">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-pink-600 font-medium text-sm">
            Point your camera at a kawaii matcha cup! ✨
          </span>
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        </div>
        {errorMsg && <span className="text-red-500 text-sm mt-2">{errorMsg}</span>}
      </div>
      
      <div className="w-full flex flex-col items-center">
        {/* Matcha Cup Shaped Camera Container */}
        <div className={cn(
          "relative w-80 h-80 flex items-center justify-center",
          !hasCamera && "opacity-50"
        )}>
          {/* Cup body - main container */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-100 to-green-200 rounded-b-full border-4 border-green-300 shadow-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover rounded-b-full"
              style={{ background: "#eee" }}
            />
            
            {/* Matcha foam effect */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-green-50/80 to-transparent rounded-t-lg"></div>
            
            {/* Cute face on the cup */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <div className="w-3 h-1 bg-pink-500 rounded-full"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Cup handle */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-12 border-4 border-green-300 rounded-r-full bg-transparent"></div>
          
          {/* Sparkles around the cup */}
          <Star className="absolute -top-4 -left-4 w-6 h-6 fill-yellow-300 text-yellow-300 animate-pulse" />
          <Star className="absolute -top-2 -right-6 w-4 h-4 fill-pink-300 text-pink-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Star className="absolute -bottom-4 -left-6 w-5 h-5 fill-purple-300 text-purple-300 animate-pulse" style={{ animationDelay: '1s' }} />
          <Star className="absolute -bottom-2 -right-4 w-6 h-6 fill-blue-300 text-blue-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
          
          {/* Capture button */}
          <Button
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={handleTakePhoto}
            disabled={!hasCamera || step === "processing"}
          >
            <Camera className="mr-2 w-5 h-5" /> 
            <span className="text-lg">📸</span>
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
            <div className="w-80 mt-6 border-2 border-pink-200 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 p-6 flex flex-col gap-4 items-stretch shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Label htmlFor="user-rating" className="text-pink-700 font-medium">
                  Your kawaii matcha rating! ⭐
                </Label>
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserScore(star)}
                    className="transition-all duration-200 hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-6 h-6",
                        userScore && star <= userScore
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              
              <Input
                id="user-rating"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={userScore ?? ""}
                onChange={e => setUserScore(Number(e.target.value))}
                placeholder="Or type your rating (0-10)"
                className="border-pink-200 focus:border-pink-400 rounded-xl"
              />
              
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="location" className="text-pink-700 font-medium flex items-center gap-2">
                  📍 Location {location && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">(added! ✨)</span>}
                </Label>
                <Button
                  onClick={handleGetLocation}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full"
                >
                  {location ? "🔄 Refresh" : "✨ Add"} Location
                </Button>
              </div>
              
              <div className="flex flex-row justify-end gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleRetake} 
                  disabled={isSaving}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-full px-6"
                >
                  🔄 Try Again
                </Button>
                <Button 
                  onClick={handleSaveRating} 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-full px-6 shadow-lg"
                >
                  {isSaving ? "Saving... ✨" : "💾 Save Rating!"}
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
