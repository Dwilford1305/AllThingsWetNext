# All Things Wetaskiwin - GitHub Copilot Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites & Setup
- **Node.js**: Requires 18+ (tested with 20.19.4)
- **npm**: Version 10+ (tested with 10.8.2) 
- **MongoDB Atlas**: Account and connection string required for database operations
- **Git**: For version control operations

### Bootstrap & Build Process
Run these commands in sequence for initial setup:

1. **Install dependencies**:
   ```bash
   npm install
   ```
   - Takes 30-60 seconds depending on network
   - Downloads ~610M to node_modules
   - Safe to run multiple times

2. **Set up environment variables**:
   Create `.env.local` in project root:
   ```env
   # Required - MongoDB Atlas connection
   MONGODB_URI=your_mongodb_atlas_connection_string
   
   # Required - Authentication secrets  
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   
   # Optional - Email configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   
   # Optional - Admin setup
   ADMIN_EMAIL=your_admin@email.com
   SUPER_ADMIN_SETUP_KEY=your_admin_setup_key
   
   # Optional - Cron job security
   CRON_SECRET=your_32_character_random_string
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```
   - **NEVER CANCEL**: Build takes 35-45 seconds. Set timeout to 90+ seconds minimum.
   - Creates ~300M in .next/ directory
   - Must complete successfully before deployment
   - Shows "Missing MONGODB_URI environment variable" warnings without .env.local - this is expected

4. **Run tests**:
   ```bash
   npm run test
   ```
   - **NEVER CANCEL**: Tests take ~1 second. Set timeout to 30+ seconds for safety.
   - Currently has 3 passing tests for scheduling utilities
   - Must pass before committing changes

5. **Lint the code**:
   ```bash
   npm run lint
   ```
   - **NEVER CANCEL**: Linting takes ~5 seconds. Set timeout to 60+ seconds.
   - Must pass with no warnings before committing
   - Uses ESLint with Next.js configuration

### Development Workflow

#### Start Development Server
```bash
npm run dev
```
- **NEVER CANCEL**: Server starts in ~1 second. Set timeout to 60+ seconds.
- Runs on http://localhost:3000 with Turbopack
- Supports hot reloading and fast refresh
- Shows warning about Webpack/Turbopack config - this is normal

#### Run Production Build Locally
```bash
npm run build && npm run start
```
- Build: 35-45 seconds (NEVER CANCEL - set 90+ second timeout)
- Start: ~1 second (set 30+ second timeout) 
- Production server runs on http://localhost:3000

## Validation Scenarios

### CRITICAL: Always test these scenarios after making changes

#### 1. Basic Application Health
```bash
# Start dev server first: npm run dev
curl http://localhost:3000/api/health
```
- Should return JSON with status information
- Database connection may show "unhealthy" without MongoDB - this is expected

#### 2. Core Pages Accessibility
Test all major pages return 200 status:
```bash
curl -I http://localhost:3000/           # Homepage
curl -I http://localhost:3000/events     # Events page  
curl -I http://localhost:3000/businesses # Business directory
curl -I http://localhost:3000/news       # News page
curl -I http://localhost:3000/jobs       # Jobs page
curl -I http://localhost:3000/marketplace # Marketplace
```

#### 3. API Endpoints Functionality
```bash
curl http://localhost:3000/api/events     # Events API
curl http://localhost:3000/api/businesses # Business API
curl http://localhost:3000/api/news       # News API
```
- APIs return error messages like `{"success":false,"error":"Failed to fetch events"}` without database - this is expected graceful degradation
- With database: returns actual data arrays

#### 4. Authentication System Test
- Visit http://localhost:3000/auth-test 
- Test user registration and login flows
- Verify JWT token generation works

#### 5. Admin Dashboard Access
- Visit http://localhost:3000/admin
- Should show login form or redirect to auth
- Test with admin credentials once set up

## Key Project Areas

### Application Structure (src/app)
- **Homepage**: `/` - Dashboard with community stats and recent content
- **Events**: `/events` - Community event listings with filtering
- **Businesses**: `/businesses` - Local business directory with search
- **Business Management**: `/businesses/manage` - Self-service business dashboard  
- **News**: `/news` - Local news aggregation
- **Jobs**: `/jobs` - Job postings and opportunities
- **Marketplace**: `/marketplace` - Buy/sell/trade listings
- **Authentication**: `/auth-test` - Test authentication flows
- **Admin Dashboard**: `/admin` - Administrative interface
- **Profile Management**: `/profile` - User account management

### API Routes (src/app/api)
- **Health Check**: `/api/health` - System status and connectivity
- **Authentication**: `/api/auth/*` - User login, signup, password reset
- **Business Operations**: `/api/businesses/*` - CRUD, claiming, subscriptions
- **Content APIs**: `/api/events`, `/api/news`, `/api/jobs`, `/api/marketplace`
- **Scraping System**: `/api/scraper/*` - Automated content collection
- **Admin APIs**: `/api/admin/*` - Administrative functions
- **Cron Jobs**: `/api/cron/scrape` - Scheduled scraping tasks

### Component Library (src/components)
- **Dashboard.tsx**: Main dashboard component with statistics
- **BusinessDashboard.tsx**: Business management interface
- **BusinessRequestForm.tsx**: Business claiming workflow
- **DevelopmentBanner.tsx**: Development environment indicator
- **RequireAuth.tsx**: Authentication wrapper component
- **UI Components**: Button, Card, Badge, Navigation in `/components/ui/`

### Core Services (src/lib)
- **mongodb.ts**: Database connection with Atlas integration
- **auth.ts**: JWT authentication and user management
- **scraperService.ts**: Base scraping functionality
- **emailService.ts**: Email notifications and communications
- **scheduling.ts**: Cron job scheduling utilities

## Deployment & Production

### Vercel Deployment (Primary)
- **Automatic**: Pushes to `main` branch auto-deploy
- **Manual**: Use `npx vercel --prod` 
- **Environment Variables**: Set in Vercel dashboard under Project Settings
- **Cron Jobs**: Configured via `vercel.json` - run every 12 hours
- **Build Time**: ~2-3 minutes on Vercel (longer than local due to cold start)

### Environment Validation for Deployment
Before deploying, verify:
```bash
npm run build  # Must complete without errors
npm run test   # All tests must pass
npm run lint   # No linting errors
```

## Common Development Tasks

### Adding New Features
1. Always run `npm run build && npm run test && npm run lint` before starting
2. Make changes in appropriate `src/` directories
3. Test locally with `npm run dev`
4. Add tests if applicable in `tests/` directory
5. Run validation commands again: `npm run build && npm run test && npm run lint`
6. Test key user scenarios manually

### Database Operations
- **Seed Data**: Visit `http://localhost:3000/api/seed` (dev only)
- **Reset Business Data**: `/api/debug/reset-businesses` (dev only)
- **Check Database Health**: `/api/health`

### Scraper Management
- **Manual Scraping**: `/api/scraper/comprehensive` 
- **Test Individual Scrapers**: `/api/scraper/news`, `/api/scraper/events`, `/api/scraper/businesses`
- **View Scraper Logs**: Use admin dashboard or check `scraper-logs.txt`

### Troubleshooting Build Issues
- **Clear Next.js cache**: `rm -rf .next` then `npm run build`
- **Reinstall dependencies**: `rm -rf node_modules package-lock.json` then `npm install`
- **Check environment variables**: Ensure `.env.local` exists with required values
- **TypeScript errors**: Run `npx tsc --noEmit` to check type issues
- **Port already in use**: Kill process with `lsof -ti:3000 | xargs kill -9` or use different port

### Complete Validation Sequence
Run this complete sequence to validate any changes:
```bash
# Clean build test
npm run build
npm run test  
npm run lint

# Start development server
npm run dev

# In another terminal, test all endpoints:
curl -I http://localhost:3000/           # Should return 200
curl -I http://localhost:3000/events     # Should return 200
curl -I http://localhost:3000/businesses # Should return 200
curl http://localhost:3000/api/health    # Should return JSON status
curl http://localhost:3000/api/events    # Should return graceful error or data
```

## Timing Expectations & Warnings

### NEVER CANCEL Commands - Critical Timeouts
- **npm install**: 30-60 seconds (set 120+ second timeout)
- **npm run build**: 45 seconds (set 90+ second timeout) 
- **npm run dev**: 1-2 seconds (set 60+ second timeout)
- **npm run test**: 1 second (set 30+ second timeout)
- **npm run lint**: 5 seconds (set 60+ second timeout)

### Expected File Sizes
- **node_modules/**: ~610MB
- **.next/** (after build): ~300MB
- **Source code**: ~50MB

## Security & Best Practices

### Environment Variables
- **NEVER commit** `.env.local` or `.env*` files to git
- **Always use** strong, unique secrets for JWT keys
- **Rotate secrets** in production regularly
- **Use HTTPS** in production (handled by Vercel)

### Authentication
- JWT tokens expire in 1 hour (configurable)
- Refresh tokens expire in 7 days (configurable) 
- Password hashing uses bcrypt with salt rounds
- Support for 2FA with TOTP

### API Security
- Rate limiting on authentication endpoints
- CSRF protection on state-changing operations
- Input validation using Zod schemas
- SQL injection protection via Mongoose ODM

## Development Environment Notes

### Known Warnings (Safe to Ignore)
- "Webpack is configured while Turbopack is not" - Next.js 15 transition warning
- "Missing MONGODB_URI during build" - Expected during static generation
- npm audit warnings for dev dependencies - Generally safe unless critical

### Performance Optimization
- Uses Turbopack for faster development builds
- Image optimization configured for multiple CDNs
- MongoDB connection pooling and caching
- Static generation for marketing pages

## Success Criteria

After following these instructions, you should be able to:
- ✅ Build the application without errors in under 90 seconds
- ✅ Start development server in under 60 seconds  
- ✅ Access all major pages (/, /events, /businesses, /news, /jobs)
- ✅ See proper responses from API endpoints
- ✅ Pass all tests and linting checks
- ✅ Deploy to Vercel successfully
- ✅ Handle both database-connected and disconnected scenarios gracefully

**Remember**: This application gracefully handles missing database connections during development, so you can build, test, and develop core features even without MongoDB Atlas configured.