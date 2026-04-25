import React from 'react'
import TrustLayout from '../../components/layout/TrustLayout'

const About = () => {
  return (
    <TrustLayout title="About BookVault" subtitle="Preserving the sanctity of literature for the digital pioneer.">
      <section>
        <h2>Our Mission</h2>
        <p>
          In an age of endless scrolling and decreasing attention spans, BookVault was created as a sanctuary for those who still value the deep, immersive experience of reading. We provide professional-grade tools for authors to build world-class manuscripts and for readers to enjoy them without distraction.
        </p>
      </section>

      <section>
        <h2>The Architecture of Immersion</h2>
        <p>
          Every pixel and interaction in BookVault is designed to disappear. From our "Zen" reading engines to our minimalist dashboard, we prioritize content over interface. We believe that technology should serve literature, not consume it.
        </p>
      </section>

      <section>
        <h2>Built for Authors</h2>
        <p>
          BookVault provides a seamless bridge between a private draft and a public legacy. Our community features allow authors to share their progress, build a following, and receive direct support from their readers, all while maintaining complete control over their intellectual property.
        </p>
      </section>

      <section className="text-center py-12">
        <p className="text-xl font-serif italic text-bookvault-primary">
          "A room without books is like a body without a soul. BookVault is the digital room where your soul's library resides."
        </p>
      </section>
    </TrustLayout>
  )
}

export default About
