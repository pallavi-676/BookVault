import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, BookOpen, Clock, Tag, Play, ChevronRight, User, AlertCircle } from 'lucide-react'
import { LikeButton, WishlistButton } from '../components/community/SocialActions'
import { RatingSystem } from '../components/community/RatingSystem'
import { CommentSection } from '../components/community/CommentSection'

const StoryLanding = () => {
  const { atUsername, storySlug } = useParams()
  const navigate = useNavigate()
  const { fetchPublicStory } = useStore()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!atUsername) return;
      setLoading(true)
      const cleanUsername = atUsername.replace('@', '')
      const data = await fetchPublicStory(cleanUsername, storySlug)
      setStory(data)
      setLoading(false)
    }
    load()
  }, [atUsername, storySlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Summoning story details...</p>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-bookvault-primary mb-2">This story is no longer available.</h1>
        <p className="text-on-surface-variant max-w-sm mb-8">It may have been removed by the author or privateered to another library.</p>
        <button onClick={() => navigate('/discover')} className="px-8 py-4 bg-bookvault-primary text-white rounded-2xl font-bold shadow-premium">Return to Discovery</button>
      </div>
    )
  }

  const handleStartReading = () => {
    const firstChapter = story.chapters?.find(c => c.order_index === 0) || story.chapters?.[0]
    if (firstChapter) {
      navigate(`/read/${story.id}/${firstChapter.id}`)
    }
  }

  const publishedChapters = (story.chapters || []).filter(c => c.status === 'published').sort((a,b) => a.order_index - b.order_index)

  return (
    <div className="min-h-screen bg-bookvault-surface font-sans">
      <Navbar onUploadClick={() => {}} />
      <Sidebar activeCategory="discover" onCategoryChange={() => {}} />

      <main className="pl-64 pt-20">
         <div className="p-8 max-w-6xl mx-auto pb-40">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-bookvault-primary mb-12 transition-colors font-bold text-sm"
            >
               <ArrowLeft size={18} /> Back to Search
            </button>

            <header className="flex flex-col lg:flex-row gap-16 items-start mb-24">
              {/* Cover Art */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[320px] aspect-[2/3] bg-bookvault-surface-low rounded-[40px] overflow-hidden shadow-2xl flex-shrink-0 relative group"
              >
                 {story.cover_url ? (
                    <img src={story.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bookvault-surface-low to-bookvault-primary/5 text-bookvault-primary/10">
                       <BookOpen size={100} />
                    </div>
                 )}
                 <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[40px]" />
              </motion.div>

              {/* Story Meta */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1"
              >
                 <div className="flex flex-wrap items-center gap-4 mb-6">
                    <span className="px-4 py-1.5 bg-bookvault-secondary/15 text-bookvault-secondary rounded-full text-xs font-black uppercase tracking-[0.1em] border border-bookvault-secondary/10">
                       {story.genre}
                    </span>
                     <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-black uppercase tracking-[0.15em] opacity-60">
                        <Clock size={14} /> Updated {new Date(story.updated_at).toLocaleDateString()}
                     </span>
                     <div className="h-4 w-px bg-outline-variant/20 ml-2" />
                     <RatingSystem storyId={story.id} initialAverage={story.average_rating} initialCount={story.ratings_count} />
                  </div>

                 <h1 className="text-5xl md:text-6xl font-serif font-bold text-bookvault-primary mb-6 leading-[1.1] tracking-tight">{story.title}</h1>
                 
                 <button 
                   onClick={() => navigate(`/@${story.author?.username}`)}
                   className="flex items-center gap-3 mb-10 group"
                 >
                    <div className="w-10 h-10 rounded-full bg-bookvault-surface-low overflow-hidden border border-outline-variant/10 group-hover:ring-2 group-hover:ring-bookvault-primary transition-all">
                       {story.author?.avatar_url ? <img src={story.author.avatar_url} className="w-full h-full object-cover" /> : <User size={18} className="m-auto mt-2" />}
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 leading-none mb-1">Author</p>
                       <p className="text-lg font-serif font-bold text-bookvault-primary group-hover:text-bookvault-secondary transition-colors">{story.author?.full_name}</p>
                    </div>
                 </button>

                 <div className="bg-white/40 dark:bg-zinc-900/40 rounded-[32px] p-8 border border-outline-variant/10 mb-10 backdrop-blur-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-3">Synopsis</h4>
                    <p className="text-on-surface-variant text-lg leading-relaxed selection:bg-bookvault-secondary/20">
                       {story.description}
                    </p>
                 </div>

                 <div className="flex flex-wrap gap-4 items-center">
                     <button 
                       onClick={handleStartReading}
                       disabled={publishedChapters.length === 0}
                       className="px-12 py-5 bg-bookvault-primary text-white rounded-[24px] font-bold shadow-premium hover:bg-bookvault-primary-container transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                     >
                        <Play size={20} className="group-hover:translate-x-1 transition-transform" /> Start Reading
                     </button>
                     
                     <div className="flex gap-3">
                        <LikeButton storyId={story.id} initialCount={story.likes_count} />
                        <WishlistButton storyId={story.id} />
                     </div>
                 </div>
              </motion.div>
            </header>

            <section className="mb-24">
              <div className="flex items-center gap-6 mb-12">
                 <h3 className="text-2xl font-serif font-bold text-bookvault-primary">Manuscript Contents</h3>
                 <div className="h-px flex-1 bg-outline-variant/10" />
                 <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-40">{publishedChapters.length} Chapters</span>
              </div>

              <div className="grid gap-4">
                 {publishedChapters.length > 0 ? (
                    publishedChapters.map((chap, i) => (
                       <motion.div 
                         key={chap.id}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: i * 0.05 }}
                         onClick={() => navigate(`/read/${story.id}/${chap.id}`)}
                         className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-outline-variant/10 flex items-center justify-between hover:border-bookvault-primary hover:shadow-premium transition-all cursor-pointer group"
                       >
                          <div className="flex items-center gap-8">
                             <span className="text-3xl font-serif font-bold text-on-surface-variant/20 group-hover:text-bookvault-primary/40 transition-colors tabular-nums">
                                {(i + 1).toString().padStart(2, '0')}
                             </span>
                             <h4 className="font-serif font-bold text-bookvault-primary text-lg">{chap.title}</h4>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{chap.status}</span>
                             <ChevronRight size={20} className="text-on-surface-variant opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                       </motion.div>
                    ))
                 ) : (
                    <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-[32px] border border-dashed border-outline-variant/20">
                       <p className="text-on-surface-variant italic opacity-60">This author is still drafting the opening chapters...</p>
                    </div>
                 )}
              </div>
            </section>

            <CommentSection storyId={story.id} storyAuthorId={story.author_id} />
         </div>
      </main>
    </div>
  )
}

export default StoryLanding
