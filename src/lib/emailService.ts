import nodemailer from 'nodemailer'

interface EmailNotificationData {
  requestId: string
  businessName: string
  businessType: string
  userName: string
  userEmail: string
  phone: string
  address: string
  description?: string
  website?: string
  requestMessage?: string
  submittedAt: Date
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  static async sendBusinessRequestNotification(data: EmailNotificationData): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@allthingswet.ca'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      const emailContent = `
        <h2>New Business Listing Request</h2>
        
        <p>A new business listing request has been submitted and needs your review.</p>
        
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Request ID:</strong> ${data.requestId}</li>
          <li><strong>Submitted:</strong> ${data.submittedAt.toLocaleDateString('en-CA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</li>
        </ul>
        
        <h3>Business Information:</h3>
        <ul>
          <li><strong>Business Name:</strong> ${data.businessName}</li>
          <li><strong>Business Type:</strong> ${data.businessType}</li>
          <li><strong>Address:</strong> ${data.address}</li>
          <li><strong>Phone:</strong> ${data.phone}</li>
          ${data.website ? `<li><strong>Website:</strong> <a href="${data.website}">${data.website}</a></li>` : ''}
          ${data.description ? `<li><strong>Description:</strong> ${data.description}</li>` : ''}
        </ul>
        
        <h3>Contact Information:</h3>
        <ul>
          <li><strong>Contact Name:</strong> ${data.userName}</li>
          <li><strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail}</a></li>
        </ul>
        
        ${data.requestMessage ? `
          <h3>Additional Message:</h3>
          <p>${data.requestMessage}</p>
        ` : ''}
        
        <hr style="margin: 20px 0;">
        
        <p>
          <strong>Next Steps:</strong><br>
          1. Review the business information above<br>
          2. Visit <a href="${siteUrl}/admin">Admin Dashboard</a> to approve or reject this request<br>
          3. Contact the business owner if you need additional information
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated notification from AllThingsWet Business Directory.
        </p>
      `

      const info = await this.transporter.sendMail({
        from: `"AllThingsWet Directory" <${process.env.SMTP_FROM || 'noreply@allthingswet.ca'}>`,
        to: adminEmail,
        subject: `New Business Listing Request: ${data.businessName}`,
        html: emailContent,
      })

      console.log('Business request notification sent:', info.messageId)
      return true

    } catch (error) {
      console.error('Failed to send business request notification:', error)
      return false
    }
  }

  static async sendBusinessRequestConfirmation(userEmail: string, businessName: string): Promise<boolean> {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      const emailContent = `
        <h2>Business Listing Request Received</h2>
        
        <p>Hi there!</p>
        
        <p>Thank you for submitting your business listing request for <strong>${businessName}</strong>.</p>
        
        <p>We've received your request and our team will review it within 2-3 business days. You'll receive an email notification once your listing has been approved and published to our directory.</p>
        
        <h3>What happens next?</h3>
        <ul>
          <li>Our team reviews your business information</li>
          <li>We verify the details you provided</li>
          <li>Your listing is approved and published to the directory</li>
          <li>You'll receive a confirmation email with your listing details</li>
        </ul>
        
        <p>If we need any additional information, we'll contact you at this email address.</p>
        
        <p>You can check the status of your request by visiting your <a href="${siteUrl}/profile">profile page</a>.</p>
        
        <p>Thank you for choosing to be part of the Wetaskiwin business community!</p>
        
        <p>
          Best regards,<br>
          The AllThingsWet Team
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated confirmation from AllThingsWet Business Directory.
        </p>
      `

      const info = await this.transporter.sendMail({
        from: `"AllThingsWet Directory" <${process.env.SMTP_FROM || 'noreply@allthingswet.ca'}>`,
        to: userEmail,
        subject: `Business Listing Request Received - ${businessName}`,
        html: emailContent,
      })

      console.log('Business request confirmation sent:', info.messageId)
      return true

    } catch (error) {
      console.error('Failed to send business request confirmation:', error)
      return false
    }
  }

  static async sendBusinessApprovalNotification(userEmail: string, businessName: string, businessId: string): Promise<boolean> {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      const emailContent = `
        <h2>🎉 Your Business Listing is Now Live!</h2>
        
        <p>Great news!</p>
        
        <p>Your business listing request for <strong>${businessName}</strong> has been approved and is now live on our directory!</p>
        
        <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">What's Next?</h3>
          <ul style="margin: 10px 0;">
            <li>✅ Your business is now visible to customers in Wetaskiwin</li>
            <li>📍 You can find it in our <a href="${siteUrl}/businesses">business directory</a></li>
            <li>🎛️ Manage your listing details in your <a href="${siteUrl}/profile">profile page</a></li>
            <li>📊 Track views and engagement (coming soon with premium features)</li>
          </ul>
        </div>
        
        <h3>Quick Links:</h3>
        <p>
          📋 <a href="${siteUrl}/profile" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">Manage Your Business</a><br>
          🏪 <a href="${siteUrl}/businesses" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">View Directory</a><br>
          💬 <a href="mailto:support@allthingswet.ca" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">Contact Support</a>
        </p>
        
        <p>Thank you for being part of the Wetaskiwin business community. We're excited to help you connect with local customers!</p>
        
        <p>
          Best regards,<br>
          The AllThingsWet Team
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 12px;">
          Business ID: ${businessId}<br>
          This is an automated notification from AllThingsWet Business Directory.
        </p>
      `

      const info = await this.transporter.sendMail({
        from: `"AllThingsWet Directory" <${process.env.SMTP_FROM || 'noreply@allthingswet.ca'}>`,
        to: userEmail,
        subject: `🎉 ${businessName} is Now Live on AllThingsWet!`,
        html: emailContent,
      })

      console.log('Business approval notification sent:', info.messageId)
      return true

    } catch (error) {
      console.error('Failed to send business approval notification:', error)
      return false
    }
  }
}
