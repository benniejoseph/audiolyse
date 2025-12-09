'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <Logo size="md" showText={true} />
        </Link>
        <nav className="legal-nav">
          <Link href="/">Home</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>

      <main className="legal-content">
        <div className="legal-container">
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last Updated: December 9, 2024</p>

          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using Audiolyse ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              Audiolyse is an AI-powered call analysis platform that provides:
            </p>
            <ul>
              <li>Audio transcription and analysis</li>
              <li>Coaching scores and performance metrics</li>
              <li>Predictive analytics and insights</li>
              <li>Call history and reporting features</li>
              <li>Team collaboration tools</li>
            </ul>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <h3>3.1 Account Creation</h3>
            <ul>
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>One person or entity may maintain only one account</li>
            </ul>

            <h3>3.2 Account Security</h3>
            <ul>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must immediately notify us of any unauthorized use of your account</li>
              <li>We are not liable for any loss or damage arising from unauthorized account access</li>
            </ul>
          </section>

          <section>
            <h2>4. Subscription and Payment</h2>
            <h3>4.1 Subscription Plans</h3>
            <ul>
              <li>We offer various subscription tiers (Free, Individual, Team, Enterprise)</li>
              <li>Subscription fees are billed monthly or annually as selected</li>
              <li>Prices are subject to change with 30 days' notice to existing subscribers</li>
            </ul>

            <h3>4.2 Payment Terms</h3>
            <ul>
              <li>Payment is due in advance for each billing period</li>
              <li>All fees are non-refundable except as required by law or as specified in our Cancellation & Refunds Policy</li>
              <li>Failed payments may result in service suspension or termination</li>
              <li>You authorize us to charge your payment method for recurring subscription fees</li>
            </ul>

            <h3>4.3 Usage Limits</h3>
            <ul>
              <li>Each subscription tier has specific usage limits (calls per month, storage, features)</li>
              <li>Exceeding limits may result in additional charges or service restrictions</li>
              <li>Unused call credits do not roll over to the next billing period</li>
            </ul>
          </section>

          <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Upload illegal, harmful, or offensive content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to reverse engineer, decompile, or hack the Service</li>
              <li>Use automated systems to access the Service without authorization</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service for any unlawful or fraudulent purpose</li>
            </ul>
          </section>

          <section>
            <h2>6. Intellectual Property</h2>
            <h3>6.1 Our Rights</h3>
            <p>
              The Service, including its original content, features, and functionality, is owned by Audiolyse and protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h3>6.2 Your Content</h3>
            <p>
              You retain ownership of audio files and data you upload. By using the Service, you grant us a license to use, process, and store your content solely for the purpose of providing the Service.
            </p>

            <h3>6.3 Analysis Results</h3>
            <p>
              Analysis results, insights, and reports generated by the Service belong to you. We may use anonymized, aggregated data for service improvement and analytics.
            </p>
          </section>

          <section>
            <h2>7. Service Availability</h2>
            <ul>
              <li>We strive to maintain 99.9% uptime but do not guarantee uninterrupted service</li>
              <li>We may perform scheduled maintenance with advance notice</li>
              <li>We reserve the right to modify, suspend, or discontinue any part of the Service</li>
              <li>We are not liable for any downtime or service interruptions</li>
            </ul>
          </section>

          <section>
            <h2>8. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our <Link href="/privacy">Privacy Policy</Link>. By using the Service, you consent to the collection and use of information as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2>9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that:
            </p>
            <ul>
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>Results will be accurate, complete, or reliable</li>
              <li>Defects will be corrected</li>
              <li>The Service is free of viruses or harmful components</li>
            </ul>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUDIOLYSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p>
              Our total liability for any claims arising from the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Audiolyse, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Content you upload or transmit through the Service</li>
            </ul>
          </section>

          <section>
            <h2>12. Termination</h2>
            <h3>12.1 By You</h3>
            <p>You may cancel your subscription at any time through your account settings or by contacting us.</p>

            <h3>12.2 By Us</h3>
            <p>We may suspend or terminate your account if:</p>
            <ul>
              <li>You violate these Terms</li>
              <li>You fail to pay subscription fees</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>We discontinue the Service</li>
            </ul>

            <h3>12.3 Effect of Termination</h3>
            <p>
              Upon termination, your right to use the Service will immediately cease. We may delete your account data after a reasonable retention period, subject to legal requirements.
            </p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section>
            <h2>14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service after changes become effective constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2>15. Contact Information</h2>
            <p>
              If you have questions about these Terms, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:legal@audiolyse.com">legal@audiolyse.com</a></li>
              <li><strong>Website:</strong> <Link href="/contact">Contact Us</Link></li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-links">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/cancellation-refunds">Cancellation & Refunds</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p>&copy; 2024 Audiolyse. All rights reserved.</p>
      </footer>
    </div>
  );
}

