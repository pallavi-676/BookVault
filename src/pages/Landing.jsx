import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Book, 
  Feather, 
  Shield, 
  Sparkles, 
  Smartphone, 
  Globe, 
  ArrowRight, 
  Star,
  Layers,
  Zap,
  Users,
  MessageSquare,
  Lock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import Footer from '../components/layout/Footer'
import { useStore } from '../store/useStore'

const Landing = () => {
  const navigate = useNavigate()
  const { user } = useStore()

  // If already logged in, the app state will handle redirection if we're on "/"
  // But for the Landing page UI, we'll show "Go to Dashboard" instead of "Sign Up"

  const features = {
    readers: [
      {
        icon: Smartphone,
        title: "Omni-Device Sync",
        desc: "Pick up your manuscript on any device. Your highlights, annotations, and progress stay in perfect sync.",
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
      },
      {
        icon: Lock,
        title: "The Sanctity of Focus",
        desc: "Experience an immersive, distraction-free reader engine designed to preserve the deep reading experience.",
        color: "text-amber-500",
        bg: "bg-amber-500/10"
      },
      {
        icon: Sparkles,
        title: "Magic Annotations",
        desc: "Highlight with intent. Our professional annotation system supports diverse styles and personalized exports.",
        color: "text-rose-500",
        bg: "bg-rose-500/10"
      }
    ],
    authors: [
      {
        icon: Zap,
        title: "Intel Center",
        desc: "Real-time engagement analytics. See exactly how many readers feel the resonance of your words.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
      },
      {
        icon: Users,
        title: "Direct Community",
        desc: "Build a loyal following. Communicate directly with your readers through verified threaded messaging.",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
      },
      {
        icon: Layers,
        title: "Professional Toolbox",
        desc: "A manuscript editor that rivals pro writing apps. Distraction-free, auto-saving, and ready for publication.",
        color: "text-violet-500",
        bg: "bg-violet-500/10"
      }
    ]
  }

  return (
    <div className="min-h-screen bg-bookvault-surface font-sans selection:bg-bookvault-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 glass z-[100] px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bookvault-primary rounded-xl flex items-center justify-center text-white shadow-premium">
            <Book size={22} />
          </div>
          <span className="text-2xl font-serif font-bold tracking-tight text-bookvault-primary">BookVault</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/discover')}
            className="hidden md:block text-sm font-bold text-on-surface-variant hover:text-bookvault-primary transition-colors"
          >
            Discover
          </button>
          {!user ? (
            <>
              <button 
                onClick={() => navigate('/auth')}
                className="text-sm font-bold text-bookvault-primary hover:underline hover:underline-offset-8 transition-all"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-6 py-2.5 bg-bookvault-primary text-white rounded-full text-sm font-bold shadow-premium hover:bg-bookvault-primary-container transition-all hover:scale-105 active:scale-95"
              >
                Get Started
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-bookvault-primary text-white rounded-full text-sm font-bold shadow-premium hover:bg-bookvault-primary-container transition-all hover:scale-105 active:scale-95"
            >
              Enter Vault
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
        {/* Background Artwork */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            className="w-full h-full object-cover opacity-10 dark:opacity-20"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bookvault-surface/80 to-bookvault-surface" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-bookvault-primary/5 text-bookvault-primary rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 md:mb-8 border border-bookvault-primary/10">
              <Sparkles size={14} className="animate-pulse" /> Preserving the Sanctity of Literature
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-8xl font-serif font-bold text-bookvault-primary leading-[1.1] mb-6 md:mb-8 tracking-tight">
              The Immersive Home <br className="hidden md:block" />
              for Your Library.
            </h1>
            <p className="max-w-2xl mx-auto text-on-surface-variant text-base md:text-xl leading-relaxed mb-10 md:mb-12 px-4">
              BookVault is more than a reader. It’s a professional ecosystem where authors build legacies and readers find a sanctuary for the written word.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-bookvault-primary text-white rounded-2xl font-bold text-base md:text-lg shadow-premium hover:bg-bookvault-primary-container transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                Join the Community <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => navigate('/discover')}
                className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-bookvault-surface-lowest text-bookvault-primary border-2 border-bookvault-primary/10 rounded-2xl font-bold text-base md:text-lg hover:bg-bookvault-surface-low transition-all"
              >
                Explore Discover
              </button>
            </div>
          </motion.div>

          {/* Floating UI Elements or Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-12 md:mt-32 relative group px-2"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-bookvault-primary/20 to-bookvault-secondary/20 rounded-[56px] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-bookvault-surface-low rounded-[32px] md:rounded-[48px] border border-outline-variant/10 shadow-2xl overflow-hidden aspect-[4/3] md:aspect-[16/9] max-w-5xl mx-auto">
                <div className="w-full h-full bg-bookvault-surface-low flex flex-col items-center justify-center p-8 md:p-20 text-center">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-bookvault-primary/5 rounded-full flex items-center justify-center mb-4 md:mb-6">
                        <Star size={32} md:size={40} className="text-bookvault-primary opacity-20" />
                    </div>
                   <h3 className="text-xl md:text-2xl font-serif font-bold text-bookvault-primary opacity-40">Visualizing Excellence</h3>
                   <p className="max-w-md text-on-surface-variant opacity-40 mt-2 text-xs md:text-sm italic px-4">The metadata-rich Dashboard that organizes your literary world perfectly.</p>
                </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Benefits Section */}
      <section className="py-20 md:py-40 bg-bookvault-surface-low/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-bookvault-primary mb-4 md:mb-6 leading-tight">Built for Both Sides <br /> of the Page.</h2>
            <p className="text-on-surface-variant text-sm md:text-base max-w-xl mx-auto px-4">Whether you’re consuming magic or creating it, BookVault provides the premium infrastructure you deserve.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
            {/* Readers Column */}
            <div className="space-y-8 md:space-y-12">
              <div className="flex items-center gap-4 mb-4 md:mb-8 justify-center lg:justify-start">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-bookvault-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-premium">
                  <Book size={20} md:size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-bookvault-primary uppercase tracking-widest text-[9px] md:text-[10px]">For Modern Readers</h3>
              </div>
              <div className="grid gap-4 md:gap-6">
                {features.readers.map((f, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 5 }}
                    className="bg-bookvault-surface-lowest p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-outline-variant/10 shadow-sm flex flex-col sm:flex-row gap-4 md:gap-6"
                  >
                    <div className={`w-12 h-12 md:w-14 md:h-14 ${f.bg} ${f.color} rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0`}>
                      <f.icon size={22} md:size={28} />
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-base md:text-lg font-serif font-bold text-bookvault-primary mb-1 md:mb-2">{f.title}</h4>
                      <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Authors Column */}
            <div className="space-y-8 md:space-y-12">
              <div className="flex items-center gap-4 mb-4 md:mb-8 justify-center lg:justify-end">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-bookvault-secondary rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-premium">
                  <Feather size={20} md:size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-bookvault-primary uppercase tracking-widest text-[9px] md:text-[10px]">For Professional Authors</h3>
              </div>
              <div className="grid gap-4 md:gap-6">
                {features.authors.map((f, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: -5 }}
                    className="bg-bookvault-surface-lowest p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-outline-variant/10 shadow-sm flex flex-col sm:flex-row-reverse gap-4 md:gap-6 text-center sm:text-right"
                  >
                    <div className={`w-12 h-12 md:w-14 md:h-14 ${f.bg} ${f.color} rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0`}>
                      <f.icon size={22} md:size={28} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base md:text-lg font-serif font-bold text-bookvault-primary mb-1 md:mb-2">{f.title}</h4>
                      <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Community */}
      <section className="py-24 md:py-40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-bookvault-primary/5 rounded-[32px] flex items-center justify-center mx-auto mb-12">
            <Shield size={40} className="text-bookvault-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-bookvault-primary mb-8">Owned by You. <br /> Secured by the Vault.</h2>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-12">
            We believe your library is sacred. BookVault uses local-first architecture and top-tier cloud encryption to ensure your manuscripts and annotations are never lost, and always private.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40">
             <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                <Globe size={18} /> Global Presence
             </div>
             <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                <Sparkles size={18} /> Community Verified
             </div>
             <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                <MessageSquare size={18} /> 24/7 Support
             </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-bookvault-primary rounded-[48px] md:rounded-[64px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
           <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 relative z-10">Start Your Legacy Today.</h2>
           <p className="text-white/80 max-w-xl mx-auto mb-12 text-lg relative z-10">Join thousands of authors and readers preserving the art of storytelling.</p>
           <button 
             onClick={() => navigate('/auth')}
             className="relative z-10 px-12 py-5 bg-white text-bookvault-primary rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
           >
             Get Started for Free
           </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Landing
