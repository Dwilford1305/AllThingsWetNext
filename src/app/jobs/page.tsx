'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import { Briefcase, MapPin, DollarSign, Clock, Building, ArrowLeft, Search, Filter, ExternalLink } from 'lucide-react';
import type { JobPosting } from '@/types';

const JobsPage = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        if (data.success) {
          setJobs(data.data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const formatSalary = (job: JobPosting) => {
    return job.salaryRange || 'Salary not specified';
  };

  const formatPostedDate = (date: Date | string) => {
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  const jobTypes = ['all', 'full-time', 'part-time', 'contract', 'temporary', 'internship'];

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
              <Briefcase className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
                <p className="text-gray-600">Find your next career opportunity in Wetaskiwin</p>
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
                  placeholder="Search jobs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  aria-label="Filter jobs by type"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {jobTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Job Types' : type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Job Spotlight - Hiring Partners */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Featured Employers</h3>
              <p className="text-sm text-gray-600">Top companies hiring in Wetaskiwin</p>
            </div>
            <div className="flex justify-center">
              <AdPlaceholder 
                type="platinum" 
                size="large" 
                className="w-full max-w-md" 
              />
            </div>
          </div>

          {/* Jobs List */}
          {filteredJobs.length > 0 ? (
            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {job.title}
                          </h3>
                          <Badge variant="primary">
                            {job.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                          {job.featured && (
                            <Badge variant="default" className="bg-yellow-500 text-black">
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <Building className="h-4 w-4 mr-2" />
                          <span className="font-medium">{job.company}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatSalary(job)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatPostedDate(job.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {job.description}
                    </p>
                    
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Key Requirements:</h4>
                        <div className="flex flex-wrap gap-1">
                          {job.requirements.slice(0, 5).map((requirement, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {requirement}
                            </Badge>
                          ))}
                          {job.requirements.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requirements.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        {job.contactEmail && (
                          <span>Contact: {job.contactEmail}</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {job.applicationUrl && (
                          <Button asChild size="sm">
                            <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Apply Now
                            </a>
                          </Button>
                        )}
                        {job.contactEmail && !job.applicationUrl && (
                          <Button asChild size="sm">
                            <a href={`mailto:${job.contactEmail}?subject=Application for ${job.title}&body=Dear Hiring Manager,%0D%0A%0D%0AI am interested in applying for the ${job.title} position at ${job.company}.%0D%0A%0D%0ABest regards`}>
                              Apply via Email
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No job postings are currently available.'}
              </p>
            </Card>
          )}

          {/* Bottom Career Services Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Development Partners</h3>
              <p className="text-sm text-gray-600">Supporting career growth in our community</p>
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

export default JobsPage;
