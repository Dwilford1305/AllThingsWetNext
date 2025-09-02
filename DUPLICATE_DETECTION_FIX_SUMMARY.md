# Business Duplicate Detection and Website Extraction Fix

## Summary

This fix addresses the two main issues reported:
1. **Duplicate businesses** (growing from 484 to 787 entries)  
2. **Missing website buttons** after scraper runs

## Root Causes Identified

### 1. Duplicate Business Issue
- **Problem**: The scraper only checked for duplicates within the current scraping session, not against existing database entries
- **Impact**: Each scraper run created new entries instead of updating existing ones
- **Location**: `src/lib/scrapers/wetaskiwinBusiness.ts` lines 75-83

### 2. Website Button Issue  
- **Problem**: Website extraction regex patterns were too restrictive and didn't handle all URL formats
- **Impact**: Website data wasn't being extracted from scraped content
- **Location**: `extractWebsite()` method in business scraper

## Solution Implemented

### 1. Database-Aware Duplicate Detection

#### Changes Made:
- **Modified** `WetaskiwinBusinessScraper.scrapeBusinessPage()` to accept existing business data from database
- **Added** `isDuplicateBusiness()` method that checks against both current session and existing database entries
- **Implemented** fuzzy matching with 80% similarity threshold for addresses
- **Enhanced** business name normalization to handle variations

#### Key Methods Added:
- `isDuplicateBusiness()` - Comprehensive duplicate detection
- `businessesAreEqual()` - Compare two businesses for equality  
- `normalizeBusinessName()` - Standardize business names for comparison
- `addressesAreSimilar()` - Fuzzy address matching with street number validation
- `calculateStringSimilarity()` - String similarity algorithm

### 2. Enhanced Website Extraction

#### Improvements:
- **Enhanced regex patterns** to capture more URL formats:
  - `example.com/contact` (domains with paths)
  - `subdomain.example.com` (subdomains) 
  - Better handling of trailing punctuation
- **Improved protocol handling** - automatically adds `https://` when missing
- **Better cleanup** - preserves paths while removing spurious punctuation

#### Patterns Now Supported:
```
Link: www.timhortons.com
Link: https://pizzapalace.ca/menu  
Link: localgarage.net/services
Link: beautysalon.ca/appointments
```

### 3. Business Scraper Service Updates

#### Key Changes:
- **Modified** `BusinessScraperService.scrapeBusinesses()` to fetch existing businesses for duplicate detection
- **Enhanced** duplicate cleanup to preserve website data when merging duplicates
- **Improved** scoring system for selecting best business entry when duplicates are found

## Testing Coverage

### New Test Files:
1. **`business-duplicate-detection.test.ts`** - 4 tests covering core duplicate detection logic
2. **`business-scraper-integration.test.ts`** - 5 integration tests covering end-to-end scenarios

### Test Coverage:
- ✅ Duplicate detection within scraping sessions
- ✅ Website extraction from various text formats  
- ✅ Business name normalization
- ✅ Address similarity detection
- ✅ Edge cases and error handling
- ✅ Integration with existing business data

## Results

### Before Fix:
- Duplicates created on each scraper run (484 → 787 businesses)
- Website extraction failed for many URL formats  
- No database-aware duplicate checking
- Limited test coverage for scraper logic

### After Fix:
- ✅ **27/27 tests pass** (added 9 new tests)
- ✅ **Database-aware duplicate detection** prevents new duplicates
- ✅ **Enhanced website extraction** handles more URL formats
- ✅ **Improved cleanup** preserves website data during duplicate merging
- ✅ **Build passes** without errors
- ✅ **ESLint passes** with no warnings

## Usage

### Running the Enhanced Scraper:
The scraper will now automatically:
1. Check existing businesses in database before creating new entries
2. Extract website URLs from more text formats
3. Merge data from duplicates (preserving website info) when cleaning up

### Cleaning Existing Duplicates:
Use the enhanced cleanup endpoint:
```bash
curl -X POST http://localhost:3000/api/businesses/cleanup-duplicates
```

This will:
- Identify duplicate businesses using the same logic as the scraper
- Keep the business entry with the most complete information
- Merge website and phone data from duplicates before removing them
- Preserve claimed business information

## Technical Details

### Duplicate Detection Algorithm:
1. **Normalize business names** - Remove suffixes (Ltd, Inc), special characters
2. **Extract street numbers** from addresses for precise comparison  
3. **Calculate similarity scores** using string matching algorithm
4. **Apply 80% threshold** for address similarity
5. **Check both current session and database** entries

### Website Extraction Improvements:
- Expanded regex patterns for better URL capture
- Support for domains with paths (`/contact`, `/menu`) 
- Automatic protocol addition (`https://`)
- Better punctuation cleanup while preserving paths

### Data Preservation:
- Always keeps oldest business entry (by creation date)
- Merges website data from newer duplicates if older entry lacks it
- Preserves phone numbers and contact information
- Maintains claimed business status and subscription data

This fix ensures that future scraper runs will not create duplicates and will properly extract and save website information for display in the UI.