import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Check } from 'lucide-react'

const NoteModal = ({ isOpen, onClose, onSave, initialText = '', highlightText = '' }) => {
  const [note, setNote] = useState(initialText)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-bookvault-surface-lowest rounded-3xl shadow-premium w-full max-w-md overflow-hidden border border-outline-variant/20"
          >
            <header className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-bookvault-primary" size={20} />
                <h3 className="font-serif font-bold text-bookvault-primary">Add Annotation</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-bookvault-surface-low rounded-full transition-colors">
                <X size={20} />
              </button>
            </header>

            <div className="p-6 space-y-4">
              <div className="bg-bookvault-surface-low/50 p-4 rounded-xl italic text-xs text-on-surface-variant border-l-4 border-bookvault-primary/20">
                "{highlightText}"
              </div>
              
              <textarea 
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write your thoughts here..."
                className="w-full h-40 bg-bookvault-surface-low rounded-2xl p-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none resize-none"
              />
            </div>

            <footer className="p-6 pt-0 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 border border-outline-variant/20 text-on-surface-variant rounded-xl font-bold hover:bg-bookvault-surface-low transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { onSave(note); onClose(); }}
                className="flex-1 py-3 bg-bookvault-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-bookvault-primary-container shadow-premium transition-all"
              >
                <Check size={18} />
                <span>Save Note</span>
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default NoteModal
