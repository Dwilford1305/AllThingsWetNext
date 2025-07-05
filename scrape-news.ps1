# PowerShell script to automatically scrape news articles
# This script should be scheduled to run every 6 hours

$ErrorActionPreference = "Continue"
$LogFile = "d:\AllThingsWetNext\scraper-logs.txt"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Log {
    param($Message)
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

try {
    Write-Log "Starting news scraping..."
    
    # Check if the server is responding
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/news" -Method Get -TimeoutSec 10
        Write-Log "Server is responding"
    } catch {
        Write-Log "ERROR: Server not responding at http://localhost:3000 - $_"
        exit 1
    }
    
    # Trigger news scraping
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/scraper/news" -Method Post -Body '{}' -ContentType "application/json" -TimeoutSec 60
    
    if ($response.success) {
        $message = $response.message
        Write-Log "News scraping completed successfully: $message"
    } else {
        Write-Log "ERROR: News scraping failed - $($response.error)"
    }
    
} catch {
    Write-Log "ERROR: News scraping failed with exception - $_"
    exit 1
}

Write-Log "News scraping script finished"
