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
import NewBadge from '@/components/NewBadge';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Search, Filter } from 'lucide-react';
import type { Event } from '@/types';

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        if (data.success) {
          setEvents(data.data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // If it's already formatted (contains AM/PM or "All Day"), return as is
    if (timeString.includes('AM') || timeString.includes('PM') || timeString.toLowerCase().includes('all day')) {
      return timeString;
    }
    
    // Otherwise, treat it as a raw time string (HH:MM:SS format)
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-CA', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      // If parsing fails, return the original string
      return timeString;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'community', 'sports', 'arts', 'music', 'food', 'education', 'business', 'family', 'health', 'other'];

  if (loading) {
    return (
      <FoldableLayout>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-blue-200">Loading events...</p>
          </div>
        </div>
      </FoldableLayout>
    );
  }

  return (
    <FoldableLayout>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 relative">
        {/* Modern Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-float" />
        </div>
        
        {/* Modern Hero Header - Dark theme */}
        <AnimatedSection>
          <div className="relative bg-white/10 backdrop-blur-lg border-b border-white/20 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center space-x-4 mb-6">
                <Button asChild variant="ghost" size="sm" className="text-white hover:text-blue-200 hover:bg-white/10">
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
                  <Calendar className="h-12 w-12 text-blue-400" />
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Events
                    </h1>
                    <p className="text-xl text-blue-200 mt-2">
                      Discover what&apos;s happening in Wetaskiwin
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Top Ad - Google AdSense Leaderboard */}
        <AnimatedSection delay={0.1}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdPlaceholder 
              type="google" 
              size="leaderboard" 
              className="w-full max-w-4xl mx-auto" 
            />
          </div>
        </AnimatedSection>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Modern Search and Filter */}
          <AnimatedSection delay={0.15}>
            <div className="card-glass p-6 rounded-2xl mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300 backdrop-blur-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-white" />
                  <select
                    aria-label="Filter events by category"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
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
          </AnimatedSection>

          {/* Platinum Business Spotlight */}
          <AnimatedSection delay={0.2}>
            <div className="mb-8">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Event Sponsors</h3>
                <p className="text-sm text-white">Supporting our community events</p>
              </div>
              <div className="flex justify-center">
                <AdPlaceholder 
                  type="platinum" 
                  size="large" 
                  className="w-full max-w-md" 
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <>
              <AnimatedSection delay={0.25}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredEvents.slice(0, 6).map((event) => (
                  <Card key={event.id} className="card-glass overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/5 border-white/10">
                    {event.imageUrl && (
                      <div className="h-48 bg-gray-700/50/50 relative">
                        <Image
                          src={event.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant={event.featured ? 'default' : 'secondary'} className="bg-blue-600/20 text-blue-300 border-blue-400/30">
                            {event.category}
                          </Badge>
                          <NewBadge addedAt={event.addedAt} />
                        </div>
                        {event.featured && (
                          <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black border-0">
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">
                        {event.title}
                      </h3>
                      
                      <p className="text-white mb-4 line-clamp-3">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-white">
                          <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center text-sm text-white">
                          <Clock className="h-4 w-4 mr-2 text-green-400" />
                          {formatTime(event.time)}
                        </div>
                        <div className="flex items-center text-sm text-white">
                          <MapPin className="h-4 w-4 mr-2 text-red-400" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-sm text-white">
                          <Users className="h-4 w-4 mr-2 text-purple-400" />
                          {event.organizer}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {event.website && (
                          <Button asChild size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                            <a href={event.website} target="_blank" rel="noopener noreferrer">
                              Website
                            </a>
                          </Button>
                        )}
                        {event.ticketUrl && (
                          <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0">
                            <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                              Get Tickets
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                </div>
              </AnimatedSection>

              {/* Mid-page Ad */}
              {filteredEvents.length > 6 && (
                <AnimatedSection delay={0.3}>
                  <div className="mb-8">
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
                </AnimatedSection>
              )}

              {/* Remaining Events */}
              {filteredEvents.length > 6 && (
                <AnimatedSection delay={0.35}>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.slice(6).map((event) => (
                      <Card key={event.id} className="card-glass overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/5 border-white/10">
                        {event.imageUrl && (
                          <div className="h-48 bg-gray-700/50/50 relative">
                            <Image 
                              src={event.imageUrl} 
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-400/30">{event.category}</Badge>
                              <NewBadge addedAt={event.addedAt} />
                            </div>
                            {event.featured && <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black border-0">Featured</Badge>}
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                          <p className="text-white mb-4 line-clamp-2">{event.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-white">
                              <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                              {formatDate(event.date)}
                            </div>
                            <div className="flex items-center text-sm text-white">
                              <Clock className="h-4 w-4 mr-2 text-green-400" />
                              {formatTime(event.time)}
                            </div>
                            <div className="flex items-center text-sm text-white">
                              <MapPin className="h-4 w-4 mr-2 text-red-400" />
                              {event.location}
                            </div>
                            <div className="flex items-center text-sm text-white">
                              <Users className="h-4 w-4 mr-2 text-purple-400" />
                              {event.organizer}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {event.website && (
                              <Button asChild size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                <a href={event.website} target="_blank" rel="noopener noreferrer">
                                  Website
                                </a>
                              </Button>
                            )}
                            {event.ticketUrl && (
                              <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0">
                                <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                                  Get Tickets
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </AnimatedSection>
              )}
            </>
          ) : (
            <AnimatedSection delay={0.25}>
              <Card className="card-glass p-12 text-center bg-white/5 border-white/10">
                <Calendar className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
                <p className="text-white">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No events are currently available.'}
                </p>
              </Card>
            </AnimatedSection>
          )}

          {/* Bottom Ad Section */}
          <AnimatedSection delay={0.4}>
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Community Partners</h3>
                <p className="text-sm text-white">Supporting events in Wetaskiwin</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdPlaceholder type="silver" size="square" />
                <AdPlaceholder type="gold" size="square" />
                <AdPlaceholder type="silver" size="square" />
                <AdPlaceholder type="gold" size="square" />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </FoldableLayout>
  );
};

export default EventsPage;
