'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MessageCircle, Clock } from 'lucide-react';
import type { Discussion } from '@/types';

interface DiscussionListProps {
  discussions: Discussion[];
  loading: boolean;
}

const DiscussionList: React.FC<DiscussionListProps> = ({ discussions, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (discussions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No discussions yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to start a conversation in the community!
        </p>
      </Card>
    );
  }

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const discussionDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - discussionDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="space-y-4">
      {discussions.map((discussion) => (
        <Card key={discussion.id} className="p-6 hover:shadow-md transition-shadow">
          <Link href={`/discussions/${discussion.id}`} className="block">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {discussion.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ml-4">
                <Clock className="w-4 h-4" />
                {formatTimeAgo(discussion.createdAt)}
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {discussion.content.length > 200 
                ? `${discussion.content.substring(0, 200)}...`
                : discussion.content
              }
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{discussion.comments?.length || 0} comments</span>
                </div>
                <span>by User {discussion.author}</span>
              </div>
              
              <Badge variant="secondary">
                Q&A
              </Badge>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default DiscussionList;