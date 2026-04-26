import React from 'react'
import { Book, Search, Upload, LogOut, User, Moon, Sun, Feather, Bell, MessageSquare, Check, Menu, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatRelativeTime } from '../../utils/dateUtils'
import { clsx } from 'clsx'

const Navbar = ({ onUploadClick }) => {
  const { 
    logout, theme, setTheme, searchQuery, setSearchQuery, userProfile,
    searchGlobal, globalSearchResults, isSearchingGlobal,
    notifications, fetchNotifications, markNotificationRead, unreadNotificationsCount,
    markAllNotificationsRead, isSidebarOpen, setSidebarOpen
  } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [showNotifications, setShowNotifications] = React.useState(false)
  const [isMobileSearchOpen, setMobileSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchGlobal(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchGlobal])

  React.useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 glass z-50 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-shrink-0">
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 hover:bg-bookvault-surface-low rounded-xl text-on-surface-variant transition-colors"
        >
          <motion.div animate={{ rotate: isSidebarOpen ? 90 : 0 }}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.div>
        </button>
        
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-bookvault-primary-container rounded-lg flex items-center justify-center text-white shadow-premium group-hover:scale-105 transition-transform">
            <Book size={20} />
          </div>
          <span className="text-lg md:text-xl font-serif font-bold tracking-tight text-bookvault-primary hidden sm:block">
            BookVault
          </span>
        </div>
      </div>

      <div className={clsx(
        "flex-1 md:max-w-md mx-2 md:mx-8 flex-shrink-0 transition-all duration-300",
        isMobileSearchOpen ? "absolute inset-0 bg-bookvault-surface z-[70] px-4 flex items-center" : "hidden md:block"
      )}>
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-bookvault-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder={location.pathname === '/discover' ? "Search global authors & stories..." : "Search your library..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bookvault-surface-low border-none rounded-full py-2.5 pl-10 pr-10 text-sm text-bookvault-primary placeholder:text-bookvault-primary/50 focus:ring-1 focus:ring-bookvault-primary/20 bg-opacity-50 transition-all outline-none"
            autoFocus={isMobileSearchOpen}
          />
          {isMobileSearchOpen && (
            <button 
              onClick={() => setMobileSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            >
              <X size={18} />
            </button>
          )}

          {/* Global Search Results Dropdown */}
          <AnimatePresence>
            {searchQuery.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-bookvault-surface-lowest rounded-3xl shadow-premium border border-outline-variant/10 overflow-hidden z-[60]"
              >
                <div className="p-4">
                  {isSearchingGlobal ? (
                    <div className="p-4 text-center">
                      <div className="w-5 h-5 border-2 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">Searching Community...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Author Results */}
                      {globalSearchResults.authors.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-3 px-2">Authors</p>
                          <div className="space-y-1">
                            {(globalSearchResults?.authors || []).map(author => (
                              <button
                                key={author.id}
                                onClick={() => {
                                  navigate(`/@${author.username}`);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-bookvault-surface-low rounded-xl transition-colors text-left group"
                              >
                                <div className="w-8 h-8 rounded-full bg-bookvault-surface-low overflow-hidden border border-outline-variant/10">
                                  {author.avatar_url ? <img src={author.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto mt-2" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-bookvault-primary group-hover:text-bookvault-secondary transition-colors">{author.full_name}</p>
                                  <p className="text-[10px] text-on-surface-variant opacity-60">@{author.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Story Results */}
                      {globalSearchResults.stories.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-3 px-2">Stories</p>
                          <div className="space-y-1">
                            {(globalSearchResults?.stories || []).map(story => (
                              <button
                                key={story.id}
                                onClick={() => {
                                  navigate(`/@${story.profiles?.username}/${story.slug}`);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-bookvault-surface-low rounded-xl transition-colors text-left group"
                              >
                                <div className="w-8 h-12 bg-bookvault-surface-low rounded-lg overflow-hidden flex-shrink-0">
                                  {story.cover_url && <img src={story.cover_url} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-bookvault-primary truncate group-hover:text-bookvault-secondary transition-colors">{story.title}</p>
                                  <p className="text-[10px] text-on-surface-variant opacity-60 truncate">by {story.profiles?.full_name}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {globalSearchResults.authors.length === 0 && globalSearchResults.stories.length === 0 && (
                        <div className="p-4 text-center">
                          <p className="text-xs font-medium text-on-surface-variant opacity-60 italic">No community matches found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {userProfile?.role === 'author' && (
          <button
            onClick={() => navigate('/author')}
            className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-bookvault-surface-low text-bookvault-primary border border-bookvault-primary/20 rounded-full text-sm font-medium hover:bg-bookvault-primary hover:text-white transition-all shadow-sm"
          >
            <Feather size={18} />
            <span className="hidden md:inline">Write</span>
          </button>
        )}

        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-bookvault-primary text-white rounded-full text-sm font-medium hover:bg-bookvault-primary-container transition-all shadow-premium"
        >
          <Upload size={18} />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden p-2 hover:bg-bookvault-surface-low rounded-full transition-colors text-on-surface-variant"
        >
          <Search size={20} />
        </button>

        <div className="h-8 w-px bg-outline-variant/30 ml-2 hidden lg:block" />

        <div className="flex items-center gap-1 md:gap-4">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="hidden sm:flex p-2 hover:bg-bookvault-surface-low rounded-full transition-colors relative group"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-on-surface-variant group-hover:text-bookvault-primary" />
            ) : (
              <Sun size={20} className="text-on-surface-variant group-hover:text-bookvault-primary" />
            )}
          </button>

          <button
            onClick={() => navigate('/messages')}
            className={clsx(
              "p-2 hover:bg-bookvault-surface-low rounded-full transition-colors relative group",
              location.pathname === '/messages' && "text-bookvault-primary bg-bookvault-primary/5"
            )}
            title="Messages"
          >
            <MessageSquare size={20} className="text-on-surface-variant group-hover:text-bookvault-primary" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={clsx(
                "p-2 hover:bg-bookvault-surface-low rounded-full transition-colors relative group",
                showNotifications && "text-bookvault-primary bg-bookvault-primary/5"
              )}
              title="Notifications"
            >
              <Bell size={20} className="text-on-surface-variant group-hover:text-bookvault-primary" />
              {unreadNotificationsCount > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-bookvault-secondary rounded-full border-2 border-white dark:border-zinc-900" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-4 w-[calc(100vw-32px)] md:w-[380px] bg-bookvault-surface-lowest rounded-[32px] shadow-2xl border border-outline-variant/10 overflow-hidden z-[100]"
                >
                  <div className="p-6 border-b border-outline-variant/5 flex items-center justify-between">
                    <h3 className="font-serif font-bold text-bookvault-primary text-lg">Resonance</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{unreadNotificationsCount} New</span>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto">
                    {notifications && notifications.length > 0 ? (
                      <div className="divide-y divide-outline-variant/5">
                        {notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            onClick={() => {
                              markNotificationRead(notification.id);
                              setShowNotifications(false);
                              
                              if (notification.type === 'follow') {
                                navigate(`/@${notification.actor?.username}`);
                              } else if (notification.type === 'message') {
                                navigate('/messages');
                              } else if (notification.story_id) {
                                // Smart Navigation: If it's a chapter or comment interaction, go to the Reader
                                if (notification.chapter_id) {
                                  navigate(`/read/${notification.story_id}/${notification.chapter_id}`);
                                } else {
                                  navigate(`/story/${notification.story_id}`);
                                }
                              }
                            }}
                            className={clsx(
                              "p-5 flex items-start gap-4 hover:bg-bookvault-surface-low transition-colors group relative cursor-pointer",
                              !notification.is_read && "bg-bookvault-primary/5"
                            )}
                          >
                            <div className="w-10 h-10 rounded-xl bg-bookvault-surface-low overflow-hidden border border-outline-variant/10 flex-shrink-0">
                               {notification.actor?.avatar_url ? (
                                 <img src={notification.actor.avatar_url} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-outline-variant opacity-20"><User size={18} /></div>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-bookvault-primary leading-snug">
                                <span className="font-bold">
                                  {notification.actor?.full_name || (notification.actor?.username ? `@${notification.actor.username}` : 'A Reader')}
                                </span>
                                {notification.type === 'like_story' && (
                                  <> has liked your story <span className="font-bold italic text-bookvault-secondary">"{notification.stories?.title}"</span></>
                                )}
                                {notification.type === 'like_chapter' && (
                                  <> has liked chapter <span className="font-bold">"{notification.chapters?.title}"</span> of your story <span className="font-bold italic text-bookvault-secondary">"{notification.stories?.title}"</span></>
                                )}
                                {notification.type === 'new_chapter' && (
                                  <> published a new chapter <span className="font-bold">"{notification.chapters?.title}"</span> of your story <span className="font-bold italic text-bookvault-secondary">"{notification.stories?.title}"</span></>
                                )}
                                {notification.type === 'chapter_update' && (
                                  <> updated the chapter <span className="font-bold">"{notification.chapters?.title}"</span> of <span className="font-bold italic text-bookvault-secondary">"{notification.stories?.title}"</span></>
                                )}
                                {notification.type === 'follow' && ' has started following you'}
                                {notification.type === 'comment' && (
                                  <> has commented on your story <span className="font-bold">"{notification.stories?.title}"</span>: <span className="italic opacity-80 line-clamp-1 block mt-1 text-xs">"{notification.comments?.content}"</span></>
                                )}
                                {notification.type === 'reply' && ' has liked your comment'} 
                                {notification.type === 'message' && ' sent you a message'}
                                {notification.type === 'rating' && ' gave your story a rating'}
                                {notification.type === 'favorite' && (
                                  <> added your story <span className="font-bold italic text-bookvault-secondary">"{notification.stories?.title}"</span> to their favorites</>
                                )}
                              </p>
                              <p className="text-[10px] text-on-surface-variant opacity-40 mt-1 uppercase tracking-widest tabular-nums">
                                {formatRelativeTime(notification.created_at)} ago
                              </p>
                            </div>
                            {!notification.is_read && (
                               <button 
                                 onClick={() => markNotificationRead(notification.id)}
                                 className="opacity-0 group-hover:opacity-100 p-2 hover:bg-bookvault-primary/10 text-bookvault-primary rounded-lg transition-all"
                                 title="Mark as read"
                               >
                                  <Check size={14} />
                               </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                         <Bell size={40} strokeWidth={1} />
                         <p className="font-serif italic text-sm">Quiet in the archive...</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-bookvault-surface-low/50 text-center">
                     <button 
                        onClick={() => markAllNotificationsRead()}
                        className="text-[10px] font-black uppercase tracking-widest text-bookvault-primary hover:underline"
                     >
                       Clear all notifications
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile button — shows avatar if set */}
          <button
            onClick={() => {
              if (userProfile?.role === 'author' && userProfile?.username) {
                navigate(`/@${userProfile.username}`);
              } else {
                navigate('/profile');
              }
            }}
            className="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden hover:ring-2 hover:ring-bookvault-primary transition-all flex items-center justify-center bg-bookvault-surface-low shadow-sm"
            title={userProfile?.role === 'author' ? "Author Profile" : "My Settings"}
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover block"
              />
            ) : (
              <User size={20} className="text-on-surface-variant" />
            )}
          </button>

          <button
            onClick={logout}
            className="hidden md:p-2 hover:bg-bookvault-surface-low rounded-full transition-colors text-red-500/70 hover:text-red-600 sm:block"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
