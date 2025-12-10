'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Organization } from '@/lib/types/database';
import '@/app/styles/dashboard.css';
import '@/app/styles/credits.css';

interface CreditTransaction {
  id: string;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'expiry';
  credits_amount: number;
  amount_paid: number | null;
  currency: 'INR' | 'USD' | null;
  description: string | null;
  created_at: string;
  metadata: any;
}

export default function TransactionsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'usage'>('all');
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use API route to bypass RLS issues
        const response = await fetch('/api/organization/me');
        const data = await response.json();

        if (response.ok && data.organization) {
          setOrg(data.organization as Organization);

          // Load transactions
          const { data: txns, error } = await supabase
            .from('credits_transactions')
            .select('*')
            .eq('organization_id', data.organization.id)
            .order('created_at', { ascending: false })
            .limit(100);

          if (!error && txns) {
            setTransactions(txns as CreditTransaction[]);
          }
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') return true;
    return txn.transaction_type === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number | null, currency: 'INR' | 'USD' | null) => {
    if (!amount || !currency) return '-';
    return currency === 'INR' ? `₹${amount.toFixed(2)}` : `$${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '💳';
      case 'usage': return '📞';
      case 'refund': return '↩️';
      case 'expiry': return '⏰';
      default: return '📋';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#10b981'; // green
      case 'usage': return '#00d9ff'; // cyan
      case 'refund': return '#8b5cf6'; // purple
      case 'expiry': return '#f59e0b'; // orange
      default: return '#9ca3af'; // gray
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loader"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Transaction History</h1>
          <p>View your credit purchases and usage</p>
        </div>
        {org?.subscription_tier === 'payg' && (
          <Link href="/credits" className="cta-button">
            <span>💳</span> Buy Credits
          </Link>
        )}
      </div>

      {org?.subscription_tier === 'payg' && (
        <div className="credits-balance-card" style={{ marginBottom: '2rem' }}>
          <span className="balance-label">Current Balance</span>
          <span className="balance-amount">{org?.credits_balance || 0} credits</span>
        </div>
      )}

      <div className="filter-tabs" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        paddingBottom: '1rem'
      }}>
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'all' ? 'rgba(0, 217, 255, 0.2)' : 'transparent',
            border: `1px solid ${filter === 'all' ? 'rgba(0, 217, 255, 0.4)' : 'rgba(139, 92, 246, 0.2)'}`,
            borderRadius: '0.5rem',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'purchase' ? 'active' : ''}`}
          onClick={() => setFilter('purchase')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'purchase' ? 'rgba(0, 217, 255, 0.2)' : 'transparent',
            border: `1px solid ${filter === 'purchase' ? 'rgba(0, 217, 255, 0.4)' : 'rgba(139, 92, 246, 0.2)'}`,
            borderRadius: '0.5rem',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          Purchases
        </button>
        <button
          className={`filter-tab ${filter === 'usage' ? 'active' : ''}`}
          onClick={() => setFilter('usage')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'usage' ? 'rgba(0, 217, 255, 0.2)' : 'transparent',
            border: `1px solid ${filter === 'usage' ? 'rgba(0, 217, 255, 0.4)' : 'rgba(139, 92, 246, 0.2)'}`,
            borderRadius: '0.5rem',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          Usage
        </button>
      </div>

      <div className="recent-calls-card">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No transactions yet</h3>
            <p>
              {org?.subscription_tier === 'payg' 
                ? 'Purchase credits to get started with call analysis'
                : 'Switch to Pay-as-You-Go to see transaction history'}
            </p>
            {org?.subscription_tier === 'payg' && (
              <Link href="/credits" className="cta-button" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Buy Credits
              </Link>
            )}
          </div>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className="transaction-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.1)',
                  borderRadius: '0.75rem',
                  marginBottom: '0.75rem',
                  transition: 'all 0.25s ease',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `rgba(${txn.transaction_type === 'purchase' ? '16, 185, 129' : '0, 217, 255'}, 0.2)`,
                    border: `1px solid ${getTransactionColor(txn.transaction_type)}`,
                    borderRadius: '0.75rem',
                    fontSize: '1.5rem',
                  }}
                >
                  {getTransactionIcon(txn.transaction_type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                    {txn.transaction_type === 'purchase' ? 'Credit Purchase' :
                     txn.transaction_type === 'usage' ? 'Call Analysis' :
                     txn.transaction_type === 'refund' ? 'Refund' : 'Credit Expiry'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {txn.description || 'No description'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.25rem' }}>
                    {formatDate(txn.created_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: txn.transaction_type === 'purchase' ? '#10b981' : '#00d9ff',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {txn.credits_amount > 0 ? '+' : ''}{txn.credits_amount} credits
                  </div>
                  {txn.amount_paid && txn.currency && (
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {formatAmount(txn.amount_paid, txn.currency)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

