'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-card">
        <div className="success-icon">📧</div>
        <h2>Check Your Email</h2>
        <p className="auth-subtitle">
          We&apos;ve sent a password reset link to <strong>{email}</strong>.
        </p>
        <p className="auth-note">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button 
            className="link-btn"
            onClick={() => setSuccess(false)}
          >
            try again
          </button>
        </p>
        <Link href="/login" className="auth-btn secondary">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h2>Reset Password</h2>
      <p className="auth-subtitle">
        Enter your email and we&apos;ll send you a link to reset your password
      </p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleReset}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="auth-btn primary" disabled={loading}>
          {loading ? (
            <span className="loading-spinner"></span>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <p className="auth-footer">
        Remember your password?{' '}
        <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}


