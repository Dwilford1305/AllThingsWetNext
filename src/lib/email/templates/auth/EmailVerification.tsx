import { Text, Button, Section } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface EmailVerificationProps {
  firstName: string
  verificationUrl: string
  trackingId?: string
}

export const EmailVerification = ({ 
  firstName, 
  verificationUrl,
  trackingId
}: EmailVerificationProps) => {
  return (
    <BaseTemplate 
      preview={`Welcome to AllThingsWet, ${firstName}! Please verify your email address.`}
      trackingId={trackingId}
    >
      <Text style={heading}>Welcome to AllThingsWet, {firstName}! 🎉</Text>
      
      <Text style={paragraph}>
        Thank you for joining the Wetaskiwin community! We're excited to have you as part of our growing network of residents, business owners, and community members.
      </Text>
      
      <Text style={paragraph}>
        To get started and unlock all features, please verify your email address by clicking the button below:
      </Text>

      <Section style={buttonContainer}>
        <Button 
          href={verificationUrl}
          style={button}
        >
          Verify Email Address
        </Button>
      </Section>

      <Text style={paragraph}>
        <strong>What you can do with your verified account:</strong>
      </Text>
      
      <Text style={listItem}>✅ Browse and connect with local businesses</Text>
      <Text style={listItem}>✅ Stay updated with community events and news</Text>
      <Text style={listItem}>✅ Buy, sell, and trade in our marketplace</Text>
      <Text style={listItem}>✅ Claim and manage your business listing</Text>
      <Text style={listItem}>✅ Get personalized notifications</Text>

      <Text style={paragraph}>
        If the button above doesn't work, you can also copy and paste this link into your browser:
      </Text>
      
      <Text style={linkText}>
        {verificationUrl}
      </Text>

      <Text style={paragraph}>
        <strong>Security Note:</strong> This verification link will expire in 60 minutes for security reasons. If you didn't create this account, you can safely ignore this email.
      </Text>

      <Text style={paragraph}>
        Welcome to the community!<br />
        The AllThingsWet Team
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
  margin: '32px 0',
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

const linkText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#2563eb',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
  padding: '12px',
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
}

export default EmailVerification