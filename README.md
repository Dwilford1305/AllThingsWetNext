# All Things Wetaskiwin

A modern, full-stack community hub application built with Next.js 15, TypeScript, Tailwind CSS, and MongoDB Atlas. This application serves as a central platform for the Wetaskiwin community to discover events, news, local businesses, job opportunities, and classified listings.

## 🚀 Features

- **Dashboard**: Beautiful homepage with community statistics, strategic ad placements, and recent content
- **Events**: Browse and discover upcoming community events with filtering and search
- **News**: Stay updated with the latest local news and announcements
- **Businesses**: Directory of local businesses with contact information and hours
- **Jobs**: Find career opportunities and job postings in the area
- **Classifieds**: Buy, sell, and trade items locally
- **Ethical Scrapers**: Automated data collection from official community sources
- **Progressive Web App (PWA)**: Add to home screen for native app-like experience with push notifications
- **Monetization Ready**: Google AdSense integration and premium business directory advertising
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, accessible interface built with Tailwind CSS

## 🤖 Automated Scraping System

The application features a robust, ethical web scraping system that automatically collects news and events from official community sources.

### News Sources
- **Wetaskiwin Times** (`wetaskiwintimes.com`)
- **Pipestone Flyer** (`pipestoneflyer.ca`)

### Event Sources  
- **Connect Wetaskiwin** (`connectwetaskiwin.com/calendar-of-events.html`)
- **City of Wetaskiwin** (`wetaskiwin.ca`)

### Business Sources
- **City of Wetaskiwin Business Directory** (`wetaskiwin.ca/businessdirectoryii.aspx`)
  - 560+ local businesses automatically scraped and categorized
  - Hybrid monetization model: free basic listings with premium upgrades
  - Business claim system for enhanced control and features

### 🔄 Automation Features
- **Scheduled Scraping**: Automatic collection every 6 hours via Vercel Cron Jobs
- **Smart Deduplication**: Prevents duplicate articles/events/businesses
- **Content Categorization**: Automatic sorting into relevant categories
- **Source Attribution**: Proper links back to original content
- **Error Handling**: Comprehensive logging and graceful failure recovery
- **Business Directory Integration**: Automated scraping of city business directory with hybrid monetization

### 🚀 Deployment Options

#### Cloud (Vercel) - Recommended
```json
{
  "crons": [
    { "path": "/api/cron/scrape?type=news", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/scrape?type=events", "schedule": "30 */6 * * *" },
    { "path": "/api/cron/scrape?type=businesses", "schedule": "0 0 */7 * *" }
  ]
}
```

#### Local Development (Windows)
- PowerShell scripts for Windows Task Scheduler
- Manual testing and monitoring tools
- Detailed setup guide included

### 📊 API Endpoints
- `GET/POST /api/cron/scrape` - Scheduled scraping endpoint (Vercel Cron)
- `POST /api/scraper/news` - Manual news scraping
- `POST /api/scraper/events` - Manual event scraping  
- `POST /api/scraper/businesses` - Manual business scraping
- `GET /api/news` - Retrieve scraped news
- `GET /api/events` - Retrieve scraped events
- `GET /api/businesses` - Retrieve business listings (with subscription tiers)
- `POST /api/businesses/claim` - Claim a business listing
- `POST /api/businesses/subscription` - Upgrade business subscription

### 🛡️ Ethical Guidelines
- **Respectful Rate Limiting**: Built-in delays between requests
- **Robots.txt Compliance**: Follows website guidelines
- **Source Attribution**: Full credit and links to original sources
- **Error Handling**: Graceful failures without overwhelming servers
- **Content Filtering**: Only real articles (no section pages or navigation)

See `SCRAPER_SETUP_GUIDE.md` for detailed setup instructions.

## 💰 Monetization & Advertising Strategy

### Revenue Streams
The application implements a multi-tier monetization strategy combining automated data collection with premium self-service offerings:

#### 1. Google AdSense Integration
- **Strategic Placement**: Leaderboard ads at top, banner ads mid-content, square ads in sidebar areas
- **High-Traffic Areas**: Homepage hero section, between content sections, and footer areas
- **Mobile Optimized**: Responsive ad units that adapt to screen size (728x90 desktop, 320x50 mobile)
- **User Experience**: Non-intrusive placement that maintains content flow

#### 2. Premium Business Directory Advertising
- **Featured Business Spots**: Highlighted placement for Gold/Platinum subscribers
- **Premium Directory Ads**: Dedicated advertising slots for local businesses
- **Sponsored Content**: Business spotlight sections throughout the homepage
- **Call-to-Action Integration**: Direct links to business pages and contact information

#### 3. Progressive Web App (PWA) Engagement
- **Add to Home Screen**: Native app-like experience increases user retention
- **Push Notifications**: Direct marketing channel for events, news, and business promotions
- **Offline Access**: Cached content keeps users engaged even without internet
- **Enhanced User Experience**: Faster loading, better performance than traditional websites

### Ad Placement Strategy
- **Top Leaderboard**: High-visibility area immediately after hero section
- **Mid-Content Squares**: Three-column featured business grid between main sections
- **Banner Ads**: Strategic placement between content sections
- **Bottom Grid**: Four-column featured business showcase before footer
- **Mobile Responsive**: All ad units adapt seamlessly to mobile screens

### Implementation Details
- `AdPlaceholder` component with multiple types (google, premium-directory, featured-business)
- Configurable sizes (banner, square, leaderboard, sidebar)
- Smooth animations and viewport-triggered loading
- Ready for integration with Google AdSense and payment processors

## � Hybrid Business Directory & Monetization

### Business Model Overview
The application features a sophisticated hybrid business directory that combines automated data collection with premium self-service offerings, creating multiple revenue streams while providing comprehensive local business coverage.

### 🔄 How It Works
1. **Automated Foundation**: City business directory automatically scraped and categorized (560+ businesses)
2. **Free Basic Listings**: All businesses get a basic listing with contact info and hours
3. **Claim System**: Business owners can claim their listings for enhanced control
4. **Premium Subscriptions**: Claimed businesses can upgrade to Silver, Gold, or Platinum tiers
5. **Self-Service Management**: Business dashboard for managing listings, analytics, and subscriptions

### 💎 Subscription Tiers
- **Free (Default)**: Basic scraped information, claim capability
- **Silver ($19.99/mo)**: Enhanced listing, contact forms, basic analytics, business hours
- **Gold ($39.99/mo)**: Everything in Silver + photo gallery, social media, featured placement, special offers
- **Platinum ($79.99/mo)**: Everything in Gold + logo upload, advanced analytics, priority support

### 🏗️ Technical Implementation
- **Automated Scraping**: `WetaskiwinBusinessScraper` with smart categorization and deduplication
- **Subscription Management**: Full API for claims, upgrades, and analytics tracking
- **Business Dashboard**: Self-service portal for claimed businesses (`/businesses/manage`)
- **Payment Ready**: Structured for Stripe/PayPal integration
- **Analytics Tracking**: View counts, click tracking, conversion metrics

### 📈 Revenue Opportunities
- Monthly/annual subscription fees (Silver: $240/year, Gold: $480/year, Platinum: $960/year)
- Featured placement upgrades
- Premium directory advertising
- Business verification services
- Enhanced analytics and reporting

## �🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas with Mongoose ODM
- **Icons**: Lucide React
- **UI Components**: Custom components with Radix UI primitives

## 📦 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── events/        # Events API
│   │   ├── news/          # News API
│   │   ├── businesses/    # Businesses API
│   │   ├── jobs/          # Jobs API
│   │   ├── classifieds/   # Classifieds API
│   │   └── seed/          # Database seeding
│   ├── events/            # Events page
│   ├── news/              # News page
│   ├── businesses/        # Businesses page
│   ├── jobs/              # Jobs page
│   ├── classifieds/       # Classifieds page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Navigation.tsx
│   └── Dashboard.tsx      # Main dashboard component
├── data/                  # Sample data
│   └── sampleData.ts
├── lib/                   # Utility libraries
│   ├── mongodb.ts         # MongoDB connection
│   └── utils.ts           # Helper functions
├── models/                # Mongoose models
│   └── index.ts
└── types/                 # TypeScript type definitions
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account and connection string

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AllThingsWetNext
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=your_mongodb_atlas_connection_string

   # Next.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Seed the database** (optional)
   Visit `http://localhost:3000/api/seed` to populate the database with sample data.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Pages & Features

### Dashboard (`/`)
- Community statistics overview
- Recent events and news
- Quick navigation to all sections
- Hero section with call-to-action buttons

### Events (`/events`)
- Browse upcoming community events
- Filter by category (community, sports, arts, music, etc.)
- Search functionality
- Event details with contact information and ticket links

### News (`/news`)
- Latest local news and updates
- Featured stories section
- Category filtering (local news, city council, business, etc.)
- Links to full articles

### Businesses (`/businesses`)
- **Hybrid Business Directory**: Automatically scraped from city records + premium self-service listings
- **Free Basic Listings**: All businesses from city directory included automatically
- **Business Claim System**: Owners can claim and manage their listings
- **Subscription Tiers**: Silver ($19.99/mo), Gold ($39.99/mo), Platinum ($79.99/mo)
- **Premium Features**: Enhanced listings, analytics, featured placement, photo galleries
- **Self-Service Management**: Business dashboard for claimed listings (`/businesses/manage`)
- **Monetization Ready**: API endpoints for payments and subscription management

### Jobs (`/jobs`)
- Job posting listings
- Filter by job type (full-time, part-time, contract, etc.)
- Salary information and requirements
- Direct application links and contact details

### Classifieds (`/classifieds`)
- Buy, sell, and trade marketplace
- Image galleries for listings
- Price filtering and condition indicators
- Contact sellers directly

## 🔧 API Endpoints

All API endpoints support GET requests and return JSON responses:

- `GET /api/events` - Retrieve events
- `GET /api/news` - Retrieve news articles
- `GET /api/businesses` - Retrieve business listings
- `GET /api/jobs` - Retrieve job postings
- `GET /api/classifieds` - Retrieve classified listings
- `GET /api/seed` - Seed database and get statistics

Query parameters:
- `limit` - Limit number of results
- `category` - Filter by category
- `featured` - Show only featured items

## 🎨 UI Components

### Custom Components
- **Button**: Flexible button component with variants and `asChild` prop support
- **Card**: Container component for content sections
- **Badge**: Status and category indicators
- **Navigation**: Responsive navigation bar

### Design System
- **Colors**: Blue primary, with semantic colors for different content types
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Responsiveness**: Mobile-first responsive design

## 🔒 Environment Variables

Required environment variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Next.js (optional)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## 📊 Database Schema

The application uses MongoDB with Mongoose for the following collections:

- **Events**: Community events and activities
- **News**: Local news articles and updates
- **Businesses**: Local business directory
- **Jobs**: Job postings and opportunities
- **Classifieds**: Marketplace listings

Each collection includes common fields like:
- Unique ID and title
- Category and status
- Created/updated timestamps
- Featured flag for highlighted content

## 🚀 Deployment

The application is ready for deployment on platforms like:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Next.js 15 and the latest React features
- UI components inspired by modern design systems
- Icons provided by Lucide React
- Responsive design powered by Tailwind CSS

---

**All Things Wetaskiwin** - Connecting the community, one click at a time. 🏘️
