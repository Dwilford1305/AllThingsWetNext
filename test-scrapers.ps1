# Master script to test both scrapers manually
# Run this script to test that both news and events scraping work

$ErrorActionPreference = "Continue"
$LogFile = "d:\AllThingsWetNext\scraper-logs.txt"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Log {
    param($Message)
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

Write-Log "========== MANUAL SCRAPER TEST STARTED =========="

# Test News Scraping
Write-Log "Testing news scraping..."
try {
    & "d:\AllThingsWetNext\scrape-news.ps1"
    Write-Log "News scraping test completed"
} catch {
    Write-Log "News scraping test failed: $_"
}

# Wait 30 seconds between scrapes to avoid overloading
Write-Log "Waiting 30 seconds before events scraping..."
Start-Sleep -Seconds 30

# Test Events Scraping
Write-Log "Testing events scraping..."
try {
    & "d:\AllThingsWetNext\scrape-events.ps1"
    Write-Log "Events scraping test completed"
} catch {
    Write-Log "Events scraping test failed: $_"
}

Write-Log "========== MANUAL SCRAPER TEST COMPLETED =========="
Write-Host ""
Write-Host "Test completed! Check the log file at: $LogFile"
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
