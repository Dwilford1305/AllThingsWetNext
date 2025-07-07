# 🧪 Pre-Merge Testing Suite

This directory contains comprehensive testing script### Test Options:

**Standard test (recommended for most cases):**
```powershell
.\comprehensive-test.ps1
```

**Test with live scrapers (takes longer, more comprehensive):**
```powershell
.\comprehensive-test.ps1 -RunScrapers
```admin dashboard and scraper functionality work correctly before creating a pull request.

## 🚀 Quick Start

**Run all tests before creating a PR:**
```powershell
.\comprehensive-test.ps1
```

**Run tests with actual scraper execution (takes longer):**
```powershell
.\comprehensive-test.ps1 -RunScrapers
```

## 📋 Testing Script

### `comprehensive-test.ps1` (The Only Test Script You Need) ✅
Comprehensive testing of all admin dashboard functionality, APIs, and scraper systems.

**Parameters:**
- `-BaseUrl` - Development server URL (default: `http://localhost:3000`)
- `-RunScrapers` - Run live scrapers (takes time, default: false)
- `-Verbose` - Show detailed output (default: false)

**What it tests:**
- ✅ Database connection and health
- ✅ All admin API endpoints (stats, config, logs)
- ✅ Content APIs (businesses, events, news)
- ✅ Scraper configuration CRUD operations
- ✅ Scraper logging system
- ✅ Page loading (admin dashboard, main page)
- ✅ Error handling and validation
- ✅ Optional: Live scraper execution

## 🎯 Pre-Merge Checklist

Before creating a pull request, ensure:

1. **Development server is running:**
   ```powershell
   npm run dev
   ```

2. **All tests pass:**
   ```powershell
   .\comprehensive-test.ps1
   ```

3. **No build errors:**
   ```powershell
   npm run build
   ```

4. **Admin dashboard loads and functions correctly**

5. **Scraper configuration updates work in the UI**

## 🔧 Troubleshooting

### Common Issues:

**"Development server is not running"**
- Start the dev server: `npm run dev`
- Wait for it to fully load before running tests

**"Database connection failed"**
- Check `.env.local` has correct `MONGODB_URI`
- Ensure MongoDB Atlas connection is working

**"TypeScript compilation errors"**
- Run `npm run type-check` to see detailed errors
- Fix TypeScript issues before proceeding

**"ESLint errors"**
- Run `npm run lint` to see all linting issues
- Fix linting errors before proceeding

**"Build process failed"**
- Check for syntax errors in components
- Ensure all imports are correct
- Verify API routes are properly structured

### Test Options:

**Standard comprehensive test:**
```powershell
.\comprehensive-test.ps1
```

**Test with live scrapers (takes longer, more comprehensive):**
```powershell
.\comprehensive-test.ps1 -RunScrapers
```

**Verbose output for debugging:**
```powershell
.\comprehensive-test.ps1 -Verbose
```

## 📊 Success Criteria

All tests should pass with:
- ✅ 0 failed tests
- ✅ All API endpoints responding correctly
- ✅ Database operations working
- ✅ Admin dashboard fully functional
- ✅ Scraper configuration system working
- ✅ Build process clean
- ✅ No TypeScript or ESLint errors

## 🎉 Ready for PR!

When you see:
```
🎉 ALL TESTS PASSED! READY FOR PULL REQUEST!
```

You can confidently:
1. Create your pull request
2. Include test results in the PR description
3. Merge when reviewed and approved

## 📝 Notes

- Tests are designed to be non-destructive (won't affect production data)
- Actual scraper execution is optional and disabled by default
- All tests include proper error handling and detailed reporting
- Script works on Windows PowerShell (adjust for other platforms if needed)
- Single comprehensive script covers all testing needs
