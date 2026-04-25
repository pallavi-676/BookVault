import React from 'react'

const TXTReader = ({ content, theme, fontSize, fontFamily }) => {
  return (
    <div className="flex flex-col items-center w-full h-full overflow-auto py-20 px-4">
      <div 
        className="max-w-3xl w-full text-left whitespace-pre-wrap transition-all duration-500"
        style={{ 
          fontSize: `${fontSize}px`, 
          fontFamily: fontFamily === 'serif' ? 'Noto Serif' : 'Manrope',
          lineHeight: '1.8'
        }}
      >
        {content || 'No content available for this text file.'}
      </div>
    </div>
  )
}

export default TXTReader
