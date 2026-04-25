import React, { useEffect } from 'react'
import { useStore } from '../store/useStore'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Users, Sparkles, LayoutGrid, ArrowRight, Zap } from 'lucide-react'
import AuthorCard from '../components/community/AuthorCard'
import PublicStoryCard from '../components/community/PublicStoryCard'
import BottomNav from '../components/layout/BottomNav'

const Discover = () => {
  const { discoverData, fetchDiscoveryData, discoverLoading } = useStore()

  useEffect(() => {
    fetchDiscoveryData()
  }, [])

  return (
    <div className="min-h-screen bg-bookvault-surface pb-20 lg:pb-0">
      <Navbar onUploadClick={() => {}} />
      <Sidebar activeCategory="discover" onCategoryChange={() => {}} />

      <main className="lg:ml-64 pt-20 transition-all duration-300">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-bookvault-primary mb-2 flex items-center gap-3">
              <Compass className="text-bookvault-secondary" size={28} /> 
              Discover
            </h1>
            <p className="text-on-surface-variant text-sm font-medium">Explore the best of the BookVault community.</p>
          </header>

          {discoverLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
               <div className="w-12 h-12 border-4 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin" />
               <p className="text-sm font-bold text-bookvault-primary animate-pulse">Scanning the multiverse...</p>
            </div>
          ) : (
            <div className="space-y-20">
               {/* Featured Hero Piece */}
               <section className="relative h-[500px] md:h-[400px] rounded-[32px] md:rounded-[48px] overflow-hidden group shadow-premium">
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-bookvault-primary via-bookvault-primary/90 to-transparent z-10" />
                  <img 
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                    alt="Hero"
                  />
                  <div className="absolute inset-0 z-20 p-8 md:p-12 flex flex-col justify-end md:justify-center max-w-xl">
                     <span className="flex items-center gap-2 text-white/60 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4">
                        <Zap size={14} className="text-amber-400" /> Story of the Day
                     </span>
                     <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">Beyond the Sapphire Range</h2>
                     <p className="text-white/80 mb-8 leading-relaxed line-clamp-3 md:line-clamp-2 text-sm md:text-base">A breathtaking epic about the last mountain keepers struggling to maintain the balance of a magic-infused world as empires rise from the valleys.</p>
                     <div className="flex gap-4">
                        <button className="px-6 md:px-8 py-3 bg-white text-bookvault-primary rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                           Start Reading <ArrowRight size={18} />
                        </button>
                     </div>
                  </div>
               </section>

               {/* Trending Authors */}
               <section>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-serif font-bold text-bookvault-primary flex items-center gap-2">
                       <Users size={24} className="text-bookvault-secondary" /> Trending Authors
                    </h2>
                    <button className="text-sm font-bold text-bookvault-primary/60 hover:text-bookvault-primary transition-colors">See all</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                     <AnimatePresence>
                        {(discoverData?.trendingAuthors || []).map((author, index) => (
                           <motion.div
                              key={author.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                           >
                              <AuthorCard author={author} />
                           </motion.div>
                        ))}
                     </AnimatePresence>
                     {(!discoverData?.trendingAuthors || discoverData.trendingAuthors.length === 0) && (
                        <div className="col-span-full py-20 text-center bg-bookvault-surface-lowest rounded-[32px] border border-dashed border-outline-variant/30">
                           <p className="text-on-surface-variant italic opacity-60">Success is quiet right now. Be the first to build a legacy.</p>
                        </div>
                     )}
                  </div>
               </section>

               {/* New Stories Grid */}
               <section>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-serif font-bold text-bookvault-primary flex items-center gap-2">
                       <Sparkles size={24} className="text-amber-400" /> New Releases
                    </h2>
                    <button className="text-sm font-bold text-bookvault-primary/60 hover:text-bookvault-primary transition-colors">See all manuscripts</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                     {(discoverData?.newStories || []).map((story, index) => (
                        <motion.div
                           key={story.id}
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: index * 0.05 }}
                        >
                           <PublicStoryCard story={story} />
                        </motion.div>
                     ))}
                     {(!discoverData?.newStories || discoverData.newStories.length === 0) && (
                        <div className="col-span-full py-20 text-center bg-bookvault-surface-lowest rounded-[32px] border border-dashed border-outline-variant/30">
                           <p className="text-on-surface-variant italic opacity-60">The library is expanding. Check back in a few moments for new arrivals.</p>
                        </div>
                     )}
                  </div>
               </section>

               {/* Browse by Genre */}
               <section className="bg-bookvault-primary/5 rounded-[48px] p-12">
                  <h2 className="text-2xl font-serif font-bold text-bookvault-primary mb-8 flex items-center gap-2">
                     <LayoutGrid size={24} className="text-bookvault-primary" /> Popular Genres
                  </h2>
                  <div className="flex flex-wrap gap-4">
                     {['Fantasy', 'Romance', 'Thriller', 'Sci-Fi', 'Non-Fiction', 'Poetry', 'Drama', 'Horror', 'Mystery'].map((genre) => (
                        <button key={genre} className="px-8 py-4 bg-white dark:bg-zinc-800 rounded-2xl font-serif font-bold text-bookvault-primary hover:bg-bookvault-primary hover:text-white transition-all shadow-sm border border-bookvault-primary/10">
                           {genre}
                        </button>
                     ))}
                  </div>
               </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

export default Discover
