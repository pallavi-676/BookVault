import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Mail, Heart, Globe, MessageSquare } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  const sections = [
    {
      title: "Platform",
      links: [
        { label: "Discover", to: "/discover" },
        { label: "Dashboard", to: "/dashboard" },
        { label: "About Us", to: "/about" },
        { label: "FAQ", to: "/faq" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Terms of Service", to: "/terms" },
        { label: "Community Guidelines", to: "/guidelines" },
        { label: "Copyright & DMCA", to: "/copyright" }
      ]
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", to: "/faq" },
        { label: "Contact Support", to: "/contact" },
        { label: "System Status", to: "#" }
      ]
    }
  ]

  return (
    <footer className="bg-bookvault-surface border-t border-outline-variant/10 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-bookvault-primary rounded-xl flex items-center justify-center shadow-premium">
                <Shield className="text-white" size={20} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-bookvault-primary tracking-tight">BookVault</h2>
            </div>
            <p className="text-on-surface-variant max-w-sm leading-relaxed">
              An immersive, professional ecosystem for authors and readers to preserve the sanctity of literature in a digital age.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-bookvault-surface-low flex items-center justify-center text-on-surface-variant hover:bg-bookvault-primary hover:text-white transition-all shadow-sm">
                <MessageSquare size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-bookvault-surface-low flex items-center justify-center text-on-surface-variant hover:bg-bookvault-primary hover:text-white transition-all shadow-sm">
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline-variant mb-6">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.to} 
                      className="text-sm font-medium text-on-surface-variant hover:text-bookvault-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant/60">
            <span>&copy; {currentYear} BookVault. Crafted with</span>
            <Heart size={12} className="text-red-400 fill-red-400" />
            <span>for the written word.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-bookvault-primary">
              <Mail size={14} />
              <a href="mailto:support@bookvault.app">support@bookvault.app</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
