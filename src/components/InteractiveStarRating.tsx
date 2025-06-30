
import React, { useState } from "react";

interface InteractiveStarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const InteractiveStarRating: React.FC<InteractiveStarRatingProps> = ({ 
  rating, 
  onRatingChange 
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const stars = [];
  const displayRating = hoverRating || rating;

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <div
        key={i}
        className="relative inline-block w-9 h-9 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const isHalf = (e.clientX - rect.left) / rect.width <= 0.5;
          const newRating = isHalf ? i - 0.5 : i;
          onRatingChange(newRating === rating ? 0 : newRating);
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const isHalf = (e.clientX - rect.left) / rect.width <= 0.5;
          setHoverRating(isHalf ? i - 0.5 : i);
        }}
        onMouseLeave={() => setHoverRating(0)}
      >
        <img src="/star-empty.png" alt="Empty Star" className="w-9 h-9" />
        {displayRating >= i - 0.5 && (
          <img
            src="/star-filled.png"
            alt="Filled Star"
            className="absolute top-0 left-0 w-9 h-9"
            style={{
              clipPath:
                displayRating >= i ? "inset(0 0 0 0)" : "inset(0 50% 0 0)",
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center gap-2 w-full">{stars}</div>
  );
};

export default InteractiveStarRating;
