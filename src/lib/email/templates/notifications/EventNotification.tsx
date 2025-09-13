import { Text, Button, Section, Row, Column } from '@react-email/components'
import * as React from 'react'
import BaseTemplate from '../base/BaseTemplate'

interface Event {
  title: string
  date: string
  time: string
  location: string
  description: string
  url?: string
}

interface EventNotificationProps {
  firstName: string
  events: Event[]
  period: string // e.g., "This Week" or "This Weekend"
  unsubscribeUrl: string
  trackingId?: string
}

export const EventNotification = ({ 
  firstName, 
  events,
  period,
  unsubscribeUrl,
  trackingId
}: EventNotificationProps) => {
  return (
    <BaseTemplate 
      preview={`${events.length} upcoming events ${period.toLowerCase()} in Wetaskiwin`}
      trackingId={trackingId}
    >
      <Text style={heading}>🎉 {period} in Wetaskiwin</Text>
      
      <Text style={paragraph}>
        Hi {firstName},
      </Text>
      
      <Text style={paragraph}>
        Don&apos;t miss out on these exciting events happening in our community! We&apos;ve found <strong>{events.length} upcoming event{events.length !== 1 ? 's' : ''}</strong> that might interest you.
      </Text>

      {events.map((event, index) => (
        <Section key={index} style={eventCard}>
          <Text style={eventTitle}>{event.title}</Text>
          
          <Row style={eventDetails}>
            <Column style={eventDetailColumn}>
              <Text style={eventMeta}>
                📅 <strong>{event.date}</strong>
              </Text>
              <Text style={eventMeta}>
                🕐 {event.time}
              </Text>
              <Text style={eventMeta}>
                📍 {event.location}
              </Text>
            </Column>
          </Row>
          
          <Text style={eventDescription}>
            {event.description}
          </Text>
          
          {event.url && (
            <Section style={buttonContainer}>
              <Button 
                href={event.url}
                style={eventButton}
              >
                Learn More
              </Button>
            </Section>
          )}
        </Section>
      ))}

      <Section style={ctaSection}>
        <Text style={ctaText}>
          <strong>Want to see more events?</strong>
        </Text>
        <Text style={paragraph}>
          Visit our events page to discover all upcoming activities, filter by your interests, and never miss what&apos;s happening in Wetaskiwin.
        </Text>
        
        <Section style={buttonContainer}>
          <Button 
            href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/events`}
            style={primaryButton}
          >
            Browse All Events
          </Button>
        </Section>
      </Section>

      <Text style={paragraph}>
        <strong>Event organizer?</strong> List your event on AllThingsWetaskiwin to reach more community members and boost attendance.
      </Text>

      <Text style={paragraph}>
        Stay connected,<br />
        The AllThingsWetaskiwin Team
      </Text>

      <Text style={unsubscribeNote}>
        You&apos;re receiving this because you opted in to event notifications. You can{' '}
        <a href={unsubscribeUrl} style={unsubscribeLink}>
          unsubscribe from event emails
        </a>{' '}
        or{' '}
        <a href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profile`} style={unsubscribeLink}>
          manage your preferences
        </a>.
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

const eventCard = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const eventTitle = {
  fontSize: '18px',
  lineHeight: '1.4',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 12px',
}

const eventDetails = {
  margin: '0 0 12px',
}

const eventDetailColumn = {
  width: '100%',
}

const eventMeta = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '0 0 4px',
}

const eventDescription = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0',
}

const eventButton = {
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  color: '#2563eb',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 16px',
  border: '1px solid #2563eb',
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
}

const ctaSection = {
  margin: '32px 0 24px',
  padding: '24px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  textAlign: 'center' as const,
}

const ctaText = {
  fontSize: '18px',
  lineHeight: '1.4',
  color: '#1f2937',
  margin: '0 0 12px',
}

const unsubscribeNote = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '24px 0 0',
  padding: '12px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
}

const unsubscribeLink = {
  color: '#2563eb',
  textDecoration: 'none',
}

export default EventNotification