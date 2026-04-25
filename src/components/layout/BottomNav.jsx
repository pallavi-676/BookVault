import React from 'react'
import { Home, Compass, Library, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { clsx } from 'clsx'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userProfile } = useStore()

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard', id: 'home' },
    { icon: Compass, label: 'Discover', path: '/discover', id: 'discover' },
    { icon: Library, label: 'Library', path: '/dashboard', id: 'library' },
    { 
        icon: User, 
        label: 'Profile', 
        path: userProfile?.role === 'author' && userProfile?.username ? `/@${userProfile.username}` : '/profile', 
        id: 'profile' 
    }
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-t border-outline-variant/10 z-[60] flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.id === 'profile' && location.pathname.startsWith('/@'));
        
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300",
              isActive ? "text-bookvault-primary scale-110" : "text-on-surface-variant opacity-60 hover:opacity-100"
            )}
          >
            <div className={clsx(
                "p-1 rounded-lg transition-colors",
                isActive && "bg-bookvault-primary/10"
            )}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default BottomNav
