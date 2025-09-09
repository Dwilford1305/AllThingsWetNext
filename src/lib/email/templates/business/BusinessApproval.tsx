import { Text, Button, Section } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface BusinessApprovalProps {
  firstName: string
  businessName: string
  businessId: string
  dashboardUrl: string
  businessUrl: string
  trackingId?: string
}

export const BusinessApproval = ({ 
  firstName, 
  businessName,
  businessId,
  dashboardUrl,
  businessUrl,
  trackingId
}: BusinessApprovalProps) => {
  return (
    <BaseTemplate 
      preview={`🎉 ${businessName} is now live on AllThingsWetaskiwinq!`}
      trackingId={trackingId}
    >
      <Text style={heading}>🎉 Great News! Your Business is Live!</Text>
      
      <Text style={paragraph}>
        Hi {firstName},
      </Text>
      
      <Text style={paragraph}>
        Congratulations! Your business listing for <strong>{businessName}</strong> has been approved and is now live on our directory. Your business is now visible to thousands of potential customers in the Wetaskiwin community!
      </Text>

      <Section style={successBox}>
        <Text style={successText}>
          ✅ <strong>Your listing is active</strong><br />
          📍 Visible in our business directory<br />
          🔍 Searchable by category and location<br />
          📊 Ready to track customer engagement
        </Text>
      </Section>

      <Text style={paragraph}>
        <strong>What's next?</strong>
      </Text>

      <Section style={buttonContainer}>
        <Button 
          href={dashboardUrl}
          style={primaryButton}
        >
          Manage Your Business
        </Button>
      </Section>

      <Section style={buttonContainer}>
        <Button 
          href={businessUrl}
          style={secondaryButton}
        >
          View Your Listing
        </Button>
      </Section>

      <Text style={paragraph}>
        <strong>Maximize your business potential:</strong>
      </Text>
      
      <Text style={listItem}>📸 Add photos and your business logo</Text>
      <Text style={listItem}>⏰ Update your business hours</Text>
      <Text style={listItem}>📝 Complete your business description</Text>
      <Text style={listItem}>🔗 Add your website and social media links</Text>
      <Text style={listItem}>🎯 Consider upgrading to a premium plan for enhanced features</Text>

      <Text style={upgradeSection}>
        <strong>Ready to stand out?</strong> Our premium plans offer featured placement, analytics, photo galleries, and priority support to help your business grow.
      </Text>

      <Text style={paragraph}>
        If you have any questions about managing your listing or our premium features, our support team is here to help.
      </Text>

      <Text style={paragraph}>
        Welcome to the AllThingsWetaskiwinq business community!<br />
        The AllThingsWetaskiwinq Team
      </Text>

      <Text style={footnote}>
        Business ID: {businessId}
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
  margin: '16px 0',
}

const primaryButton = {
  backgroundColor: '#059669',
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

const secondaryButton = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  color: '#2563eb',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: '2px solid #2563eb',
}

const successBox = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  border: '1px solid #10b981',
}

const successText = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#065f46',
  margin: '0',
}

const upgradeSection = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '24px 0 16px',
  padding: '16px',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  borderLeft: '4px solid #2563eb',
}

const footnote = {
  fontSize: '12px',
  lineHeight: '1.4',
  color: '#9ca3af',
  margin: '24px 0 0',
}

export default BusinessApproval