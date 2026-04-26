import React, { useState } from 'react'
import TrustLayout from '../../components/layout/TrustLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle, Mail, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'

const Contact = () => {
  const { user } = useStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: submitError } = await supabase
        .from('support_tickets')
        .insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          user_id: user?.id || null
        }])

      if (submitError) throw submitError
      
      setSuccess(true)
    } catch (err) {
      console.error('Support submission failed:', err)
      setError('Failed to send request. Please try again or email bookvaultteam@gmail.com directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TrustLayout title="Contact Support" subtitle="We're here to help you preserve your legacy.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Info Column */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-bookvault-primary">Get in Touch</h3>
            <p className="text-on-surface-variant">
              Whether you've encountered a bug, need help with your account, or want to suggest a feature, our team is ready to assist.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-bookvault-primary/10 flex items-center justify-center text-bookvault-primary">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-outline-variant mb-1">Email Us</p>
                <a href="mailto:bookvaultteam@gmail.com" className="font-bold text-bookvault-primary hover:underline">bookvaultteam@gmail.com</a>
                <p className="text-xs text-on-surface-variant mt-1 italic">We typically reply within 24–48 hours.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-bookvault-primary/10 flex items-center justify-center text-bookvault-primary">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-outline-variant mb-1">Vault HQ</p>
                <p className="font-bold text-bookvault-primary">Distraction-Free Cloud</p>
              </div>
            </div>

            {/* Copyright & Takedowns */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Copyright & Content Removal</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  To report unauthorized use of copyrighted work or to request content removal, please email us directly with the subject <strong>"DMCA/Takedown Request"</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-premium border border-outline-variant/10">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-bookvault-primary">Message Sent</h3>
                  <p className="text-on-surface-variant mt-2 text-sm">
                    Thank you! We've received your request and will get back to you shortly.
                  </p>
                </div>
                <button 
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2 bg-bookvault-primary text-white rounded-full text-sm font-bold shadow-md"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline-variant ml-4">Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Your name"
                    className="w-full px-6 py-4 rounded-2xl bg-bookvault-surface-low border border-outline-variant/10 focus:border-bookvault-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline-variant ml-4">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="w-full px-6 py-4 rounded-2xl bg-bookvault-surface-low border border-outline-variant/10 focus:border-bookvault-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline-variant ml-4">Subject</label>
                  <select 
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-bookvault-surface-low border border-outline-variant/10 focus:border-bookvault-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a topic</option>
                    <option value="General Support">General Support</option>
                    <option value="Bug Report">🐛 Report a Bug / Glitch</option>
                    <option value="Feature Request">✨ Feature Request</option>
                    <option value="Account Issue">Account & Login Issue</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline-variant ml-4">Message</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="How can we help you?"
                    className="w-full px-6 py-4 rounded-2xl bg-bookvault-surface-low border border-outline-variant/10 focus:border-bookvault-primary outline-none transition-all resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-500 font-bold ml-4">{error}</p>}

                <button 
                  disabled={loading}
                  className="w-full py-4 bg-bookvault-primary text-white rounded-2xl font-bold shadow-premium hover:bg-bookvault-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send Request <Send size={18} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TrustLayout>
  )
}

export default Contact
