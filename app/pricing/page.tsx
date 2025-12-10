'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier, type Organization } from '@/lib/types/database';
import '../globals.css';

const tiers: { id: SubscriptionTier; name: string; description: string; popular?: boolean }[] = [
  { id: 'free', name: 'Free', description: 'Get started with basic features' },
  { id: 'payg', name: 'Pay-as-You-Go', description: 'Flexible credit-based usage' },
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
    if (tier === 'payg') {
      return currency === 'INR' ? '₹5/credit' : '$0.06/credit';
    }
    const price = SUBSCRIPTION_LIMITS[tier].price[currency];
    if (price === 0) return 'Free';
    if (currency === 'INR') return `₹${price}`;
    return `$${price}`;
  };
  
  const getCreditPrice = () => {
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

    // For enterprise, show contact message
    if (tier === 'enterprise') {
      alert('For Enterprise plans, please contact our sales team at sales@audiolyse.com or visit /contact');
      return;
    }

    // For subscription tiers (individual, team), initiate payment
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to subscribe');
        return;
      }

      const price = SUBSCRIPTION_LIMITS[tier].price[currency];
      
      // Create subscription order
      const orderResponse = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier,
          currency: currency,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success || !orderData.orderId) {
        alert(orderData.error || 'Failed to create payment order. Please try again.');
        return;
      }

      // Wait for Razorpay script to load
      const loadRazorpay = (): Promise<any> => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) {
            resolve((window as any).Razorpay);
            return;
          }
          const checkInterval = setInterval(() => {
            if ((window as any).Razorpay) {
              clearInterval(checkInterval);
              resolve((window as any).Razorpay);
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(null);
          }, 5000);
        });
      };

      const RazorpayClass = await loadRazorpay();
      if (!RazorpayClass) {
        alert('Payment gateway failed to load. Please refresh the page and try again.');
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

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="back-link">← Back</Link>
        <div className="pricing-brand">
          <span className="brand-icon">🎯</span>
          <span>Audiolyse</span>
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
                {tier.id === 'payg' && <span className="period"> (1 credit = 1 call)</span>}
                {tier.id !== 'free' && tier.id !== 'payg' && <span className="period">/month</span>}
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
    </div>
  );
}
