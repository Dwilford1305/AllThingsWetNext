import { ComprehensiveEmailService, EmailTemplateType } from './ComprehensiveEmailService'
import { User } from '../../../models/auth'
import { Business, Event } from '../../../models'

export interface AutomationTriggerData {
  userId?: string
  businessId?: string
  email?: string
  data?: any
}

export class EmailAutomationService {
  /**
   * Trigger welcome email for new user registration
   */
  static async triggerWelcomeEmail(userId: string): Promise<void> {
    try {
      const user = await User.findOne({ id: userId })
      if (!user) {
        console.error(`User not found for welcome email: ${userId}`)
        return
      }

      const verificationToken = user.emailVerificationToken
      if (!verificationToken) {
        console.error(`No verification token found for user: ${userId}`)
        return
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const verificationUrl = `${siteUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`

      await ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject: `Welcome to AllThingsWetaskiwin, ${user.firstName}! Please verify your email`,
        templateType: 'email_verification',
        templateData: {
          firstName: user.firstName,
          verificationUrl
        },
        userId: user.id,
        priority: 'high'
      })

      console.log(`Welcome email queued for user: ${user.email}`)
    } catch (error) {
      console.error('Failed to trigger welcome email:', error)
    }
  }

  /**
   * Trigger password reset email
   */
  static async triggerPasswordResetEmail(userId: string, resetToken: string): Promise<void> {
    try {
      const user = await User.findOne({ id: userId })
      if (!user) {
        console.error(`User not found for password reset email: ${userId}`)
        return
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(resetToken)}`

      await ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject: 'Password reset request for your AllThingsWetaskiwin account',
        templateType: 'password_reset',
        templateData: {
          firstName: user.firstName,
          resetUrl
        },
        userId: user.id,
        priority: 'high'
      })

      console.log(`Password reset email queued for user: ${user.email}`)
    } catch (error) {
      console.error('Failed to trigger password reset email:', error)
    }
  }

  /**
   * Trigger business approval email
   */
  static async triggerBusinessApprovalEmail(businessId: string, userId: string): Promise<void> {
    try {
      const [user, business] = await Promise.all([
        User.findOne({ id: userId }),
        Business.findOne({ id: businessId })
      ])

      if (!user || !business) {
        console.error(`User or business not found for approval email: ${userId}, ${businessId}`)
        return
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const dashboardUrl = `${siteUrl}/businesses/manage`
      const businessUrl = `${siteUrl}/businesses?id=${businessId}`

      await ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject: `🎉 ${business.name} is now live on AllThingsWetaskiwin!`,
        templateType: 'business_approval',
        templateData: {
          firstName: user.firstName,
          businessName: business.name,
          businessId: business.id,
          dashboardUrl,
          businessUrl
        },
        userId: user.id,
        businessId: business.id,
        priority: 'normal'
      })

      console.log(`Business approval email queued for: ${user.email}`)
    } catch (error) {
      console.error('Failed to trigger business approval email:', error)
    }
  }

  /**
   * Trigger business rejection email
   */
  static async triggerBusinessRejectionEmail(businessId: string, userId: string, reason: string): Promise<void> {
    try {
      const [user, business] = await Promise.all([
        User.findOne({ id: userId }),
        Business.findOne({ id: businessId })
      ])

      if (!user || !business) {
        console.error(`User or business not found for rejection email: ${userId}, ${businessId}`)
        return
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const contactUrl = `${siteUrl}/contact?subject=Business%20Listing%20Review&businessId=${businessId}`

      await ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject: `Update needed for ${business.name} business listing`,
        templateType: 'business_rejection',
        templateData: {
          firstName: user.firstName,
          businessName: business.name,
          reason,
          contactUrl
        },
        userId: user.id,
        businessId: business.id,
        priority: 'normal'
      })

      console.log(`Business rejection email queued for: ${user.email}`)
    } catch (error) {
      console.error('Failed to trigger business rejection email:', error)
    }
  }

  /**
   * Trigger weekly event notifications
   */
  static async triggerWeeklyEventNotifications(): Promise<void> {
    try {
      // Get users who want event notifications
      const users = await User.find({
        'preferences.notifications.events': true,
        isEmailVerified: true,
        isActive: true
      })

      // Get upcoming events for the next week
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
      
      const upcomingEvents = await Event.find({
        date: {
          $gte: new Date(),
          $lte: oneWeekFromNow
        }
      }).sort({ date: 1 }).limit(10)

      if (upcomingEvents.length === 0) {
        console.log('No upcoming events found for weekly notification')
        return
      }

      // Format events for email template
      const formattedEvents = upcomingEvents.map(event => ({
        title: event.title,
        date: event.date.toLocaleDateString('en-CA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: event.time,
        location: event.location,
        description: event.description,
        url: event.sourceUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/events?id=${event.id}`
      }))

      // Send notifications to all eligible users
      for (const user of users) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(user.email)}&type=events`

        await ComprehensiveEmailService.queueEmail({
          to: user.email,
          subject: `This Week in Wetaskiwin: ${upcomingEvents.length} Upcoming Events`,
          templateType: 'event_notification',
          templateData: {
            firstName: user.firstName,
            events: formattedEvents,
            period: 'This Week',
            unsubscribeUrl
          },
          userId: user.id,
          priority: 'low',
          campaignId: `weekly-events-${new Date().toISOString().slice(0, 10)}`
        })
      }

      console.log(`Weekly event notifications queued for ${users.length} users`)
    } catch (error) {
      console.error('Failed to trigger weekly event notifications:', error)
    }
  }

  /**
   * Trigger subscription confirmation email
   */
  static async triggerSubscriptionConfirmationEmail(userId: string, subscriptionTier: string, businessId?: string): Promise<void> {
    try {
      const user = await User.findOne({ id: userId })
      if (!user) {
        console.error(`User not found for subscription confirmation: ${userId}`)
        return
      }

      const isBusinessSubscription = !!businessId
      const business = businessId ? await Business.findOne({ id: businessId }) : null

      const subscriptionType = isBusinessSubscription ? 'Business' : 'Marketplace'
      const entityName = business ? business.name : 'your account'

      await ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject: `${subscriptionType} subscription confirmed - ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan`,
        templateType: 'subscription_confirmation',
        templateData: {
          firstName: user.firstName,
          subscriptionTier,
          subscriptionType,
          entityName,
          businessName: business?.name,
          dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${isBusinessSubscription ? 'businesses/manage' : 'profile'}`
        },
        userId: user.id,
        businessId,
        priority: 'normal'
      })

      console.log(`Subscription confirmation email queued for: ${user.email}`)
    } catch (error) {
      console.error('Failed to trigger subscription confirmation email:', error)
    }
  }

  /**
   * Trigger business request confirmation email (for new business submissions)
   */
  static async triggerBusinessRequestConfirmationEmail(email: string, businessName: string, requestId: string): Promise<void> {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      await ComprehensiveEmailService.queueEmail({
        to: email,
        subject: `Business listing request received - ${businessName}`,
        templateType: 'business_request_confirmation',
        templateData: {
          businessName,
          requestId,
          statusUrl: `${siteUrl}/business-request-status?id=${requestId}`,
          estimatedReviewTime: '2-3 business days'
        },
        priority: 'normal'
      })

      console.log(`Business request confirmation email queued for: ${email}`)
    } catch (error) {
      console.error('Failed to trigger business request confirmation email:', error)
    }
  }

  /**
   * Trigger admin notification for new business request
   */
  static async triggerAdminBusinessRequestNotification(requestData: any): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@allthingswet.ca'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      await ComprehensiveEmailService.queueEmail({
        to: adminEmail,
        subject: `New Business Listing Request: ${requestData.businessName}`,
        templateType: 'business_request_confirmation', // Reuse template with admin data
        templateData: {
          ...requestData,
          adminReviewUrl: `${siteUrl}/admin/business-requests`,
          isAdminNotification: true
        },
        priority: 'high'
      })

      console.log(`Admin business request notification queued`)
    } catch (error) {
      console.error('Failed to trigger admin business request notification:', error)
    }
  }

  /**
   * Schedule and trigger automated email campaigns
   */
  static async processAutomatedCampaigns(): Promise<void> {
    try {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      const hour = now.getHours()

      // Weekly event notifications (send on Monday morning at 9 AM)
      if (dayOfWeek === 1 && hour === 9) {
        await this.triggerWeeklyEventNotifications()
      }

      // You can add more automated campaigns here:
      // - Monthly newsletter
      // - Business anniversary emails
      // - Inactive user re-engagement
      // - Seasonal promotions

      console.log('Automated email campaigns processed')
    } catch (error) {
      console.error('Failed to process automated campaigns:', error)
    }
  }

  /**
   * Trigger re-engagement email for inactive users
   */
  static async triggerReEngagementEmails(): Promise<void> {
    try {
      // Find users who haven't logged in for 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const inactiveUsers = await User.find({
        lastLoginAt: { $lt: thirtyDaysAgo },
        isEmailVerified: true,
        isActive: true,
        'preferences.notifications.marketing': true
      }).limit(100) // Process in batches

      for (const user of inactiveUsers) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        
        await ComprehensiveEmailService.queueEmail({
          to: user.email,
          subject: `We miss you! See what's new in Wetaskiwin`,
          templateType: 'marketing',
          templateData: {
            firstName: user.firstName,
            loginUrl: `${siteUrl}/auth-test`,
            unsubscribeUrl: `${siteUrl}/unsubscribe?email=${encodeURIComponent(user.email)}&type=marketing`
          },
          userId: user.id,
          priority: 'low',
          campaignId: `re-engagement-${new Date().toISOString().slice(0, 10)}`
        })
      }

      console.log(`Re-engagement emails queued for ${inactiveUsers.length} inactive users`)
    } catch (error) {
      console.error('Failed to trigger re-engagement emails:', error)
    }
  }
}

export default EmailAutomationService