# Scraper Setup Guide

This guide covers setting up automated scraping for both local development (Windows) and cloud deployment (Vercel/production).

## 🚀 Cloud Deployment (Vercel) - Recommended for Production

### 1. Vercel Cron Jobs Configuration

The project includes a `vercel.json` file that automatically configures cron jobs when deployed to Vercel:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape?type=news",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/scrape?type=events", 
      "schedule": "30 */6 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- News scraping: Every 6 hours at the top of the hour (12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM)
- Events scraping: Every 6 hours at 30 minutes past the hour (12:30 AM, 6:30 AM, 12:30 PM, 6:30 PM)

### 2. Environment Variables for Vercel

Set these in your Vercel project dashboard under Settings → Environment Variables:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `MONGODB_DB` - Your database name

**Optional (for enhanced security):**
- `CRON_SECRET` - A secret token for manual cron triggering (generate a random 32-character string)

### 3. Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy the project
4. The cron jobs will automatically start running according to the schedule

### 4. Monitoring Vercel Cron Jobs

**Check cron job status:**
```bash
curl https://your-app.vercel.app/api/cron/scrape
```

**Manually trigger scraping (if CRON_SECRET is set):**
```bash
# Scrape both news and events
curl -X POST "https://your-app.vercel.app/api/cron/scrape?type=both&force=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Scrape only news
curl -X POST "https://your-app.vercel.app/api/cron/scrape?type=news&force=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Scrape only events  
curl -X POST "https://your-app.vercel.app/api/cron/scrape?type=events&force=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 5. Vercel Function Logs

View scraping logs in the Vercel dashboard:
1. Go to your project in Vercel
2. Click on "Functions" tab
3. View logs for the `/api/cron/scrape` function
4. You can also use Vercel CLI: `vercel logs`

### 6. Security Features

- **Vercel Cron Protection**: Only Vercel can trigger the cron endpoint (verified by `vercel-cron` header)
- **Optional Secret Auth**: Add extra security with `CRON_SECRET` environment variable
- **Rate Limiting**: Built-in 5-hour minimum interval between runs (unless forced)
- **Error Handling**: Comprehensive error logging and graceful failure handling

---

## 🖥️ Local Development (Windows)

For local development and testing, you can use Windows Task Scheduler with the provided PowerShell scripts.

### Prerequisites

### Prerequisites

- Windows 10/11
- PowerShell 5.1 or later
- Your Next.js application running locally (usually on port 3000)

### Files Created:
- `scrape-news.ps1` - Script to scrape news articles
- `scrape-events.ps1` - Script to scrape events  
- `comprehensive-test.ps1` - Comprehensive test script to verify all functionality
- `monitor-scrapers.ps1` - Monitor script to check scraper status and logs
- `scraper-logs.txt` - Log file that will be created automatically

### Step 1: Test the Scripts

First, test that everything works:
```powershell
# Navigate to project directory
cd d:\AllThingsWetNext

# Test all functionality (including scrapers)
.\comprehensive-test.ps1 -RunScrapers

# Check status and logs
.\monitor-scrapers.ps1
```

### Step 2: Set Up Windows Task Scheduler
#### Create News Scraping Task:

1. Open **Task Scheduler** (search for it in Start menu)
2. Click **"Create Basic Task..."** in the right panel
3. **Name**: `Wetaskiwin News Scraper`
4. **Description**: `Automatically scrape news articles every 6 hours`
5. Click **Next**

6. **Trigger**: Select **"Daily"**, click **Next**
7. **Start**: Choose a start time (e.g., 12:00 AM)
8. **Recur every**: 1 days
9. Click **Next**

10. **Action**: Select **"Start a program"**, click **Next**
11. **Program/script**: `powershell.exe`
12. **Add arguments**: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "d:\AllThingsWetNext\scrape-news.ps1"`
13. Click **Next**, then **Finish**

14. **Important**: Right-click the created task → **Properties**
15. Go to **Triggers** tab → **Edit** the trigger
16. Check **"Repeat task every"** → Select **"6 hours"**
17. **For a duration of**: Select **"Indefinitely"**
18. Click **OK**

#### Create Events Scraping Task:

1. Click **"Create Basic Task..."** again
2. **Name**: `Wetaskiwin Events Scraper`
3. **Description**: `Automatically scrape events every 6 hours`
4. Click **Next**

5. **Trigger**: Select **"Daily"**, click **Next**
6. **Start**: Choose a start time **3 hours offset** from news (e.g., 3:00 AM if news is at 12:00 AM)
7. **Recur every**: 1 days
8. Click **Next**

9. **Action**: Select **"Start a program"**, click **Next**
10. **Program/script**: `powershell.exe`
11. **Add arguments**: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "d:\AllThingsWetNext\scrape-events.ps1"`
12. Click **Next**, then **Finish**

13. **Important**: Right-click the created task → **Properties**
14. Go to **Triggers** tab → **Edit** the trigger
15. Check **"Repeat task every"** → Select **"6 hours"**
16. **For a duration of**: Select **"Indefinitely"**
17. Click **OK**

### Step 3: Additional Task Settings (for both tasks)

For each task, right-click → **Properties** and configure:

#### General Tab:
- Check **"Run whether user is logged on or not"**
- Check **"Run with highest privileges"**

#### Conditions Tab:
- Uncheck **"Start the task only if the computer is on AC power"**
- Uncheck **"Stop if the computer switches to battery power"**

#### Settings Tab:
- Check **"Allow task to be run on demand"**
- Check **"Run task as soon as possible after a scheduled start is missed"**
- **If the running task does not end when requested**: Select **"Stop the existing instance"**

### Local Development Schedule Summary:
- **News Scraping**: Every 6 hours starting at 12:00 AM (12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM)
- **Events Scraping**: Every 6 hours starting at 3:00 AM (3:00 AM, 9:00 AM, 3:00 PM, 9:00 PM)

### Testing Local Setup:
1. Run `d:\AllThingsWetNext\comprehensive-test.ps1 -RunScrapers` to test all functionality including scrapers
2. Run `d:\AllThingsWetNext\monitor-scrapers.ps1` to check status and recent activity
3. In Task Scheduler, right-click each task and select **"Run"** to test
4. Check the log file at `d:\AllThingsWetNext\scraper-logs.txt`

### Monitoring Local Setup:
- Run the monitoring script: `d:\AllThingsWetNext\monitor-scrapers.ps1`
- View logs: `Get-Content d:\AllThingsWetNext\scraper-logs.txt -Tail 20`
- View task history in Task Scheduler
- Check if articles are being updated on your website

### Troubleshooting Local Setup:
- Make sure your Next.js app is running (use `npm run dev` or production server)
- Check Windows Event Viewer → Windows Logs → System for task scheduler errors
- Run the test script manually if issues occur
- Check the log file for detailed error messages

---

## 📊 General Monitoring & Maintenance

### API Endpoints for Manual Testing

**News Scraping:**
```bash
# Local development
curl -X POST http://localhost:3000/api/scraper/news

# Production
curl -X POST https://your-app.vercel.app/api/scraper/news
```

**Events Scraping:**
```bash
# Local development  
curl -X POST http://localhost:3000/api/scraper/events

# Production
curl -X POST https://your-app.vercel.app/api/scraper/events
```

**Get News Articles:**
```bash
# Local/Production
curl https://your-app.vercel.app/api/news
```

**Get Events:**
```bash
# Local/Production  
curl https://your-app.vercel.app/api/events
```

### Database Maintenance

**Clear old data (if needed):**
```bash
# Delete all news
curl -X DELETE https://your-app.vercel.app/api/news

# Delete all events
curl -X DELETE https://your-app.vercel.app/api/events
```

### Best Practices

1. **Monitor regularly**: Check logs weekly to ensure scrapers are working
2. **Update selectors**: If source websites change structure, update scraper selectors
3. **Backup data**: Regular MongoDB backups (automated via MongoDB Atlas if using cloud)
4. **Rate limiting**: Current setup includes built-in rate limiting to be respectful to source sites
5. **Error handling**: All scrapers include comprehensive error handling and logging

### Important Notes:
- ✅ Scripts include error handling and health checks
- ✅ Logs are automatically created and appended to
- ✅ Scripts will skip scraping if the server is not responding
- ✅ No duplicate articles will be created (built-in deduplication)
- ✅ Respectful scraping with delays between requests
- ✅ Proper source attribution for all scraped content
