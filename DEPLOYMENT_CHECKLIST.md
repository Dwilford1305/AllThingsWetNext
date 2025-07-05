# Deployment Checklist

## ✅ Pre-Deployment Checklist

### Environment Variables
- [ ] `MONGODB_URI` - Set to your MongoDB connection string
- [ ] `MONGODB_DB` - Set to your database name  
- [ ] `CRON_SECRET` - (Optional) Set to a random 32-character string for enhanced security

### Vercel Configuration
- [ ] `vercel.json` file is present in project root
- [ ] GitHub repository is connected to Vercel
- [ ] Environment variables are set in Vercel dashboard

### Code Verification
- [ ] All scrapers are working locally (`npm run dev` then test endpoints)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Database connection is working

## 🚀 Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add automated scraping with Vercel cron jobs"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect GitHub repo to Vercel
   - Deploy the project
   - Verify deployment is successful

3. **Set Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required environment variables
   - Redeploy to apply environment variables

4. **Verify Cron Jobs**
   - Check Vercel Dashboard → Your Project → Functions
   - Look for cron job functions in the list
   - Wait for next scheduled run or trigger manually

## 🧪 Post-Deployment Testing

### Test Cron Status Endpoint
```bash
curl https://your-app.vercel.app/api/cron/scrape
```

### Test Manual Trigger (if CRON_SECRET is set)
```bash
curl -X POST "https://your-app.vercel.app/api/cron/scrape?type=both&force=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Individual Scrapers
```bash
# Test news scraper
curl -X POST https://your-app.vercel.app/api/scraper/news

# Test events scraper  
curl -X POST https://your-app.vercel.app/api/scraper/events
```

### Verify Data is Being Scraped
```bash
# Check news articles
curl https://your-app.vercel.app/api/news

# Check events
curl https://your-app.vercel.app/api/events
```

## 📊 Monitoring

### View Function Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to Functions tab
4. Click on `/api/cron/scrape` function
5. View logs and invocations

### Check Cron Job Status
- Use the status endpoint: `GET /api/cron/scrape`
- Check "lastRun" and "nextScheduled" times
- Monitor for any errors in the logs

### Set Up Alerts (Optional)
- Use Vercel's monitoring features
- Set up external monitoring with services like UptimeRobot
- Monitor your website's news/events pages for fresh content

## 🔧 Troubleshooting

### Common Issues

**Cron jobs not running:**
- Check if `vercel.json` is in project root
- Verify cron expressions are correct
- Check Vercel function logs for errors

**Database connection errors:**
- Verify `MONGODB_URI` is correct
- Ensure database allows connections from Vercel IPs
- Check if database is accessible

**Scraping errors:**
- Check if source websites are accessible
- Verify scraper selectors are still valid
- Monitor function timeout limits (10s for Hobby plan)

**No new content:**
- Check if websites have new content
- Verify deduplication is working correctly
- Check if content categorization is accurate

### Getting Help
- Check Vercel function logs for detailed error messages
- Test scrapers individually to isolate issues
- Use the local development setup for debugging
- Check source website structure for changes

## 📋 Maintenance Schedule

### Weekly
- [ ] Check scraper logs for errors
- [ ] Verify new content is being scraped
- [ ] Monitor website performance

### Monthly
- [ ] Review and optimize scraper performance
- [ ] Check for source website structure changes
- [ ] Update scraper selectors if needed
- [ ] Backup database (if not auto-backed up)

### As Needed
- [ ] Update dependencies
- [ ] Improve error handling
- [ ] Add new content sources
- [ ] Optimize scraping schedules

---

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Cron jobs are running on schedule
- ✅ New articles/events are being scraped regularly
- ✅ No errors in function logs
- ✅ Website displays fresh content
- ✅ Source attribution is present and correct
