'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Globe,
  User,
  MessageSquare,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface BusinessRequest {
  _id: string
  id: string
  userId: string
  userEmail: string
  userName: string
  businessName: string
  businessType: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  requestMessage: string
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

interface BusinessRequestStats {
  pending: number
  approved: number
  rejected: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function BusinessRequestManager() {
  const [requests, setRequests] = useState<BusinessRequest[]>([])
  const [stats, setStats] = useState<BusinessRequestStats>({ pending: 0, approved: 0, rejected: 0 })
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<BusinessRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadRequests()
  }, [selectedStatus, pagination.page]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/business-requests?status=${selectedStatus}&page=${pagination.page}&limit=${pagination.limit}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        setStats(data.stats)
        setPagination(data.pagination)
      } else {
        const errorData = await response.text()
        console.error('Failed to load business requests:', response.status, errorData)
      }
    } catch (error) {
      console.error('Failed to load business requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'rejected') => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/business-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': (typeof document !== 'undefined' ? document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1] : '') || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId,
          status,
          adminNotes: adminNotes.trim()
        })
      })

      if (response.ok) {
        await loadRequests()
        setSelectedRequest(null)
        setAdminNotes('')
      } else {
        const error = await response.json()
        alert(`Failed to update request: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update request:', error)
      alert('Failed to update request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    }
    
    const variant = variants[status as keyof typeof variants]
    const Icon = variant.icon
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1 text-xs font-medium px-2 py-1 border`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (selectedRequest) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedRequest(null)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to List
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Business Request Details</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedRequest.businessName}</h3>
                <p className="text-sm text-gray-600">{selectedRequest.businessType}</p>
              </div>
              
              {selectedRequest.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {selectedRequest.address}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {selectedRequest.phone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <a href={`mailto:${selectedRequest.email}`} className="text-blue-600 hover:underline">
                    {selectedRequest.email}
                  </a>
                </div>
                {selectedRequest.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedRequest.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requester Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                <User className="h-5 w-5" />
                Requester Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Contact Name</h4>
                <p className="text-sm">{selectedRequest.userName}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Email</h4>
                <a href={`mailto:${selectedRequest.userEmail}`} className="text-sm text-blue-600 hover:underline">
                  {selectedRequest.userEmail}
                </a>
              </div>

              <div>
                <h4 className="font-medium mb-1">Request Status</h4>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div>
                <h4 className="font-medium mb-1">Submitted</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {formatDate(selectedRequest.createdAt)}
                </div>
              </div>

              {selectedRequest.requestMessage && (
                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Additional Message
                  </h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedRequest.requestMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        {selectedRequest.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 font-semibold">Review & Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {isSubmitting ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Business Listing Requests</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-3 md:ml-4 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Pending</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3 md:ml-4 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Approved</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-3 md:ml-4 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Rejected</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3 md:ml-4 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Total</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.pending + stats.approved + stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            setPagination(prev => ({ ...prev, page: 1 }))
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-full sm:w-auto"
          title="Filter requests by status"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 font-semibold">Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No requests found</div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="border border-gray-200 rounded-lg p-3 md:p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{request.businessName}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{request.businessType}</p>
                      <p className="text-sm text-gray-500">Submitted by {request.userName}</p>
                    </div>
                    <div className="text-left sm:text-right text-sm text-gray-500 flex-shrink-0">
                      <p>{formatDate(request.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <span className="text-sm text-gray-600 px-2">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
            className="w-full sm:w-auto"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
