'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function CompliancePage() {
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
          <h1>Security & Compliance</h1>
          <p className="legal-updated">Last Updated: December 11, 2024</p>

          <div className="compliance-intro">
            <p>
              At Audiolyse, we understand the critical importance of data security, especially for our clients in the medical and healthcare sectors. 
              We are committed to maintaining the highest standards of data protection and regulatory compliance.
            </p>
          </div>

          <section>
            <h2>1. Medical Industry Standards (HIPAA & DPDP)</h2>
            <p>
              Our platform is designed with the principles of the Health Insurance Portability and Accountability Act (HIPAA) and the Digital Personal Data Protection Act, 2023 (India) in mind.
            </p>
            <ul>
              <li><strong>Data Minimization:</strong> We only process the audio data required for analysis.</li>
              <li><strong>Business Associate Agreement (BAA):</strong> We offer BAAs for Enterprise clients handling Protected Health Information (PHI). Please contact sales.</li>
              <li><strong>Patient Consent:</strong> We provide tools to ensure you confirm patient consent before processing any data.</li>
            </ul>
          </section>

          <section>
            <h2>2. Data Encryption</h2>
            <p>
              We adhere to strict encryption standards to protect your data at rest and in transit.
            </p>
            <ul>
              <li><strong>In Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.2+ (Transport Layer Security).</li>
              <li><strong>At Rest:</strong> Audio files and analysis transcripts are stored using AES-256 encryption.</li>
            </ul>
          </section>

          <section>
            <h2>3. Access Control & Authentication</h2>
            <p>
              We implement rigorous access controls to ensure only authorized personnel can access sensitive data.
            </p>
            <ul>
              <li><strong>Role-Based Access Control (RBAC):</strong> Granular permissions ensure team members only access data relevant to their role.</li>
              <li><strong>Strict Authentication:</strong> We use secure, token-based authentication via Supabase Auth.</li>
              <li><strong>Audit Trails:</strong> System logs track access patterns to detect and prevent unauthorized activity.</li>
            </ul>
          </section>

          <section>
            <h2>4. AI Safety & Privacy</h2>
            <p>
              Our AI models (powered by Google Gemini) are configured with strict privacy parameters.
            </p>
            <ul>
              <li><strong>Zero Retention Policy:</strong> We can configure your enterprise instance so that audio files are processed in-memory and not permanently stored after analysis is delivered.</li>
              <li><strong>No Training on Customer Data:</strong> Your data is <strong>not</strong> used to train our public AI models.</li>
            </ul>
          </section>

          <section>
            <h2>5. Incident Response</h2>
            <p>
              We maintain a comprehensive incident response plan. In the unlikely event of a data breach, we are committed to notifying affected parties within 72 hours, in compliance with GDPR and local regulations.
            </p>
          </section>

          <section>
            <h2>6. Contact Compliance Team</h2>
            <p>
              For specific compliance inquiries, BAA requests, or security questionnaires, please contact our security team:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:compliance@audiolyse.com">compliance@audiolyse.com</a></li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-links">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/compliance">Compliance</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p>&copy; 2024 Audiolyse. All rights reserved.</p>
      </footer>
    </div>
  );
}
