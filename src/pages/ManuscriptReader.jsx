import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Info, Menu, X, UserPlus, UserCheck, Feather, ArrowRight, Heart, Settings } from 'lucide-react'
import { LikeButton, WishlistButton } from '../components/community/SocialActions'
import { CommentSection } from '../components/community/CommentSection'
import { clsx } from 'clsx'

const ManuscriptReader = () => {
   const { storyId, chapterId } = useParams()
   const navigate = useNavigate()
   const { user, toggleFollow, fetchPublicStory, toggleWishlist, userWishlist, followingAuthors, favoriteStories } = useStore()
   
   const [story, setStory] = useState(null)
   const [chapters, setChapters] = useState([])
   const [loading, setLoading] = useState(true)
   const [fontSize] = useState(18)
   const [showChapters, setShowChapters] = useState(false)
   const [isMarkedAsReading, setIsMarkedAsReading] = useState(false)
   
   const isFollowingAuthor = story?.author_id ? followingAuthors.includes(story.author_id) : false;
   const isFavorite = story?.id ? favoriteStories.includes(story.id) : false;
   
   // Calculate current chapter index
   const currentChapterIndex = chapterId ? chapters.findIndex(ch => ch.id === chapterId) : 0;
   
   const { scrollYProgress } = useScroll()
   const scaleX = useSpring(scrollYProgress, {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001
   })

   useEffect(() => {
     // Auto-mark as reading when user starts scrolling if not already marked
     const handleScroll = () => {
       if (scrollYProgress.get() > 0.05 && storyId && !isMarkedAsReading) {
         const alreadyReading = userWishlist.some(w => w.story_id === storyId && w.category === 'currently_reading');
         const alreadyFinished = userWishlist.some(w => w.story_id === storyId && w.category === 'finished');
         
         if (!alreadyReading && !alreadyFinished) {
           toggleWishlist(storyId, 'currently_reading');
           setIsMarkedAsReading(true);
         }
       }

       // Auto-mark as finished if we reach the end (>95%)
       if (scrollYProgress.get() > 0.95 && storyId) {
          const alreadyFinished = userWishlist.some(w => w.story_id === storyId && w.category === 'finished');
          if (!alreadyFinished) {
            toggleWishlist(storyId, 'finished');
          }
       }
     };

     const unsubscribe = scrollYProgress.on('change', handleScroll);
     return () => unsubscribe();
   }, [scrollYProgress, storyId, userWishlist, toggleWishlist, isMarkedAsReading]);

   useEffect(() => {
      const load = async () => {
         setLoading(true)
         const storyData = await fetchPublicStory(null, null, storyId)
         if (storyData) {
            setStory(storyData)
            setChapters(storyData.chapters?.sort((a,b) => a.order_index - b.order_index) || [])
            
            // Auto-scroll to chapter if chapterId is present
            if (chapterId) {
               setTimeout(() => {
                  const element = document.getElementById(`chapter-${chapterId}`)
                  if (element) element.scrollIntoView({ behavior: 'smooth' })
               }, 500)
            }
         }
         setLoading(false)
      }
      load()
   }, [storyId, chapterId, user, fetchPublicStory])

   const handleFollow = async () => {
      if (!user || !story?.author_id) return;
      await toggleFollow(story.author_id);
   }

   const scrollToChapter = (chapterId) => {
      const element = document.getElementById(`chapter-${chapterId}`);
      if (element) {
         element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
   };

   const toggleFavorite = (storyId) => {
      toggleWishlist(storyId, 'favorites');
   };

   const canGoNext = currentChapterIndex < chapters.length - 1;
   const nextChapter = canGoNext ? chapters[currentChapterIndex + 1] : null;

   const handleNextChapter = () => {
      if (nextChapter) {
         scrollToChapter(nextChapter.id);
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-bookvault-surface flex items-center justify-center">
            <Loader2 className="animate-spin text-bookvault-primary" size={40} />
         </div>
      )
   }

   if (!story || chapters.length === 0) {
      return (
         <div className="min-h-screen bg-[#FDFCFA] flex flex-col items-center justify-center p-8">
            <p className="text-xl font-serif italic text-on-surface-variant opacity-40 mb-8">This scroll remains unwritten...</p>
            <button onClick={() => navigate(-1)} className="text-bookvault-primary font-bold underline underline-offset-8">Return to Story Landing</button>
         </div>
      )
   }

   return (
      <div className="min-h-screen bg-[#FDFCFA] dark:bg-zinc-950 text-[#1a1a1a] dark:text-zinc-100 font-serif selection:bg-bookvault-secondary/20 transition-colors duration-300">
         {/* Progress Bar */}
         <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-bookvault-primary z-[120] origin-left"
            style={{ scaleX }}
         />

         {/* Fixed Header */}
         <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-black/5 dark:border-white/10 z-[110] px-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <button 
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-on-surface-variant"
               >
                  <ArrowLeft size={24} />
               </button>
               <div className="h-4 w-px bg-black/5 dark:bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1">Current Manuscript</span>
                  <span className="text-sm font-bold truncate max-w-[200px]">{story?.title}</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
               {/* Removed story-level favorite button per user request to move interaction to chapters */}

               <div className="h-4 w-px bg-black/5 dark:bg-white/10 mx-1" />

               <button 
                  onClick={() => setShowChapters(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-bookvault-primary/5 text-bookvault-primary rounded-full text-xs font-sans font-black uppercase tracking-widest hover:bg-bookvault-primary/10 transition-all font-bold"
               >
                  <Menu size={16} />
                  <span>Contents</span>
               </button>
               <button 
                  onClick={() => navigate('/profile')}
                  className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-on-surface-variant"
                  title="Reader Settings"
               >
                  <Settings size={22} />
               </button>
            </div>
         </nav>

         {/* Sidebar Chapters Panel */}
         <AnimatePresence>
            {showChapters && (
               <>
                  <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setShowChapters(false)}
                     className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-[125]"
                  />
                  <motion.div
                     initial={{ x: '100%' }}
                     animate={{ x: 0 }}
                     exit={{ x: '100%' }}
                     transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                     className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-900 shadow-2xl z-[130] p-10 flex flex-col font-sans"
                  >
                     <div className="flex items-center justify-between mb-12">
                        <h2 className="text-2xl font-serif font-bold text-bookvault-primary">Manuscript Map</h2>
                        <button onClick={() => setShowChapters(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-on-surface-variant"><X size={24} /></button>
                     </div>
                     <div className="flex-1 overflow-y-auto space-y-1">
                        {chapters.map((chap, i) => (
                           <div
                              key={chap.id}
                              className={clsx(
                                 "w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group px-6",
                                 chap.id === chapterId 
                                   ? "bg-bookvault-primary/5 text-bookvault-primary border-l-4 border-bookvault-primary rounded-l-none" 
                                   : "hover:bg-bookvault-surface-low dark:hover:bg-white/5 text-on-surface-variant"
                              )}
                           >
                              <div 
                                 className="flex items-center gap-4 cursor-pointer flex-1"
                                 onClick={() => {
                                    const el = document.getElementById(`chapter-${chap.id}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    setShowChapters(false);
                                 }}
                              >
                                 <span className={clsx(
                                   "text-lg font-serif font-bold tabular-nums transition-opacity",
                                   chap.id === chapterId ? "opacity-100" : "opacity-10"
                                 )}>
                                   {(i + 1).toString().padStart(2, '0')}
                                 </span>
                                 <span className="font-bold text-sm truncate">{chap.title}</span>
                              </div>
                              <LikeButton chapterId={chap.id} initialCount={chap.likes_count} variant="iconOnly" />
                           </div>
                        ))}
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>

         {/* Content */}
         <main className="pt-40 p-8">
            <div
               className="max-w-2xl mx-auto space-y-48 pb-32"
               style={{ fontSize: `${fontSize}px` }}
            >
               {chapters.map((chap, i) => (
                  <article
                     key={chap.id}
                     id={`chapter-${chap.id}`}
                     className="relative"
                  >
                     <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="mb-20 text-center"
                     >
                        <div className="w-12 h-12 rounded-full border border-black/5 dark:border-white/10 flex items-center justify-center mx-auto mb-10 text-[10px] font-sans font-black uppercase tracking-[0.2em] opacity-40">
                           {i + 1}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6 leading-tight select-none">
                           {chap.title}
                        </h2>
                        <div className="w-20 h-0.5 bg-bookvault-secondary mx-auto opacity-30" />
                     </motion.div>

                     <div 
                        className="prose prose-stone dark:prose-invert max-w-none leading-[1.8] text-justify selection:bg-bookvault-secondary/30"
                        dangerouslySetInnerHTML={{ __html: chap.content }}
                        style={{ 
                           fontFamily: 'Georgia, serif',
                        }}
                     />

                     {/* Chapter Engagement Footer - RESTORED */}
                     <div className="mt-16 flex flex-col items-center gap-12 border-t border-black/5 pt-16">
                        <LikeButton chapterId={chap.id} initialCount={chap.likes_count} />
                        <CommentSection storyId={storyId} chapterId={chap.id} />
                     </div>
                  </article>
               ))}

               {/* Reader Footer Social CTA */}
               <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="pt-32 pb-60 border-t border-black/5 text-center flex flex-col items-center"
               >
                  <div className="w-20 h-20 bg-bookvault-surface-low rounded-full flex items-center justify-center mb-8 text-bookvault-secondary border border-outline-variant/10">
                     <Info size={40} />
                  </div>
                  <p className="text-xs font-sans font-black uppercase tracking-[0.4em] opacity-20 mb-6">
                     {canGoNext ? `You've finished ${chapters[currentChapterIndex]?.title || 'the chapter'}` : 'The End of Current Chapters'}
                  </p>
                  <h4 className="text-4xl font-serif font-bold text-bookvault-primary mb-10 max-w-lg mx-auto">
                     {canGoNext ? `Ready for clinical precision? Next chapter is waiting.` : `Enjoyed ${story?.title}?`}
                  </h4>

                  <div className="flex flex-col md:flex-row gap-4 items-center">
                     {canGoNext ? (
                        <button
                           onClick={handleNextChapter}
                           className="px-12 py-5 bg-bookvault-primary text-white rounded-[24px] font-sans font-black uppercase tracking-widest shadow-premium hover:bg-bookvault-primary-container transition-all flex items-center gap-4 group active:scale-95"
                        >
                           <span>Continue to Next Chapter</span>
                           <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                     ) : (
                        <button
                           onClick={() => navigate('/discover')}
                           className="px-12 py-5 bg-white text-bookvault-primary border border-bookvault-primary/10 rounded-[24px] font-sans font-bold shadow-lg hover:bg-bookvault-surface transition-all flex items-center gap-2"
                        >
                           <Feather size={20} /> Explore More Stories
                        </button>
                     )}
                     
                     <div className="flex gap-4">
                        <button
                           onClick={handleFollow}
                           className={clsx(
                              "px-10 py-5 rounded-[24px] font-sans font-bold shadow-2xl transition-all flex items-center gap-3 active:scale-95 group",
                              isFollowingAuthor 
                                 ? "bg-bookvault-surface text-bookvault-primary border border-bookvault-primary/20" 
                                 : "bg-white text-bookvault-primary border border-bookvault-primary/10 hover:bg-bookvault-surface"
                           )}
                           title={isFollowingAuthor ? "Following Author" : "Follow Author"}
                        >
                           {isFollowingAuthor ? <UserCheck size={20} /> : <UserPlus size={20} />}
                           <span className="hidden md:inline">{isFollowingAuthor ? 'Following' : 'Follow Author'}</span>
                        </button>
                        
                        <LikeButton storyId={story.id} initialCount={story.likes_count || 0} />
                     </div>
                  </div>

                  <p className="mt-12 text-sm font-sans text-on-surface-variant opacity-40 max-w-xs leading-relaxed">
                     {canGoNext 
                        ? "The storyteller's journey continues. Your engagement keeps the ink flowing."
                        : "Follow authors to get notified when new chapters are published to their manuscripts."}
                  </p>
               </motion.div>
            </div>
         </main>
      </div>
   )
}

export default ManuscriptReader
