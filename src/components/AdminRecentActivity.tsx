'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { UserPlus, Building, FileText, AlertCircle, Info, TrendingUp } from 'lucide-react';

interface Notification {
  id: string;
  type: 'user_signup' | 'business_request' | 'content_moderation' | 'system_alert' | 'error' | 'info';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface ActivityStats {
  totalToday: number;
  unreadCount: number;
  criticalCount: number;
}

export default function AdminRecentActivity() {
  const [activities, setActivities] = useState<Notification[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalToday: 0,
    unreadCount: 0,
    criticalCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Refresh every minute
    const interval = setInterval(fetchRecentActivity, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/notifications?limit=10&includeRead=true');
      const data = await response.json();
      
      if (data.success) {
        const notifications = data.data.notifications;
        setActivities(notifications);
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = notifications.filter((n: Notification) => 
          new Date(n.createdAt) >= today
        ).length;
        
        const unreadCount = data.data.unreadCount;
        const criticalCount = notifications.filter((n: Notification) => 
          n.priority === 'critical' && !n.isRead
        ).length;
        
        setStats({
          totalToday: todayCount,
          unreadCount,
          criticalCount
        });
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus className="h-4 w-4" />;
      case 'business_request':
        return <Building className="h-4 w-4" />;
      case 'content_moderation':
        return <FileText className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500 bg-red-50';
      case 'high':
        return 'text-orange-500 bg-orange-50';
      case 'medium':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
          Recent Activity
        </h3>
        <div className="flex gap-2">
          <Badge className="bg-blue-500 text-white">
            {stats.totalToday} today
          </Badge>
          {stats.unreadCount > 0 && (
            <Badge className="bg-orange-500 text-white">
              {stats.unreadCount} unread
            </Badge>
          )}
          {stats.criticalCount > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              {stats.criticalCount} critical
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-blue-200">
            <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 rounded-lg transition-all ${
                activity.isRead 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-white/10 border border-white/20 shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${getPriorityColor(activity.priority)}`}>
                  {getIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`text-sm font-semibold ${activity.isRead ? 'text-blue-200' : 'text-white'}`}>
                      {activity.title}
                    </h4>
                    {!activity.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full"></div>
                    )}
                  </div>
                  <p className={`text-sm ${activity.isRead ? 'text-blue-300' : 'text-blue-100'} line-clamp-2`}>
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-blue-300">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        activity.priority === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        activity.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                        activity.priority === 'medium' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        'bg-gray-500/20 text-gray-300 border-gray-500/30'
                      }`}
                    >
                      {activity.priority}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-white/10 text-blue-200 border-white/20"
                    >
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <a
            href="/admin?tab=notifications"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center justify-center"
          >
            View all activity →
          </a>
        </div>
      )}
    </Card>
  );
}
