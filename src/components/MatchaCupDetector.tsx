import React, { useEffect, useRef, useState } from "react";

interface CupDetectionResult {
  cupFound: boolean;
  colorScore: number; // 0 - 10
  avgColor: string; // e.g., "#aabb77"
}

type Props = {
  imageDataUrl: string;
  onResult: (result: CupDetectionResult) => void;
  onRetake: () => void;
};

const grayscale = (r: number, g: number, b: number) =>
  Math.round(0.299 * r + 0.587 * g + 0.114 * b);

const detectCupAndMatchaColor = async (
  imageDataUrl: string
): Promise<CupDetectionResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return resolve({ cupFound: false, colorScore: 0, avgColor: "#888888" });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const { data, width, height } = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const cx = width / 2;
      const cy = height / 2;
      const centerRadius = Math.min(width, height) * 0.25; // even larger center

      let rimPixels = 0;
      let centerGreenPixels = 0;
      let sumR = 0,
        sumG = 0,
        sumB = 0;
      let totalCenter = 0;

      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const dx = x - cx,
            dy = y - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const idx = (y * width + x) * 4;
          const r = data[idx],
            g = data[idx + 1],
            b = data[idx + 2],
            a = data[idx + 3];

          if (a < 80) continue; // allow very transparent pixels

          // Looser green definition: allow more yellow/gray/bright
          if (d < centerRadius) {
            sumR += r;
            sumG += g;
            sumB += b;
            totalCenter++;

            if (
              g > 60 &&
              g > r - 10 && // allow yellowish
              g > b - 10 && // allow grayish
              r < 230 &&
              b < 210
            ) {
              centerGreenPixels++;
            }
          }
        }
      }

      const minGreenRatio = 0.04; // much lower green ratio

      const avgR = totalCenter ? sumR / totalCenter : 0;
      const avgG = totalCenter ? sumG / totalCenter : 0;
      const avgB = totalCenter ? sumB / totalCenter : 0;
      console.log("Matcha avgColor:", {
        r: Math.round(avgR),
        g: Math.round(avgG),
        b: Math.round(avgB),
      });

      const avgColor =
        "#" +
        [avgR, avgG, avgB]
          .map((v) =>
            Math.round(Math.max(0, Math.min(255, v)))
              .toString(16)
              .padStart(2, "0")
          )
          .join("");

      // Accept as cup if there is any significant greenish area in the center
      const cupFound =
        centerGreenPixels > totalCenter * minGreenRatio && totalCenter > 50;

      if (!cupFound) {
        return resolve({ cupFound: false, colorScore: 0, avgColor });
      }

      function rgbToHsv(r: number, g: number, b: number) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b),
          min = Math.min(r, g, b);
        let h = 0,
          s = max === 0 ? 0 : (max - min) / max,
          v = max;
        if (max !== min) {
          switch (max) {
            case r:
              h = (g - b) / (max - min) + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / (max - min) + 2;
              break;
            case b:
              h = (r - g) / (max - min) + 4;
              break;
          }
          h *= 60;
        }
        return { h, s, v };
      }

      function hsvDistance(
        a: { h: number; s: number; v: number },
        b: { h: number; s: number; v: number }
      ) {
        const hueDiff =
          Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180; // scaled 0–1
        const satDiff = Math.abs(a.s - b.s);
        const valDiff = Math.abs(a.v - b.v);

        return (hueDiff * 0.4 + satDiff * 0.4 + valDiff * 0.2) * 100; // weighted for matcha perception
      }

      // Convert your detected average RGB to HSV
      const avgHSV = rgbToHsv(avgR, avgG, avgB);

      // Define ideal matcha HSVs
      const idealHSVColors = [
        { h: 100, s: 0.6, v: 0.75 },
        { h: 105, s: 0.65, v: 0.7 },
        { h: 110, s: 0.55, v: 0.78 },
        { h: 115, s: 0.6, v: 0.68 },
      ];

      // Compute HSV-based distances
      const distances = idealHSVColors.map((ideal) =>
        hsvDistance(avgHSV, ideal)
      );

      const minDistance = Math.min(...distances);
      console.log("Matcha minDistance:", minDistance);
      // Non-linear scoring: loose for high scores, strict for low
      let rawScore;
      if (minDistance <= 13) {
        rawScore = 5 - (minDistance / 13) * 0.5;
      } else if (minDistance <= 16) {
        rawScore = 4.5 - ((minDistance - 13) / 3) * 1;
      } else if (minDistance <= 20) {
        rawScore = 3.5 - ((minDistance - 16) / 4) * 0.5;
      } else if (minDistance <= 30) {
        // 3 to 1, linear drop
        rawScore = 3 - ((minDistance - 20) / 10) * 2;
      } else {
        rawScore = 0;
      }
      const colorScore = Math.max(0, Math.min(5, Math.round(rawScore * 2) / 2));

      resolve({
        cupFound: true,
        colorScore,
        avgColor,
      });
    };
    img.src = imageDataUrl;
  });
};

const MatchaCupDetector: React.FC<Props> = ({
  imageDataUrl,
  onResult,
  onRetake,
}) => {
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
        className={
          loading
            ? "opacity-40 blur-sm grayscale"
            : "object-cover w-full h-full"
        }
      />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 gap-1">
          <span className="loader mb-2 animate-spin h-8 w-8 rounded-full border-4 border-green-300 border-t-green-700"></span>
          <span className="font-bold text-green-700 tracking-tight">
            Analyzing…
          </span>
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
