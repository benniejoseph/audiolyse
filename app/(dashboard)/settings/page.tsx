'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Organization, AISettings, IndustryType } from '@/lib/types/database';
import { SUBSCRIPTION_LIMITS } from '@/lib/types/database';
import { getAvailableIndustries } from '@/lib/ai/industry-prompts';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'ai_context' | 'billing' | 'security' | 'privacy'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // AI Context States
  const [aiContext, setAiContext] = useState('');
  const [products, setProducts] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [complianceScripts, setComplianceScripts] = useState('');
  const [customTerminology, setCustomTerminology] = useState('');
  const [industry, setIndustry] = useState<IndustryType>('general');
  const [scoringStrictness, setScoringStrictness] = useState<'lenient' | 'moderate' | 'strict'>('strict');
  const [focusAreas, setFocusAreas] = useState('');
  const [typicalProfiles, setTypicalProfiles] = useState('');
  const [commonIssues, setCommonIssues] = useState('');
  const [preferredTone, setPreferredTone] = useState<'formal' | 'friendly' | 'professional'>('professional');
  const [greetingScript, setGreetingScript] = useState('');
  const [closingScript, setClosingScript] = useState('');
  const [aiSettingsExpanded, setAiSettingsExpanded] = useState<string | null>('basic');

  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || '');
          setPhone(profileData.phone || '');
        }

        // Get organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          const { data: organization } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .single();

          if (organization) {
            setOrg(organization);
            setOrgName(organization.name);
            setIndustry((organization.industry as IndustryType) || 'general');
            
            // Load AI Settings if they exist
            if (organization.ai_settings) {
              const settings = organization.ai_settings as AISettings;
              setAiContext(settings.context || '');
              setProducts(Array.isArray(settings.products) ? settings.products.join('\n') : '');
              setCompetitors(Array.isArray(settings.competitors) ? settings.competitors.join('\n') : '');
              setGuidelines(settings.guidelines || '');
              setComplianceScripts(Array.isArray(settings.complianceScripts) ? settings.complianceScripts.join('\n') : '');
              setCustomTerminology(Array.isArray(settings.customTerminology) ? settings.customTerminology.join('\n') : '');
              
              // Scoring preferences
              if (settings.scoringPreferences) {
                setScoringStrictness(settings.scoringPreferences.strictness || 'strict');
                setFocusAreas(Array.isArray(settings.scoringPreferences.focusAreas) ? settings.scoringPreferences.focusAreas.join('\n') : '');
              }
              
              // Customer context
              if (settings.customerContext) {
                setTypicalProfiles(Array.isArray(settings.customerContext.typicalProfiles) ? settings.customerContext.typicalProfiles.join('\n') : '');
                setCommonIssues(Array.isArray(settings.customerContext.commonIssues) ? settings.customerContext.commonIssues.join('\n') : '');
                setPreferredTone(settings.customerContext.preferredTone || 'professional');
              }
              
              // Call handling
              if (settings.callHandling) {
                setGreetingScript(settings.callHandling.greetingScript || '');
                setClosingScript(settings.callHandling.closingScript || '');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: fullName, phone });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!org) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName })
        .eq('id', org.id);

      if (error) throw error;

      setOrg({ ...org, name: orgName });
      setMessage({ type: 'success', text: 'Organization updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAiSettings = async () => {
    if (!org) return;
    setSaving(true);
    setMessage(null);

    try {
      const aiSettings: AISettings = {
        context: aiContext,
        products: products.split('\n').filter(p => p.trim()),
        competitors: competitors.split('\n').filter(c => c.trim()),
        guidelines: guidelines,
        complianceScripts: complianceScripts.split('\n').filter(s => s.trim()),
        customTerminology: customTerminology.split('\n').filter(t => t.trim()),
        scoringPreferences: {
          strictness: scoringStrictness,
          focusAreas: focusAreas.split('\n').filter(f => f.trim()),
        },
        customerContext: {
          typicalProfiles: typicalProfiles.split('\n').filter(p => p.trim()),
          commonIssues: commonIssues.split('\n').filter(i => i.trim()),
          preferredTone: preferredTone,
        },
        callHandling: {
          greetingScript: greetingScript,
          closingScript: closingScript,
        },
      };

      const { error } = await supabase
        .from('organizations')
        .update({ 
          ai_settings: aiSettings,
          industry: industry,
        })
        .eq('id', org.id);

      if (error) throw error;

      setOrg({ ...org, ai_settings: aiSettings as unknown as typeof org.ai_settings, industry: industry });
      setMessage({ type: 'success', text: 'AI Context updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to delete account');
      }

      // Sign out and redirect to home
      await supabase.auth.signOut();
      router.push('/?deleted=true');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/account/export', {
        method: 'GET',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export data');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audiolyse-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Your data has been exported successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const tierLimits = org ? SUBSCRIPTION_LIMITS[org.subscription_tier] : null;

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loader"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
        <button className={activeTab === 'organization' ? 'active' : ''} onClick={() => setActiveTab('organization')}>Organization</button>
        <button className={activeTab === 'ai_context' ? 'active' : ''} onClick={() => setActiveTab('ai_context')}>AI Context</button>
        <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>Billing</button>
        <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}>Privacy & Data</button>
        <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>Security</button>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile?.email || ''} disabled />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select value={profile?.currency || 'INR'} disabled>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeTab === 'organization' && (
          <div className="settings-section">
            <h3>Organization Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Organization Name</label>
                <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Company name" />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input type="text" value={org?.slug || ''} disabled />
              </div>
            </div>
            {org?.industry && (
              <div className="form-group">
                <label>Industry</label>
                <input type="text" value={org.industry} disabled />
              </div>
            )}
            <button className="save-btn" onClick={handleSaveOrg} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <div className="usage-stats">
              <h4>Usage Statistics</h4>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-label">Calls Used</span>
                  <span className="stat-value">{org?.calls_used || 0} / {org?.calls_limit || 10}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Storage Used</span>
                  <span className="stat-value">{((org?.storage_used_mb || 0)).toFixed(1)} MB / {(org?.storage_limit_mb || 50)} MB</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Team Members</span>
                  <span className="stat-value">1 / {org?.users_limit || 1}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai_context' && (
          <div className="settings-section ai-settings-section">
            <h3>AI Analysis Context</h3>
            <p className="section-desc">Provide context to the AI to improve call analysis accuracy. The more detail you provide, the better the insights.</p>
            
            {/* Industry Selection */}
            <div className="ai-settings-card">
              <div 
                className="ai-settings-card-header"
                onClick={() => setAiSettingsExpanded(aiSettingsExpanded === 'industry' ? null : 'industry')}
              >
                <h4>🏢 Industry & Basic Context</h4>
                <span className="expand-icon">{aiSettingsExpanded === 'industry' ? '−' : '+'}</span>
              </div>
              {(aiSettingsExpanded === 'industry' || aiSettingsExpanded === 'basic') && (
                <div className="ai-settings-card-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Industry</label>
                      <select 
                        value={industry} 
                        onChange={(e) => setIndustry(e.target.value as IndustryType)}
                        className="ai-select"
                      >
                        {getAvailableIndustries().map(ind => (
                          <option key={ind.id} value={ind.id}>{ind.name}</option>
                        ))}
                      </select>
                      <span className="form-hint">Selecting the right industry enables specialized analysis criteria</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>General Context & Business Overview</label>
                    <textarea 
                      className="ai-textarea"
                      rows={4}
                      value={aiContext} 
                      onChange={(e) => setAiContext(e.target.value)} 
                      placeholder="Describe what your company does, your typical customer, and the main goal of your calls." 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Products & Competitors */}
            <div className="ai-settings-card">
              <div 
                className="ai-settings-card-header"
                onClick={() => setAiSettingsExpanded(aiSettingsExpanded === 'products' ? null : 'products')}
              >
                <h4>📦 Products & Competitors</h4>
                <span className="expand-icon">{aiSettingsExpanded === 'products' ? '−' : '+'}</span>
              </div>
              {aiSettingsExpanded === 'products' && (
                <div className="ai-settings-card-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Products / Services (One per line)</label>
                      <textarea 
                        className="ai-textarea"
                        rows={6}
                        value={products} 
                        onChange={(e) => setProducts(e.target.value)} 
                        placeholder="Product A - $100&#10;Service B - $50/mo&#10;Premium Package - $200/mo" 
                      />
                      <span className="form-hint">AI will evaluate if agents mention appropriate products</span>
                    </div>
                    <div className="form-group">
                      <label>Competitors (One per line)</label>
                      <textarea 
                        className="ai-textarea"
                        rows={6}
                        value={competitors} 
                        onChange={(e) => setCompetitors(e.target.value)} 
                        placeholder="Competitor X&#10;Competitor Y&#10;Market Leader Z" 
                      />
                      <span className="form-hint">AI will note when competitors are mentioned</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compliance & Guidelines */}
            <div className="ai-settings-card">
              <div 
                className="ai-settings-card-header"
                onClick={() => setAiSettingsExpanded(aiSettingsExpanded === 'compliance' ? null : 'compliance')}
              >
                <h4>📋 Compliance & Guidelines</h4>
                <span className="expand-icon">{aiSettingsExpanded === 'compliance' ? '−' : '+'}</span>
              </div>
              {aiSettingsExpanded === 'compliance' && (
                <div className="ai-settings-card-content">
                  <div className="form-group">
                    <label>Compliance Scripts / Required Disclosures (One per line)</label>
                    <textarea 
                      className="ai-textarea"
                      rows={5}
                      value={complianceScripts} 
                      onChange={(e) => setComplianceScripts(e.target.value)} 
                      placeholder="Must verify patient identity before sharing PHI&#10;Must disclose call recording&#10;Must read pricing disclaimer" 
                    />
                    <span className="form-hint">AI will check if these compliance requirements were met</span>
                  </div>
                  
                  <div className="form-group">
                    <label>Specific Guidelines / Playbook</label>
                    <textarea 
                      className="ai-textarea"
                      rows={5}
                      value={guidelines} 
                      onChange={(e) => setGuidelines(e.target.value)} 
                      placeholder="Always ask for budget in the first 5 mins&#10;Never offer discounts above 10% without approval&#10;Always schedule follow-up before ending call" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scoring Preferences */}
            <div className="ai-settings-card">
              <div 
                className="ai-settings-card-header"
                onClick={() => setAiSettingsExpanded(aiSettingsExpanded === 'scoring' ? null : 'scoring')}
              >
                <h4>📊 Scoring Preferences</h4>
                <span className="expand-icon">{aiSettingsExpanded === 'scoring' ? '−' : '+'}</span>
              </div>
              {aiSettingsExpanded === 'scoring' && (
                <div className="ai-settings-card-content">
                  <div className="form-group">
                    <label>Scoring Strictness</label>
                    <div className="radio-group">
                      <label className={`radio-option ${scoringStrictness === 'lenient' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="strictness" 
                          value="lenient"
                          checked={scoringStrictness === 'lenient'}
                          onChange={() => setScoringStrictness('lenient')}
                        />
                        <span className="radio-label">
                          <strong>Lenient</strong>
                          <small>Average calls score 70-80. Good for new teams.</small>
                        </span>
                      </label>
                      <label className={`radio-option ${scoringStrictness === 'moderate' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="strictness" 
                          value="moderate"
                          checked={scoringStrictness === 'moderate'}
                          onChange={() => setScoringStrictness('moderate')}
                        />
                        <span className="radio-label">
                          <strong>Moderate</strong>
                          <small>Average calls score 65-75. Balanced evaluation.</small>
                        </span>
                      </label>
                      <label className={`radio-option ${scoringStrictness === 'strict' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="strictness" 
                          value="strict"
                          checked={scoringStrictness === 'strict'}
                          onChange={() => setScoringStrictness('strict')}
                        />
                        <span className="radio-label">
                          <strong>Strict</strong>
                          <small>Average calls score 60-70. High standards.</small>
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Priority Focus Areas (One per line)</label>
                    <textarea 
                      className="ai-textarea"
                      rows={4}
                      value={focusAreas} 
                      onChange={(e) => setFocusAreas(e.target.value)} 
                      placeholder="Empathy and rapport building&#10;Clear explanation of pricing&#10;Follow-up commitment" 
                    />
                    <span className="form-hint">AI will prioritize these areas in evaluation</span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Context */}
            <div className="ai-settings-card">
              <div 
                className="ai-settings-card-header"
                onClick={() => setAiSettingsExpanded(aiSettingsExpanded === 'customer' ? null : 'customer')}
              >
                <h4>👥 Customer Context</h4>
                <span className="expand-icon">{aiSettingsExpanded === 'customer' ? '−' : '+'}</span>
              </div>
              {aiSettingsExpanded === 'customer' && (
                <div className="ai-settings-card-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Typical Customer Profiles (One per line)</label>
                      <textarea 
                        className="ai-textarea"
                        rows={4}
                        value={typicalProfiles} 
                        onChange={(e) => setTypicalProfiles(e.target.value)} 
                        placeholder="Elderly patients needing home care&#10;Small business owners&#10;IT decision makers" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Common Issues/Questions (One per line)</label>
                      <textarea 
                        className="ai-textarea"
                        rows={4}
                        value={commonIssues} 
                        onChange={(e) => setCommonIssues(e.target.value)} 
                        placeholder="Price concerns&#10;Service availability&#10;Insurance coverage" 
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Preferred Communication Tone</label>
                    <select 
                      value={preferredTone}
                      onChange={(e) => setPreferredTone(e.target.value as 'formal' | 'friendly' | 'professional')}
                      className="ai-select"
                    >
                      <option value="formal">Formal - Corporate, respectful</option>
                      <option value="professional">Professional - Balanced, courteous</option>
                      <option value="friendly">Friendly - Warm, personable</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Terminology */}
            <div className="ai-settings-card">
              <div 
                className="ai-settings-card-header"
                onClick={() => setAiSettingsExpanded(aiSettingsExpanded === 'terminology' ? null : 'terminology')}
              >
                <h4>📝 Custom Terminology</h4>
                <span className="expand-icon">{aiSettingsExpanded === 'terminology' ? '−' : '+'}</span>
              </div>
              {aiSettingsExpanded === 'terminology' && (
                <div className="ai-settings-card-content">
                  <div className="form-group">
                    <label>Company-Specific Terms (One per line)</label>
                    <textarea 
                      className="ai-textarea"
                      rows={5}
                      value={customTerminology} 
                      onChange={(e) => setCustomTerminology(e.target.value)} 
                      placeholder="CarePlus - Our premium service tier&#10;QuickStart - 24-hour setup program&#10;MediTrack - Patient monitoring system" 
                    />
                    <span className="form-hint">Help AI understand your company-specific terms and abbreviations</span>
                  </div>
                </div>
              )}
            </div>

            {/* Call Scripts */}
            <div className="ai-settings-card">
              <div 
                className="ai-settings-card-header"
                onClick={() => setAiSettingsExpanded(aiSettingsExpanded === 'scripts' ? null : 'scripts')}
              >
                <h4>📞 Call Scripts</h4>
                <span className="expand-icon">{aiSettingsExpanded === 'scripts' ? '−' : '+'}</span>
              </div>
              {aiSettingsExpanded === 'scripts' && (
                <div className="ai-settings-card-content">
                  <div className="form-group">
                    <label>Expected Greeting Script</label>
                    <textarea 
                      className="ai-textarea"
                      rows={3}
                      value={greetingScript} 
                      onChange={(e) => setGreetingScript(e.target.value)} 
                      placeholder="Good morning/afternoon, thank you for calling [Company]. This is [Name]. How may I assist you today?" 
                    />
                    <span className="form-hint">AI will check if agents follow this greeting pattern</span>
                  </div>
                  
                  <div className="form-group">
                    <label>Expected Closing Script</label>
                    <textarea 
                      className="ai-textarea"
                      rows={3}
                      value={closingScript} 
                      onChange={(e) => setClosingScript(e.target.value)} 
                      placeholder="Is there anything else I can help you with today? Thank you for choosing [Company]. Have a great day!" 
                    />
                    <span className="form-hint">AI will evaluate closing against this template</span>
                  </div>
                </div>
              )}
            </div>

            <button className="save-btn ai-save-btn" onClick={handleSaveAiSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="settings-section">
            <h3>Subscription & Billing</h3>
            <div className="current-plan">
              <div className="plan-info">
                <span className="plan-name">{org?.subscription_tier?.charAt(0).toUpperCase()}{org?.subscription_tier?.slice(1)} Plan</span>
                <span className={`plan-status status-${org?.subscription_status}`}>{org?.subscription_status}</span>
              </div>
              <p className="plan-price">
                {tierLimits?.price.INR === 0 ? 'Free' : `₹${tierLimits?.price.INR}/month`}
              </p>
              {org?.current_period_end && (
                <p className="plan-renewal">
                  Renews on {new Date(org.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="plan-features">
              <h4>Plan Features</h4>
              <ul>
                <li>✓ {tierLimits?.calls} calls/month</li>
                <li>✓ {tierLimits?.users === 999 ? 'Unlimited' : tierLimits?.users} users</li>
                <li>✓ {tierLimits?.historyDays} days history</li>
                <li>{tierLimits?.features.bulkUpload ? '✓' : '✗'} Bulk upload</li>
                <li>{tierLimits?.features.pdfExport ? '✓' : '✗'} PDF export</li>
                <li>{tierLimits?.features.teamManagement ? '✓' : '✗'} Team management</li>
              </ul>
            </div>

            <a href="/pricing" className="upgrade-plan-btn">
              {org?.subscription_tier === 'enterprise' ? 'View Plans' : 'Upgrade Plan'}
            </a>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="settings-section">
            <h3>Privacy & Data Management</h3>
            <p className="section-desc">
              Manage your personal data in compliance with DPDP Act, GDPR, and other privacy regulations.
            </p>

            <div className="privacy-card">
              <h4>📥 Export Your Data</h4>
              <p>Download all your personal data including profile information, call analyses, and settings.</p>
              <button className="save-btn" onClick={handleExportData} disabled={saving}>
                {saving ? 'Exporting...' : 'Download My Data'}
              </button>
            </div>

            <div className="privacy-card">
              <h4>📋 Data We Store</h4>
              <ul className="data-list">
                <li><strong>Profile:</strong> Name, email, phone, preferences</li>
                <li><strong>Organization:</strong> Company name, settings, AI context</li>
                <li><strong>Call Analyses:</strong> Transcripts, scores, coaching insights</li>
                <li><strong>Usage:</strong> Login history, feature usage</li>
              </ul>
            </div>

            <div className="privacy-card">
              <h4>🕐 Data Retention</h4>
              <p>Your data is retained based on your subscription tier:</p>
              <ul className="data-list">
                <li><strong>Free:</strong> 7 days</li>
                <li><strong>Individual:</strong> 30 days</li>
                <li><strong>Team:</strong> 90 days</li>
                <li><strong>Enterprise:</strong> 365 days</li>
              </ul>
              <p className="form-hint">Data is automatically deleted after the retention period unless you have active legal holds.</p>
            </div>

            <div className="privacy-card">
              <h4>📜 Your Rights</h4>
              <ul className="data-list">
                <li><strong>Access:</strong> Download all your data (above)</li>
                <li><strong>Rectification:</strong> Edit your profile in the Profile tab</li>
                <li><strong>Erasure:</strong> Delete your account in the Security tab</li>
                <li><strong>Portability:</strong> Export data in JSON format</li>
              </ul>
              <p className="form-hint">
                For questions about your data, contact us at <a href="mailto:privacy@audiolyse.com">privacy@audiolyse.com</a>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <h3>Change Password</h3>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <button className="save-btn" onClick={handleChangePassword} disabled={saving || !newPassword}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>

            <div className="danger-zone">
              <h4>⚠️ Danger Zone</h4>
              <p>Permanently delete your account and all data. This action cannot be undone.</p>
              <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => !deleting && setShowDeleteModal(false)}
              disabled={deleting}
            >
              ×
            </button>
            <div className="delete-warning-icon">⚠️</div>
            <h2>Delete Your Account?</h2>
            <p className="delete-warning-text">
              This action is <strong>permanent and irreversible</strong>. All your data will be deleted:
            </p>
            <ul className="delete-data-list">
              <li>✗ Your profile and personal information</li>
              <li>✗ All call analyses and transcripts</li>
              <li>✗ Organization memberships</li>
              <li>✗ Usage history and preferences</li>
            </ul>
            
            <div className="delete-confirm-input">
              <label>Type <strong>DELETE</strong> to confirm:</label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                disabled={deleting}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="modal-btn secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn danger" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
