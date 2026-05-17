import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, PenTool, Palette, Highlighter, MessageSquarePlus, ClipboardCopy } from 'lucide-react'
import { clsx } from 'clsx'
import AdvancedColorPicker from './AdvancedColorPicker'

const SelectionToolbar = ({ position, selectedText, onAction, onClose }) => {
  const [activeStyle, setActiveStyle] = useState('highlight')
  const [activeColor, setActiveColor] = useState('rgba(244, 114, 182, 0.4)')
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  const colors = [
    { button: '#f472b6', apply: 'rgba(244, 114, 182, 0.4)' }, // Pink
    { button: '#fb923c', apply: 'rgba(251, 146, 60, 0.4)' },  // Orange
    { button: '#60a5fa', apply: 'rgba(96, 165, 250, 0.4)' },   // Blue
    { button: '#9ca3af', apply: 'rgba(156, 163, 175, 0.4)' },  // Gray
    { button: '#a7f3d0', apply: 'rgba(167, 243, 208, 0.4)' }   // Green
  ]

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText)
    onAction('copy')
    onClose()
  }

  // Styles just change modes—they do not execute. This allows users to pick a color next!
  const handleApplyStyle = (style) => {
    setActiveStyle(style)
  }

  // Colors execute instantly against whatever Style mode is currently active.
  const handleApplyColor = (color) => {
    setActiveColor(color)
    onAction('highlight', { color, style: activeStyle })
    onClose()
  }

  const isMobile = window.innerWidth < 768;
  const toolbarWidth = isMobile ? Math.min(window.innerWidth - 40, 320) : 320;

  return (
    <div 
      className="fixed z-[100] pointer-events-none transition-all duration-300"
      style={{ 
        top: Math.max(10, position.y - (isMobile ? 80 : 140)), 
        left: Math.min(window.innerWidth - (isMobile ? 280 : toolbarWidth) - 20, Math.max(20, position.x - (isMobile ? 140 : (toolbarWidth / 2)))) 
      }}
    >
      <motion.div 
        onMouseDown={(e) => e.preventDefault()}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className={clsx(
          "pointer-events-auto shadow-2xl flex flex-col overflow-hidden border border-white/20",
          isMobile 
            ? "bg-bookvault-primary text-white rounded-full px-2 animate-bounce-subtle" 
            : "bg-[#ede9fe]/95 backdrop-blur-xl rounded-2xl"
        )}
        style={{ width: isMobile ? 'auto' : toolbarWidth }}
      >
        {!isMobile ? (
          <>
            {/* Desktop View: Multi-row */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-black/5">
              <StyleBtn label="T" active={activeStyle === 'highlight'} onClick={() => handleApplyStyle('highlight')} className="bg-pink-300/40 px-1 font-serif text-lg text-black/60" />
              <StyleBtn label="T" active={activeStyle === 'underline'} onClick={() => handleApplyStyle('underline')} className="underline font-serif text-lg text-black/60" />
              <StyleBtn label="T" active={activeStyle === 'strike'} onClick={() => handleApplyStyle('strike')} className="line-through font-serif text-lg text-black/60" />
              <StyleBtn label="T" active={activeStyle === 'wavy'} onClick={() => handleApplyStyle('wavy')} className="underline decoration-wavy font-serif text-lg text-black/60" />
              <button className="text-black/40 hover:text-black/70 transition-colors">
                <Share2 size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-b border-black/5">
              {colors.map((c, i) => (
                <button key={i} onClick={() => handleApplyColor(c.apply)} className="w-6 h-3 rounded-full hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c.button }} />
              ))}
              <button onClick={() => setShowColorPicker(true)} className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition-colors">
                <Palette size={14} className="text-black/60" />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-[#e6e2fc]">
              <PenTool size={20} className="text-black/40 opacity-70" />
              <TextActionBtn label="Copy" onClick={handleCopy} />
              <TextActionBtn label={activeStyle.charAt(0).toUpperCase() + activeStyle.slice(1)} onClick={() => handleApplyColor(activeColor)} />
              <TextActionBtn label="Note" onClick={() => { onAction('note'); onClose(); }} />
              <TextActionBtn label="Dict." onClick={() => { onAction('dictionary'); onClose(); }} />
              <TextActionBtn label="More" onClick={() => { onAction('more'); onClose(); }} />
            </div>
          </>
        ) : (
          /* Mobile View: Single Row Sleek Bar */
          <div className="flex items-center gap-1 py-1 pr-2">
            <button 
               onClick={() => handleApplyColor(colors[0].apply)}
               className="p-3 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
               <Highlighter size={20} />
               <span className="text-[9px] font-black uppercase tracking-widest">Highlight</span>
            </button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button 
               onClick={() => { onAction('note'); onClose(); }}
               className="p-3 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
               <MessageSquarePlus size={20} />
               <span className="text-[9px] font-black uppercase tracking-widest">Note</span>
            </button>
            <button 
               onClick={handleCopy}
               className="p-3 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
               <ClipboardCopy size={20} />
               <span className="text-[9px] font-black uppercase tracking-widest">Copy</span>
            </button>
            <button 
               onClick={() => {
                  if (navigator.share) navigator.share({ text: selectedText });
                  onClose();
               }}
               className="p-3 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
               <Share2 size={20} />
               <span className="text-[9px] font-black uppercase tracking-widest">Share</span>
            </button>
          </div>
        )}
      </motion.div>
      {/* Tooltip Arrow for mobile */}
      {isMobile && (
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-bookvault-primary mx-auto" />
      )}

      {showColorPicker && (
        <AdvancedColorPicker 
          onClose={() => setShowColorPicker(false)}
          onSelect={(c) => handleApplyColor(c)}
        />
      )}
    </div>
  )
}

const StyleBtn = ({ label, className, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${active ? 'bg-black/5' : 'hover:bg-black/5'}`}
  >
    <span className={className}>{label}</span>
  </button>
)

const TextActionBtn = ({ label, onClick }) => (
  <button 
    onClick={onClick}
    className="text-sm font-medium text-black/80 hover:text-black transition-colors"
  >
    {label}
  </button>
)

export default SelectionToolbar
