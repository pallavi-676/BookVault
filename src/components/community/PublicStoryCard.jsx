import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Tag, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const PublicStoryCard = ({ story }) => {
  const navigate = useNavigate()

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(`/@${story.profiles?.username}/${story.slug}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-lg mb-4 bg-bookvault-surface-low group-hover:shadow-premium transition-all">
        {story.cover_url ? (
          <img src={story.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={story.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20">
            <BookOpen size={48} />
          </div>
        )}
        
        {/* Overlay info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
           <p className="text-white font-serif font-bold text-lg mb-1 line-clamp-2">{story.title}</p>
           <p className="text-white/60 text-xs font-medium">By {story.profiles?.full_name}</p>
        </div>

        {/* Status Tag */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[8px] font-black uppercase tracking-widest text-bookvault-primary shadow-sm">
           {story.genre}
        </div>
      </div>

      <div className="px-1">
        <h4 className="font-serif font-bold text-bookvault-primary truncate group-hover:text-bookvault-secondary transition-colors">{story.title}</h4>
        <div className="flex items-center gap-3 mt-1.5 opacity-60">
           <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-bookvault-surface-low overflow-hidden flex-shrink-0">
                 {story.profiles?.avatar_url ? <img src={story.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={8} className="m-auto mt-1" />}
              </div>
              <span className="text-[10px] font-medium truncate max-w-[80px]">@{story.profiles?.username}</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-on-surface-variant opacity-20" />
           <span className="text-[10px] font-medium flex items-center gap-1 uppercase tracking-tighter">
              <Clock size={10} /> {story?.updated_at ? new Date(story.updated_at).toLocaleDateString() : 'Recent'}
           </span>
        </div>
      </div>
    </motion.div>
  )
}

export default PublicStoryCard
