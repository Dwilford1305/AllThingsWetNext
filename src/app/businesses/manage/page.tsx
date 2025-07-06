'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import { BusinessDashboard } from '@/components/BusinessDashboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building, ArrowLeft, AlertCircle } from 'lucide-react';
import type { Business } from '@/types';

const BusinessManagePage = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const businessId = searchParams.get('id');

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId) {
        setError('No business ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/businesses?id=${businessId}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          const foundBusiness = data.data.find((b: Business) => b.id === businessId);
          if (foundBusiness) {
            if (!foundBusiness.isClaimed) {
              setError('This business has not been claimed yet. Please claim it first.');
            } else {
              setBusiness(foundBusiness);
            }
          } else {
            setError('Business not found');
          }
        } else {
          setError('Failed to load business data');
        }
      } catch (error) {
        console.error('Error fetching business:', error);
        setError('Failed to load business data');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);

  const handleBusinessUpdate = (updatedBusiness: Business) => {
    setBusiness(updatedBusiness);
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

  if (error || !business) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Button asChild variant="ghost" size="sm">
                <Link href="/businesses">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Businesses
                </Link>
              </Button>
            </div>
            
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Business</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <Button asChild variant="primary">
                  <Link href="/businesses">
                    Browse Businesses
                  </Link>
                </Button>
                {error?.includes('not been claimed') && (
                  <Button asChild variant="outline">
                    <Link href={`/businesses?claim=${businessId}`}>
                      Claim This Business
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4 mb-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/businesses">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Businesses
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Business Management</h1>
                <p className="text-gray-600">Manage your business listing and subscription</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BusinessDashboard 
            business={business} 
            onUpdate={handleBusinessUpdate}
          />
        </div>
      </div>
    </>
  );
};

export default BusinessManagePage;
