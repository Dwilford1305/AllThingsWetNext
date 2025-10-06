# Admin Notification System Guide

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Features](#features)
- [Notification Types](#notification-types)
- [API Reference](#api-reference)
- [UI Components](#ui-components)
- [Integration Guide](#integration-guide)
- [Troubleshooting](#troubleshooting)

## Overview

The Admin Notification System provides real-time alerts to administrators about critical events occurring in the All Things Wetaskiwin platform. Notifications are delivered through multiple channels:

- **In-Dashboard**: Notification bell icon with dropdown
- **Email**: Automated email alerts to admin
- **Push Notifications**: Browser push notifications (optional)
- **Database**: Persistent storage of all notifications

## Installation

The notification system is already integrated into the admin dashboard. No additional installation is required.

### Prerequisites

- MongoDB connection (for notification storage)
- SMTP configuration (for email notifications)
- VAPID keys (optional, for push notifications)

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Required: Admin Email Address
ADMIN_EMAIL=admin@allthingswet.ca

# Required: SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional: Push Notification Configuration
VAPID_PUBLIC_KEY=your_public_vapid_key
VAPID_PRIVATE_KEY=your_private_vapid_key
VAPID_EMAIL=admin@allthingswet.ca

# Optional: Site URL (defaults to localhost:3000)
NEXT_PUBLIC_SITE_URL=https://allthingswet.ca
```

### Generating VAPID Keys

For push notifications, you need to generate VAPID keys:

```javascript
// Run this in a Node.js environment
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

## Features

### 1. Real-Time Notification Center

**Location**: Admin dashboard header (bell icon)

**Features**:
- Unread count badge
- Dropdown with recent notifications
- Priority-based color coding
- Time-ago formatting
- Mark as read/dismiss functionality
- "Mark all as read" bulk action

**Auto-refresh**: Every 30 seconds

### 2. Recent Activity Widget

**Location**: Main admin dashboard (top section)

**Features**:
- Shows last 10 notifications
- Daily activity count
- Unread and critical counts
- Full notification history
- Read/unread visual distinction

**Auto-refresh**: Every 60 seconds

### 3. Email Notifications

**Delivery**: Immediate email to `ADMIN_EMAIL`

**Features**:
- Priority-based subject lines
- HTML formatted content
- Direct links to dashboard
- Metadata included in email

### 4. Push Notifications

**Delivery**: Browser push (when user has granted permission)

**Features**:
- Requires interaction for critical notifications
- Custom actions (View, Dismiss)
- Badge and icon support
- Delivered to all admin users

## Notification Types

### 1. User Signup (`user_signup`)

**Triggered When**: New user registers via JWT or Auth0

**Priority**: 
- Business owners: `high`
- Regular users: `medium`

**Information Included**:
- User name and email
- Account type
- Registration method (JWT/Auth0)
- Timestamp

**Example**:
```
Title: New User Registration
Message: John Doe (john@example.com) has signed up as business_owner for business: Acme Corp
```

### 2. Business Request (`business_request`)

**Triggered When**: Business owner submits listing request

**Priority**: `high`

**Information Included**:
- Business name and type
- Requester name and email
- Business details (address, phone, website)
- Request message

**Example**:
```
Title: New Business Listing Request
Message: Acme Corp (Restaurant) - submitted by John Doe
```

### 3. Content Moderation (`content_moderation`)

**Status**: Coming soon

**Priority**: `medium` to `high`

**Will Include**:
- Content type (event, news, job, marketplace)
- Flagged reason
- Reporter information
- Content preview

### 4. System Alert (`system_alert`)

**Status**: Coming soon

**Priority**: `critical` to `high`

**Will Include**:
- Alert type
- Error details
- Affected systems
- Recommended actions

### 5. Error (`error`)

**Status**: Coming soon

**Priority**: `critical`

**Will Include**:
- Error message and stack trace
- Affected endpoint or service
- User impact
- Time of occurrence

### 6. Info (`info`)

**Status**: Coming soon

**Priority**: `low`

**Will Include**:
- General system updates
- Scheduled maintenance notices
- Feature announcements

## API Reference

### GET `/api/admin/notifications`

Fetch admin notifications with filtering options.

**Query Parameters**:
- `limit` (number): Maximum notifications to return (default: 50)
- `includeRead` (boolean): Include read notifications (default: false)

**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 5,
    "statistics": {
      "total": 42,
      "unread": 5,
      "byType": {
        "user_signup": 20,
        "business_request": 15,
        "info": 7
      },
      "byPriority": {
        "critical": 1,
        "high": 12,
        "medium": 25,
        "low": 4
      }
    }
  }
}
```

### PATCH `/api/admin/notifications`

Mark notification(s) as read.

**Request Body**:
```json
{
  "notificationId": "notif_123",  // For single notification
  // OR
  "markAllAsRead": true           // For all notifications
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### DELETE `/api/admin/notifications`

Cleanup old read notifications.

**Query Parameters**:
- `daysOld` (number): Delete notifications older than X days (default: 90)

**Response**:
```json
{
  "success": true,
  "message": "Deleted 15 old notifications",
  "deletedCount": 15
}
```

## UI Components

### AdminNotificationCenter

**Location**: `src/components/AdminNotificationCenter.tsx`

**Usage**:
```tsx
import AdminNotificationCenter from '@/components/AdminNotificationCenter';

// In your component
<AdminNotificationCenter />
```

**Features**:
- Self-contained component
- Manages its own state
- Auto-refreshes notifications
- Handles mark as read actions

### AdminRecentActivity

**Location**: `src/components/AdminRecentActivity.tsx`

**Usage**:
```tsx
import AdminRecentActivity from '@/components/AdminRecentActivity';

// In your component
<AdminRecentActivity />
```

**Features**:
- Shows last 10 notifications
- Displays activity statistics
- Read/unread visual distinction
- Auto-refresh every minute

## Integration Guide

### Adding New Notification Types

To add a new notification type to an existing flow:

1. **Import the service**:
```typescript
import AdminNotificationService from '@/lib/adminNotificationService';
```

2. **Create notification**:
```typescript
try {
  const notificationService = AdminNotificationService.getInstance();
  await notificationService.createNotification({
    type: 'your_notification_type', // Must be in the type enum
    title: 'Your Notification Title',
    message: 'Detailed message about the event',
    priority: 'high', // low, medium, high, or critical
    relatedEntity: {
      type: 'user', // or business, event, news, etc.
      id: 'entity_id'
    },
    metadata: {
      // Any additional data you want to store
      key1: 'value1',
      key2: 'value2'
    },
    sendEmail: true,  // Send email notification
    sendPush: true    // Send push notification
  });
} catch (error) {
  console.error('Failed to send admin notification:', error);
  // Don't fail the main operation if notification fails
}
```

### Example: Adding to a New API Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import AdminNotificationService from '@/lib/adminNotificationService';

export async function POST(request: NextRequest) {
  try {
    // Your main logic here
    const result = await performSomeAction();

    // Send admin notification
    const notificationService = AdminNotificationService.getInstance();
    await notificationService.createNotification({
      type: 'info',
      title: 'Action Completed',
      message: `Action was completed successfully`,
      priority: 'low',
      metadata: {
        action: 'some_action',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Send error notification
    const notificationService = AdminNotificationService.getInstance();
    await notificationService.createNotification({
      type: 'error',
      title: 'Action Failed',
      message: `Error: ${error.message}`,
      priority: 'critical',
      metadata: {
        error: error.message,
        stack: error.stack
      }
    });

    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## Troubleshooting

### Notifications Not Appearing

**Issue**: Bell icon shows no notifications

**Solutions**:
1. Check MongoDB connection
2. Verify admin authentication
3. Check browser console for API errors
4. Ensure notifications are being created (check database)

### Email Notifications Not Sending

**Issue**: Admin not receiving email notifications

**Solutions**:
1. Verify `ADMIN_EMAIL` is set in `.env.local`
2. Check SMTP configuration is correct
3. Look for email errors in server logs
4. Verify email isn't in spam folder
5. Check email queue in database

### Push Notifications Not Working

**Issue**: Browser push notifications not appearing

**Solutions**:
1. Verify VAPID keys are configured
2. Check browser permissions (must allow notifications)
3. Ensure admin user has push subscription
4. Check browser console for errors
5. Test with `/api/push/subscription` endpoint

### High Memory Usage

**Issue**: Too many notifications in database

**Solutions**:
1. Run cleanup API: `DELETE /api/admin/notifications?daysOld=30`
2. Set up automated cleanup cron job
3. Adjust notification creation thresholds
4. Consider archiving old notifications

### Unread Count Not Updating

**Issue**: Badge shows wrong count

**Solutions**:
1. Refresh the page
2. Check if mark-as-read API is working
3. Verify database updates are successful
4. Clear browser cache
5. Check for JavaScript errors

## Best Practices

### 1. Notification Priority Guidelines

- **Critical**: System failures, security breaches, data loss
- **High**: Business requests, important user actions, payment issues
- **Medium**: Regular user signups, content updates
- **Low**: General information, system logs

### 2. Avoid Notification Fatigue

- Don't create notifications for every single action
- Group similar events when possible
- Use appropriate priority levels
- Implement daily/weekly digests for low-priority items

### 3. Include Relevant Metadata

Always include:
- Entity IDs for easy lookup
- Timestamp of the event
- User information (if applicable)
- Contextual data for investigation

### 4. Test Notifications

Before deploying:
- Test all notification types
- Verify email delivery
- Check notification appearance
- Test mark-as-read functionality
- Validate metadata structure

### 5. Monitor Notification System

Regularly check:
- Notification delivery success rate
- Email bounce rates
- Push notification subscriptions
- Database growth
- User feedback

## Support

For issues or questions about the admin notification system:

1. Check this guide first
2. Review server logs for errors
3. Test API endpoints manually
4. Create an issue in the GitHub repository
5. Contact the development team

## License

This notification system is part of the All Things Wetaskiwin project.
