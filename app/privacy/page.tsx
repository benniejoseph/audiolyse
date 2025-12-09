'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function PrivacyPolicyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last Updated: December 9, 2024</p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to Audiolyse ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our call analysis platform.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, password, and profile information</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through third-party payment processors)</li>
              <li><strong>Audio Files:</strong> Call recordings and audio files you upload for analysis</li>
              <li><strong>Communication Data:</strong> Messages, feedback, and support requests</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <ul>
              <li><strong>Usage Data:</strong> How you interact with our platform, features used, and analysis history</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> Access times, pages viewed, and actions taken on our platform</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To provide, maintain, and improve our call analysis services</li>
              <li>To process transactions and manage your subscription</li>
              <li>To authenticate users and ensure account security</li>
              <li>To analyze call recordings and generate insights, coaching scores, and reports</li>
              <li>To send you service updates, notifications, and marketing communications (with your consent)</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations and enforce our terms of service</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Storage and Security</h2>
            <p>
              We use industry-standard security measures to protect your data:
            </p>
            <ul>
              <li><strong>Encryption:</strong> Data in transit is encrypted using TLS/SSL protocols</li>
              <li><strong>Secure Storage:</strong> Data is stored on secure servers with access controls</li>
              <li><strong>Authentication:</strong> Secure authentication mechanisms to protect account access</li>
              <li><strong>Regular Audits:</strong> We conduct security audits and updates to maintain data protection</li>
            </ul>
            <p>
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>5. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our platform (e.g., cloud hosting, payment processing, analytics)</li>
              <li><strong>AI Processing:</strong> Audio files are processed using Google Gemini AI for transcription and analysis</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Account Settings:</strong> Manage your privacy preferences through your account settings</li>
            </ul>
            <p>To exercise these rights, please contact us at <a href="mailto:privacy@audiolyse.com">privacy@audiolyse.com</a>.</p>
          </section>

          <section>
            <h2>7. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2>8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Audio files and analysis data are retained according to your subscription tier and retention settings.
            </p>
          </section>

          <section>
            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2>10. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:privacy@audiolyse.com">privacy@audiolyse.com</a></li>
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

