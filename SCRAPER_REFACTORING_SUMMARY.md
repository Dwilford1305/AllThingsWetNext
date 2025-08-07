# Scraper System Refactoring Summary

## Overview
This document summarizes the comprehensive refactoring and fixes applied to the AllThingsWetNext web scraper system to address scheduling, data handling, and code quality issues.

## Issues Fixed

### 1. Cron Job Scheduling ✅
**Problem**: Inconsistent scheduling and missing business scraper
- News and events both running at same time
- Business scraper missing from cron configuration

**Solution**:
- Updated `vercel.json` to include business scraper cron job
- All scrapers now run at 6:00 AM Mountain Time (13:00 UTC):
  - News: Daily at `0 13 * * *`
  - Events: Daily at `0 13 * * *` 
  - Business: Weekly on Monday at `0 13 * * 1`

### 2. Data Deletion Issues ✅
**Problem**: Inconsistent data cleanup logic between services
- Events were deleting day-after instead of current past events
- News had inconsistent retention periods (14 vs 15 days)
- **Critical Issue**: Scrapers were re-adding old articles immediately after deletion

**Solution**:
- **News**: Consistently delete articles older than 14 days + prevent re-scraping of old articles
- **Events**: Delete events that are past their scheduled date (at time of scrape)
- **Business**: No deletion (businesses are persistent data)
- **Added validation**: News scrapers now skip articles older than retention period during scraping

### 3. Code Cleanup and Deduplication ✅
**Problem**: Redundant code and duplicate logic
- Duplicate ID generation functions across multiple files
- Unused API endpoints

**Solution**:
- Created centralized `idGenerator.ts` utility with functions:
  - `generateEventId(title, date)`
  - `generateArticleId(title, publishedAt)`
  - `generateBusinessId(name, address)`
- Updated all services to use centralized ID generation
- Removed unused `/api/scraper/scheduled` endpoint

## Files Modified

### Core Configuration
- `vercel.json` - Added business scraper cron job

### Data Cleanup Logic
- `src/lib/scraperService.ts` - Fixed events deletion to delete past events immediately
- `src/lib/comprehensiveScraperService.ts` - Aligned news retention to 14 days, fixed events deletion logic

### Code Deduplication
- `src/lib/utils/idGenerator.ts` - NEW: Centralized ID generation utilities
- `src/lib/scrapers/base.ts` - Use centralized event ID generation
- `src/lib/scrapers/newsBase.ts` - Use centralized article ID generation  
- `src/lib/newsScraperService.ts` - Use centralized ID generation, removed duplicate function
- `src/lib/scraperService.ts` - Use centralized ID generation, removed duplicate function
- `src/lib/businessScraperService.ts` - Use centralized ID generation, removed duplicate function

### Cleanup
- Removed `src/app/api/scraper/scheduled/` - Unused redundant API endpoint

## Current Scraper Schedule

| Scraper | Frequency | Schedule (UTC) | Schedule (Mountain) |
|---------|-----------|----------------|-------------------|
| News | Daily | 13:00 | 6:00 AM |
| Events | Daily | 13:00 | 6:00 AM |
| Business | Weekly (Monday) | 13:00 | 6:00 AM |

## Data Retention Policies

| Content Type | Retention Period | Deletion Criteria |
|--------------|------------------|-------------------|
| News Articles | 14 days | Articles older than 14 days from current date |
| Events | Immediate | Events past their scheduled date/time |
| Businesses | Permanent | No automatic deletion (persistent data) |

## API Endpoints (Unchanged)

All existing API functionality is preserved:
- `GET/POST /api/cron/scrape` - Main Vercel cron endpoint
- `POST /api/scraper/comprehensive` - Admin dashboard interface
- `POST /api/scraper/news` - Manual news scraping
- `POST /api/scraper/events` - Manual events scraping
- `POST /api/scraper/businesses` - Manual business scraping

## Testing & Validation

The refactoring maintains backward compatibility while improving:
- **Reliability**: Consistent scheduling and data cleanup
- **Maintainability**: Centralized utilities, eliminated code duplication
- **Performance**: Cleaner codebase with removed redundant endpoints

## Environment Variables Required

Ensure these are set in Vercel:
- `CRON_SECRET` - For securing cron job endpoints
- `MONGODB_URI` - Database connection
- Other existing environment variables

## Next Steps

1. **Monitor Logs**: Check Vercel function logs after deployment to ensure scrapers run as scheduled
2. **Verify Data Cleanup**: Confirm old news/events are being deleted properly
3. **Test Manual Triggers**: Ensure admin dashboard still works correctly
4. **Performance Monitoring**: Watch for any performance impacts from the changes

The scraper system is now optimized for reliability, maintainability, and correct data handling while preserving all existing functionality.
