import React from 'react'
import TrustLayout from '../../components/layout/TrustLayout'

const PrivacyPolicy = () => {
  return (
    <TrustLayout 
      title="Privacy Policy" 
      subtitle="Last updated: April 19, 2026"
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          At BookVault, we prioritize the privacy and security of authors and readers. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>2.1 Personal Information</h3>
        <p>
          When you create an account, we collect your email address and profile information (name, bio, avatar). If you use social login (Google), we receive your basic profile data from the provider.
        </p>
        <h3>2.2 Usage Data</h3>
        <p>
          We track reading progress, bookmarks, and highlights to synchronize your experience across devices. We also collect basic analytics to improve platform performance.
        </p>
      </section>

      <section>
        <h2>3. How We Use Information</h2>
        <ul>
          <li>To provide and maintain the BookVault reading experience.</li>
          <li>To facilitate social interactions (following, liking, messaging).</li>
          <li>To personalize your "Discover" feed based on your interests.</li>
          <li>To provide customer support and security alerts.</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Storage and Security</h2>
        <p>
          Your data is stored securely using Supabase (PostgreSQL). We use industry-standard Row Level Security (RLS) to ensure that only you (and intended social recipients) can access your private data.
        </p>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal data at any time. You can permanently delete your account and all associated manuscripts through the "Danger Zone" in your Account Settings.
        </p>
      </section>

      <section>
        <h2>6. Contact Us</h2>
        <p>
          If you have questions about this policy, contact us at <a href="mailto:bookvaultteam@gmail.com" className="text-bookvault-primary font-bold hover:underline">bookvaultteam@gmail.com</a>.
        </p>
      </section>
    </TrustLayout>
  )
}

export default PrivacyPolicy
