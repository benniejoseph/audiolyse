'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        },
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page-v2">
        {/* Background */}
        <div className="auth-bg">
          <div className="auth-bg-gradient"></div>
          <div className="auth-bg-grid"></div>
          <div className="auth-bg-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="auth-panel-right" style={{ width: '100%', borderLeft: 'none' }}>
          <div className="auth-card-v2" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>✉️</div>
            <h2 className="auth-card-title">Check your email</h2>
            <p className="auth-card-subtitle" style={{ marginBottom: '32px' }}>
              We&apos;ve sent a verification link to<br/>
              <strong style={{ color: '#fff' }}>{email}</strong>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>
              Click the link in your email to verify your account and get started.
            </p>
            <Link href="/login" className="form-link">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-v2">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="auth-bg-gradient"></div>
        <div className="auth-bg-grid"></div>
        <div className="auth-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      {/* Left Panel - Branding */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <Link href="/" className="auth-logo-link">
            <Logo size="lg" showText={true} showTagline={true} />
          </Link>

          <h1 className="auth-headline">
            Start Analyzing<br/>
            <span className="gradient-text">Calls Today</span>
          </h1>

          <p className="auth-subline">
            Join 500+ teams using Audiolyse to transform customer conversations into 
            strategic insights and competitive advantage.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="feature-icon-wrap">⚡</div>
              <span className="feature-text">Get started in under 2 minutes</span>
            </div>
            <div className="auth-feature">
              <div className="feature-icon-wrap">🎁</div>
              <span className="feature-text">3 free calls to explore the platform</span>
            </div>
            <div className="auth-feature">
              <div className="feature-icon-wrap">💳</div>
              <span className="feature-text">No credit card required</span>
            </div>
            <div className="auth-feature">
              <div className="feature-icon-wrap">🔒</div>
              <span className="feature-text">Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="auth-panel-right">
        <div className="auth-card-v2">
          {/* Mobile Logo */}
          <div className="mobile-auth-header">
            <Link href="/">
              <Logo size="md" showText={true} />
            </Link>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-card-title">Create your account</h2>
            <p className="auth-card-subtitle">Start your free trial today</p>
          </div>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="oauth-buttons">
            <button 
              type="button" 
              className="oauth-btn google"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignup} className="auth-form">
            <div className="form-group-v2">
              <label className="form-label-v2">Full name</label>
              <input
                type="text"
                className="form-input-v2"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-v2">
              <label className="form-label-v2">Work email</label>
              <input
                type="email"
                className="form-input-v2"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group-v2">
              <label className="form-label-v2">Password</label>
              <input
                type="password"
                className="form-input-v2"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              className="auth-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="spinner-sm"></span>
                  <span>Creating account...</span>
                </span>
              ) : (
                <>
                  <span>Create account</span>
                  <span className="btn-shine"></span>
                </>
              )}
            </button>

            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '16px' }}>
              By signing up, you agree to our{' '}
              <Link href="/terms" className="form-link" style={{ fontSize: '12px' }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="form-link" style={{ fontSize: '12px' }}>Privacy Policy</Link>
            </p>
          </form>

          <div className="auth-card-footer">
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
