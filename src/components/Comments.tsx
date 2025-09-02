'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MessageCircle, Flag, Send, AlertTriangle, ThumbsUp } from 'lucide-react'
import type { MarketplaceComment } from '@/types'
import ReportModal from './ReportModal'
import { authenticatedFetch } from '@/lib/auth-fetch'
import { ensureCsrfCookie } from '@/lib/csrf'

interface CommentsProps {
  listingId: string
  isAuthenticated: boolean
}

export default function Comments({ listingId, isAuthenticated }: CommentsProps) {
  const [comments, setComments] = useState<MarketplaceComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)
  // Track SSE connection to decide whether to optimistically update or refetch
  const [sseConnected, setSseConnected] = useState(false)

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/marketplace/${listingId}/comments`)
      const result = await response.json()
      
      if (result.success) {
        // Ensure newest-first ordering
        const sorted = [...result.data].sort((a: MarketplaceComment, b: MarketplaceComment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setComments(sorted)
      } else {
        setError('Failed to load comments')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Live updates via SSE with fallback polling
  useEffect(() => {
    let es: EventSource | null = null
    let pollTimer: number | null = null
    const startSSE = () => {
      try {
        es = new EventSource(`/api/marketplace/${listingId}/comments/events`)
        es.onopen = () => setSseConnected(true)
        es.onerror = () => {
          setSseConnected(false)
          es?.close()
          es = null
          // Start polling fallback
          if (!pollTimer) {
            pollTimer = window.setInterval(fetchComments, 15000)
          }
        }
        es.onmessage = (evt) => {
          try {
            const parsed = JSON.parse(evt.data)
            if (parsed?.type === 'new_comment' && parsed?.data) {
              setComments(prev => {
                const exists = prev.some(c => c.id === parsed.data.id)
                if (exists) return prev
                const next = [parsed.data, ...prev]
                // Keep newest-first
                return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              })
            }
          } catch {}
        }
      } catch {
        // If SSE fails immediately, start polling
        pollTimer = window.setInterval(fetchComments, 15000)
      }
    }
    startSSE()
    return () => {
      es?.close()
      if (pollTimer) window.clearInterval(pollTimer)
    }
  }, [listingId, fetchComments])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    setIsSubmitting(true)
    setError('')

    try {
      // Ensure CSRF cookie exists for double-submit protection
      if (typeof window !== 'undefined') ensureCsrfCookie()

      const response = await authenticatedFetch(`/api/marketplace/${listingId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })

      const result = await response.json()

  if (result.success) {
        // Don’t optimistically append to avoid duplicate with SSE event
        setNewComment('')
        if (!sseConnected) {
          // If SSE not connected, refresh comments immediately
          await fetchComments()
        }
      } else {
        setError(result.error || 'Failed to add comment')
      }
    } catch (error) {
  setError('An error occurred while adding the comment')
      console.error('Comment submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReportComment = async (reason: string, description: string) => {
    if (!reportingCommentId) return

    try {
      if (typeof window !== 'undefined') ensureCsrfCookie()

      const response = await authenticatedFetch(`/api/marketplace/comments/${reportingCommentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description })
      })

      const result = await response.json()

      if (result.success) {
        // Update the comment to show it's been reported
        setComments(prev => 
          prev.map(comment => 
            comment.id === reportingCommentId 
              ? { ...comment, isReported: true, reportCount: comment.reportCount + 1 }
              : comment
          )
        )
        setReportingCommentId(null)
        alert('Report submitted successfully. Our team will review it shortly.')
      } else {
        setError(result.error || 'Failed to submit report')
      }
    } catch (error) {
      setError('An error occurred while submitting the report')
      console.error('Report submission error:', error)
    }
  }

  const reactToComment = async (commentId: string, reaction: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => {
    try {
      if (typeof window !== 'undefined') ensureCsrfCookie()
      const response = await authenticatedFetch(`/api/marketplace/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })
      const result = await response.json()
      if (result.success) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: result.data.reactions } : c))
      }
    } catch (e) {
      console.error('Reaction failed', e)
    }
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const datePart = d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
    const timePart = d.toLocaleTimeString('en-CA', { hour12: false }) // HH:MM:SS
    return `${datePart} ${timePart}`
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-gray-600" />
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Comments ({comments.length})
          </h3>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Comment form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="mb-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              variant="primary"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600">You must be logged in to comment</p>
          </div>
        )}

        {/* Comments list */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">
                    {comment.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.userName}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.isReported && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">Reported</span>
                        </div>
                      )}
                    </div>
                    {isAuthenticated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportingCommentId(comment.id)}
                        className="text-gray-600 hover:text-red-600 p-1"
                        title="Report comment"
                      >
                        <Flag className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
          <div className="flex items-center gap-2 mt-2">
                    {isAuthenticated && (
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary-600 p-1" onClick={() => reactToComment(comment.id, 'like')}>
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span className="text-xs">{comment.reactions?.like?.length || 0}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </Card>

      <ReportModal
        isOpen={reportingCommentId !== null}
        onClose={() => setReportingCommentId(null)}
        onSubmit={handleReportComment}
        title="Report Comment"
        description="Help us maintain a safe community by reporting inappropriate comments."
      />
    </>
  )
}