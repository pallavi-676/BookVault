import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, AtSign, Camera, PenLine, BookOpen, BookMarked,
  Tag, X, CheckCircle, ArrowLeft, Star, Users, Feather, Shield, Trash2,
  Send, AlertCircle
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import BottomNav from '../components/layout/BottomNav'

class ProfileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-8 bg-bookvault-primary/5">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-lg shadow-premium border border-outline-variant/10 text-center">
             <div className="w-16 h-16 bg-bookvault-primary/10 text-bookvault-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
             </div>
             <h2 className="text-2xl font-serif font-bold text-bookvault-primary mb-2">Profile Error</h2>
             <p className="text-sm text-on-surface-variant/80 mb-6 leading-relaxed">
                We encountered an error while loading your profile settings. This might be due to a synchronization issue.
             </p>
             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-bookvault-primary text-white rounded-xl font-bold shadow-sm">
                Refresh Page
             </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Profile = () => {
  const navigate = useNavigate()
  const { user, userProfile, updateUserProfile, becomeAuthor, books, readingProgress, deleteAccount, verifyCredentials } = useStore()
  const fileInputRef = useRef(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletePhrase, setDeletePhrase] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Form state
  const [fullName, setFullName] = useState(userProfile?.fullName || user?.user_metadata?.full_name || '')
  const [username, setUsername] = useState(userProfile?.username || '')
  const [usernameStatus, setUsernameStatus] = useState('idle') // idle, checking, available, taken, invalid
  const [bio, setBio] = useState(userProfile?.bio || '')
  const [genres, setGenres] = useState(userProfile?.genres || [])
  const [instagram, setInstagram] = useState(userProfile?.socialLinks?.instagram || '')
  const [twitter, setTwitter] = useState(userProfile?.socialLinks?.twitter || '')
  const [website, setWebsite] = useState(userProfile?.socialLinks?.website || '')
  const [genreInput, setGenreInput] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarDeleting, setAvatarDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [becomingAuthor, setBecomingAuthor] = useState(false)

  const { checkUsernameAvailability } = useStore()
  const role = userProfile?.role || 'reader'

  // Validation Regex: 3-20 chars, lowercase, numbers, underscore
  const validateUsername = (val) => /^[a-z0-9_]{3,20}$/.test(val)

  // Real-time Availability Check (Debounced)
  useEffect(() => {
    if (username === userProfile?.username) {
      setUsernameStatus('idle')
      return
    }

    if (!username) {
      setUsernameStatus('idle')
      return
    }

    if (!validateUsername(username)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailability(username)
      setUsernameStatus(isAvailable ? 'available' : 'taken')
    }, 500)

    return () => clearTimeout(timer)
  }, [username, userProfile?.username, checkUsernameAvailability])

  // Computed stats with extra safety
  const booksCompleted = React.useMemo(() => {
    if (!readingProgress || typeof readingProgress !== 'object') return 0
    return Object.values(readingProgress).filter(p => p && p.percentage >= 100).length
  }, [readingProgress])

  const wishlistCount = React.useMemo(() => {
    if (!books || !Array.isArray(books)) return 0
    return books.filter(b => b && b.bookmarked).length
  }, [books])

  useEffect(() => {
    setFullName(userProfile?.fullName || user?.user_metadata?.full_name || '')
    setUsername(userProfile?.username || '')
    setBio(userProfile?.bio || '')
    setGenres(userProfile?.genres || [])
    setInstagram(userProfile?.socialLinks?.instagram || '')
    setTwitter(userProfile?.socialLinks?.twitter || '')
    setWebsite(userProfile?.socialLinks?.website || '')
    setAvatarUrl(userProfile?.avatarUrl || null)
  }, [userProfile, user])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      
      // 1. Upload to storage (upsert handles replacement)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { 
          upsert: true,
          contentType: file.type
        })
      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}` 
      
      // 3. IMMEDIATELY PERSIST TO PROFILE (Permanent fix)
      await updateUserProfile({ avatarUrl: url })
      
      setAvatarUrl(url)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      alert('Upload failed: Security policies only allow you to manage files in your own folder.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return

    setAvatarDeleting(true)
    try {
      const { data: files } = await supabase.storage.from('avatars').list(user.id)
      
      if (files && files.length > 0) {
        const pathsToDelete = files.map(f => `${user.id}/${f.name}`)
        await supabase.storage.from('avatars').remove(pathsToDelete)
      }

      // Update Profile DB
      await updateUserProfile({ avatarUrl: null })
      setAvatarUrl(null)
    } catch (err) {
      console.error('Failed to remove avatar:', err)
      alert('Failed to remove profile picture.')
    } finally {
      setAvatarDeleting(false)
    }
  }

  const handleSave = async () => {
    if (usernameStatus === 'taken') {
      alert('This username is already taken.')
      return
    }
    if (usernameStatus === 'invalid') {
      alert('Username must be 3-20 characters and only contain lowercase letters, numbers, and underscores.')
      return
    }

    setSaving(true)
    try {
      const success = await updateUserProfile({
        fullName,
        username,
        bio,
        genres,
        avatarUrl,
        socialLinks: { instagram, twitter, website }
      })
      
      if (success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        alert('Failed to save profile changes to the cloud. Please check your connection and try again.')
      }
    } catch (err) {
      console.error('Save failed:', err)
      alert('An unexpected error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddGenre = (e) => {
    e.preventDefault()
    const g = genreInput.trim()
    if (g && !genres.includes(g) && genres.length < 8) {
      setGenres([...genres, g])
    }
    setGenreInput('')
  }

  const handleBecomeAuthor = async () => {
    setBecomingAuthor(true)
    await becomeAuthor()
    setBecomingAuthor(false)
  }

  const handleDeleteAccount = async () => {
     setShowDeleteModal(true)
  }

  const confirmDeletion = async () => {
     if (!deleteEmail || !deletePassword) {
        setDeleteError('Please enter your email and password to continue.')
        return
     }

     if (deleteEmail.toLowerCase() !== user?.email?.toLowerCase()) {
        setDeleteError('The email entered does not match your active session.')
        return
     }

     if (deletePhrase?.trim() !== "DELETE MY ACCOUNT") {
        setDeleteError('Please type the exact phrase "DELETE MY ACCOUNT" to confirm.')
        return
     }

     setIsVerifying(true)
     setDeleteError('')

     try {
        const isValid = await verifyCredentials(deleteEmail, deletePassword)
        if (!isValid) {
           setDeleteError('Invalid credentials. Please verify your email and password.')
           setIsVerifying(false)
           return
        }

        const success = await deleteAccount();
        if (success) {
           navigate('/auth');
        } else {
           setDeleteError('Identity verified, but database deletion failed. Contact support.')
           setIsVerifying(false)
        }
     } catch (err) {
        console.error('Delete error:', err);
        setDeleteError('An internal error occurred during the deletion process.')
        setIsVerifying(false)
     }
  }

  return (
    <div className="min-h-screen bg-bookvault-surface pb-32">
      <Navbar onUploadClick={() => {}} />

      <main className="pt-24 pb-16 px-4 md:px-6 max-w-3xl mx-auto transition-all duration-300">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-bookvault-primary transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Library
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-10">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-bookvault-primary">Profile & Settings</h1>
          <div className="flex gap-2">
            {role === 'author' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-bookvault-secondary/20 text-bookvault-secondary rounded-full text-[10px] md:text-xs font-bold">
                <Feather size={12} /> Author
              </span>
            )}
            {role === 'reader' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-bookvault-primary/10 text-bookvault-primary rounded-full text-[10px] md:text-xs font-bold">
                <BookOpen size={12} /> Reader
              </span>
            )}
          </div>
        </div>

        {/* Avatar + basic info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bookvault-surface-lowest rounded-[32px] md:rounded-2xl p-6 md:p-8 shadow-premium mb-6"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Account</h2>

          {/* Avatar */}
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 mb-10 md:mb-8">
            <div className="relative">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-bookvault-surface-low flex items-center justify-center cursor-pointer overflow-hidden border-4 border-bookvault-surface shadow-premium group relative"
              >
                {avatarUploading || avatarDeleting ? (
                  <div className="w-6 h-6 border-2 border-bookvault-primary/30 border-t-bookvault-primary rounded-full animate-spin" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <User size={48} className="text-outline-variant" />
                )}
                
                {/* Delete Overlay */}
                {avatarUrl && !avatarUploading && !avatarDeleting && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 size={24} className="text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-8 h-8 md:w-10 md:h-10 bg-bookvault-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-bookvault-primary-container transition-colors z-10"
              >
                <Camera size={14} md:size={18} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="pt-2">
              <p className="font-serif font-bold text-bookvault-primary text-xl md:text-2xl">{fullName || 'Your Name'}</p>
              <p className="text-sm md:text-base text-on-surface-variant font-medium">@{username || 'username'}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-bookvault-surface-low rounded-full mt-2 border border-outline-variant/10">
                 <Mail size={12} className="text-on-surface-variant/40" />
                 <p className="text-[10px] md:text-xs text-on-surface-variant/60 font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Full Name</label>
              <div className="relative group">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Username</label>
                <AnimatePresence mode="wait">
                  {usernameStatus === 'checking' && (
                    <motion.span key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-bookvault-primary/40">Checking...</motion.span>
                  )}
                  {usernameStatus === 'available' && (
                    <motion.span key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-green-500">Username available</motion.span>
                  )}
                  {usernameStatus === 'taken' && (
                    <motion.span key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-red-500">Username already taken</motion.span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <motion.span key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-red-400">Invalid format</motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative group">
                <AtSign size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  usernameStatus === 'available' ? 'text-green-500' :
                  (usernameStatus === 'taken' || usernameStatus === 'invalid') ? 'text-red-400' :
                  'text-outline-variant group-focus-within:text-bookvault-primary'
                }`} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="yourhandle"
                  className={`w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-1 outline-none transition-all ${
                    usernameStatus === 'available' ? 'ring-1 ring-green-500/30' :
                    (usernameStatus === 'taken' || usernameStatus === 'invalid') ? 'ring-1 ring-red-400/30' :
                    'focus:ring-bookvault-primary/20'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-bookvault-surface-low/50 border-none rounded-xl py-3 pl-11 pr-4 text-sm outline-none opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Reader Stats */}
        {role === 'reader' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-bookvault-surface-lowest rounded-2xl p-8 shadow-premium mb-6"
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Reading Stats</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
              <div className="bg-bookvault-surface-low rounded-2xl p-5 text-center">
                <BookMarked size={20} className="text-bookvault-secondary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-serif font-bold text-bookvault-primary">{wishlistCount}</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-bold uppercase tracking-widest">Wishlist</p>
              </div>
              <div className="bg-bookvault-surface-low rounded-2xl p-5 text-center">
                <CheckCircle size={20} className="text-bookvault-primary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-serif font-bold text-bookvault-primary">{booksCompleted}</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-bold uppercase tracking-widest">Completed</p>
              </div>
            </div>

            {/* Become Author CTA */}
            <div className="bg-gradient-to-br from-bookvault-secondary/10 to-bookvault-primary/10 border border-bookvault-secondary/20 rounded-2xl p-6 text-center">
              <Feather size={28} className="text-bookvault-secondary mx-auto mb-3" />
              <h3 className="font-serif font-bold text-bookvault-primary text-lg mb-1">Become an Author</h3>
              <p className="text-sm text-on-surface-variant mb-4">Share your stories, build a readership, and track your writing journey.</p>
              <button
                onClick={handleBecomeAuthor}
                disabled={becomingAuthor}
                className="px-6 py-2.5 bg-bookvault-secondary text-white rounded-full text-sm font-bold hover:bg-bookvault-primary transition-all shadow-premium disabled:opacity-60"
              >
                {becomingAuthor ? 'Upgrading...' : '✨ Become an Author'}
              </button>
            </div>
          </motion.section>
        )}

        {/* Author Profile */}
        {role === 'author' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-bookvault-surface-lowest rounded-2xl p-8 shadow-premium mb-6"
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Author Profile</h2>

            {/* Author Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-bookvault-surface-low rounded-xl p-4 text-center">
                <BookOpen size={20} className="text-bookvault-primary mx-auto mb-1" />
                <p className="text-2xl font-serif font-bold text-bookvault-primary">{userProfile?.storiesCount || 0}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium uppercase tracking-wider">Stories</p>
              </div>
              <div className="bg-bookvault-surface-low rounded-xl p-4 text-center">
                <Users size={20} className="text-bookvault-secondary mx-auto mb-1" />
                <p className="text-2xl font-serif font-bold text-bookvault-primary">{userProfile?.followersCount || 0}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium uppercase tracking-wider">Followers</p>
              </div>
              <div className="bg-bookvault-surface-low rounded-xl p-4 text-center">
                <CheckCircle size={20} className="text-bookvault-primary mx-auto mb-1" />
                <p className="text-2xl font-serif font-bold text-bookvault-primary">{booksCompleted}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium uppercase tracking-wider">Read</p>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Bio</label>
              <div className="relative group">
                <PenLine size={16} className="absolute left-4 top-4 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" />
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell readers about yourself..."
                  className="w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none resize-none"
                />
              </div>
            </div>

            {/* Genres */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Genres <span className="opacity-50 normal-case tracking-normal">(up to 8)</span></label>
              <form onSubmit={handleAddGenre} className="relative group">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" />
                <input
                  type="text"
                  value={genreInput}
                  onChange={e => setGenreInput(e.target.value)}
                  placeholder="Type a genre and press Enter"
                  className="w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none"
                />
              </form>
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {genres.map(g => (
                    <span key={g} className="flex items-center gap-1.5 px-3 py-1.5 bg-bookvault-secondary/15 text-bookvault-secondary rounded-full text-xs font-bold">
                      {g}
                      <button onClick={() => setGenres(genres.filter(x => x !== g))} className="hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="pt-8 mt-8 border-t border-outline-variant/10">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-6 flex items-center gap-2">
                 <AtSign size={14} /> Social Presence
              </h3>
              
              <div className="space-y-4">
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 group-focus-within:opacity-100 transition-opacity">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </div>
                    <input
                       type="text"
                       value={instagram}
                       onChange={e => setInstagram(e.target.value)}
                       placeholder="Instagram URL or username"
                       className="w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none"
                    />
                 </div>

                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 group-focus-within:opacity-100 transition-opacity">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </div>
                    <input
                       type="text"
                       value={twitter}
                       onChange={e => setTwitter(e.target.value)}
                       placeholder="Twitter/X handle or URL"
                       className="w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none"
                    />
                 </div>

                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 group-focus-within:opacity-100 transition-opacity">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    </div>
                    <input
                       type="text"
                       value={website}
                       onChange={e => setWebsite(e.target.value)}
                       placeholder="Personal website or portfolio URL"
                       className="w-full bg-bookvault-surface-low border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 outline-none"
                    />
                 </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-red-50 dark:bg-red-950/10 rounded-2xl p-8 border border-red-100 dark:border-red-900/20 mb-12"
        >
          <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
             <AlertCircle size={20} />
             <h2 className="text-sm font-bold uppercase tracking-widest ">Danger Zone</h2>
          </div>
          <p className="text-sm text-red-600/70 dark:text-red-400/60 mb-6 leading-relaxed">
            Deleting your account is permanent. All your books, annotations, and reading progress will be wiped from our scrolls forever.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-sm relative z-20"
          >
            <Trash2 size={16} /> Delete Account Permanently
          </button>
        </motion.section>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border border-red-500/20 p-10 text-center"
              >
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-bookvault-primary mb-4">Are you absolutely sure?</h3>
                <p className="text-sm text-on-surface-variant/80 mb-8 leading-relaxed px-4">
                  This will permanently erase your library, stories, followers, and reading history. Enter your credentials to verify your identity.
                </p>

                <div className="space-y-4 mb-8 text-left">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Verify Email</label>
                      <input 
                         type="email" 
                         value={deleteEmail}
                         onChange={e => setDeleteEmail(e.target.value)}
                         placeholder={user?.email || "your@email.com"}
                         className="w-full bg-bookvault-surface-low border border-outline-variant/10 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-red-500/20"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Confirm Password</label>
                      <input 
                         type="password" 
                         value={deletePassword}
                         onChange={e => setDeletePassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full bg-bookvault-surface-low border border-outline-variant/10 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-red-500/20"
                      />
                   </div>
                    <div className="space-y-1.5 pt-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-red-500/80 px-1">Type phrase to confirm</label>
                       <p className="text-[10px] text-on-surface-variant font-medium mb-2 px-1">Please type <span className="font-black text-red-600">DELETE MY ACCOUNT</span> below.</p>
                       <input 
                          type="text" 
                          value={deletePhrase}
                          onChange={e => setDeletePhrase(e.target.value.toUpperCase())}
                          placeholder="DELETE MY ACCOUNT"
                          autoComplete="off"
                          className="w-full bg-red-50/30 border border-red-200/50 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-red-500 uppercase font-black tracking-tight"
                       />
                    </div>
                    {deleteError && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[10px] font-bold text-red-500 mt-2 px-1">
                          <AlertCircle size={12} /> {deleteError}
                       </motion.div>
                    )}
                 </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmDeletion}
                    disabled={isVerifying}
                    className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-premium hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Yes, Delete My Account</>}
                  </button>
                  <button
                    onClick={() => {
                       setShowDeleteModal(false);
                       setDeleteError('');
                       setDeletePassword('');
                       setDeletePhrase('');
                    }}
                    className="w-full py-4 text-on-surface-variant font-bold hover:bg-bookvault-surface-low rounded-2xl transition-all"
                  >
                    No, keep my account
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-full font-bold text-sm"
              >
                <CheckCircle size={16} /> Saved!
              </motion.div>
            ) : (
              <motion.button
                key="save"
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-bookvault-primary text-white rounded-full font-bold text-sm hover:bg-bookvault-primary-container transition-all shadow-premium disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  )
}

const ProfilePage = () => (
  <ProfileErrorBoundary>
    <Profile />
  </ProfileErrorBoundary>
)

export default ProfilePage
