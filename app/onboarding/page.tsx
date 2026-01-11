'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import '@/app/styles/auth.css';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [industry, setIndustry] = useState('');
  const [role, setRole] = useState('');
  const [orgName, setOrgName] = useState('');
  const [teamSize, setTeamSize] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      
      // First, ensure organization exists (creates one if needed)
      try {
        const ensureRes = await fetch('/api/organization/ensure', { method: 'POST' });
        const ensureData = await ensureRes.json();
        
        if (ensureRes.ok && ensureData.organization) {
          setOrgId(ensureData.organization.id);
          setOrgName(ensureData.organization.name || '');
          
          // If onboarding already completed, redirect to dashboard
          if (ensureData.organization.onboarding_completed) {
            router.push('/dashboard');
            return;
          }
          
          // If this was not a new org, check if user is owner
          if (!ensureData.created && ensureData.organization.owner_id !== user.id) {
            // Invited user - skip onboarding
            router.push('/dashboard');
            return;
          }
          
          setInitialLoading(false);
          return; // Organization is ready, stay on onboarding
        }
      } catch (error) {
        console.error('Error ensuring organization:', error);
        setError('Failed to set up your workspace. Please refresh the page.');
      }
      
      // Fallback: check membership directly
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership?.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, onboarding_completed, owner_id')
          .eq('id', membership.organization_id)
          .single();

        if (orgData) {
          setOrgId(orgData.id);
          setOrgName(orgData.name);
          
          if (orgData.onboarding_completed || orgData.owner_id !== user.id) {
            router.push('/dashboard');
            return;
          }
        }
      }
      
      setInitialLoading(false);
    }
    checkUser();
  }, [router, supabase]);

  const handleComplete = async () => {
    if (!userId) {
      setError('User session not found. Please log in again.');
      return;
    }
    if (!orgId) {
      setError('Organization not found. Please refresh the page.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Update Organization
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          industry,
          name: orgName,
          onboarding_completed: true,
        })
        .eq('id', orgId);

      if (orgError) {
        console.error('Org update error:', orgError);
        throw new Error(orgError.message || 'Failed to update organization');
      }

      // Update Profile Role/Title
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          job_title: role
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't throw - profile update is not critical
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="auth-page-v2 onboarding-page">
        <div className="auth-card-v2" style={{ maxWidth: '600px', textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <Logo size="lg" />
          </div>
          <div className="spinner-sm" style={{ width: '32px', height: '32px', margin: '0 auto 16px', borderWidth: '3px', borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--main-text-muted)' }}>Setting up your workspace...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .onboarding-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page-v2 onboarding-page">
      <div className="auth-card-v2" style={{ maxWidth: '600px' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <Logo size="lg" />
          </div>
          <h1 className="auth-card-title">Welcome to Audiolyse</h1>
          <p className="auth-card-subtitle">Let&apos;s set up your workspace for success</p>
        </div>

        {error && (
          <div className="auth-message error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div className="onboarding-steps">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {step === 1 && (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input
                type="text"
                className="auth-input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select 
                className="auth-input"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Select your industry</option>
                <option value="Medical">Medical / Healthcare</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Tech">Technology / SaaS</option>
                <option value="Finance">Finance / Insurance</option>
                <option value="Retail">Retail / E-commerce</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button 
              className="auth-btn-primary" 
              onClick={() => setStep(2)}
              disabled={!industry || !orgName}
            >
              Next Step →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Your Role</label>
              <input
                type="text"
                className="auth-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Sales Manager, CEO, Agent"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Team Size</label>
              <select
                className="auth-input"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              >
                <option value="">Select team size</option>
                <option value="1-5">1-5 employees</option>
                <option value="6-20">6-20 employees</option>
                <option value="21-50">21-50 employees</option>
                <option value="50+">50+ employees</option>
              </select>
            </div>
            
            <div className="button-group" style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="auth-btn-secondary" 
                onClick={() => setStep(1)}
                style={{ flex: 1 }}
              >
                ← Back
              </button>
              <button 
                className="auth-btn-primary" 
                onClick={handleComplete}
                disabled={loading || !role || !teamSize}
                style={{ flex: 2 }}
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .onboarding-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .onboarding-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--item-bg);
          color: var(--main-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 1px solid var(--border-color);
          font-size: 14px;
        }
        .step-dot.active {
          background: var(--accent);
          color: #00120f;
          border-color: var(--accent);
          box-shadow: 0 0 15px var(--accent-light);
        }
        .step-line {
          width: 60px;
          height: 2px;
          background: var(--border-color);
          margin: 0 12px;
        }
      `}</style>
    </div>
  );
}
