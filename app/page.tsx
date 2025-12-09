'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      } else {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, [supabase, router]);

  if (isLoggedIn === null) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-brand">
          <span className="brand-icon">🎧</span>
          <span className="brand-name">CallTranscribe</span>
        </div>
        <nav className="header-nav">
          <Link href="/pricing">Pricing</Link>
          <Link href="/help">Help</Link>
          <Link href="/login" className="nav-btn secondary">Sign In</Link>
          <Link href="/signup" className="nav-btn primary">Get Started Free</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            AI-Powered Call Analysis<br />
            <span className="gradient-text">for Better Customer Experience</span>
          </h1>
          <p className="hero-subtitle">
            Transcribe, analyze, and improve your customer calls with advanced AI. 
            Get actionable coaching insights, performance scores, and predictive analytics.
          </p>
          <div className="hero-cta">
            <Link href="/signup" className="cta-primary">
              Start Free Trial →
            </Link>
            <span className="cta-note">3 free calls • No credit card required</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="demo-card">
            <div className="demo-header">
              <span className="demo-file">customer_call_001.mp3</span>
              <span className="demo-status">✓ Analyzed</span>
            </div>
            <div className="demo-score">
              <span className="score-value">78</span>
              <span className="score-label">Overall Score</span>
            </div>
            <div className="demo-metrics">
              <div className="metric"><span>Customer Handling</span><span>82</span></div>
              <div className="metric"><span>Communication</span><span>75</span></div>
              <div className="metric"><span>Pitch Effectiveness</span><span>71</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <h2>Everything You Need to Improve Call Quality</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🎙️</span>
            <h3>AI Transcription</h3>
            <p>Accurate transcription in English, Hindi & Hinglish with speaker identification</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Deep Analytics</h3>
            <p>Talk ratio, questions analysis, interruptions, response times and more</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎯</span>
            <h3>Coaching Scores</h3>
            <p>Detailed performance scores with strengths, weaknesses, and improvement tips</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔮</span>
            <h3>Predictions</h3>
            <p>Conversion probability, churn risk, and customer satisfaction predictions</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Key Moments</h3>
            <p>Automatically detect critical moments with timestamps and sentiment</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📄</span>
            <h3>PDF Reports</h3>
            <p>Export professional reports for training, compliance, and reviews</p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview">
        <h2>Simple, Transparent Pricing</h2>
        <p>Start free, upgrade as you grow</p>
        <div className="pricing-cards">
          <div className="price-card">
            <h3>Free</h3>
            <div className="price">₹0</div>
            <ul>
              <li>3 calls/month</li>
              <li>7 days history</li>
              <li>Basic analysis</li>
            </ul>
          </div>
          <div className="price-card featured">
            <span className="featured-badge">Popular</span>
            <h3>Team</h3>
            <div className="price">₹1,999<span>/mo</span></div>
            <ul>
              <li>300 calls/month</li>
              <li>10 users</li>
              <li>PDF export</li>
              <li>Team management</li>
            </ul>
          </div>
          <div className="price-card">
            <h3>Enterprise</h3>
            <div className="price">₹4,999<span>/mo</span></div>
            <ul>
              <li>1000 calls/month</li>
              <li>Unlimited users</li>
              <li>API access</li>
              <li>Custom branding</li>
            </ul>
          </div>
        </div>
        <Link href="/pricing" className="view-pricing">View Full Pricing →</Link>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <h2>Ready to Improve Your Call Quality?</h2>
        <p>Join hundreds of teams using CallTranscribe to enhance customer experience</p>
        <Link href="/signup" className="cta-primary large">
          Get Started Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="brand-icon">🎧</span>
          <span>CallTranscribe</span>
        </div>
        <div className="footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/help">Help</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <p className="footer-copy">© 2024 CallTranscribe. All rights reserved.</p>
      </footer>
    </div>
  );
}
