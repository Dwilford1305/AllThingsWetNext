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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            What&apos;s Happening Now
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 px-4">
            Stay up-to-date with the latest events and news in Wetaskiwin
          </p>
        </motion.div>

        {/* Recent Content */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Recent Events */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Upcoming Events</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/events">View All</Link>
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(event.date)} at {formatTime(event.time)}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.category && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {event.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
                </motion.div>
              ))}
              {recentEvents.length === 0 && (
                <Card className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                  No upcoming events found.
                </Card>
              )}
            </div>
          </div>

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
