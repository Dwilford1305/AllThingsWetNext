'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MessageCircle, Clock, User, Send } from 'lucide-react';
import type { Discussion } from '@/types';

type DiscussionUser = {
  id?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
};

interface DiscussionDetailProps {
  discussion: Discussion;
  currentUser: DiscussionUser | undefined;
  isLoading: boolean;
  onCommentAdded: (updatedDiscussion: Discussion) => void;
}

const DiscussionDetail: React.FC<DiscussionDetailProps> = ({
  discussion,
  currentUser,
  isLoading,
  onCommentAdded
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const discussionDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - discussionDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }

    setIsSubmittingComment(true);
    setCommentError('');

    try {
      const response = await fetch(`/api/discussions/${discussion.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the discussion with the new comment
        const updatedDiscussion = {
          ...discussion,
          comments: [...discussion.comments, data.data],
          updatedAt: new Date()
        };
        onCommentAdded(updatedDiscussion);
        setNewComment('');
      } else {
        setCommentError(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentError('An error occurred while adding the comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Discussion Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="secondary">Q&A</Badge>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            {formatTimeAgo(discussion.createdAt)}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {discussion.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <User className="w-4 h-4" />
          <span>Asked by User {discussion.author}</span>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {discussion.content}
          </p>
        </div>
      </Card>

      {/* Comments Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comments ({discussion.comments?.length || 0})
          </h2>
        </div>

        {/* Comment Form */}
        {currentUser && !isLoading && (
          <form onSubmit={handleCommentSubmit} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {commentError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{commentError}</p>
              </div>
            )}

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts or answer this question..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              maxLength={1000}
            />

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {newComment.length}/1000 characters
              </p>
              <Button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        )}

        {/* Sign in prompt for non-authenticated users */}
        {!currentUser && !isLoading && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Sign in to join the discussion and post comments
            </p>
            <Link href="/api/auth/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {discussion.comments && discussion.comments.length > 0 ? (
            discussion.comments.map((comment) => (
              <div key={comment.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>User {comment.author}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(comment.createdAt)}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <MessageCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DiscussionDetail;