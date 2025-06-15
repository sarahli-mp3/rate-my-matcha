
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  imageDataUrl: string;
  result: {
    cupFound: boolean;
    colorScore: number;
    avgColor: string;
  };
  onRetake: () => void;
};

const getRatingText = (score: number) => {
  if (score >= 9) return "✨ Super Kawaii Matcha! ✨";
  if (score >= 7) return "🌟 Pretty Green & Lovely! 🌟";
  if (score >= 5) return "💚 Cute but could be greener! 💚";
  if (score >= 3) return "😊 Needs more matcha magic! 😊";
  return "💙 Let's find better matcha! 💙";
};

const renderStars = (score: number) => {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(10)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-5 h-5",
            i < fullStars
              ? "fill-yellow-400 text-yellow-400"
              : i === fullStars && hasHalfStar
              ? "fill-yellow-200 text-yellow-400"
              : "text-gray-200"
          )}
        />
      ))}
    </div>
  );
};

const MatchaRatingCard: React.FC<Props> = ({ imageDataUrl, result, onRetake }) => {
  return (
    <div className="mt-8 w-80 mx-auto border-2 border-pink-200 rounded-3xl bg-gradient-to-br from-green-50 via-pink-50 to-purple-50 shadow-xl overflow-hidden flex flex-col items-center px-6 py-8 gap-4 animate-in fade-in relative">
      {/* Sparkles decoration */}
      <Star className="absolute top-4 right-4 w-6 h-6 fill-yellow-300 text-yellow-300 animate-pulse" />
      <Star className="absolute top-6 left-4 w-4 h-4 fill-pink-300 text-pink-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      <div className="w-full h-32 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white/80 flex items-center justify-center">
        <img src={imageDataUrl} alt="matcha" className="object-contain h-full rounded-xl" />
      </div>
      
      <div className="mt-2 flex flex-col items-center w-full gap-3">
        {result.cupFound ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-xl text-green-700 bg-green-100 px-3 py-1 rounded-full">
                🍵 Matcha detected! ✨
              </span>
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-md" 
                style={{ background: result.avgColor }} 
                title={`Average color: ${result.avgColor}`}
              ></div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl font-black text-green-800 mb-1">
                {result.colorScore}/10
              </div>
              
              {renderStars(result.colorScore)}
              
              <Badge 
                variant={result.colorScore >= 7 ? "default" : "secondary"} 
                className={cn(
                  "px-4 py-2 text-sm font-medium tracking-tight rounded-full",
                  result.colorScore >= 7 
                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white" 
                    : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700"
                )}
              >
                {getRatingText(result.colorScore)}
              </Badge>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl font-semibold text-red-500">😔 No matcha cup found</div>
            <div className="text-sm text-gray-600">Try again with a clearer photo! 📸✨</div>
          </div>
        )}
      </div>
      
      <Button 
        variant="outline" 
        className="mt-4 px-8 py-2 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-full font-medium shadow-md" 
        onClick={onRetake}
      >
        🔄 Try another! ✨
      </Button>
    </div>
  );
};

export default MatchaRatingCard;
