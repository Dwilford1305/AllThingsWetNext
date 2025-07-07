# Admin Dashboard Feature

This document describes the new admin dashboard feature for All Things Wetaskiwin.

## Overview

The admin dashboard provides comprehensive site management capabilities including:

- **Business Management**: Monitor claims, subscriptions, and revenue
- **Content Management**: Oversee events, news, and other content
- **Scraper Controls**: Manually run scrapers and monitor their status
- **Analytics**: View detailed statistics and performance metrics
- **System Settings**: Configure site-wide settings and notifications

## Access

The admin dashboard is accessible at `/admin` and is protected by password authentication.

**Default Credentials:**
- Password: `admin123`

> **Note**: In production, change the password by setting the `ADMIN_PASSWORD` environment variable.

## Features

### 1. Overview Dashboard
- Quick statistics on businesses, revenue, and content
- Recent business claims
- Business category breakdown
- System status indicators

### 2. Business Management
- View all businesses with status and subscription details
- Approve/reject business claims
- Feature businesses for promotional placement
- Monitor subscription revenue

### 3. Content Management
- Review and moderate events and news articles
- Approve, reject, or delete content
- Monitor content sources and categories

### 4. Scraper Controls
- Manually trigger news, events, and business scrapers
- Monitor scraper status and error logs
- View last run times and success rates

### 5. User Management (Coming Soon)
- Manage business owner accounts
- Admin user permissions
- User activity monitoring

### 6. System Settings
- Configure scraper automation schedules
- Set up email notifications
- Content moderation settings

## API Endpoints

The admin dashboard uses the following API endpoints:

### Authentication
- `POST /api/admin/auth` - Admin login authentication

### Statistics
- `GET /api/admin/stats` - Overall system statistics

### Business Management
- `POST /api/admin/businesses` - Business actions (approve, reject, feature)

### Content Management
- `POST /api/admin/event` - Event actions (approve, reject, delete)
- `POST /api/admin/news` - News actions (approve, reject, delete)

## Security Considerations

### Current Implementation
- Simple password-based authentication
- Session-based authorization (browser session storage)
- No role-based permissions

### Production Recommendations
1. **Implement proper authentication**: Use NextAuth.js or similar
2. **Add role-based access**: Different permission levels for different admin functions
3. **Enable audit logging**: Track all admin actions with timestamps and user details
4. **Set up 2FA**: Two-factor authentication for admin access
5. **Use HTTPS**: Ensure all admin traffic is encrypted
6. **Environment variables**: Store admin credentials securely

## Installation & Setup

The admin dashboard is included in the feature branch. To use it:

1. **Merge the feature branch**:
   ```bash
   git checkout main
   git merge feature/admin-dashboard
   ```

2. **Set admin password** (optional):
   ```bash
   # Add to .env.local
   ADMIN_PASSWORD=your_secure_password_here
   ```

3. **Access the dashboard**:
   - Navigate to `http://localhost:3000/admin`
   - Enter the admin password
   - Explore the dashboard features

## Usage

### Daily Operations
1. **Check Dashboard**: Review overnight statistics and alerts
2. **Process Claims**: Approve or reject new business claims
3. **Monitor Scrapers**: Ensure automated data collection is working
4. **Content Review**: Check flagged or pending content

### Weekly Tasks
1. **Revenue Review**: Analyze subscription trends and business growth
2. **Content Audit**: Review content quality and source performance
3. **System Maintenance**: Check for errors and performance issues

### Monthly Operations
1. **Analytics Export**: Generate reports for stakeholders
2. **Setting Updates**: Adjust automation schedules if needed
3. **Security Review**: Rotate passwords and review access logs

## Future Enhancements

### Planned Features
1. **Email Notifications**: Automated alerts for important events
2. **Advanced Analytics**: Charts, graphs, and detailed reporting
3. **Bulk Operations**: Mass approve/reject content
4. **API Management**: Monitor and control API usage
5. **Backup Management**: Database backup scheduling and monitoring

### Integration Opportunities
1. **Payment Processing**: Direct Stripe/PayPal integration for subscriptions
2. **Email Marketing**: Mailchimp/SendGrid integration for business outreach
3. **Social Media**: Auto-posting approved content to social platforms
4. **Google Analytics**: Advanced traffic and user behavior analysis

## Troubleshooting

### Common Issues

**Cannot access admin dashboard:**
- Check if `/admin` route is accessible
- Verify password (default: `admin123`)
- Check browser console for errors

**Statistics not loading:**
- Ensure MongoDB connection is working
- Check if business analytics API is responding
- Verify data models are properly defined

**Scraper controls not working:**
- Check if scraper API endpoints are accessible
- Verify external website availability
- Review scraper logs for detailed errors

### Support

For technical support or feature requests:
1. Check the main project documentation
2. Review API endpoint responses for error details
3. Check server logs for backend issues
4. Create an issue in the project repository

## Contributing

When adding new admin features:

1. **Follow existing patterns**: Use the same component structure and API patterns
2. **Add proper authentication**: Ensure new endpoints are protected
3. **Include error handling**: Comprehensive error messages and logging
4. **Update documentation**: Add new features to this README
5. **Test thoroughly**: Verify both success and failure scenarios

## License

This admin dashboard is part of the All Things Wetaskiwin project and follows the same license terms.
