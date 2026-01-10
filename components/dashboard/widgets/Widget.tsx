'use client';

import { useState, ReactNode } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export interface WidgetProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  headerAction?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  minHeight?: string;
}

export function Widget({
  id,
  title,
  icon,
  children,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  headerAction,
  loading = false,
  error = null,
  onRefresh,
  minHeight = '200px',
}: WidgetProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div 
      className={`widget ${className} ${collapsed ? 'collapsed' : ''}`}
      data-widget-id={id}
      style={{ minHeight: collapsed ? 'auto' : minHeight }}
    >
      <div className="widget-header">
        <div className="widget-title">
          {icon && <span className="widget-icon">{icon}</span>}
          <h3>{title}</h3>
        </div>
        <div className="widget-actions">
          {headerAction}
          {onRefresh && (
            <button 
              className={`widget-refresh ${loading ? 'spinning' : ''}`}
              onClick={onRefresh}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          )}
          {collapsible && (
            <button 
              className="widget-collapse"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
        </div>
      </div>
      
      {!collapsed && (
        <div className="widget-content">
          {loading ? (
            <div className="widget-loading">
              <div className="widget-spinner"></div>
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="widget-error">
              <span className="error-icon"><AlertTriangle size={32} /></span>
              <p>{error}</p>
              {onRefresh && (
                <button onClick={onRefresh} className="retry-btn">
                  Try Again
                </button>
              )}
            </div>
          ) : (
            children
          )}
        </div>
      )}

      <style jsx>{`
        .widget {
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: var(--card-shadow);
        }
        
        .widget:hover {
          border-color: var(--accent);
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          background: transparent;
        }
        
        .widget.collapsed .widget-header {
          border-bottom: none;
        }
        
        .widget-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .widget-icon {
          font-size: 20px;
          color: var(--accent-text);
        }
        
        .widget-title h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--main-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .widget-actions {
          display: flex;
          gap: 8px;
        }
        
        .widget-refresh,
        .widget-collapse {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          color: var(--main-text-muted);
          transition: all 0.2s;
        }
        
        .widget-refresh:hover,
        .widget-collapse:hover {
          background: var(--item-hover);
          color: var(--accent);
        }
        
        .widget-refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .widget-refresh.spinning {
          animation: spin 1s linear infinite;
        }
        
        .widget-content {
          padding: 20px;
          color: var(--main-text);
        }
        
        .widget-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--main-text-muted);
          gap: 12px;
        }
        
        .widget-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 223, 129, 0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .widget-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        
        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          margin-bottom: 12px;
        }
        
        .widget-error p {
          color: var(--main-text-muted);
          margin: 0 0 16px;
        }
        
        .retry-btn {
          padding: 8px 16px;
          background: var(--accent-light);
          border: 1px solid var(--accent);
          border-radius: 8px;
          color: var(--accent-text);
          cursor: pointer;
          font-size: 13px;
        }
        
        .retry-btn:hover {
          background: var(--accent);
          color: #00120f;
        }
      `}</style>
    </div>
  );
}
