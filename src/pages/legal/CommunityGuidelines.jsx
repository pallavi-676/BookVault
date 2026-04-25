import React from 'react'
import TrustLayout from '../../components/layout/TrustLayout'

const CommunityGuidelines = () => {
  return (
    <TrustLayout 
      title="Community Guidelines" 
      subtitle="How we maintain a professional space for literature."
    >
      <section>
        <h2>The BookVault Vision</h2>
        <p>
          BookVault is more than a reading app; it is a sanctuary for authors and readers. We strive for a community that values deep work, respectful critique, and creative integrity.
        </p>
      </section>

      <section>
        <h2>1. Respect the Craft</h2>
        <p>
          Constructive criticism is welcome; harassment is not. Feedback should be aimed at improving the story, not demeaning the author.
        </p>
      </section>

      <section>
        <h2>2. Originality and Copyright</h2>
        <p>
          Only upload content that you own or have the explicit right to share. Plagiarism is strictly prohibited and results in immediate account termination.
        </p>
      </section>

      <section>
        <h2>3. Content Sensitivities</h2>
        <p>
          We value creative freedom, but explicit violence, hate speech, or non-consensual imagery has no place on BookVault. Use appropriate content warnings for mature themes.
        </p>
      </section>

      <section>
        <h2>4. Community Reporting</h2>
        <p>
          If you encounter content or behavior that violates these guidelines, please use the report button or contact our support team at <strong>support@bookvault.app</strong>.
        </p>
      </section>
    </TrustLayout>
  )
}

export default CommunityGuidelines
