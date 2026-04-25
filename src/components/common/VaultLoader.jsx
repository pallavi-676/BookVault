import React from 'react'
import { motion } from 'framer-motion'
import { Book } from 'lucide-react'

const VaultLoader = ({ message = "Navigating the Vault..." }) => (
  <div className="fixed inset-0 bg-bookvault-surface z-[1000] flex flex-col items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="relative">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 border-4 border-bookvault-primary/10 border-t-bookvault-primary rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center text-bookvault-primary">
          <Book size={32} />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-serif font-bold text-bookvault-primary animate-pulse">
          {message}
        </h3>
        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-on-surface-variant opacity-40">
          Syncing with Archive...
        </p>
      </div>
    </motion.div>
    
    {/* Subtle geometric background accents */}
    <div className="absolute top-0 right-0 w-96 h-96 bg-bookvault-primary/5 rounded-full -mr-48 -mt-48 blur-3xl" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-bookvault-secondary/5 rounded-full -ml-48 -mb-48 blur-3xl" />
  </div>
)

export default VaultLoader
