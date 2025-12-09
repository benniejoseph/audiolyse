'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier, type Organization } from '@/lib/types/database';
import '../globals.css';

const tiers: { id: SubscriptionTier; name: string; description: string; popular?: boolean }[] = [
  { id: 'free', name: 'Free', description: 'Get started with basic features' },
  { id: 'individual', name: 'Individual', description: 'For solo professionals' },
  { id: 'team', name: 'Team', description: 'For growing teams', popular: true },
  { id: 'enterprise', name: 'Enterprise', description: 'For large organizations' },
];

export default function PricingPage() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          const { data: organization } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .single();

          if (organization) {
            setCurrentTier(organization.subscription_tier);
          }
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

  const formatPrice = (tier: SubscriptionTier) => {
    const price = SUBSCRIPTION_LIMITS[tier].price[currency];
    if (price === 0) return 'Free';
    if (currency === 'INR') return `₹${price}`;
    return `$${price}`;
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (!isLoggedIn) {
      window.location.href = '/signup';
      return;
    }

    if (tier === 'free') {
      alert('You are already on the Free tier.');
      return;
    }

    alert(`Payment gateway coming soon! You selected the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan at ${formatPrice(tier)}/month.`);
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="back-link">← Back</Link>
        <div className="pricing-brand">
          <span className="brand-icon">🎧</span>
          <span>CallTranscribe</span>
        </div>
      </div>

      <div className="pricing-hero">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your needs</p>
        
        <div className="currency-toggle">
          <button className={currency === 'INR' ? 'active' : ''} onClick={() => setCurrency('INR')}>🇮🇳 INR</button>
          <button className={currency === 'USD' ? 'active' : ''} onClick={() => setCurrency('USD')}>🌍 USD</button>
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
                <span className="price">{formatPrice(tier.id)}</span>
                {tier.id !== 'free' && <span className="period">/month</span>}
              </div>

              <ul className="tier-features">
                <li><span className="check">✓</span><span>{limits.calls} calls/month</span></li>
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
          <div className="faq-item"><h4>Is there a free trial?</h4><p>The Free tier gives you 3 calls/month to try core features.</p></div>
          <div className="faq-item"><h4>What payment methods do you accept?</h4><p>Credit/debit cards, UPI, and net banking for India.</p></div>
        </div>
      </div>

      <footer className="pricing-footer">
        <p>© 2024 CallTranscribe. All rights reserved.</p>
      </footer>
    </div>
  );
}
