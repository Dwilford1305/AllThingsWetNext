'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/ui/Navigation';
import AdminDashboard from '../../components/AdminDashboard';
import { AdminAuth } from '@/components/AdminAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import FoldableLayout from '@/components/FoldableLayout';
import { 
  Shield, 
  Users, 
  Building, 
  Activity,
  TrendingUp,
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
    marketplace: number;
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
    } catch (_error) {
      console.error('Error fetching admin stats:', _error);
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

  if (loading) {
    return (
      <FoldableLayout>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 flex items-center justify-center pt-24 sm:pt-20 md:pt-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </FoldableLayout>
    );
  }

  return (
    <AdminAuth>
      <FoldableLayout>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 py-8 pt-24 sm:pt-20 md:pt-16 relative">
          {/* Modern Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-float" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Shield className="h-8 w-8 mr-3 text-blue-400" />
                Admin Dashboard
              </h1>
              <p className="text-blue-200 mt-2">Manage your All Things Wetaskiwin platform</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
              className="flex items-center refresh-button bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {stats && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                  <div className="flex items-center">
                    <Building className="h-8 w-8 text-blue-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-200">Total Businesses</p>
                      <p className="text-2xl font-bold text-white">{stats.businesses.total}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-400 font-medium">{stats.businesses.claimed} claimed</span>
                    <span className="text-blue-300 mx-2">•</span>
                    <span className="text-blue-400 font-medium">{stats.businesses.premium} premium</span>
                  </div>
                </Card>

                <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-200">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-white">${stats.businesses.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-blue-300">
                      Annual: ${(stats.businesses.revenue * 12).toFixed(2)}
                    </span>
                  </div>
                </Card>

                <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-purple-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-200">Content Items</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.content.events + stats.content.news + stats.content.jobs + stats.content.marketplace}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-blue-300">
                    <span>{stats.content.events} Events</span>
                    <span>{stats.content.news} News</span>
                    <span>{stats.content.jobs} Jobs</span>
                    <span>{stats.content.marketplace} Marketplace</span>
                  </div>
                </Card>

                <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-orange-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-200">System Status</p>
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
                    <span className="text-sm text-blue-300">
                      Last scrape: {new Date(stats.scrapers.lastRun).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Main Admin Dashboard Component */}
              <AdminDashboard />
            </>
          )}
        </div>
      </div>
      </FoldableLayout>
    </AdminAuth>
  );
}
