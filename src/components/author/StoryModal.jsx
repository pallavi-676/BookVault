import React, { useState, useEffect, useRef } from 'react'
import { X, Upload, Camera, Tag, Globe, Shield, Save, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'

const StoryModal = ({ isOpen, onClose, story = null }) => {
  const { createStory, updateStory, user } = useStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    genre: 'Fiction',
    coverUrl: '',
    language: 'English',
    matureContent: false,
    visibility: 'draft'
  })

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title || '',
        subtitle: story.subtitle || '',
        description: story.description || '',
        genre: story.genre || 'Fiction',
        coverUrl: story.coverUrl || '',
        language: story.language || 'English',
        matureContent: story.matureContent || false,
        visibility: story.visibility || 'draft'
      })
    } else {
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        genre: 'Fiction',
        coverUrl: '',
        language: 'English',
        matureContent: false,
        visibility: 'draft'
      })
    }
  }, [story, isOpen])

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-cover.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('story_covers')
        .upload(path, file)
      
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('story_covers').getPublicUrl(path)
      setFormData(prev => ({ ...prev, coverUrl: data.publicUrl }))
    } catch (err) {
      console.error('Cover upload failed:', err)
      let msg = 'Failed to upload cover image. '
      if (err.message?.includes('bucket not found')) {
        msg += 'Storage bucket "story_covers" not found. Please ensure you ran the SQL setup script.'
      } else if (err.status === 403 || err.message?.includes('policy')) {
        msg += 'Permission denied. Please check your Supabase Storage policies.'
      } else {
        msg += err.message || 'Please try again.'
      }
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (story) {
        await updateStory(story.id, formData)
      } else {
        await createStory(formData)
      }
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Story save failed:', err)
      alert('Failed to save story.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-bookvault-surface-lowest rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-bookvault-surface-low">
          <div>
            <h2 className="text-xl font-serif font-bold text-bookvault-primary">
              {story ? 'Edit Story Details' : 'Create New Story'}
            </h2>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              Configure your manuscript settings and metadata
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left Column: Cover & Simple Meta */}
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-4">Story Cover</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[2/3] w-full bg-bookvault-surface-low rounded-2xl border-2 border-dashed border-outline-variant/50 hover:border-bookvault-primary transition-all cursor-pointer overflow-hidden group relative flex flex-col items-center justify-center gap-4"
                >
                  {formData.coverUrl ? (
                    <>
                      <img src={formData.coverUrl} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" alt="Cover preview" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={40} className="text-white drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-bookvault-primary/10 rounded-full text-bookvault-primary group-hover:scale-110 transition-transform">
                        <Camera size={32} />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-medium text-bookvault-primary">Upload Cover</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">Recommended 600x900px</p>
                      </div>
                    </>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Primary Genre</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <select 
                      value={formData.genre}
                      onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-bookvault-surface-low border border-outline-variant/30 rounded-xl text-sm focus:ring-1 focus:ring-bookvault-primary appearance-none"
                    >
                      {['Fiction', 'Non-Fiction', 'Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Horror', 'Mystery', 'Poetry'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Language</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-bookvault-surface-low border border-outline-variant/30 rounded-xl text-sm focus:ring-1 focus:ring-bookvault-primary appearance-none"
                    >
                      {['English', 'Spanish', 'French', 'German', 'Italian', 'Japanese', 'Hindi'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Description, Body */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Story Title</label>
                <input 
                  type="text"
                  required
                  placeholder="The Chronicles of..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-5 py-3 bg-bookvault-surface-low border border-outline-variant/30 rounded-2xl text-lg font-serif placeholder:font-sans focus:ring-1 focus:ring-bookvault-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Subtitle (Optional)</label>
                <input 
                  type="text"
                  placeholder="A tale of mystery and wonder"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Synopsis / Description</label>
                <textarea 
                  rows={6}
                  required
                  placeholder="Write a compelling hook for your readers..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-5 py-4 bg-bookvault-surface-low border border-outline-variant/30 rounded-2xl text-sm leading-relaxed focus:ring-1 focus:ring-bookvault-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-10 pt-4">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, matureContent: !prev.matureContent }))}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-all relative",
                      formData.matureContent ? "bg-red-500" : "bg-outline-variant/30"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      formData.matureContent ? "left-7" : "left-1"
                    )} />
                  </button>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className={formData.matureContent ? "text-red-500" : "text-on-surface-variant"} />
                    <span className="text-xs font-bold uppercase tracking-wider">Mature Content (18+)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-bookvault-surface-low p-1 rounded-xl border border-outline-variant/30">
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'draft' }))}
                      className={clsx(
                        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        formData.visibility === 'draft' ? "bg-bookvault-surface-lowest dark:bg-zinc-800 shadow-sm text-bookvault-primary" : "text-on-surface-variant"
                      )}
                    >
                      Draft
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'published' }))}
                      className={clsx(
                        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        formData.visibility === 'published' ? "bg-bookvault-primary text-white shadow-sm" : "text-on-surface-variant"
                      )}
                    >
                      Published
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/30 flex items-center justify-end gap-4 bg-bookvault-surface-low">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-black/5 rounded-full transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || !formData.title}
            className={clsx(
              "px-8 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-premium",
              success ? "bg-emerald-500 text-white" : "bg-bookvault-primary text-white hover:bg-bookvault-primary-container disabled:opacity-50"
            )}
          >
            {success ? <Check size={18} /> : <Save size={18} />}
            {success ? 'Saved!' : story ? 'Update Story' : 'Create Story'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default StoryModal
