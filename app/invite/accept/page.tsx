'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function validateInvitation() {
      if (!token) {
        setError('Invalid invitation link. No token provided.');
        setLoading(false);
        return;
      }

      try {
        // Check if user is logged in
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch the invitation
        const { data: inviteData, error: inviteError } = await supabase
          .from('invitations')
          .select(`
            *,
            organization:organizations (
              id,
              name,
              slug
            )
          `)
          .eq('token', token)
          .is('accepted_at', null)
          .single();

        if (inviteError || !inviteData) {
          setError('This invitation link is invalid or has already been used.');
          setLoading(false);
          return;
        }

        // Check if invitation has expired
        if (new Date(inviteData.expires_at) < new Date()) {
          setError('This invitation has expired. Please ask for a new invitation.');
          setLoading(false);
          return;
        }

        // Check if user email matches
        if (currentUser && currentUser.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
          setError(`This invitation was sent to ${inviteData.email}. Please log in with that email address.`);
          setLoading(false);
          return;
        }

        setInvitation(inviteData);
        setLoading(false);
      } catch (err) {
        console.error('Error validating invitation:', err);
        setError('An error occurred while validating the invitation.');
        setLoading(false);
      }
    }

    validateInvitation();
  }, [token, supabase]);

  const handleAccept = async () => {
    if (!invitation || !user) return;
    
    setAccepting(true);
    
    try {
      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', invitation.organization_id)
        .single();

      if (existingMembership) {
        setError('You are already a member of this organization.');
        setAccepting(false);
        return;
      }

      // Add user as organization member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by,
          invited_at: invitation.created_at,
        });

      if (memberError) {
        throw memberError;
      }

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      // Redirect to dashboard
      router.push('/dashboard?joined=true');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card loading">
          <div className="loader"></div>
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card error">
          <div className="error-icon">❌</div>
          <h2>Invitation Error</h2>
          <p>{error}</p>
          <Link href="/login" className="invite-btn">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-icon">📧</div>
          <h2>You&apos;re Invited!</h2>
          <p>
            You&apos;ve been invited to join <strong>{invitation?.organization?.name}</strong> on Audiolyse.
          </p>
          <p className="invite-info">
            Please sign up or log in with <strong>{invitation?.email}</strong> to accept this invitation.
          </p>
          <div className="invite-actions">
            <Link 
              href={`/signup?email=${encodeURIComponent(invitation?.email || '')}&invite=${token}`} 
              className="invite-btn primary"
            >
              Sign Up
            </Link>
            <Link 
              href={`/login?redirect=/invite/accept?token=${token}`} 
              className="invite-btn secondary"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-icon">🎉</div>
        <h2>Accept Invitation</h2>
        <p>
          You&apos;ve been invited to join <strong>{invitation?.organization?.name}</strong> as a{' '}
          <strong>{invitation?.role}</strong>.
        </p>
        
        <div className="invite-details">
          <div className="detail-row">
            <span className="label">Organization:</span>
            <span className="value">{invitation?.organization?.name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Your Role:</span>
            <span className="value">{invitation?.role?.charAt(0).toUpperCase() + invitation?.role?.slice(1)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Your Email:</span>
            <span className="value">{user.email}</span>
          </div>
        </div>

        <div className="invite-actions">
          <button 
            className="invite-btn primary" 
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? 'Joining...' : 'Accept & Join'}
          </button>
          <Link href="/dashboard" className="invite-btn secondary">
            Decline
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        .invite-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
          padding: 20px;
        }
        
        .invite-card {
          background: var(--card-bg, #1a1a2e);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 48px;
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        
        .invite-card.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .invite-icon, .error-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        
        .invite-card h2 {
          color: var(--text, #fff);
          margin: 0 0 16px 0;
          font-size: 28px;
        }
        
        .invite-card p {
          color: var(--text-muted, #888);
          margin: 0 0 16px 0;
          line-height: 1.6;
        }
        
        .invite-info {
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }
        
        .invite-details {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: left;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-row .label {
          color: var(--text-muted, #888);
        }
        
        .detail-row .value {
          color: var(--text, #fff);
          font-weight: 500;
        }
        
        .invite-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: center;
        }
        
        .invite-btn {
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        
        .invite-btn.primary {
          background: linear-gradient(135deg, #00d9ff, #8b5cf6);
          color: #fff;
        }
        
        .invite-btn.primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        
        .invite-btn.secondary {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text, #fff);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .invite-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .invite-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 217, 255, 0.2);
          border-top-color: #00d9ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Loading fallback for Suspense
function InviteLoadingFallback() {
  return (
    <div className="invite-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: '#1a1a2e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 217, 255, 0.2)',
          borderTopColor: '#00d9ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#888' }}>Loading invitation...</p>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<InviteLoadingFallback />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
