'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Widget } from './Widget';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, FileText, MessageSquare, Trophy, AlertTriangle, Bell } from 'lucide-react';

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
      // Fetch recent activity to generate notifications
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
      
      // Add assignment notifications
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

      // Add analysis complete notifications
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

      // Check for achievements (high scores)
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

      // Sort by date and limit
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
    
    // Subscribe to real-time updates for new analyses
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
          // Add new notification
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
    switch (type) {
      case 'analysis_complete': return <CheckCircle size={20} className="text-emerald-500" />;
      case 'assignment': return <FileText size={20} className="text-blue-500" />;
      case 'feedback': return <MessageSquare size={20} className="text-purple-500" />;
      case 'achievement': return <Trophy size={20} className="text-yellow-500" />;
      case 'alert': return <AlertTriangle size={20} className="text-red-500" />;
      default: return <Bell size={20} className="text-gray-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <Widget
      id="notifications"
      title="Notifications"
      icon={<Bell size={20} />}
      loading={loading}
      onRefresh={loadNotifications}
      headerAction={
        unreadCount > 0 ? (
          <button className="mark-read-btn" onClick={markAllRead}>
            Mark all read
          </button>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <div className="no-notifications">
          <Bell size={32} className="opacity-50 mb-3" />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notif) => (
            <Link 
              key={notif.id} 
              href={notif.link || '#'}
              className={`notification-item ${!notif.read ? 'unread' : ''}`}
            >
              <span className="notification-icon">{getNotificationIcon(notif.type)}</span>
              <div className="notification-content">
                <span className="notification-title">{notif.title}</span>
                <span className="notification-message">{notif.message}</span>
              </div>
              <span className="notification-time">{formatTime(notif.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}

      {unreadCount > 0 && (
        <div className="unread-badge">{unreadCount}</div>
      )}

      <style jsx>{`
        .mark-read-btn {
          padding: 4px 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: var(--muted);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mark-read-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
        }
        
        .no-notifications {
          text-align: center;
          padding: 40px 20px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.2s;
        }
        
        .notification-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .notification-item.unread {
          background: rgba(0, 217, 255, 0.05);
          border-left: 3px solid var(--accent);
        }
        
        .notification-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notification-content {
          flex: 1;
          min-width: 0;
        }
        
        .notification-title {
          display: block;
          font-weight: 600;
          color: var(--text);
          font-size: 13px;
        }
        
        .notification-message {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .notification-time {
          font-size: 11px;
          color: var(--muted);
          flex-shrink: 0;
        }
        
        .unread-badge {
          position: absolute;
          top: 12px;
          right: 100px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
        }
      `}</style>
    </Widget>
  );
}
