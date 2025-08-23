'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import DiscussionDetail from '@/components/DiscussionDetail';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import type { Discussion } from '@/types';

interface PageProps {
  params: { id: string };
}

const DiscussionDetailPage = ({ params }: PageProps) => {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { user, isLoading } = useUser();

  const fetchDiscussion = useCallback(async () => {
    try {
      const response = await fetch(`/api/discussions/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setDiscussion(data.data);
      } else if (response.status === 404) {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching discussion:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  const handleCommentAdded = (updatedDiscussion: Discussion) => {
    setDiscussion(updatedDiscussion);
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <FoldableLayout>
          <div className="container mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </FoldableLayout>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Navigation />
        <FoldableLayout>
          <div className="container mx-auto px-4 py-6">
            <Card className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Discussion Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The discussion you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Link href="/discussions">
                <Button className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Discussions
                </Button>
              </Link>
            </Card>
          </div>
        </FoldableLayout>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <FoldableLayout>
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/discussions"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Discussions</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {discussion && (
                <DiscussionDetail
                  discussion={discussion}
                  currentUser={user}
                  isLoading={isLoading}
                  onCommentAdded={handleCommentAdded}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <AdPlaceholder type="google" size="sidebar" />
              
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Related Discussions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browse more discussions in the community
                </p>
                <Link href="/discussions" className="mt-3 block">
                  <Button variant="secondary" size="sm" className="w-full">
                    View All Discussions
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </FoldableLayout>
    </>
  );
};

export default DiscussionDetailPage;