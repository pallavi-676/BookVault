import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Type, 
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  UserCheck,
  CreditCard,
  Target,
  X,
  Check,
  Image as ImageIcon,
  MoreVertical,
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { clsx } from 'clsx'

const ChapterEditor = () => {
  const { storyId, chapterId } = useParams()
  const navigate = useNavigate()
  const { chapters, updateChapter, chaptersLoading } = useStore()
  
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const [chapter, setChapter] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [wordCount, setWordCount] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // Interaction states for "Pro Preview" fields
  const [followersOnly, setFollowersOnly] = useState(false)
  const [isPaid, setIsPaid] = useState(false)


  // Load Chapter
  useEffect(() => {
    const chap = chapters.find(c => c.id === chapterId)
    if (chap) {
      setChapter(chap)
      setTitle(chap.title)
      setContent(chap.content || '')
      setFollowersOnly(chap.followersOnly || false)
      if (editorRef.current && editorRef.current.innerHTML !== chap.content) {
        editorRef.current.innerHTML = chap.content || ''
      }
    }
  }, [chapterId, chapters])

  // Word count calc
  useEffect(() => {
    const text = editorRef.current?.innerText || ''
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    setWordCount(words.length)
  }, [content])

  // Auto-save logic
  useEffect(() => {
    // Listen for manual content changes (like image deletion)
    const handleManualChange = () => {
      handleContentChange();
    };
    window.addEventListener('content-changed', handleManualChange);
    return () => window.removeEventListener('content-changed', handleManualChange);
  }, []);

  useEffect(() => {
    if (!dirty) return
    
    const timer = setTimeout(() => {
      handleSave()
    }, 30000) // 30 second auto-save

    return () => clearTimeout(timer)
  }, [dirty, title])

  const handleSave = async () => {
    if (!chapter) return
    setSaving(true)
    try {
      const currentContent = editorRef.current?.innerHTML || ''
      await updateChapter(chapterId, {
        ...chapter,
        title,
        content: currentContent,
        followersOnly
      })
      setDirty(false)
      setSaveSuccess(true)
      setLastSaved(new Date())
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const execCommand = (command, value = null) => {
    editorRef.current.focus();
    
    // Cross-browser heading support
    if (command === 'formatBlock' && (value === 'h1' || value === 'h2')) {
       // Some browsers prefer <h1>, some prefer H1, some prefer <div> for p
       document.execCommand(command, false, value.toUpperCase());
    } else {
       document.execCommand(command, false, value);
    }
    
    handleContentChange();
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { user } = useStore.getState();
    if (!user) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('chapter-assets')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chapter-assets')
        .getPublicUrl(filePath);

      // Insert image with a wrapper for deletion management
      const imgHtml = `
        <figure class="relative group my-8" contenteditable="false">
          <img src="${publicUrl}" class="rounded-[32px] shadow-premium border-4 border-white dark:border-zinc-800 transition-all hover:ring-4 hover:ring-bookvault-secondary/20" alt="Chapter Image" />
          <button 
            onclick="this.parentElement.remove(); window.dispatchEvent(new Event('content-changed'));"
            class="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            title="Remove Image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-3 0v4"/></svg>
          </button>
        </figure><p><br></p>`;
      
      document.execCommand('insertHTML', false, imgHtml);
      handleContentChange();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please ensure the "chapter-assets" bucket exists in Supabase.');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleContentChange = () => {
    setDirty(true)
    setContent(editorRef.current.innerHTML)
  }


  if (chaptersLoading && !chapter) {
    return (
      <div className="min-h-screen bg-bookvault-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-bookvault-primary animate-spin opacity-20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex flex-col pb-safe">
      {/* Header Toolbar */}
      <header className="h-16 md:h-20 border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-8 bg-bookvault-surface-lowest z-50">
        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
          <button 
            onClick={() => {
              if (dirty) {
                if (window.confirm('You have unsaved changes. Exit anyway?')) navigate(`/author/story/${storyId}`)
              } else {
                navigate(`/author/story/${storyId}`)
              }
            }}
            className="p-2 md:p-3 hover:bg-black/5 rounded-full text-on-surface-variant transition-colors"
          >
            <ArrowLeft size={20} md:size={24} />
          </button>
          <div className="h-6 md:h-8 w-px bg-outline-variant/30" />
          <div className="flex-1 min-w-0">
            <input 
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              className="bg-transparent border-none text-base md:text-lg font-serif font-bold text-bookvault-primary outline-none focus:ring-1 focus:ring-bookvault-primary/20 rounded-md px-1 md:px-2 py-1 w-full max-w-sm"
              placeholder="Chapter Title..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-2">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
            {saving ? (
              <span className="flex items-center gap-2 italic text-bookvault-primary"><Loader2 size={12} className="animate-spin" /> Syncing</span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-2 text-emerald-500"><Check size={12} /> Synced</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-2">Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            ) : null}
          </div>
          
          <div className="hidden md:block h-8 w-px bg-outline-variant/30 mx-2" />
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className={clsx(
              "flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm",
              saveSuccess ? "bg-emerald-500 text-white" : 
              dirty ? "bg-bookvault-primary text-white hover:bg-bookvault-primary-container" : 
              "bg-bookvault-surface-low text-on-surface-variant/40"
            )}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
            <span className="hidden xs:inline">{saveSuccess ? 'Saved!' : 'Save'}</span>
          </button>
          
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-bookvault-surface-low text-bookvault-primary rounded-xl text-xs md:text-sm font-bold hover:bg-black/5 transition-all"
          >
            <Eye size={16} />
            <span className="hidden xs:inline">Preview</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden lg:static">
        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto bg-bookvault-surface shadow-inner p-4 md:p-10 lg:p-20 flex justify-center no-scrollbar">
          <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 min-h-[140vh] rounded-[32px] md:rounded-[40px] shadow-premium p-6 md:p-20 relative">
            {/* Rich Text Toolbar - Floating */}
            <div className="sticky top-0 z-20 flex justify-center mb-8 md:mb-12">
              <div className="flex items-center gap-0.5 md:gap-1 bg-zinc-900/90 backdrop-blur-md p-1 md:p-1.5 rounded-2xl shadow-2xl border border-white/10 text-white overflow-x-auto max-w-full no-scrollbar">
                <button 
                  onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} 
                  className="p-3 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Bold size={18} />
                </button>
                <button 
                  onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} 
                  className="p-3 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Italic size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button 
                  onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'h1'); }} 
                  className="p-3 hover:bg-white/10 rounded-xl transition-all" 
                  title="Heading 1"
                >
                  <Heading1 size={18} />
                </button>
                <button 
                  onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'h2'); }} 
                  className="p-3 hover:bg-white/10 rounded-xl transition-all" 
                  title="Heading 2"
                >
                  <Heading2 size={18} />
                </button>
                <button 
                  onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'p'); }} 
                  className="p-3 hover:bg-white/10 rounded-xl transition-all" 
                  title="Paragraph"
                >
                  <Type size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  hidden 
                  accept="image/*" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-3 hover:bg-white/10 rounded-xl transition-all text-bookvault-secondary" 
                  title="Insert Local Image"
                >
                  <ImageIcon size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <div className="px-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
                  {wordCount.toLocaleString()} Words
                </div>
              </div>
            </div>

            {/* Editable Content */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              className="prose prose-zinc dark:prose-invert max-w-none pt-4 focus:outline-none min-h-[100vh] text-lg leading-relaxed font-serif
                         prose-h1:text-4xl prose-h1:font-bold prose-h1:font-serif prose-h1:text-bookvault-primary prose-h1:mb-8 prose-h1:mt-12
                         prose-h2:text-2xl prose-h2:font-bold prose-h2:font-serif prose-h2:text-bookvault-primary prose-h2:mb-6 prose-h2:mt-10
                         prose-img:rounded-[32px] prose-img:shadow-premium prose-img:border-4 prose-img:border-white dark:prose-img:border-zinc-800"
              placeholder="Once upon a time..."
              onKeyDown={(e) => {
                 if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    handleSave();
                 }
              }}
            />
          </div>
        </main>

        {/* Sidebar Settings - Mobile Drawer / PC Toggle */}
        <aside className="hidden lg:block w-80 border-l border-outline-variant/30 p-8 bg-bookvault-surface-lowest overflow-y-auto space-y-10">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-6">Publication Status</h4>
            <div className="space-y-4">
              <button 
                onClick={async () => {
                  if (!chapter) return; // Guard against null chapter object
                  const newStatus = chapter.status === 'published' ? 'draft' : 'published'
                  await updateChapter(chapterId, { ...chapter, status: newStatus })
                  setChapter(prev => prev ? ({...prev, status: newStatus}) : null)
                }}
                className={clsx(
                  "w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center gap-4",
                  chapter?.status === 'published' ? "border-emerald-500 bg-emerald-500/5 shadow-inner" : "border-outline-variant/20 bg-bookvault-surface-low"
                )}
              >
                <div className={clsx(
                  "p-2 rounded-lg",
                  chapter?.status === 'published' ? "bg-emerald-500 text-white" : "bg-outline-variant/30 text-on-surface-variant"
                )}>
                  <CheckCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-bookvault-primary">
                    {chapter?.status === 'published' ? 'Published' : 'Draft'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">Visible to readers</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-6 flex items-center justify-between">
              Monetization
              <span className="px-2 py-0.5 bg-bookvault-secondary text-white rounded text-[8px] font-black tracking-tighter">Pro Preview</span>
            </h4>
            <div className="space-y-4">
              <button 
                onClick={() => { setFollowersOnly(!followersOnly); setDirty(true); }}
                className={clsx(
                  "w-full p-4 rounded-2xl border transition-all flex items-center justify-between",
                  followersOnly ? "bg-bookvault-secondary/10 border-bookvault-secondary" : "bg-bookvault-surface-low border-outline-variant/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <UserCheck size={18} className="text-bookvault-secondary" />
                  <span className="text-xs font-bold text-bookvault-primary">Followers Only</span>
                </div>
                <div className={clsx(
                   "w-8 h-4 rounded-full relative transition-all",
                   followersOnly ? "bg-bookvault-secondary" : "bg-outline-variant/30"
                )}>
                  <div className={clsx(
                     "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                     followersOnly ? "left-4.5" : "left-0.5"
                  )} />
                </div>
              </button>
              
              <button 
                onClick={() => setIsPaid(!isPaid)}
                className={clsx(
                  "w-full p-4 rounded-2xl border transition-all flex items-center justify-between",
                  isPaid ? "bg-bookvault-secondary/10 border-bookvault-secondary" : "bg-bookvault-surface-low border-outline-variant/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-bookvault-secondary" />
                  <span className="text-xs font-bold text-bookvault-primary">Paid Access</span>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">{isPaid ? '$0.99' : '$0.00'}</span>
              </button>
            </div>
          </div>

          <div>
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-6">Chapter Tips</h4>
             <div className="bg-bookvault-primary/5 p-5 rounded-2xl border border-bookvault-primary/10">
               <Target size={20} className="text-bookvault-primary mb-3" />
               <p className="text-xs text-bookvault-primary font-medium leading-relaxed">
                 Great opening paragraphs set the hook. Aim for 1,500–2,500 words per chapter for maximum reader retention.
               </p>
             </div>
          </div>
        </aside>
      </div>

      {/* Preview Modal */}
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
               className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Eye size={20} className="text-bookvault-primary" />
                    <span className="text-sm font-bold uppercase tracking-widest text-bookvault-primary">Preview Mode</span>
                 </div>
                 <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 md:p-20">
                 <h1 className="text-4xl font-serif font-bold text-bookvault-primary mb-12 text-center">{title}</h1>
                 <div 
                    className="prose prose-lg prose-zinc dark:prose-invert max-w-none font-serif leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                 />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChapterEditor
