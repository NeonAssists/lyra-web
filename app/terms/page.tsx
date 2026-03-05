'use client';

import Link from 'next/link';

export default function TermsPage() {
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
            <h1 className="text-4xl font-black tracking-tight mb-3">Terms of Service</h1>
            <p className="text-sm text-[#8E8E93]">Effective Date: March 1, 2026</p>
            <p className="text-sm text-[#8E8E93]">Last Updated: March 4, 2026</p>
          </div>

          {/* Introduction */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <p className="text-[#8E8E93] leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of Lyra (operated by Neonotics), including our website and mobile application (collectively, the &quot;Service&quot;). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          {/* 1. Eligibility */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">1. Eligibility</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              You must be at least 13 years old to use Lyra. By using the Service, you represent that you meet this requirement. If you are under 18, you represent that you have permission from a parent or legal guardian.
            </p>
          </section>

          {/* 2. Your Account */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">2. Your Account</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Registration</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  You must provide accurate information when creating an account. You are responsible for keeping your login credentials secure and for all activity that occurs under your account.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Account Termination</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  You may delete your account at any time by contacting us. We reserve the right to suspend or terminate accounts that violate these Terms or that are used in a manner we determine, in our sole discretion, to be abusive or harmful.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Acceptable Use */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">3. Acceptable Use</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="space-y-2">
              {[
                'Violate any applicable law or regulation.',
                'Post or transmit content that is hateful, harassing, defamatory, or harmful to others.',
                'Impersonate any person or entity or misrepresent your affiliation with any person or entity.',
                'Attempt to gain unauthorized access to any part of the Service or its related systems.',
                'Use automated bots, scrapers, or tools to access or extract data from the Service without our written permission.',
                'Interfere with or disrupt the integrity or performance of the Service.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[#6C63FF] mt-0.5 shrink-0">—</span>
                  <span className="text-sm text-[#8E8E93] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. User Content */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">4. User Content</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Your Content</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  You retain ownership of any content you submit to Lyra (ratings, notes, lists, profile information). By submitting content, you grant Neonotics a non-exclusive, royalty-free, worldwide license to display and use that content to operate and improve the Service.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Responsibility</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  You are solely responsible for the content you submit. We do not endorse or verify user-submitted content and are not liable for any content posted by users.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Music Data */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">5. Music Data &amp; Third-Party Sources</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Lyra sources music metadata (song titles, album artwork, artist information, audio previews) from third-party services including Apple iTunes, Genius, and Last.fm. We do not own this data and display it under applicable terms of those providers. All audio previews are 30-second samples provided directly by Apple and subject to their usage policies. We do not host or store audio files.
            </p>
          </section>

          {/* 6. Intellectual Property */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">6. Intellectual Property</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              The Lyra name, logo, app design, and all original content created by Neonotics are owned by Neonotics and protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from any part of the Service without our express written permission.
            </p>
          </section>

          {/* 7. Paid Plans */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">7. Paid Plans &amp; Billing</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Subscription Plans</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  Lyra offers optional paid subscription plans that unlock additional features. Pricing and plan details are displayed in the app. Subscriptions are billed on a recurring basis until cancelled.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Cancellation</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  You may cancel your subscription at any time through your account settings or the relevant app store. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial billing periods unless required by applicable law.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Changes to Pricing</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  We reserve the right to change plan pricing at any time. We will provide reasonable advance notice of any price changes affecting your active subscription.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Disclaimers */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">8. Disclaimers</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NEONOTICS DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">9. Limitation of Liability</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEONOTICS AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM (OR $50 IF YOU HAVE NOT MADE ANY PAYMENTS).
            </p>
          </section>

          {/* 10. Governing Law */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">10. Governing Law</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              These Terms are governed by the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in Los Angeles County, California.
            </p>
          </section>

          {/* 11. Changes to Terms */}
          <section className="mb-10 pb-10 border-b border-white/[0.06]">
            <h2 className="text-2xl font-black mb-5 tracking-tight">11. Changes to These Terms</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              We may update these Terms from time to time. When we do, we will revise the &quot;Last Updated&quot; date at the top of this page. Continued use of the Service after any changes constitutes your acceptance of the new Terms. We will make reasonable efforts to notify you of material changes via email or in-app notice.
            </p>
          </section>

          {/* 12. Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-black mb-5 tracking-tight">12. Contact Us</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              If you have any questions about these Terms, please contact us at{' '}
              <Link href="mailto:neonotics@gmail.com" className="text-[#6C63FF] hover:underline font-semibold">
                neonotics@gmail.com
              </Link>
              .
            </p>
          </section>

          {/* Footer links */}
          <div className="pt-8 border-t border-white/[0.06] flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-[#8E8E93] hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/" className="text-sm text-[#8E8E93] hover:text-white transition-colors">Home</Link>
          </div>

        </div>
      </div>
    </div>
  );
}
