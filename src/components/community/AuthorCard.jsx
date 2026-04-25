import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Feather, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const AuthorCard = ({ author }) => {
  const navigate = useNavigate()

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/@${author.username}`)}
      className="bg-bookvault-surface-lowest rounded-[32px] p-6 border border-outline-variant/10 shadow-sm hover:shadow-premium transition-all cursor-pointer group flex flex-col items-center text-center"
    >
      <div className="w-24 h-24 rounded-full bg-bookvault-surface-low border-4 border-bookvault-surface-lowest shadow-lg overflow-hidden mb-4 group-hover:scale-110 transition-transform">
        {author.avatar_url ? (
          <img src={author.avatar_url} className="w-full h-full object-cover" alt={author.full_name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20 bg-bookvault-surface-low">
            <Users size={40} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <h3 className="font-serif font-bold text-bookvault-primary truncate max-w-[150px]">{author.full_name}</h3>
        {author.stories_count > 0 && <CheckCircle size={14} className="text-bookvault-secondary" />}
      </div>
      <p className="text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-widest mb-4">@{author.username}</p>

      <div className="flex gap-4 mt-auto">
        <div className="text-center">
          <p className="text-xs font-bold text-bookvault-primary">{author.followers_count || 0}</p>
          <p className="text-[8px] uppercase tracking-tighter text-on-surface-variant">Followers</p>
        </div>
        <div className="w-px h-6 bg-outline-variant/20" />
        <div className="text-center">
          <p className="text-xs font-bold text-bookvault-primary">{author.stories_count || 0}</p>
          <p className="text-[8px] uppercase tracking-tighter text-on-surface-variant">Stories</p>
        </div>
      </div>

      <button className="mt-6 w-full py-2 bg-bookvault-surface-low text-bookvault-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-bookvault-primary hover:text-white transition-all">
        View Profile
      </button>
    </motion.div>
  )
}

export default AuthorCard
