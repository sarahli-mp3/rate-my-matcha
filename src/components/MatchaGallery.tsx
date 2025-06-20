import React, { useEffect, useState } from "react";
import { getAllMatchaRatings } from "@/supabase/matcha";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type MatchaRating = {
  id: number;
  image_url: string;
  ai_score: number;
  user_score: number;
  comment: string | null;
  created_at: string;
};

const MatchaGallery: React.FC = () => {
  const [ratings, setRatings] = useState<MatchaRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const data = await getAllMatchaRatings();
        if (data) {
          setRatings(data);
        } else {
          setError("Failed to load matcha ratings");
        }
      } catch (err) {
        setError("Error loading matcha ratings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No matcha ratings yet</p>
          <p className="text-sm">Start by rating your first matcha cup!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {ratings.map((rating) => (
          <div
            key={rating.id}
            className="aspect-square relative group overflow-hidden rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src={rating.image_url}
              alt="Matcha cup"
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay with scores */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 flex items-end justify-between">
              <Badge
                variant="outline"
                className="bg-black/40 text-white border-white/20 backdrop-blur-sm text-xs"
              >
                AI: {rating.ai_score.toFixed(1)}/5
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white text-black font-semibold text-xs"
              >
                {rating.user_score.toFixed(1)}/5
              </Badge>
            </div>

            {/* Comment overlay on hover */}
            {rating.comment && (
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <p className="text-white text-sm text-center line-clamp-4">
                  {rating.comment}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchaGallery;
