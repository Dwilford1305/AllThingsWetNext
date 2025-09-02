'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { X, AlertCircle } from 'lucide-react'
import type { MarketplaceListing, MarketplaceCategory, MarketplaceCondition } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { ensureCsrfCookie } from '@/lib/csrf'
import { authenticatedFetch } from '@/lib/auth-fetch'

interface MarketplaceListingFormProps {
  isOpen: boolean
  onClose: () => void
  listing?: Partial<MarketplaceListing> // For editing existing listings
  onSuccess?: () => void
}

interface QuotaInfo {
  monthly: number
  used: number
  remaining: number
  hasQuotaAvailable: boolean
}

const categories: { value: MarketplaceCategory; label: string }[] = [
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'clothing', label: 'Clothing & Accessories' },
  { value: 'sports', label: 'Sports & Recreation' },
  { value: 'tools', label: 'Tools & Equipment' },
  { value: 'books', label: 'Books & Media' },
  { value: 'pets', label: 'Pets & Pet Supplies' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' }
]

const conditions: { value: MarketplaceCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
]

export default function MarketplaceListingForm({ isOpen, onClose, listing, onSuccess }: MarketplaceListingFormProps) {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as MarketplaceCategory,
    price: '',
    condition: 'good' as MarketplaceCondition,
    location: '',
  // contactName is derived server-side from user profile (username or firstName)
    contactEmail: '',
    contactPhone: '',
    images: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [quota, setQuota] = useState<QuotaInfo | null>(null)

  // Load listing data for editing
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        category: listing.category || 'other',
        price: listing.price?.toString() || '',
        condition: listing.condition || 'good',
        location: listing.location || '',
  // contactName is not user-editable here; display-only where needed
        contactEmail: listing.contactEmail || '',
        contactPhone: listing.contactPhone || '',
        images: listing.images || []
      })
    }
  }, [listing])

  // Check quota on mount if creating new listing
  const checkQuota = useCallback(async () => {
    try {
      if (!isAuthenticated) return;

      const response = await authenticatedFetch('/api/marketplace/quota');

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setQuota(result.data.quota)
        }
      }
    } catch (error) {
      console.error('Error checking quota:', error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isOpen && !listing) {
  // Ensure CSRF cookie exists for POST/PUT requests
  if (typeof window !== 'undefined') ensureCsrfCookie()
      checkQuota()
    }
  }, [isOpen, listing, checkQuota])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      if (!isAuthenticated) {
        setError('You must be logged in to create listings')
        setIsSubmitting(false)
        return
      }

      // For new listings, check quota availability
      if (!listing && quota && quota.hasQuotaAvailable === false) {
        setError('You have reached your monthly listing quota. Please upgrade your subscription or wait for quota reset.')
        setIsSubmitting(false)
        return
      }

      const url = listing ? `/api/marketplace/${listing.id}` : '/api/marketplace'
      const method = listing ? 'PUT' : 'POST'
      
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined
      }

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

  const result = await response.json()

      if (result.success) {
        onSuccess?.()
        onClose()
        const q = result.data?.quota
        if (q) {
          // Basic success notice; integrate with your toast system if present
          alert(`Listing created. Remaining this month: ${q.monthly === -1 ? 'Unlimited' : q.remaining}/${q.monthly === -1 ? 'Unlimited' : q.monthly}`)
        }
        // Reset form for new listings
        if (!listing) {
          setFormData({
            title: '',
            description: '',
            category: 'other',
            price: '',
            condition: 'good',
            location: '',
            contactEmail: '',
            contactPhone: '',
            images: []
          })
        }
      } else {
        setError(result.error || 'Failed to save listing')
      }
    } catch (error) {
      setError('An error occurred while saving the listing')
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {listing ? 'Edit Listing' : 'Create New Listing'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 p-2"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

      {/* Quota info for new listings */}
      {!listing && (
            <div className={`mb-6 p-4 rounded-lg border ${
        quota?.hasQuotaAvailable === true 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${
          quota?.hasQuotaAvailable === true ? 'text-green-600' : 'text-red-600'
                }`} />
                <div>
                  <p className={`font-medium ${
          quota?.hasQuotaAvailable === true ? 'text-green-800' : 'text-red-800'
                  }`}>
          {quota
            ? (quota.hasQuotaAvailable === true 
              ? `Listings Available: ${quota.remaining}/${quota.monthly === -1 ? 'Unlimited' : quota.monthly}`
              : 'Quota Exceeded')
            : 'Checking your quota...'}
                  </p>
          {quota?.hasQuotaAvailable === false && (
                    <p className="text-red-700 text-sm mt-1">
                      You&apos;ve used all your monthly listings. Upgrade your subscription for more.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What are you selling?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your item in detail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as MarketplaceCategory }))}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as MarketplaceCondition }))}
                >
                  {conditions.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00 (leave blank for 'Price on request')"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Wetaskiwin, AB"
                />
              </div>
            </div>

            {/* Contact name is set automatically from your profile (username or first name) */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="(780) 123-4567"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={Boolean(isSubmitting || (!listing && quota && quota.hasQuotaAvailable !== true))}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {isSubmitting ? 'Saving...' : (listing ? 'Update Listing' : 'Create Listing')}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}