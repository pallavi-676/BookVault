import React, { useState } from 'react';
import { Heart, Bookmark, Check, ChevronDown, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { clsx } from 'clsx';

export const LikeButton = ({ storyId, chapterId, initialCount = 0, variant = 'default' }) => {
  const { user, userStoryLikes, userChapterLikes, toggleStoryLike, toggleChapterLike } = useStore();
  const isStory = !!storyId;
  const targetId = storyId || chapterId;
  const isLiked = isStory ? userStoryLikes.includes(targetId) : userChapterLikes.includes(targetId);
  const [localCount, setLocalCount] = useState(initialCount);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!user) return; 
    
    if (isLiked) {
      setLocalCount(prev => prev - 1);
    } else {
      setLocalCount(prev => prev + 1);
    }
    
    if (isStory) {
      toggleStoryLike(targetId);
    } else {
      toggleChapterLike(targetId);
    }
  };

  if (variant === 'minimal') {
    return (
      <button 
        onClick={handleToggle}
        className={clsx(
          "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all group",
          isLiked 
            ? "text-red-500 bg-red-500/10" 
            : "text-on-surface-variant hover:bg-black/5"
        )}
      >
        <Heart 
          size={20} 
          className={clsx(
            "transition-all duration-300",
            isLiked ? "fill-current scale-110" : "group-hover:scale-110"
          )} 
        />
        <span className="text-[10px] font-black uppercase tracking-widest">{localCount > 0 ? localCount : 'Like'}</span>
      </button>
    );
  }

  if (variant === 'iconOnly') {
    return (
      <button 
        onClick={handleToggle}
        className={clsx(
          "p-2 rounded-full transition-all group",
          isLiked 
            ? "text-red-500 bg-red-500/10" 
            : "text-on-surface-variant hover:bg-black/5"
        )}
      >
        <Heart 
          size={18} 
          className={clsx(
            "transition-all duration-300",
            isLiked ? "fill-current scale-110" : "group-hover:scale-110"
          )} 
        />
      </button>
    );
  }

  return (
    <button 
      onClick={handleToggle}
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-bold text-sm group",
        isLiked 
          ? "bg-red-500/10 text-red-500 border border-red-500/20" 
          : "bg-bookvault-surface-low text-on-surface-variant hover:bg-black/5 border border-outline-variant/10"
      )}
    >
      <Heart 
        size={18} 
        className={clsx(
          "transition-all duration-300",
          isLiked ? "fill-current scale-110" : "group-hover:scale-110"
        )} 
      />
      <span>{localCount > 0 ? localCount.toLocaleString() : 'Like'}</span>
    </button>
  );
};

export const WishlistButton = ({ storyId }) => {
  const { user, userWishlist, toggleWishlist } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  const categories = [
    { id: 'read_later', label: 'Read Later', icon: Clock },
    { id: 'favorites', label: 'Favorites', icon: Star }
  ];

  const handleToggle = (categoryId, e) => {
    e.stopPropagation();
    if (!user) return;
    toggleWishlist(storyId, categoryId);
  };

  const isInCategory = (catId) => userWishlist.some(w => w.story_id === storyId && w.category === catId);
  const isInAny = userWishlist.some(w => w.story_id === storyId);

  return (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className={clsx(
          "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-bold text-sm",
          isInAny 
            ? "bg-bookvault-secondary/10 text-bookvault-secondary border border-bookvault-secondary/20" 
            : "bg-bookvault-surface-low text-on-surface-variant hover:bg-black/5 border border-outline-variant/10"
        )}
      >
        <Bookmark size={18} className={isInAny ? "fill-current" : ""} />
        <span>Save</span>
        <ChevronDown size={14} className={clsx("transition-transform", showMenu && "rotate-180")} />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-zinc-900 rounded-3xl shadow-premium border border-outline-variant/10 overflow-hidden z-50 p-2"
            >
              <div className="p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-3 px-2">Add to Wishlist</p>
                <div className="space-y-1">
                  {categories.map(cat => {
                    const active = isInCategory(cat.id);
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={(e) => handleToggle(cat.id, e)}
                        className={clsx(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                          active ? "bg-bookvault-secondary/10 text-bookvault-secondary" : "hover:bg-bookvault-surface-low text-on-surface-variant"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={clsx(active ? "text-bookvault-secondary" : "opacity-40")} />
                          <span className="text-sm font-bold">{cat.label}</span>
                        </div>
                        {active && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
