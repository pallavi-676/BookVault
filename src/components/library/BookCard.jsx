import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Clock, Book, Trash2, MoreVertical, CheckCircle, Info, FileText } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { clsx } from 'clsx'

const BookCard = ({ book, progress = 0, onClick }) => {
  const { removeBook, updateProgress } = useStore()
  const [showMenu, setShowMenu] = useState(false)

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to remove "${book.title}" from your library?`)) {
      removeBook(book.id)
    }
    setShowMenu(false)
  }

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="bg-bookvault-surface-lowest rounded-2xl md:rounded-book p-2 sm:p-4 shadow-premium cursor-pointer group flex flex-col h-full relative"
    >
      {/* Action Menu Trigger */}
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md",
            showMenu ? "bg-bookvault-primary text-white" : "bg-black/5 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:bg-black/10"
          )}
        >
          <MoreVertical size={16} />
        </button>

        {showMenu && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-premium border border-black/5 py-2 z-50 overflow-hidden">
            <MenuAction icon={<Info size={14} />} label="View Details" onClick={onClick} />
            <MenuAction 
              icon={<CheckCircle size={14} />} 
              label="Mark as Finished" 
              onClick={(e) => { e.stopPropagation(); updateProgress(book.id, { percentage: 100 }); setShowMenu(false); }} 
            />
            <div className="h-px bg-black/5 my-1" />
            <MenuAction icon={<Trash2 size={14} />} label="Delete Permanently" onClick={handleDelete} variant="danger" />
          </div>
        )}
      </div>

      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 md:mb-4 bg-bookvault-surface-low">

        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <Book size={48} className="text-outline-variant mb-2 opacity-30" />
            <span className="text-xs font-sans text-on-surface-variant line-clamp-2">{book.title}</span>
          </div>
        )}
        
        {/* Progress Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex justify-between items-end backdrop-blur-sm bg-black/5">
          <div className="flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-full">
            <Clock size={12} className="text-bookvault-primary" />
            <span className="text-[10px] font-bold text-bookvault-primary">{Math.round(progress)}%</span>
          </div>
          {book.bookmarked && (
            <div className="bg-bookvault-secondary px-1.5 py-1.5 rounded-full text-white shadow-lg">
              <Bookmark size={12} fill="currentColor" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 px-1 md:px-0">
        <h3 className="text-[11px] md:text-sm font-serif font-bold text-bookvault-primary line-clamp-2 mb-0.5 group-hover:text-bookvault-secondary transition-colors leading-tight">
          {book.title}
        </h3>
        <p className="text-[9px] md:text-[10px] font-sans text-on-surface-variant font-medium flex items-center gap-1.5 opacity-70">
          <span className="truncate max-w-[100px]">{book.author || 'Unknown Author'}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
          <span className="uppercase tracking-widest text-[9px]">{book.type || 'Doc'}</span>
        </p>
        
        <div className="mt-4 pt-2 border-t border-outline-variant/10">
          <div className="flex justify-between items-center mb-1.5">
             <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Progress</span>
             <span className="text-[10px] font-bold text-bookvault-secondary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-bookvault-surface-low rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-bookvault-secondary to-bookvault-primary transition-all duration-1000 ease-out"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const MenuAction = ({ icon, label, onClick, variant = 'default' }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    className={clsx(
      "w-full flex items-center gap-3 px-4 py-2 text-xs font-bold transition-colors",
      variant === 'danger' ? "text-red-500 hover:bg-red-50" : "text-on-surface-variant hover:bg-black/5"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
)

export default BookCard
