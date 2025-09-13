import { render } from '@react-email/render'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import { EmailQueue, EmailAnalytics, EmailPreferences } from '../../../models/email'
import { User } from '../../../models/auth'
import { Document } from 'mongoose'

// Define interfaces for better typing
interface EmailQueueDocument extends Document {
  id: string
  to: string
  from: string
  subject: string
  html: string
  text?: string
  templateType: EmailTemplateType
  templateData?: EmailTemplateData
  status: string
  priority: string
  scheduledFor: Date
  sentAt?: Date
  attempts: number
  maxAttempts?: number
  nextRetryAt?: Date
  lastError?: string
  errorHistory: Array<{
    error: string
    occurredAt: Date
  }>
  trackingId?: string
  userId?: string
  businessId?: string
  campaignId?: string
  save(): Promise<this>
}

interface EmailAnalyticsDocument extends Document {
  emailId: string
  openCount: number
  clickCount: number
  clickedUrls: Array<{
    url: string
    clickedAt: Date
    count: number
  }>
  opened?: boolean
  openedAt?: Date
  clicked?: boolean
  clickedAt?: Date
  deviceInfo?: {
    userAgent?: string
    ip?: string
    browser?: string
    os?: string
    device?: string
  }
}

interface QueryFilter {
  [key: string]: unknown
}

// Import email templates
import EmailVerification from '../templates/auth/EmailVerification'
import PasswordReset from '../templates/auth/PasswordReset'
import BusinessApproval from '../templates/business/BusinessApproval'
import BusinessRejection from '../templates/business/BusinessRejection'
import EventNotification from '../templates/notifications/EventNotification'

export type EmailTemplateType = 
  | 'email_verification'
  | 'password_reset'
  | 'business_approval'
  | 'business_rejection'
  | 'business_request_confirmation'
  | 'event_notification'
  | 'newsletter'
  | 'subscription_confirmation'
  | 'welcome'
  | 'marketing'

export interface EmailTemplateData {
  [key: string]: unknown
}

export interface EmailOptions {
  to: string
  subject: string
  templateType: EmailTemplateType
  templateData?: EmailTemplateData
  userId?: string
  businessId?: string
  campaignId?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  scheduledFor?: Date
  trackingEnabled?: boolean
}

export class ComprehensiveEmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  /**
   * Queue an email for sending
   */
  static async queueEmail(options: EmailOptions): Promise<string> {
    const emailId = uuidv4()
    const trackingId = options.trackingEnabled !== false ? uuidv4() : undefined

    try {
      // Check if user has email preferences and is not unsubscribed
      const canSendEmail = await this.canSendEmail(options.to, options.templateType, options.userId)
      if (!canSendEmail) {
        console.log(`Email blocked by user preferences: ${options.to} for ${options.templateType}`)
        return emailId
      }

      // Render email template
      const { html, text } = await this.renderTemplate(options.templateType, {
        ...options.templateData,
        trackingId
      })

      // Create queue entry
      const queueEntry = new EmailQueue({
        id: emailId,
        to: options.to,
        from: process.env.SMTP_FROM || 'noreply@allthingswet.ca',
        subject: options.subject,
        html,
        text,
        templateType: options.templateType,
        templateData: options.templateData,
        priority: options.priority || 'normal',
        scheduledFor: options.scheduledFor || new Date(),
        trackingId,
        userId: options.userId,
        businessId: options.businessId,
        campaignId: options.campaignId
      })

      await queueEntry.save()

      // Create analytics entry if tracking enabled
      if (trackingId) {
        const analytics = new EmailAnalytics({
          id: uuidv4(),
          emailId: trackingId,
          templateType: options.templateType,
          recipientEmail: options.to,
          recipientId: options.userId,
          subject: options.subject,
          campaignId: options.campaignId
        })
        await analytics.save()
      }

      return emailId
    } catch (error) {
      console.error('Failed to queue email:', error)
      throw error
    }
  }

  /**
   * Process email queue (called by cron job)
   */
  static async processQueue(batchSize: number = 10): Promise<void> {
    try {
      // Get pending emails to send
      const pendingEmails = await EmailQueue.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() }
      })
      .sort({ priority: -1, scheduledFor: 1 })
      .limit(batchSize)

      for (const email of pendingEmails) {
        await this.sendQueuedEmail(email)
      }
    } catch (error) {
      console.error('Failed to process email queue:', error)
    }
  }

  /**
   * Send a queued email
   */
  private static async sendQueuedEmail(queueEntry: EmailQueueDocument): Promise<void> {
    try {
      // Update status to processing
      queueEntry.status = 'processing'
      queueEntry.attempts += 1
      await queueEntry.save()

      // Send email
      const info = await this.transporter.sendMail({
        from: queueEntry.from,
        to: queueEntry.to,
        subject: queueEntry.subject,
        html: queueEntry.html,
        text: queueEntry.text,
      })

      // Update queue entry as sent
      queueEntry.status = 'sent'
      queueEntry.sentAt = new Date()
      await queueEntry.save()

      // Update analytics if tracking ID exists
      if (queueEntry.trackingId) {
        await EmailAnalytics.findOneAndUpdate(
          { emailId: queueEntry.trackingId },
          { 
            deliveredAt: new Date(),
            deliveryStatus: 'delivered',
            providerMessageId: info.messageId
          }
        )
      }

      console.log('Email sent successfully:', info.messageId)
    } catch (error) {
      console.error('Failed to send email:', error)
      
      // Handle retry logic
      const maxAttempts = queueEntry.maxAttempts || 3
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (queueEntry.attempts < maxAttempts) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, queueEntry.attempts) * 60 * 1000 // Minutes to milliseconds
        queueEntry.status = 'retrying'
        queueEntry.nextRetryAt = new Date(Date.now() + retryDelay)
        queueEntry.lastError = errorMessage
        queueEntry.errorHistory.push({
          error: errorMessage,
          occurredAt: new Date()
        })
      } else {
        // Mark as failed
        queueEntry.status = 'failed'
        queueEntry.lastError = errorMessage
        
        // Update analytics
        if (queueEntry.trackingId) {
          await EmailAnalytics.findOneAndUpdate(
            { emailId: queueEntry.trackingId },
            { deliveryStatus: 'failed' }
          )
        }
      }
      
      await queueEntry.save()
    }
  }

  /**
   * Render email template to HTML and text
   */
  private static async renderTemplate(templateType: EmailTemplateType, data: EmailTemplateData): Promise<{ html: string; text: string }> {
    let html: string
    
    switch (templateType) {
      case 'email_verification':
        html = await render(EmailVerification(data as { firstName: string; verificationUrl: string }))
        break
      case 'password_reset':
        html = await render(PasswordReset(data as { firstName: string; resetUrl: string }))
        break
      case 'business_approval':
        html = await render(BusinessApproval(data as { firstName: string; businessName: string; businessId: string; dashboardUrl: string; businessUrl: string }))
        break
      case 'business_rejection':
        html = await render(BusinessRejection(data as { firstName: string; businessName: string; reason: string; contactUrl: string }))
        break
      case 'event_notification':
        html = await render(EventNotification(data as { 
          firstName: string; 
          events: Array<{
            title: string;
            date: string;
            time: string;
            location: string;
            description: string;
            url?: string;
          }>; 
          period: string; 
          unsubscribeUrl: string;
        }))
        break
      default:
        throw new Error(`Unknown template type: ${templateType}`)
    }

    // Generate text version (basic HTML to text conversion)
    const text = html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    return { html, text }
  }

  /**
   * Check if we can send email to user based on preferences
   */
  private static async canSendEmail(email: string, templateType: EmailTemplateType, userId?: string): Promise<boolean> {
    try {
      // Transactional emails (auth, business) can always be sent
      const transactionalTypes = [
        'email_verification',
        'password_reset',
        'business_approval',
        'business_rejection',
        'business_request_confirmation'
      ]
      
      if (transactionalTypes.includes(templateType)) {
        return true
      }

      // Check user preferences for marketing emails
      let preferences
      if (userId) {
        preferences = await EmailPreferences.findOne({ userId })
      } else {
        preferences = await EmailPreferences.findOne({ email })
      }

      if (!preferences) {
        // No preferences set, allow marketing emails by default
        return true
      }

      // Check global unsubscribe
      if (preferences.unsubscribedFromAll) {
        return false
      }

      // Check specific preferences
      switch (templateType) {
        case 'newsletter':
          return preferences.preferences.newsletter
        case 'event_notification':
          return preferences.preferences.eventNotifications
        case 'marketing':
          return preferences.preferences.marketing
        default:
          return true
      }
    } catch (error) {
      console.error('Error checking email preferences:', error)
      // Default to allowing email if there's an error
      return true
    }
  }

  /**
   * Track email open
   */
  static async trackOpen(trackingId: string, userAgent?: string, ip?: string): Promise<void> {
    try {
      const analytics = await EmailAnalytics.findOne({ emailId: trackingId })
      if (!analytics) return

      const updateData: Partial<EmailAnalyticsDocument & { updatedAt: Date }> = {
        opened: true,
        openCount: analytics.openCount + 1,
        updatedAt: new Date()
      }

      if (!analytics.openedAt) {
        updateData.openedAt = new Date()
      }

      if (userAgent || ip) {
        updateData.deviceInfo = {
          ...analytics.deviceInfo,
          userAgent,
          ip,
          // You could parse userAgent for browser/OS/device info here
        }
      }

      await EmailAnalytics.findOneAndUpdate(
        { emailId: trackingId },
        updateData
      )
    } catch (error) {
      console.error('Failed to track email open:', error)
    }
  }

  /**
   * Track email click
   */
  static async trackClick(trackingId: string, url: string, userAgent?: string, ip?: string): Promise<void> {
    try {
      const analytics = await EmailAnalytics.findOne({ emailId: trackingId })
      if (!analytics) return

      const existingClick = analytics.clickedUrls.find((click: { url: string }) => click.url === url)
      
      if (existingClick) {
        existingClick.count += 1
        existingClick.clickedAt = new Date()
      } else {
        analytics.clickedUrls.push({
          url,
          clickedAt: new Date(),
          count: 1
        })
      }

      const updateData: Partial<EmailAnalyticsDocument & { 
        updatedAt: Date
        clickedUrls: Array<{
          url: string
          clickedAt: Date
          count: number
        }>
      }> = {
        clicked: true,
        clickCount: analytics.clickCount + 1,
        clickedUrls: analytics.clickedUrls,
        updatedAt: new Date()
      }

      if (!analytics.clickedAt) {
        updateData.clickedAt = new Date()
      }

      if (userAgent || ip) {
        updateData.deviceInfo = {
          ...analytics.deviceInfo,
          userAgent,
          ip,
        }
      }

      await EmailAnalytics.findOneAndUpdate(
        { emailId: trackingId },
        updateData
      )
    } catch (error) {
      console.error('Failed to track email click:', error)
    }
  }

  /**
   * Get email analytics for a campaign or template type
   */
  static async getAnalytics(options: {
    campaignId?: string
    templateType?: EmailTemplateType
    startDate?: Date
    endDate?: Date
  }) {
    try {
      const query: QueryFilter = {}
      
      if (options.campaignId) query.campaignId = options.campaignId
      if (options.templateType) query.templateType = options.templateType
      if (options.startDate || options.endDate) {
        const dateQuery: Record<string, Date> = {};
        if (options.startDate) dateQuery.$gte = options.startDate
        if (options.endDate) dateQuery.$lte = options.endDate
        query.sentAt = dateQuery;
      }

      const analytics = await EmailAnalytics.find(query)
      
      const totalSent = analytics.length
      const totalOpened = analytics.filter((a: { opened?: boolean }) => a.opened).length
      const totalClicked = analytics.filter((a: { clicked?: boolean }) => a.clicked).length
      const totalBounced = analytics.filter((a: { deliveryStatus?: string }) => a.deliveryStatus === 'bounced').length

      return {
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
        analytics
      }
    } catch (error) {
      console.error('Failed to get email analytics:', error)
      throw error
    }
  }

  /**
   * Update user email preferences
   */
  static async updateEmailPreferences(userId: string, preferences: EmailTemplateData): Promise<void> {
    try {
      const user = await User.findOne({ id: userId })
      if (!user) throw new Error('User not found')

      await EmailPreferences.findOneAndUpdate(
        { userId },
        {
          userId,
          email: user.email,
          preferences,
          updatedAt: new Date()
        },
        { upsert: true }
      )
    } catch (error) {
      console.error('Failed to update email preferences:', error)
      throw error
    }
  }

  /**
   * Unsubscribe user from all emails
   */
  static async unsubscribeUser(email: string): Promise<void> {
    try {
      await EmailPreferences.findOneAndUpdate(
        { email },
        {
          unsubscribedFromAll: true,
          unsubscribedAt: new Date(),
          updatedAt: new Date()
        },
        { upsert: true }
      )
    } catch (error) {
      console.error('Failed to unsubscribe user:', error)
      throw error
    }
  }
}

export default ComprehensiveEmailService