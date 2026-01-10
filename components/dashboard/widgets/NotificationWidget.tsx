'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, FileText, MessageSquare, Trophy, AlertTriangle, Bell, Settings2, RefreshCw } from 'lucide-react';

interface Notification {
  id: string;
  type: 'analysis_complete' | 'assignment' | 'feedback' | 'achievement' | 'alert';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationWidgetProps {
  userId: string;
  organizationId: string;
}

export function NotificationWidget({ userId, organizationId }: NotificationWidgetProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const supabase = createClient();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    
    try {
      const [assignmentsResult, analysesResult] = await Promise.all([
        supabase
          .from('call_analyses')
          .select('id, file_name, created_at, assigned_to')
          .eq('assigned_to', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('call_analyses')
          .select('id, file_name, created_at, status, overall_score')
          .eq('uploaded_by', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const notifs: Notification[] = [];
      
      (assignmentsResult.data || []).forEach((call: any) => {
        const isRecent = new Date(call.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        notifs.push({
          id: `assign-${call.id}`,
          type: 'assignment',
          title: 'Call Assigned',
          message: `"${call.file_name}" was assigned to you`,
          link: `/history?id=${call.id}`,
          read: !isRecent,
          createdAt: call.created_at,
        });
      });

      (analysesResult.data || []).forEach((call: any) => {
        const isRecent = new Date(call.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        notifs.push({
          id: `complete-${call.id}`,
          type: 'analysis_complete',
          title: 'Analysis Complete',
          message: `"${call.file_name}" scored ${Math.round(call.overall_score || 0)}`,
          link: `/history?id=${call.id}`,
          read: !isRecent,
          createdAt: call.created_at,
        });
      });

      const highScores = (analysesResult.data || []).filter((c: any) => c.overall_score >= 90);
      if (highScores.length > 0) {
        const latest = highScores[0];
        notifs.push({
          id: `achievement-${latest.id}`,
          type: 'achievement',
          title: 'High Score!',
          message: `Excellent! You scored ${Math.round(latest.overall_score)} on a recent call`,
          link: `/history?id=${latest.id}`,
          read: false,
          createdAt: latest.created_at,
        });
      }

      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(notifs.slice(0, 8));
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadNotifications();
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_analyses',
          filter: `uploaded_by=eq.${userId}`,
        },
        (payload) => {
          const newNotif: Notification = {
            id: `new-${payload.new.id}`,
            type: 'analysis_complete',
            title: 'New Analysis',
            message: `Processing "${payload.new.file_name}"...`,
            link: `/history?id=${payload.new.id}`,
            read: false,
            createdAt: payload.new.created_at,
          };
          setNotifications(prev => [newNotif, ...prev].slice(0, 8));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, loadNotifications]);

  const getNotificationIcon = (type: Notification['type']) => {
    const iconColors: Record<string, string> = {
      'analysis_complete': '#10b981',
      'assignment': '#3b82f6',
      'feedback': '#8b5cf6',
      'achievement': '#f59e0b',
      'alert': '#ef4444',
    };
    const color = iconColors[type] || '#6b7280';
    
    switch (type) {
      case 'analysis_complete': return <CheckCircle size={18} style={{ color }} />;
      case 'assignment': return <FileText size={18} style={{ color }} />;
      case 'feedback': return <MessageSquare size={18} style={{ color }} />;
      case 'achievement': return <Trophy size={18} style={{ color }} />;
      case 'alert': return <AlertTriangle size={18} style={{ color }} />;
      default: return <Bell size={18} style={{ color }} />;
    }
  };

  const getIconBgColor = (type: Notification['type']) => {
    const bgColors: Record<string, string> = {
      'analysis_complete': 'rgba(16, 185, 129, 0.1)',
      'assignment': 'rgba(59, 130, 246, 0.1)',
      'feedback': 'rgba(139, 92, 246, 0.1)',
      'achievement': 'rgba(245, 158, 11, 0.1)',
      'alert': 'rgba(239, 68, 68, 0.1)',
    };
    return bgColors[type] || 'rgba(107, 114, 128, 0.1)';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const todayNotifications = notifications.filter(n => isToday(n.createdAt));
  const earlierNotifications = notifications.filter(n => !isToday(n.createdAt));
  const todayUnreadCount = todayNotifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="notifications-card">
      {/* Header */}
      <div className="notifications-header">
        <h2 className="notifications-title">Notifications</h2>
        <div className="header-actions">
          <button 
            className={`refresh-btn ${loading ? 'spinning' : ''}`} 
            onClick={loadNotifications}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button className="settings-btn" title="Settings">
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <p className="notifications-subtitle">
        You have <span className="highlight">{todayUnreadCount} Notification{todayUnreadCount !== 1 ? 's' : ''}</span> today.
      </p>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={40} />
          <p>No notifications yet</p>
          <span>We&apos;ll notify you when something arrives</span>
        </div>
      ) : (
        <div className="notifications-content">
          {/* Today Section */}
          {todayNotifications.length > 0 && (
            <div className="notification-section">
              <h3 className="section-title">Today</h3>
              <div className="notification-list">
                {todayNotifications.map((notif) => (
                  <Link 
                    key={notif.id} 
                    href={notif.link || '#'}
                    className="notification-item"
                  >
                    {!notif.read && <span className="unread-dot"></span>}
                    <div className="avatar" style={{ backgroundColor: getIconBgColor(notif.type) }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notification-body">
                      <p className="notification-text">
                        <span className="notification-name">{notif.title}</span>
                        {' '}{notif.message}
                      </p>
                      <span className="notification-time">{formatTime(notif.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Earlier Section */}
          {earlierNotifications.length > 0 && (
            <div className="notification-section">
              <h3 className="section-title">Earlier</h3>
              <div className="notification-list">
                {earlierNotifications.map((notif) => (
                  <Link 
                    key={notif.id} 
                    href={notif.link || '#'}
                    className="notification-item"
                  >
                    {!notif.read && <span className="unread-dot"></span>}
                    <div className="avatar" style={{ backgroundColor: getIconBgColor(notif.type) }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notification-body">
                      <p className="notification-text">
                        <span className="notification-name">{notif.title}</span>
                        {' '}{notif.message}
                      </p>
                      <span className="notification-time">{formatTime(notif.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Mark all read button */}
          {unreadCount > 0 && (
            <button className="mark-all-read" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .notifications-card {
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: var(--card-shadow);
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .notifications-title {
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--main-text);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .settings-btn,
        .refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: var(--main-text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-btn:hover,
        .refresh-btn:hover {
          background: var(--item-bg);
          color: var(--accent);
        }

        .refresh-btn.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .notifications-subtitle {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          color: var(--main-text-muted);
          margin: 0 0 24px 0;
        }

        .notifications-subtitle .highlight {
          color: var(--accent);
          font-weight: 500;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 12px;
          color: var(--main-text-muted);
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid var(--border-color);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: var(--main-text-muted);
        }

        .empty-state p {
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          color: var(--main-text);
          margin: 16px 0 4px;
        }

        .empty-state span {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
        }

        .notifications-content {
          display: flex;
          flex-direction: column;
        }

        .notification-section {
          margin-bottom: 20px;
        }

        .section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--main-text);
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 8px;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background: var(--item-bg);
        }

        .unread-dot {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-text {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: var(--main-text-muted);
          margin: 0 0 2px 0;
          line-height: 1.5;
        }

        .notification-name {
          color: var(--accent);
          font-weight: 500;
        }

        .notification-time {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          color: var(--main-text-muted);
          opacity: 0.7;
        }

        .mark-all-read {
          margin-top: 12px;
          padding: 10px 16px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--main-text-muted);
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }

        .mark-all-read:hover {
          background: var(--accent-light);
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
