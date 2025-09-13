'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { X, Flag } from 'lucide-react'
import type { ReportReason } from '@/types'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: ReportReason, description: string) => void
  title?: string
  description?: string
}

const reportReasons: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'Repetitive, irrelevant, or promotional content'
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Offensive, vulgar, or inappropriate material'
  },
  {
    value: 'scam',
    label: 'Scam or Fraud',
    description: 'Suspicious or fraudulent activity'
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, threats, or harassment'
  },
  {
    value: 'copyright',
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other policy violation or concern'
  }
]

export default function ReportModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = 'Report Content',
  description = 'Help us maintain a safe community by reporting inappropriate content.'
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      // Focus the first focusable element when modal opens
      const modalElement = document.querySelector('[role="dialog"]')
      const firstFocusable = modalElement?.querySelector('input, button, [tabindex="0"]') as HTMLElement
      firstFocusable?.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reportDescription.trim()) {
      setError('Please provide a description of the issue')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit(selectedReason, reportDescription.trim())
      
      // Reset form
      setSelectedReason('spam')
      setReportDescription('')
    } catch (error) {
      setError('Failed to submit report')
      console.error('Report submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('spam')
      setReportDescription('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      aria-describedby="report-modal-description"
    >
      <Card className="w-full max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Flag className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h2 id="report-modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
                <p id="report-modal-description" className="text-sm text-gray-700">{description}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-700 hover:text-gray-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
              aria-label="Close report dialog"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-800 mb-3">
                What's the issue?
              </legend>
              <div className="space-y-3" role="radiogroup" aria-required="true">
                {reportReasons.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors focus-within:ring-2 focus-within:ring-blue-500"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value as ReportReason)}
                      className="mt-1 text-primary-600 focus:ring-primary-500"
                      required
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {reason.label}
                      </div>
                      <div className="text-sm text-gray-700">
                        {reason.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="report-description" className="block text-sm font-medium text-gray-800 mb-2">
                Additional details *
              </label>
              <textarea
                id="report-description"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide specific details about why you're reporting this content..."
                disabled={isSubmitting}
                aria-describedby="report-description-help"
              />
              <p id="report-description-help" className="mt-1 text-xs text-gray-700">
                Be specific about the issue to help our moderators review it quickly.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !reportDescription.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}