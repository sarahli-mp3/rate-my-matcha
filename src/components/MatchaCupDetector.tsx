
import React, { useEffect, useRef, useState } from "react";

interface CupDetectionResult {
  cupFound: boolean;
  colorScore: number; // 0 - 10
  avgColor: string;   // e.g., "#aabb77"
}

type Props = {
  imageDataUrl: string;
  onResult: (result: CupDetectionResult) => void;
  onRetake: () => void;
};

// Ideal matcha color ranges
const IDEAL_MATCHA_COLORS = [
  { name: "Bright ceremonial", hex: "#7BAF5C", r: 123, g: 175, b: 92 },
  { name: "Creamy latte", hex: "#A3C585", r: 163, g: 197, b: 133 },
  { name: "Earthy mid-tone", hex: "#8FB26B", r: 143, g: 178, b: 107 },
  { name: "Vibrant whisked", hex: "#76A646", r: 118, g: 166, b: 70 }
];

// Calculate color distance between two RGB colors
const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

// Check if pixel is inside cup shape (elliptical with narrower bottom)
const isInsideCupShape = (x: number, y: number, cx: number, cy: number, width: number, height: number) => {
  const relX = (x - cx) / (width * 0.35); // Cup width
  const relY = (y - cy) / (height * 0.4);  // Cup height
  
  // Create cup shape - wider at top, narrower at bottom
  const cupWidth = 1 - (relY * 0.3); // Gets narrower as we go down
  const ellipse = (relX / cupWidth) ** 2 + relY ** 2;
  
  return ellipse <= 1 && relY > -0.8 && relY < 0.8;
};

// Improved matcha color detector focusing on cup-shaped area
const detectCupAndMatchaColor = async (
  imageDataUrl: string
): Promise<CupDetectionResult> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      // Draw to canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve({ cupFound: false, colorScore: 0, avgColor: "#888888" });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // ImageData
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let cupPixels = 0;
      let matchaPixels = 0;
      let sumR = 0, sumG = 0, sumB = 0;
      let bestMatchaPixels = 0;

      const cx = width / 2, cy = height / 2;
      
      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          // Only analyze pixels inside the cup shape
          if (!isInsideCupShape(x, y, cx, cy, width, height)) continue;
          
          const idx = (y * width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
          
          if (a < 200) continue; // Skip transparent pixels
          
          cupPixels++;
          sumR += r;
          sumG += g;
          sumB += b;
          
          // Check if pixel matches matcha color criteria
          const matchesMatchaCriteria = 
            g >= 130 && g <= 180 && // Green channel in ideal range
            r < 120 &&              // Red lower than specified
            b < 100 &&              // Blue lower than specified
            g > r + 10 &&           // Green dominance over red
            g > b + 20;             // Green dominance over blue
          
          if (matchesMatchaCriteria) {
            matchaPixels++;
            
            // Check how close to ideal matcha colors
            const minDistance = Math.min(
              ...IDEAL_MATCHA_COLORS.map(ideal => 
                colorDistance(r, g, b, ideal.r, ideal.g, ideal.b)
              )
            );
            
            // If very close to ideal colors (distance < 50), count as best matcha
            if (minDistance < 50) {
              bestMatchaPixels++;
            }
          }
        }
      }

      // Calculate average color in cup area
      const avgR = cupPixels ? sumR / cupPixels : 0;
      const avgG = cupPixels ? sumG / cupPixels : 0;
      const avgB = cupPixels ? sumB / cupPixels : 0;

      // Determine if we found a cup with matcha
      const matchaRatio = cupPixels > 0 ? matchaPixels / cupPixels : 0;
      const bestMatchaRatio = cupPixels > 0 ? bestMatchaPixels / cupPixels : 0;
      
      const cupFound = 
        cupPixels > 1000 && // Minimum pixels in cup area
        matchaRatio > 0.1;  // At least 10% of cup area has matcha-like color

      // Calculate color score based on matcha quality
      let colorScore = 0;
      if (cupFound) {
        // Base score from matcha pixel ratio (0-4 points)
        const ratioScore = Math.min(4, matchaRatio * 10);
        
        // Bonus for colors close to ideal matcha (0-3 points)
        const idealScore = Math.min(3, bestMatchaRatio * 15);
        
        // Bonus for good green dominance (0-2 points)
        const greenDominance = avgG > avgR + 20 && avgG > avgB + 30 ? 2 : 
                              avgG > avgR + 10 && avgG > avgB + 15 ? 1 : 0;
        
        // Bonus for being in ideal green range (0-1 point)
        const greenRangeBonus = avgG >= 130 && avgG <= 180 ? 1 : 0;
        
        colorScore = Math.min(10, Math.max(1, Math.round(ratioScore + idealScore + greenDominance + greenRangeBonus)));
      }

      // Format average color
      const avgColor =
        "#" +
        [avgR, avgG, avgB]
          .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
          .join("");

      console.log('Cup-shaped matcha detection results:', {
        cupPixels,
        matchaPixels,
        bestMatchaPixels,
        matchaRatio: matchaRatio.toFixed(3),
        bestMatchaRatio: bestMatchaRatio.toFixed(3),
        avgR: avgR.toFixed(1), 
        avgG: avgG.toFixed(1), 
        avgB: avgB.toFixed(1),
        cupFound,
        colorScore
      });

      resolve({
        cupFound,
        colorScore,
        avgColor,
      });
    };
    img.src = imageDataUrl;
  });
};

const MatchaCupDetector: React.FC<Props> = ({ imageDataUrl, onResult, onRetake }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    detectCupAndMatchaColor(imageDataUrl).then((result) => {
      if (mounted) {
        setLoading(false);
        // Add small timeout for UX
        setTimeout(() => onResult(result), 800);
      }
    });
    return () => {
      mounted = false;
    };
  }, [imageDataUrl, onResult]);

  return (
    <div className="w-80 h-60 rounded-lg relative border bg-card overflow-hidden flex items-center justify-center">
      <img
        src={imageDataUrl}
        alt="captured"
        className={loading ? "opacity-40 blur-sm grayscale" : "object-cover w-full h-full"}
      />
      {/* Cup shape overlay to show analysis area */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 320 240">
          <ellipse 
            cx="160" 
            cy="120" 
            rx="56" 
            ry="48"
            fill="none" 
            stroke="rgba(123, 175, 92, 0.6)" 
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          <ellipse 
            cx="160" 
            cy="135" 
            rx="45" 
            ry="35"
            fill="none" 
            stroke="rgba(123, 175, 92, 0.4)" 
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </svg>
      </div>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 gap-1">
          <span className="loader mb-2 animate-spin h-8 w-8 rounded-full border-4 border-green-300 border-t-green-700"></span>
          <span className="font-bold text-green-700 tracking-tight">Analyzing matcha…</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRetake}
        className="absolute right-2 top-2 rounded bg-white/70 text-sm text-foreground px-3 py-1 hover:bg-red-200 transition"
      >
        Retake
      </button>
      <style>{`
        .loader {
          border-right-color: transparent;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default MatchaCupDetector;
