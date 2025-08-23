'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AdPlaceholder from '@/components/AdPlaceholder';
import NewBadge from '@/components/NewBadge';
import DiscussionList from '@/components/DiscussionList';
import NewDiscussionForm from '@/components/NewDiscussionForm';
import { MessageCircle, Plus, Users } from 'lucide-react';
import type { Discussion } from '@/types';

const DiscussionsPage = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDiscussionForm, setShowNewDiscussionForm] = useState(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const response = await fetch('/api/discussions');
      const data = await response.json();
      if (data.success) {
        setDiscussions(data.data);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscussionCreated = (newDiscussion: Discussion) => {
    setDiscussions([newDiscussion, ...discussions]);
    setShowNewDiscussionForm(false);
  };

  return (
    <>
      <Navigation />
      <FoldableLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Community Q&A
                  <NewBadge />
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Ask questions and share knowledge with the community
                </p>
              </div>
            </div>

            {user && !isLoading && (
              <Button
                onClick={() => setShowNewDiscussionForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Discussion
              </Button>
            )}
          </div>

          {/* Stats */}
          <Card className="mb-8 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Active community members sharing knowledge
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {discussions.length} discussions
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* New Discussion Form Modal */}
              {showNewDiscussionForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <NewDiscussionForm
                      onDiscussionCreated={handleDiscussionCreated}
                      onCancel={() => setShowNewDiscussionForm(false)}
                    />
                  </div>
                </div>
              )}

              {/* Discussion List */}
              <DiscussionList 
                discussions={discussions}
                loading={loading}
              />

              {/* Sign in prompt for non-authenticated users */}
              {!user && !isLoading && (
                <Card className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Join the conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Sign in to ask questions and participate in discussions
                  </p>
                  <Link href="/api/auth/login">
                    <Button>Sign In</Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <AdPlaceholder size="sidebar" />
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Community Guidelines
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Be respectful and constructive</li>
                  <li>• Search before posting duplicate questions</li>
                  <li>• Provide context and details</li>
                  <li>• Help others when you can</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </FoldableLayout>
    </>
  );
};

export default DiscussionsPage;