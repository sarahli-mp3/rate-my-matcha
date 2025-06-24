import React from "react";
import MatchaGallery from "@/components/MatchaGallery";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";

const Gallery = () => {
  const isMobile = useIsMobile();
  const bgImage = isMobile ? "/gallery-mobile.png" : "/gallery-desktop.png";
  const bgStyle: React.CSSProperties = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    imageRendering: "pixelated",
  };
  return (
    <div
      className="min-h-screen w-full flex flex-col text-foreground"
      style={bgStyle}
    >
      <header
        className="py-6 px-10 border-b flex items-center space-x-4"
        style={{ backgroundColor: "#bfd2a0" }}
      >
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <span
          className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight"
          style={{ color: "#648e44" }}
        >
          Matcha Gallery
        </span>
        <span className="ml-auto text-sm text-muted-foreground hidden md:block">
          Your collection of rated matcha cups
        </span>
      </header>

      <main className="grow flex flex-col py-8">
        <MatchaGallery />
      </main>

      <footer className="py-2 px-4 text-xs text-center text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Matcha Cup Rater &mdash; built with
        Love &amp; Lovable.
      </footer>
    </div>
  );
};

export default Gallery;
