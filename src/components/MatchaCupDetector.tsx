
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

// Naive cup+matcha detector
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

      // 1. Very primitive cup detection:
      //    Look for a large bright ellipse (the cup rim) with green in the center.
      //    (In real apps, use ML; here, just color math.)

      // Rim detection: search for a bright (almost white) ellipse in the central 80% region
      let rimPixels = 0;
      let centerGreenPixels = 0;
      let totalCenter = 0;
      let sumR = 0, sumG = 0, sumB = 0;
      let centerRadius = Math.min(width, height) * 0.23;

      const cx = width / 2, cy = height / 2;
      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const dx = x - cx, dy = y - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const idx = (y * width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];

          // Rim: bright area in 80%+ of the image width, within a ring 
          if (
            d > centerRadius * 0.9 &&
            d < centerRadius * 1.25 &&
            grayscale(r, g, b) > 190 &&
            a > 210
          ) {
            rimPixels++;
          }

          // Center: inside central region; count only for green analysis
          if (d < centerRadius * 0.85 && a > 220) {
            sumR += r;
            sumG += g;
            sumB += b;
            totalCenter++;
            // Consider it matcha if green is dominant and above threshold
            if (g > 100 && g > r && g > b && r - b < 50) {
              centerGreenPixels++;
            }
          }
        }
      }

      // Define cupFound if we found enough "rim" pixels and green center (very rough)
      const cupFound =
        rimPixels > (width * height * 0.0025) &&
        centerGreenPixels > (totalCenter * 0.1);
      // Color rating by greenness in center (average color in Lab could be used, but let's use relative G here as a stand-in)
      const avgR = totalCenter ? sumR / totalCenter : 0;
      const avgG = totalCenter ? sumG / totalCenter : 0;
      const avgB = totalCenter ? sumB / totalCenter : 0;

      // "Matcha Greenness" Score: higher G, lower B and closer R, best is a lively green.
      let colorScore = 0;
      if (cupFound) {
        // Score: purely color math, ballpark estimation
        colorScore = Math.max(
          1,
          Math.round(
            10 *
              ((avgG - avgR * 0.8 - avgB * 0.8) / 100 +
                (centerGreenPixels / (totalCenter || 1)) * 0.7)
          )
        );
        colorScore = Math.min(10, Math.max(1, colorScore));
      }

      // avgColor—show for fun as circle swatch
      const avgColor =
        "#" +
        [avgR, avgG, avgB]
          .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
          .join("");

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
        // Add DL: small timeout for UX
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
