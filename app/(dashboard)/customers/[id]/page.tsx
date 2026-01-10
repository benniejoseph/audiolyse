'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  getCustomerWithHistory, 
  getCustomerSentimentTrend,
  updateCustomerProfile,
  type CustomerProfile,
  type CustomerInteraction
} from '@/lib/customer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [sentimentTrend, setSentimentTrend] = useState<Array<{ date: string; avgSentiment: number; callCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    status: 'active' as CustomerProfile['status'],
    lifecycle_stage: 'customer' as CustomerProfile['lifecycle_stage'],
    tags: '',
  });

  useEffect(() => {
    async function loadCustomer() {
      setLoading(true);
      try {
        const { customer: customerData, interactions: interactionData } = await getCustomerWithHistory(id, 50);
        
        if (!customerData) {
          router.push('/customers');
          return;
        }
        
        setCustomer(customerData);
        setInteractions(interactionData);
        
        // Initialize edit form
        setEditForm({
          name: customerData.name,
          email: customerData.email || '',
          phone: customerData.phone || '',
          company: customerData.company || '',
          notes: customerData.notes || '',
          status: customerData.status,
          lifecycle_stage: customerData.lifecycle_stage,
          tags: customerData.tags?.join(', ') || '',
        });
        
        // Load sentiment trend
        const trend = await getCustomerSentimentTrend(id, 90);
        setSentimentTrend(trend);
      } catch (error) {
        console.error('Error loading customer:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id, router]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    
    try {
      const updated = await updateCustomerProfile(customer.id, {
        name: editForm.name,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        company: editForm.company || undefined,
        notes: editForm.notes || undefined,
        status: editForm.status,
        lifecycle_stage: editForm.lifecycle_stage,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });
      
      if (updated) {
        setCustomer(updated);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="loader"></div>
        <p>Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-not-found">
        <h2>Customer not found</h2>
        <Link href="/customers">Back to Customers</Link>
      </div>
    );
  }

  return (
    <div className="customer-detail-page">
      {/* Header */}
      <div className="page-header">
        <Link href="/customers" className="back-link">
          ← Back to Customers
        </Link>
        <div className="header-content">
          <div className="customer-header">
            <div className="customer-avatar-large">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="customer-header-info">
              {editing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="edit-name-input"
                />
              ) : (
                <h1>{customer.name}</h1>
              )}
              {customer.company && !editing && (
                <span className="company-name">{customer.company}</span>
              )}
              <span className={`status-badge ${getStatusBadgeClass(customer.status)}`}>
                {customer.status}
              </span>
            </div>
          </div>
          <div className="header-actions">
            {editing ? (
              <>
                <button className="cancel-btn" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button className="edit-btn" onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="customer-content">
        {/* Left Column - Profile */}
        <div className="profile-section">
          <div className="profile-card">
            <h3>Contact Information</h3>
            {editing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="contact-list">
                {customer.email && (
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  </div>
                )}
                {customer.phone && (
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                  </div>
                )}
                {!customer.email && !customer.phone && (
                  <p className="no-contact">No contact information</p>
                )}
              </div>
            )}
          </div>

          <div className="profile-card">
            <h3>Profile Insights</h3>
            <div className="insights-grid">
              <div className="insight-item">
                <span className="insight-label">Communication Style</span>
                <span className="insight-value">{customer.communication_style || '—'}</span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Decision Style</span>
                <span className="insight-value">{customer.decision_style || '—'}</span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Price Sensitivity</span>
                <span className={`insight-value sensitivity-${customer.price_sensitivity}`}>
                  {customer.price_sensitivity}
                </span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Lifecycle Stage</span>
                {editing ? (
                  <select
                    value={editForm.lifecycle_stage}
                    onChange={(e) => setEditForm({ ...editForm, lifecycle_stage: e.target.value as any })}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="advocate">Advocate</option>
                    <option value="churned">Churned</option>
                  </select>
                ) : (
                  <span className="insight-value capitalize">{customer.lifecycle_stage}</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h3>Status</h3>
            {editing ? (
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                className="status-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
                <option value="churned">Churned</option>
              </select>
            ) : (
              <span className={`status-badge large ${getStatusBadgeClass(customer.status)}`}>
                {customer.status}
              </span>
            )}
          </div>

          <div className="profile-card">
            <h3>Notes</h3>
            {editing ? (
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Add notes about this customer..."
                rows={4}
              />
            ) : (
              <p className="notes-text">{customer.notes || 'No notes yet'}</p>
            )}
          </div>

          <div className="profile-card">
            <h3>Tags</h3>
            {editing ? (
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="Enter tags separated by commas"
              />
            ) : (
              <div className="tags-list">
                {customer.tags && customer.tags.length > 0 ? (
                  customer.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))
                ) : (
                  <span className="no-tags">No tags</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Activity */}
        <div className="activity-section">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">{customer.total_calls}</span>
              <span className="stat-label">Total Calls</span>
            </div>
            <div className="stat-card">
              <span 
                className="stat-value"
                style={{ color: getSentimentColor(customer.avg_sentiment_score) }}
              >
                {customer.avg_sentiment_score !== null ? `${Math.round(customer.avg_sentiment_score)}%` : '—'}
              </span>
              <span className="stat-label">Avg Sentiment</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {customer.avg_call_score !== null ? Math.round(customer.avg_call_score) : '—'}
              </span>
              <span className="stat-label">Avg Call Score</span>
            </div>
          </div>

          {/* Sentiment Trend Chart */}
          {sentimentTrend.length > 0 && (
            <div className="trend-card">
              <h3>📈 Sentiment Trend (90 days)</h3>
              <div className="trend-chart">
                <div className="chart-lines">
                  <span className="line-label">100</span>
                  <span className="line-label">50</span>
                  <span className="line-label">0</span>
                </div>
                <div className="chart-bars">
                  {sentimentTrend.map((point, i) => (
                    <div 
                      key={i} 
                      className="chart-bar"
                      style={{ 
                        height: `${point.avgSentiment}%`,
                        backgroundColor: getSentimentColor(point.avgSentiment)
                      }}
                      title={`${point.date}: ${point.avgSentiment}% (${point.callCount} calls)`}
                    />
                  ))}
                </div>
              </div>
              <div className="chart-legend">
                <span>Last {sentimentTrend.length} data points</span>
              </div>
            </div>
          )}

          {/* Interaction History */}
          <div className="history-card">
            <h3>📞 Interaction History</h3>
            {interactions.length === 0 ? (
              <p className="no-interactions">No interactions recorded yet</p>
            ) : (
              <div className="interaction-list">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="interaction-item">
                    <div className="interaction-icon">
                      {interaction.interaction_type === 'call' ? '📞' : 
                       interaction.interaction_type === 'email' ? '📧' :
                       interaction.interaction_type === 'meeting' ? '🤝' : '🎫'}
                    </div>
                    <div className="interaction-content">
                      <div className="interaction-header">
                        <span className="interaction-type">{interaction.interaction_type}</span>
                        <span className="interaction-date">
                          {new Date(interaction.interaction_date).toLocaleDateString()}
                        </span>
                      </div>
                      {interaction.summary && (
                        <p className="interaction-summary">{interaction.summary}</p>
                      )}
                      <div className="interaction-meta">
                        {interaction.sentiment && (
                          <span 
                            className="sentiment-badge"
                            style={{ color: getSentimentColor(interaction.sentiment_score) }}
                          >
                            {interaction.sentiment} ({interaction.sentiment_score}%)
                          </span>
                        )}
                        {interaction.duration_seconds && (
                          <span className="duration">
                            {Math.round(interaction.duration_seconds / 60)} min
                          </span>
                        )}
                        {interaction.call_analysis_id && (
                          <Link 
                            href={`/history?id=${interaction.call_analysis_id}`}
                            className="view-analysis-link"
                          >
                            View Analysis →
                          </Link>
                        )}
                      </div>
                      {interaction.key_topics && interaction.key_topics.length > 0 && (
                        <div className="interaction-topics">
                          {interaction.key_topics.slice(0, 3).map((topic, i) => (
                            <span key={i} className="topic-tag">{topic}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .customer-detail-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .back-link {
          display: inline-block;
          color: var(--muted);
          text-decoration: none;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .back-link:hover {
          color: var(--accent);
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .customer-header {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .customer-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: white;
        }
        
        .customer-header-info h1 {
          font-size: 28px;
          margin: 0 0 4px;
          color: var(--text);
        }
        
        .edit-name-input {
          font-size: 28px;
          font-weight: 700;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--accent);
          border-radius: 8px;
          padding: 8px 16px;
          color: var(--text);
        }
        
        .company-name {
          display: block;
          color: var(--muted);
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .status-badge.large {
          padding: 8px 16px;
          font-size: 14px;
        }
        
        .status-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-inactive { background: rgba(107, 114, 128, 0.15); color: #6b7280; }
        .status-churned { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .status-prospect { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
        
        .header-actions {
          display: flex;
          gap: 12px;
        }
        
        .edit-btn, .save-btn, .cancel-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .edit-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text);
        }
        
        .edit-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .save-btn {
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none;
          color: white;
        }
        
        .cancel-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: var(--muted);
        }
        
        .customer-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 24px;
        }
        
        .profile-card, .trend-card, .history-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        
        .profile-card h3, .trend-card h3, .history-card h3 {
          font-size: 14px;
          color: var(--muted);
          margin: 0 0 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .contact-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .contact-icon {
          font-size: 18px;
        }
        
        .contact-item a {
          color: var(--accent);
          text-decoration: none;
        }
        
        .contact-item a:hover {
          text-decoration: underline;
        }
        
        .no-contact {
          color: var(--muted);
          font-style: italic;
        }
        
        .insights-grid {
          display: grid;
          gap: 16px;
        }
        
        .insight-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .insight-label {
          color: var(--muted);
          font-size: 13px;
        }
        
        .insight-value {
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .sensitivity-low { color: #10b981; }
        .sensitivity-medium { color: #f59e0b; }
        .sensitivity-high { color: #ef4444; }
        
        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-group label {
          display: block;
          color: var(--muted);
          font-size: 12px;
          margin-bottom: 6px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea,
        .status-select {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          color: var(--text);
          font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .notes-text {
          color: var(--text);
          line-height: 1.6;
          margin: 0;
        }
        
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .tag {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .no-tags {
          color: var(--muted);
          font-style: italic;
        }
        
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
        }
        
        .stat-label {
          font-size: 12px;
          color: var(--muted);
        }
        
        .trend-chart {
          display: flex;
          gap: 12px;
          height: 120px;
          margin: 16px 0;
        }
        
        .chart-lines {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 11px;
          color: var(--muted);
          width: 30px;
          text-align: right;
        }
        
        .chart-bars {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .chart-bar {
          flex: 1;
          min-width: 8px;
          border-radius: 2px 2px 0 0;
          transition: height 0.3s;
          cursor: pointer;
        }
        
        .chart-bar:hover {
          opacity: 0.8;
        }
        
        .chart-legend {
          text-align: center;
          font-size: 11px;
          color: var(--muted);
        }
        
        .interaction-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .interaction-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        
        .interaction-icon {
          font-size: 24px;
        }
        
        .interaction-content {
          flex: 1;
        }
        
        .interaction-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .interaction-type {
          font-weight: 600;
          text-transform: capitalize;
          color: var(--text);
        }
        
        .interaction-date {
          color: var(--muted);
          font-size: 13px;
        }
        
        .interaction-summary {
          color: var(--text);
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 12px;
        }
        
        .interaction-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
        }
        
        .sentiment-badge {
          font-weight: 500;
        }
        
        .duration {
          color: var(--muted);
        }
        
        .view-analysis-link {
          color: var(--accent);
          text-decoration: none;
        }
        
        .view-analysis-link:hover {
          text-decoration: underline;
        }
        
        .interaction-topics {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .topic-tag {
          padding: 4px 8px;
          background: rgba(0, 217, 255, 0.1);
          border-radius: 4px;
          font-size: 11px;
          color: var(--accent);
        }
        
        .no-interactions {
          color: var(--muted);
          text-align: center;
          padding: 24px;
        }
        
        .customer-loading, .customer-not-found {
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
        
        @media (max-width: 900px) {
          .customer-content {
            grid-template-columns: 1fr;
          }
          
          .stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
