'use client';

import Link from 'next/link';
import { Widget } from './Widget';
import { Mic, FolderOpen, Users, Settings, ShieldCheck, FileText, Zap, ChevronRight, UserCog } from 'lucide-react';

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
      icon: <Mic size={20} />,
      label: 'Analyze Call',
      description: 'Upload and analyze a new call',
      href: '/analyze',
      color: '#00df81',
    },
    {
      id: 'history',
      icon: <FolderOpen size={20} />,
      label: 'View History',
      description: 'Browse past analyses',
      href: '/history',
      color: '#8b5cf6',
    },
    {
      id: 'customers',
      icon: <Users size={20} />,
      label: 'Customers',
      description: 'View customer profiles',
      href: '/customers',
      color: '#3b82f6',
      badge: 'NEW',
    },
    {
      id: 'team',
      icon: <UserCog size={20} />,
      label: 'Team',
      description: isManager ? 'Manage your team' : 'View team members',
      href: '/team',
      color: '#f59e0b',
    },
    {
      id: 'settings',
      icon: <Settings size={20} />,
      label: 'AI Settings',
      description: 'Configure AI context',
      href: '/settings',
      color: '#6366f1',
    },
    {
      id: 'compliance',
      icon: <ShieldCheck size={20} />,
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
      icon: <FileText size={20} />,
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
            style={{ '--action-color': action.color } as React.CSSProperties}
          >
            <div className="action-icon-wrapper" style={{ backgroundColor: `${action.color}15` }}>
              <span className="action-icon" style={{ color: action.color }}>{action.icon}</span>
            </div>
            <div className="action-content">
              <span className="action-label">
                {action.label}
                {action.badge && <span className="action-badge" style={{ backgroundColor: action.color }}>{action.badge}</span>}
              </span>
              <span className="action-description">{action.description}</span>
            </div>
            <span className="action-arrow">
              <ChevronRight size={16} />
            </span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        @media (max-width: 640px) {
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <style jsx global>{`
        .action-card {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 14px !important;
          padding: 16px !important;
          background: var(--item-bg) !important;
          border: 1px solid transparent !important;
          border-radius: 12px !important;
          text-decoration: none !important;
          transition: all 0.2s ease !important;
        }
        
        .action-card:hover {
          background: var(--item-hover) !important;
          border-color: var(--action-color) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .action-card .action-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          min-width: 42px;
          height: 42px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        
        .action-card .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .action-card .action-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .action-card .action-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          color: var(--main-text);
          font-size: 14px;
          line-height: 1.3;
          text-decoration: none !important;
        }
        
        .action-card .action-badge {
          padding: 2px 6px;
          color: white;
          font-size: 9px;
          font-weight: 600;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .action-card .action-description {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          color: var(--main-text-muted);
          line-height: 1.4;
          text-decoration: none !important;
        }
        
        .action-card .action-arrow {
          color: var(--main-text-muted);
          display: flex;
          align-items: center;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s ease;
        }
        
        .action-card:hover .action-arrow {
          opacity: 1;
          transform: translateX(0);
          color: var(--action-color);
        }
      `}</style>
    </Widget>
  );
}
