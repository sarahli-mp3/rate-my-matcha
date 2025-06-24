import React from "react";
import { Link } from "react-router-dom";
import CameraMatchaApp from "@/components/CameraMatchaApp";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full flex flex-col text-foreground">
      {isMobile ? (
        <div className="ui-overlay-mobile flex flex-col items-center">
          <div className="flex flex-row items-center gap-4 mb-6">
            <span className="inline-flex items-center gap-2 text-2xl font-bold text-green-700 tracking-tight">
              Matcha Cup Rater
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/gallery">
                <Images className="w-4 h-4 mr-2" />
                Gallery
              </Link>
            </Button>
          </div>
          <CameraMatchaApp />
        </div>
      ) : (
        <div className="ui-overlay-desktop flex flex-col items-center">
          <div className="flex flex-row items-center gap-6 mb-8">
            <span className="inline-flex items-center gap-2 text-3xl font-bold text-green-700 tracking-tight">
              Matcha Cup Rater
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/gallery">
                <Images className="w-4 h-4 mr-2" />
                Gallery
              </Link>
            </Button>
          </div>
          <CameraMatchaApp />
        </div>
      )}
    </div>
  );
};

export default Index;
