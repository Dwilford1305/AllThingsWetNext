# All Things Wetaskiwin

A modern, full-stack community hub application built with Next.js 15, TypeScript, Tailwind CSS, and MongoDB Atlas. This application serves as a central platform for the Wetaskiwin community to discover events, news, local businesses, job opportunities, and classified listings.

## 🚀 Features

- **Dashboard**: Beautiful homepage with community statistics and recent content
- **Events**: Browse and discover upcoming community events with filtering and search
- **News**: Stay updated with the latest local news and announcements
- **Businesses**: Directory of local businesses with contact information and hours
- **Jobs**: Find career opportunities and job postings in the area
- **Classifieds**: Buy, sell, and trade items locally
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, accessible interface built with Tailwind CSS

## 🛠 Tech Stack

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
- Local business directory
- Business hours and contact information
- Category filtering (retail, restaurant, service, etc.)
- Click-to-call and email functionality

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
