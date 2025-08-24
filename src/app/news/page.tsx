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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <FoldableLayout>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50 to-slate-200">
        {/* Modern Hero Header - Lighter theme */}
        <AnimatedSection>
          <div className="relative bg-gradient-to-r from-white/80 via-white/60 to-white/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center space-x-4 mb-6">
                <Button asChild variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-100">
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
                  <Newspaper className="h-12 w-12 text-blue-600" />
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                      News
                    </h1>
                    <p className="text-xl text-gray-600 mt-2">
                      Stay informed with the latest from Wetaskiwin
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
          {/* Search and Filter - Modern light glassmorphism design */}
          <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-white/30 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search news..."
                  className="w-full pl-10 pr-4 py-2 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <select
                  aria-label="Filter news by category"
                  className="px-4 py-2 bg-white/80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-white text-gray-900">
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
              <h3 className="text-lg font-semibold text-gray-800 mb-2">News Sponsors</h3>
              <p className="text-sm text-gray-600">Supporting local journalism</p>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Featured Stories</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {filteredArticles
                  .filter(article => article.featured)
                  .slice(0, 2)
                  .map((article) => (
                    <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg">
                      {article.imageUrl && (
                        <div className="h-48 bg-gray-200 relative">
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6 bg-white/40 backdrop-blur-lg relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="default" className="bg-yellow-500 text-black">
                              Featured
                            </Badge>
                            <NewBadge date={article.publishedAt || article.createdAt} />
                          </div>
                          <Badge variant="secondary" className="bg-gray-200/80 text-gray-800 border-gray-300/50">
                            {article.category.replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {article.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {article.summary}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(article.publishedAt)}
                            </div>
                            {article.author && (
                              <span>by {article.author}</span>
                            )}
                          </div>
                          <span className="text-gray-700 font-medium">{article.sourceName}</span>
                        </div>
                        
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {article.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-gray-100/80 text-gray-700 border-gray-300/50">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <Button asChild size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Latest News</h2>
            {filteredArticles.length > 0 ? (
              <div className="space-y-6">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg">
                    <div className="md:flex">
                      {article.imageUrl && (
                        <div className="md:w-1/3 h-48 md:h-auto bg-gray-200 relative">
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6 bg-white/40 backdrop-blur-lg relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-gray-200/80 text-gray-800 border-gray-300/50">
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
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {article.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-4">
                          {article.summary}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(article.publishedAt)}
                            </div>
                            {article.author && (
                              <span>by {article.author}</span>
                            )}
                          </div>
                          <span className="text-gray-700 font-medium">{article.sourceName}</span>
                        </div>
                        
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {article.tags.slice(0, 5).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-gray-100/80 text-gray-700 border-gray-300/50">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <Button asChild size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
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
              <Card className="p-12 text-center bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg">
                <Newspaper className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No articles found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No news articles are currently available.'}
                </p>
              </Card>
            )}

            {/* Bottom Ad Section */}
            <div className="mt-12 pt-8 border-t border-gray-200/50">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">News Partners</h3>
                <p className="text-sm text-gray-600">Supporting local news coverage</p>
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

export default NewsPage;
