'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <Logo size="lg" />
        </Link>
        <nav className="legal-nav">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
        </nav>
      </header>

      <main className="legal-content">
        <div className="legal-container contact-container">
          <h1>Contact Us</h1>
          <p className="contact-intro">
            Have a question, feedback, or need support? We&apos;re here to help. Reach out to us through the form below or use one of our direct contact methods.
          </p>

          <div className="contact-grid">
            <div className="contact-form-section">
              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h2>Thank You!</h2>
                  <p>Your message has been sent successfully. We&apos;ll get back to you within 24-48 hours.</p>
                  <button onClick={() => setSubmitted(false)} className="submit-another">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="billing">Billing & Subscription</option>
                      <option value="partnership">Partnership Opportunities</option>
                      <option value="feedback">Feedback & Suggestions</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="Brief subject line"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            <div className="contact-info-section">
              <div className="contact-info-card">
                <h2>Get in Touch</h2>
                <p>Choose the best way to reach us based on your needs:</p>

                <div className="contact-methods">
                  <div className="contact-method">
                    <div className="method-icon">📧</div>
                    <div className="method-content">
                      <h3>Email Support</h3>
                      <p>For general inquiries and support</p>
                      <a href="mailto:support@audiolyse.com">support@audiolyse.com</a>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">💼</div>
                    <div className="method-content">
                      <h3>Sales Inquiries</h3>
                      <p>Questions about pricing and plans</p>
                      <a href="mailto:sales@audiolyse.com">sales@audiolyse.com</a>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">💳</div>
                    <div className="method-content">
                      <h3>Billing Support</h3>
                      <p>Payment and subscription questions</p>
                      <a href="mailto:billing@audiolyse.com">billing@audiolyse.com</a>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon">🤝</div>
                    <div className="method-content">
                      <h3>Partnerships</h3>
                      <p>Business partnerships and integrations</p>
                      <a href="mailto:partners@audiolyse.com">partners@audiolyse.com</a>
                    </div>
                  </div>
                </div>

                <div className="response-time">
                  <h3>Response Times</h3>
                  <ul>
                    <li><strong>Free Tier:</strong> 48-72 hours</li>
                    <li><strong>Individual/Team:</strong> 24-48 hours</li>
                    <li><strong>Enterprise:</strong> Priority support</li>
                  </ul>
                </div>

                <div className="help-resources">
                  <h3>Help Resources</h3>
                  <ul>
                    <li><Link href="/help">Help Center & Documentation</Link></li>
                    <li><Link href="/pricing">Pricing Information</Link></li>
                    <li><Link href="/about">About Audiolyse</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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

