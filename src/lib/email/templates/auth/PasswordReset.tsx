import { Text, Button, Section } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface PasswordResetProps {
  firstName: string
  resetUrl: string
  trackingId?: string
}

export const PasswordReset = ({ 
  firstName, 
  resetUrl,
  trackingId
}: PasswordResetProps) => {
  return (
    <BaseTemplate 
      preview={`Password reset request for your AllThingsWetaskiwin account`}
      trackingId={trackingId}
    >
      <Text style={heading}>Password Reset Request</Text>
      
      <Text style={paragraph}>
        Hi {firstName},
      </Text>
      
      <Text style={paragraph}>
        We received a request to reset the password for your AllThingsWetaskiwin account. If this was you, click the button below to create a new password:
      </Text>

      <Section style={buttonContainer}>
        <Button 
          href={resetUrl}
          style={button}
        >
          Reset Password
        </Button>
      </Section>

      <Text style={paragraph}>
        If the button doesn't work, you can copy and paste this link into your browser:
      </Text>
      
      <Text style={linkText}>
        {resetUrl}
      </Text>

      <Text style={securityBox}>
        <strong>🔒 Security Information:</strong><br />
        • This link will expire in 60 minutes<br />
        • You can only use this link once<br />
        • If you didn't request this reset, you can safely ignore this email<br />
        • Your current password will remain unchanged until you complete the reset
      </Text>

      <Text style={paragraph}>
        <strong>Need help?</strong> If you're having trouble resetting your password or didn't request this change, please contact our support team.
      </Text>

      <Text style={paragraph}>
        Best regards,<br />
        The AllThingsWetaskiwin Team
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#dc2626',
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

const securityBox = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#374151',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#fef3c7',
  borderRadius: '6px',
  border: '1px solid #f59e0b',
}

export default PasswordReset