import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { ReactReader } from 'react-reader'

const EPUBReader = forwardRef(({ url, title, location, onLocationChange, onTOCLoad, theme, fontSize }, ref) => {
  const [rendition, setRendition] = useState(null)

  useImperativeHandle(ref, () => ({
    search: async (query) => {
      if (!rendition || !query) return []
      
      // epub.js find method returns an array of results with CFIs
      const results = await rendition.book.find(query)
      return results.map(res => ({
        cfi: res.cfi,
        excerpt: res.excerpt,
        score: 1
      }))
    }
  }))
  // Custom styles for the epub rendition
  const getStyles = () => {
    const bg = theme === 'dark' ? '#1a1a1a' : theme === 'sepia' ? '#EAD7D1' : '#ffffff';
    const fg = theme === 'dark' ? '#d1d1d1' : theme === 'sepia' ? '#5D3A3A' : '#1a1c1c';
    
    return {
      body: {
        background: `${bg} !important`,
        color: `${fg} !important`,
        'font-family': 'serif !important',
        'font-size': `${fontSize}px !important`,
        'line-height': '1.6 !important',
      },
      p: {
        color: `${fg} !important`,
      },
      li: {
        color: `${fg} !important`,
      },
      h1: { color: `${fg} !important` },
      h2: { color: `${fg} !important` },
      h3: { color: `${fg} !important` },
    };
  };

  return (
    <div className="w-full h-full">
      <ReactReader
        url={url}
        title={title}
        location={location}
        locationChanged={onLocationChange}
        tocChanged={(toc) => {
          if (onTOCLoad) {
            onTOCLoad(toc.map(item => ({
              label: item.label,
              href: item.href
            })))
          }
        }}
        swipeable={true}
        epubOptions={{
          flow: 'paginated',
          manager: 'default',
        }}
        styles={{
          reader: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : theme === 'sepia' ? '#EAD7D1' : '#ffffff',
          },
          container: {
            overflow: 'hidden',
          }
        }}
        getRendition={(rend) => {
          setRendition(rend);
          rend.themes.register('custom', getStyles());
          rend.themes.select('custom');
          rend.hooks.content.register((contents) => {
            const doc = contents.document;
            const head = doc.querySelector('head');
            const style = doc.createElement('style');
            style.innerHTML = `
              * { transition: background-color 0.5s ease, color 0.5s ease !important; }
              img { border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 100%; height: auto; margin: 2rem auto; display: block; }
            `;
            head.appendChild(style);
          });
        }}
      />
    </div>
  )
})

export default EPUBReader
