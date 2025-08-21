'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, AlertCircle, Building2, Mail, Phone, MapPin, Globe, MessageSquare, Clock, XCircle, Calendar } from 'lucide-react'

interface BusinessRequestFormData {
  businessName: string
  businessType: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  requestMessage: string
}

interface UserBusinessRequest {
  _id: string
  id: string
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
  createdAt: string
  updatedAt: string
}

const businessTypes = [
  'Restaurant',
  'Retail Store',
  'Service Provider',
  'Health & Wellness',
  'Professional Services',
  'Construction',
  'Technology',
  'Education',
  'Entertainment',
  'Automotive',
  'Real Estate',
  'Other'
]

export default function BusinessRequestForm() {
  const [formData, setFormData] = useState<BusinessRequestFormData>({
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    requestMessage: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [userRequests, setUserRequests] = useState<UserBusinessRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  // Load user's business requests on component mount
  useEffect(() => {
    loadUserRequests()
  }, [])

  const loadUserRequests = async () => {
    try {
      const response = await fetch('/api/business/request', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUserRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to load user requests:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/business/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': (typeof document !== 'undefined' ? document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1] : '') || ''
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setSubmitted(true)
      // Reload user requests to show the new one
      await loadUserRequests()
      // Reset form
      setFormData({
        businessName: '',
        businessType: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        requestMessage: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof BusinessRequestFormData) => (
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  if (submitted) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-semibold text-green-700">Request Submitted!</h3>
              <p className="text-gray-600">
                Your business listing request has been submitted successfully. 
                We&apos;ll review your request and get back to you within 2-3 business days.
              </p>
              <Button 
                onClick={() => setSubmitted(false)}
                variant="outline"
              >
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show updated requests list */}
        {userRequests.length > 0 && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                <Building2 className="h-5 w-5" />
                Your Business Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{request.businessName}</h4>
                        <p className="text-sm text-gray-600">{request.businessType}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Submitted: {formatDate(request.createdAt)}
                      </div>
                    </div>
                    {request.adminNotes && (
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <strong>Admin Notes:</strong> {request.adminNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User's Existing Requests */}
      {!loadingRequests && userRequests.length > 0 && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
              <Building2 className="h-5 w-5" />
              Your Business Requests
            </CardTitle>
            <p className="text-sm text-gray-600">
              Track the status of your business listing requests.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{request.businessName}</h4>
                      <p className="text-sm text-gray-600">{request.businessType}</p>
                      <p className="text-sm text-gray-500">{request.address}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Submitted: {formatDate(request.createdAt)}
                    </div>
                  </div>
                  {request.adminNotes && (
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <strong>Admin Notes:</strong> {request.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Form */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
            <Building2 className="h-5 w-5" />
            Request Business Listing
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Submit your business information to be added to our directory. 
            All requests are reviewed by our team before approval.
          </p>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Business Name */}
          <div className="space-y-2">
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
              Business Name *
            </label>
            <input
              id="businessName"
              type="text"
              placeholder="Enter your business name"
              value={formData.businessName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('businessName')(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
              Business Type *
            </label>
            <select 
              id="businessType"
              value={formData.businessType} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('businessType')(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select business type</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Business Description
            </label>
            <textarea
              id="description"
              placeholder="Describe your business, services, or products..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description')(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4" />
              Address *
            </label>
            <input
              id="address"
              type="text"
              placeholder="Business address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('address')(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4" />
                Phone *
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Business phone number"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone')(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4" />
                Email *
              </label>
              <input
                id="email"
                type="email"
                placeholder="Business email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email')(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label htmlFor="website" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Globe className="h-4 w-4" />
              Website
            </label>
            <input
              id="website"
              type="url"
              placeholder="https://your-website.com (optional)"
              value={formData.website}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('website')(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Request Message */}
          <div className="space-y-2">
            <label htmlFor="requestMessage" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MessageSquare className="h-4 w-4" />
              Additional Message
            </label>
            <textarea
              id="requestMessage"
              placeholder="Any additional information or special requests..."
              value={formData.requestMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('requestMessage')(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
      </Card>
    </div>
  )
}
