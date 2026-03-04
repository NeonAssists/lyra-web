'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-black tracking-tight hover:text-[#6C63FF] transition-colors">Lyra</Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-[#8E8E93] hover:text-white transition-colors hidden sm:block">Home</Link>
            <Link href="/app" className="text-sm font-semibold bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-all">Open App</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-black tracking-tight mb-3">Privacy Policy</h1>
            <p className="text-sm text-[#8E8E93]">Effective Date: March 1, 2026</p>
            <p className="text-sm text-[#8E8E93]">Last Updated: March 4, 2026</p>
          </div>

          {/* Introduction */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <p className="text-[#8E8E93] leading-relaxed">
              At Lyra (operated by Neonotics), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and web application at{' '}
              <span className="text-[#6C63FF] font-semibold">lyra.app</span>.
            </p>
          </section>

          {/* What We Collect */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">What Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Account Information</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  When you create a Lyra account, we collect your email address, display name, and handle (username). These are required to set up your profile and enable the core rating functionality.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Your Rankings and Lists</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  All music ratings, decimal scores (0.1 to 10.0), notes, tags, and custom lists you create are stored and associated with your account. Your public profile displays your ranking history unless you choose otherwise.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Optional Spotify Connection</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  Connecting your Spotify account is entirely optional. If you choose to do so, we use OAuth to authenticate your identity — we do not store your Spotify password. We request only the <span className="text-white font-medium">user-read-private</span> and <span className="text-white font-medium">user-read-email</span> scopes to verify your Spotify identity. We do not access your playlists, listening history, or any other Spotify data.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Technical Information</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  We automatically collect IP addresses, browser type, device information, and usage patterns through standard web server logs and analytics. This helps us understand how Lyra is used and improve performance and security.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Cookies & Local Storage</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  Lyra uses cookies and browser local storage solely to maintain your authenticated session and remember your preferences. We do not use advertising cookies or third-party tracking cookies. Session cookies expire when you sign out or close your browser. You can disable cookies in your browser settings, but doing so may prevent you from logging in.
                </p>
              </div>
            </div>
          </section>

          {/* How We Store Data */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">How We Store Your Data</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              Lyra uses{' '}
              <span className="font-semibold text-white">Supabase</span>, a secure, open-source PostgreSQL database platform, to store all account information, rankings, and lists. Supabase provides enterprise-grade encryption in transit and at rest. All data is stored on Supabase's secure infrastructure with regular backups.
            </p>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Your data is encrypted end-to-end for sensitive operations. Authentication is handled securely using industry-standard protocols. We do not store passwords in plain text; all passwords are hashed.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Data Retention</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              We retain your personal data for as long as your account is active. If you delete your account, all associated data — including your email, rankings, lists, and profile — is permanently removed from our systems within 7 business days.
            </p>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Anonymized, aggregated analytics data (with no personally identifiable information) may be retained indefinitely for product improvement purposes.
            </p>
          </section>

          {/* International Transfers */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">International Data Transfers</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Lyra is operated from the United States. If you access Lyra from outside the United States, your data may be transferred to and processed in the United States. Supabase, our database provider, processes data under standard contractual clauses and applicable data protection agreements. By using Lyra, you consent to this transfer. We take appropriate safeguards to ensure your data is treated securely and in accordance with this Privacy Policy.
            </p>
          </section>

          {/* How We Use Data */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">How We Use Your Data</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">We use your data to:</p>
            <ul className="space-y-3 ml-4 text-sm text-[#8E8E93]">
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Provide and maintain Lyra, including storing and displaying your rankings and profiles</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Enable features like public shareable profiles, custom lists, and music discovery</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Send account-related notifications (e.g., password resets, important updates)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Improve Lyra through analytics and performance monitoring</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Prevent fraud, abuse, and unauthorized access</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Comply with legal obligations and law enforcement requests</span>
              </li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Data Sharing & Selling</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              <span className="font-semibold text-white">We do not sell your personal data to third parties under any circumstances.</span> Your email, handle, and ranking data are not monetized, rented, or sold.
            </p>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              We may share data only in these limited cases:
            </p>
            <ul className="space-y-2 ml-4 text-sm text-[#8E8E93]">
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span><span className="font-semibold text-white">Service providers:</span> Supabase and other infrastructure providers who process data under strict confidentiality agreements</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span><span className="font-semibold text-white">Legal compliance:</span> When required by law, court order, or government request</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span><span className="font-semibold text-white">Public profiles:</span> Your public profile (rankings, lists, handle, display name) is intentionally publicly visible by design</span>
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Your Rights & Controls</h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">GDPR (EU & UK Users)</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed mb-3">
                If you are a resident of the European Union or United Kingdom, you have rights under the General Data Protection Regulation (GDPR), including:
              </p>
              <ul className="space-y-2 ml-4 text-sm text-[#8E8E93]">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                  <span>Right to access your personal data</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                  <span>Right to rectify or correct inaccurate data</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                  <span>Right to erasure ("right to be forgotten")</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                  <span>Right to restrict processing</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                  <span>Right to data portability</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                  <span>Right to object to processing</span>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">CCPA (California Users)</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed mb-3">
                If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA), including the right to know, delete, and opt-out of data sales. Since we do not sell data, opt-out is not applicable, but you retain all other rights.
              </p>
            </div>

            <p className="text-sm text-[#8E8E93] leading-relaxed">
              To exercise any of these rights, contact us at{' '}
              <Link href="mailto:hello@getlyra.app" className="text-[#6C63FF] hover:underline font-semibold">
                hello@getlyra.app
              </Link>.
            </p>
          </section>

          {/* Account Deletion */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">How to Delete Your Account</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              You can request complete deletion of your Lyra account and all associated data at any time by emailing{' '}
              <Link href="mailto:hello@getlyra.app" className="text-[#6C63FF] hover:underline font-semibold">
                hello@getlyra.app
              </Link>.
            </p>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              Please include "Request Account Deletion" in the subject line. We will:
            </p>
            <ul className="space-y-2 ml-4 text-sm text-[#8E8E93] mb-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">1.</span>
                <span>Verify your identity via reply from your registered email address</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">2.</span>
                <span>Permanently delete your account, email, rankings, lists, and all personal data from Supabase</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">3.</span>
                <span>Confirm deletion within 7 business days</span>
              </li>
            </ul>
            <p className="text-xs text-[#6C63FF] bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-lg px-3 py-2">
              Note: Deletion is permanent and cannot be undone. Your public profile URL will be removed from search results.
            </p>
          </section>

          {/* Security */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Data Security</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              Lyra takes data security seriously. We employ multiple layers of protection:
            </p>
            <ul className="space-y-2 ml-4 text-sm text-[#8E8E93]">
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>HTTPS/TLS encryption for all data in transit</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Database encryption at rest (Supabase)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Secure password hashing using industry-standard algorithms</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Periodic security reviews and monitoring</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-[#6C63FF] font-semibold">•</span>
                <span>Access controls and authentication safeguards</span>
              </li>
            </ul>
            <p className="text-sm text-[#8E8E93] leading-relaxed mt-4">
              However, no system is 100% secure. If you believe your account has been compromised, contact us immediately.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Third-Party Links & Services</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Lyra may link to external websites (e.g., Spotify, Apple Music). We are not responsible for their privacy practices. Please review their privacy policies when you interact with third-party services. Spotify OAuth is optional and governed by Spotify's privacy policy.
            </p>
          </section>

          {/* Children */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Children's Privacy</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Lyra is not intended for children under 13 years old. We do not knowingly collect data from children. If we become aware that a child has created an account, we will delete their data and account immediately.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Contact Us</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact:
            </p>
            <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-5">
              <p className="text-sm font-semibold text-white mb-2">Lyra / Neonotics</p>
              <p className="text-sm text-[#8E8E93]">
                Email:{' '}
                <Link href="mailto:hello@getlyra.app" className="text-[#6C63FF] hover:underline font-semibold">
                  hello@getlyra.app
                </Link>
              </p>
              <p className="text-xs text-[#8E8E93] mt-3">
                Response time: We aim to respond to all privacy inquiries within 7 business days.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">Changes to This Policy</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Lyra may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last Updated" date at the top of this page and, if required by law, via email. Your continued use of Lyra after changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Final */}
          <section>
            <p className="text-xs text-[#6C63FF] bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-lg px-4 py-3">
              Lyra respects your privacy. Your data is yours. We believe transparent, minimal data collection and strict non-monetization build trust. Thank you for using Lyra.
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="font-black text-sm">Lyra</span>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#48484A' }}>
            <Link href="/app" className="hover:text-white transition-colors">Web App</Link>
            <Link href="/u/nate7" className="hover:text-white transition-colors">Profiles</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
