import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useParams } from 'react-router-dom'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use a reliable worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDFReader = forwardRef(({ file, currentPage, onPageChange, onDocumentLoad, onTOCLoad, theme, fontSize }, ref) => {
  const [pdfInstance, setPdfInstance] = useState(null)
  const [containerWidth, setContainerWidth] = useState(window.innerWidth)
  const [scale, setScale] = useState(1.0)

  // Track window resize to ensure fluid mobile stretching
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setContainerWidth(window.innerWidth);
      }, 50);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  // Expose zoom controls to parent via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => setScale(prev => Math.min(prev + 0.2, 3.0)),
    zoomOut: () => setScale(prev => Math.max(prev - 0.2, 0.5)),
    resetZoom: () => setScale(1.0),
    search: async (query) => {
      if (!pdfInstance || !query) return []
      const results = []
      
      // Iterate through pages to find text matches (Simplified index-based search)
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfInstance.getPage(i)
        const textContent = await page.getTextContent()
        const textItems = textContent.items.map(item => item.str).join(' ')
        
        if (textItems.toLowerCase().includes(query.toLowerCase())) {
          // Find the excerpt (surrounding context)
          const index = textItems.toLowerCase().indexOf(query.toLowerCase())
          const start = Math.max(0, index - 50)
          const end = Math.min(textItems.length, index + query.length + 50)
          const excerpt = (start > 0 ? '...' : '') + textItems.substring(start, end) + (end < textItems.length ? '...' : '')
          
          results.push({
            page: i,
            excerpt,
            score: 1
          })
          if (results.length > 20) break // Limit results for performance
        }
      }
      return results
    }
  }))
  const [numPages, setNumPages] = useState(null)
  const [pageLoading, setPageLoading] = useState(false)
  const { annotations, removeAnnotation } = useStore()
  const { id: bookId } = useParams()

  useEffect(() => {
    setPageLoading(true)
    const timer = setTimeout(() => setPageLoading(false), 300)
    return () => clearTimeout(timer)
  }, [currentPage])
  
  // Active deletion popover state
  const [activeHighlight, setActiveHighlight] = useState(null)

  const bookAnnotations = annotations?.[bookId] || []
  const pageAnnotations = bookAnnotations.filter(
    ann => ann.location == currentPage && ann.rects && ann.rects.length > 0
  )

  function onDocumentLoadSuccess(pdf) {
    const { numPages } = pdf
    setPdfInstance(pdf)
    setNumPages(numPages)
    onDocumentLoad(numPages)
    
    // Extract Outline/TOC
    pdf.getOutline().then(async outline => {
      if (onTOCLoad && outline) {
        const processOutline = async (items) => {
          const processed = [];
          for (const item of items) {
            let pageNum = 1;
            try {
              let dest = item.dest;
              if (typeof dest === 'string') {
                dest = await pdf.getDestination(dest);
              }
              if (Array.isArray(dest) && dest[0]) {
                const pageIndex = await pdf.getPageIndex(dest[0]);
                pageNum = pageIndex + 1;
              }
            } catch (err) {
              console.warn('Failed to resolve page number for outline item:', item.title, err);
            }
            
            processed.push({
              label: item.title,
              location: pageNum
            });
          }
          return processed;
        };

        const resolvedOutline = await processOutline(outline);
        onTOCLoad(resolvedOutline);
      }
    }).catch(err => console.log('Outline extraction failed:', err))
  }

  function onDocumentLoadError(error) {
    console.error('PDF Load Error:', error)
    alert(`PDF Load Error: ${error.message || 'The file might be corrupted or inaccessible'}. If this persists, try re-uploading the book.`)
  }

  function onSourceError(error) {
    console.error('PDF Source Error:', error)
  }

  const renderHighlightStyle = (rect, style, color) => {
    if (style === 'underline') {
      return { borderBottom: `2px solid ${color}`, marginBottom: '-2px' }
    } else if (style === 'strike') {
      return {} // Handled via injected div
    } else if (style === 'wavy') {
      const svg = `<svg width="10" height="6" viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 3 Q2.5 0 5 3 T10 3" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`
      return {
        backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'bottom',
        marginBottom: '-3px'
      }
    }
    return { backgroundColor: color, mixBlendMode: 'multiply' } // native multiply blend for true highlight effect
  }

  const isMobile = containerWidth < 768;

  return (
    <div 
      className={clsx(
        "flex flex-col items-center w-full h-full overflow-auto relative group transition-colors duration-300",
        isMobile ? "py-0 px-0" : "py-10"
      )}
      onClick={() => setActiveHighlight(null)}
    >
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        onSourceError={onSourceError}
        loading={
          <div className="flex flex-col items-center justify-center w-full h-[600px] bg-black/5 animate-pulse overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin" />
            </div>
            {/* Skeleton lines for reading visualization */}
            <div className="w-full h-full p-12 opacity-30 flex flex-col gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-3 bg-black/10 rounded ${i % 3 === 0 ? 'w-11/12' : i % 2 === 0 ? 'w-full' : 'w-5/6'}`} />
              ))}
            </div>
          </div>
        }
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: pageLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className={clsx(
            "relative bg-white shadow-premium transition-all duration-300",
            isMobile ? "" : "rounded-sm"
          )} 
          style={{ 
            touchAction: 'pan-y pinch-zoom',
            width: isMobile ? '100vw' : 'fit-content'
          }}
        >
          <Page 
            pageNumber={currentPage} 
            width={isMobile ? containerWidth * scale : Math.min(containerWidth * 0.8, 800) * scale}
            loading={null}
            renderAnnotationLayer={false}
            renderTextLayer={true}
            onRenderError={(err) => console.error('Page Render Error:', err)}
          />
          
          {/* Permanent Annotation Overlay coordinate engine */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {pageAnnotations.map((ann) => (
              <div key={ann.id}>
                {ann.rects.map((rect, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveHighlight(ann.id)
                    }}
                    className="absolute pointer-events-auto cursor-pointer transition-opacity hover:opacity-80 rounded-sm"
                    style={{
                      top: `${rect.top}%`,
                      left: `${rect.left}%`,
                      width: `${rect.width}%`,
                      height: `${rect.height}%`,
                      ...renderHighlightStyle(rect, ann.style, ann.color)
                    }}
                  >
                    {/* Inject an invisible line for strike/wavy styles perfectly centered */}
                    {ann.style === 'strike' && <div className="absolute top-1/2 left-0 right-0 h-0.5 -mt-px pointer-events-none" style={{ backgroundColor: ann.color }} />}
                  </div>
                ))}
                
                {/* Deletion Popover mapped to the first chunk of the highlight array */}
                {activeHighlight === ann.id && ann.rects[0] && (
                  <div 
                    className="absolute z-50 transform -translate-x-1/2 -translate-y-[120%] pointer-events-auto"
                    style={{ left: `${ann.rects[0].left + ann.rects[0].width/2}%`, top: `${ann.rects[0].top}%` }}
                  >
                    <div className="bg-bookvault-surface-lowest shadow-premium rounded-lg px-2 py-1 flex items-center gap-2 border border-black/5 animate-fade-in pointer-events-auto">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          removeAnnotation(bookId, ann.id)
                          setActiveHighlight(null)
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                        title="Delete highlight"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </Document>
    </div>
  )
})

export default PDFReader
