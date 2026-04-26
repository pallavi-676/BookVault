import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import BookCard from '../components/library/BookCard'
import { useStore } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Upload as UploadIcon, Library } from 'lucide-react'
import { clsx } from 'clsx'
import { saveBookFile, uploadBookToCloud } from '../utils/bookStorage'
import BottomNav from '../components/layout/BottomNav'

const Dashboard = () => {
  const { 
    books, addBook, readingProgress, setFileBlob, searchQuery,
    userWishlist, favoriteStories, currentlyReading, finishedStories,
    fetchPublicStory
  } = useStore()
  const [activeCategory, setActiveCategory] = useState('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [storyBooks, setStoryBooks] = useState([])
  const [loadingStories, setLoadingStories] = useState(false)
  const navigate = useNavigate()
  const { user, userProfile } = useStore()

  // Root Identity Audit
  React.useEffect(() => {
    console.group('🛡️ BookVault Identity Audit');
    console.table({
      "User Context": "Logged In",
      "Auth Email": user?.email,
      "Auth UID": user?.id,
      "Profile Role": userProfile?.role,
      "Isolation State": "Isolated & Sanitized"
    });
    console.groupEnd();
  }, [user, userProfile]);

  // Fetch story details for cards in specific categories
  React.useEffect(() => {
     const loadStories = async () => {
        if (['wishlist', 'favorites', 'reading', 'finished'].includes(activeCategory)) {
           setLoadingStories(true)
           let ids = []
           if (activeCategory === 'wishlist') ids = userWishlist.filter(w => w.category === 'read_later').map(w => w.story_id)
           if (activeCategory === 'favorites') ids = favoriteStories
           if (activeCategory === 'reading') ids = currentlyReading
           if (activeCategory === 'finished') ids = finishedStories

           const stories = await Promise.all(ids.map(id => fetchPublicStory(null, null, id)))
           setStoryBooks(stories.filter(Boolean).map(s => ({
              id: s.id,
              title: s.title,
              author: s.profiles?.full_name || 'Unknown',
              coverUrl: s.cover_url,
              type: 'story',
              slug: s.slug,
              username: s.profiles?.username
           })))
           setLoadingStories(false)
        } else {
           setStoryBooks([])
        }
     }
     loadStories()
  }, [activeCategory, userWishlist, favoriteStories, currentlyReading, finishedStories, fetchPublicStory])

  const fetchCover = async (title) => {
    try {
      const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`)
      const data = await response.json()
      if (data.docs && data.docs[0] && data.docs[0].cover_i) {
        return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`
      }
    } catch (error) {
      console.error('Error fetching cover:', error)
    }
    return null
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        const title = file.name.replace(/\.[^/.]+$/, "")
        
        // Fetch cover (don't let this block the whole process if it's slow)
        let coverUrl = null
        try {
          coverUrl = await Promise.race([
            fetchCover(title),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ])
        } catch (apiError) {
          console.warn('Cover fetch failed or timed out:', apiError)
        }
        
        const bookId = Math.random().toString(36).substr(2, 9)
        
        const newBook = {
          id: bookId,
          title: title,
          author: 'Unknown Author',
          fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: file.name.split('.').pop().toLowerCase(),
          uploadDate: new Date().toISOString(),
          coverUrl: coverUrl,
          fileUrl: '',
        }
        
        // Store the actual file for the reader engine and persistent local storage
        setFileBlob(bookId, file)
        await saveBookFile(bookId, file)
        await uploadBookToCloud(bookId, file)
        addBook(newBook)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Failed to upload: ${error.message || 'Unknown error'}. Please try refreshing the page.`)
    } finally {
      setIsUploading(false)
      setIsUploadModalOpen(false)
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    if (activeCategory === 'all') return true
    if (activeCategory === 'reading') return readingProgress[book.id]?.percentage > 0 && readingProgress[book.id]?.percentage < 100
    if (activeCategory === 'finished') return readingProgress[book.id]?.percentage === 100
    return false
  })

  const allDisplayItems = [...filteredBooks, ...storyBooks]

  return (
    <div className="min-h-screen bg-bookvault-surface pb-20 lg:pb-0">
      <Navbar onUploadClick={() => setIsUploadModalOpen(true)} />
      
      <div className="flex pt-20">
        <Sidebar 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
        
        <main className="flex-1 p-4 md:p-8 lg:pl-64 transition-all duration-300">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-12">
            <header className="space-y-0.5 md:space-y-2">
              <h1 className="text-xl md:text-4xl font-serif font-bold text-bookvault-primary tracking-tight">Your Digital Library</h1>
              <p className="text-on-surface-variant/60 text-[10px] md:text-sm font-medium italic">Discover treasures you've archived.</p>
            </header>

            {/* Category Filter - Scrollable on Mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
              {['all', 'reading', 'finished', 'wishlist', 'favorites'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border",
                    activeCategory === cat 
                      ? "bg-bookvault-primary text-white border-bookvault-primary shadow-premium" 
                      : "bg-bookvault-surface-low text-on-surface-variant border-outline-variant/10 hover:border-bookvault-primary/30"
                  )}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {(allDisplayItems || []).length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-8"
              >
                {(allDisplayItems || []).map((item) => (
                  <BookCard 
                    key={item.id} 
                    book={item} 
                    progress={item.type === 'story' ? 0 : (readingProgress[item.id]?.percentage || 0)}
                    onClick={() => {
                       if (item.type === 'story') {
                          navigate(`/@${item.username}/${item.slug}`)
                       } else {
                          navigate(`/reader/${item.id}`)
                       }
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 bg-bookvault-surface-low rounded-full flex items-center justify-center mb-6 text-outline-variant">
                  <Library className="opacity-20" size={40} />
                </div>
                <h3 className="text-xl font-serif font-bold text-bookvault-primary mb-2">No books found</h3>
                <p className="text-on-surface-variant max-w-xs mb-8">
                  Start your collection by uploading your favorite PDF, EPUB, or TXT files.
                </p>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-bookvault-primary text-white rounded-full font-medium hover:bg-bookvault-primary-container transition-all shadow-premium"
                >
                  <Plus size={20} />
                  <span>Upload your first book</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-bookvault-primary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-bookvault-surface-lowest rounded-book shadow-premium p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-bookvault-primary">Add New Book</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-bookvault-surface-low rounded-full">
                  <X size={20} className="text-on-surface-variant" />
                </button>
              </div>

              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
                className={clsx(
                  "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative",
                  isDragging 
                    ? "border-bookvault-primary bg-bookvault-primary/5" 
                    : "border-outline-variant/30 hover:border-bookvault-primary/50 hover:bg-bookvault-surface-low"
                )}
                onClick={() => !isUploading && document.getElementById('file-upload').click()}
              >
                {isUploading && (
                  <div className="absolute inset-0 bg-bookvault-surface-lowest/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin" />
                    <p className="text-sm font-bold text-bookvault-primary">Curating your library...</p>
                  </div>
                )}
                <input 
                  id="file-upload" 
                  type="file" 
                  multiple 
                  accept=".pdf,.epub,.txt" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <div className="w-16 h-16 bg-bookvault-surface-low rounded-full flex items-center justify-center mb-4 text-bookvault-primary">
                  <UploadIcon size={32} />
                </div>
                <p className="text-bookvault-primary font-bold mb-1">Click or drag & drop</p>
                <p className="text-on-surface-variant text-sm mb-4">PDF, EPUB, or TXT (up to 50MB)</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-bookvault-surface-low rounded-md text-[10px] font-bold text-on-surface-variant">PDF</span>
                  <span className="px-3 py-1 bg-bookvault-surface-low rounded-md text-[10px] font-bold text-on-surface-variant">EPUB</span>
                  <span className="px-3 py-1 bg-bookvault-surface-low rounded-md text-[10px] font-bold text-on-surface-variant">TXT</span>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard
