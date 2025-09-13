import { Text, Button, Section, Hr } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface MarketingProps {
  firstName: string
  campaignTitle: string
  campaignSubtitle?: string
  heroImageUrl?: string
  ctaText: string
  ctaUrl: string
  content: Array<{
    type: 'heading' | 'paragraph' | 'list' | 'highlight'
    text: string
    items?: string[]
  }>
  businessSpotlight?: {
    name: string
    description: string
    imageUrl: string
    url: string
    category: string
  }
  specialOffer?: {
    title: string
    description: string
    offerCode?: string
    expiresAt: string
    termsUrl?: string
  }
  unsubscribeUrl: string
  trackingId?: string
}

export const Marketing = ({ 
  firstName,
  campaignTitle,
  campaignSubtitle,
  heroImageUrl,
  ctaText,
  ctaUrl,
  content,
  businessSpotlight,
  specialOffer,
  unsubscribeUrl,
  trackingId
}: MarketingProps) => {
  return (
    <BaseTemplate 
      preview={campaignSubtitle || campaignTitle}
      trackingId={trackingId}
    >
      <Section style={headerSection}>
        <Text style={campaignHeading}>{campaignTitle}</Text>
        {campaignSubtitle && (
          <Text style={campaignSubtitleStyle}>{campaignSubtitle}</Text>
        )}
      </Section>

      <Text style={greeting}>Hi {firstName},</Text>

      {/* Hero Image */}
      {heroImageUrl && (
        <Section style={heroSection}>
          <img 
            src={heroImageUrl} 
            alt={campaignTitle}
            style={heroImage}
          />
        </Section>
      )}

      {/* Dynamic Content */}
      {content.map((item, index) => {
        switch (item.type) {
          case 'heading':
            return <Text key={index} style={contentHeading}>{item.text}</Text>
          case 'paragraph':
            return <Text key={index} style={paragraph}>{item.text}</Text>
          case 'list':
            return (
              <Section key={index} style={listSection}>
                <Text style={contentHeading}>{item.text}</Text>
                {item.items?.map((listItem, itemIndex) => (
                  <Text key={itemIndex} style={listItemStyle}>✓ {listItem}</Text>
                ))}
              </Section>
            )
          case 'highlight':
            return (
              <Section key={index} style={highlightSection}>
                <Text style={highlightText}>{item.text}</Text>
              </Section>
            )
          default:
            return <Text key={index} style={paragraph}>{item.text}</Text>
        }
      })}

      {/* Special Offer */}
      {specialOffer && (
        <Section style={offerSection}>
          <Text style={offerHeading}>🎉 Special Offer</Text>
          <Text style={offerTitle}>{specialOffer.title}</Text>
          <Text style={paragraph}>{specialOffer.description}</Text>
          
          {specialOffer.offerCode && (
            <Section style={codeSection}>
              <Text style={codeLabel}>Use Code:</Text>
              <Section style={codeBadge}>
                <Text style={codeText}>{specialOffer.offerCode}</Text>
              </Section>
            </Section>
          )}
          
          <Text style={expiryText}>
            Expires: {new Date(specialOffer.expiresAt).toLocaleDateString()}
          </Text>
          
          {specialOffer.termsUrl && (
            <Text style={termsText}>
              <a href={specialOffer.termsUrl} style={link}>Terms and conditions apply</a>
            </Text>
          )}
        </Section>
      )}

      {/* Business Spotlight */}
      {businessSpotlight && (
        <>
          <Hr style={divider} />
          <Section style={spotlightSection}>
            <Text style={spotlightHeading}>🌟 Business Spotlight</Text>
            <Section style={businessCard}>
              {businessSpotlight.imageUrl && (
                <img 
                  src={businessSpotlight.imageUrl} 
                  alt={businessSpotlight.name}
                  style={businessImage}
                />
              )}
              <Text style={businessName}>{businessSpotlight.name}</Text>
              <Text style={businessCategory}>{businessSpotlight.category}</Text>
              <Text style={paragraph}>{businessSpotlight.description}</Text>
              <Section style={buttonContainer}>
                <Button href={businessSpotlight.url} style={secondaryButton}>
                  Visit Business
                </Button>
              </Section>
            </Section>
          </Section>
        </>
      )}

      {/* Main CTA */}
      <Section style={ctaSection}>
        <Section style={buttonContainer}>
          <Button href={ctaUrl} style={primaryButton}>
            {ctaText}
          </Button>
        </Section>
      </Section>

      <Hr style={divider} />

      {/* Community Info */}
      <Section style={communitySection}>
        <Text style={communityHeading}>Join the Wetaskiwin Community</Text>
        <Text style={paragraph}>
          Stay connected with local events, businesses, and news. Be part of what makes Wetaskiwin special!
        </Text>
        <Section style={socialSection}>
          <Text style={socialText}>Follow us for daily updates:</Text>
          {/* Social links would go here */}
        </Section>
      </Section>

      <Text style={unsubscribeText}>
        You're receiving this email because you subscribed to AllThingsWetaskiwin marketing updates.{' '}
        <a href={unsubscribeUrl} style={link}>Unsubscribe</a> or{' '}
        <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/profile#email-preferences`} style={link}>update preferences</a>.
      </Text>
    </BaseTemplate>
  )
}

// Styles
const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
  backgroundColor: '#667eea',
  padding: '40px 24px',
  borderRadius: '12px',
}

const campaignHeading = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
}

const campaignSubtitleStyle = {
  fontSize: '18px',
  fontWeight: '400',
  color: '#e2e8f0',
  margin: '0',
  textAlign: 'center' as const,
}

const greeting = {
  fontSize: '16px',
  color: '#475569',
  margin: '0 0 24px 0',
}

const heroSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const heroImage = {
  maxWidth: '100%',
  height: 'auto',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const contentHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '32px 0 16px 0',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#475569',
  margin: '0 0 16px 0',
}

const listSection = {
  margin: '24px 0',
}

const listItemStyle = {
  fontSize: '16px',
  color: '#059669',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
}

const highlightSection = {
  backgroundColor: '#fef3f2',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const highlightText = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0',
  textAlign: 'center' as const,
}

const offerSection = {
  backgroundColor: '#f0fdf4',
  padding: '32px 24px',
  borderRadius: '12px',
  border: '2px solid #22c55e',
  margin: '32px 0',
  textAlign: 'center' as const,
}

const offerHeading = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#15803d',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const offerTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#166534',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const codeSection = {
  margin: '20px 0',
}

const codeLabel = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const codeBadge = {
  backgroundColor: '#1f2937',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
}

const codeText = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#ffffff',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '0',
}

const expiryText = {
  fontSize: '14px',
  color: '#dc2626',
  margin: '16px 0 0 0',
  fontWeight: '500',
  textAlign: 'center' as const,
}

const termsText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '8px 0 0 0',
  textAlign: 'center' as const,
}

const spotlightSection = {
  margin: '32px 0',
}

const spotlightHeading = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const businessCard = {
  backgroundColor: '#f8fafc',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  textAlign: 'center' as const,
}

const businessImage = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  border: '3px solid #e2e8f0',
  marginBottom: '16px',
}

const businessName = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 4px 0',
  textAlign: 'center' as const,
}

const businessCategory = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
  fontStyle: 'italic',
}

const ctaSection = {
  backgroundColor: '#eff6ff',
  padding: '40px 24px',
  borderRadius: '8px',
  border: '1px solid #bfdbfe',
  margin: '32px 0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0 16px 0',
}

const primaryButton = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
  margin: '40px 0',
}

const communitySection = {
  backgroundColor: '#fefbeb',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #fed7aa',
  margin: '32px 0',
  textAlign: 'center' as const,
}

const communityHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const socialSection = {
  margin: '16px 0 0 0',
}

const socialText = {
  fontSize: '14px',
  color: '#b45309',
  margin: '0',
  textAlign: 'center' as const,
}

const unsubscribeText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
  lineHeight: '1.5',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

export default Marketing