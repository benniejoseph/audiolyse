'use client';

import Link from 'next/link';
import { Widget } from './Widget';
import { Mic, FolderOpen, Users, Settings, ShieldCheck, FileText, Zap } from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color: string;
  badge?: string;
}

interface QuickActionsWidgetProps {
  subscriptionTier?: string;
  isManager?: boolean;
}

export function QuickActionsWidget({ 
  subscriptionTier = 'free',
  isManager = false
}: QuickActionsWidgetProps) {
  const actions: QuickAction[] = [
    {
      id: 'analyze',
      icon: <Mic size={24} />,
      label: 'Analyze Call',
      description: 'Upload and analyze a new call',
      href: '/analyze',
      color: '#00d9ff',
    },
    {
      id: 'history',
      icon: <FolderOpen size={24} />,
      label: 'View History',
      description: 'Browse past analyses',
      href: '/history',
      color: '#8b5cf6',
    },
    {
      id: 'customers',
      icon: <Users size={24} />,
      label: 'Customers',
      description: 'View customer profiles',
      href: '/customers',
      color: '#10b981',
      badge: 'NEW',
    },
    {
      id: 'team',
      icon: <Users size={24} />,
      label: 'Team',
      description: isManager ? 'Manage your team' : 'View team members',
      href: '/team',
      color: '#f59e0b',
    },
    {
      id: 'settings',
      icon: <Settings size={24} />,
      label: 'AI Settings',
      description: 'Configure AI context',
      href: '/settings',
      color: '#6366f1',
    },
    {
      id: 'compliance',
      icon: <ShieldCheck size={24} />,
      label: 'Compliance',
      description: 'Legal & privacy settings',
      href: '/compliance',
      color: '#ef4444',
    },
  ];

  // Add premium actions
  if (subscriptionTier !== 'free') {
    actions.push({
      id: 'export',
      icon: <FileText size={24} />,
      label: 'Export Reports',
      description: 'Download analytics',
      href: '/history',
      color: '#ec4899',
      badge: 'PRO',
    });
  }

  return (
    <Widget
      id="quick-actions"
      title="Quick Actions"
      icon={<Zap size={20} />}
      minHeight="auto"
    >
      <div className="actions-grid">
        {actions.map((action) => (
          <Link 
            key={action.id} 
            href={action.href}
            className="action-card"
            style={{ '--action-color': action.color } as any}
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-content">
              <span className="action-label">
                {action.label}
                {action.badge && <span className="action-badge">{action.badge}</span>}
              </span>
              <span className="action-description">{action.description}</span>
            </div>
            <span className="action-arrow">→</span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        
        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .action-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--action-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        
        .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--action-color);
          flex-shrink: 0;
        }
        
        .action-content {
          flex: 1;
          min-width: 0;
        }
        
        .action-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: var(--text);
          font-size: 14px;
        }
        
        .action-badge {
          padding: 2px 6px;
          background: var(--action-color);
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 4px;
        }
        
        .action-description {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .action-arrow {
          color: var(--muted);
          font-size: 14px;
          transition: transform 0.2s;
        }
        
        .action-card:hover .action-arrow {
          transform: translateX(4px);
          color: var(--action-color);
        }
        
        /* Light theme */
        :global([data-theme="light"]) .action-card {
          background: rgba(0, 0, 0, 0.02);
          border-color: rgba(0, 0, 0, 0.08);
        }
        
        :global([data-theme="light"]) .action-card:hover {
          background: rgba(0, 0, 0, 0.04);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </Widget>
  );
}
