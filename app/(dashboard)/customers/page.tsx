'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { searchCustomers, getTopCustomers, getAtRiskCustomers, type CustomerProfile } from '@/lib/customer';
import { Users, User, CheckCircle, Smile, AlertTriangle, Search } from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [atRiskCustomers, setAtRiskCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'at-risk'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    avgSentiment: 0,
    atRiskCount: 0,
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        router.push('/onboarding');
        return;
      }

      setOrganizationId(membership.organization_id);
      await loadCustomers(membership.organization_id);
    }

    loadData();
  }, [supabase, router]);

  const loadCustomers = useCallback(async (orgId: string) => {
    setLoading(true);
    try {
      // Get all customers
      const allCustomers = await searchCustomers(orgId, '', undefined, 100);
      setCustomers(allCustomers);
      
      // Get at-risk customers
      const riskCustomers = await getAtRiskCustomers(orgId, 10);
      setAtRiskCustomers(riskCustomers);
      
      // Calculate stats
      const active = allCustomers.filter(c => c.status === 'active').length;
      const avgSent = allCustomers.reduce((sum, c) => sum + (c.avg_sentiment_score || 0), 0) / (allCustomers.length || 1);
      
      setStats({
        totalCustomers: allCustomers.length,
        activeCustomers: active,
        avgSentiment: Math.round(avgSent),
        atRiskCount: riskCustomers.length,
      });
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const statusFilterValue = statusFilter === 'all' ? undefined : statusFilter as any;
      const results = await searchCustomers(
        organizationId, 
        searchQuery, 
        { status: statusFilterValue },
        50
      );
      setCustomers(results);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, searchQuery, statusFilter]);

  useEffect(() => {
    if (organizationId) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, statusFilter, organizationId, handleSearch]);

  const getSentimentColor = (score: number | null) => {
    if (score === null) return '#6b7280';
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'churned': return 'status-churned';
      case 'prospect': return 'status-prospect';
      default: return '';
    }
  };

  const displayedCustomers = activeTab === 'at-risk' ? atRiskCustomers : customers;

  if (loading && customers.length === 0) {
    return (
      <div className="customers-loading">
        <div className="loader"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="customers-page">
      <div className="page-header">
        <div className="header-content">
          <h1><Users size={24} style={{display: 'inline', marginRight: 8}} /> Customers</h1>
          <p>Track and manage customer relationships</p>
        </div>
        <button 
          className="add-customer-btn"
          onClick={() => setSelectedCustomer({ id: 'new' } as any)}
        >
          + Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="customer-stats">
        <div className="stat-card">
          <span className="stat-icon"><User size={24} /></span>
          <div className="stat-content">
            <span className="stat-value">{stats.totalCustomers}</span>
            <span className="stat-label">Total Customers</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><CheckCircle size={24} /></span>
          <div className="stat-content">
            <span className="stat-value">{stats.activeCustomers}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><Smile size={24} /></span>
          <div className="stat-content">
            <span className="stat-value" style={{ color: getSentimentColor(stats.avgSentiment) }}>
              {stats.avgSentiment}%
            </span>
            <span className="stat-label">Avg Sentiment</span>
          </div>
        </div>
        <div className="stat-card warning">
          <span className="stat-icon"><AlertTriangle size={24} /></span>
          <div className="stat-content">
            <span className="stat-value">{stats.atRiskCount}</span>
            <span className="stat-label">At Risk</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="customer-tabs">
        <button 
          className={activeTab === 'all' ? 'active' : ''} 
          onClick={() => setActiveTab('all')}
        >
          All Customers
        </button>
        <button 
          className={activeTab === 'top' ? 'active' : ''} 
          onClick={async () => {
            setActiveTab('top');
            if (organizationId) {
              setLoading(true);
              const top = await getTopCustomers(organizationId, 20);
              setCustomers(top);
              setLoading(false);
            }
          }}
        >
          Top Customers
        </button>
        <button 
          className={`at-risk-tab ${activeTab === 'at-risk' ? 'active' : ''}`} 
          onClick={() => setActiveTab('at-risk')}
        >
          At Risk ({stats.atRiskCount})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="customer-filters">
        <div className="search-box">
          <span className="search-icon"><Search size={16} /></span>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* Customer List */}
      <div className="customer-list">
        {displayedCustomers.length === 0 ? (
          <div className="no-customers">
            <span className="empty-icon"><Users size={48} /></span>
            <h3>No customers found</h3>
            <p>Customers will appear here after call analyses</p>
          </div>
        ) : (
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Calls</th>
                <th>Sentiment</th>
                <th>Last Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedCustomers.map((customer) => (
                <tr 
                  key={customer.id} 
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="customer-row"
                >
                  <td>
                    <div className="customer-info">
                      <div className="customer-avatar">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="customer-details">
                        <span className="customer-name">{customer.name}</span>
                        {customer.company && (
                          <span className="customer-company">{customer.company}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      {customer.email && <span className="email">{customer.email}</span>}
                      {customer.phone && <span className="phone">{customer.phone}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="calls-count">{customer.total_calls}</td>
                  <td>
                    <div 
                      className="sentiment-bar"
                      style={{ 
                        '--sentiment-color': getSentimentColor(customer.avg_sentiment_score),
                        '--sentiment-width': `${customer.avg_sentiment_score || 0}%`
                      } as any}
                    >
                      <span className="sentiment-value">
                        {customer.avg_sentiment_score !== null ? `${Math.round(customer.avg_sentiment_score)}%` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="last-contact">
                    {customer.last_interaction_date 
                      ? new Date(customer.last_interaction_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/customers/${customer.id}`);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .customers-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        
        .header-content h1 {
          font-size: 28px;
          color: var(--text);
          margin: 0 0 4px;
        }
        
        .header-content p {
          color: var(--muted);
          margin: 0;
        }
        
        .add-customer-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .add-customer-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 217, 255, 0.3);
        }
        
        .customer-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .stat-card.warning {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }
        
        .stat-icon {
          font-size: 28px;
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
        }
        
        .stat-label {
          font-size: 13px;
          color: var(--muted);
        }
        
        .customer-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .customer-tabs button {
          padding: 10px 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .customer-tabs button:hover {
          background: rgba(255,255,255,0.08);
        }
        
        .customer-tabs button.active {
          background: rgba(0, 217, 255, 0.15);
          border-color: rgba(0, 217, 255, 0.3);
          color: var(--accent);
        }
        
        .customer-tabs .at-risk-tab.active {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .customer-filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .search-box {
          flex: 1;
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
        }
        
        .search-box input:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .status-filter {
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
          min-width: 150px;
        }
        
        .customers-table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .customers-table th {
          text-align: left;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .customers-table td {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: var(--text);
        }
        
        .customer-row {
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .customer-row:hover {
          background: rgba(255,255,255,0.03);
        }
        
        .customer-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .customer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
        }
        
        .customer-details {
          display: flex;
          flex-direction: column;
        }
        
        .customer-name {
          font-weight: 500;
        }
        
        .customer-company {
          font-size: 12px;
          color: var(--muted);
        }
        
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
        }
        
        .contact-info .email {
          color: var(--accent);
        }
        
        .contact-info .phone {
          color: var(--muted);
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .status-active {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .status-inactive {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
        }
        
        .status-churned {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        
        .status-prospect {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }
        
        .calls-count {
          font-weight: 600;
          text-align: center;
        }
        
        .sentiment-bar {
          position: relative;
          width: 100px;
          height: 24px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .sentiment-bar::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: var(--sentiment-width);
          background: var(--sentiment-color);
          opacity: 0.3;
        }
        
        .sentiment-value {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 12px;
          font-weight: 600;
          color: var(--sentiment-color);
        }
        
        .last-contact {
          color: var(--muted);
          font-size: 13px;
        }
        
        .view-btn {
          padding: 6px 16px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 6px;
          color: var(--accent);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .view-btn:hover {
          background: rgba(0, 217, 255, 0.2);
        }
        
        .no-customers {
          text-align: center;
          padding: 60px 20px;
          color: var(--muted);
        }
        
        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }
        
        .no-customers h3 {
          color: var(--text);
          margin: 0 0 8px;
        }
        
        .no-customers p {
          margin: 0;
        }
        
        .customers-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: var(--muted);
        }
        
        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 217, 255, 0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Light theme */
        [data-theme="light"] .stat-card {
          background: rgba(0,0,0,0.02);
          border-color: rgba(0,0,0,0.1);
        }
        
        [data-theme="light"] .customers-table {
          background: white;
          border-color: rgba(0,0,0,0.1);
        }
        
        [data-theme="light"] .customers-table th {
          background: rgba(0,0,0,0.03);
        }
        
        [data-theme="light"] .search-box input,
        [data-theme="light"] .status-filter {
          background: white;
          border-color: rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}
