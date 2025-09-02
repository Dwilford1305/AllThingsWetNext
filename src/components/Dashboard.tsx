'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
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
    if (timeString.includes('AM') || timeString.includes('PM') || timeString.toLowerCase().includes('all day')) {
      return timeString;
    }
    
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-CA', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="site-container">
          <div className="dashboard-loading">
            <motion.div 
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="spinner-outer"></div>
              <motion.div 
                className="spinner-inner"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section dashboard-section">
      <div className="site-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="dashboard-header"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="dashboard-badge"
          >
            📊 Community Hub
          </motion.div>
          
          <h2 className="dashboard-title">
            What&apos;s Happening Now
          </h2>
          <p className="dashboard-subtitle">
            Discover the pulse of Wetaskiwin with the latest events, news, and community updates
          </p>
        </motion.div>

        {/* Content Grid */}
        <motion.div 
          className="dashboard-grid"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Recent Events Section */}
          <motion.div
            className="dashboard-section-events"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="section-header">
              <div className="section-title-group">
                <h3>Upcoming Events</h3>
                <p>Don&apos;t miss out on community happenings</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="/events" className="button">
                  View All <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
            
            <div className="events-list">
              {recentEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="event-card"
                >
                  <div className="event-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="event-content">
                    <h4 className="event-title">{event.title}</h4>
                    <div className="event-meta">
                      <div className="event-time">
                        <Clock size={14} />
                        <span>{formatDate(event.date)} at {formatTime(event.time)}</span>
                      </div>
                      {event.location && (
                        <div className="event-location">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.category && (
                      <Badge variant="secondary" className="event-category">
                        {event.category}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
              {recentEvents.length === 0 && (
                <div className="empty-state">
                  No upcoming events found.
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent News Section */}
          <motion.div
            className="dashboard-section-news"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="section-header">
              <div className="section-title-group">
                <h3>Latest News</h3>
                <p>Stay informed with community updates</p>
              </div>
              <Link href="/news" className="button button-secondary">
                View All
              </Link>
            </div>
            
            <div className="news-list">
              {recentNews.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                  className="news-card"
                >
                  <h4 className="news-title">{article.title}</h4>
                  <p className="news-summary">{article.summary}</p>
                  <div className="news-meta">
                    <span className="news-date">{formatDate(article.publishedAt)}</span>
                    {article.category && (
                      <Badge variant="secondary" className="news-category">
                        {article.category}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
              {recentNews.length === 0 && (
                <div className="empty-state">
                  No recent news found.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Dashboard;
