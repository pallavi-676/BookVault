import React from 'react'
import TrustLayout from '../../components/layout/TrustLayout'

const TermsOfService = () => {
  return (
    <TrustLayout 
      title="Terms of Service" 
      subtitle="Last updated: April 19, 2026"
    >
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using BookVault, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not use the platform.
        </p>
      </section>

      <section>
        <h2>2. User Accounts</h2>
        <p>
          You are responsible for maintaining the security of your account and any activities that occur under your credentials. You must provide accurate and complete information when creating your profile.
        </p>
      </section>

      <section>
        <h2>3. Content Ownership and Rights</h2>
        <h3>3.1 Your Content</h3>
        <p>
          You retain all ownership rights to the manuscripts, books, and annotations you upload or create on BookVault. We do not claim ownership of your intellectual property.
        </p>
        <h3>3.2 License to Platform</h3>
        <p>
          By publishing a story on BookVault, you grant us a worldwide, non-exclusive, royalty-free license to host, store, and display your content to other users as per your visibility settings.
        </p>
      </section>

      <section>
        <h2>4. Prohibited Conduct</h2>
        <p>
          Users may not:
        </p>
        <ul>
          <li>Upload infringing, illegal, or harmful content.</li>
          <li>Engage in harassment or bullying of other authors/readers.</li>
          <li>Attempt to reverse-engineer or bypass platform security measures.</li>
          <li>Distribute malware or engage in spamming activities.</li>
        </ul>
      </section>

      <section>
        <h2>5. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms or the Community Guidelines. You may terminate your account at any time via the Settings page.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          BookVault is provided "as is" without warranties of any kind. We are not liable for any lost content, data, or damages resulting from the use of our platform.
        </p>
      </section>
    </TrustLayout>
  )
}

export default TermsOfService
