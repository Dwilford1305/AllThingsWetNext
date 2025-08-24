'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import { ShoppingBag, MapPin, User, Phone, Mail, ArrowLeft, Search, Filter, Image as ImageIcon } from 'lucide-react';
import type { Classified } from '@/types';

const ClassifiedsPage = () => {
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchClassifieds = async () => {
      try {
        const response = await fetch('/api/classifieds');
        const data = await response.json();
        if (data.success) {
          setClassifieds(data.data);
        }
      } catch (error) {
        console.error('Error fetching classifieds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassifieds();
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
    if (diffDays === 2) return 'Posted yesterday';
    if (diffDays <= 7) return `Posted ${diffDays} days ago`;
    
    return dateObj.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'sold': return 'destructive';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'new': return 'success';
      case 'like-new': return 'primary';
      case 'good': return 'secondary';
      case 'fair': return 'warning';
      default: return 'secondary';
    }
  };

  const filteredClassifieds = classifieds.filter(classified => {
    const matchesSearch = classified.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classified.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classified.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || classified.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'vehicles', 'electronics', 'furniture', 'clothing', 'sports', 'books', 'toys', 'tools', 'appliances', 'other'];

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </>
    );
  }

  return (
    <FoldableLayout>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 relative">
        {/* Modern Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl animate-float" />
        </div>
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg shadow-lg border-b border-white/20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4 mb-4">
              <Button asChild variant="ghost" size="sm" className="text-white hover:text-orange-200 hover:bg-white/10">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-8 w-8 text-orange-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Classifieds</h1>
                <p className="text-blue-200">Buy, sell, and trade locally in Wetaskiwin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Ad - Google AdSense Leaderboard */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <AdPlaceholder 
            type="google" 
            size="leaderboard" 
            className="w-full max-w-4xl mx-auto" 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Search and Filter */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-lg mb-8 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search classifieds..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-white placeholder-blue-200 backdrop-blur-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-200" />
                <select
                  aria-label="Filter classifieds by category"
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-white backdrop-blur-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-slate-800 text-white">
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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

          {/* Classifieds Grid */}
          {filteredClassifieds.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClassifieds.map((classified) => (
                <Card key={classified.id} className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/15 hover:shadow-xl transition-all duration-300">
                  {classified.images && classified.images.length > 0 ? (
                    <div className="h-48 bg-gray-700/50 relative">
                      <Image
                        src={classified.images[0]}
                        alt={classified.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      {classified.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {classified.images.length}
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
                        <Badge variant="secondary" className="bg-white/20 text-blue-200">
                          {classified.category}
                        </Badge>
                        <Badge variant={getStatusColor(classified.status)} className={`${
                          classified.status === 'active' ? 'bg-green-500' :
                          classified.status === 'sold' ? 'bg-red-500' : 'bg-yellow-500'
                        } text-white`}>
                          {classified.status}
                        </Badge>
                        {classified.condition && (
                          <Badge variant={getConditionColor(classified.condition)} className="bg-blue-500 text-white">
                            {classified.condition}
                          </Badge>
                        )}
                      </div>
                      {classified.featured && (
                        <Badge variant="default" className="bg-yellow-500 text-black">
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                      {classified.title}
                    </h3>
                    
                    <div className="text-2xl font-bold text-green-400 mb-3">
                      {formatPrice(classified.price)}
                    </div>
                    
                    <p className="text-blue-100 mb-4 line-clamp-3">
                      {classified.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-blue-300">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{classified.location}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-blue-300">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{classified.contactName}</span>
                      </div>
                      
                      <div className="text-xs text-blue-300">
                        {formatDate(classified.createdAt)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {classified.contactPhone && (
                        <Button asChild size="sm" variant="primary" className="bg-orange-500 hover:bg-orange-600 text-white">
                          <a href={`tel:${classified.contactPhone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </a>
                        </Button>
                      )}
                      {classified.contactEmail && (
                        <Button asChild size="sm" variant="outline" className="border-white/20 text-blue-200 hover:bg-white/10">
                          <a href={`mailto:${classified.contactEmail}?subject=Inquiry about ${classified.title}&body=Hello,%0D%0A%0D%0AI'm interested in your listing for "${classified.title}".%0D%0A%0D%0APlease let me know if it's still available.%0D%0A%0D%0AThank you!`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center bg-white/10 backdrop-blur-lg border border-white/20">
              <ShoppingBag className="h-12 w-12 text-blue-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No classifieds found</h3>
              <p className="text-blue-200">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No classified listings are currently available.'}
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
    </FoldableLayout>
  );
};

export default ClassifiedsPage;
