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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <FoldableLayout>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4 mb-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Classifieds</h1>
                <p className="text-gray-600">Buy, sell, and trade locally in Wetaskiwin</p>
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search classifieds..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  aria-label="Filter classifieds by category"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketplace Partners</h3>
              <p className="text-sm text-gray-600">Supporting local buying and selling</p>
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
                <Card key={classified.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-white">
                  {classified.images && classified.images.length > 0 ? (
                    <div className="h-48 bg-gray-200 relative">
                      <Image
                        src={classified.images[0]}
                        alt={classified.title}
                        fill
                        className="object-cover"
                      />
                      {classified.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {classified.images.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="p-6 bg-white relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">
                          {classified.category}
                        </Badge>
                        <Badge variant={getStatusColor(classified.status)}>
                          {classified.status}
                        </Badge>
                        {classified.condition && (
                          <Badge variant={getConditionColor(classified.condition)}>
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
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {classified.title}
                    </h3>
                    
                    <div className="text-2xl font-bold text-green-600 mb-3">
                      {formatPrice(classified.price)}
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {classified.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{classified.location}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{classified.contactName}</span>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {formatDate(classified.createdAt)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {classified.contactPhone && (
                        <Button asChild size="sm" variant="primary">
                          <a href={`tel:${classified.contactPhone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </a>
                        </Button>
                      )}
                      {classified.contactEmail && (
                        <Button asChild size="sm" variant="outline">
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
            <Card className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classifieds found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No classified listings are currently available.'}
              </p>
            </Card>
          )}

          {/* Bottom Marketplace Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Marketplace</h3>
              <p className="text-sm text-gray-600">Connect buyers and sellers locally</p>
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
