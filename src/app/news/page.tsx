'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/ui/Navigation';
import ConditionalLayout from '@/components/ConditionalLayout';
import AnimatedSection from '@/components/AnimatedSection';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import NewBadge from '@/components/NewBadge';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, ExternalLink, ArrowLeft, Search, Filter } from 'lucide-react';
import type { NewsArticle } from '@/types';

const NewsPage = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        const data = await response.json();
        if (data.success) {
          setArticles(data.data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'local-news', 'city-council', 'business', 'sports', 'community', 'education', 'health', 'weather', 'other'];

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </>
    );
  }

  return (
    <ConditionalLayout>
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
                  <Newspaper className="h-12 w-12 text-blue-400" />
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      News
                    </h1>
                    <p className="text-xl text-blue-200 mt-2">
                      Stay informed with the latest from Wetaskiwin
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Top Ad - Google AdSense Leaderboard */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <AdPlaceholder 
            type="google" 
            size="leaderboard" 
            className="w-full max-w-4xl mx-auto" 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">{/* Search and Filter - Dark glassmorphism design */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-white/20 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search news..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-blue-200 backdrop-blur-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-200" />
                <select
                  aria-label="Filter news by category"
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-slate-800 text-white">
                      {category === 'all' ? 'All Categories' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* News Sponsor Spotlight */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">News Sponsors</h3>
              <p className="text-sm text-blue-200">Supporting local journalism</p>
            </div>
            <div className="flex justify-center">
              <AdPlaceholder 
                type="platinum" 
                size="large" 
                className="w-full max-w-md" 
              />
            </div>
          </div>

          {/* Featured Articles */}
          {filteredArticles.some(article => article.featured) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Featured Stories</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {filteredArticles
                  .filter(article => article.featured)
                  .slice(0, 2)
                  .map((article) => (
                    <Card key={article.id} className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/15 hover:shadow-xl transition-all duration-300">
                      {article.imageUrl && (
                        <div className="h-48 bg-gray-700/50 relative">
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover rounded-t-lg"
                          />
                        </div>
                      )}
                      <div className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="default" className="bg-yellow-500 text-black">
                              Featured
                            </Badge>
                            <NewBadge date={article.publishedAt || article.createdAt} />
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-blue-200 border-white/20">
                            {article.category.replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">
                          {article.title}
                        </h3>
                        
                        <p className="text-blue-100 mb-4 line-clamp-3">
                          {article.summary}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-blue-300 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(article.publishedAt)}
                            </div>
                            {article.author && (
                              <span>by {article.author}</span>
                            )}
                          </div>
                          <span className="text-blue-200 font-medium">{article.sourceName}</span>
                        </div>
                        
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {article.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-white/10 text-blue-200 border-white/20">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <Button asChild size="sm" variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900">
                          <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Read Full Article
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* All Articles */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Latest News</h2>
            {filteredArticles.length > 0 ? (
              <div className="space-y-6">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/15 hover:shadow-xl transition-all duration-300">
                    <div className="md:flex">
                      {article.imageUrl && (
                        <div className="md:w-1/3 h-48 md:h-auto bg-gray-700/50 relative">
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover rounded-l-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-white/20 text-blue-200 border-white/20">
                              {article.category.replace('-', ' ')}
                            </Badge>
                            <NewBadge date={article.publishedAt || article.createdAt} />
                          </div>
                          {article.featured && (
                            <Badge variant="default" className="bg-yellow-500 text-black">
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">
                          {article.title}
                        </h3>
                        
                        <p className="text-blue-100 mb-4">
                          {article.summary}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-blue-300 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(article.publishedAt)}
                            </div>
                            {article.author && (
                              <span>by {article.author}</span>
                            )}
                          </div>
                          <span className="text-blue-200 font-medium">{article.sourceName}</span>
                        </div>
                        
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {article.tags.slice(0, 5).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-white/10 text-blue-200 border-white/20">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <Button asChild size="sm" variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-gray-900">
                          <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Read Full Article
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                <Newspaper className="h-12 w-12 text-blue-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No articles found</h3>
                <p className="text-blue-200">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No news articles are currently available.'}
                </p>
              </Card>
            )}

            {/* Bottom Ad Section */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">News Partners</h3>
                <p className="text-sm text-blue-200">Supporting local news coverage</p>
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
    </ConditionalLayout>
  );
};

export default NewsPage;
