'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  Building, 
  Calendar, 
  Newspaper, 
  Users,
  Settings,
  BarChart3,
  CheckCircle,
  Eye,
  Trash2,
  UserCheck
} from 'lucide-react';
import type { Business, Event, NewsArticle } from '@/types';

interface ContentStats {
  businesses: Business[];
  events: Event[];
  news: NewsArticle[];
  recentClaims: Business[];
  categoryStats: Array<{
    _id: string;
    total: number;
    claimed: number;
    premium: number;
  }>;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'content' | 'users' | 'settings'>('overview');
  const [data, setData] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch businesses with analytics
        const businessResponse = await fetch('/api/businesses/analytics');
        const businessData = await businessResponse.json();

        // Fetch recent content
        const eventsResponse = await fetch('/api/events?limit=10');
        const eventsData = await eventsResponse.json();

        const newsResponse = await fetch('/api/news?limit=10');
        const newsData = await newsResponse.json();

        if (businessData.success && eventsData.success && newsData.success) {
          setData({
            businesses: businessData.data.recentUpdates || [],
            events: eventsData.data || [],
            news: newsData.data || [],
            recentClaims: businessData.data.recentClaims || [],
            categoryStats: businessData.data.categoryStats || []
          });
        }
      } catch (_error) {
        console.error('Error fetching admin data:', _error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBusinessAction = async (businessId: string, action: 'approve' | 'reject' | 'feature') => {
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, action })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Business ${action} successful!`);
        // Refresh data
        window.location.reload();
      } else {
        alert(`Failed to ${action} business: ${result.error}`);
      }
    } catch (_error) {
      alert(`Error performing ${action} on business`);
    }
  };

  const handleContentAction = async (type: 'event' | 'news', id: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const response = await fetch(`/api/admin/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });

      const result = await response.json();
      if (result.success) {
        alert(`${type} ${action} successful!`);
        window.location.reload();
      } else {
        alert(`Failed to ${action} ${type}: ${result.error}`);
      }
    } catch (_error) {
      alert(`Error performing ${action} on ${type}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'businesses', label: 'Businesses', icon: Building },
    { id: 'content', label: 'Content', icon: Newspaper },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6 admin-dashboard">
      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Categories */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Categories</h3>
            <div className="space-y-3">
              {data.categoryStats.slice(0, 8).map((category) => (
                <div key={category._id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{category._id}</span>
                    <div className="text-sm text-gray-700">
                      {category.claimed} claimed • {category.premium} premium
                    </div>
                  </div>
                  <Badge variant="secondary">{category.total}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Claims */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Business Claims</h3>
            <div className="space-y-3">
              {data.recentClaims.slice(0, 5).map((business) => (
                <div key={business.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{business.name}</span>
                    <div className="text-sm text-gray-700">
                      {business.category} • Claimed {business.claimedAt ? new Date(business.claimedAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                  <Badge className={`${
                    business.subscriptionTier === 'platinum' ? 'bg-purple-600 text-white' :
                    business.subscriptionTier === 'gold' ? 'bg-yellow-500 text-black' :
                    business.subscriptionTier === 'silver' ? 'bg-gray-400 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {business.subscriptionTier || 'free'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'businesses' && data && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Business Management</h3>
              <Button size="sm" variant="outline">
                Export Data
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.businesses.slice(0, 10).map((business) => (
                    <tr key={business.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{business.name}</div>
                        <div className="text-sm text-gray-800">{business.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={business.isClaimed ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>
                          {business.isClaimed ? 'Claimed' : 'Unclaimed'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${
                          business.subscriptionTier === 'platinum' ? 'bg-purple-600 text-white' :
                          business.subscriptionTier === 'gold' ? 'bg-yellow-500 text-black' :
                          business.subscriptionTier === 'silver' ? 'bg-gray-400 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {business.subscriptionTier || 'free'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${business.subscriptionTier === 'platinum' ? '79.99' :
                          business.subscriptionTier === 'gold' ? '39.99' :
                          business.subscriptionTier === 'silver' ? '19.99' : '0.00'}/mo
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/businesses?id=${business.id}`, '_blank')}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBusinessAction(business.id, 'feature')}>
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'content' && data && (
        <div className="space-y-6">
          {/* Events */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Events
            </h3>
            <div className="space-y-3">
              {data.events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{event.title}</span>
                    <div className="text-sm text-gray-700">
                      {new Date(event.date).toLocaleDateString()} • {event.category}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleContentAction('event', event.id, 'approve')}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleContentAction('event', event.id, 'delete')}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* News */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Newspaper className="h-5 w-5 mr-2" />
              Recent News
            </h3>
            <div className="space-y-3">
              {data.news.slice(0, 5).map((article) => (
                <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{article.title}</span>
                    <div className="text-sm text-gray-700">
                      {new Date(article.publishedAt).toLocaleDateString()} • {article.sourceName}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleContentAction('news', article.id, 'approve')}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleContentAction('news', article.id, 'delete')}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
          <div className="text-center py-8 text-gray-700">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>User management features coming soon...</p>
            <p className="text-sm mt-2">This will include business owner accounts, admin users, and user permissions.</p>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Scraper Configuration</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-800">Auto-run news scraper every 6 hours</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-800">Auto-run events scraper every 6 hours</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-800">Auto-run business scraper weekly</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Email Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-800">Business claim notifications</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-800">Scraper error alerts</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-800">Daily summary reports</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Content Moderation</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-800">Require approval for new events</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-800">Require approval for news articles</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-800">Auto-approve scraped content</span>
                </label>
              </div>
            </div>

            <Button className="mt-4">Save Settings</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
