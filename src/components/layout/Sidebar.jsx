import React from 'react'
import { Library, BookOpen, CheckCircle, Heart, PlusCircle, Settings, HelpCircle, Compass, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const MenuItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
      active 
        ? "bg-bookvault-primary text-white shadow-premium scale-[1.02]" 
        : "text-on-surface-variant hover:bg-bookvault-surface-low hover:text-bookvault-primary"
    )}
  >
    <Icon size={20} className={active ? "text-white" : "group-hover:scale-110 transition-transform"} />
    <span className="text-sm font-medium">{label}</span>
  </button>
)

const Sidebar = ({ activeCategory, onCategoryChange }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { discoverData, followingAuthorsProfiles, isSidebarOpen, setSidebarOpen } = useStore()

  const handleNav = (category, path) => {
    onCategoryChange(category)
    navigate(path)
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={clsx(
        "fixed left-0 top-0 lg:top-20 bottom-0 w-64 bg-bookvault-surface border-r border-outline-variant/10 p-6 flex flex-col z-[60] transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8 lg:hidden">
          <span className="font-serif font-bold text-bookvault-primary">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-bookvault-surface-low rounded-xl">
             <X size={20} />
          </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        <MenuItem 
          icon={Compass} 
          label="Discover" 
          active={activeCategory === 'discover'} 
          onClick={() => handleNav('discover', '/discover')}
        />
        <div className="h-px bg-outline-variant/10 my-4" />
        <MenuItem 
          icon={Library} 
          label="All Books" 
          active={activeCategory === 'all'} 
          onClick={() => handleNav('all', '/dashboard')}
        />
        <MenuItem 
          icon={BookOpen} 
          label="Currently Reading" 
          active={activeCategory === 'reading'} 
          onClick={() => handleNav('reading', '/dashboard')}
        />
        <MenuItem 
          icon={CheckCircle} 
          label="Finished" 
          active={activeCategory === 'finished'} 
          onClick={() => onCategoryChange('finished')}
        />
        <MenuItem 
          icon={Heart} 
          label="Wishlist" 
          active={activeCategory === 'wishlist'} 
          onClick={() => handleNav('wishlist', '/dashboard')}
        />
        <MenuItem 
          icon={() => <span className="text-lg">❤️</span>} 
          label="Favorites" 
          active={activeCategory === 'favorites'} 
          onClick={() => handleNav('favorites', '/dashboard')}
        />
        
        <div className="pt-8 pb-4">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-outline-variant mb-4">Following</p>
          <div className="px-4 space-y-3 mb-8">
             {(followingAuthorsProfiles || []).slice(0, 5).map(author => (
                <button 
                   key={author.id}
                   onClick={() => navigate(`/@${author.username}`)}
                   className="flex items-center gap-3 w-full group overflow-hidden text-left"
                >
                   <div className="w-8 h-8 rounded-full bg-bookvault-surface-low border border-outline-variant/10 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-bookvault-primary transition-all">
                      {author.avatar_url ? <img src={author.avatar_url} className="w-full h-full object-cover" /> : <Users size={14} className="m-auto mt-2 text-on-surface-variant opacity-40" />}
                   </div>
                   <span className="text-xs font-medium text-on-surface-variant group-hover:text-bookvault-primary truncate transition-colors flex-1">
                      {author.full_name}
                   </span>
                </button>
             ))}
             {(!followingAuthorsProfiles || followingAuthorsProfiles.length === 0) && (
                <p className="text-[10px] italic text-on-surface-variant/40">You aren't following anyone yet.</p>
             )}
          </div>

          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-outline-variant mb-4">Trending Authors</p>
          <div className="px-4 space-y-3">
             {(discoverData?.trendingAuthors || []).slice(0, 3).map(author => (
                <button 
                  key={author.id}
                  onClick={() => navigate(`/@${author.username}`)}
                  className="flex items-center gap-3 w-full group overflow-hidden text-left"
                >
                   <div className="w-8 h-8 rounded-full bg-bookvault-surface-low border border-outline-variant/10 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-bookvault-primary transition-all">
                      {author.avatar_url ? <img src={author.avatar_url} className="w-full h-full object-cover" /> : <Users size={14} className="m-auto mt-2 text-on-surface-variant opacity-40" />}
                   </div>
                   <span className="text-xs font-medium text-on-surface-variant group-hover:text-bookvault-primary truncate transition-colors flex-1">
                      {author.full_name}
                   </span>
                </button>
             ))}
             {(!discoverData?.trendingAuthors || discoverData.trendingAuthors.length === 0) && (
                <p className="text-[10px] italic text-on-surface-variant/40">No authors discovered yet.</p>
             )}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-outline-variant/10 space-y-2">
        <button 
          onClick={() => navigate('/profile')}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-2 transition-colors text-sm",
            location.pathname === '/profile' ? "text-bookvault-primary font-bold" : "text-on-surface-variant hover:text-bookvault-primary"
          )}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button 
          onClick={() => navigate('/contact')}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-2 transition-colors text-sm",
            location.pathname === '/contact' ? "text-bookvault-primary font-bold" : "text-on-surface-variant hover:text-bookvault-primary"
          )}
        >
          <HelpCircle size={18} />
          <span>Help & Support</span>
        </button>
      </div>
    </aside>
    </>
  )
}

export default Sidebar
