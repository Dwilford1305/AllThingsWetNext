import { Text, Button, Section, Hr } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface NewsletterProps {
  firstName: string
  articles: Array<{
    title: string
    excerpt: string
    url: string
    category: string
    publishedAt: string
  }>
  events: Array<{
    title: string
    date: string
    time: string
    location: string
    url?: string
  }>
  businesses: Array<{
    name: string
    description: string
    category: string
    url: string
  }>
  unsubscribeUrl: string
  trackingId?: string
}

export const Newsletter = ({ 
  firstName,
  articles,
  events,
  businesses,
  unsubscribeUrl,
  trackingId
}: NewsletterProps) => {
  return (
    <BaseTemplate 
      preview={`Your weekly Wetaskiwin community update - ${articles.length} news articles, ${events.length} events, and more!`}
      trackingId={trackingId}
    >
      <Text style={heading}>Weekly Community Update for {firstName} 📰</Text>
      
      <Text style={paragraph}>
        Stay connected with what's happening in Wetaskiwin! Here's your personalized weekly roundup of community news, events, and business highlights.
      </Text>

      {/* News Section */}
      {articles.length > 0 && (
        <>
          <Text style={sectionHeading}>📰 Local News</Text>
          {articles.slice(0, 3).map((article, index) => (
            <Section key={index} style={articleSection}>
              <Text style={articleTitle}>{article.title}</Text>
              <Text style={articleMeta}>{article.category} • {new Date(article.publishedAt).toLocaleDateString()}</Text>
              <Text style={paragraph}>{article.excerpt}</Text>
              <Button href={article.url} style={linkButton}>
                Read More
              </Button>
            </Section>
          ))}
          <Hr style={divider} />
        </>
      )}

      {/* Events Section */}
      {events.length > 0 && (
        <>
          <Text style={sectionHeading}>🎉 Upcoming Events</Text>
          {events.slice(0, 3).map((event, index) => (
            <Section key={index} style={eventSection}>
              <Text style={eventTitle}>{event.title}</Text>
              <Text style={eventDetails}>
                📅 {new Date(event.date).toLocaleDateString()} at {event.time}<br />
                📍 {event.location}
              </Text>
              {event.url && (
                <Button href={event.url} style={linkButton}>
                  Learn More
                </Button>
              )}
            </Section>
          ))}
          <Hr style={divider} />
        </>
      )}

      {/* Featured Businesses */}
      {businesses.length > 0 && (
        <>
          <Text style={sectionHeading}>🏪 Featured Local Businesses</Text>
          {businesses.slice(0, 2).map((business, index) => (
            <Section key={index} style={businessSection}>
              <Text style={businessName}>{business.name}</Text>
              <Text style={businessCategory}>{business.category}</Text>
              <Text style={paragraph}>{business.description}</Text>
              <Button href={business.url} style={linkButton}>
                Visit Business
              </Button>
            </Section>
          ))}
          <Hr style={divider} />
        </>
      )}

      <Text style={paragraph}>
        <strong>Want to customize your newsletter?</strong><br />
        Manage your email preferences to choose what content you'd like to receive and how often.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${process.env.NEXT_PUBLIC_SITE_URL}/profile#email-preferences`} style={button}>
          Manage Email Preferences
        </Button>
      </Section>

      <Text style={smallText}>
        You received this newsletter because you're subscribed to AllThingsWetaskiwin community updates.{' '}
        <a href={unsubscribeUrl} style={link}>Unsubscribe</a> or{' '}
        <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/profile#email-preferences`} style={link}>update preferences</a>.
      </Text>
    </BaseTemplate>
  )
}

// Styles
const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 24px 0',
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
  margin: '24px 0 16px 0',
  paddingBottom: '8px',
  borderBottom: '2px solid #e2e8f0',
}

const articleSection = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid #e2e8f0',
}

const articleTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 8px 0',
}

const articleMeta = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 12px 0',
  fontStyle: 'italic',
}

const eventSection = {
  backgroundColor: '#fef3f2',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid #fecaca',
}

const eventTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#7c2d12',
  margin: '0 0 8px 0',
}

const eventDetails = {
  fontSize: '14px',
  color: '#a16207',
  margin: '0 0 12px 0',
  lineHeight: '1.5',
}

const businessSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid #bbf7d0',
}

const businessName = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#14532d',
  margin: '0 0 4px 0',
}

const businessCategory = {
  fontSize: '14px',
  color: '#16a34a',
  margin: '0 0 12px 0',
  fontWeight: '500',
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
  padding: '12px 24px',
  border: 'none',
  cursor: 'pointer',
}

const linkButton = {
  backgroundColor: '#0ea5e9',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 16px',
  border: 'none',
  cursor: 'pointer',
  marginTop: '8px',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '32px 0',
}

const smallText = {
  fontSize: '13px',
  color: '#64748b',
  margin: '24px 0 0 0',
  textAlign: 'center' as const,
  lineHeight: '1.5',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

export default Newsletter