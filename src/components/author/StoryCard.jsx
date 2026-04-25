import React from 'react'
import { Calendar, Tag, MoreVertical, Edit2, Trash2, Globe, Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

const StoryCard = ({ story, onEdit, onDelete, onToggleVisibility, onManage }) => {
  const isPublished = story.visibility === 'published'

  return (
    <div className="bg-bookvault-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all group">
      <div className="flex flex-col md:flex-row h-full">
        {/* Cover Image */}
        <div className="w-full md:w-48 h-64 md:h-auto relative bg-bookvault-surface-low overflow-hidden">
          {story.coverUrl ? (
            <img 
              src={story.coverUrl} 
              alt={story.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant/50">
              <span className="text-4xl font-serif">A</span>
              <span className="text-[10px] uppercase tracking-widest mt-2">No Cover</span>
            </div>
          )}
          
          {/* Badge */}
          <div className="absolute top-3 left-3">
            <span className={clsx(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md",
              isPublished 
                ? "bg-emerald-500/90 text-white" 
                : "bg-amber-500/90 text-white"
            )}>
              {story.visibility}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-bookvault-primary line-clamp-1">{story.title}</h3>
                {story.subtitle && (
                  <p className="text-sm text-on-surface-variant line-clamp-1 mt-0.5">{story.subtitle}</p>
                )}
              </div>
              
              <div className="relative group/menu">
                <button className="p-2 hover:bg-bookvault-surface-low rounded-full transition-colors text-on-surface-variant">
                  <MoreVertical size={20} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-bookvault-surface-lowest border border-outline-variant/30 rounded-xl shadow-premium opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden">
                  <button 
                    onClick={() => onEdit(story)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-bookvault-surface-low flex items-center gap-3"
                  >
                    <Edit2 size={16} /> Edit Details
                  </button>
                  <button 
                    onClick={() => onToggleVisibility(story)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-bookvault-surface-low flex items-center gap-3"
                  >
                    {isPublished ? <EyeOff size={16} /> : <Eye size={16} />} 
                    {isPublished ? 'Save as Draft' : 'Publish Story'}
                  </button>
                  <div className="h-px bg-outline-variant/30" />
                  <button 
                    onClick={() => onDelete(story.id)}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Trash2 size={16} /> Delete Story
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-2 py-1 bg-bookvault-primary/5 text-bookvault-primary rounded-md text-[10px] font-bold uppercase tracking-wider">
                <Tag size={12} /> {story.genre}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-outline-variant/10 text-on-surface-variant rounded-md text-[10px] font-bold uppercase tracking-wider">
                <Globe size={12} /> {story.language}
              </span>
            </div>

            <p className="mt-4 text-sm text-on-surface-variant/80 line-clamp-2 italic leading-relaxed">
              "{story.description}"
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-widest">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} /> Updated {new Date(story.updatedAt).toLocaleDateString()}
            </span>
            <button 
              onClick={() => onManage(story.id)}
              className="text-bookvault-primary hover:text-bookvault-primary-container transition-colors"
            >
              Manage Story →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryCard
