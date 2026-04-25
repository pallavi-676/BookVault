import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Feather, CheckCircle, BookOpen, Send, X, AlertCircle, Info, Loader2, Settings } from 'lucide-react'
import PublicStoryCard from '../components/community/PublicStoryCard'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/layout/BottomNav'

class ProfileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/10">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-lg shadow-premium border border-red-500/20 text-center">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Feather size={32} />
             </div>
             <h2 className="text-2xl font-serif font-bold text-bookvault-primary mb-2">Something went wrong</h2>
             <p className="text-sm text-red-500/80 mb-6 font-mono p-4 bg-red-50 dark:bg-red-900/20 rounded-xl overflow-x-auto text-left">
                {this.state.error?.toString() || 'Unknown rendering error'}
             </p>
             <button onClick={() => window.location.href = '/discover'} className="px-6 py-3 bg-bookvault-primary text-white rounded-xl font-bold shadow-sm">
                Return to Discovery
             </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Premium Toast Component
const NotificationToast = ({ message, type = 'success', onRemove }) => {
   useEffect(() => {
     const timer = setTimeout(onRemove, 4000);
     return () => clearTimeout(timer);
   }, [onRemove]);

   return (
      <motion.div
         initial={{ opacity: 0, y: 50, scale: 0.9 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, scale: 0.9, y: 20 }}
         className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-zinc-900 px-6 py-4 rounded-3xl shadow-2xl border border-outline-variant/10 min-w-[320px]"
      >
         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
         }`}>
            {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
         </div>
         <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-40 leading-none mb-1">{type}</p>
            <p className="text-sm font-bold text-bookvault-primary">{message}</p>
         </div>
         <button onClick={onRemove} className="text-on-surface-variant/40 hover:text-red-500 transition-colors">
            <X size={18} />
         </button>
      </motion.div>
   )
}

// Premium Message Modal
const MessageModal = ({ isOpen, onClose, recipient, onSend }) => {
   const [content, setContent] = useState('');
   const [isSending, setIsSending] = useState(false);

   if (!isOpen) return null;

   const handleSubmit = async () => {
      if (!content.trim()) return;
      setIsSending(true);
      const success = await onSend(content);
      setIsSending(false);
      if (success) {
         setContent('');
         onClose();
      }
   }

   return (
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
               <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl border border-outline-variant/10 relative"
               >
                  <div className="p-8 md:p-12">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h2 className="text-2xl font-serif font-bold text-bookvault-primary">Send Message</h2>
                           <p className="text-on-surface-variant text-sm mt-1">To @{recipient.username}</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-bookvault-surface-low rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="relative mb-8">
                        <textarea
                           autoFocus
                           value={content}
                           onChange={(e) => setContent(e.target.value)}
                           placeholder="Type your message here..."
                           className="w-full h-40 bg-bookvault-surface-low border-2 border-transparent focus:border-bookvault-primary rounded-[32px] p-6 text-bookvault-primary outline-none transition-all resize-none leading-relaxed"
                        />
                     </div>

                     <div className="flex gap-4">
                        <button 
                           onClick={onClose}
                           className="flex-1 py-4 text-on-surface-variant font-bold hover:bg-bookvault-surface-low rounded-2xl transition-all"
                        >
                           Cancel
                        </button>
                        <button 
                           onClick={handleSubmit}
                           disabled={!content.trim() || isSending}
                           className="flex-1 py-4 bg-bookvault-primary text-white font-bold rounded-2xl shadow-premium hover:bg-bookvault-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {isSending ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Send Message</>}
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
   )
}

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-bookvault-surface font-sans">
    <Navbar onUploadClick={() => {}} />
    <Sidebar activeCategory="discover" onCategoryChange={() => {}} />
    <main className="lg:ml-64 pt-20 transition-all duration-300">
      <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32">
        <div className="h-6 w-24 bg-outline-variant/10 rounded-xl animate-pulse mb-10" />
        <header className="bg-white dark:bg-zinc-900 rounded-[48px] p-10 md:p-16 border border-outline-variant/10 shadow-premium flex flex-col md:flex-row gap-12 items-start mb-20">
           <div className="w-44 h-44 rounded-[48px] bg-outline-variant/10 animate-pulse flex-shrink-0" />
           <div className="flex-1 w-full space-y-4 pt-4">
              <div className="h-10 w-3/4 bg-outline-variant/10 rounded-2xl animate-pulse" />
              <div className="h-6 w-1/3 bg-outline-variant/10 rounded-xl animate-pulse mb-8" />
              <div className="flex gap-10 py-4">
                 <div className="h-12 w-16 bg-outline-variant/10 rounded-xl animate-pulse" />
                 <div className="h-12 w-16 bg-outline-variant/10 rounded-xl animate-pulse" />
              </div>
              <div className="h-24 w-full bg-outline-variant/10 rounded-2xl animate-pulse" />
           </div>
        </header>
      </div>
    </main>
  </div>
)

const PublicProfileContent = () => {
  const { atUsername } = useParams()
  const navigate = useNavigate()
  const { fetchPublicProfile, toggleFollow, user, sendMessage, userProfile, followingAuthors } = useStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const isOwner = user?.id && profile?.id && user.id === profile.id;
  const isFollowing = profile?.id ? followingAuthors.includes(profile.id) : false;

  // Messaging & Notifications
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
     const id = Date.now();
     setToasts(prev => [...prev, { id, message, type }]);
  }

  const loadData = async () => {
    if (!atUsername) return;
    
    // Redirect if it doesn't start with @ to avoid route collision with potential future system routes
    if (!atUsername.startsWith('@')) {
       // navigate('/dashboard'); // Or leave it to the router's "best match" but we prefer explicit control
       return;
    }

    setLoading(true);
    try {
      const cleanUsername = atUsername.substring(1);
      const data = await fetchPublicProfile(cleanUsername)
      setProfile(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [atUsername])

  const [followingState, setFollowingState] = useState(false)
  
  const handleFollow = async () => {
    if (!user || followingState) {
      if (!user) addToast('Please login to follow authors', 'error');
      return
    }
    if (!profile?.id || isOwner) return;
    
    setFollowingState(true);
    
    // Optimistic profile update (local follower count)
    const following = isFollowing;
    const previousCount = profile.followersCount || 0;
    
    setProfile(prev => ({
       ...prev,
       followersCount: !following ? (previousCount + 1) : Math.max(0, previousCount - 1)
    }));

    addToast(!following ? `Following ${profile.full_name}` : `Unfollowed ${profile.full_name}`);

    try {
       await toggleFollow(profile.id)
    } catch (err) {
       // Rollback on failure
       setProfile(prev => ({ ...prev, followers_count: previousCount }));
       addToast('Failed to update follow status', 'error');
    } finally {
       setFollowingState(false);
    }
  }

  const handleSendMessage = async (content) => {
     if (!user || !profile?.id) return false;
     const success = await sendMessage(profile.id, content);
     if (success) {
        addToast('Message sent successfully!');
     } else {
        addToast('Failed to send message', 'error');
     }
     return success;
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-serif font-bold text-bookvault-primary mb-4">Author not found</h2>
        <p className="text-on-surface-variant opacity-60 mb-8 max-w-md text-center">We couldn't find an author profile for {atUsername}. The account may not exist or might be set to private.</p>
        <button onClick={() => navigate('/discover')} className="px-8 py-4 bg-bookvault-primary text-white rounded-2xl font-bold shadow-premium hover:bg-bookvault-primary-container transition-all">
           Return to Discovery
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bookvault-surface font-sans">
      <Navbar onUploadClick={() => {}} />
      <Sidebar activeCategory="discover" onCategoryChange={() => {}} />

      <main className="lg:ml-64 pt-20 transition-all duration-300">
        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32">
          <button 
             onClick={() => navigate('/discover')}
             className="flex items-center gap-2 text-on-surface-variant hover:text-bookvault-primary mb-10 transition-colors font-bold text-sm"
          >
             <ArrowLeft size={18} /> Discovery
          </button>

          <header className="bg-white dark:bg-zinc-900 rounded-[32px] md:rounded-[48px] p-6 md:p-16 border border-outline-variant/10 shadow-premium flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start mb-12 md:mb-20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-bookvault-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
             
             <div className="w-32 h-32 md:w-44 md:h-44 rounded-[32px] md:rounded-[48px] bg-bookvault-surface-low border-4 md:border-8 border-white dark:border-zinc-800 shadow-2xl overflow-hidden flex-shrink-0 relative z-10 transition-transform hover:scale-105 duration-500">
                {profile?.avatar_url ? (
                   <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-outline-variant opacity-20 bg-bookvault-surface-low"><Feather size={60} /></div>
                )}
             </div>
             
             <div className="flex-1 relative z-10 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                   <h1 className="text-3xl md:text-4xl font-serif font-bold text-bookvault-primary">{profile?.full_name || 'Anonymous Author'}</h1>
                   {profile?.storiesCount > 0 && <CheckCircle size={20} className="text-bookvault-secondary mx-auto md:mx-0" />}
                </div>
                <p className="text-on-surface-variant mb-6 md:mb-8 text-lg md:text-xl font-medium">@{profile?.username}</p>
                
                <div className="flex justify-center md:justify-start gap-8 md:gap-10 mb-8 items-center">
                   <div className="text-center md:text-left">
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mb-1">Followers</p>
                      <p className="text-2xl md:text-3xl font-serif font-bold text-bookvault-primary">{profile?.followersCount || 0}</p>
                   </div>
                   <div className="w-px h-10 bg-outline-variant/20" />
                   <div className="text-center md:text-left">
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mb-1">Stories</p>
                      <p className="text-2xl md:text-3xl font-serif font-bold text-bookvault-primary">{profile?.storiesCount || 0}</p>
                   </div>
                </div>

                <p className="text-on-surface-variant max-w-2xl leading-relaxed text-sm md:text-lg italic bg-bookvault-surface/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-outline-variant/5">
                   {profile?.bio || "This author hasn't shared a bio yet."}
                </p>
             </div>

             <div className="flex md:flex-col gap-3 w-full md:w-auto z-10">
                {isOwner ? (
                   <div className="flex flex-col gap-3 w-full min-w-[200px]">
                      <button 
                        onClick={() => navigate('/author')}
                        className="px-8 py-4 bg-bookvault-primary text-white rounded-2xl font-bold shadow-premium hover:bg-bookvault-primary-container transition-all flex items-center justify-center gap-2 w-full"
                      >
                         <Feather size={20} /> Author Dashboard
                      </button>
                      <button 
                        onClick={() => navigate('/profile')}
                        className="px-8 py-4 bg-bookvault-surface-low text-bookvault-primary rounded-2xl font-bold hover:bg-black/5 transition-all flex items-center justify-center gap-2 w-full"
                      >
                        <Settings size={20} /> Account Settings
                      </button>
                   </div>
                ) : (
                   <>
                      <button 
                        onClick={handleFollow}
                        className={`px-8 py-4 rounded-2xl font-bold shadow-premium transition-all flex items-center justify-center gap-2 min-w-[200px] ${
                          isFollowing 
                          ? 'bg-bookvault-surface-low text-bookvault-primary hover:bg-black/5' 
                          : 'bg-bookvault-primary text-white hover:bg-bookvault-primary-container'
                        }`}
                      >
                         {isFollowing ? (
                           <>
                              <CheckCircle size={20} className="text-bookvault-secondary" /> Following
                           </>
                         ) : (
                           <>
                              <Users size={20} /> Follow
                           </>
                         )}
                      </button>
                      <button 
                         onClick={() => setIsMessageModalOpen(true)}
                         className="px-8 py-4 bg-bookvault-surface-low text-bookvault-primary rounded-2xl font-bold hover:bg-black/5 transition-all flex items-center justify-center gap-2 min-w-[200px]"
                      >
                         <Send size={18} /> Message
                      </button>
                   </>
                )}

                {/* Social Bar - Strictly null safe */}
                {profile?.social_links && typeof profile.social_links === 'object' && Object.keys(profile.social_links).length > 0 && (
                   <div className="flex justify-center gap-2 mt-2">
                       {profile.social_links?.instagram && (
                          <a 
                            href={profile.social_links.instagram.toString().startsWith('http') ? profile.social_links.instagram : `https://instagram.com/${profile.social_links.instagram}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 bg-white dark:bg-zinc-800 text-on-surface-variant hover:text-bookvault-secondary rounded-xl border border-outline-variant/10 shadow-sm transition-all hover:scale-110"
                            title="Instagram"
                          >
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                          </a>
                       )}
                       {profile.social_links?.twitter && (
                          <a 
                            href={profile.social_links.twitter.toString().startsWith('http') ? profile.social_links.twitter : `https://twitter.com/${profile.social_links.twitter}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 bg-white dark:bg-zinc-800 text-on-surface-variant hover:text-[#1DA1F2] rounded-xl border border-outline-variant/10 shadow-sm transition-all hover:scale-110"
                            title="Twitter / X"
                          >
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                          </a>
                       )}
                       {profile.social_links?.website && (
                          <a 
                            href={profile.social_links.website.toString().startsWith('http') ? profile.social_links.website : `https://${profile.social_links.website}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 bg-white dark:bg-zinc-800 text-on-surface-variant hover:text-bookvault-primary rounded-xl border border-outline-variant/10 shadow-sm transition-all hover:scale-110"
                            title="Personal Website"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          </a>
                       )}
                   </div>
                )}
             </div>
          </header>

          <section>
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-serif font-bold text-bookvault-primary flex items-center gap-3">
                    <BookOpen size={24} className="text-bookvault-secondary" />
                    {profile?.storiesCount > 0 ? 'Manuscript Catalog' : 'Bibliophile Activity'}
                 </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                 {profile?.stories && Array.isArray(profile.stories) && profile.stories.length > 0 ? (
                     (profile.stories || []).map((s, index) => {
                        if (!s) return null;
                        return (
                           <motion.div
                              key={s.id || index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                           >
                              <PublicStoryCard story={{ ...s, profiles: { username: profile?.username, full_name: profile?.full_name, avatar_url: profile?.avatar_url } }} />
                           </motion.div>
                        );
                     })
                 ) : (
                    <div className="col-span-full py-24 text-center bg-white dark:bg-zinc-900 rounded-[48px] border border-dashed border-outline-variant/20 flex flex-col items-center">
                       <div className="w-16 h-16 bg-bookvault-primary/5 text-bookvault-primary rounded-3xl flex items-center justify-center mb-6">
                          <Feather size={32} className="opacity-40" />
                       </div>
                       <h4 className="text-xl font-serif font-bold text-bookvault-primary mb-2">
                          {isOwner ? 'Your Digital Library' : 'A Dedicated Reader'}
                       </h4>
                       <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed opacity-60">
                          {isOwner 
                            ? "Welcome to your public profile. Any manuscripts you publish to the community will appear here for your readers to enjoy."
                            : `${profile?.full_name || 'This user'} is currently exploring the vaults of knowledge. No public manuscripts have been penned by this bibliophile yet.`
                          }
                       </p>
                    </div>
                 )}
              </div>
          </section>
        </div>
      </main>

      {/* Overlays */}
      <MessageModal 
         isOpen={isMessageModalOpen} 
         onClose={() => setIsMessageModalOpen(false)} 
         recipient={profile}
         onSend={handleSendMessage}
      />

      {/* Toast Portal */}
      <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 z-[200] flex flex-col gap-4 pointer-events-none">
         <AnimatePresence>
            {toasts.map(toast => (
               <NotificationToast 
                  key={toast.id} 
                  message={toast.message} 
                  type={toast.type} 
                  onRemove={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
               />
            ))}
         </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  )
}

const PublicProfile = () => {
   return (
      <ProfileErrorBoundary>
         <PublicProfileContent />
      </ProfileErrorBoundary>
   )
}

export default PublicProfile
