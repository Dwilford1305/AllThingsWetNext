# Business Scraping & Monetization System

## Overview

The All Things Wetaskiwin application features a sophisticated hybrid business directory that combines automated web scraping with premium subscription services. This system creates a comprehensive local business directory while generating revenue through subscription tiers.

## 🏗️ Architecture

### Core Components

1. **WetaskiwinBusinessScraper** (`src/lib/scrapers/wetaskiwinBusiness.ts`)
   - Scrapes Wetaskiwin city business directory
   - Automatically categorizes businesses
   - Handles deduplication and data cleaning

2. **BusinessScraperService** (`src/lib/businessScraperService.ts`)
   - Orchestrates scraping operations
   - Manages database updates
   - Handles new vs. existing business detection

3. **Business Model** (`src/models/index.ts`)
   - Complete schema with subscription features
   - Claim status and analytics tracking
   - Premium feature flags

4. **API Endpoints**
   - `/api/scraper/businesses` - Manual scraping trigger
   - `/api/businesses/claim` - Business claim system
   - `/api/businesses/subscription` - Subscription management
   - `/api/businesses/analytics` - Revenue and usage analytics

## 💰 Monetization Strategy

### Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic scraped info, claim capability |
| **Silver** | $19.99/mo | Enhanced listing, contact forms, basic analytics |
| **Gold** | $39.99/mo | Photo gallery, social media, featured placement |
| **Platinum** | $79.99/mo | Logo upload, advanced analytics, priority support |

### Revenue Potential

- **560+ businesses** in Wetaskiwin directory
- **Conservative 10% claim rate**: 56 claimed businesses
- **Average 20% premium conversion**: ~11 premium subscriptions
- **Average tier value**: $40/month
- **Estimated monthly revenue**: $440/month ($5,280/year)

## 🔄 System Workflow

### 1. Automated Scraping
```
City Directory → Scraper → Categorization → Database → Free Listings
```

### 2. Business Claim Process
```
Business Owner → Claim Request → Verification → Claimed Status → Dashboard Access
```

### 3. Subscription Upgrade
```
Claimed Business → Choose Tier → Payment → Premium Features → Analytics
```

## 🚀 Implementation Details

### Scraping Schedule
- **Business scraping**: Weekly (Sundays at midnight)
- **News/Events**: Every 6 hours
- **Configurable** via Vercel Cron or local schedulers

### Data Source
- **Primary**: `https://www.wetaskiwin.ca/businessdirectoryii.aspx`
- **Structure**: Alphabetical listing with contact details
- **Categories**: Auto-categorized using business name/description analysis

### Database Schema
```typescript
Business {
  // Basic scraped fields
  id, name, description, category, address, phone, email, website
  
  // Subscription system
  subscriptionTier: 'free' | 'silver' | 'gold' | 'platinum'
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled'
  isClaimed: boolean
  claimedBy: string
  
  // Premium features
  logo, photos, hours, socialMedia, specialOffers
  
  // Analytics
  analytics: { views, clicks, callClicks, websiteClicks }
}
```

## 🎯 User Experience

### For Consumers
1. **Browse** comprehensive business directory
2. **Search & Filter** by category, location, features
3. **Contact** businesses directly (call, email, website)
4. **Visual indicators** for premium businesses

### For Business Owners
1. **Discover** their business in the directory
2. **Claim** their listing with simple form
3. **Manage** listing through self-service dashboard
4. **Upgrade** to premium tiers for enhanced features
5. **Track** analytics and engagement

### For Administrators
1. **Monitor** scraping operations
2. **Review** claim requests
3. **Track** revenue and subscription metrics
4. **Manage** business categories and features

## 🔧 Technical Features

### Smart Categorization
Businesses are automatically categorized using keyword analysis:
- **Restaurant**: Keywords like "restaurant", "cafe", "grill", "pizza"
- **Automotive**: "auto", "car", "tire", "mechanic", "repair"
- **Health**: "dental", "medical", "clinic", "pharmacy"
- **Professional**: "law", "accounting", "insurance", "real estate"

### Deduplication Logic
- **Primary**: Name + Address matching
- **Secondary**: Phone number matching
- **Fuzzy matching** for slight variations in business names

### Analytics Tracking
- **Page views**: Tracked automatically
- **Click tracking**: Phone, website, email clicks
- **Conversion metrics**: Claim rates, upgrade rates
- **Revenue tracking**: Subscription values and trends

### Error Handling
- **Graceful failures**: Scraping continues if individual businesses fail
- **Retry logic**: Automatic retries for network issues
- **Logging**: Comprehensive error tracking and monitoring

## 📊 Success Metrics

### Operational Metrics
- **Scraping success rate**: >95% successful business extractions
- **Data accuracy**: Verified contact information and categorization
- **System uptime**: 99.9% availability for API endpoints

### Business Metrics
- **Claim rate**: % of businesses claimed by owners
- **Conversion rate**: % of claimed businesses upgrading to premium
- **Average revenue per user (ARPU)**: Monthly subscription value
- **Customer lifetime value (CLV)**: Long-term subscription retention

### User Engagement
- **Directory usage**: Page views, search queries, contact clicks
- **Business engagement**: Premium feature usage, analytics views
- **Platform growth**: New business registrations, subscription upgrades

## 🔮 Future Enhancements

### Phase 1 (Current)
- ✅ Automated scraping and categorization
- ✅ Business claim system
- ✅ Subscription tier management
- ✅ Self-service business dashboard

### Phase 2 (Next 3 months)
- 🔲 Payment processing integration (Stripe)
- 🔲 Email notification system for claims
- 🔲 Advanced analytics dashboard
- 🔲 Business photo upload and management
- 🔲 Customer review system

### Phase 3 (6 months)
- 🔲 Mobile app for business management
- 🔲 Advanced SEO optimization for businesses
- 🔲 Integration with Google My Business
- 🔲 Automated social media posting
- 🔲 Customer relationship management (CRM) features

### Phase 4 (Long-term)
- 🔲 Multi-city expansion capability
- 🔲 White-label solutions for other communities
- 🔲 Advanced business intelligence and reporting
- 🔲 Marketplace features (online ordering, appointments)
- 🔲 API licensing for third-party integrations

## 🛠 Maintenance & Monitoring

### Regular Tasks
- **Weekly**: Monitor scraping results and fix any parsing issues
- **Monthly**: Review subscription metrics and business feedback
- **Quarterly**: Update categorization rules and add new features

### Monitoring Endpoints
- **Health Check**: `/api/scraper/businesses` (GET)
- **Analytics**: `/api/businesses/analytics` (GET)
- **Error Logs**: Check terminal output for scraping issues

### Backup & Recovery
- **Database backups**: Automated daily backups via MongoDB Atlas
- **Code versioning**: Git repository with feature branches
- **Configuration**: Environment variables for easy deployment

This system represents a complete solution for community-driven business directories with built-in monetization, providing value to businesses, consumers, and the platform operator.
