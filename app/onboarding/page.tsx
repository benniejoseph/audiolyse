'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import '@/app/styles/auth.css'; // Reusing auth styles for consistency

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

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
      
      // First check if user is a member of any organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership?.organization_id) {
        // User is part of an org, get org details
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, onboarding_completed, owner_id')
          .eq('id', membership.organization_id)
          .single();

        if (orgData) {
          setOrgId(orgData.id);
          setOrgName(orgData.name);
          
          // If onboarding completed OR user is not owner (invited user), redirect to dashboard
          if (orgData.onboarding_completed || orgData.owner_id !== user.id) {
            router.push('/dashboard');
            return;
          }
        }
      } else {
        // No membership - check if they own an org (legacy support)
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, onboarding_completed')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (orgData) {
          setOrgId(orgData.id);
          setOrgName(orgData.name);
          if (orgData.onboarding_completed) {
            router.push('/dashboard');
          }
        }
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleComplete = async () => {
    if (!userId || !orgId) return;
    setLoading(true);

    try {
      // Update Organization
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          industry,
          name: orgName,
          onboarding_completed: true,
          // We could store teamSize in metadata or new column if needed, skipping for now
        })
        .eq('id', orgId);

      if (orgError) throw orgError;

      // Update Profile Role/Title
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          job_title: role
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-v2 onboarding-page">
      <div className="auth-card-v2" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <h1>Welcome to Audiolyse</h1>
          <p>Let&apos;s set up your workspace for success</p>
        </div>

        <div className="onboarding-steps">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {step === 1 && (
          <div className="auth-form">
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                className="auth-input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="form-group">
              <label>Industry</label>
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
              <label>Your Role</label>
              <input
                type="text"
                className="auth-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Sales Manager, CEO, Agent"
              />
            </div>
            <div className="form-group">
              <label>Team Size</label>
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
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 1px solid var(--border);
        }
        .step-dot.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        .step-line {
          width: 50px;
          height: 2px;
          background: var(--border);
          margin: 0 10px;
        }
      `}</style>
    </div>
  );
}
