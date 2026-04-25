import React from 'react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import Footer from './Footer'

const TrustLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-bookvault-surface flex flex-col">
      <Navbar onUploadClick={() => {}} />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-8">
          <header className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1 className="text-5xl font-serif font-bold text-bookvault-primary tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-on-surface-variant font-medium text-lg italic opacity-80">
                  {subtitle}
                </p>
              )}
              <div className="w-24 h-1 bg-bookvault-primary/10 mx-auto rounded-full mt-8" />
            </motion.div>
          </header>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-zinc lg:prose-xl dark:prose-invert max-w-none 
                       prose-headings:font-serif prose-headings:text-bookvault-primary
                       prose-p:text-on-surface-variant prose-p:leading-relaxed
                       prose-li:text-on-surface-variant prose-li:leading-relaxed
                       prose-strong:text-bookvault-primary prose-strong:font-bold"
          >
            {children}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TrustLayout
