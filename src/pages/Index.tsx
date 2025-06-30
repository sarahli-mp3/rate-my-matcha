
import React from "react";
import { Link } from "react-router-dom";
import CameraMatchaApp from "@/components/CameraMatchaApp";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

const Index = () => {
  const isMobile = useIsMobile();
  const bgImage = isMobile ? "/matcha-bg-mobile.png" : "/matcha-bg-desktop.png";
  const bgStyle = isMobile
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "100% auto" as const,
        backgroundPosition: "bottom center" as const,
        backgroundRepeat: "no-repeat" as const,
        imageRendering: "pixelated" as const,
      }
    : {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
        imageRendering: "pixelated" as const,
      };

  return (
    <div
      className={`min-h-screen w-full flex flex-col text-foreground ${
        isMobile ? "pb-[env(safe-area-inset-bottom,34px)]" : ""
      }`}
      style={bgStyle}
    >
      {/* Subtle Google Sign-in positioned at top right */}
      <div className="absolute top-4 right-4 z-20">
        <GoogleSignInButton />
      </div>

      {isMobile ? (
        <div className="ui-overlay-mobile flex flex-col items-center">
          <div className="flex flex-row items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-2 text-4xl font-bold tracking-tight"
              style={{ color: "#648e44" }}
            >
              Rate My Matcha
            </span>
            <Link to="/gallery" aria-label="Gallery">
              <img
                src="/matcha-cup.png"
                alt="Gallery"
                className="w-20 h-20"
                style={{ imageRendering: "pixelated", display: "block" }}
              />
            </Link>
          </div>
          <CameraMatchaApp />
        </div>
      ) : (
        <div className="ui-overlay-desktop flex flex-col items-center">
          <div className="flex flex-row items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-2 text-5xl font-bold tracking-tight"
              style={{ color: "#648e44" }}
            >
              Rate My Matcha
            </span>
            <Link to="/gallery" aria-label="Gallery">
              <img
                src="/matcha-cup.png"
                alt="Gallery"
                className="w-20 h-20"
                style={{ imageRendering: "pixelated", display: "block" }}
              />
            </Link>
          </div>
          <CameraMatchaApp />
        </div>
      )}
    </div>
  );
};

export default Index;
