import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  Eye, 
  Loader2,
  FileText,
  Clock,
  Send,
  Lock,
  MoreVertical,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import Navbar from '../components/layout/Navbar'
import StoryModal from '../components/author/StoryModal'
import { clsx } from 'clsx'
import { supabase } from '../lib/supabase'

const AuthorStoryManager = () => {
  const { storyId } = useParams()
  const navigate = useNavigate()
  const { 
    chapters, 
    chaptersLoading, 
    fetchChapters, 
    createChapter, 
    deleteChapter, 
    saveChapterOrder,
    authorStories,
    userProfile
  } = useStore()

  const [story, setStory] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const fetchStoryDetails = async () => {
    const { data } = await supabase.from('stories').select('*').eq('id', storyId).single()
    if (data) setStory({
      id: data.id,
      title: data.title,
      description: data.description,
      genre: data.genre,
      coverUrl: data.cover_url,
      visibility: data.visibility,
      updatedAt: data.updated_at,
      language: data.language,
      subtitle: data.subtitle
    })
  }

  useEffect(() => {
    // 1. Initial Load
    const existingStory = authorStories.find(s => s.id === storyId)
    if (existingStory) {
      setStory(existingStory)
    } else {
      fetchStoryDetails()
    }
    
    // 2. Fetch chapters
    fetchChapters(storyId)
  }, [storyId])

  const handleAddChapter = async (e) => {
    e.preventDefault()
    if (!newChapterTitle.trim()) return
    setIsCreating(true)
    try {
      const newChap = await createChapter(storyId, newChapterTitle.trim())
      setNewChapterTitle('')
      navigate(`/author/story/${storyId}/chapter/${newChap.id}`)
    } catch (err) {
      alert('Failed to create chapter.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteChapter = async (id) => {
    if (window.confirm('Delete this chapter? This cannot be undone.')) {
      try {
        await deleteChapter(id)
      } catch (err) {
        alert('Failed to delete chapter.')
      }
    }
  }

  const handleMove = async (index, direction) => {
    const newChapters = [...chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChapters.length) return;
    [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
    await saveChapterOrder(storyId, newChapters);
  }

  const totalWords = chapters.reduce((acc, curr) => {
    return acc + (curr.content?.replace(/<[^>]*>/g, ' ').split(/\s+/)?.filter(w => w.length > 0)?.length || 0)
  }, 0)

  if (!story && chaptersLoading) {
    return (
      <div className="min-h-screen bg-bookvault-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-bookvault-primary animate-spin opacity-20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 md:px-12 bg-bookvault-surface">
      <Navbar onUploadClick={() => {}} />

      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/author')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-bookvault-primary font-medium mb-8 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* Story Summary Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-10 border border-outline-variant/30 shadow-premium mb-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-44 bg-bookvault-surface-low rounded-2xl overflow-hidden shadow-md flex-shrink-0 relative group/cover">
              {story?.coverUrl ? (
                <img src={story.coverUrl} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20"><FileText size={40} /></div>
              )}
              <div 
                onClick={() => setIsModalOpen(true)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                 <Settings size={24} className="text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={clsx(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  story?.visibility === 'published' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {story?.visibility}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                  Manuscript Status
                </span>
              </div>
              
              <h1 className="text-3xl font-serif font-bold text-bookvault-primary mb-2 line-clamp-1">{story?.title}</h1>
              <p className="text-on-surface-variant max-w-2xl text-sm italic mb-6 line-clamp-2">
                "{story?.description}"
              </p>

              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Chapters</p>
                  <p className="text-xl font-serif font-bold text-bookvault-primary">{chapters.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Approx. Words</p>
                  <p className="text-xl font-serif font-bold text-bookvault-primary">{totalWords.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Genre</p>
                  <p className="text-xl font-serif font-bold text-bookvault-primary">{story?.genre}</p>
                </div>
              </div>
            </div>

            <div className="flex md:flex-col gap-2">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-bookvault-surface-low text-bookvault-primary rounded-xl text-sm font-bold hover:bg-black/5 transition-all w-full"
              >
                <Settings size={18} /> Edit Metadata
              </button>
              <button 
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-bookvault-surface-low text-bookvault-primary rounded-xl text-sm font-bold hover:bg-black/5 transition-all w-full"
              >
                <Eye size={18} /> Public Preview
              </button>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-serif font-bold text-bookvault-primary">Manuscript Chapters</h2>
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                Sorted by Order
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {chapters.map((chap, index) => (
                  <motion.div
                    key={chap.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-zinc-900 border border-outline-variant/30 rounded-2xl p-5 flex items-center gap-4 hover:shadow-premium transition-all group"
                  >
                    <div className="flex flex-col gap-1 items-center justify-center w-8 text-on-surface-variant/40 group-hover:text-bookvault-primary transition-colors">
                      <button 
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="hover:scale-125 disabled:opacity-0"
                      >
                        <ChevronUp size={20} />
                      </button>
                      <span className="text-xs font-bold font-mono">{index + 1}</span>
                      <button 
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === chapters.length - 1}
                        className="hover:scale-125 disabled:opacity-0"
                      >
                        <ChevronDown size={20} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0" onClick={() => navigate(`/author/story/${storyId}/chapter/${chap.id}`)} className="cursor-pointer flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-serif font-bold text-bookvault-primary truncate">{chap.title}</h4>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest",
                          chap.status === 'published' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                        )}>
                          {chap.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-on-surface-variant opacity-60 uppercase font-bold tracking-widest">
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(chap.updatedAt).toLocaleDateString()}</span>
                        {chap.followersOnly && <span className="flex items-center gap-1 text-bookvault-secondary"><Lock size={10} /> Followers Only</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/author/story/${storyId}/chapter/${chap.id}`)}
                        className="p-2 hover:bg-bookvault-surface-low rounded-lg text-on-surface-variant hover:text-bookvault-primary transition-all"
                        title="Edit Chapter"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteChapter(chap.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-on-surface-variant hover:text-red-500 transition-all"
                        title="Delete Chapter"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {chapters.length === 0 && !chaptersLoading && (
                <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-outline-variant/50">
                  <p className="text-on-surface-variant/60 italic">No chapters yet. Start writing your first scene.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-bookvault-primary-container text-white rounded-3xl p-8 shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <Send size={80} />
              </div>
              <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Plus size={24} /> New Chapter
              </h3>
              <form onSubmit={handleAddChapter}>
                <input 
                  type="text"
                  placeholder="Chapter Title..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/20 focus:bg-white/20 border-none rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/40 mb-4 transition-all outline-none ring-1 ring-white/10"
                />
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3 bg-white text-bookvault-primary rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Begin Drafting'}
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-outline-variant/30 rounded-3xl p-8 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-6">Publication Settings</h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Send size={18} className="text-bookvault-primary" />
                    <div>
                      <p className="text-xs font-bold text-bookvault-primary">Publish Story</p>
                      <p className="text-[10px] text-on-surface-variant">Visible to the world</p>
                    </div>
                  </div>
                  <button className={clsx(
                    "w-10 h-5 rounded-full relative transition-all",
                    story?.visibility === 'published' ? "bg-emerald-500" : "bg-outline-variant/30"
                  )}>
                    <div className={clsx(
                      "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                      story?.visibility === 'published' ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between opacity-40 grayscale cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <Send size={18} className="text-bookvault-primary" />
                    <div>
                      <p className="text-xs font-bold text-bookvault-primary">Automatic Release</p>
                      <p className="text-[10px] text-on-surface-variant">Schedule chapters</p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-black/5 rounded text-[8px] font-black uppercase tracking-tighter">Pro</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StoryModal 
         isOpen={isModalOpen}
         onClose={() => { setIsModalOpen(false); fetchStoryDetails(); }}
         story={story}
      />

      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsPreviewOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-bookvault-surface-low">
                 <div className="flex items-center gap-3">
                    <Eye size={20} className="text-bookvault-primary" />
                    <span className="text-sm font-bold uppercase tracking-widest text-bookvault-primary">Story Public Preview</span>
                 </div>
                 <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 md:p-20 bg-bookvault-surface">
                 <div className="max-w-2xl mx-auto space-y-20">
                    <div className="text-center mb-24">
                       <h1 className="text-5xl font-serif font-bold text-bookvault-primary mb-6">{story?.title}</h1>
                       <p className="text-xl text-on-surface-variant italic mb-8">By {userProfile?.fullName || 'BookVault Author'}</p>
                       <p className="text-on-surface-variant max-w-lg mx-auto leading-relaxed">{story?.description}</p>
                    </div>

                    <div className="space-y-32">
                       {chapters.filter(c => c.status === 'published').map((chap, i) => (
                          <div key={chap.id} className="pt-20 border-t border-outline-variant/10">
                             <h2 className="text-2xl font-serif font-bold text-bookvault-primary mb-12 text-center opacity-40 uppercase tracking-[0.2em]">
                                Chapter {i + 1}: {chap.title}
                             </h2>
                             <div 
                                className="prose prose-lg prose-zinc dark:prose-invert max-w-none font-serif leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: chap.content }}
                             />
                          </div>
                       ))}
                       {chapters.filter(c => c.status === 'published').length === 0 && (
                          <div className="text-center py-20 text-on-surface-variant italic">
                             This manuscript has no published chapters yet.
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AuthorStoryManager
