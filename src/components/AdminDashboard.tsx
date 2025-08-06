'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import BusinessRequestManager from './BusinessRequestManager';
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
  UserCheck,
  RefreshCw,
  Activity
} from 'lucide-react';
import type { Business, Event, NewsArticle } from '@/types';
import ScraperLogs from './ScraperLogs';

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

interface ScraperConfig {
  _id: string;
  type: 'news' | 'events' | 'businesses';
  isEnabled: boolean;
  intervalHours: number;
  lastRun?: string;
  nextRun?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'business-requests' | 'content' | 'users' | 'scrapers' | 'settings'>('overview');
  const [data, setData] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Scraper configurations from database
  const [scraperConfigs, setScraperConfigs] = useState<ScraperConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);

  // Scraper state management
  const [scraperStates, setScraperStates] = useState<{
    news: { status: 'idle' | 'running' | 'error'; lastRun?: string };
    events: { status: 'idle' | 'running' | 'error'; lastRun?: string };
    businesses: { status: 'idle' | 'running' | 'error'; lastRun?: string };
  }>({
    news: { status: 'idle' },
    events: { status: 'idle' },
    businesses: { status: 'idle' }
  });

  // Logs modal state
  const [logsModal, setLogsModal] = useState<{
    isOpen: boolean;
    type: 'news' | 'events' | 'businesses' | null;
  }>({
    isOpen: false,
    type: null
  });

  // Comprehensive scraper state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [comprehensiveScraperStatus, setComprehensiveScraperStatus] = useState<{
    isRunning: boolean;
    lastRun: Date | null;
    stats: {
      events: { lastRun: Date | null; isRunning: boolean; totalRuns: number; lastErrors: string[] };
      news: { lastRun: Date | null; isRunning: boolean; totalRuns: number; lastErrors: string[] };
      businesses: { lastRun: Date | null; isRunning: boolean; totalRuns: number; lastErrors: string[] };
      overall: { totalItems: number; lastFullScrape: Date | null; systemHealth: 'healthy' | 'warning' | 'error' };
    };
  }>({
    isRunning: false,
    lastRun: null,
    stats: {
      events: { lastRun: null, isRunning: false, totalRuns: 0, lastErrors: [] },
      news: { lastRun: null, isRunning: false, totalRuns: 0, lastErrors: [] },
      businesses: { lastRun: null, isRunning: false, totalRuns: 0, lastErrors: [] },
      overall: { totalItems: 0, lastFullScrape: null, systemHealth: 'healthy' }
    }
  });



  useEffect(() => {
    fetchData();
    fetchScraperConfigs();
    // Intentionally omitting fetchData and fetchScraperConfigs from dependencies to avoid re-running effect on every render.
    // These functions are defined after useEffect and are stable in this context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
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

      // Fetch comprehensive scraper status
      await fetchComprehensiveScraperStatus();
    } catch (_error) {
      console.error('Error fetching admin data:', _error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScraperConfigs = async () => {
    try {
      const response = await fetch('/api/admin/scraper-config');
      const result = await response.json();
      
      if (result.success) {
        setScraperConfigs(result.configs);
      }
    } catch (_error) {
      console.error('Error fetching scraper configs:', _error);
    } finally {
      setConfigsLoading(false);
    }
  };

  // Helper functions for scraper configurations
  const getScraperConfig = (type: 'news' | 'events' | 'businesses') => {
    return scraperConfigs.find(config => config.type === type);
  };

  const updateScraperConfig = async (type: 'news' | 'events' | 'businesses', updates: Partial<ScraperConfig>) => {
    try {
      // Get current config to ensure we always send required fields
      const currentConfig = getScraperConfig(type);
      
      // Ensure intervalHours is always included and valid
      const payload = {
        type,
        intervalHours: updates.intervalHours || currentConfig?.intervalHours || (type === 'businesses' ? 168 : 6),
        isEnabled: updates.isEnabled !== undefined ? updates.isEnabled : (currentConfig?.isEnabled ?? true),
        ...updates
      };

      const response = await fetch('/api/admin/scraper-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.success) {
        // Update local state
        setScraperConfigs(prev => 
          prev.map(config => 
            config.type === type ? { ...config, ...result.config } : config
          )
        );
        return true;
      } else {
        console.error('Failed to update scraper config:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error updating scraper config:', error);
      return false;
    }
  };

  const updateScraperStatus = async (type: 'news' | 'events' | 'businesses', isActive: boolean, lastRun?: string) => {
    try {
      const response = await fetch('/api/admin/scraper-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, isActive, lastRun })
      });
      
      const result = await response.json();
      if (result.success) {
        // Update local state
        setScraperConfigs(prev => 
          prev.map(config => 
            config.type === type ? { ...config, ...result.config } : config
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating scraper status:', error);
      return false;
    }
  };

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

  const formatTimeFromNow = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
  };

  const formatTimeUntil = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
  };

  // Scraper management functions
  const logScraperActivity = async (
    type: 'news' | 'events' | 'businesses', 
    status: 'started' | 'completed' | 'error',
    message: string,
    duration?: number,
    itemsProcessed?: number,
    errors?: string[]
  ) => {
    try {
      await fetch('/api/admin/scraper-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          status,
          message,
          duration,
          itemsProcessed,
          errors
        })
      });
    } catch (error) {
      console.error('Error logging scraper activity:', error);
    }
  };

  const runScraper = async (type: 'news' | 'events' | 'businesses') => {
    const startTime = Date.now();
    
    try {
      setScraperStates(prev => ({
        ...prev,
        [type]: { ...prev[type], status: 'running' }
      }));

      // Update database to mark as active
      await updateScraperStatus(type, true);

      // Log scraper start
      await logScraperActivity(type, 'started', `${type} scraper initiated by admin`);

      const response = await fetch(`/api/scraper/${type}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        const lastRun = new Date().toISOString();
        
        setScraperStates(prev => ({
          ...prev,
          [type]: { status: 'idle', lastRun }
        }));

        // Update database with completion status
        await updateScraperStatus(type, false, lastRun);

        const itemsProcessed = result.data?.length || result.count || 0;
        const message = `Successfully scraped ${itemsProcessed} ${type} items`;
        
        await logScraperActivity(type, 'completed', message, duration, itemsProcessed);
        
        alert(`✅ ${type} scraper completed successfully!\n` +
              `• Items processed: ${itemsProcessed}\n` +
              `• Duration: ${(duration/1000).toFixed(1)} seconds\n` +
              `• Next scheduled run updated automatically`);
      } else {
        setScraperStates(prev => ({
          ...prev,
          [type]: { ...prev[type], status: 'error' }
        }));

        // Update database to mark as inactive
        await updateScraperStatus(type, false);

        const errorMessage = `${type} scraper failed: ${result.error || 'Unknown error'}`;
        await logScraperActivity(type, 'error', errorMessage, duration, 0, [result.error || 'Unknown error']);
        
        alert(`❌ ${type} scraper failed!\n` +
              `• Error: ${result.error || 'Unknown error'}\n` +
              `• Duration: ${(duration/1000).toFixed(1)} seconds\n` +
              `• Check logs for more details`);
      }
    } catch (_error) {
      const duration = Date.now() - startTime;
      const errorMessage = `${type} scraper crashed: Network or system error`;
      
      setScraperStates(prev => ({
        ...prev,
        [type]: { ...prev[type], status: 'error' }
      }));

      // Update database to mark as inactive
      await updateScraperStatus(type, false);

      await logScraperActivity(type, 'error', errorMessage, duration, 0, ['Network error', 'Connection failed']);
      
      alert(`💥 ${type} scraper crashed!\n` +
            `• Error: Network or system error\n` +
            `• Duration: ${(duration/1000).toFixed(1)} seconds\n` +
            `• Please check your connection and try again`);
    }
  };

  const openLogs = (type: 'news' | 'events' | 'businesses') => {
    setLogsModal({ isOpen: true, type });
  };

  const fetchComprehensiveScraperStatus = async () => {
    try {
      const response = await fetch('/api/scraper/comprehensive');
      const result = await response.json();
      
      if (result.success) {
        setComprehensiveScraperStatus({
          isRunning: false,
          lastRun: result.data.overall.lastFullScrape ? new Date(result.data.overall.lastFullScrape) : null,
          stats: result.data
        });
      }
    } catch (error) {
      console.error('Error fetching comprehensive scraper status:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const runComprehensiveScrapers = async (clearOldData = false, forceRefresh = false) => {
    try {
      setComprehensiveScraperStatus(prev => ({ ...prev, isRunning: true }));
      
      const params = new URLSearchParams();
      if (clearOldData) params.append('clearOldData', 'true');
      if (forceRefresh) params.append('forceRefresh', 'true');
      
      const response = await fetch(`/api/scraper/comprehensive?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Comprehensive scraping completed:', result.data);
        alert(`Comprehensive scraping completed successfully!\n\nSummary:\n- Total items: ${result.data.summary.totalItems}\n- New: ${result.data.summary.totalNew}\n- Updated: ${result.data.summary.totalUpdated}\n- Deleted: ${result.data.summary.totalDeleted}\n- Duration: ${result.data.summary.duration}ms`);
        
        // Refresh data
        await fetchData();
        await fetchComprehensiveScraperStatus();
      } else {
        console.error('❌ Comprehensive scraping failed:', result.error);
        alert(`Comprehensive scraping failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error running comprehensive scrapers:', error);
      alert(`Error running comprehensive scrapers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setComprehensiveScraperStatus(prev => ({ ...prev, isRunning: false }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clearAllScrapedData = async () => {
    if (!confirm('Are you sure you want to clear ALL scraped data? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/scraper/comprehensive', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ All scraped data cleared:', result.data);
        alert(`All scraped data cleared successfully!\n\nCleared:\n- Events: ${result.data.events}\n- News: ${result.data.news}\n- Businesses: ${result.data.businesses}`);
        
        // Refresh data
        await fetchData();
        await fetchComprehensiveScraperStatus();
      } else {
        console.error('❌ Failed to clear data:', result.error);
        alert(`Failed to clear data: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      alert(`Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    { id: 'business-requests', label: 'Business Requests', icon: UserCheck },
    { id: 'content', label: 'Content', icon: Newspaper },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'scrapers', label: 'Scrapers', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6 admin-dashboard">
      {/* Tab Navigation - Mobile Friendly */}
      <Card className="p-2 md:p-4">
        {/* Mobile Dropdown for small screens */}
        <div className="block md:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
            className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Select admin dashboard tab"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden md:flex md:space-x-1 md:overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-w-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                }`}
              >
                <Icon className="h-4 w-4 mr-1 lg:mr-2 flex-shrink-0" />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden text-xs">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Tab Indicator */}
        <div className="block md:hidden mt-2">
          <div className="flex items-center justify-center">
            {(() => {
              const currentTab = tabs.find(t => t.id === activeTab);
              const Icon = currentTab?.icon;
              return (
                <div className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg">
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  <span className="text-sm font-medium">{currentTab?.label}</span>
                </div>
              );
            })()}
          </div>
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

      {activeTab === 'business-requests' && (
        <BusinessRequestManager />
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

      {activeTab === 'scrapers' && (
        <div className="space-y-6">
          {/* Scraper Status Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Scraper Status Overview
            </h3>
            {configsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-600">Loading scraper configurations...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* News Scraper */}
                {(() => {
                  const config = getScraperConfig('news');
                  const isActive = config?.isActive;
                  const isEnabled = config?.isEnabled ?? true;
                  
                  return (
                    <div className={`p-4 border rounded-lg ${
                      isActive 
                        ? 'bg-green-50 border-green-200' 
                        : isEnabled 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Newspaper className={`h-5 w-5 mr-2 ${
                            isActive ? 'text-green-600' : isEnabled ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                          <span className={`font-medium ${
                            isActive ? 'text-green-900' : isEnabled ? 'text-blue-900' : 'text-gray-900'
                          }`}>News Scraper</span>
                        </div>
                        <Badge className={`${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : isEnabled 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Running' : isEnabled ? 'Scheduled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className={`text-sm mt-2 ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Last run: {formatTimeFromNow(config?.lastRun)}
                      </p>
                      <p className={`text-sm ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Interval: {config?.intervalHours ? `${config.intervalHours} hours` : 'Not set'}
                      </p>
                      <p className={`text-sm ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Next run: {formatTimeUntil(config?.nextRun)}
                      </p>
                    </div>
                  );
                })()}

                {/* Events Scraper */}
                {(() => {
                  const config = getScraperConfig('events');
                  const isActive = config?.isActive;
                  const isEnabled = config?.isEnabled ?? true;
                  
                  return (
                    <div className={`p-4 border rounded-lg ${
                      isActive 
                        ? 'bg-green-50 border-green-200' 
                        : isEnabled 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className={`h-5 w-5 mr-2 ${
                            isActive ? 'text-green-600' : isEnabled ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                          <span className={`font-medium ${
                            isActive ? 'text-green-900' : isEnabled ? 'text-blue-900' : 'text-gray-900'
                          }`}>Events Scraper</span>
                        </div>
                        <Badge className={`${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : isEnabled 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Running' : isEnabled ? 'Scheduled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className={`text-sm mt-2 ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Last run: {formatTimeFromNow(config?.lastRun)}
                      </p>
                      <p className={`text-sm ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Interval: {config?.intervalHours ? `${config.intervalHours} hours` : 'Not set'}
                      </p>
                      <p className={`text-sm ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Next run: {formatTimeUntil(config?.nextRun)}
                      </p>
                    </div>
                  );
                })()}

                {/* Business Scraper */}
                {(() => {
                  const config = getScraperConfig('businesses');
                  const isActive = config?.isActive;
                  const isEnabled = config?.isEnabled ?? true;
                  
                  return (
                    <div className={`p-4 border rounded-lg ${
                      isActive 
                        ? 'bg-green-50 border-green-200' 
                        : isEnabled 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Building className={`h-5 w-5 mr-2 ${
                            isActive ? 'text-green-600' : isEnabled ? 'text-orange-600' : 'text-gray-600'
                          }`} />
                          <span className={`font-medium ${
                            isActive ? 'text-green-900' : isEnabled ? 'text-orange-900' : 'text-gray-900'
                          }`}>Business Scraper</span>
                        </div>
                        <Badge className={`${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : isEnabled 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Running' : isEnabled ? 'Scheduled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className={`text-sm mt-2 ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-orange-700' : 'text-gray-700'
                      }`}>
                        Last run: {formatTimeFromNow(config?.lastRun)}
                      </p>
                      <p className={`text-sm ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-orange-700' : 'text-gray-700'
                      }`}>
                        Interval: {config?.intervalHours ? `${config.intervalHours} hours` : 'Not set'}
                      </p>
                      <p className={`text-sm ${
                        isActive ? 'text-green-700' : isEnabled ? 'text-orange-700' : 'text-gray-700'
                      }`}>
                        Next run: {formatTimeUntil(config?.nextRun)}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>

          {/* Manual Scraper Controls */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Manual Controls & Configuration
            </h3>
            
            {configsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-600">Loading configurations...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* News Scraper Config */}
                {(() => {
                  const config = getScraperConfig('news');
                  const isRunning = scraperStates.news.status === 'running';
                  
                  return (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Newspaper className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="font-medium text-gray-900">News Scraper</h4>
                        </div>
                        <div className={`flex items-center text-sm ${
                          isRunning ? 'text-green-600' : 
                          scraperStates.news.status === 'error' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            isRunning ? 'bg-green-500' : 
                            scraperStates.news.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                          }`}></div>
                          {isRunning ? 'Running' : 
                           scraperStates.news.status === 'error' ? 'Error' : 'Idle'}
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Interval</label>
                          <select 
                            value={config?.intervalHours || 6}
                            onChange={(e) => updateScraperConfig('news', { intervalHours: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isRunning}
                            aria-label="News scraper interval"
                          >
                            <option value="1">Every 1 hour</option>
                            <option value="2">Every 2 hours</option>
                            <option value="4">Every 4 hours</option>
                            <option value="6">Every 6 hours</option>
                            <option value="12">Every 12 hours</option>
                            <option value="24">Daily</option>
                          </select>
                        </div>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={config?.isEnabled || false}
                            onChange={(e) => updateScraperConfig('news', { isEnabled: e.target.checked })}
                            className="mr-2" 
                            disabled={isRunning}
                          />
                          <span className="text-sm text-gray-700">Auto-schedule enabled</span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        {isRunning ? (
                          <Button size="sm" className="w-full" disabled>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Running...
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => runScraper('news')}
                          >
                            Run Now
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => openLogs('news')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Events Scraper Config */}
                {(() => {
                  const config = getScraperConfig('events');
                  const isRunning = scraperStates.events.status === 'running';
                  
                  return (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-green-600 mr-2" />
                          <h4 className="font-medium text-gray-900">Events Scraper</h4>
                        </div>
                        <div className={`flex items-center text-sm ${
                          isRunning ? 'text-green-600' : 
                          scraperStates.events.status === 'error' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            isRunning ? 'bg-green-500' : 
                            scraperStates.events.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                          }`}></div>
                          {isRunning ? 'Running' : 
                           scraperStates.events.status === 'error' ? 'Error' : 'Idle'}
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Interval</label>
                          <select 
                            value={config?.intervalHours || 6}
                            onChange={(e) => updateScraperConfig('events', { intervalHours: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={isRunning}
                            aria-label="Events scraper interval"
                          >
                            <option value="1">Every 1 hour</option>
                            <option value="2">Every 2 hours</option>
                            <option value="4">Every 4 hours</option>
                            <option value="6">Every 6 hours</option>
                            <option value="12">Every 12 hours</option>
                            <option value="24">Daily</option>
                          </select>
                        </div>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={config?.isEnabled || false}
                            onChange={(e) => updateScraperConfig('events', { isEnabled: e.target.checked })}
                            className="mr-2" 
                            disabled={isRunning}
                          />
                          <span className="text-sm text-gray-700">Auto-schedule enabled</span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        {isRunning ? (
                          <Button size="sm" className="w-full" disabled>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Running...
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => runScraper('events')}
                          >
                            Run Now
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => openLogs('events')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Business Scraper Config */}
                {(() => {
                  const config = getScraperConfig('businesses');
                  const isRunning = scraperStates.businesses.status === 'running';
                  
                  return (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-purple-600 mr-2" />
                          <h4 className="font-medium text-gray-900">Business Scraper</h4>
                        </div>
                        <div className={`flex items-center text-sm ${
                          isRunning ? 'text-green-600' : 
                          scraperStates.businesses.status === 'error' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            isRunning ? 'bg-green-500' : 
                            scraperStates.businesses.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                          }`}></div>
                          {isRunning ? 'Running' : 
                           scraperStates.businesses.status === 'error' ? 'Error' : 'Idle'}
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Interval</label>
                          <select 
                            value={config?.intervalHours || 168}
                            onChange={(e) => updateScraperConfig('businesses', { intervalHours: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={isRunning}
                            aria-label="Business scraper interval"
                          >
                            <option value="12">Every 12 hours</option>
                            <option value="24">Daily</option>
                            <option value="72">Every 3 days</option>
                            <option value="168">Weekly</option>
                            <option value="720">Monthly</option>
                          </select>
                        </div>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={config?.isEnabled || false}
                            onChange={(e) => updateScraperConfig('businesses', { isEnabled: e.target.checked })}
                            className="mr-2" 
                            disabled={isRunning}
                          />
                          <span className="text-sm text-gray-700">Auto-schedule enabled</span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        {isRunning ? (
                          <Button size="sm" className="w-full" disabled>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Running...
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => runScraper('businesses')}
                          >
                            Run Now
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => openLogs('businesses')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Configuration Notes:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Changes are saved automatically when you modify settings</li>
                <li>• Disabling auto-schedule prevents automatic runs but allows manual execution</li>
                <li>• Interval changes take effect after the current scheduled run completes</li>
                <li>• Manual &quot;Run Now&quot; works regardless of enabled status</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* Scraper Logs Modal */}
      {logsModal.isOpen && logsModal.type && (
        <ScraperLogs 
          type={logsModal.type}
          isOpen={logsModal.isOpen}
          onClose={() => setLogsModal({ isOpen: false, type: null })}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
