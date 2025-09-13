import {
  Html,
  Head,
  Font,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Link,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface BaseTemplateProps {
  preview?: string
  children: React.ReactNode
  hideFooter?: boolean
  trackingId?: string
}

export const BaseTemplate = ({ 
  preview, 
  children, 
  hideFooter = false,
  trackingId
}: BaseTemplateProps) => {
  const logoUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Row>
              <Column>
                <Img
                  src={`${logoUrl}/logo.png`}
                  width="150"
                  height="40"
                  alt="AllThingsWetaskiwin"
                  style={logo}
                />
              </Column>
            </Row>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          {!hideFooter && (
            <>
              <Hr style={hr} />
              <Section style={footer}>
                <Text style={footerText}>
                  <strong>AllThingsWetaskiwin</strong> - Your Wetaskiwin Community Hub
                </Text>
                <Text style={footerText}>
                  Stay connected with local businesses, events, and news in Wetaskiwin, Alberta.
                </Text>
                <Row style={footerLinks}>
                  <Column>
                    <Link href={`${siteUrl}/businesses`} style={footerLink}>
                      Business Directory
                    </Link>
                  </Column>
                  <Column>
                    <Link href={`${siteUrl}/events`} style={footerLink}>
                      Events
                    </Link>
                  </Column>
                  <Column>
                    <Link href={`${siteUrl}/news`} style={footerLink}>
                      Local News
                    </Link>
                  </Column>
                  <Column>
                    <Link href={`${siteUrl}/marketplace`} style={footerLink}>
                      Marketplace
                    </Link>
                  </Column>
                </Row>
                <Text style={footerText}>
                  <Link href={`${siteUrl}/profile`} style={footerLink}>
                    Update email preferences
                  </Link>
                  {' • '}
                  <Link href={`${siteUrl}/privacy-policy`} style={footerLink}>
                    Privacy Policy
                  </Link>
                  {' • '}
                  <Link href={`${siteUrl}/terms-of-service`} style={footerLink}>
                    Terms of Service
                  </Link>
                </Text>
                <Text style={unsubscribeText}>
                  If you no longer wish to receive these emails, you can{' '}
                  <Link href={`${siteUrl}/unsubscribe`} style={footerLink}>
                    unsubscribe here
                  </Link>
                  .
                </Text>
              </Section>
            </>
          )}
        </Container>
        
        {/* Tracking Pixel for Analytics */}
        {trackingId && (
          <Img
            src={`${siteUrl}/api/email/track/open?id=${trackingId}`}
            width="1"
            height="1"
            alt=""
            style={{ display: 'block', border: 'none' }}
          />
        )}
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
  fontFamily: '"Inter", "Arial", sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  margin: '0 auto',
  padding: '20px',
  width: '600px',
  maxWidth: '100%',
}

const header = {
  paddingBottom: '20px',
  borderBottom: '1px solid #e6e6e6',
  marginBottom: '20px',
}

const logo = {
  margin: '0 auto',
  display: 'block',
}

const content = {
  margin: '0',
  padding: '0',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '20px 0',
}

const footer = {
  paddingTop: '20px',
}

const footerText = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '5px 0',
}

const footerLinks = {
  margin: '10px 0',
}

const footerLink = {
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: '12px',
}

const unsubscribeText = {
  fontSize: '11px',
  lineHeight: '16px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '10px 0 0 0',
}

export default BaseTemplate