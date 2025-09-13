import { Text, Button, Section, Hr } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface WelcomeProps {
  firstName: string
  lastName: string
  email: string
  verificationUrl: string
  profileUrl: string
  communityStatsUrl: string
  businessesCount: number
  eventsCount: number
  trackingId?: string
}

export const Welcome = ({ 
  firstName,
  lastName,
  email,
  verificationUrl,
  profileUrl,
  communityStatsUrl,
  businessesCount,
  eventsCount,
  trackingId
}: WelcomeProps) => {
  return (
    <BaseTemplate 
      preview={`Welcome to AllThingsWetaskiwin, ${firstName}! Complete your verification to get started.`}
      trackingId={trackingId}
    >
      <Section style={headerSection}>
        <Text style={welcomeHeading}>Welcome to the Wetaskiwin Community! 🏘️</Text>
        <Text style={subheading}>Hi {firstName}, we're excited to have you join us!</Text>
      </Section>
      
      <Text style={paragraph}>
        You've just joined <strong>AllThingsWetaskiwin</strong> - the premier community platform connecting residents, businesses, and visitors in beautiful Wetaskiwin, Alberta.
      </Text>

      <Section style={verificationSection}>
        <Text style={verificationHeading}>🔐 First, Let's Verify Your Email</Text>
        <Text style={paragraph}>
          To unlock all features and ensure account security, please verify your email address:
        </Text>
        <Section style={buttonContainer}>
          <Button href={verificationUrl} style={primaryButton}>
            Verify Email Address
          </Button>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={featuresSection}>
        <Text style={sectionHeading}>What You Can Do on AllThingsWetaskiwin</Text>
        
        <Section style={featureGrid}>
          <Section style={featureCard}>
            <Text style={featureIcon}>🏪</Text>
            <Text style={featureTitle}>Discover Local Businesses</Text>
            <Text style={featureDescription}>
              Explore {businessesCount}+ local businesses, from restaurants to services, all in one place.
            </Text>
          </Section>
          
          <Section style={featureCard}>
            <Text style={featureIcon}>🎉</Text>
            <Text style={featureTitle}>Stay Updated on Events</Text>
            <Text style={featureDescription}>
              Never miss community events! We have {eventsCount}+ upcoming events and activities.
            </Text>
          </Section>
          
          <Section style={featureCard}>
            <Text style={featureIcon}>🛍️</Text>
            <Text style={featureTitle}>Buy, Sell & Trade</Text>
            <Text style={featureDescription}>
              Use our community marketplace to connect with neighbors for buying, selling, and trading.
            </Text>
          </Section>
          
          <Section style={featureCard}>
            <Text style={featureIcon}>📰</Text>
            <Text style={featureTitle}>Local News & Updates</Text>
            <Text style={featureDescription}>
              Stay informed with the latest news and important updates from around Wetaskiwin.
            </Text>
          </Section>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={gettingStartedSection}>
        <Text style={sectionHeading}>Ready to Get Started?</Text>
        
        <Section style={stepsList}>
          <Text style={stepItem}>
            <strong>1.</strong> Verify your email (button above)
          </Text>
          <Text style={stepItem}>
            <strong>2.</strong> Complete your profile with your interests
          </Text>
          <Text style={stepItem}>
            <strong>3.</strong> Explore local businesses and upcoming events  
          </Text>
          <Text style={stepItem}>
            <strong>4.</strong> Join the community conversations
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button href={profileUrl} style={secondaryButton}>
            Complete Your Profile
          </Button>
          <Button href={communityStatsUrl} style={secondaryButton}>
            Explore Community
          </Button>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={tipsSection}>
        <Text style={tipsHeading}>💡 Pro Tips for New Members</Text>
        <Text style={tipItem}>
          🔔 <strong>Set Email Preferences:</strong> Choose how often you want to hear from us in your profile settings
        </Text>
        <Text style={tipItem}>
          🏪 <strong>Business Owner?</strong> Claim your business listing to manage your online presence
        </Text>
        <Text style={tipItem}>
          📱 <strong>Stay Connected:</strong> Bookmark AllThingsWetaskiwin and check back regularly for updates
        </Text>
      </Section>

      <Text style={paragraph}>
        Questions? Need help getting started? Our community team is here to help! Simply reply to this email or contact us through the website.
      </Text>

      <Section style={welcomeFooter}>
        <Text style={footerMessage}>
          Welcome to the community, {firstName}! 🎉
        </Text>
        <Text style={footerSignature}>
          The AllThingsWetaskiwin Team
        </Text>
      </Section>
    </BaseTemplate>
  )
}

// Styles
const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
  backgroundColor: '#f0fdf4',
  padding: '32px 24px',
  borderRadius: '12px',
  border: '1px solid #bbf7d0',
}

const welcomeHeading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#15803d',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const subheading = {
  fontSize: '18px',
  fontWeight: '500',
  color: '#166534',
  margin: '0',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#475569',
  margin: '0 0 16px 0',
}

const verificationSection = {
  backgroundColor: '#fef3f2',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const verificationHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const featuresSection = {
  margin: '32px 0',
}

const sectionHeading = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const featureGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
}

const featureCard = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  textAlign: 'center' as const,
}

const featureIcon = {
  fontSize: '32px',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const featureTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const featureDescription = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
  textAlign: 'center' as const,
  lineHeight: '1.4',
}

const gettingStartedSection = {
  backgroundColor: '#eff6ff',
  padding: '32px 24px',
  borderRadius: '8px',
  border: '1px solid #bfdbfe',
  margin: '32px 0',
}

const stepsList = {
  margin: '24px 0',
}

const stepItem = {
  fontSize: '16px',
  color: '#1e40af',
  margin: '0 0 12px 0',
  lineHeight: '1.5',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0 16px 0',
}

const primaryButton = {
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
  cursor: 'pointer',
  marginBottom: '12px',
}

const secondaryButton = {
  backgroundColor: '#2563eb',
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
  margin: '0 8px 8px 8px',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '32px 0',
}

const tipsSection = {
  backgroundColor: '#fefbeb',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #fed7aa',
  margin: '24px 0',
}

const tipsHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 16px 0',
}

const tipItem = {
  fontSize: '15px',
  color: '#b45309',
  margin: '0 0 12px 0',
  lineHeight: '1.5',
}

const welcomeFooter = {
  textAlign: 'center' as const,
  margin: '32px 0 0 0',
}

const footerMessage = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#15803d',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const footerSignature = {
  fontSize: '16px',
  color: '#475569',
  margin: '0',
  textAlign: 'center' as const,
  fontStyle: 'italic',
}

export default Welcome