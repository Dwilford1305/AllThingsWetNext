'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { Event, NewsArticle } from '@/types';

const Dashboard = () => {
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent events
        const eventsResponse = await fetch('/api/events?limit=3');
        const eventsData = await eventsResponse.json();
        
        if (eventsData.success && eventsData.data) {
          setRecentEvents(eventsData.data);
        }

        // Fetch recent news
        const newsResponse = await fetch('/api/news?limit=3');
        const newsData = await newsResponse.json();
        
        if (newsData.success && newsData.data) {
          setRecentNews(newsData.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
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

  if (loading) {
    return (
      <div className="min-h-screen-50 flex items-center justify-center">
        <motion.div 
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
          <motion.div 
            className="absolute inset-2 border-4 border-secondary-200 border-t-secondary-600 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative py-20 md:py-32">
      {/* Modern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/30" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-purple-100/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-100/20 to-orange-100/30 rounded-full blur-3xl animate-pulse-slow" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Modern Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-6 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 font-semibold text-sm mb-6"
          >
            ✨ Community Hub
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            What&apos;s Happening Now
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Discover the pulse of Wetaskiwin with the latest events, news, and community updates
          </p>
        </motion.div>

        {/* Enhanced Content Grid */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Recent Events Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Upcoming Events</h3>
                <p className="text-neutral-600">Don&apos;t miss out on community happenings</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105 hover:shadow-lg transition-all duration-300">
                  <Link href="/events">View All</Link>
                </Button>
              </motion.div>
            </div>
            
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100/50 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <motion.div 
                        className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl flex-shrink-0 shadow-lg"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Calendar className="h-5 w-5 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-300 mb-2">
                          {event.title}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Clock className="h-4 w-4 mr-2 text-blue-500" />
                          <span>
                            {formatDate(event.date)} at {formatTime(event.time)}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-600 mb-3">
                            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.category && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {event.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {recentEvents.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100/50 p-6 text-center text-gray-500">
                  No upcoming events found.
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent News */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Latest News</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/news">View All</Link>
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentNews.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {formatDate(article.publishedAt)}
                    </div>
                    {article.category && (
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                    )}
                  </div>
                </Card>
                </motion.div>
              ))}
              {recentNews.length === 0 && (
                <Card className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                  No recent news found.
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
