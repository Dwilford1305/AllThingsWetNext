'use client';

import { useState, useEffect } from 'react';
import { computeNextScheduledRun, formatCountdown } from '@/lib/scheduling';
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
  Ticket,
  Flag,
  AlertTriangle,
  TestTube,
  EyeOff,
  Monitor,
  Zap,
  Mail,
  Send,
  TrendingUp
} from 'lucide-react';
import type { Business, Event, NewsArticle, BusinessCategory, SubscriptionTier, Report as ReportType } from '@/types';
import ScraperLogs from './ScraperLogs';
import { csrfFetch } from '@/lib/csrf';

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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'business-requests' | 'content' | 'users' | 'offer-codes' | 'ads' | 'scrapers' | 'email-analytics' | 'settings' | 'reports' | 'test-business'>('overview');
  const [data, setData] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Scraper configurations from database
  const [scraperConfigs, setScraperConfigs] = useState<ScraperConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);

  // Test business management state
  const [testBusinessState, setTestBusinessState] = useState<{
    exists: boolean;
    business?: Business;
    loading: boolean;
    isHidden: boolean;
    adsVisible: boolean;
  }>({
    exists: false,
    loading: true,
    isHidden: false,
    adsVisible: true
  });

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

  // Comprehensive scraper status
  const [comprehensiveScraperStatus, setComprehensiveScraperStatus] = useState<{
    isRunning: boolean;
    lastRun: Date | null;
    stats: any;
  }>({
    isRunning: false,
    lastRun: null,
    stats: null
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

  // Ad management state
  const [adData, setAdData] = useState<{
    silver: Record<string, unknown>[];
    gold: Record<string, unknown>[];
    platinum: Record<string, unknown>[];
    loading: boolean;
  }>({
    silver: [],
    gold: [],
    platinum: [],
    loading: true
  });

  // Comprehensive scraper state
  // Email analytics state
  const [emailAnalytics, setEmailAnalytics] = useState<{
    overview: {
      totalEmailsSent: number;
      overallOpenRate: number;
      overallClickRate: number;
      overallBounceRate: number;
      timeRange: number;
    };
    emailsByTemplate: Array<{ _id: string; count: number }>;
    openRates: Array<{ _id: string; total: number; opened: number; openRate: number }>;
    clickRates: Array<{ _id: string; total: number; clicked: number; clickRate: number }>;
    queueStats: Record<string, number>;
    preferencesStats: {
      totalUsers: number;
      marketingOptIn: number;
      newsletterOptIn: number;
      eventNotificationsOptIn: number;
      pushNotificationsEnabled: number;
      unsubscribedAll: number;
    };
    pushStats: {
      totalSubscriptions: number;
      activeSubscriptions: number;
      totalSent: number;
    };
    dailyActivity: Array<{
      _id: { year: number; month: number; day: number };
      sent: number;
      opened: number;
      clicked: number;
      bounced: number;
    }>;
    recentEmails: Array<{
      templateType: string;
      recipientEmail: string;
      sentAt: string;
      opened: boolean;
      clicked: boolean;
      deliveryStatus: string;
    }>;
    loading: boolean;
  }>({
    overview: { totalEmailsSent: 0, overallOpenRate: 0, overallClickRate: 0, overallBounceRate: 0, timeRange: 30 },
    emailsByTemplate: [],
    openRates: [],
    clickRates: [],
    queueStats: {},
    preferencesStats: { totalUsers: 0, marketingOptIn: 0, newsletterOptIn: 0, eventNotificationsOptIn: 0, pushNotificationsEnabled: 0, unsubscribedAll: 0 },
    pushStats: { totalSubscriptions: 0, activeSubscriptions: 0, totalSent: 0 },
    dailyActivity: [],
    recentEmails: [],
    loading: true
  });



  useEffect(() => {
    fetchData();
    fetchScraperConfigs();
    fetchTestBusinessStatus();
    // Fetch email analytics when email analytics tab is active
    if (activeTab === 'email-analytics') {
      fetchEmailAnalytics();
    }
    // Poll scraper configs every 60s to show near real-time status & next run countdown
    const interval = setInterval(() => {
      fetchScraperConfigs();
    }, 60000);
    return () => clearInterval(interval);
    // Intentionally omitting fetchData and fetchScraperConfigs from dependencies to avoid re-running effect on every render.
    // These functions are defined after useEffect and are stable in this context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch ads when ads tab is active
  useEffect(() => {
    if (activeTab === 'ads') {
      fetchAds();
    }
  }, [activeTab]);

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
  const response = await fetch('/api/admin/scraper-config', { credentials: 'include' });
      const result = await response.json();
      
      if (result.success) {
        setScraperConfigs(result.configs);
        
        // Sync scraper states with database isActive status
        setScraperStates(prev => {
          const newStates = { ...prev };
          result.configs.forEach((config: ScraperConfig) => {
            if (config.type === 'news' || config.type === 'events' || config.type === 'businesses') {
              newStates[config.type] = {
                ...prev[config.type],
                status: config.isActive ? 'running' : 'idle',
                lastRun: config.lastRun || prev[config.type].lastRun
              };
            }
          });
          return newStates;
        });
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

      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch('/api/admin/scraper-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
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
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch('/api/admin/scraper-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
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

  // -------------------- Reports (Moderation) State & Helpers --------------------
  const fetchTestBusinessStatus = async () => {
    try {
      setTestBusinessState(prev => ({ ...prev, loading: true }));
      
      const response = await fetch('/api/admin/setup-test-business', { 
        credentials: 'include' 
      });
      const result = await response.json();
      
      if (result.success) {
        const testBusiness = result.data?.testBusiness;
        setTestBusinessState({
          exists: result.data?.testBusinessExists || false,
          business: testBusiness,
          loading: false,
          isHidden: testBusiness?.isHidden || false,
          adsVisible: testBusiness?.adsVisible !== false // Default to true if not set
        });
      } else {
        setTestBusinessState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching test business status:', error);
      setTestBusinessState(prev => ({ ...prev, loading: false }));
    }
  };

  const createOrClaimTestBusiness = async () => {
    try {
      setTestBusinessState(prev => ({ ...prev, loading: true }));
      
      // For super admin, we'll use a simplified approach - just call the existing endpoint
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch('/api/admin/setup-test-business', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf || ''
        },
        credentials: 'include',
        body: JSON.stringify({ 
          setupPassword: 'super-admin-dashboard-request' // Special identifier for dashboard requests
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchTestBusinessStatus(); // Refresh status
        alert('✅ Test business created and claimed successfully!');
      } else {
        alert(`❌ Failed to create test business: ${result.error}`);
        setTestBusinessState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error creating test business:', error);
      alert('❌ Error creating test business');
      setTestBusinessState(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleTestBusinessVisibility = async () => {
    try {
      const newHiddenState = !testBusinessState.isHidden;
      
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch('/api/admin/test-business/visibility', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf || ''
        },
        credentials: 'include',
        body: JSON.stringify({ isHidden: newHiddenState })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestBusinessState(prev => ({ 
          ...prev, 
          isHidden: newHiddenState 
        }));
        alert(`✅ Test business is now ${newHiddenState ? 'hidden from' : 'visible in'} the directory`);
      } else {
        alert(`❌ Failed to toggle visibility: ${result.error}`);
      }
    } catch (error) {
      console.error('Error toggling test business visibility:', error);
      alert('❌ Error toggling visibility');
    }
  };

  const toggleAdVisibility = async () => {
    try {
      const newAdsState = !testBusinessState.adsVisible;
      
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch('/api/admin/test-business/ads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf || ''
        },
        credentials: 'include',
        body: JSON.stringify({ adsVisible: newAdsState })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestBusinessState(prev => ({ 
          ...prev, 
          adsVisible: newAdsState 
        }));
        alert(`✅ Ads are now ${newAdsState ? 'visible' : 'hidden'} - refresh pages to see changes`);
      } else {
        alert(`❌ Failed to toggle ads: ${result.error}`);
      }
    } catch (error) {
      console.error('Error toggling ad visibility:', error);
      alert('❌ Error toggling ad visibility');
    }
  };

  // Fetch email analytics
  const fetchEmailAnalytics = async (days = 30) => {
    setEmailAnalytics(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/email?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setEmailAnalytics({
          ...result.data,
          loading: false
        });
      } else {
        console.error('Failed to fetch email analytics:', result.error);
        setEmailAnalytics(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching email analytics:', error);
      setEmailAnalytics(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle email queue actions
  const handleEmailAction = async (action: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchEmailAnalytics(); // Refresh data
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error performing email action:', error);
      alert('Error performing action');
    }
  };

  // Ad management functions
  const fetchAds = async () => {
    setAdData(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/ads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        // Group ads by tier
        const adsByTier = {
          silver: result.data.filter((ad: Record<string, unknown>) => ad.tier === 'silver'),
          gold: result.data.filter((ad: Record<string, unknown>) => ad.tier === 'gold'),
          platinum: result.data.filter((ad: Record<string, unknown>) => ad.tier === 'platinum'),
          loading: false
        };
        setAdData(adsByTier);
      } else {
        console.error('Failed to fetch ads:', result.error);
        setAdData(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      setAdData(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleAdVisibilityById = async (adId: string, currentVisibility: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/ads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adId,
          isVisible: !currentVisibility
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ Ad ${!currentVisibility ? 'shown' : 'hidden'} successfully`);
        fetchAds(); // Refresh ads
      } else {
        alert(`❌ Failed to update ad: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating ad visibility:', error);
      alert('❌ Error updating ad visibility');
    }
  };
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string>('');
  const [reports, setReports] = useState<ReportType[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<'pending' | 'resolved' | 'dismissed' | 'all'>('pending');
  const [reportTypeFilter, setReportTypeFilter] = useState<'listing' | 'comment' | 'all'>('all');
  const [reportPage, setReportPage] = useState(1);
  const [reportLimit] = useState(25);
  const [reportTotal, setReportTotal] = useState(0);

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      setReportsError('');
      const params = new URLSearchParams();
      if (reportStatusFilter) params.append('status', reportStatusFilter);
      if (reportTypeFilter !== 'all') params.append('type', reportTypeFilter);
      params.append('page', String(reportPage));
      params.append('limit', String(reportLimit));

      const response = await fetch(`/api/admin/reports?${params.toString()}`, { credentials: 'include' });
      const result = await response.json();
      if (result.success) {
        setReports(Array.isArray(result.data) ? result.data : (result.data?.reports || []));
        const total = result.pagination?.total ?? result.total ?? (Array.isArray(result.data) ? result.data.length : 0);
        setReportTotal(total);
      } else {
        setReportsError(result.error || 'Failed to load reports');
      }
    } catch (error) {
      setReportsError(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch reports when tab or filters change
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportStatusFilter, reportTypeFilter, reportPage]);

  const actOnReport = async (
    reportId: string,
  opts: { status?: 'pending' | 'resolved' | 'dismissed'; action?: 'dismiss' | 'hide' | 'remove' | 'unhide'; adminNotes?: string; reason?: string }
  ) => {
    try {
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
        body: JSON.stringify(opts)
      });
      const result = await response.json();
      if (result.success) {
        // Optimistic update: remove or update report in list
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: opts.status || r.status, adminNotes: opts.adminNotes || r.adminNotes } : r));
        // If resolved or dismissed, optionally filter out when viewing pending
        if ((opts.status === 'resolved' || opts.status === 'dismissed') && reportStatusFilter === 'pending') {
          setReports(prev => prev.filter(r => r.id !== reportId));
        }
        return true;
      } else {
        alert(result.error || 'Failed to update report');
        return false;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update report');
      return false;
    }
  };

  const _handleBusinessAction = async (businessId: string, action: 'approve' | 'reject' | 'feature') => {
    try {
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
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
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
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
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf || '' },
        credentials: 'include'
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
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch(`/api/admin/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
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

  // Compute next run using fixed policy (6 AM MT daily for news/events, weekly Monday for businesses).
  const computePolicyNextRun = (type: 'news' | 'events' | 'businesses') => {
    const config = getScraperConfig(type);
    const enabled = config?.isEnabled ?? true;
    return computeNextScheduledRun(type, new Date(), enabled, config?.nextRun);
  };

  const formatPolicyCountdown = (type: 'news' | 'events' | 'businesses') => {
    const next = computePolicyNextRun(type);
    if (!next) return 'Disabled';
    return formatCountdown(next);
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
      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      await fetch('/api/admin/scraper-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
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

      const csrf = document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1];
      const response = await fetch(`/api/scraper/${type}`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf || '' },
        credentials: 'include'
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

        // Determine items processed across different scraper response shapes
        let itemsProcessed = 0;
        if (type === 'news' && result.data) {
          itemsProcessed = typeof result.data.total === 'number' ? result.data.total : ((result.data.new || 0) + (result.data.updated || 0));
        } else if (type === 'events' && result.data) {
          itemsProcessed = typeof result.data.total === 'number' ? result.data.total : ((result.data.new || 0) + (result.data.updated || 0));
        } else if (type === 'businesses' && result.data) {
          itemsProcessed = typeof result.data.total === 'number' ? result.data.total : ((result.data.new || 0) + (result.data.updated || 0));
        } else if (result.data?.summary?.totalItems) {
          // Comprehensive fallback (shouldn't hit here for individual scrapers)
          itemsProcessed = result.data.summary.totalItems;
        }
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
      
      const response = await csrfFetch(`/api/scraper/comprehensive?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
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
      const response = await csrfFetch('/api/scraper/comprehensive', {
        method: 'DELETE',
        credentials: 'include'
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
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'offer-codes', label: 'Offer Codes', icon: Ticket },
    { id: 'ads', label: 'Ad Management', icon: Zap },
    { id: 'test-business', label: 'Test Business', icon: TestTube },
    { id: 'scrapers', label: 'Scrapers', icon: Activity },
    { id: 'email-analytics', label: 'Email Analytics', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6 admin-dashboard">
      {/* Tab Navigation - Mobile Friendly */}
      <Card className="p-2 md:p-4 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
        {/* Mobile Dropdown for small screens */}
        <div className="block md:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent backdrop-blur-sm"
            title="Select admin dashboard tab"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id} className="bg-slate-800 text-white">
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
                className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 min-w-0 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                    : 'text-blue-200 hover:text-white hover:bg-white/20 border border-transparent hover:border-white/20 backdrop-blur-sm hover:bg-gradient-to-r hover:from-primary-400/20 hover:to-secondary-400/20'
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
                <div className="flex items-center px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg shadow-md">
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
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Business Categories</h3>
            <div className="space-y-3">
              {Array.isArray(data.categoryStats) ? data.categoryStats.slice(0, 8).map((category) => (
                <div key={category._id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{category._id}</span>
                    <div className="text-sm text-blue-200">
                      {category.claimed} claimed • {category.premium} premium
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-blue-200 border-white/20">{category.total}</Badge>
                </div>
              )) : null}
            </div>
          </Card>

          {/* Recent Claims */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Business Claims</h3>
            <div className="space-y-3">
              {Array.isArray(data.recentClaims) ? data.recentClaims.slice(0, 5).map((business) => (
                <div key={business.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{business.name}</span>
                    <div className="text-sm text-blue-200">
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
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Business Management</h3>
                <p className="text-sm text-blue-200">Manage all businesses, subscriptions, and premium features</p>
              </div>
              <div className="flex space-x-3">
                <Button size="sm" variant="outline" onClick={refreshBusinessData} className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button size="sm" variant="outline" onClick={exportBusinessData} className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900">
                  Export Data
                </Button>
              </div>
            </div>
            
            {/* Business Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-500/20 p-4 rounded-lg backdrop-blur-sm border border-blue-400/20">
                <div className="text-2xl font-bold text-blue-300">
                  {Array.isArray(data.businesses) ? data.businesses.filter(b => b.isClaimed).length : 0}
                </div>
                <div className="text-sm text-blue-200">Claimed Businesses</div>
              </div>
              <div className="bg-green-500/20 p-4 rounded-lg backdrop-blur-sm border border-green-400/20">
                <div className="text-2xl font-bold text-green-300">
                  {Array.isArray(data.businesses) ? data.businesses.filter(b => b.subscriptionTier && b.subscriptionTier !== 'free').length : 0}
                </div>
                <div className="text-sm text-green-200">Premium Subscribers</div>
              </div>
              <div className="bg-purple-500/20 p-4 rounded-lg backdrop-blur-sm border border-purple-400/20">
                <div className="text-2xl font-bold text-purple-300">
                  $
                  {Array.isArray(data.businesses) ? data.businesses
                    .filter(b => b.subscriptionTier && b.subscriptionTier !== 'free')
                    .reduce((total, b) => {
                      const prices = { silver: 19.99, gold: 39.99, platinum: 79.99 };
                      return total + (prices[b.subscriptionTier as keyof typeof prices] || 0);
                    }, 0)
                    .toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-purple-200">Monthly Revenue</div>
              </div>
              <div className="bg-yellow-500/20 p-4 rounded-lg backdrop-blur-sm border border-yellow-400/20">
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
                <Card key={business.id} className="p-6 hover:shadow-md transition-shadow bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Business Details */}
                    <div className="lg:col-span-1">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg mb-1">{business.name}</h4>
                          <p className="text-sm text-blue-200 mb-2">{business.category}</p>
                          <p className="text-xs text-blue-300 mb-3">{business.address}</p>
                          <div className="flex flex-wrap gap-1">
                            {business.verified && (
                              <Badge className="bg-blue-500/20 text-blue-200 text-xs border border-blue-400/30">✓ Verified</Badge>
                            )}
                            {business.featured && (
                              <Badge className="bg-yellow-500/20 text-yellow-200 text-xs border border-yellow-400/30">⭐ Featured</Badge>
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
                            <p className="text-xs text-blue-300">Owner:</p>
                            <p className="text-sm text-white font-medium">{business.claimedBy}</p>
                          </div>
                        )}
                        {business.claimedAt && (
                          <div>
                            <p className="text-xs text-blue-300">Claimed:</p>
                            <p className="text-sm text-blue-200">{new Date(business.claimedAt).toLocaleDateString()}</p>
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
                            className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                          >
                            Edit
                          </Button>
                          
                          {business.isClaimed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editBusinessSubscription(business)}
                              className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                            >
                              Subscription
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant={business.featured ? "default" : "outline"}
                            onClick={() => toggleBusinessFeature(business.id, 'featured')}
                            className={`text-xs ${business.featured ? 
                              'bg-yellow-500 text-black' : 
                              'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900'}`}
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

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Flag className="h-5 w-5 mr-2" />
                Reported Content
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => fetchReports()} className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-200">Status:</span>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => { setReportPage(1); setReportStatusFilter(e.target.value as typeof reportStatusFilter); }}
                  className="px-3 py-2 text-sm bg-white/10 text-white border border-white/20 rounded-md"
                >
                  <option value="pending" className="text-gray-900">Pending</option>
                  <option value="resolved" className="text-gray-900">Resolved</option>
                  <option value="dismissed" className="text-gray-900">Dismissed</option>
                  <option value="all" className="text-gray-900">All</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-200">Type:</span>
                <select
                  value={reportTypeFilter}
                  onChange={(e) => { setReportPage(1); setReportTypeFilter(e.target.value as typeof reportTypeFilter); }}
                  className="px-3 py-2 text-sm bg-white/10 text-white border border-white/20 rounded-md"
                >
                  <option value="all" className="text-gray-900">All</option>
                  <option value="listing" className="text-gray-900">Listings</option>
                  <option value="comment" className="text-gray-900">Comments</option>
                </select>
              </div>
              <div className="text-sm text-blue-200 ml-auto">
                Total: {reportTotal}
              </div>
            </div>

            {/* List */}
            {reportsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-600">Loading reports…</span>
              </div>
            ) : reportsError ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded">
                {reportsError}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-10 text-blue-200">No reports found for the selected filters.</div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-4 bg-white rounded-lg border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${r.reportType === 'listing' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>{r.reportType}</Badge>
                        <Badge className={`${r.status === 'pending' ? 'bg-yellow-500 text-black' : r.status === 'resolved' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}`}>{r.status}</Badge>
                        <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-900 truncate">
                        <span className="font-medium">Reason:</span> {r.reason}
                      </div>
                      {r.description && (
                        <div className="text-sm text-gray-700 truncate">
                          <span className="font-medium">Details:</span> {r.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        <span className="font-medium">Content ID:</span> {r.contentId}
                      </div>
                      {/* Preview snippet */}
                      <ReportPreviewSnippet reportType={r.reportType} contentId={r.contentId} />
                      {r.adminNotes && (
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          <span className="font-medium">Admin Notes:</span> {r.adminNotes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => actOnReport(r.id, { status: 'dismissed', action: 'dismiss' })} className="text-xs">Dismiss</Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const reason = prompt('Enter a reason to hide this content (visible to the user):') || ''
                            if (!reason.trim()) return
                            actOnReport(r.id, { status: 'resolved', action: 'hide', reason })
                          }} className="text-xs flex items-center">
                            <Eye className="h-3 w-3 mr-1" /> Hide
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const reason = prompt('Enter a reason for removal (user will be notified):') || ''
                            if (!reason.trim()) return
                            actOnReport(r.id, { status: 'resolved', action: 'remove', reason })
                          }} className="text-xs flex items-center text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400">
                            <Trash2 className="h-3 w-3 mr-1" /> Remove
                          </Button>
                        </>
                      )}
                      {r.status !== 'pending' && (
                        <>
                          <Badge className="bg-green-100 text-green-800">Handled</Badge>
                          {(() => {
                            type ModerationState = 'hidden' | 'awaiting_review' | 'none'
                            type ContentModeration = { type: 'listing'; state: ModerationState; status?: string } | { type: 'comment'; state: ModerationState; isHidden?: boolean }
                            type ReportWithModeration = typeof r & { contentModeration?: ContentModeration }
                            const rw = r as ReportWithModeration
                            const state = rw.contentModeration?.state
                            const canUnhide = state === 'hidden' || state === 'awaiting_review'
                            return canUnhide ? (
                              <Button size="sm" variant="outline" onClick={() => actOnReport(r.id, { status: 'resolved', action: 'unhide' })} className="text-xs">
                                Unhide
                              </Button>
                            ) : null
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <Button size="sm" variant="outline" disabled={reportPage <= 1 || reportsLoading} onClick={() => setReportPage(p => Math.max(1, p - 1))}>Previous</Button>
              <span className="text-sm text-blue-200">Page {reportPage}</span>
              <Button size="sm" variant="outline" disabled={(reportPage * reportLimit) >= reportTotal || reportsLoading} onClick={() => setReportPage(p => p + 1)}>Next</Button>
            </div>
          </Card>

          {/* Helper note */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Hiding a comment marks it invisible to users. Removing a listing sets its status to removed. Dismiss will keep the content and mark the report as dismissed.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'content' && data && (
        <div className="space-y-6">
          {/* Events */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
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
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
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

      {activeTab === 'ads' && (
        <div className="space-y-6">
          {/* Ad Management */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Business Ad Management
                </h3>
                <p className="text-sm text-blue-200 mt-1">
                  View and manage business advertisements across all subscription tiers
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchAds}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {adData.loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                <span className="text-blue-200">Loading ads...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Silver Tier Ads */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    Silver Tier Ads ({adData.silver.length})
                  </h4>
                  {adData.silver.length === 0 ? (
                    <p className="text-gray-400 text-sm">No silver tier ads found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adData.silver.map((ad: Record<string, unknown>) => (
                        <div key={ad.id as string} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-white text-sm">{ad.businessName as string}</h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleAdVisibilityById(ad.id as string, ad.isVisible as boolean)}
                              className="text-xs"
                            >
                              {ad.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                          </div>
                          <div className="text-xs text-gray-300 space-y-1">
                            <p>Size: {(ad.adSize as {width: number, height: number}).width} × {(ad.adSize as {width: number, height: number}).height}</p>
                            <p>Status: {ad.isActive ? 'Active' : 'Inactive'}</p>
                            <p>Visible: {ad.isVisible ? 'Yes' : 'No'}</p>
                            <p>Impressions: {ad.impressions as number}</p>
                            <p>Clicks: {ad.clicks as number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gold Tier Ads */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                    Gold Tier Ads ({adData.gold.length})
                  </h4>
                  {adData.gold.length === 0 ? (
                    <p className="text-gray-400 text-sm">No gold tier ads found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adData.gold.map((ad: Record<string, unknown>) => (
                        <div key={ad.id as string} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-white text-sm">{ad.businessName as string}</h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleAdVisibilityById(ad.id as string, ad.isVisible as boolean)}
                              className="text-xs"
                            >
                              {ad.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                          </div>
                          <div className="text-xs text-gray-300 space-y-1">
                            <p>Size: {(ad.adSize as {width: number, height: number}).width} × {(ad.adSize as {width: number, height: number}).height}</p>
                            <p>Status: {ad.isActive ? 'Active' : 'Inactive'}</p>
                            <p>Visible: {ad.isVisible ? 'Yes' : 'No'}</p>
                            <p>Impressions: {ad.impressions as number}</p>
                            <p>Clicks: {ad.clicks as number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platinum Tier Ads */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                    Platinum Tier Ads ({adData.platinum.length})
                  </h4>
                  {adData.platinum.length === 0 ? (
                    <p className="text-gray-400 text-sm">No platinum tier ads found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adData.platinum.map((ad: Record<string, unknown>) => (
                        <div key={ad.id as string} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-white text-sm">{ad.businessName as string}</h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleAdVisibilityById(ad.id as string, ad.isVisible as boolean)}
                              className="text-xs"
                            >
                              {ad.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                          </div>
                          <div className="text-xs text-gray-300 space-y-1">
                            <p>Size: {(ad.adSize as {width: number, height: number}).width} × {(ad.adSize as {width: number, height: number}).height}</p>
                            <p>Status: {ad.isActive ? 'Active' : 'Inactive'}</p>
                            <p>Visible: {ad.isVisible ? 'Yes' : 'No'}</p>
                            <p>Logo: {ad.logo ? 'Yes' : 'No'}</p>
                            <p>Impressions: {ad.impressions as number}</p>
                            <p>Clicks: {ad.clicks as number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div className="text-center p-4 bg-gray-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-white">{adData.silver.length}</div>
                    <div className="text-sm text-gray-300">Silver Ads</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-white">{adData.gold.length}</div>
                    <div className="text-sm text-gray-300">Gold Ads</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-white">{adData.platinum.length}</div>
                    <div className="text-sm text-gray-300">Platinum Ads</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'test-business' && (
        <div className="space-y-6">
          {/* Test Business Management */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Test Business Management
                </h3>
                <p className="text-sm text-blue-200 mt-1">
                  Create and manage a test business to experience the full business owner journey
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchTestBusinessStatus}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {testBusinessState.loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                <span className="text-blue-200">Loading test business status...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-500/20 p-4 rounded-lg backdrop-blur-sm border border-blue-400/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-blue-300">
                          {testBusinessState.exists ? 'Active' : 'Not Created'}
                        </div>
                        <div className="text-sm text-blue-200">Test Business Status</div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${testBusinessState.exists ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-500/20 p-4 rounded-lg backdrop-blur-sm border border-purple-400/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-purple-300">
                          {testBusinessState.isHidden ? 'Hidden' : 'Visible'}
                        </div>
                        <div className="text-sm text-purple-200">Directory Visibility</div>
                      </div>
                      {testBusinessState.isHidden ? (
                        <EyeOff className="h-5 w-5 text-purple-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-purple-300" />
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-green-500/20 p-4 rounded-lg backdrop-blur-sm border border-green-400/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-green-300">
                          {testBusinessState.adsVisible ? 'Enabled' : 'Disabled'}
                        </div>
                        <div className="text-sm text-green-200">Ad Visibility</div>
                      </div>
                      <Monitor className="h-5 w-5 text-green-300" />
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                {testBusinessState.exists && testBusinessState.business && (
                  <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
                    <h4 className="font-semibold text-white mb-3 flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      {testBusinessState.business.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-200">Subscription:</span>
                        <span className="ml-2 text-white font-medium">
                          {testBusinessState.business.subscriptionTier?.toUpperCase() || 'FREE'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-200">Category:</span>
                        <span className="ml-2 text-white">{testBusinessState.business.category}</span>
                      </div>
                      <div>
                        <span className="text-blue-200">Address:</span>
                        <span className="ml-2 text-white">{testBusinessState.business.address}</span>
                      </div>
                      <div>
                        <span className="text-blue-200">Phone:</span>
                        <span className="ml-2 text-white">{testBusinessState.business.phone}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {!testBusinessState.exists ? (
                    <Button 
                      onClick={createOrClaimTestBusiness}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Create & Claim Test Business
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={toggleTestBusinessVisibility}
                        variant="outline"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                      >
                        {testBusinessState.isHidden ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show in Directory
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide from Directory
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={toggleAdVisibility}
                        variant="outline"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        {testBusinessState.adsVisible ? 'Disable Ads' : 'Enable Ads'}
                      </Button>
                      
                      <Button 
                        onClick={() => window.open('/businesses/manage', '_blank')}
                        variant="outline"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Manage Business
                      </Button>
                      
                      <Button 
                        onClick={() => window.open('/businesses', '_blank')}
                        variant="outline"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View in Directory
                      </Button>
                    </>
                  )}
                </div>

                {/* Testing Guide */}
                <Card className="p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-400/20">
                  <h4 className="font-semibold text-blue-300 mb-3">🧪 Testing Guide</h4>
                  <div className="space-y-2 text-sm text-blue-200">
                    <p><strong>Business Owner Journey:</strong> Use the test business to experience claiming, subscription upgrades, and premium features.</p>
                    <p><strong>Directory Visibility:</strong> Toggle visibility to test how businesses appear/disappear in search results.</p>
                    <p><strong>Ad Placement Testing:</strong> Enable/disable ads to test how different subscription tiers display advertisements.</p>
                    <p><strong>Subscription Features:</strong> The test business has Platinum subscription to test all premium features.</p>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'email-analytics' && (
        <div className="space-y-6">
          {/* Email Analytics Overview */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email & Push Notification Analytics
                </h3>
                <p className="text-sm text-blue-200 mt-1">
                  Email campaign performance, user preferences, and push notification statistics
                </p>
              </div>
              <div className="flex space-x-2">
                <select
                  className="px-3 py-2 text-sm bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onChange={(e) => fetchEmailAnalytics(parseInt(e.target.value))}
                  defaultValue="30"
                >
                  <option value="7" className="bg-slate-800">Last 7 days</option>
                  <option value="30" className="bg-slate-800">Last 30 days</option>
                  <option value="90" className="bg-slate-800">Last 90 days</option>
                </select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchEmailAnalytics()}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {emailAnalytics.loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                <span className="text-blue-200">Loading email analytics...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-500/20 p-4 rounded-lg backdrop-blur-sm border border-blue-400/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-300">
                          {emailAnalytics.overview.totalEmailsSent.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-200">Emails Sent</div>
                      </div>
                      <Send className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-green-500/20 p-4 rounded-lg backdrop-blur-sm border border-green-400/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-300">
                          {emailAnalytics.overview.overallOpenRate}%
                        </div>
                        <div className="text-sm text-green-200">Open Rate</div>
                      </div>
                      <Eye className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-500/20 p-4 rounded-lg backdrop-blur-sm border border-purple-400/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-300">
                          {emailAnalytics.overview.overallClickRate}%
                        </div>
                        <div className="text-sm text-purple-200">Click Rate</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-500/20 p-4 rounded-lg backdrop-blur-sm border border-orange-400/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-orange-300">
                          {emailAnalytics.pushStats.activeSubscriptions.toLocaleString()}
                        </div>
                        <div className="text-sm text-orange-200">Push Subscribers</div>
                      </div>
                      <Users className="h-8 w-8 text-orange-400" />
                    </div>
                  </div>
                </div>

                {/* Email Queue Status */}
                <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Email Queue Status
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-300">{emailAnalytics.queueStats.pending || 0}</div>
                      <div className="text-xs text-yellow-200">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-300">{emailAnalytics.queueStats.processing || 0}</div>
                      <div className="text-xs text-blue-200">Processing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-300">{emailAnalytics.queueStats.sent || 0}</div>
                      <div className="text-xs text-green-200">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-300">{emailAnalytics.queueStats.failed || 0}</div>
                      <div className="text-xs text-red-200">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-300">{emailAnalytics.queueStats.retrying || 0}</div>
                      <div className="text-xs text-orange-200">Retrying</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEmailAction('process_queue')}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Process Queue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmailAction('retry_failed')}
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                    >
                      Retry Failed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmailAction('clear_failed')}
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900"
                    >
                      Clear Failed
                    </Button>
                  </div>
                </Card>

                {/* User Preferences Overview */}
                <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    User Preferences
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{emailAnalytics.preferencesStats.totalUsers}</div>
                      <div className="text-xs text-gray-300">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-300">{emailAnalytics.preferencesStats.newsletterOptIn}</div>
                      <div className="text-xs text-green-200">Newsletter Subscribers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-300">{emailAnalytics.preferencesStats.eventNotificationsOptIn}</div>
                      <div className="text-xs text-blue-200">Event Notifications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-300">{emailAnalytics.preferencesStats.pushNotificationsEnabled}</div>
                      <div className="text-xs text-purple-200">Push Enabled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-300">{emailAnalytics.preferencesStats.marketingOptIn}</div>
                      <div className="text-xs text-yellow-200">Marketing Opt-in</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-300">{emailAnalytics.preferencesStats.unsubscribedAll}</div>
                      <div className="text-xs text-red-200">Unsubscribed</div>
                    </div>
                  </div>
                </Card>

                {/* Email Performance by Template */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Emails by Template Type</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {emailAnalytics.emailsByTemplate.map((template) => (
                        <div key={template._id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-300 capitalize">
                            {template._id.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="secondary" className="bg-white/20 text-blue-200 border-white/20">
                            {template.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Open Rates by Template</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {emailAnalytics.openRates.map((rate) => (
                        <div key={rate._id} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-300 capitalize">
                              {rate._id.replace(/_/g, ' ')}
                            </span>
                            <div className="text-xs text-gray-400">
                              {rate.opened}/{rate.total} opened
                            </div>
                          </div>
                          <Badge 
                            className={`${
                              rate.openRate >= 20 ? 'bg-green-500' : 
                              rate.openRate >= 10 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            } text-white`}
                          >
                            {rate.openRate}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Recent Email Activity */}
                <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
                  <h4 className="font-semibold text-white mb-3">Recent Email Activity</h4>
                  <div className="space-y-2">
                    {emailAnalytics.recentEmails.slice(0, 10).map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <div>
                          <span className="text-sm font-medium text-white capitalize">
                            {email.templateType.replace(/_/g, ' ')}
                          </span>
                          <div className="text-xs text-gray-400">
                            To: {email.recipientEmail} • {new Date(email.sentAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {email.opened && (
                            <Badge className="bg-green-500 text-white text-xs">Opened</Badge>
                          )}
                          {email.clicked && (
                            <Badge className="bg-blue-500 text-white text-xs">Clicked</Badge>
                          )}
                          {email.deliveryStatus === 'bounced' && (
                            <Badge className="bg-red-500 text-white text-xs">Bounced</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* System Settings */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">System Settings</h3>
            <div className="space-y-6">
              {/* Email System Configuration */}
              <div>
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email System Configuration
                </h4>
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Email Template System</span>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Email Analytics Tracking</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Email Queue Processing</span>
                    <Badge className="bg-green-500 text-white">Daily at 6 AM MT</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Combined Cron Architecture</span>
                    <Badge className="bg-blue-500 text-white">Hobby Plan Compatible</Badge>
                  </div>
                </div>
              </div>

              {/* Push Notification Configuration */}
              <div>
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  Push Notification System
                </h4>
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Service Worker</span>
                    <Badge className="bg-green-500 text-white">Registered</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Web Push API</span>
                    <Badge className="bg-green-500 text-white">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">PWA Support</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">VAPID Configuration</span>
                    <Badge className="bg-blue-500 text-white">Environment Variables</Badge>
                  </div>
                </div>
              </div>

              {/* Scraper Configuration */}
              <div>
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Scraper Configuration
                </h4>
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">News Scraper</span>
                    <Badge className="bg-green-500 text-white">Daily at 6 AM MT</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Events Scraper</span>
                    <Badge className="bg-green-500 text-white">Daily at 6 AM MT</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Business Scraper</span>
                    <Badge className="bg-orange-500 text-white">Weekly on Mondays</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Combined Processing</span>
                    <Badge className="bg-blue-500 text-white">Vercel Hobby Compatible</Badge>
                  </div>
                </div>
              </div>

              {/* Business System */}
              <div>
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Business Management
                </h4>
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Business Claims</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Subscription Tiers</span>
                    <Badge className="bg-green-500 text-white">Silver, Gold, Platinum</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">PayPal Integration</span>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Ad Management</span>
                    <Badge className="bg-green-500 text-white">Premium Feature</Badge>
                  </div>
                </div>
              </div>

              {/* Security & Moderation */}
              <div>
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <Flag className="h-4 w-4 mr-2" />
                  Content Moderation
                </h4>
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Content Reporting</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Admin Review System</span>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Auto-approve Scraped Content</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">CSRF Protection</span>
                    <Badge className="bg-green-500 text-white">Enabled</Badge>
                  </div>
                </div>
              </div>

              {/* Environment Status */}
              <div>
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  Environment Status
                </h4>
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Database Connection</span>
                    <Badge className="bg-green-500 text-white">MongoDB Atlas</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Authentication</span>
                    <Badge className="bg-green-500 text-white">Auth0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Deployment</span>
                    <Badge className="bg-green-500 text-white">Vercel</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">CDN & Images</span>
                    <Badge className="bg-green-500 text-white">Next.js Image Optimization</Badge>
                  </div>
                </div>
              </div>

              {/* Configuration Notes */}
              <Card className="p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-400/20">
                <h5 className="font-medium text-blue-300 mb-2">📋 Configuration Notes</h5>
                <div className="space-y-2 text-sm text-blue-200">
                  <p><strong>Email System:</strong> Uses React Email templates with comprehensive analytics and automation</p>
                  <p><strong>Push Notifications:</strong> Requires VAPID keys in environment variables (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)</p>
                  <p><strong>Combined Cron:</strong> Processes both scraping and email queue to stay within Vercel Hobby plan limits</p>
                  <p><strong>Business Features:</strong> Full subscription management with PayPal integration for premium tiers</p>
                  <p><strong>Moderation:</strong> Community-driven reporting with admin review capabilities</p>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'scrapers' && (
        <div className="space-y-6">
          {/* Scraper Status Overview */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
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
                        Next run: {formatPolicyCountdown('news')}
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
                        Next run: {formatPolicyCountdown('events')}
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
                        Next run: {formatPolicyCountdown('businesses')}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>

          {/* Manual Scraper Controls */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
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
      const response = await csrfFetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      const response = await csrfFetch(`/api/admin/businesses/${business.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

// Lightweight preview snippet for reported items
function ReportPreviewSnippet({ reportType, contentId }: { reportType: 'listing' | 'comment'; contentId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  type ListingPreview = { id: string; title?: string; description?: string; image?: string; status?: string; moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string } }
  type CommentPreview = { id: string; content: string; userId: string; userName: string; isHidden: boolean; moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string } }
  const [data, setData] = useState<ListingPreview | CommentPreview | null>(null)

  useEffect(() => {
    let ignore = false
    const fetchPreview = async () => {
      try {
        setLoading(true)
        setError('')
        const url = `/api/admin/reports/preview?type=${encodeURIComponent(reportType)}&id=${encodeURIComponent(contentId)}`
        const res = await fetch(url, { credentials: 'include' })
        const json = await res.json()
        if (!ignore) {
          if (json.success) setData(json.data)
          else setError(json.error || 'Failed to load preview')
        }
  } catch (_e) {
        if (!ignore) setError('Failed to load preview')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchPreview()
    return () => { ignore = true }
  }, [reportType, contentId])

  if (loading) return <div className="text-xs text-gray-500 mt-1">Loading preview…</div>
  if (error) return <div className="text-xs text-red-600 mt-1">{error}</div>
  if (!data) return null

  if (reportType === 'listing') {
    const listing = data as ListingPreview | null
    return (
      <div className="mt-2 p-2 border rounded bg-gray-50">
        <div className="flex items-center gap-2">
          {listing?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.image} alt="preview" className="w-10 h-10 object-cover rounded" />
          )}
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">{listing?.title}</div>
            <div className="text-xs text-gray-600 truncate">{listing?.description}</div>
            {listing?.moderation?.state === 'hidden' && (
              <div className="text-[10px] text-orange-700 mt-1">Hidden: {listing.moderation?.reason || 'Policy violation'}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 p-2 border rounded bg-gray-50">
      {(() => {
        const comment = data as CommentPreview | null
        return (
          <>
            <div className="text-xs text-gray-800 truncate">{comment?.content}</div>
            {comment?.isHidden && (
              <div className="text-[10px] text-orange-700 mt-1">Hidden{comment.moderation?.reason ? `: ${comment.moderation.reason}` : ''}</div>
            )}
          </>
        )
      })()}
    </div>
  )
}

export default AdminDashboard;
