'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import { ShoppingBag, MapPin, User, Phone, Mail, Search, Filter, Image as ImageIcon } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import type { MarketplaceListing } from '@/types';

const MarketplacePage = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
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

    fetchListings();
  }, []);

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'Price on request';
    if (price === 0) return 'Free';
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Posted today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return dateObj.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                      placeholder="Search marketplace..."
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
    </FoldableLayout>
  );
};

export default MarketplacePage;