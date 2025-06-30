
import React from "react";
import { Button } from "@/components/ui/button";

interface CameraControlsProps {
  hasCamera: boolean;
  imageDataUrl: string | null;
  step: "scanning" | "processing" | "done";
  onTakePhoto: () => void;
  onRetake: () => void;
  onUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  hasCamera,
  imageDataUrl,
  step,
  onTakePhoto,
  onRetake,
  onUploadClick,
  fileInputRef,
  onFileUpload,
}) => {
  return (
    <>
      <div className="flex gap-2 mt-4">
        <Button
          variant="image"
          size="xl"
          className="w-40"
          onClick={imageDataUrl ? onRetake : onTakePhoto}
          disabled={!imageDataUrl && (!hasCamera || step === "processing")}
        >
          {imageDataUrl ? "Retake" : "Capture"}
        </Button>
        {!imageDataUrl && (
          <Button
            variant="image"
            size="xl"
            className="w-40"
            onClick={onUploadClick}
            disabled={step === "processing"}
          >
            Upload
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileUpload}
        className="hidden"
      />
    </>
  );
};

export default CameraControls;
