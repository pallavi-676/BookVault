import React, { useState } from 'react'
import { X, Check, Droplets, Grid } from 'lucide-react'
import { useStore } from '../../store/useStore'

const AdvancedColorPicker = ({ onClose, onSelect }) => {
  const [color, setColor] = useState({ r: 244, g: 114, b: 182, a: 0.4 })
  const { customColors, saveCustomColor } = useStore()
  
  const rgba = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`

  const handleApply = () => {
    onSelect(rgba)
    // Avoid saving if saveCustomColor is not fully implemented in state
    if (saveCustomColor) saveCustomColor(rgba)
    onClose()
  }

  // Very important! Prevent losing text selection when interacting with the modal
  const handleMouseDown = (e) => {
    e.preventDefault()
  }

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto"
      onMouseDown={handleMouseDown}
    >
      <div className="bg-bookvault-surface-lowest rounded-3xl shadow-premium w-full max-w-sm overflow-hidden border border-outline-variant/20 pointer-events-auto">
        <header className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <Droplets className="text-bookvault-primary" size={20} />
            <h3 className="font-serif font-bold text-bookvault-primary">Atelier Palette</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bookvault-surface-low rounded-full transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Preview */}
          <div 
            className="h-24 rounded-2xl shadow-inner border border-outline-variant/20 flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: rgba }}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '10px 10px' }} />
            <span className="relative font-mono font-bold text-sm bg-white/60 px-3 py-1 rounded-full backdrop-blur-md">
              {rgba}
            </span>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {['r', 'g', 'b'].map(channel => (
              <div key={channel} className="flex items-center gap-4">
                <span className="w-4 font-bold uppercase text-[10px] opacity-40">{channel}</span>
                <input 
                  type="range" min="0" max="255"
                  value={color[channel]}
                  onChange={(e) => setColor({...color, [channel]: parseInt(e.target.value)})}
                  className="flex-1 accent-bookvault-primary h-1.5 bg-bookvault-surface-low rounded-full appearance-none cursor-pointer"
                />
                <span className="w-8 text-right font-mono text-[10px]">{color[channel]}</span>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/10">
              <span className="w-4 font-bold uppercase text-[10px] opacity-40">A</span>
              <input 
                type="range" min="0" max="100"
                value={Math.round(color.a * 100)}
                onChange={(e) => setColor({...color, a: parseInt(e.target.value) / 100})}
                className="flex-1 accent-bookvault-primary h-1.5 bg-bookvault-surface-low rounded-full appearance-none cursor-pointer text-bookvault-primary"
              />
              <span className="w-8 text-right font-mono text-[10px]">{Math.round(color.a * 100)}%</span>
            </div>
          </div>

          <div className="flex justify-between items-center h-28 pt-4">
            {/* Preview Box with lines indicating transparency */}
            <div className="relative w-12 h-24 border border-outline-variant/20 rounded-sm overflow-hidden bg-white shadow-inner">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '10px 10px' }} />
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: rgba }}
              />
            </div>

            {/* Interactive HSV Color Wheel */}
            <div 
              onMouseDown={(e) => {
                e.preventDefault();
                const rect = e.target.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const radius = Math.sqrt(x*x + y*y);
                const maxRadius = rect.width / 2;
                if (radius <= maxRadius) {
                  let angle = Math.atan2(y, x) * (180 / Math.PI);
                  if (angle < 0) angle += 360;
                  const s = radius / maxRadius;
                  const c = s;
                  const x_val = c * (1 - Math.abs(((angle / 60) % 2) - 1));
                  const m = 1 - c;
                  let r_, g_, b_;
                  if (angle < 60) { r_ = c; g_ = x_val; b_ = 0; }
                  else if (angle < 120) { r_ = x_val; g_ = c; b_ = 0; }
                  else if (angle < 180) { r_ = 0; g_ = c; b_ = x_val; }
                  else if (angle < 240) { r_ = 0; g_ = x_val; b_ = c; }
                  else if (angle < 300) { r_ = x_val; g_ = 0; b_ = c; }
                  else { r_ = c; g_ = 0; b_ = x_val; }
                  
                  setColor({ 
                    ...color, 
                    r: Math.round((r_ + m) * 255), 
                    g: Math.round((g_ + m) * 255), 
                    b: Math.round((b_ + m) * 255) 
                  });
                }
              }}
              className="w-24 h-24 rounded-full cursor-crosshair shadow-premium border border-outline-variant/20"
              style={{
                background: 'conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
              }}
            />
          </div>

          {/* Quick Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
              <Grid size={12} />
              <span>Vault History</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {(customColors || []).slice(0, 10).map((c, i) => (
                <button 
                  key={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (c.startsWith('rgba')) {
                      const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
                      if (match) {
                        setColor({ r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: Number(match[4] || 1) })
                      }
                    } else if (c.startsWith('#')) {
                       // primitive Hex parse
                       const h = c.slice(1)
                       if (h.length >= 6) {
                         setColor({
                           r: parseInt(h.slice(0,2), 16),
                           g: parseInt(h.slice(2,4), 16),
                           b: parseInt(h.slice(4,6), 16),
                           a: h.length === 8 ? parseInt(h.slice(6,8), 16)/255 : 0.4
                         })
                       }
                    }
                  }}
                  className="h-8 rounded-lg shadow-sm border border-outline-variant/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <footer className="p-6 pt-0">
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleApply}
            className="w-full py-4 bg-bookvault-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-bookvault-primary-container transition-all shadow-premium"
          >
            <Check size={20} />
            <span>Apply to Selection</span>
          </button>
        </footer>
      </div>
    </div>
  )
}

export default AdvancedColorPicker
