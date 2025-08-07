'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import BusinessRequestManager from './BusinessRequestManager';
import OfferCodeManager from './OfferCodeManager';
import { UserManagement } from './UserManagement';
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
  Activity,
  Ticket
} from 'lucide-react';
import type { Business, Event, NewsArticle, BusinessCategory, SubscriptionTier } from '@/types';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'business-requests' | 'content' | 'users' | 'offer-codes' | 'scrapers' | 'settings'>('overview');
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

  // Business management state
  const [businessFilter, setBusinessFilter] = useState<'all' | 'claimed' | 'premium' | 'unclaimed'>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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
      
      // Fetch ALL businesses for admin dashboard
      const businessResponse = await fetch('/api/businesses?limit=1000'); // Get all businesses
      const businessData = await businessResponse.json();

      // Fetch analytics data
      const analyticsResponse = await fetch('/api/businesses/analytics');
      const analyticsData = await analyticsResponse.json();

      // Fetch recent content
      const eventsResponse = await fetch('/api/events?limit=10');
      const eventsData = await eventsResponse.json();

      const newsResponse = await fetch('/api/news?limit=10');
      const newsData = await newsResponse.json();

      if (businessData.success && analyticsData.success && eventsData.success && newsData.success) {
        const businesses = Array.isArray(businessData.data?.businesses) ? businessData.data.businesses : [];
        
        setData({
          businesses,
          events: eventsData.data || [],
          news: newsData.data || [],
          recentClaims: analyticsData.data?.recentActivity?.claims || [],
          categoryStats: analyticsData.data?.categories || []
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

  const _handleBusinessAction = async (businessId: string, action: 'approve' | 'reject' | 'feature') => {
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

  // Business management functions
  const getFilteredBusinesses = () => {
    if (!data || !Array.isArray(data.businesses)) return [];
    
    switch (businessFilter) {
      case 'claimed':
        return data.businesses.filter(b => b.isClaimed);
      case 'premium':
        return data.businesses.filter(b => b.subscriptionTier && b.subscriptionTier !== 'free');
      case 'unclaimed':
        return data.businesses.filter(b => !b.isClaimed);
      default:
        return data.businesses;
    }
  };

  const refreshBusinessData = async () => {
    setLoading(true);
    try {
      // Fetch ALL businesses for admin dashboard
      const businessResponse = await fetch('/api/businesses?limit=1000');
      const businessData = await businessResponse.json();

      if (businessData.success && data) {
        setData({
          ...data,
          businesses: Array.isArray(businessData.data?.businesses) ? businessData.data.businesses : []
        });
      }
    } catch (error) {
      console.error('Error refreshing business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportBusinessData = () => {
    if (!data || !Array.isArray(data.businesses)) return;
    
    const businessData = data.businesses.map(business => ({
      id: business.id,
      name: business.name,
      category: business.category,
      address: business.address,
      phone: business.phone,
      email: business.email,
      website: business.website,
      isClaimed: business.isClaimed,
      claimedBy: business.claimedBy,
      subscriptionTier: business.subscriptionTier,
      subscriptionStatus: business.subscriptionStatus,
      revenue: business.subscriptionTier === 'platinum' ? 79.99 :
               business.subscriptionTier === 'gold' ? 39.99 :
               business.subscriptionTier === 'silver' ? 19.99 : 0,
      featured: business.featured,
      verified: business.verified,
      views: business.analytics?.views || 0,
      clicks: business.analytics?.clicks || 0
    }));

    const csv = [
      Object.keys(businessData[0]).join(','),
      ...businessData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const viewBusinessDetails = (business: Business) => {
    setSelectedBusiness(business);
    setShowBusinessModal(true);
  };

  const editBusinessSubscription = (business: Business) => {
    setSelectedBusiness(business);
    setShowSubscriptionModal(true);
  };

  const toggleBusinessFeature = async (businessId: string, feature: 'featured' | 'verified') => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `toggle_${feature}` })
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setData(prev => prev && Array.isArray(prev.businesses) ? {
          ...prev,
          businesses: prev.businesses.map(b => 
            b.id === businessId 
              ? { ...b, [feature]: !b[feature] }
              : b
          )
        } : prev);
      } else {
        alert(`Failed to toggle ${feature}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error toggling ${feature}:`, error);
      alert(`Error toggling ${feature}`);
    }
  };

  const deleteUnclaimed = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this unclaimed business? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        // Remove from local state
        setData(prev => prev ? {
          ...prev,
          businesses: prev.businesses.filter(b => b.id !== businessId)
        } : null);
        alert('Business deleted successfully');
      } else {
        alert(`Failed to delete business: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Error deleting business');
    }
  };

  const handleBusinessUpdate = (updatedBusiness: Business) => {
    setData(prev => prev && Array.isArray(prev.businesses) ? {
      ...prev,
      businesses: prev.businesses.map(b => 
        b.id === updatedBusiness.id ? updatedBusiness : b
      )
    } : prev);
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
    { id: 'offer-codes', label: 'Offer Codes', icon: Ticket },
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
              {Array.isArray(data.categoryStats) ? data.categoryStats.slice(0, 8).map((category) => (
                <div key={category._id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{category._id}</span>
                    <div className="text-sm text-gray-700">
                      {category.claimed} claimed • {category.premium} premium
                    </div>
                  </div>
                  <Badge variant="secondary">{category.total}</Badge>
                </div>
              )) : null}
            </div>
          </Card>

          {/* Recent Claims */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Business Claims</h3>
            <div className="space-y-3">
              {Array.isArray(data.recentClaims) ? data.recentClaims.slice(0, 5).map((business) => (
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
              )) : null}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'businesses' && !loading && data && (
        <div className="space-y-6">
          {/* Business Management Header */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Management</h3>
                <p className="text-sm text-gray-600">Manage all businesses, subscriptions, and premium features</p>
              </div>
              <div className="flex space-x-3">
                <Button size="sm" variant="outline" onClick={refreshBusinessData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button size="sm" variant="outline" onClick={exportBusinessData}>
                  Export Data
                </Button>
              </div>
            </div>
            
            {/* Business Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Array.isArray(data.businesses) ? data.businesses.filter(b => b.isClaimed).length : 0}
                </div>
                <div className="text-sm text-blue-800">Claimed Businesses</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Array.isArray(data.businesses) ? data.businesses.filter(b => b.subscriptionTier && b.subscriptionTier !== 'free').length : 0}
                </div>
                <div className="text-sm text-green-800">Premium Subscribers</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  $
                  {Array.isArray(data.businesses) ? data.businesses
                    .filter(b => b.subscriptionTier && b.subscriptionTier !== 'free')
                    .reduce((total, b) => {
                      const prices = { silver: 19.99, gold: 39.99, platinum: 79.99 };
                      return total + (prices[b.subscriptionTier as keyof typeof prices] || 0);
                    }, 0)
                    .toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-purple-800">Monthly Revenue</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {Array.isArray(data.businesses) ? data.businesses.filter(b => !b.isClaimed).length : 0}
                </div>
                <div className="text-sm text-yellow-800">Unclaimed Listings</div>
              </div>
            </div>

            {/* Business Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                size="sm" 
                variant={businessFilter === 'all' ? 'primary' : 'outline'}
                onClick={() => setBusinessFilter('all')}
              >
                All ({Array.isArray(data.businesses) ? data.businesses.length : 0})
              </Button>
              <Button 
                size="sm" 
                variant={businessFilter === 'claimed' ? 'primary' : 'outline'}
                onClick={() => setBusinessFilter('claimed')}
              >
                Claimed ({Array.isArray(data.businesses) ? data.businesses.filter(b => b.isClaimed).length : 0})
              </Button>
              <Button 
                size="sm" 
                variant={businessFilter === 'premium' ? 'primary' : 'outline'}
                onClick={() => setBusinessFilter('premium')}
              >
                Premium ({Array.isArray(data.businesses) ? data.businesses.filter(b => b.subscriptionTier && b.subscriptionTier !== 'free').length : 0})
              </Button>
              <Button 
                size="sm" 
                variant={businessFilter === 'unclaimed' ? 'primary' : 'outline'}
                onClick={() => setBusinessFilter('unclaimed')}
              >
                Unclaimed ({Array.isArray(data.businesses) ? data.businesses.filter(b => !b.isClaimed).length : 0})
              </Button>
            </div>
            
            {/* Business Cards Grid */}
            <div className="space-y-4">
              {getFilteredBusinesses().slice(0, 20).map((business) => (
                <Card key={business.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Business Details */}
                    <div className="lg:col-span-1">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg mb-1">{business.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{business.category}</p>
                          <p className="text-xs text-gray-500 mb-3">{business.address}</p>
                          <div className="flex flex-wrap gap-1">
                            {business.verified && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">✓ Verified</Badge>
                            )}
                            {business.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">⭐ Featured</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Owner & Status */}
                    <div className="lg:col-span-1">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={business.isClaimed ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>
                            {business.isClaimed ? 'Claimed' : 'Unclaimed'}
                          </Badge>
                        </div>
                        {business.claimedBy && (
                          <div>
                            <p className="text-xs text-gray-500">Owner:</p>
                            <p className="text-sm text-gray-700 font-medium">{business.claimedBy}</p>
                          </div>
                        )}
                        {business.claimedAt && (
                          <div>
                            <p className="text-xs text-gray-500">Claimed:</p>
                            <p className="text-sm text-gray-700">{new Date(business.claimedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subscription */}
                    <div className="lg:col-span-1">
                      <div className="space-y-2">
                        <Badge className={`${
                          business.subscriptionTier === 'platinum' ? 'bg-purple-600 text-white' :
                          business.subscriptionTier === 'gold' ? 'bg-yellow-500 text-black' :
                          business.subscriptionTier === 'silver' ? 'bg-gray-400 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {business.subscriptionTier === 'platinum' ? 'PLATINUM' :
                           business.subscriptionTier === 'gold' ? 'GOLD' :
                           business.subscriptionTier === 'silver' ? 'SILVER' :
                           'FREE'}
                        </Badge>
                        {business.subscriptionEnd && business.subscriptionTier !== 'free' && (
                          <div>
                            <p className="text-xs text-gray-500">Expires:</p>
                            <p className="text-sm text-gray-700">{new Date(business.subscriptionEnd).toLocaleDateString()}</p>
                          </div>
                        )}
                        {business.subscriptionTier && business.subscriptionTier !== 'free' && (
                          <div>
                            <p className="text-xs text-gray-500">Revenue:</p>
                            <p className="text-sm font-semibold text-green-600">
                              ${business.subscriptionTier === 'platinum' ? '79.99' :
                                business.subscriptionTier === 'gold' ? '39.99' :
                                business.subscriptionTier === 'silver' ? '19.99' : '0.00'}/mo
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions & Analytics */}
                    <div className="lg:col-span-1">
                      <div className="space-y-3">
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewBusinessDetails(business)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          
                          {business.isClaimed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editBusinessSubscription(business)}
                              className="text-xs"
                            >
                              Subscription
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant={business.featured ? "default" : "outline"}
                            onClick={() => toggleBusinessFeature(business.id, 'featured')}
                            className="text-xs"
                          >
                            {business.featured ? 'Unfeature' : 'Feature'}
                          </Button>
                          
                          {business.isClaimed && (
                            <Button
                              size="sm"
                              variant={business.verified ? "default" : "outline"}
                              onClick={() => toggleBusinessFeature(business.id, 'verified')}
                              className="text-xs"
                            >
                              {business.verified ? 'Unverify' : 'Verify'}
                            </Button>
                          )}
                          
                          {!business.isClaimed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${business.name}"? This action cannot be undone.`)) {
                                  deleteUnclaimed(business.id);
                                }
                              }}
                              className="text-xs text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                        
                        {/* Analytics - Compact */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Analytics</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Views:</span>
                              <span className="font-medium">{business.analytics?.views || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Clicks:</span>
                              <span className="font-medium">{business.analytics?.clicks || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Calls:</span>
                              <span className="font-medium">{business.analytics?.callClicks || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {getFilteredBusinesses().length > 20 && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm">
                  Load More Businesses
                </Button>
              </div>
            )}
          </Card>

          {/* Business Management Modals */}
          {selectedBusiness && (
            <BusinessManagementModal 
              business={selectedBusiness}
              isOpen={showBusinessModal}
              onClose={() => {
                setShowBusinessModal(false);
                setSelectedBusiness(null);
              }}
              onUpdate={handleBusinessUpdate}
            />
          )}

          {selectedBusiness && (
            <SubscriptionManagementModal
              business={selectedBusiness}
              isOpen={showSubscriptionModal}
              onClose={() => {
                setShowSubscriptionModal(false);
                setSelectedBusiness(null);
              }}
              onUpdate={handleBusinessUpdate}
            />
          )}
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
              {Array.isArray(data.events) ? data.events.slice(0, 5).map((event) => (
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
              )) : null}
            </div>
          </Card>

          {/* News */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Newspaper className="h-5 w-5 mr-2" />
              Recent News
            </h3>
            <div className="space-y-3">
              {Array.isArray(data.news) ? data.news.slice(0, 5).map((article) => (
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
              )) : null}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <UserManagement />
      )}

      {activeTab === 'offer-codes' && (
        <OfferCodeManager />
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

// Business Management Modal Component
interface BusinessManagementModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (business: Business) => void;
}

const BusinessManagementModal: React.FC<BusinessManagementModalProps> = ({
  business,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description,
    category: business.category,
    address: business.address,
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        onUpdate(result.data);
        onClose();
        alert('Business updated successfully');
      } else {
        alert(`Failed to update business: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating business:', error);
      alert('Error updating business');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Business Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter business description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as BusinessCategory })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Business Category"
              >
                <option value="restaurant">Restaurant</option>
                <option value="retail">Retail</option>
                <option value="automotive">Automotive</option>
                <option value="health">Health</option>
                <option value="professional">Professional</option>
                <option value="home-services">Home Services</option>
                <option value="beauty">Beauty</option>
                <option value="recreation">Recreation</option>
                <option value="education">Education</option>
                <option value="non-profit">Non-Profit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter business address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter website URL"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Subscription Management Modal Component
interface SubscriptionManagementModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (business: Business) => void;
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  business,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [newTier, setNewTier] = useState(business.subscriptionTier || 'free');
  const [duration, setDuration] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/businesses/${business.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tier: newTier,
          duration: duration
        })
      });

      const result = await response.json();
      if (result.success) {
        onUpdate(result.data);
        onClose();
        alert('Subscription updated successfully');
      } else {
        alert(`Failed to update subscription: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Error updating subscription');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Manage Subscription</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Business: {business.name}</p>
          <p className="text-sm text-gray-600">Current Tier: {business.subscriptionTier || 'free'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Subscription Tier
            </label>
            <select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as SubscriptionTier)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Subscription Tier"
            >
              <option value="free">Free ($0/month)</option>
              <option value="silver">Silver ($19.99/month)</option>
              <option value="gold">Gold ($39.99/month)</option>
              <option value="platinum">Platinum ($79.99/month)</option>
            </select>
          </div>

          {newTier !== 'free' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (months)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter duration in months"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating...' : 'Update Subscription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
