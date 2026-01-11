'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier, type Organization } from '@/lib/types/database';
import { Target, Building2, Check, X, Globe, IndianRupee } from 'lucide-react';
import '../globals.css';

const tiers: { id: SubscriptionTier; name: string; description: string; popular?: boolean }[] = [
  { id: 'free', name: 'Free', description: 'Get started with basic features' },
  { id: 'payg', name: 'Pay-as-You-Go', description: 'Flexible credit-based usage' },
  { id: 'individual', name: 'Individual', description: 'For solo professionals' },
  { id: 'team', name: 'Team', description: 'For growing teams', popular: true },
  { id: 'enterprise', name: 'Enterprise', description: 'For large organizations' },
];

// Annual billing discount (20% off)
const ANNUAL_DISCOUNT = 0.20;

export default function PricingPage() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  
  // Enterprise modal state
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    companySize: '',
    industry: '',
    estimatedMonthlyCalls: '',
    requirements: '',
  });
  const [submittingEnterprise, setSubmittingEnterprise] = useState(false);
  const [enterpriseMessage, setEnterpriseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        // Use API route to bypass RLS issues
        try {
          const response = await fetch('/api/organization/me');
          const data = await response.json();

          if (response.ok && data.organization) {
            setCurrentTier(data.organization.subscription_tier);
          }
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      }

      // Detect country for currency
      try {
        const res = await fetch('https://ipapi.co/country/');
        const country = await res.text();
        if (country !== 'IN') {
          setCurrency('USD');
        }
      } catch {
        // Default to INR
      }
    }

    checkAuth();
  }, [supabase]);

  const formatPrice = (tier: SubscriptionTier, showOriginal = false) => {
    if (tier === 'payg') {
      // Base price per credit (from 10-credit package)
      return currency === 'INR' ? '₹5/credit' : '$0.06/credit';
    }
    const basePrice = SUBSCRIPTION_LIMITS[tier].price[currency];
    if (basePrice === 0) return 'Free';
    
    if (billingInterval === 'annual' && tier !== 'free') {
      const discountedMonthly = Math.round(basePrice * (1 - ANNUAL_DISCOUNT));
      const symbol = currency === 'INR' ? '₹' : '$';
      if (showOriginal) {
        return `${symbol}${basePrice}`;
      }
      return `${symbol}${discountedMonthly}`;
    }
    
    if (currency === 'INR') return `₹${basePrice}`;
    return `$${basePrice}`;
  };
  
  const getAnnualTotal = (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === 'payg') return null;
    const basePrice = SUBSCRIPTION_LIMITS[tier].price[currency];
    const discountedMonthly = Math.round(basePrice * (1 - ANNUAL_DISCOUNT));
    const annualTotal = discountedMonthly * 12;
    const savings = (basePrice * 12) - annualTotal;
    const symbol = currency === 'INR' ? '₹' : '$';
    return { total: `${symbol}${annualTotal}`, savings: `${symbol}${savings}` };
  };
  
  const getCreditPrice = () => {
    // Base price per credit (from 10-credit package)
    return currency === 'INR' ? 5 : 0.06;
  };

  // Load Razorpay script once on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (!isLoggedIn) {
      window.location.href = '/signup';
      return;
    }

    if (tier === 'free') {
      alert('You are already on the Free tier.');
      return;
    }

    // For pay-as-you-go, redirect to credits page
    if (tier === 'payg') {
      window.location.href = '/credits';
      return;
    }

    // For enterprise, show enterprise lead form
    if (tier === 'enterprise') {
      setShowEnterpriseModal(true);
      return;
    }

    // For subscription tiers (individual, team), initiate payment
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to subscribe');
        return;
      }

      // Ensure organization exists
      const ensureResponse = await fetch('/api/organization/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const ensureData = await ensureResponse.json();

      if (!ensureData.success) {
        alert(ensureData.error || 'Failed to set up your account. Please contact support.');
        return;
      }

      const basePrice = SUBSCRIPTION_LIMITS[tier].price[currency];
      const price = billingInterval === 'annual' 
        ? Math.round(basePrice * (1 - ANNUAL_DISCOUNT)) * 12 // Annual total
        : basePrice; // Monthly
      
      // Create subscription order
      const orderResponse = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier,
          currency: currency,
          billingInterval: billingInterval,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success || !orderData.orderId) {
        const errorMsg = orderData.error || orderData.details || 'Failed to create payment order. Please try again.';
        alert(errorMsg);
        console.error('Subscription order creation failed:', orderData);
        return;
      }

      // Wait for Razorpay script to load
      const loadRazorpay = (): Promise<any> => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) {
            resolve((window as any).Razorpay);
            return;
          }
          
          // Try to load the script if not already loading
          const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
          if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onerror = () => {
              clearInterval(checkInterval);
              resolve(null);
            };
            document.body.appendChild(script);
          }
          
          const checkInterval = setInterval(() => {
            if ((window as any).Razorpay) {
              clearInterval(checkInterval);
              resolve((window as any).Razorpay);
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(null);
          }, 10000);
        });
      };

      const RazorpayClass = await loadRazorpay();
      if (!RazorpayClass) {
        alert('Payment gateway failed to load. Please check your internet connection and try again.');
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Audiolyse',
        description: `Subscribe to ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/payments/verify-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tier: tier,
              amount: price,
              currency: currency,
              billingInterval: billingInterval,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            alert(`Success! Your ${tier} subscription has been activated. A receipt has been sent to your email.`);
            // Reload page to refresh subscription status
            window.location.reload();
          } else {
            alert(verifyData.error || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
        },
        theme: {
          color: '#00d9ff',
        },
        modal: {
          ondismiss: function() {
            // User closed the modal
          },
        },
      };

      const razorpay = new RazorpayClass(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating subscription:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEnterprise(true);
    setEnterpriseMessage(null);

    try {
      const response = await fetch('/api/enterprise/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: enterpriseForm.companyName,
          contactName: enterpriseForm.contactName,
          email: enterpriseForm.email,
          phone: enterpriseForm.phone,
          companySize: enterpriseForm.companySize,
          industry: enterpriseForm.industry,
          estimatedMonthlyCalls: enterpriseForm.estimatedMonthlyCalls ? parseInt(enterpriseForm.estimatedMonthlyCalls) : undefined,
          requirements: enterpriseForm.requirements,
          source: 'pricing_page',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEnterpriseMessage({ type: 'success', text: data.message });
        // Reset form after 3 seconds
        setTimeout(() => {
          setShowEnterpriseModal(false);
          setEnterpriseForm({
            companyName: '',
            contactName: '',
            email: '',
            phone: '',
            companySize: '',
            industry: '',
            estimatedMonthlyCalls: '',
            requirements: '',
          });
          setEnterpriseMessage(null);
        }, 3000);
      } else {
        setEnterpriseMessage({ type: 'error', text: data.error || 'Failed to submit. Please try again.' });
      }
    } catch (error) {
      setEnterpriseMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmittingEnterprise(false);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="back-link">← Back</Link>
        <div className="pricing-brand">
          <span className="brand-icon"><Target size={28} /></span>
          <span>Audiolyse</span>
        </div>
      </div>

      <div className="pricing-hero">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your needs</p>
        
        <div className="pricing-toggles">
          <div className="currency-toggle">
            <button className={currency === 'INR' ? 'active' : ''} onClick={() => setCurrency('INR')}><IndianRupee size={16} /> INR</button>
            <button className={currency === 'USD' ? 'active' : ''} onClick={() => setCurrency('USD')}><Globe size={16} /> USD</button>
          </div>
          
          <div className="billing-toggle">
            <button 
              className={billingInterval === 'monthly' ? 'active' : ''} 
              onClick={() => setBillingInterval('monthly')}
            >
              Monthly
            </button>
            <button 
              className={billingInterval === 'annual' ? 'active' : ''} 
              onClick={() => setBillingInterval('annual')}
            >
              Annual
              <span className="discount-badge">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pricing-grid">
        {tiers.map((tier) => {
          const limits = SUBSCRIPTION_LIMITS[tier.id];
          const isCurrentPlan = currentTier === tier.id;
          
          return (
            <div key={tier.id} className={`pricing-card ${tier.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}>
              {tier.popular && <span className="popular-badge">Most Popular</span>}
              {isCurrentPlan && <span className="current-badge">Current Plan</span>}
              
              <h3>{tier.name}</h3>
              <p className="tier-description">{tier.description}</p>
              
              <div className="tier-price">
                {billingInterval === 'annual' && tier.id !== 'free' && tier.id !== 'payg' && (
                  <span className="original-price">{formatPrice(tier.id, true)}</span>
                )}
                <span className="price">{formatPrice(tier.id)}</span>
                {tier.id === 'payg' && <span className="period"> (1 credit = 1 call)</span>}
                {tier.id !== 'free' && tier.id !== 'payg' && <span className="period">/month</span>}
                {billingInterval === 'annual' && tier.id !== 'free' && tier.id !== 'payg' && (
                  <div className="annual-info">
                    <span className="annual-total">Billed {getAnnualTotal(tier.id)?.total}/year</span>
                    <span className="annual-savings">Save {getAnnualTotal(tier.id)?.savings}/year</span>
                  </div>
                )}
              </div>

              <ul className="tier-features">
                {tier.id === 'payg' ? (
                  <>
                    <li><span className="check">✓</span><span>Pay per call - No monthly commitment</span></li>
                    <li><span className="check">✓</span><span>1 credit per call analysis</span></li>
                    <li><span className="check">✓</span><span>Credits never expire</span></li>
                    <li><span className="check">✓</span><span>Buy credits in bulk for discounts</span></li>
                  </>
                ) : (
                  <li><span className="check">✓</span><span>{limits.calls} calls/{tier.id === 'free' ? 'day' : 'month'}</span></li>
                )}
                <li><span className="check">✓</span><span>{limits.users === 999 ? 'Unlimited' : limits.users} user{limits.users > 1 ? 's' : ''}</span></li>
                <li><span className="check">✓</span><span>{limits.storageMb >= 1000 ? `${limits.storageMb / 1000}GB` : `${limits.storageMb}MB`} storage</span></li>
                <li><span className="check">✓</span><span>{limits.historyDays} days history</span></li>
                <li className={limits.features.bulkUpload ? '' : 'disabled'}><span className={limits.features.bulkUpload ? 'check' : 'cross'}>{limits.features.bulkUpload ? '✓' : '✗'}</span><span>Bulk upload</span></li>
                <li className={limits.features.pdfExport ? '' : 'disabled'}><span className={limits.features.pdfExport ? 'check' : 'cross'}>{limits.features.pdfExport ? '✓' : '✗'}</span><span>PDF export</span></li>
                <li className={limits.features.teamManagement ? '' : 'disabled'}><span className={limits.features.teamManagement ? 'check' : 'cross'}>{limits.features.teamManagement ? '✓' : '✗'}</span><span>Team management</span></li>
                <li className={limits.features.apiAccess ? '' : 'disabled'}><span className={limits.features.apiAccess ? 'check' : 'cross'}>{limits.features.apiAccess ? '✓' : '✗'}</span><span>API access</span></li>
              </ul>

              <button className={`tier-cta ${tier.popular ? 'primary' : ''}`} onClick={() => handleSelectPlan(tier.id)} disabled={isCurrentPlan}>
                {isCurrentPlan ? 'Current Plan' : tier.id === 'free' ? 'Get Started' : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item"><h4>What happens if I exceed my call limit?</h4><p>You will need to upgrade or wait for the next billing cycle.</p></div>
          <div className="faq-item"><h4>Can I downgrade my plan?</h4><p>Yes, changes take effect at the next billing cycle.</p></div>
          <div className="faq-item"><h4>Is there a free trial?</h4><p>The Free tier gives you 10 calls/day to try core features.</p></div>
          <div className="faq-item"><h4>How does Pay-as-You-Go work?</h4><p>Buy credits and use them as needed. Each call analysis costs 1 credit. Credits never expire.</p></div>
          <div className="faq-item"><h4>What payment methods do you accept?</h4><p>Credit/debit cards, UPI, and net banking for India.</p></div>
        </div>
      </div>

      <footer className="pricing-footer">
        <p>© 2024 Audiolyse. All rights reserved.</p>
      </footer>

      {/* Enterprise Lead Modal */}
      {showEnterpriseModal && (
        <div className="modal-overlay" onClick={() => !submittingEnterprise && setShowEnterpriseModal(false)}>
          <div className="modal-content enterprise-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowEnterpriseModal(false)}
              disabled={submittingEnterprise}
            >
              ×
            </button>
            
            <div className="enterprise-header">
              <span className="enterprise-icon"><Building2 size={48} /></span>
              <h2>Enterprise Plan Inquiry</h2>
              <p>Tell us about your needs and we&apos;ll create a custom plan for you.</p>
            </div>

            {enterpriseMessage && (
              <div className={`enterprise-message ${enterpriseMessage.type}`}>
                {enterpriseMessage.type === 'success' && '✓ '}
                {enterpriseMessage.text}
              </div>
            )}

            <form onSubmit={handleEnterpriseSubmit} className="enterprise-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input 
                    type="text" 
                    value={enterpriseForm.companyName}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, companyName: e.target.value })}
                    placeholder="Acme Inc."
                    required
                    disabled={submittingEnterprise}
                  />
                </div>
                <div className="form-group">
                  <label>Your Name *</label>
                  <input 
                    type="text" 
                    value={enterpriseForm.contactName}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, contactName: e.target.value })}
                    placeholder="John Doe"
                    required
                    disabled={submittingEnterprise}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Work Email *</label>
                  <input 
                    type="email" 
                    value={enterpriseForm.email}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
                    placeholder="john@company.com"
                    required
                    disabled={submittingEnterprise}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={enterpriseForm.phone}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    disabled={submittingEnterprise}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company Size *</label>
                  <select 
                    value={enterpriseForm.companySize}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, companySize: e.target.value })}
                    required
                    disabled={submittingEnterprise}
                  >
                    <option value="">Select size...</option>
                    <option value="10-50">10-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <select 
                    value={enterpriseForm.industry}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, industry: e.target.value })}
                    disabled={submittingEnterprise}
                  >
                    <option value="">Select industry...</option>
                    <option value="Healthcare">Healthcare / Medical</option>
                    <option value="Finance">Finance / Banking</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="SaaS">SaaS / Technology</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Education">Education</option>
                    <option value="Travel">Travel / Hospitality</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Estimated Monthly Call Volume</label>
                <input 
                  type="number" 
                  value={enterpriseForm.estimatedMonthlyCalls}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, estimatedMonthlyCalls: e.target.value })}
                  placeholder="e.g., 5000"
                  disabled={submittingEnterprise}
                />
              </div>

              <div className="form-group">
                <label>Tell us about your requirements</label>
                <textarea 
                  value={enterpriseForm.requirements}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, requirements: e.target.value })}
                  placeholder="What features are most important to you? Any specific compliance needs (HIPAA, etc.)?"
                  rows={4}
                  disabled={submittingEnterprise}
                />
              </div>

              <button 
                type="submit" 
                className="enterprise-submit"
                disabled={submittingEnterprise}
              >
                {submittingEnterprise ? 'Submitting...' : 'Request Enterprise Quote'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .enterprise-modal {
          max-width: 600px;
          padding: 32px;
        }
        .enterprise-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .enterprise-icon {
          font-size: 48px;
        }
        .enterprise-header h2 {
          margin: 12px 0 8px 0;
          color: var(--text, #fff);
        }
        .enterprise-header p {
          color: var(--text-muted, #888);
          margin: 0;
        }
        .enterprise-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .enterprise-message.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        .enterprise-message.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .enterprise-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted, #888);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text, #fff);
          font-size: 14px;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent, #00d9ff);
        }
        .form-group select {
          cursor: pointer;
        }
        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }
        .enterprise-submit {
          margin-top: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #00d9ff, #8b5cf6);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .enterprise-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .enterprise-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
