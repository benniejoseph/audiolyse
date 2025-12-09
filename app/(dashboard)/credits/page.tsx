'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Organization } from '@/lib/types/database';
import '@/app/globals.css';
import '@/app/styles/credits.css';

const CREDIT_PACKAGES = [
  { credits: 10, priceINR: 50, priceUSD: 0.60, popular: false },
  { credits: 25, priceINR: 120, priceUSD: 1.44, popular: false },
  { credits: 50, priceINR: 225, priceUSD: 2.70, popular: true, discount: '10% off' },
  { credits: 100, priceINR: 400, priceUSD: 4.80, popular: false, discount: '20% off' },
  { credits: 250, priceINR: 900, priceUSD: 10.80, popular: false, discount: '28% off' },
  { credits: 500, priceINR: 1600, priceUSD: 19.20, popular: false, discount: '36% off' },
];

export default function CreditsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadOrg() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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
            setOrg(organization as Organization);
          }
        }

        // Detect currency
        try {
          const res = await fetch('https://ipapi.co/country/');
          const country = await res.text();
          if (country !== 'IN') {
            setCurrency('USD');
          }
        } catch {
          // Default to INR
        }
      } catch (error) {
        console.error('Error loading organization:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, [supabase]);

  const handlePurchase = async (packageItem: typeof CREDIT_PACKAGES[0]) => {
    if (!org) return;

    setPurchasing(packageItem.credits.toString());
    
    try {
      // TODO: Integrate with payment gateway
      // For now, we'll simulate the purchase
      alert(`Payment gateway integration coming soon!\n\nYou selected:\n${packageItem.credits} credits for ${currency === 'INR' ? `₹${packageItem.priceINR}` : `$${packageItem.priceUSD}`}`);
      
      // After payment success, call the add_credits function
      // const { data, error } = await supabase.rpc('add_credits', {
      //   org_id: org.id,
      //   user_id: (await supabase.auth.getUser()).data.user?.id,
      //   credits: packageItem.credits,
      //   amount_paid: currency === 'INR' ? packageItem.priceINR : packageItem.priceUSD,
      //   currency_type: currency,
      //   description: `Purchased ${packageItem.credits} credits`
      // });
      
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to purchase credits. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="credits-page">
        <div className="credits-loading">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credits-page">
      <div className="credits-header">
        <div>
          <h1>Buy Credits</h1>
          <p>Purchase credits for pay-as-you-go call analysis</p>
        </div>
        <div className="credits-balance-card">
          <span className="balance-label">Current Balance</span>
          <span className="balance-amount">{org?.credits_balance || 0} credits</span>
        </div>
      </div>

      <div className="currency-toggle">
        <button 
          className={currency === 'INR' ? 'active' : ''} 
          onClick={() => setCurrency('INR')}
        >
          🇮🇳 INR
        </button>
        <button 
          className={currency === 'USD' ? 'active' : ''} 
          onClick={() => setCurrency('USD')}
        >
          🌍 USD
        </button>
      </div>

      <div className="credits-packages-grid">
        {CREDIT_PACKAGES.map((pkg) => {
          const price = currency === 'INR' ? pkg.priceINR : pkg.priceUSD;
          const pricePerCredit = price / pkg.credits;
          
          return (
            <div key={pkg.credits} className={`credits-package-card ${pkg.popular ? 'popular' : ''}`}>
              {pkg.popular && <span className="popular-badge">Most Popular</span>}
              {pkg.discount && <span className="discount-badge">{pkg.discount}</span>}
              
              <div className="package-credits">
                <span className="credits-amount">{pkg.credits}</span>
                <span className="credits-label">Credits</span>
              </div>
              
              <div className="package-price">
                <span className="price-amount">
                  {currency === 'INR' ? '₹' : '$'}{price}
                </span>
                <span className="price-per-credit">
                  {currency === 'INR' ? '₹' : '$'}{pricePerCredit.toFixed(2)} per credit
                </span>
              </div>
              
              <button
                className="purchase-btn"
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing === pkg.credits.toString()}
              >
                {purchasing === pkg.credits.toString() ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="credits-info">
        <h3>How Credits Work</h3>
        <ul>
          <li>✓ 1 credit = 1 call analysis</li>
          <li>✓ Credits never expire</li>
          <li>✓ Use credits anytime, no monthly commitment</li>
          <li>✓ Bulk purchases offer better value</li>
          <li>✓ All premium features included</li>
        </ul>
      </div>
    </div>
  );
}

