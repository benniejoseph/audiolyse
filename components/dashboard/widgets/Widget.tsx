'use client';

import { useState, ReactNode } from 'react';

export interface WidgetProps {
  id: string;
  title: string;
  icon?: string;
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
              className="widget-refresh" 
              onClick={onRefresh}
              disabled={loading}
              title="Refresh"
            >
              🔄
            </button>
          )}
          {collapsible && (
            <button 
              className="widget-collapse"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '▼' : '▲'}
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
              <span className="error-icon">⚠️</span>
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
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .widget:hover {
          border-color: rgba(255, 255, 255, 0.12);
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.02);
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
        }
        
        .widget-title h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .widget-actions {
          display: flex;
          gap: 8px;
        }
        
        .widget-refresh,
        .widget-collapse {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          color: var(--muted);
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .widget-refresh:hover,
        .widget-collapse:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text);
        }
        
        .widget-refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .widget-content {
          padding: 20px;
        }
        
        .widget-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--muted);
          gap: 12px;
        }
        
        .widget-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 217, 255, 0.2);
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
          font-size: 32px;
          margin-bottom: 12px;
        }
        
        .widget-error p {
          color: var(--muted);
          margin: 0 0 16px;
        }
        
        .retry-btn {
          padding: 8px 16px;
          background: rgba(0, 217, 255, 0.15);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 8px;
          color: var(--accent);
          cursor: pointer;
          font-size: 13px;
        }
        
        .retry-btn:hover {
          background: rgba(0, 217, 255, 0.25);
        }
        
        /* Light theme */
        :global([data-theme="light"]) .widget {
          background: white;
          border-color: rgba(0, 0, 0, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        
        :global([data-theme="light"]) .widget-header {
          background: rgba(0, 0, 0, 0.02);
          border-bottom-color: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
