import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

type Props = {
  imageDataUrl: string;
  result: {
    cupFound: boolean;
    colorScore: number;
    avgColor: string;
  };
};

const getRatingText = (score: number) => {
  if (score === 0) return "No matcha cup found";
  if (score === 5) return "Top grade: Vibrant ceremonial!";
  if (score >= 4) return "Great: Bright, latte-worthy green";
  if (score >= 3) return "Average: Slightly dull, 2nd flush?";
  if (score >= 2) return "Low: Faint green, maybe culinary";
  return "Poor: Not matcha-signature color";
};

// StarRating component for 1-5 stars, supports half stars
const StarRating: React.FC<{ score: number }> = ({ score }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (score >= i) {
      stars.push(
        <Star
          key={i}
          className="w-6 h-6 text-yellow-400 fill-yellow-400 inline"
        />
      );
    } else if (score >= i - 0.5) {
      stars.push(
        <span key={i} className="relative inline-block w-6 h-6">
          <Star
            className="w-6 h-6 text-yellow-400 fill-yellow-400 absolute left-0 top-0"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
          <Star
            className="w-6 h-6 text-muted-foreground fill-muted-foreground absolute left-0 top-0"
            style={{ clipPath: "inset(0 0 0 50%)" }}
          />
        </span>
      );
    } else {
      stars.push(
        <Star
          key={i}
          className="w-6 h-6 text-muted-foreground fill-muted-foreground inline"
        />
      );
    }
  }
  return <div className="flex flex-row items-center gap-0.5">{stars}</div>;
};

const MatchaRatingCard: React.FC<Props> = ({ imageDataUrl, result }) => {
  return (
    <div className="mt-6 w-80 mx-auto border rounded-xl bg-card shadow-lg overflow-hidden flex flex-col items-center px-4 py-6 gap-3 animate-in fade-in">
      <div className="mt-2 flex flex-col items-center w-full gap-1">
        {result.cupFound ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              {/* Removed color swatch */}
            </div>
            <div className="flex flex-col items-center">
              <StarRating score={result.colorScore} />
              <Badge
                variant={result.colorScore >= 4 ? "default" : "secondary"}
                className="px-3 py-1 text-sm tracking-tight mt-1"
              >
                {getRatingText(result.colorScore)}
              </Badge>
            </div>
          </>
        ) : (
          <div className="text-xl font-semibold text-red-500">
            No matcha cup found
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchaRatingCard;
