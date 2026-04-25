import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, Bookmark, Highlighter, X, MapPin, MessageCircle, Trash2, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '../../store/useStore'

const ReaderSidebar = ({ isOpen, onClose, toc, onNavigate, bookId, onSearch }) => {
  const [activeTab, setActiveTab] = useState('chapters')
  const { annotations, bookmarks, removeAnnotation, removeBookmark } = useStore()

  const bookAnnotations = annotations[bookId] || []
  const bookBookmarks = bookmarks[bookId] || []

  const tabs = [
    { id: 'chapters', label: 'Outline', icon: <List size={18} /> },
    { id: 'vault', label: 'Vault', icon: <Bookmark size={18} /> },
    { id: 'search', label: 'Search', icon: <Search size={18} /> },
  ]

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim() || !onSearch) return
    setSearching(true)
    try {
      const results = await onSearch(searchQuery)
      setSearchResults(results || [])
    } finally {
      setSearching(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[70]"
          />

          {/* Sidebar */}
          <motion.div 
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-80 bg-bookvault-surface-lowest shadow-2xl z-[80] border-r border-outline-variant/10 flex flex-col pt-20"
          >
            <header className="px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold text-bookvault-primary">Manuscript Index</h3>
              <button onClick={onClose} className="p-2 hover:bg-bookvault-surface-low rounded-full transition-colors">
                <X size={20} />
              </button>
            </header>

            {/* Tabs */}
            <div className="flex px-4 gap-2 mb-6">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider",
                    activeTab === tab.id 
                      ? "bg-bookvault-primary text-white shadow-lg" 
                      : "text-on-surface-variant hover:bg-bookvault-surface-low"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-10 custom-scrollbar">
              {activeTab === 'chapters' ? (
                <div className="space-y-1">
                  {toc && toc.length > 0 ? toc.map((item) => (
                    <TOCItem 
                      key={item.id || item.href || item.location} 
                      item={item} 
                      onClick={() => { onNavigate(item.href || item.location); onClose(); }} 
                    />
                  )) : (
                    <p className="text-center py-10 text-sm opacity-40 italic">No chapters detected in this manuscript.</p>
                  )}
                </div>
              ) : activeTab === 'vault' ? (
                <div className="space-y-6">
                  <section>
                    <SectionLabel icon={<Bookmark size={14} />} label="Bookmarks" />
                    <div className="space-y-2 mt-3">
                      {bookBookmarks.length > 0 ? bookBookmarks.map((bm) => (
                        <VaultItem 
                          key={bm.id}
                          title={bm.label || `Page ${bm.location}`}
                          detail={new Date(bm.timestamp).toLocaleDateString()}
                          onClick={() => { onNavigate(bm.location); onClose(); }}
                          onDelete={(e) => { e.stopPropagation(); removeBookmark(bookId, bm.id); }}
                        />
                      )) : <p className="text-[10px] opacity-40 ml-4">No bookmarks yet.</p>}
                    </div>
                  </section>
                  <section>
                    <SectionLabel icon={<Highlighter size={14} />} label="Highlights & Notes" />
                    <div className="space-y-3 mt-3">
                      {bookAnnotations.length > 0 ? bookAnnotations.map((ann) => (
                        <HighlightItem 
                          key={ann.id}
                          ann={ann}
                          onClick={() => { onNavigate(ann.location); onClose(); }}
                          onDelete={(e) => { e.stopPropagation(); removeAnnotation(bookId, ann.id); }}
                        />
                      )) : <p className="text-[10px] opacity-40 ml-4">No annotations yet.</p>}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleSearch} className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" size={16} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search inside manuscript..." 
                      className="w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none"
                    />
                  </form>
                  <div className="space-y-4">
                    {searching ? (
                      <div className="flex flex-col items-center py-10 gap-3 opacity-40">
                         <div className="w-6 h-6 border-2 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin" />
                         <p className="text-[10px] uppercase font-bold tracking-widest">Searching strings...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                       searchResults.map((res, i) => (
                          <button 
                            key={i}
                            onClick={() => { onNavigate(res.cfi || res.page); onClose(); }}
                            className="w-full text-left p-4 rounded-xl bg-bookvault-surface-low/50 hover:bg-bookvault-surface-low border border-outline-variant/5 transition-all outline-none focus:ring-2 focus:ring-bookvault-primary/20"
                          >
                             <p className="text-[10px] font-bold text-bookvault-primary uppercase mb-2">Result {i + 1} • {res.page ? `Page ${res.page}` : 'Chapter'}</p>
                             <p className="text-xs text-on-surface line-clamp-3 leading-relaxed" 
                                dangerouslySetInnerHTML={{ __html: res.excerpt.replace(new RegExp(`(${searchQuery})`, 'gi'), '<mark class="bg-amber-200">$1</mark>') }} 
                             />
                          </button>
                       ))
                    ) : searchQuery ? (
                       <p className="text-center py-10 text-sm opacity-40 italic">No matches found for "{searchQuery}"</p>
                    ) : (
                       <div className="text-center py-10 opacity-20 flex flex-col items-center gap-4">
                          <Search size={32} />
                          <p className="text-xs font-serif italic">The scrolls are vast... enter a keyword to begin.</p>
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const SectionLabel = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
    {icon}
    <span>{label}</span>
  </div>
)

const TOCItem = ({ item, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full text-left px-4 py-3 rounded-lg hover:bg-bookvault-surface-low transition-colors group"
  >
    <p className="text-sm text-bookvault-primary font-serif group-hover:translate-x-1 transition-transform">{item.label}</p>
  </button>
)

const VaultItem = ({ title, detail, onClick, onDelete }) => (
  <div className="relative group/item">
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-bookvault-surface-low/50 hover:bg-bookvault-surface-low border border-outline-variant/5 transition-all"
    >
      <div className="w-8 h-8 rounded-full bg-bookvault-primary/10 flex items-center justify-center text-bookvault-primary">
        <MapPin size={14} />
      </div>
      <div className="text-left flex-1">
        <p className="text-xs font-bold text-bookvault-primary">{title}</p>
        <p className="text-[10px] opacity-60 uppercase">{detail}</p>
      </div>
    </button>
    <button 
      onClick={onDelete}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500/10 rounded-lg"
    >
      <Trash2 size={14} />
    </button>
  </div>
)

const HighlightItem = ({ ann, onClick, onDelete }) => (
  <div className="relative group/item">
    <button 
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-bookvault-surface-low/50 hover:bg-bookvault-surface-low border-l-4 transition-all text-left block"
      style={{ borderLeftColor: ann.color }}
    >
      <p className="text-xs text-on-surface line-clamp-2 italic mb-2 pr-6">"{ann.text}"</p>
      {ann.note && (
        <div className="flex items-start gap-2 bg-white/40 p-2 rounded-lg mt-2">
          <MessageCircle size={12} className="mt-0.5 opacity-40" />
          <p className="text-[10px] opacity-80">{ann.note}</p>
        </div>
      )}
      <div className="mt-3 opacity-40 text-[9px] uppercase font-bold pr-6">
        <span>Location {ann.location}</span>
      </div>
    </button>
    <button 
      onClick={onDelete}
      className="absolute right-2 top-2 p-1.5 text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500/10 rounded-lg"
    >
      <Trash2 size={14} />
    </button>
  </div>
)

export default ReaderSidebar
