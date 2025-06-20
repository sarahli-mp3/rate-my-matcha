import React from "react";
import MatchaGallery from "@/components/MatchaGallery";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Gallery = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
      <header className="py-6 px-10 border-b flex items-center space-x-4 bg-gradient-to-r from-green-100 to-green-50">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <span className="inline-flex items-center gap-2 text-3xl font-bold text-green-700 tracking-tight">
          <svg width="36" height="36" viewBox="0 0 18 18" fill="none">
            <ellipse cx="9" cy="13" rx="6" ry="3" fill="#93c47d" />
            <ellipse cx="9" cy="7" rx="5.5" ry="3.5" fill="#b6d7a8" />
            <ellipse
              cx="9"
              cy="10"
              rx="7.5"
              ry="4"
              stroke="#639c59"
              strokeWidth="1.5"
            />
          </svg>
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
