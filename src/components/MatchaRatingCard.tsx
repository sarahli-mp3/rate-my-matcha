
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  if (score >= 9) return "Top grade: Vibrant Ceremonial!";
  if (score >= 7) return "Great: Rich and lively green";
  if (score >= 5) return "Average: A bit dull, maybe 2nd flush";
  if (score >= 3) return "Low: Pale or brownish, culinary matcha?";
  return "Poor: Not matcha-signature color";
};

const MatchaRatingCard: React.FC<Props> = ({ imageDataUrl, result, onRetake }) => {
  return (
    <div className="mt-6 w-80 mx-auto border rounded-xl bg-card shadow-lg overflow-hidden flex flex-col items-center px-4 py-6 gap-3 animate-in fade-in">
      <div className="w-full h-28 rounded-lg overflow-hidden border flex items-center justify-center bg-background/80">
        <img src={imageDataUrl} alt="matcha" className="object-contain h-full" />
      </div>
      <div className="mt-2 flex flex-col items-center w-full gap-1">
        {result.cupFound ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-green-700">Cup detected!</span>
              <span className="w-5 h-5 inline-block rounded-full border" style={{ background: result.avgColor }} title={`Average color: ${result.avgColor}`}></span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-black text-green-900 mb-0">{result.colorScore}/10</div>
              <Badge variant={result.colorScore >= 7 ? "default" : "secondary"} className="px-3 py-1 text-sm tracking-tight">{getRatingText(result.colorScore)}</Badge>
            </div>
          </>
        ) : (
          <div className="text-xl font-semibold text-red-500">No matcha cup found</div>
        )}
      </div>
      <Button variant="outline" className="mt-4 px-6" onClick={onRetake}>Try another</Button>
    </div>
  );
};

export default MatchaRatingCard;
