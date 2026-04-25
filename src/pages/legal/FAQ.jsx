import React from 'react'
import TrustLayout from '../../components/layout/TrustLayout'

const FAQ = () => {
  const faqs = [
    {
      q: "Is BookVault free?",
      a: "Yes, the core BookVault experience is free for authors and readers. We believe in democratizing access to professional reading tools."
    },
    {
      q: "Can I read offline?",
      a: "Currently, BookVault requires an internet connection to sync your library. However, if you've recently opened a book, it may be cached in your browser for offline use."
    },
    {
      q: "What file formats are supported?",
      a: "We currently support PDF, EPUB, and plain text (.txt) files. We are working on adding more formats in the future."
    },
    {
      q: "How safe is my content?",
      a: "We use enterprise-grade encryption and Supabase's secure infrastructure. Your draft stories are invisible to others until you explicitly choose to publish them."
    }
  ]

  return (
    <TrustLayout title="Frequently Asked Questions" subtitle="Quick answers to common inquiries.">
      <div className="space-y-12">
        {faqs.map((faq, i) => (
          <div key={i}>
            <h3 className="text-xl font-bold font-serif mb-4">{faq.q}</h3>
            <p className="opacity-80 italic">{faq.a}</p>
          </div>
        ))}
      </div>
    </TrustLayout>
  )
}

export default FAQ
