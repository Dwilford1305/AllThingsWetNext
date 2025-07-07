'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/ui/Navigation';
import AdminDashboard from '../../components/AdminDashboard';
import { AdminAuth } from '@/components/AdminAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Shield, 
  Users, 
  Building, 
  Calendar, 
  Newspaper, 
  Briefcase, 
  ShoppingBag,
  Activity,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface AdminStats {
  businesses: {
    total: number;
    claimed: number;
    premium: number;
    revenue: number;
  };
  content: {
    events: number;
    news: number;
    jobs: number;
    classifieds: number;
  };
  scrapers: {
    lastRun: string;
    status: 'active' | 'error' | 'idle';
    errors: number;
  };
  system: {
    uptime: string;
    dbSize: string;
    activeUsers: number;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminStats();
  };

  const runScraper = async (type: 'news' | 'events' | 'businesses') => {
    try {
      const response = await fetch(`/api/scraper/${type}`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        alert(`${type} scraper completed successfully!`);
        handleRefresh();
      } else {
        alert(`${type} scraper failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error running ${type} scraper`);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <AdminAuth>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-800 mt-2">Manage your All Things Wetaskiwin platform</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {stats && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-800">Total Businesses</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.businesses.total}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">{stats.businesses.claimed} claimed</span>
                    <span className="text-gray-600 mx-2">•</span>
                    <span className="text-blue-600 font-medium">{stats.businesses.premium} premium</span>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-800">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.businesses.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-700">
                      Annual: ${(stats.businesses.revenue * 12).toFixed(2)}
                    </span>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-800">Content Items</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.content.events + stats.content.news + stats.content.jobs + stats.content.classifieds}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-800">
                    <span>{stats.content.events} Events</span>
                    <span>{stats.content.news} News</span>
                    <span>{stats.content.jobs} Jobs</span>
                    <span>{stats.content.classifieds} Classifieds</span>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-800">System Status</p>
                      <div className="flex items-center mt-1">
                        <Badge 
                          className={`${stats.scrapers.status === 'active' ? 'bg-green-500' : 
                            stats.scrapers.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}
                        >
                          {stats.scrapers.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-700">
                      Last scrape: {new Date(stats.scrapers.lastRun).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Scraper Controls */}
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Scraper Controls
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Newspaper className="h-5 w-5 mr-2 text-blue-600" />
                      <h3 className="font-medium text-gray-900">News Scraper</h3>
                    </div>
                    <p className="text-sm text-gray-800 mb-3">
                      Scrape latest news from Wetaskiwin Times and Pipestone Flyer
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => runScraper('news')}
                      className="w-full"
                    >
                      Run News Scraper
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 mr-2 text-green-600" />
                      <h3 className="font-medium text-gray-900">Events Scraper</h3>
                    </div>
                    <p className="text-sm text-gray-800 mb-3">
                      Scrape events from Connect Wetaskiwin and City website
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => runScraper('events')}
                      className="w-full"
                    >
                      Run Events Scraper
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Building className="h-5 w-5 mr-2 text-purple-600" />
                      <h3 className="font-medium text-gray-900">Business Scraper</h3>
                    </div>
                    <p className="text-sm text-gray-800 mb-3">
                      Update business directory from City website
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => runScraper('businesses')}
                      className="w-full"
                    >
                      Run Business Scraper
                    </Button>
                  </div>
                </div>

                {stats.scrapers.errors > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-800">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        {stats.scrapers.errors} scraper error(s) detected
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Check the logs for more details and consider running scrapers manually.
                    </p>
                  </div>
                )}
              </Card>

              {/* Main Admin Dashboard Component */}
              <AdminDashboard />
            </>
          )}
        </div>
      </div>
    </AdminAuth>
  );
}
