import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  BookText, 
  DraftingCompass, 
  Send, 
  BarChart3, 
  Search, 
  Filter, 
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  User,
  Check,
  CheckCheck,
  Heart,
  Sparkles
} from 'lucide-react'
import { useStore } from '../store/useStore'
import StoryCard from '../components/author/StoryCard'
import StoryModal from '../components/author/StoryModal'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'

const AuthorDashboard = () => {
  const navigate = useNavigate()
  const { 
    authorStories, 
    authorStoriesLoading, 
    fetchAuthorStories, 
    deleteStory, 
    updateStory,
    userProfile,
    messages,
    messagesLoading,
    fetchMessages,
    markMessageRead,
    refreshUserProfile
  } = useStore()

  const [activeTab, setActiveTab] = useState('all') // all, published, drafts, messages
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStory, setEditingStory] = useState(null)

  useEffect(() => {
    fetchAuthorStories()
    fetchMessages()
    refreshUserProfile()
  }, [])

  const filteredStories = authorStories.filter(story => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'published' && story.visibility === 'published') ||
      (activeTab === 'drafts' && story.visibility === 'draft')
    
    if (activeTab === 'messages') return false; // Hide stories in messages tab

    const matchesSearch = 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.genre.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const unreadCount = (messages || []).filter(m => m && !m.is_read).length;

  const stats = [
    { label: 'Followers', value: userProfile?.followersCount || 0, icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Total Likes', value: userProfile?.totalLikes || 0, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Total Resonance', value: userProfile?.totalComments || 0, icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Unread Intel', value: unreadCount, icon: Mail, color: 'text-amber-500', bg: 'bg-amber-50' },
  ]

  const handleEdit = (story) => {
    setEditingStory(story)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      try {
        await deleteStory(id)
      } catch (err) {
        alert('Failed to delete story.')
      }
    }
  }

  const handleToggleVisibility = async (story) => {
    const newVisibility = story.visibility === 'published' ? 'draft' : 'published'
    try {
      await updateStory(story.id, { ...story, visibility: newVisibility })
    } catch (err) {
      alert('Failed to update story visibility.')
    }
  }

  return (
    <div className="min-h-screen bg-bookvault-surface pb-32">
      <Navbar onUploadClick={() => {}} />

      <div className="max-w-7xl mx-auto pt-24 px-4 md:px-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
               <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-1.5 bg-bookvault-surface-low text-bookvault-primary rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-bookvault-primary hover:text-white transition-all shadow-sm flex items-center gap-2"
               >
                  <ArrowLeft size={12} /> Back to Library
               </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-bookvault-primary text-balance">Author Intel Center</h1>
            <p className="text-on-surface-variant text-sm md:text-base mt-2 max-w-lg">
              Manage your manuscripts, track community engagement, and monitor direct reader feedback.
            </p>
          </div>
          <button 
            onClick={() => {
              setEditingStory(null)
              setIsModalOpen(true)
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 md:py-3 bg-bookvault-primary text-white rounded-2xl font-bold shadow-premium hover:bg-bookvault-primary-container transition-all w-full md:w-auto"
          >
            <Plus size={20} />
            Create New Story
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-sm transition-transform hover:scale-[1.02]">
              <div className={`w-8 h-8 md:w-10 md:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon size={18} md:size={20} />
              </div>
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
              <p className="text-xl md:text-2xl font-serif font-bold text-bookvault-primary mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar & Filter */}
        <div className="bg-white dark:bg-zinc-900 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-bookvault-surface-low p-1 rounded-xl md:rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {['all', 'published', 'drafts', 'messages'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-none flex items-center justify-center gap-2",
                  activeTab === tab 
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-bookvault-primary" 
                    : "text-on-surface-variant hover:text-bookvault-primary"
                )}
              >
                {tab}
                {tab === 'messages' && unreadCount > 0 && (
                   <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bookvault-surface-low border-none rounded-xl text-sm focus:ring-1 focus:ring-bookvault-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'messages' ? (
           <div className="space-y-4">
              {messagesLoading ? (
                 <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-bookvault-primary opacity-20" />
                 </div>
              ) : messages.length > 0 ? (
                 <div className="grid gap-4">
                    {messages.map((msg) => (
                       <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => !msg.is_read && markMessageRead(msg.id)}
                          className={clsx(
                             "bg-white dark:bg-zinc-900 p-6 rounded-[32px] border transition-all cursor-pointer relative group",
                             msg.is_read 
                                ? "border-outline-variant/10 opacity-60" 
                                : "border-bookvault-primary shadow-premium border-2"
                          )}
                       >
                          <div className="flex items-start gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-bookvault-surface-low overflow-hidden flex-shrink-0 border border-outline-variant/10 group-hover:scale-105 transition-transform">
                                {msg.sender?.avatar_url ? <img src={msg.sender.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-3" />}
                             </div>
                             <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-2">
                                      <h4 className="font-serif font-bold text-bookvault-primary text-lg">{msg.sender?.full_name || 'Reader'}</h4>
                                      <span className="text-[10px] text-on-surface-variant opacity-40">@{msg.sender?.username}</span>
                                   </div>
                                   <span className="text-[10px] font-black tracking-widest text-on-surface-variant opacity-40 uppercase">
                                      {new Date(msg.created_at).toLocaleDateString()}
                                   </span>
                                </div>
                                <p className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                {msg.is_read ? <CheckCheck size={18} className="text-emerald-500" /> : <Check size={18} className="text-bookvault-primary animate-pulse" />}
                             </div>
                          </div>
                          {!msg.is_read && (
                             <div className="absolute top-4 right-4 flex items-center gap-2">
                                <span className="bg-bookvault-primary text-white text-[8px] font-black uppercase px-2 py-1 rounded-full">New Message</span>
                             </div>
                          )}
                       </motion.div>
                    ))}
                 </div>
              ) : (
                 <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-dashed border-outline-variant/50 p-16 text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-bookvault-surface-low rounded-full flex items-center justify-center mx-auto mb-6 text-outline-variant/40">
                       <Mail size={32} />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-bookvault-primary">Quiet in the Library</h3>
                    <p className="text-on-surface-variant mt-2">No reader messages yet. Their direct feedback will appear here!</p>
                 </div>
              )}
           </div>
        ) : (
           /* Stories List */
           authorStoriesLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-12 h-12 text-bookvault-primary animate-spin opacity-20" />
              <p className="font-serif italic text-on-surface-variant">Gathering your manuscripts...</p>
            </div>
          ) : filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredStories.map(story => (
                  <motion.div
                    key={story.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <StoryCard 
                      story={story} 
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleVisibility={handleToggleVisibility}
                      onManage={(id) => navigate(`/author/story/${id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-dashed border-outline-variant/50 p-16 text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-bookvault-surface-low rounded-full flex items-center justify-center mx-auto mb-6 text-outline-variant/30">
                <BookText size={40} />
              </div>
              <h3 className="text-xl font-serif font-bold text-bookvault-primary">No Stories Found</h3>
              <p className="text-on-surface-variant mt-2 mb-8">
                {searchQuery ? "We couldn't find any manuscripts matching your search." : "Your shelf is currently empty. Time to start your next masterpiece!"}
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-3 bg-bookvault-primary text-white rounded-2xl font-bold shadow-premium hover:bg-bookvault-primary-container transition-all"
                >
                  Create My First Story
                </button>
              )}
            </div>
          )
        )}
      </div>

      <BottomNav />

      <StoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        story={editingStory}
      />
    </div>
  )
}

export default AuthorDashboard
