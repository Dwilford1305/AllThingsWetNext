# Script to monitor scraper status and show recent activity
# Run this anytime to check if the scrapers are working

$LogFile = "d:\AllThingsWetNext\scraper-logs.txt"

Write-Host "========================================" -ForegroundColor Green
Write-Host "    WETASKIWIN SCRAPER STATUS" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if log file exists
if (Test-Path $LogFile) {
    Write-Host "📋 RECENT ACTIVITY (Last 10 entries):" -ForegroundColor Yellow
    Write-Host "--------------------------------------"
    $recentLogs = Get-Content $LogFile -Tail 10
    foreach ($log in $recentLogs) {
        if ($log -match "ERROR") {
            Write-Host $log -ForegroundColor Red
        } elseif ($log -match "successfully") {
            Write-Host $log -ForegroundColor Green
        } elseif ($log -match "Starting") {
            Write-Host $log -ForegroundColor Cyan
        } else {
            Write-Host $log
        }
    }
} else {
    Write-Host "⚠️  No log file found. Scrapers may not have run yet." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 CHECKING SERVER STATUS:" -ForegroundColor Yellow
Write-Host "-------------------------"

# Check if server is running
try {
    $newsCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/news?limit=5" -Method Get -TimeoutSec 5
    $newsCount = $newsCheck.data.Count
    Write-Host "✅ Server is running - Found $newsCount recent news articles" -ForegroundColor Green
    
    $eventsCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/events?limit=5" -Method Get -TimeoutSec 5  
    $eventsCount = $eventsCheck.data.Count
    Write-Host "✅ Server is running - Found $eventsCount recent events" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Server is not responding at http://localhost:3000" -ForegroundColor Red
    Write-Host "   Make sure your Next.js app is running with 'npm run dev'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⏰ SCHEDULED TASKS STATUS:" -ForegroundColor Yellow
Write-Host "-------------------------"

# Check Windows Scheduled Tasks
try {
    $newsTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*News*" -and $_.TaskName -like "*Wetaskiwin*" }
    $eventsTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*Events*" -and $_.TaskName -like "*Wetaskiwin*" }
    
    if ($newsTasks) {
        foreach ($task in $newsTasks) {
            $status = $task.State
            $name = $task.TaskName
            if ($status -eq "Ready") {
                Write-Host "✅ $name : $status" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $name : $status" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "⚠️  No news scraping task found in Task Scheduler" -ForegroundColor Yellow
    }
    
    if ($eventsTasks) {
        foreach ($task in $eventsTasks) {
            $status = $task.State
            $name = $task.TaskName
            if ($status -eq "Ready") {
                Write-Host "✅ $name : $status" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $name : $status" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "⚠️  No events scraping task found in Task Scheduler" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠️  Could not check scheduled tasks" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📁 LOG FILE LOCATION:" -ForegroundColor Yellow
Write-Host "--------------------"
Write-Host $LogFile

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
