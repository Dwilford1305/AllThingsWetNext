import { Text, Button, Section } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface BusinessRejectionProps {
  firstName: string
  businessName: string
  reason: string
  contactUrl: string
  trackingId?: string
}

export const BusinessRejection = ({ 
  firstName, 
  businessName,
  reason,
  contactUrl,
  trackingId
}: BusinessRejectionProps) => {
  return (
    <BaseTemplate 
      preview={`Update needed for ${businessName} business listing`}
      trackingId={trackingId}
    >
      <Text style={heading}>Business Listing Update Required</Text>
      
      <Text style={paragraph}>
        Hi {firstName},
      </Text>
      
      <Text style={paragraph}>
        Thank you for submitting your business listing for <strong>{businessName}</strong>. After reviewing your submission, we need some additional information before we can approve your listing.
      </Text>

      <Section style={reasonBox}>
        <Text style={reasonTitle}>
          📋 <strong>What we need:</strong>
        </Text>
        <Text style={reasonText}>
          {reason}
        </Text>
      </Section>

      <Text style={paragraph}>
        <strong>How to proceed:</strong>
      </Text>
      
      <Text style={listItem}>1. Review the requirements above</Text>
      <Text style={listItem}>2. Gather any additional information or documentation</Text>
      <Text style={listItem}>3. Contact our team with the updated details</Text>
      <Text style={listItem}>4. We'll review and approve your listing promptly</Text>

      <Section style={buttonContainer}>
        <Button 
          href={contactUrl}
          style={button}
        >
          Contact Support Team
        </Button>
      </Section>

      <Text style={helpSection}>
        <strong>💡 Common reasons for review:</strong><br />
        • Business address needs verification<br />
        • Contact information requires confirmation<br />
        • Business category needs clarification<br />
        • Additional documentation required<br />
        • Duplicate listing detected
      </Text>

      <Text style={paragraph}>
        <strong>Don't worry!</strong> Most listing issues are resolved quickly once we receive the additional information. Our team is committed to helping every legitimate business succeed in our directory.
      </Text>

      <Text style={paragraph}>
        We appreciate your patience and look forward to featuring your business in the AllThingsWet directory soon.
      </Text>

      <Text style={paragraph}>
        Best regards,<br />
        The AllThingsWet Review Team
      </Text>

      <Text style={footnote}>
        <strong>Need immediate assistance?</strong> You can also email us directly at support@allthingswet.ca or call during business hours.
      </Text>
    </BaseTemplate>
  )
}

// Styles
const heading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 20px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px',
}

const listItem = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#374151',
  margin: '0 0 8px',
  paddingLeft: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: 'none',
}

const reasonBox = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  border: '1px solid #f59e0b',
}

const reasonTitle = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#92400e',
  margin: '0 0 8px',
}

const reasonText = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#92400e',
  margin: '0',
}

const helpSection = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
}

const footnote = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '24px 0 0',
  padding: '12px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
}

export default BusinessRejection