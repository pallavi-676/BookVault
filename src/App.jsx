import React, { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { supabase } from './lib/supabase'

import ErrorBoundary from './components/common/ErrorBoundary'
import VaultLoader from './components/common/VaultLoader'

// Lazy loaded pages
const Auth = lazy(() => import('./pages/Auth'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Reader = lazy(() => import('./pages/Reader'))
const Profile = lazy(() => import('./pages/Profile'))
const AuthorDashboard = lazy(() => import('./pages/AuthorDashboard'))
const AuthorStoryManager = lazy(() => import('./pages/AuthorStoryManager'))
const ChapterEditor = lazy(() => import('./pages/ChapterEditor'))
const Discover = lazy(() => import('./pages/Discover'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const StoryLanding = lazy(() => import('./pages/StoryLanding'))
const ManuscriptReader = lazy(() => import('./pages/ManuscriptReader'))
const Messages = lazy(() => import('./pages/Messages'))
const Landing = lazy(() => import('./pages/Landing'))

// Trust & Safety Pack pages
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'))
const CommunityGuidelines = lazy(() => import('./pages/legal/CommunityGuidelines'))
const FAQ = lazy(() => import('./pages/legal/FAQ'))
const About = lazy(() => import('./pages/legal/About'))
const Contact = lazy(() => import('./pages/legal/Contact'))
const Copyright = lazy(() => import('./pages/legal/Copyright'))

// ProtectedRoute waits for the initial session check before deciding to redirect
const ProtectedRoute = ({ children, sessionLoading }) => {
  const { user } = useStore()
  if (sessionLoading) {
    // While we're still checking Supabase for a session, show a neutral loader
    return (
      <div className="min-h-screen bg-bookvault-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-bookvault-primary/20 border-t-bookvault-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-medium animate-pulse">Opening your vault...</p>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" />
  return children
}

function AppContent() {
  const { theme, setUser } = useStore()
  const navigate = useNavigate()
  // sessionLoading prevents ProtectedRoute from prematurely bouncing OAuth users to /auth
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    // Initial session recovery (handles page refresh AND OAuth callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
      }
      setSessionLoading(false)
    })

    // Listen for auth state changes (login, logout, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/auth?mode=update_password'
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        // After Google OAuth redirect, navigate to dashboard
        if (window.location.pathname === '/auth' || window.location.pathname === '/') {
          navigate('/dashboard', { replace: true })
        }
      } else if (event === 'SIGNED_OUT') {
        if (import.meta.env.VITE_SUPABASE_URL) {
          useStore.getState().clearSession()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, navigate])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <ErrorBoundary>
      <Suspense fallback={<VaultLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute sessionLoading={sessionLoading}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reader/:id"
            element={
              <ProtectedRoute sessionLoading={sessionLoading}>
                <Reader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute sessionLoading={sessionLoading}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/author"
            element={
              <ProtectedRoute sessionLoading={sessionLoading}>
                <AuthorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/author/story/:storyId"
            element={
              <ProtectedRoute sessionLoading={sessionLoading}>
                <AuthorStoryManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/author/story/:storyId/chapter/:chapterId"
            element={
              <ProtectedRoute sessionLoading={sessionLoading}>
                <ChapterEditor />
              </ProtectedRoute>
            }
          />
          
          <Route path="/read/:storyId/:chapterId" element={<ManuscriptReader />} />
          <Route
            path="/messages"
            element={
              <ProtectedRoute sessionLoading={sessionLoading}>
                <Messages />
              </ProtectedRoute>
            }
          />
          
          <Route path="/discover" element={<Discover />} />
          <Route path="/:atUsername" element={<PublicProfile />} />
          <Route path="/:atUsername/:storySlug" element={<StoryLanding />} />

          {/* Legal & Trust Routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/guidelines" element={<CommunityGuidelines />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/copyright" element={<Copyright />} />

          <Route path="/" element={<Landing />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
