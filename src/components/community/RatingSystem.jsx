import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { clsx } from 'clsx';

export const RatingSystem = ({ storyId, initialAverage = 0, initialCount = 0 }) => {
  const { user, userRatings = {}, submitRating } = useStore();
  const userRating = userRatings?.[storyId] || 0;
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (rating) => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      await submitRating(storyId, rating);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={clsx("flex flex-col gap-2 transition-opacity", submitting && "opacity-50")}>
      <div className="flex items-center gap-4">
        {/* Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRate(star)}
              className={clsx(
                "transition-all duration-200 focus:outline-none",
                user ? "cursor-pointer" : "cursor-default opacity-50"
              )}
            >
              <Star 
                size={24} 
                className={clsx(
                  "transition-all",
                  (hoverRating || userRating) >= star 
                    ? "text-yellow-400 fill-current scale-110" 
                    : "text-on-surface-variant/20"
                )} 
              />
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-2">
           <span className="text-xl font-serif font-black text-bookvault-primary">{initialAverage.toFixed(1)}</span>
           <div className="h-4 w-px bg-outline-variant/20" />
           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{initialCount} Ratings</span>
        </div>
      </div>
      
      {user && (
        <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">
          {userRating > 0 ? `Your rating: ${userRating} stars` : 'Rate this story'}
        </p>
      )}
    </div>
  );
};
