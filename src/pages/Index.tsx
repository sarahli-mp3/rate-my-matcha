import React from "react";
import { Link } from "react-router-dom";
import CameraMatchaApp from "@/components/CameraMatchaApp";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col text-foreground">
      <main className="grow flex flex-col items-center pt-28 gap-12">
        <div className="flex flex-row items-center gap-6">
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
      </main>
    </div>
  );
};

export default Index;
