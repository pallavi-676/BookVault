import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Menu, Settings as SettingsIcon, ChevronRight, Bookmark, Maximize, Share2, Trash2, Upload, Library } from 'lucide-react'
import { useStore } from '../store/useStore'
import { clsx } from 'clsx'
import { getBookFile } from '../utils/bookStorage'

// Lazy loaded engines
const PDFReader = lazy(() => import('../components/reader/PDFReader'))
const EPUBReader = lazy(() => import('../components/reader/EPUBReader'))
const TXTReader = lazy(() => import('../components/reader/TXTReader'))

// Pre-define a premium engine loader
const EngineLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-bookvault-surface z-20">
    <div className="w-12 h-12 border-4 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin" />
    <div className="text-center">
      <p className="font-serif italic text-lg opacity-70">Spawning Reader Engine...</p>
      <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mt-2">Connecting to Knowledge Core</p>
    </div>
  </div>
)

import SelectionToolbar from '../components/interaction/SelectionToolbar'
import ReaderSidebar from '../components/reader/ReaderSidebar'
import NoteModal from '../components/interaction/NoteModal'

const Reader = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { 
    books, readingProgress, updateProgress, theme, setTheme, fileBlobs, setFileBlob, removeBook,
    addAnnotation, addBookmark, bookmarks, annotations,
    readerSettings, updateReaderSettings, updateUserStats
  } = useStore()
  
  const readerRef = useRef(null)
  
  const book = books?.find(b => b.id === id)
  const bookFile = fileBlobs?.[id]
  const [fileUrl, setFileUrl] = useState(null)
  const [isRecovering, setIsRecovering] = useState(false)
  
  const [showNav, setShowNav] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toc, setToc] = useState([])
  
  // Selection State
  const [selection, setSelection] = useState({ active: false, text: '', x: 0, y: 0 })
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [pendingAnnotation, setPendingAnnotation] = useState(null)
  
  // Safely determine current location and protect against corrupted saved state (e.g., pdf.js dest objects)
  const rawLocation = readingProgress?.[id]?.location || 1
  let initialLocation = 1;
  if (typeof rawLocation === 'object' || Array.isArray(rawLocation)) {
    initialLocation = 1;
  } else if (book?.type === 'pdf') {
    initialLocation = Number(rawLocation) || 1;
  } else {
    initialLocation = rawLocation;
  }
  
  const [currentLocation, setCurrentLocation] = useState(initialLocation)
  const [numPages, setNumPages] = useState(null)

  // Active Time Tracker - Logs reading time continuously into store while reader is mounted
  useEffect(() => {
    let lastTime = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastTime
      lastTime = now
      updateUserStats({ totalReadingTimeMs: elapsed })
    }, 10000)

    return () => clearInterval(interval)
  }, [updateUserStats])

  useEffect(() => {
    if (!id) return
    let active = true
    let currentUrl = null

    const loadFile = async () => {
      if (bookFile instanceof File) {
        currentUrl = URL.createObjectURL(bookFile)
        if (active) setFileUrl(currentUrl)
      } else if (bookFile) {
        if (active) setFileUrl(bookFile)
      } else if (book) {
        setIsRecovering(true)
        try {
          const recoveredFile = await getBookFile(id)
          if (active && recoveredFile) {
            setFileBlob(id, recoveredFile)
            currentUrl = URL.createObjectURL(recoveredFile)
            setFileUrl(currentUrl)
          } else if (active && book.fileUrl) {
            setFileUrl(book.fileUrl)
          }
        } catch (error) {
          console.error('Error recovering book:', error)
        } finally {
          if (active) setIsRecovering(false)
        }
      }
    }
    
    loadFile()

    return () => {
      active = false
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [bookFile, book, id])

  // Hide nav after inactivity
  useEffect(() => {
    let timeout
    if (showNav) {
      timeout = setTimeout(() => setShowNav(false), 3000)
    }
    return () => clearTimeout(timeout)
  }, [showNav])

  const themes = [
    { id: 'light', name: 'Light', bg: 'bg-bookvault-surface', text: 'text-bookvault-primary', border: 'border-outline-variant' },
    { id: 'sepia', name: 'Sepia', bg: 'bg-[#EAD7D1]', text: 'text-[#5D3A3A]', border: 'border-[#D9C4BE]' },
    { id: 'dark', name: 'Dark', bg: 'bg-bookvault-surface', text: 'text-bookvault-primary', border: 'border-outline-variant' },
  ]

  const currentTheme = themes.find(t => t.id === theme) || themes[0]

  const handleLocationChange = (loc) => {
    // Prevent React crashes if PDF outline mapping returns a complex destination object
    if (typeof loc === 'object' || Array.isArray(loc)) {
      console.warn("Complex pdf coordinate destination ignored to prevent React crashes.", loc)
      alert("This PDF uses complex matrix destinations for chapters which are not yet supported in this viewer.")
      return;
    }
    setCurrentLocation(loc)
    const percentage = numPages ? (loc / numPages) * 100 : 0
    updateProgress(id, { location: loc, percentage })
    
    // Accumulate total pages read across all sessions globally
    updateUserStats({ totalPagesRead: 1 })
  }

  const handleDocumentLoad = (total) => {
    setNumPages(total)
    if (currentLocation) {
      const percentage = (currentLocation / total) * 100
      updateProgress(id, { percentage })
    }
  }

  // Geometry Stitching Algorithm to fuse adjacent disjoint PDF text spans into solid blocks
  const stitchRects = (clientRects, pageRect) => {
    const rects = Array.from(clientRects)
      .filter(r => r.width > 2 && r.height > 2)
      .map(r => ({ top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height }))

    if (!rects.length) return []

    // Sort top-to-bottom, left-to-right
    rects.sort((a, b) => {
      if (Math.abs(a.top - b.top) > 5) return a.top - b.top
      return a.left - b.left
    })

    const merged = [rects[0]]
    for (let i = 1; i < rects.length; i++) {
      const curr = rects[i]
      const prev = merged[merged.length - 1]

      // Same horizontal line heuristic and reasonably close left-to-right (accounting for PDF spaces)
      if (Math.abs(curr.top - prev.top) < 10 && (curr.left - prev.right) < 40) {
        prev.right = Math.max(prev.right, curr.right)
        prev.width = prev.right - prev.left
        prev.top = Math.min(prev.top, curr.top)
        prev.bottom = Math.max(prev.bottom, curr.bottom)
        prev.height = prev.bottom - prev.top
      } else {
        merged.push({ ...curr })
      }
    }

    // Translate absolute screen pixels into highly fluid resolution-independent percentages
    return merged.map(r => ({
      top: ((r.top - pageRect.top) / pageRect.height) * 100,
      left: ((r.left - pageRect.left) / pageRect.width) * 100,
      width: (r.width / pageRect.width) * 100,
      height: (r.height / pageRect.height) * 100
    }))
  }

  const handleSelection = (e) => {
    const sel = window.getSelection()
    const text = sel.toString().trim()
    
    if (text && text.length > 0 && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      let rects = null
      if (book.type === 'pdf') {
        const pageEl = document.querySelector('.react-pdf__Page')
        if (pageEl) {
          rects = stitchRects(range.getClientRects(), pageEl.getBoundingClientRect())
        }
      }

      setSelection({
        active: true,
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
        rects
      })
    } else {
      setSelection({ ...selection, active: false })
    }
  }

  const onToolbarAction = (action, data) => {
    if (action === 'highlight') {
      const sel = window.getSelection()
      if (sel.rangeCount > 0) {
        sel.removeAllRanges()
      }

      addAnnotation(id, {
        id: `ann_${Date.now()}`,
        type: 'highlight',
        text: selection.text,
        color: data.color || 'rgba(244, 114, 182, 0.4)',
        style: data.style || 'highlight',
        location: currentLocation,
        rects: selection.rects,
        timestamp: new Date().toISOString()
      })
    } else if (action === 'note') {
      setPendingAnnotation({
        id: `ann_${Date.now()}`,
        type: 'note',
        text: selection.text,
        location: currentLocation,
        rects: selection.rects,
        color: '#FFEB3B'
      })
      setShowNoteModal(true)
    } else if (action === 'dictionary') {
      window.open(`https://www.google.com/search?q=define+${selection.text}`, '_blank')
    }
    setSelection({ ...selection, active: false })
  }

  const onSaveNote = (note) => {
    addAnnotation(id, {
      ...pendingAnnotation,
      note,
      timestamp: new Date().toISOString()
    })
    setPendingAnnotation(null)
  }

  const handleSearch = async (query) => {
    if (readerRef.current?.search) {
      return await readerRef.current.search(query)
    }
    return []
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-bookvault-surface-low rounded-full flex items-center justify-center mb-6 text-outline-variant">
          <Library className="opacity-20" size={40} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-bookvault-primary mb-2">Book Not Found</h2>
        <p className="text-on-surface-variant max-w-xs mb-8">This manuscript seems to be missing from your library catalog.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-bookvault-primary text-white rounded-full hover:bg-bookvault-primary-container transition-all"
        >
          Return to Library
        </button>
      </div>
    )
  }

  if (!fileUrl && !isRecovering) {
    return (
      <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-bookvault-surface-low rounded-full flex items-center justify-center mb-6 text-outline-variant">
          <Upload className="opacity-20 text-bookvault-primary" size={40} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-bookvault-primary mb-2">Content Missing</h2>
        <p className="text-on-surface-variant max-w-sm mb-4">
          The manuscript file for <strong>"{book.title}"</strong> is not in your local vault.
        </p>
        <p className="text-sm text-on-surface-variant/70 max-w-xs mb-8">
          This can happen if you cleared your browser data or if the book was uploaded on a different device.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-outline-variant text-bookvault-primary rounded-full hover:bg-bookvault-surface-low transition-all"
          >
            Go Back
          </button>
          <button 
            onClick={() => {
              // Trigger delete and then user can re-upload
              if (window.confirm("Remove this entry so you can re-upload?")) {
                removeBook(book.id)
                navigate('/dashboard')
              }
            }}
            className="px-6 py-2 bg-bookvault-primary text-white rounded-full hover:bg-bookvault-primary-container transition-all"
          >
            Remove & Re-upload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx("fixed inset-0 flex flex-col transition-colors duration-500 overflow-hidden", currentTheme.bg, currentTheme.text)}>
      {/* Top Navigation Bar */}
      <AnimatePresence>
        {showNav && (
          <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 h-16 glass z-50 px-6 flex items-center justify-between border-b border-black/5"
          >
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
                title="Back to Dashboard"
              >
                <ChevronLeft size={20} md:size={24} />
              </button>
              <div className="flex flex-col min-w-0">
                <h2 className="text-xs md:text-sm font-serif font-bold line-clamp-1">{book.title}</h2>
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest opacity-60 truncate">{book.author || 'Unknown Author'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={() => setSidebarOpen(true)}
                className={clsx("p-2 rounded-full transition-all", sidebarOpen ? "bg-bookvault-primary text-white" : "hover:bg-black/5")} 
                title="Table of Contents"
              >
                <Menu size={18} md:size={20} />
              </button>
              <button 
                onClick={() => {
                   addBookmark(id, { label: `Page ${currentLocation}`, location: currentLocation, timestamp: new Date().toISOString() })
                }}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-bookvault-secondary hidden sm:flex" 
                title="Save Bookmark"
              >
                <Bookmark size={20} />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={clsx("p-2 rounded-full transition-all duration-300", showSettings ? "bg-bookvault-primary text-white scale-110 shadow-lg" : "hover:bg-black/5")}
                title="Reading Settings"
              >
                <SettingsIcon size={18} md:size={20} />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
                    removeBook(id)
                    navigate('/dashboard')
                  }
                }}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-red-500/70 hover:text-red-600 hidden md:flex" 
                title="Delete Book"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Settings Popover */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-20 right-6 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-premium z-[60] border border-black/5 p-6 text-gray-900 dark:text-gray-100"
          >
            <div className="space-y-8">
              {/* Themes */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-4 block">Background</label>
                <div className="grid grid-cols-3 gap-3">
                  {themes.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={clsx(
                        "h-12 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-[10px] uppercase tracking-wider",
                        t.bg, t.text,
                        theme === t.id ? "border-bookvault-primary scale-105 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size (Zoom Scale for PDF) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-4 block">Scale Size</label>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold opacity-40">A</span>
                  <input 
                    type="range" 
                    min="14" 
                    max="48" 
                    value={readerSettings?.fontSize || 16}
                    onChange={(e) => updateReaderSettings({ fontSize: parseInt(e.target.value) })}
                    className="flex-1 accent-bookvault-primary h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-bold opacity-80">A</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Content Area */}
      <main 
        className="flex-1 relative transition-all duration-500 overflow-hidden"
        onMouseUp={handleSelection}
        onClick={(e) => {
          const width = window.innerWidth
          const x = e.clientX
          if (x > width * 0.25 && x < width * 0.75) {
            setShowNav(!showNav)
          }
        }}
      >
        {isRecovering ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin" />
            <div className="text-center">
              <p className="font-serif italic text-lg opacity-70">Recovering your manuscript...</p>
              <p className="text-[10px] uppercase tracking-widest opacity-40 mt-2">Restoring from local storage</p>
            </div>
          </div>
        ) : (
          <Suspense fallback={<EngineLoader />}>
            {book.type === 'pdf' && (
              <PDFReader 
                ref={readerRef}
                file={fileUrl} 
                currentPage={currentLocation || 1} 
                onPageChange={handleLocationChange}
                onDocumentLoad={handleDocumentLoad}
                onTOCLoad={setToc}
                theme={theme}
                fontSize={readerSettings?.fontSize}
              />
            )}
            
            {book.type === 'epub' && (
              <EPUBReader 
                ref={readerRef}
                url={fileUrl} 
                title={book.title}
                location={currentLocation}
                onLocationChange={handleLocationChange}
                onTOCLoad={setToc}
                theme={theme}
                fontSize={readerSettings?.fontSize}
              />
            )}

            {book.type === 'txt' && (
              <TXTReader 
                ref={readerRef}
                content={book.content}
                theme={theme}
                fontSize={readerSettings?.fontSize}
                fontFamily={readerSettings?.fontFamily}
              />
            )}
          </Suspense>
        )}

        {/* Navigation Overlays */}
        <div 
          className="absolute inset-y-0 left-0 w-[15%] md:w-[20%] z-10 cursor-alias flex items-center justify-start pl-4 md:pl-8 group"
          onClick={() => {
            if (book.type === 'pdf' && currentLocation > 1) handleLocationChange(currentLocation - 1)
          }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full glass border border-black/5 flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity">
            <ChevronLeft size={20} md:size={24} />
          </div>
        </div>
        <div 
          className="absolute inset-y-0 right-0 w-[15%] md:w-[20%] z-10 cursor-alias flex items-center justify-end pr-4 md:pr-8 group"
          onClick={() => {
            if (book.type === 'pdf' && currentLocation < numPages) handleLocationChange(currentLocation + 1)
          }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full glass border border-black/5 flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity">
            <ChevronRight size={20} md:size={24} />
          </div>
        </div>
      </main>

      {/* Footer Progress */}
      <footer className="h-10 md:h-12 px-4 md:px-8 flex items-center justify-between text-[9px] md:text-[10px] font-bold tracking-widest opacity-40 uppercase border-t border-black/5 pb-safe">
        <div className="flex items-center gap-4 hidden sm:flex">
          <span className="truncate max-w-[150px]">{book.title}</span>
        </div>
        
        <div className="flex-1 mx-4 md:mx-40">
          <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-current transition-all duration-300"
              animate={{ width: (book.type === 'pdf' && numPages) ? `${(currentLocation / numPages) * 100}%` : '0%' }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 min-w-[80px] md:min-w-[100px] justify-end tabular-nums">
          {book.type === 'pdf' ? (
            <span>{typeof currentLocation === 'object' ? '...' : currentLocation} / {numPages || '?'}</span>
          ) : (
            <span>Pos {typeof currentLocation === 'object' ? '...' : currentLocation}</span>
          )}
        </div>
      </footer>

      {/* Conditional Overlays */}
      <ReaderSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        bookId={id}
        onNavigate={handleLocationChange}
        toc={toc}
        onSearch={handleSearch}
      />

      <AnimatePresence>
        {selection.active && (
          <SelectionToolbar 
            position={{ x: selection.x, y: selection.y }}
            selectedText={selection.text}
            onAction={onToolbarAction}
            onClose={() => setSelection({ ...selection, active: false })}
          />
        )}
      </AnimatePresence>

      <NoteModal 
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={onSaveNote}
        highlightText={pendingAnnotation?.text}
      />
    </div>
  )
}

export default Reader
