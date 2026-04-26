import React from 'react'
import TrustLayout from '../../components/layout/TrustLayout'

const Copyright = () => {
  return (
    <TrustLayout title="Copyright & DMCA" subtitle="Respecting intellectual property on BookVault.">
      <section>
        <h2>Intellectual Property Commitment</h2>
        <p>
          BookVault respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we have implemented a process for reporting and managing copyright infringement claims.
        </p>
      </section>

      <section>
        <h2>How to File a Takedown Notice</h2>
        <p>
          If you believe your copyrighted work is being used on BookVault without authorization, please submit a formal notice to our designated copyright agent at <a href="mailto:bookvaultteam@gmail.com?subject=DMCA/Takedown Request" className="text-bookvault-primary font-bold hover:underline">bookvaultteam@gmail.com</a> with the following information:
        </p>
        <ol>
          <li>A description of the copyrighted work that has been infringed.</li>
          <li>The specific URL on BookVault where the material is located.</li>
          <li>Your contact information (name, address, telephone number, and email).</li>
          <li>A statement that you have a good-faith belief that the use is not authorized.</li>
          <li>A statement, under penalty of perjury, that the info in your notice is accurate.</li>
          <li>An electronic or physical signature of the copyright owner.</li>
        </ol>
      </section>

      <section>
        <h2>Counter-Notices</h2>
        <p>
          If you believe your content was removed by mistake, you may submit a counter-notice providing details on why the content is not infringing. We will review and potentially restore the content as per DMCA guidelines.
        </p>
      </section>

      <section>
        <h2>Repeat Infringers</h2>
        <p>
          BookVault maintains a strict "Two-Strike" policy. Accounts found to be repeat infringers of intellectual property will be permanently banned.
        </p>
      </section>
    </TrustLayout>
  )
}

export default Copyright
