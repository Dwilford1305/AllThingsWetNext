'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import AnimatedSection from '@/components/AnimatedSection';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import ComingSoonModal from '@/components/ComingSoonModal';
import { motion } from 'framer-motion';
import { Building, Phone, Mail, Globe, MapPin, Clock, ArrowLeft, Search, Filter, Star, Shield, Award } from 'lucide-react';
import type { Business } from '@/types';

const BusinessesPage = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  });
  const [summary, setSummary] = useState({
    total: 0
  });
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedBusinessForClaim, setSelectedBusinessForClaim] = useState<Business | null>(null);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort: sortBy
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLetter !== 'all') params.append('letter', selectedLetter);

      const response = await fetch(`/api/businesses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBusinesses(data.data.businesses);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, selectedLetter, sortBy]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchBusinesses();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleClaimBusiness = (business: Business) => {
    setSelectedBusinessForClaim(business);
    setClaimModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const categories = ['all', 'retail', 'restaurant', 'automotive', 'health', 'professional', 'home-services', 'beauty', 'recreation', 'education', 'non-profit', 'other'];

  const formatHours = (hours: Business['hours']) => {
    if (!hours) return 'Hours not available';
    const today = new Date().toLocaleDateString('en-CA', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today as keyof typeof hours];
    return todayHours || 'Closed';
  };

  const getSubscriptionBadge = (tier: string, isClaimed: boolean) => {
    if (!isClaimed) {
      return null; // No badge for unclaimed free listings
    }
    
    switch (tier) {
      case 'silver':
        return <Badge variant="secondary" className="bg-gray-400 text-white"><Shield className="h-3 w-3 mr-1" />Silver</Badge>;
      case 'gold':
        return <Badge variant="secondary" className="bg-yellow-500 text-black"><Star className="h-3 w-3 mr-1" />Gold</Badge>;
      case 'platinum':
        return <Badge variant="secondary" className="bg-purple-600 text-white"><Award className="h-3 w-3 mr-1" />Platinum</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-500 text-white"><Shield className="h-3 w-3 mr-1" />Claimed</Badge>;
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
    <FoldableLayout>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
        {/* Modern Hero Header */}
        <AnimatedSection>
          <div className="relative bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center space-x-4 mb-6">
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center justify-center space-x-4 mb-6"
                >
                  <Building className="h-12 w-12 text-green-400" />
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                      Businesses
                    </h1>
                    <p className="text-xl text-green-200 mt-2">
                      Discover and support Wetaskiwin businesses
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Top Ad - Google AdSense Leaderboard */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <AdPlaceholder 
            type="google" 
            size="leaderboard" 
            className="w-full max-w-4xl mx-auto" 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    aria-label="Filter businesses by category"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort:</span>
                  <select
                    aria-label="Sort businesses"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Alphabetical</option>
                    <option value="featured">Featured First</option>
                    <option value="rating">Rating</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              {/* Alphabetical Navigation */}
              <div className="border-t pt-4">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => {
                      setSelectedLetter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedLetter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {alphabet.map(letter => (
                    <button
                      key={letter}
                      onClick={() => {
                        setSelectedLetter(letter);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 text-sm rounded ${
                        selectedLetter === letter 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t">
                <span>Total: {summary.total}</span>
                <span>Showing: {pagination.totalCount} results</span>
              </div>
            </div>
          </div>

          {/* Premium Business Showcase */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Business Directory</h3>
              <p className="text-sm text-gray-600">Featuring our most valued business partners</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <AdPlaceholder 
                type="platinum" 
                size="large" 
                className="sm:col-span-1" 
              />
              <AdPlaceholder type="gold" size="square" />
              <AdPlaceholder type="silver" size="square" />
            </div>
          </div>

          {/* Businesses Grid */}
          {!loading && businesses.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {businesses.map((business) => (
                  <Card key={business.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {business.imageUrl && (
                      <div className="h-48 bg-gray-200 relative">
                        <Image
                          src={business.imageUrl}
                          alt={business.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {business.category}
                          </Badge>
                          {getSubscriptionBadge(business.subscriptionTier || 'free', business.isClaimed || false)}
                        </div>
                        {business.featured && (
                          <Badge variant="default" className="bg-yellow-500 text-black">
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {business.name}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {business.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{business.address}</span>
                        </div>
                        
                        {business.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <a 
                              href={`tel:${business.phone}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {business.phone}
                            </a>
                          </div>
                        )}
                        
                        {business.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <a 
                              href={`mailto:${business.email}`}
                              className="hover:text-blue-600 transition-colors truncate"
                            >
                              {business.email}
                            </a>
                          </div>
                        )}
                        
                        {business.hours && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>Today: {formatHours(business.hours)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {business.website && (
                          <Button asChild size="sm" variant="outline">
                            <a href={business.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4 mr-2" />
                              Website
                            </a>
                          </Button>
                        )}
                        {business.phone && (
                          <Button asChild size="sm" variant="primary">
                            <a href={`tel:${business.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </a>
                          </Button>
                        )}
                        {business.isClaimed ? (
                          <Button asChild size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                            <Link href={`/businesses/manage?id=${business.id}`}>
                              Manage Listing
                            </Link>
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => handleClaimBusiness(business)}
                          >
                            Claim This Business
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                      >
                        Previous
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const startPage = Math.max(1, pagination.currentPage - 2);
                          const pageNum = startPage + i;
                          
                          if (pageNum > pagination.totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 text-sm rounded ${
                                pageNum === pagination.currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && businesses.length === 0 && (
            <Card className="p-12 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'all' || selectedLetter !== 'all'
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No businesses are currently listed.'}
              </p>
            </Card>
          )}

          {/* Bottom Business Partners Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Community Partners</h3>
              <p className="text-sm text-gray-600">Join our thriving business directory</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <AdPlaceholder type="silver" size="square" />
              <AdPlaceholder type="gold" size="square" />
              <AdPlaceholder type="silver" size="square" />
              <AdPlaceholder type="gold" size="square" />
            </div>
            <div className="flex justify-center">
              <AdPlaceholder 
                type="google" 
                size="banner" 
                className="w-full max-w-2xl mx-auto" 
              />
            </div>
          </div>
        </div>

        {/* Coming Soon Modal */}
        {selectedBusinessForClaim && (
          <ComingSoonModal
            business={selectedBusinessForClaim}
            isOpen={claimModalOpen}
            onClose={() => {
              setClaimModalOpen(false);
              setSelectedBusinessForClaim(null);
            }}
          />
        )}
      </div>
    </FoldableLayout>
  );
};

export default BusinessesPage;
