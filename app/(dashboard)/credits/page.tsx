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
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membershipError) {
          console.error('Error loading organization membership:', membershipError);
          setLoading(false);
          return;
        }

        if (membership && membership.organization_id) {
          const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .maybeSingle();

          if (orgError) {
            console.error('Error loading organization:', orgError);
          } else if (organization) {
            setOrg(organization as Organization);
          }
        } else {
          console.warn('No organization found for user:', user.id);
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

  // Load Razorpay script once on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePurchase = async (packageItem: typeof CREDIT_PACKAGES[0]) => {
    if (!org) {
      alert('Organization not found. Please contact support to set up your account.');
      return;
    }

    setPurchasing(packageItem.credits.toString());
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to purchase credits');
        setPurchasing(null);
        return;
      }

      const price = currency === 'INR' ? packageItem.priceINR : packageItem.priceUSD;
      
      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: packageItem.credits,
          amount: price,
          currency: currency,
          description: `Purchase ${packageItem.credits} credits`,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success || !orderData.orderId) {
        const errorMsg = orderData.error || orderData.details || 'Failed to create payment order. Please try again.';
        alert(errorMsg);
        console.error('Payment order creation failed:', orderData);
        setPurchasing(null);
        return;
      }

      // Wait for Razorpay script to load if not already loaded
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
        setPurchasing(null);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Audiolyse',
        description: `Purchase ${packageItem.credits} credits`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              credits: packageItem.credits,
              amount: price,
              currency: currency,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            alert(`Success! ${packageItem.credits} credits have been added to your account. A receipt has been sent to your email.`);
            
            // Refresh organization data
            const { data: updatedOrg } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', org.id)
              .single();
            
            if (updatedOrg) {
              setOrg(updatedOrg as Organization);
            }
            
            // Reload page to refresh balance
            window.location.reload();
          } else {
            alert(verifyData.error || 'Payment verification failed. Please contact support.');
          }
          setPurchasing(null);
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
            setPurchasing(null);
          },
        },
      };

      const razorpay = new RazorpayClass(options);
      razorpay.open();
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to initiate payment. Please try again.');
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

