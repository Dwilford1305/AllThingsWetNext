'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import MarketplaceListingForm from '@/components/MarketplaceListingForm';
import Comments from '@/components/Comments';
import ReportModal from '@/components/ReportModal';
import { ShoppingBag, MapPin, User, Phone, Mail, Search, Filter, Image as ImageIcon, Plus, Flag, MessageCircle, X, ThumbsUp } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import type { MarketplaceListing, ReportReason } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { authenticatedFetch } from '@/lib/auth-fetch';

const MarketplacePage = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { isAuthenticated } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [reportingListingId, setReportingListingId] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/marketplace');
      const data = await response.json();
      if (data.success) {
        setListings(data.data);
      }
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
    }
  };

  const likeListing = async (listingId: string) => {
    try {
      const response = await authenticatedFetch(`/api/marketplace/${listingId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: 'like' })
      })
      const result = await response.json()
      if (result.success) {
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, reactions: result.data.reactions } : l))
      }
    } catch (e) {
      console.error('Failed to like listing', e)
    }
  }

  const handleReportListing = async (reason: ReportReason, description: string) => {
    if (!reportingListingId) return;

    try {
      const response = await authenticatedFetch(`/api/marketplace/${reportingListingId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, description })
      });

      const result = await response.json();

      if (result.success) {
        // Update the listing to show it's been reported
        setListings(prev => 
          prev.map(listing => 
            listing.id === reportingListingId 
              ? { ...listing, isReported: true, reportCount: listing.reportCount + 1 }
              : listing
          )
        );
        setReportingListingId(null);
        alert('Report submitted successfully. Our team will review it shortly.');
      } else {
        alert(result.error || 'Failed to submit report');
      }
    } catch (error) {
      alert('An error occurred while submitting the report');
      console.error('Report submission error:', error);
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'Price on request';
    if (price === 0) return 'Free';
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const datePart = d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString('en-CA', { hour12: false }); // HH:MM:SS
    return `${datePart} ${timePart}`;
  };

  const categories = [
    'all',
    'vehicles', 
    'real-estate', 
    'electronics', 
    'furniture', 
    'clothing', 
    'sports', 
    'tools', 
    'books', 
    'pets', 
    'services', 
    'other'
  ];

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <FoldableLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
        <Navigation />
        
        {/* Content starts after the navigation */}
        <div className="pt-32 sm:pt-28 md:pt-24">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <AnimatedSection>
              <motion.div 
                className="text-center mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mb-4 mx-auto shadow-lg">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-shadow-lg">
                  Marketplace
                </h1>
                <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
                  Discover amazing deals in your community. Buy, sell, and trade with neighbors in Wetaskiwin.
                </p>
              </motion.div>
            </AnimatedSection>

            {/* Search and Filter */}
            <AnimatedSection delay={0.2}>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                      placeholder="Search marketplace..."
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="pl-10 pr-8 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm min-w-[200px]"
                      aria-label="Filter marketplace listings by category"
                    >
                      {categories.map(category => (
                        <option key={category} value={category} className="text-gray-900">
                          {category === 'all' ? 'All Categories' : category.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isAuthenticated && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="h-5 w-5" />
                      Create Listing
                    </Button>
                  )}
                </div>
              </div>
            </AnimatedSection>

            {/* Marketplace Sponsors */}
            <div className="mb-8">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Marketplace Partners</h3>
                <p className="text-sm text-blue-200">Supporting local buying and selling</p>
              </div>
              <div className="flex justify-center">
                <AdPlaceholder 
                  type="platinum" 
                  size="large" 
                  className="w-full max-w-md" 
                />
              </div>
            </div>

            {/* Marketplace Listings Grid */}
            {filteredListings.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <Card key={listing.id} className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/15 hover:shadow-xl transition-all duration-300">
                    {listing.images && listing.images.length > 0 ? (
                      <div className="h-48 bg-gray-700/50 relative">
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                        {listing.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {listing.images.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-700/50 flex items-center justify-center rounded-t-lg">
                        <ImageIcon className="h-12 w-12 text-blue-200" />
                      </div>
                    )}
                    
                    <div className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge 
                            className={`text-xs font-medium ${
                              listing.featured 
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' 
                                : 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                            }`}
                          >
                            {listing.category.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                          {listing.condition && (
                            <Badge className="text-xs font-medium bg-green-500/20 text-green-200 border border-green-400/30">
                              {listing.condition.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {formatPrice(listing.price)}
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      <p className="text-blue-200 text-sm mb-4 line-clamp-3">
                        {listing.description}
                      </p>

                      <div className="space-y-2 text-sm text-blue-200">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-blue-300 flex-shrink-0" />
                          <span className="truncate">{listing.location}</span>
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-blue-300 flex-shrink-0" />
                          <span className="truncate">{listing.contactName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                        <span className="text-xs text-blue-300">
                          {formatDate(listing.createdAt)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedListing(listing)}
                            className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          {isAuthenticated && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReportingListingId(listing.id)}
                              className="bg-red-600/20 hover:bg-red-600/30 border-red-400/30 text-red-200"
                              title="Report listing"
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                          )}
                          {isAuthenticated && (
                            <Button size="sm" variant="outline" onClick={() => likeListing(listing.id)} className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              <span className="text-xs">{listing.reactions?.like?.length || 0}</span>
                            </Button>
                          )}
                          {listing.contactPhone && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          {listing.contactEmail && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg text-center py-12">
                <ShoppingBag className="h-12 w-12 text-blue-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No marketplace listings found</h3>
                <p className="text-blue-200">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No marketplace listings are currently available.'}
                </p>
              </Card>
            )}

            {/* Bottom Marketplace Section */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Community Marketplace</h3>
                <p className="text-sm text-blue-200">Connect buyers and sellers locally</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
                <AdPlaceholder type="gold" size="square" />
                <AdPlaceholder type="silver" size="square" />
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
        </div>
      </div>

      {/* Listing Creation Form Modal */}
      <MarketplaceListingForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          fetchListings();
          setShowCreateForm(false);
        }}
      />

      {/* Listing Detail Modal with Comments */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg high-contrast">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h2>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="text-gray-800 hover:text-gray-900 p-2"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  {selectedListing.images && selectedListing.images.length > 0 ? (
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={selectedListing.images[0]}
                        alt={selectedListing.title}
                        width={400}
                        height={400}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary-100 text-primary-800">
                      {selectedListing.category.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </Badge>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(selectedListing.price)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">Location:</span>
                      <div className="flex items-center mt-1 text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-700 mr-1" />
                        {selectedListing.location}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Contact:</span>
                      <div className="flex items-center mt-1 text-gray-900">
                        <User className="h-4 w-4 text-gray-700 mr-1" />
                        {selectedListing.contactName}
                      </div>
                    </div>
                    {selectedListing.condition && (
                      <div>
                        <span className="font-medium text-gray-800">Condition:</span>
                        <div className="mt-1 text-gray-900">
                          {selectedListing.condition.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-800">Posted:</span>
                      <div className="mt-1 text-gray-700">{formatDate(selectedListing.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    {selectedListing.contactPhone && (
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    )}
                    {selectedListing.contactEmail && (
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    )}
                    {isAuthenticated && (
                      <Button
                        onClick={() => {
                          setReportingListingId(selectedListing.id);
                          setSelectedListing(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comments Section */}
              <Comments listingId={selectedListing.id} isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      )}

      {/* Report Listing Modal */}
      <ReportModal
        isOpen={reportingListingId !== null}
        onClose={() => setReportingListingId(null)}
        onSubmit={handleReportListing}
        title="Report Listing"
        description="Help us maintain a safe marketplace by reporting inappropriate listings."
      />
    </FoldableLayout>
  );
};

export default MarketplacePage;