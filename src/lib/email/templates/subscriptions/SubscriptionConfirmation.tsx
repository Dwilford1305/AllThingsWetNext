import { Text, Button, Section, Hr } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface SubscriptionConfirmationProps {
  firstName: string
  subscriptionTier: 'free' | 'basic' | 'premium' | 'platinum'
  businessName?: string
  features: string[]
  subscriptionDate: string
  nextBillingDate?: string
  amount?: number
  invoiceUrl?: string
  dashboardUrl: string
  trackingId?: string
}

export const SubscriptionConfirmation = ({ 
  firstName,
  subscriptionTier,
  businessName,
  features,
  subscriptionDate,
  nextBillingDate,
  amount,
  invoiceUrl,
  dashboardUrl,
  trackingId
}: SubscriptionConfirmationProps) => {
  const tierNames = {
    free: 'Free',
    basic: 'Basic',
    premium: 'Premium',
    platinum: 'Platinum'
  }

  const tierColors = {
    free: '#10b981',
    basic: '#3b82f6',
    premium: '#8b5cf6',
    platinum: '#f59e0b'
  }

  return (
    <BaseTemplate 
      preview={`${businessName ? `${businessName} subscription` : 'Your subscription'} to ${tierNames[subscriptionTier]} plan confirmed!`}
      trackingId={trackingId}
    >
      <Section style={headerSection}>
        <Text style={heading}>Subscription Confirmed! 🎉</Text>
        <Section style={{ ...tierBadge, backgroundColor: tierColors[subscriptionTier] }}>
          <Text style={tierText}>{tierNames[subscriptionTier]} Plan</Text>
        </Section>
      </Section>
      
      <Text style={paragraph}>
        Hi {firstName},
      </Text>
      
      <Text style={paragraph}>
        Great news! Your {businessName ? `${businessName}` : ''} subscription to the <strong>{tierNames[subscriptionTier]} plan</strong> has been successfully activated on AllThingsWetaskiwin.
      </Text>

      {amount && (
        <Section style={billingSection}>
          <Text style={billingHeading}>Billing Summary</Text>
          <Text style={billingDetail}>Plan: <strong>{tierNames[subscriptionTier]}</strong></Text>
          <Text style={billingDetail}>Amount: <strong>${amount.toFixed(2)} CAD</strong></Text>
          <Text style={billingDetail}>Subscription Date: <strong>{new Date(subscriptionDate).toLocaleDateString()}</strong></Text>
          {nextBillingDate && (
            <Text style={billingDetail}>Next Billing: <strong>{new Date(nextBillingDate).toLocaleDateString()}</strong></Text>
          )}
        </Section>
      )}

      <Text style={sectionHeading}>What's Included in Your {tierNames[subscriptionTier]} Plan</Text>
      
      <Section style={featuresSection}>
        {features.map((feature, index) => (
          <Text key={index} style={featureItem}>✅ {feature}</Text>
        ))}
      </Section>

      <Text style={paragraph}>
        Your enhanced features are now active! Start exploring everything your {tierNames[subscriptionTier]} plan has to offer.
      </Text>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={primaryButton}>
          Access Your Dashboard
        </Button>
      </Section>

      {invoiceUrl && (
        <Section style={buttonContainer}>
          <Button href={invoiceUrl} style={secondaryButton}>
            Download Invoice
          </Button>
        </Section>
      )}

      <Hr style={divider} />

      <Section style={supportSection}>
        <Text style={supportHeading}>Need Help?</Text>
        <Text style={paragraph}>
          Our support team is here to help you make the most of your subscription:
        </Text>
        <Text style={supportItem}>📧 Email us at support@allthingswet.ca</Text>
        <Text style={supportItem}>💬 Visit our help center for guides and tutorials</Text>
        <Text style={supportItem}>🔧 Manage your subscription anytime in your dashboard</Text>
      </Section>

      <Text style={paragraph}>
        Welcome to the enhanced AllThingsWetaskiwin experience!
      </Text>

      <Text style={paragraph}>
        Best regards,<br />
        The AllThingsWetaskiwin Team
      </Text>
    </BaseTemplate>
  )
}

// Styles
const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1e293b',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const tierBadge = {
  display: 'inline-block',
  padding: '8px 20px',
  borderRadius: '20px',
  margin: '0 auto',
}

const tierText = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#475569',
  margin: '0 0 16px 0',
}

const sectionHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '32px 0 16px 0',
  textAlign: 'center' as const,
}

const billingSection = {
  backgroundColor: '#f8fafc',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  margin: '24px 0',
}

const billingHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 16px 0',
}

const billingDetail = {
  fontSize: '16px',
  color: '#475569',
  margin: '0 0 8px 0',
}

const featuresSection = {
  backgroundColor: '#f0fdf4',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #bbf7d0',
  margin: '16px 0 32px 0',
}

const featureItem = {
  fontSize: '16px',
  color: '#15803d',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0 16px 0',
}

const primaryButton = {
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
  cursor: 'pointer',
}

const secondaryButton = {
  backgroundColor: '#64748b',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  border: 'none',
  cursor: 'pointer',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '32px 0',
}

const supportSection = {
  backgroundColor: '#fefbeb',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #fed7aa',
  margin: '24px 0',
}

const supportHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 12px 0',
}

const supportItem = {
  fontSize: '15px',
  color: '#b45309',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
}

export default SubscriptionConfirmation