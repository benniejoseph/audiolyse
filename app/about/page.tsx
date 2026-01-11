'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function AboutPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <Logo size="lg" />
        </Link>
        <nav className="legal-nav">
          <Link href="/">Home</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>

      <main className="legal-content">
        <div className="legal-container">
          <h1>About Audiolyse</h1>

          <section>
            <h2>Our Mission</h2>
            <p>
              At Audiolyse, we believe every conversation holds valuable insights. Our mission is to transform customer interactions into actionable intelligence, empowering businesses to improve their communication, enhance customer satisfaction, and drive better outcomes through AI-powered analysis.
            </p>
          </section>

          <section>
            <h2>What We Do</h2>
            <p>
              Audiolyse is an advanced conversation intelligence platform that uses cutting-edge AI to analyze customer calls and provide comprehensive insights. We help businesses:
            </p>
            <ul>
              <li><strong>Improve Agent Performance:</strong> Detailed coaching scores and actionable feedback to help your team excel</li>
              <li><strong>Understand Customer Needs:</strong> Deep analysis of customer sentiment, concerns, and preferences</li>
              <li><strong>Predict Outcomes:</strong> AI-powered predictions for conversion probability, churn risk, and customer satisfaction</li>
              <li><strong>Make Data-Driven Decisions:</strong> Comprehensive metrics and analytics to guide business strategy</li>
              <li><strong>Ensure Quality:</strong> Automated quality assurance and compliance monitoring</li>
            </ul>
          </section>

          <section>
            <h2>Our Technology</h2>
            <p>
              Audiolyse leverages state-of-the-art AI technology:
            </p>
            <ul>
              <li><strong>Google Gemini AI:</strong> Advanced multimodal AI for accurate transcription and deep analysis</li>
              <li><strong>Natural Language Processing:</strong> Understanding context, sentiment, and intent in conversations</li>
              <li><strong>Machine Learning:</strong> Predictive analytics and pattern recognition</li>
              <li><strong>Cloud Infrastructure:</strong> Scalable, secure, and reliable platform</li>
            </ul>
          </section>

          <section>
            <h2>Key Features</h2>
            <div className="features-grid">
              <div className="feature-item">
                <h3>🎯 Strict AI Scoring</h3>
                <p>Comprehensive evaluation across 8+ categories with strict, actionable scoring guidelines</p>
              </div>
              <div className="feature-item">
                <h3>📊 Advanced Metrics</h3>
                <p>20+ conversation metrics including talk ratios, response times, and engagement levels</p>
              </div>
              <div className="feature-item">
                <h3>🔮 Predictive Analytics</h3>
                <p>AI-powered predictions for conversion, churn risk, and customer satisfaction</p>
              </div>
              <div className="feature-item">
                <h3>📄 Professional Reports</h3>
                <p>One-click PDF exports with comprehensive analysis and visual insights</p>
              </div>
              <div className="feature-item">
                <h3>👥 Team Collaboration</h3>
                <p>Multi-user support with team management and shared analysis history</p>
              </div>
              <div className="feature-item">
                <h3>🔒 Enterprise Security</h3>
                <p>Bank-level encryption, secure storage, and compliance with data protection standards</p>
              </div>
            </div>
          </section>

          <section>
            <h2>Who We Serve</h2>
            <p>
              Audiolyse is designed for businesses that rely on customer communication:
            </p>
            <ul>
              <li><strong>Call Centers:</strong> Quality assurance and agent coaching</li>
              <li><strong>Sales Teams:</strong> Performance improvement and conversion optimization</li>
              <li><strong>Customer Support:</strong> Service quality monitoring and training</li>
              <li><strong>Healthcare:</strong> Patient communication analysis and compliance</li>
              <li><strong>Real Estate:</strong> Client interaction analysis and agent development</li>
              <li><strong>Financial Services:</strong> Compliance monitoring and customer experience</li>
            </ul>
          </section>

          <section>
            <h2>Our Values</h2>
            <ul>
              <li><strong>Accuracy:</strong> We provide precise, reliable analysis you can trust</li>
              <li><strong>Transparency:</strong> Clear, understandable insights and scoring methodology</li>
              <li><strong>Privacy:</strong> Your data is secure and protected with industry-leading security</li>
              <li><strong>Innovation:</strong> Continuously improving our AI and features</li>
              <li><strong>Customer Focus:</strong> Your success is our priority</li>
            </ul>
          </section>

          <section>
            <h2>Why Choose Audiolyse</h2>
            <div className="why-choose">
              <div className="reason">
                <h3>🚀 Fast & Efficient</h3>
                <p>Get comprehensive analysis in minutes, not hours. Process multiple calls simultaneously.</p>
              </div>
              <div className="reason">
                <h3>💰 Cost-Effective</h3>
                <p>Affordable pricing tiers for businesses of all sizes. No hidden fees or long-term contracts.</p>
              </div>
              <div className="reason">
                <h3>🎓 Actionable Insights</h3>
                <p>Not just data - get specific recommendations and coaching tips to improve performance.</p>
              </div>
              <div className="reason">
                <h3>📈 Scalable</h3>
                <p>From individual users to enterprise teams, we scale with your needs.</p>
              </div>
            </div>
          </section>

          <section>
            <h2>Our Commitment</h2>
            <p>
              We are committed to:
            </p>
            <ul>
              <li>Providing accurate, reliable analysis powered by cutting-edge AI</li>
              <li>Protecting your data with enterprise-grade security</li>
              <li>Continuously improving our platform based on user feedback</li>
              <li>Delivering exceptional customer support</li>
              <li>Maintaining transparency in our processes and pricing</li>
            </ul>
          </section>

          <section>
            <h2>Get Started</h2>
            <p>
              Ready to transform your customer conversations into actionable insights?
            </p>
            <div className="cta-buttons">
              <Link href="/signup" className="cta-button-primary">
                Start Free Trial
              </Link>
              <Link href="/pricing" className="cta-button-secondary">
                View Pricing
              </Link>
              <Link href="/contact" className="cta-button-secondary">
                Contact Sales
              </Link>
            </div>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              Have questions? We&apos;d love to hear from you:
            </p>
            <ul>
              <li><strong>General Inquiries:</strong> <a href="mailto:info@audiolyse.com">info@audiolyse.com</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@audiolyse.com">support@audiolyse.com</a></li>
              <li><strong>Sales:</strong> <a href="mailto:sales@audiolyse.com">sales@audiolyse.com</a></li>
              <li><strong>Website:</strong> <Link href="/contact">Contact Form</Link></li>
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

