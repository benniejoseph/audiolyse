'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

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
        <div className="loader-ring">
          <div></div><div></div><div></div><div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page-v2">
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      <div className="bg-glow"></div>

      {/* Header */}
      <header className="header-v2">
        <div className="header-inner">
          <Link href="/" className="logo-link">
            <Logo size="md" showText={true} />
          </Link>
          <nav className="nav-v2">
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="/help">Docs</Link>
          </nav>
          <div className="header-actions">
            <Link href="/login" className="btn-ghost">Sign In</Link>
            <Link href="/signup" className="btn-primary-v2">
              <span>Get Started</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-v2">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span>Trusted by 500+ teams worldwide</span>
        </div>
        
        <h1 className="hero-title">
          <span className="title-line">Precision Intelligence</span>
          <span className="title-line gradient-text-v2">for Every Conversation</span>
        </h1>
        
        <p className="hero-desc">
          Transform customer calls into strategic insights. Our AI analyzes conversations 
          with surgical precision—delivering coaching scores, conversion predictions, 
          and marketing intelligence in seconds.
        </p>

        <div className="hero-cta-group">
          <Link href="/signup" className="btn-cta">
            <span>Start Free Trial</span>
            <span className="btn-shine"></span>
          </Link>
          <Link href="#demo" className="btn-secondary-v2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 7l5 3-5 3V7z" fill="currentColor"/>
            </svg>
            <span>Watch Demo</span>
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value">98%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">2.5s</span>
            <span className="stat-label">Avg Analysis</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">15+</span>
            <span className="stat-label">Languages</span>
          </div>
        </div>
      </section>

      {/* Interactive Demo Card */}
      <section id="demo" className="demo-section">
        <div className="demo-card-v2">
          <div className="demo-header-v2">
            <div className="demo-controls">
              <span className="control red"></span>
              <span className="control yellow"></span>
              <span className="control green"></span>
            </div>
            <span className="demo-title">Live Analysis Preview</span>
          </div>
          <div className="demo-content-v2">
            <div className="demo-left">
              <div className="waveform">
                {[...Array(40)].map((_, i) => (
                  <div key={i} className="wave-bar" style={{ 
                    height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}px`,
                    animationDelay: `${i * 0.05}s`
                  }}></div>
                ))}
              </div>
              <div className="audio-info">
                <span className="file-name">customer_call_2024.mp3</span>
                <span className="duration">03:24</span>
              </div>
            </div>
            <div className="demo-right">
              <div className="score-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="ring-bg"/>
                  <circle cx="50" cy="50" r="45" className="ring-progress" style={{ strokeDashoffset: 283 - (283 * 0.84) }}/>
                </svg>
                <div className="score-inner">
                  <span className="score-num">84</span>
                  <span className="score-label">Score</span>
                </div>
              </div>
              <div className="metrics-mini">
                <div className="metric-row">
                  <span>Empathy</span>
                  <div className="metric-bar"><div style={{ width: '91%' }}></div></div>
                  <span>91</span>
                </div>
                <div className="metric-row">
                  <span>Clarity</span>
                  <div className="metric-bar"><div style={{ width: '78%' }}></div></div>
                  <span>78</span>
                </div>
                <div className="metric-row">
                  <span>Pitch</span>
                  <div className="metric-bar"><div style={{ width: '85%' }}></div></div>
                  <span>85</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-v2">
        <div className="section-header">
          <span className="section-tag">Capabilities</span>
          <h2>Everything You Need to<br/><span className="gradient-text-v2">Master Every Call</span></h2>
        </div>

        <div className="features-grid-v2">
          <div className="feature-card-v2 featured">
            <div className="feature-icon-v2">
              <span>🎙️</span>
            </div>
            <h3>AI Transcription</h3>
            <p>Real-time transcription in English, Hindi & Hinglish with 98% accuracy and speaker identification.</p>
            <div className="feature-tags">
              <span>Multi-lingual</span>
              <span>Real-time</span>
            </div>
          </div>

          <div className="feature-card-v2">
            <div className="feature-icon-v2">
              <span>📊</span>
            </div>
            <h3>Conversation Metrics</h3>
            <p>Talk ratios, response times, interruptions, and 20+ metrics analyzed instantly.</p>
          </div>

          <div className="feature-card-v2">
            <div className="feature-icon-v2">
              <span>🎯</span>
            </div>
            <h3>Precision Scoring</h3>
            <p>Strict AI evaluation across 8 categories with actionable improvement suggestions.</p>
          </div>

          <div className="feature-card-v2">
            <div className="feature-icon-v2">
              <span>🔮</span>
            </div>
            <h3>Predictive Analytics</h3>
            <p>Conversion probability, churn risk, and satisfaction forecasts powered by ML.</p>
          </div>

          <div className="feature-card-v2">
            <div className="feature-icon-v2">
              <span>⚡</span>
            </div>
            <h3>Key Moments</h3>
            <p>Auto-detect objections, buying signals, and critical conversation turning points.</p>
          </div>

          <div className="feature-card-v2">
            <div className="feature-icon-v2">
              <span>📄</span>
            </div>
            <h3>Executive Reports</h3>
            <p>One-click PDF exports with visualizations for training and compliance.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-v2">
        <div className="section-header">
          <span className="section-tag">Pricing</span>
          <h2>Transparent Pricing,<br/><span className="gradient-text-v2">Exceptional Value</span></h2>
          <p className="section-desc">Start free. Scale as you grow. No hidden fees.</p>
        </div>

        <div className="pricing-grid-v2">
          {/* Free */}
          <div className="price-card-v2">
            <div className="price-header-v2">
              <span className="price-name">Free</span>
              <span className="price-desc">For exploration</span>
            </div>
            <div className="price-amount-v2">
              <span className="currency">₹</span>
              <span className="amount">0</span>
              <span className="period">/forever</span>
            </div>
            <ul className="price-features-v2">
              <li><span className="check">✓</span>5 calls/day</li>
              <li><span className="check">✓</span>Basic analysis</li>
              <li><span className="check">✓</span>7 days history</li>
              <li className="disabled"><span className="x">✗</span>PDF export</li>
              <li className="disabled"><span className="x">✗</span>Team features</li>
            </ul>
            <Link href="/signup" className="price-btn-v2">Get Started</Link>
          </div>

          {/* Individual */}
          <div className="price-card-v2">
            <div className="price-header-v2">
              <span className="price-name">Individual</span>
              <span className="price-desc">For professionals</span>
            </div>
            <div className="price-amount-v2">
              <span className="currency">₹</span>
              <span className="amount">499</span>
              <span className="period">/month</span>
            </div>
            <ul className="price-features-v2">
              <li><span className="check">✓</span>50 calls/month</li>
              <li><span className="check">✓</span>Full analysis suite</li>
              <li><span className="check">✓</span>30 days history</li>
              <li><span className="check">✓</span>PDF export</li>
              <li><span className="check">✓</span>Bulk upload</li>
            </ul>
            <Link href="/signup" className="price-btn-v2">Start Trial</Link>
          </div>

          {/* Team - Popular */}
          <div className="price-card-v2 popular">
            <div className="popular-tag">Most Popular</div>
            <div className="price-header-v2">
              <span className="price-name">Team</span>
              <span className="price-desc">For growing teams</span>
            </div>
            <div className="price-amount-v2">
              <span className="currency">₹</span>
              <span className="amount">1,999</span>
              <span className="period">/month</span>
            </div>
            <ul className="price-features-v2">
              <li><span className="check">✓</span>300 calls/month</li>
              <li><span className="check">✓</span>Up to 10 users</li>
              <li><span className="check">✓</span>90 days history</li>
              <li><span className="check">✓</span>Team management</li>
              <li><span className="check">✓</span>Priority support</li>
            </ul>
            <Link href="/signup" className="price-btn-v2 primary">Start Trial</Link>
          </div>

          {/* Enterprise */}
          <div className="price-card-v2">
            <div className="price-header-v2">
              <span className="price-name">Enterprise</span>
              <span className="price-desc">For organizations</span>
            </div>
            <div className="price-amount-v2">
              <span className="currency">₹</span>
              <span className="amount">4,999</span>
              <span className="period">/month</span>
            </div>
            <ul className="price-features-v2">
              <li><span className="check">✓</span>1,000 calls/month</li>
              <li><span className="check">✓</span>Unlimited users</li>
              <li><span className="check">✓</span>1 year history</li>
              <li><span className="check">✓</span>API access</li>
              <li><span className="check">✓</span>Custom branding</li>
            </ul>
            <Link href="/signup" className="price-btn-v2">Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-v2">
        <div className="cta-content">
          <h2>Ready to Transform Your<br/><span className="gradient-text-v2">Customer Conversations?</span></h2>
          <p>Join 500+ teams using Audiolyse to unlock precision intelligence from every call.</p>
          <div className="cta-buttons">
            <Link href="/signup" className="btn-cta">
              <span>Start Free Trial</span>
              <span className="btn-shine"></span>
            </Link>
            <Link href="/pricing" className="btn-ghost">View All Plans</Link>
          </div>
        </div>
        <div className="cta-glow"></div>
      </section>

      {/* Footer */}
      <footer className="footer-v2">
        <div className="footer-inner">
          <div className="footer-brand-v2">
            <Logo size="md" showText={true} showTagline={true} />
          </div>
          <div className="footer-links-v2">
            <div className="link-group">
              <span className="group-title">Product</span>
              <Link href="#features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/help">Documentation</Link>
            </div>
            <div className="link-group">
              <span className="group-title">Company</span>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/careers">Careers</Link>
            </div>
            <div className="link-group">
              <span className="group-title">Legal</span>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/cancellation-refunds">Cancellation & Refunds</Link>
              <Link href="/delivery">Delivery Policy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 Audiolyse. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
