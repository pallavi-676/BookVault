import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Mail, Lock, ArrowRight, User, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { mockDatabase } from '../lib/mockDatabase'
import { clsx } from 'clsx'

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  // Modes: LOGIN, SIGNUP, FORGOT_PASSWORD, UPDATE_PASSWORD
  const [mode, setMode] = useState('LOGIN')

  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('reader')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const { setUser } = useStore()
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      setError('Could not connect to Google. Please try again.')
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setIdentifier('')
    setPassword('')
    setConfirmPassword('')
    setRole('reader')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setError(null)
    setSuccessMsg(null)
  }

  useEffect(() => {
    if (searchParams.get('mode') === 'update_password') {
      setMode('UPDATE_PASSWORD')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    const credentials = { email: identifier, password }

    try {
      // 1. FORGOT PASSWORD FLOW
      if (mode === 'FORGOT_PASSWORD') {
        if (!identifier.includes('@')) {
          throw new Error('Please enter a valid email address for password reset.')
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${window.location.origin}/auth?mode=update_password`,
        })
        if (resetError) throw resetError
        setSuccessMsg('Reset link sent! Please check your email.')
        setLoading(false)
        return
      }

      // 2. UPDATE PASSWORD FLOW
      if (mode === 'UPDATE_PASSWORD') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.')
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        setSuccessMsg('Password updated successfully! Redirecting...')
        setTimeout(() => {
          setSearchParams({})
          navigate('/dashboard')
        }, 1500)
        return
      }

      // Pre-flight checks
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }

      if (mode === 'SIGNUP') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please try again.')
        }
      }

      // LOCAL FALLBACK (Simulated Auth)
      if (!import.meta.env.VITE_SUPABASE_URL) {
        let userData
        if (mode === 'LOGIN') {
          userData = await mockDatabase.signIn(identifier, password)
        } else {
          try {
            userData = await mockDatabase.signUp(identifier, password)
          } catch (signUpError) {
            if (signUpError.message.includes('User already registered')) {
              userData = await mockDatabase.signIn(identifier, password)
            } else {
              throw signUpError
            }
          }
        }
        const storedData = mockDatabase.loadData(userData.user.id)
        useStore.setState({
          user: userData.user,
          books: storedData?.books || [],
          annotations: storedData?.annotations || {},
          bookmarks: storedData?.bookmarks || {},
          readingProgress: storedData?.readingProgress || {},
          userStats: storedData?.userStats || { totalReadingTimeMs: 0, totalPagesRead: 0 }
        })
        navigate('/dashboard')
        return
      }

      // 3. ACTUAL LOGIN
      if (mode === 'LOGIN') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials)
        if (signInError) throw signInError
        setUser(data.user)
        navigate('/dashboard')
      }

      // 4. ACTUAL SIGNUP
      else if (mode === 'SIGNUP') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          ...credentials,
          options: {
            data: { 
              full_name: name.trim(), 
              role: role 
            }
          }
        })

        if (signUpError) throw signUpError

        // Upsert profile immediately if session exists
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: name.trim(),
            role: role,
            total_pages_read: 0,
            total_reading_time_ms: 0
          }, { onConflict: 'id' })
        }

        if (!data.session) {
          setSuccessMsg('Registration successful! Please check your email to verify your account.')
        } else {
          setUser(data.user)
          navigate('/dashboard')
        }
      }

    } catch (err) {
      console.error('Auth error:', err)
      const msg = (err.message || '').toLowerCase()

      if (err.status === 429 || msg.includes('rate limit')) {
        setError('Too many attempts. Please wait a moment and try again.')
      } else if (msg.includes('invalid login credentials')) {
        setError('We couldn\u2019t unlock your vault. Check your email or password.')
      } else if (msg.includes('email not confirmed')) {
        setError('Please confirm your email before signing in.')
      } else if (msg === 'failed to fetch' || msg.includes('network error') || msg.includes('connection')) {
        setError('Connection issue. Please try again.')
      } else {
        setError(err.message || 'An error occurred during authentication.')
      }
    } finally {
      setLoading(false)
    }
  }

  const titles = {
    LOGIN: 'Welcome back to your private atelier.',
    SIGNUP: 'Start your library with quiet luxury.',
    FORGOT_PASSWORD: 'Reset your password securely.',
    UPDATE_PASSWORD: 'Set your new password.'
  }

  return (
    <div className="min-h-screen bg-bookvault-surface flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-bookvault-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-bookvault-secondary/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-16 h-16 bg-bookvault-primary-container rounded-2xl flex items-center justify-center text-white shadow-premium mx-auto mb-6"
          >
            <Book size={36} />
          </motion.div>
          <h1 className="text-4xl font-serif font-bold text-bookvault-primary mb-2 tracking-tight">
            BookVault
          </h1>
          <p className="text-on-surface-variant font-sans">
            {titles[mode]}
          </p>
        </div>

        <div className="bg-bookvault-surface-lowest rounded-book p-10 shadow-premium">

          {(mode === 'LOGIN' || mode === 'SIGNUP') && (
            <div className="flex bg-bookvault-surface-low p-1.5 rounded-xl mb-8">
              <button
                onClick={() => { setMode('LOGIN'); resetForm() }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'LOGIN' ? 'bg-white text-bookvault-primary shadow-sm' : 'text-on-surface-variant hover:text-bookvault-primary'}`}
              >
                Login
              </button>
              <button
                onClick={() => { setMode('SIGNUP'); resetForm() }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'SIGNUP' ? 'bg-white text-bookvault-primary shadow-sm' : 'text-on-surface-variant hover:text-bookvault-primary'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold"
              >
                {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                key="success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-xs font-bold"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name — SIGNUP only */}
            {mode === 'SIGNUP' && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" size={18} />
                  <input
                    id="name"
                    type="text"
                    required={mode === 'SIGNUP'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. John Doe"
                    className="w-full bg-bookvault-surface-low border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Role Selector — SIGNUP only */}
            {mode === 'SIGNUP' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'reader', label: '📖 Reader', desc: 'Explore & collect books' },
                    { value: 'author', label: '✍️ Author', desc: 'Write & share stories' },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`p-3 rounded-xl text-left transition-all border-2 ${role === r.value ? 'border-bookvault-primary bg-bookvault-primary/5' : 'border-transparent bg-bookvault-surface-low hover:border-outline-variant/30'}`}
                    >
                      <p className="font-bold text-sm text-bookvault-primary">{r.label}</p>
                      <p className="text-[10px] text-on-surface-variant">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email */}
            {mode !== 'UPDATE_PASSWORD' && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" size={18} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.trim())}
                    placeholder="name@example.com"
                    className="w-full bg-bookvault-surface-low border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            {mode !== 'FORGOT_PASSWORD' && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  {mode === 'UPDATE_PASSWORD' ? 'New Password' : 'Password'}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-bookvault-surface-low border-none rounded-xl py-3.5 pl-12 pr-12 text-sm focus:ring-1 focus:ring-bookvault-primary/20 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-bookvault-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password — SIGNUP only */}
            {mode === 'SIGNUP' && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" 
                  className={clsx(
                    "text-[10px] font-bold uppercase tracking-widest px-1",
                    confirmPassword.length > 0 && password !== confirmPassword ? "text-red-500" : "text-on-surface-variant"
                  )}
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-bookvault-primary transition-colors" size={18} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={mode === 'SIGNUP'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={clsx(
                      "w-full bg-bookvault-surface-low border-none rounded-xl py-3.5 pl-12 pr-12 text-sm focus:ring-1 transition-all outline-none",
                      confirmPassword.length > 0 && password !== confirmPassword ? "ring-1 ring-red-400" : "focus:ring-bookvault-primary/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-bookvault-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'LOGIN' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('FORGOT_PASSWORD'); setError(null); setSuccessMsg(null) }}
                  className="text-xs text-bookvault-secondary hover:text-bookvault-primary font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bookvault-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-bookvault-primary-container transition-all shadow-premium group disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'LOGIN' ? 'Sign In' :
                     mode === 'SIGNUP' ? 'Create Account' :
                     mode === 'FORGOT_PASSWORD' ? 'Send Reset Link' :
                     'Set New Password'}
                  </span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {mode === 'FORGOT_PASSWORD' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); resetForm() }}
                  className="text-xs text-on-surface-variant hover:text-bookvault-primary font-medium transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </form>

          {(mode === 'LOGIN' || mode === 'SIGNUP') && (
            <>
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-bookvault-surface-lowest px-4 text-outline-variant font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-bookvault-surface-low hover:bg-bookvault-surface-variant/50 rounded-xl transition-all border border-transparent hover:border-outline-variant/30 disabled:opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-bold">Continue with Google</span>
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
