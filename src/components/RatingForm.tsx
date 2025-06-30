
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import InteractiveStarRating from "./InteractiveStarRating";

interface RatingFormProps {
  userScore: number;
  onRatingChange: (rating: number) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const RatingForm: React.FC<RatingFormProps> = ({
  userScore,
  onRatingChange,
  comment,
  onCommentChange,
  onSave,
  isSaving,
}) => {
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="w-80 mt-3 border rounded-lg bg-background/80 p-1 flex flex-col gap-4 items-stretch">
      <div className="flex flex-col gap-1 items-center">
        <Label className="text-sm font-medium">Your matcha rating:</Label>
        <InteractiveStarRating
          rating={userScore}
          onRatingChange={onRatingChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Share your thoughts about this matcha..."
          className="min-h-[60px] resize-none"
          maxLength={500}
        />
      </div>

      <div className="flex justify-center w-full">
        {!user ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground text-center">
              Sign in to save your rating
            </p>
            <Button
              onClick={signInWithGoogle}
              className="w-40"
              variant="outline"
              size="sm"
            >
              Sign in with Google
            </Button>
          </div>
        ) : (
          <Button
            onClick={onSave}
            disabled={isSaving || userScore === 0}
            className="w-40"
            variant="image"
            size="sm"
          >
            {isSaving ? "Saving..." : "Save Rating"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RatingForm;
