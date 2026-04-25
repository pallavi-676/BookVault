import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, BookOpen, PenTool, Zap, CheckCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { clsx } from 'clsx'

const UserProfileModal = ({ onClose }) => {
  const { userStats, readingProgress, annotations } = useStore()

  // Aggregations
  const totalBooksFinished = Object.values(readingProgress).filter(p => p.percentage === 100).length
  const totalHighlightsCount = Object.values(annotations).reduce((acc, curr) => acc + curr.length, 0)
  
  const minutesRead = Math.floor((userStats?.totalReadingTimeMs || 0) / 1000 / 60)
  const hoursRead = (minutesRead / 60).toFixed(1)
  const displayTime = minutesRead > 60 ? `${hoursRead} hrs` : `${minutesRead} mins`

  const ppm = minutesRead > 0 ? ((userStats?.totalPagesRead || 0) / minutesRead).toFixed(1) : 0
  const wpm = (ppm * 250).toFixed(0) // Assume ~250 words per page industry standard

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
        <div 
          onClick={onClose}
          className="absolute inset-0 bg-bookvault-primary/20 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-bookvault-surface-lowest rounded-book shadow-premium p-8 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-2xl font-serif font-bold text-bookvault-primary">Reader Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-bookvault-surface-low rounded-full transition-colors">
              <X size={20} className="text-on-surface-variant" />
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bookvault-surface-low p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-bookvault-primary mb-2 opacity-80">
                  <Clock size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Time Read</span>
                </div>
                <div className="text-3xl font-serif font-bold text-bookvault-primary">{displayTime}</div>
              </div>
              
              <div className="bg-bookvault-surface-low p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-bookvault-primary mb-2 opacity-80">
                  <BookOpen size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pages Turned</span>
                </div>
                <div className="text-3xl font-serif font-bold text-bookvault-primary">{userStats?.totalPagesRead || 0}</div>
              </div>

              <div className="bg-bookvault-surface-low p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-bookvault-primary mb-2 opacity-80">
                  <PenTool size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Highlights</span>
                </div>
                <div className="text-3xl font-serif font-bold text-bookvault-primary">{totalHighlightsCount}</div>
              </div>

              <div className="bg-bookvault-surface-low p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-bookvault-primary mb-2 opacity-80">
                  <CheckCircle size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Finished</span>
                </div>
                <div className="text-3xl font-serif font-bold text-bookvault-primary">{totalBooksFinished}</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/20">
               <div className="flex items-center gap-2 text-bookvault-secondary mb-4">
                 <Zap size={18} />
                 <h3 className="text-sm font-bold uppercase tracking-widest text-bookvault-secondary">Reading Velocity</h3>
               </div>
               
               <div className="bg-bookvault-surface p-5 rounded-2xl relative overflow-hidden group shadow-inner border border-black/5">
                 <div className="absolute top-0 right-0 p-4 opacity-5 text-bookvault-primary group-hover:scale-110 transition-transform duration-500">
                   <Zap size={64} />
                 </div>
                 <div className="flex justify-between items-end relative z-10">
                   <div>
                     <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Estimated Speed</p>
                     <p className="text-5xl font-serif font-bold text-bookvault-primary tracking-tighter">{wpm}</p>
                     <p className="text-xs font-bold text-bookvault-secondary mt-1">Words per minute</p>
                   </div>
                   <div className="text-right">
                     <p className="text-3xl font-bold text-bookvault-primary tracking-tighter">{ppm}</p>
                     <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pages / Min</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
    </motion.div>
  )
}

export default UserProfileModal
