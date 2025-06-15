
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

const grayscale = (r: number, g: number, b: number) =>
  Math.round(0.299 * r + 0.587 * g + 0.114 * b);

// Improved cup+matcha detector
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

      // Improved cup detection with more realistic thresholds
      let rimPixels = 0;
      let centerGreenPixels = 0;
      let totalCenter = 0;
      let sumR = 0, sumG = 0, sumB = 0;
      let centerRadius = Math.min(width, height) * 0.2; // Smaller radius for more focused detection

      const cx = width / 2, cy = height / 2;
      
      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const dx = x - cx, dy = y - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const idx = (y * width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];

          // More strict rim detection - looking for very bright pixels in a ring
          if (
            d > centerRadius * 1.2 &&
            d < centerRadius * 2.0 &&
            grayscale(r, g, b) > 220 && // Much brighter threshold
            a > 240 && // Higher alpha requirement
            Math.abs(r - g) < 30 && Math.abs(g - b) < 30 // More neutral colors for cup rim
          ) {
            rimPixels++;
          }

          // Center analysis - more focused on actual matcha color
          if (d < centerRadius && a > 200) {
            sumR += r;
            sumG += g;
            sumB += b;
            totalCenter++;
            
            // Better matcha color detection
            // Good matcha should be vibrant green with G significantly higher than R and B
            if (
              g > 80 && // Minimum green threshold
              g > r + 20 && // Green should be notably higher than red
              g > b + 30 && // Green should be much higher than blue
              r < 180 && // Not too bright (avoid white/cream)
              b < 150    // Keep blue low for true green
            ) {
              centerGreenPixels++;
            }
          }
        }
      }

      // More realistic cup detection thresholds
      const minRimPixels = width * height * 0.005; // Minimum rim pixels needed
      const minGreenRatio = 0.15; // At least 15% of center should be green for matcha
      
      const cupFound = 
        rimPixels > minRimPixels && 
        totalCenter > 100 && // Ensure we have enough center pixels to analyze
        centerGreenPixels > (totalCenter * minGreenRatio);

      // Improved color scoring
      const avgR = totalCenter ? sumR / totalCenter : 0;
      const avgG = totalCenter ? sumG / totalCenter : 0;
      const avgB = totalCenter ? sumB / totalCenter : 0;

      let colorScore = 0;
      if (cupFound && totalCenter > 0) {
        // Calculate greenness score based on multiple factors
        const greenDominance = Math.max(0, (avgG - avgR) + (avgG - avgB)) / 100;
        const greenIntensity = avgG / 255;
        const greenRatio = centerGreenPixels / totalCenter;
        
        // Combine factors for final score
        const rawScore = (greenDominance * 0.4 + greenIntensity * 0.3 + greenRatio * 0.3) * 10;
        colorScore = Math.max(1, Math.min(10, Math.round(rawScore)));
        
        // Bonus points for very vibrant green
        if (avgG > 120 && avgG > avgR + 40 && avgG > avgB + 50) {
          colorScore = Math.min(10, colorScore + 1);
        }
      }

      // avgColor for display
      const avgColor =
        "#" +
        [avgR, avgG, avgB]
          .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
          .join("");

      console.log('Detection results:', {
        rimPixels,
        minRimPixels,
        centerGreenPixels,
        totalCenter,
        greenRatio: centerGreenPixels / totalCenter,
        avgR, avgG, avgB,
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
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 gap-1">
          <span className="loader mb-2 animate-spin h-8 w-8 rounded-full border-4 border-green-300 border-t-green-700"></span>
          <span className="font-bold text-green-700 tracking-tight">Analyzing…</span>
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
