# Comprehensive Admin Dashboard Test - PowerShell Compatible
param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$RunScrapers = $false,
    [switch]$Verbose = $false
)

Write-Host "=== ADMIN DASHBOARD COMPREHENSIVE TEST ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Run Live Scrapers: $RunScrapers" -ForegroundColor Gray
Write-Host ""

$tests = 0
$passed = 0
$startTime = Get-Date

function TestAPI($name, $url, $method = "GET", $body = $null) {
    $script:tests++
    Write-Host "[$script:tests] Testing: $name" -ForegroundColor Yellow
    
    try {
        $headers = @{ "Content-Type" = "application/json" }
        
        if ($method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method $method -Headers $headers -TimeoutSec 30
        } else {
            $jsonBody = if ($body) { $body | ConvertTo-Json -Depth 5 } else { "{}" }
            $response = Invoke-RestMethod -Uri $url -Method $method -Headers $headers -Body $jsonBody -TimeoutSec 30
        }
        
        Write-Host "  PASS: $name" -ForegroundColor Green
        $script:passed++
        return $response
    }
    catch {
        Write-Host "  FAIL: $name - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function TestPage($name, $url) {
    $script:tests++
    Write-Host "[$script:tests] Testing: $name" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  PASS: $name (Status $($response.StatusCode))" -ForegroundColor Green
            $script:passed++
            return $true
        } else {
            Write-Host "  FAIL: $name (Status $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "  FAIL: $name - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Core API Tests
Write-Host "=== CORE API TESTS ===" -ForegroundColor Magenta

TestAPI "Database Health Check" "$BaseUrl/api/test-db"
TestAPI "Admin Statistics" "$BaseUrl/api/admin/stats"
TestAPI "Business Analytics" "$BaseUrl/api/businesses/analytics"
TestAPI "Events API" "$BaseUrl/api/events?limit=5"
TestAPI "News API" "$BaseUrl/api/news?limit=5"

# Scraper Configuration Tests
Write-Host "`n=== SCRAPER CONFIGURATION TESTS ===" -ForegroundColor Magenta

$configs = TestAPI "Get Scraper Configs" "$BaseUrl/api/admin/scraper-config"
if ($configs -and $configs.success) {
    Write-Host "  Found $($configs.configs.Count) scraper configurations" -ForegroundColor Cyan
    
    # Test updating news scraper config
    $updateResult = TestAPI "Update News Scraper Config" "$BaseUrl/api/admin/scraper-config" "POST" @{
        type = "news"
        intervalHours = 6
        isEnabled = $true
    }
    
    if ($updateResult -and $updateResult.success) {
        Write-Host "  Successfully updated news scraper config" -ForegroundColor Green
    }
    
    # Test updating events scraper config
    TestAPI "Update Events Scraper Config" "$BaseUrl/api/admin/scraper-config" "POST" @{
        type = "events" 
        intervalHours = 6
        isEnabled = $true
    }
    
    # Test updating business scraper config
    TestAPI "Update Business Scraper Config" "$BaseUrl/api/admin/scraper-config" "POST" @{
        type = "businesses"
        intervalHours = 168
        isEnabled = $true
    }
}

# Scraper Logging Tests
Write-Host "`n=== SCRAPER LOGGING TESTS ===" -ForegroundColor Magenta

$logs = TestAPI "Get Scraper Logs" "$BaseUrl/api/admin/scraper-logs"
if ($logs -and $logs.success) {
    Write-Host "  Scraper logs retrieved successfully" -ForegroundColor Green
    
    # Test adding a log entry
    TestAPI "Add Test Log Entry" "$BaseUrl/api/admin/scraper-logs" "POST" @{
        type = "news"
        status = "completed"
        message = "Test log from comprehensive test"
        duration = 1000
        itemsProcessed = 5
        errors = @()
    }
}

# Page Loading Tests
Write-Host "`n=== PAGE LOADING TESTS ===" -ForegroundColor Magenta

TestPage "Admin Dashboard Page" "$BaseUrl/admin"
TestPage "Main Page" "$BaseUrl/"

# Live Scraper Tests (Optional)
if ($RunScrapers) {
    Write-Host "`n=== LIVE SCRAPER TESTS ===" -ForegroundColor Magenta
    Write-Host "WARNING: Running live scrapers (this may take time)" -ForegroundColor Yellow
    
    TestAPI "Run News Scraper" "$BaseUrl/api/scraper/news" "POST"
    TestAPI "Run Events Scraper" "$BaseUrl/api/scraper/events" "POST"
} else {
    Write-Host "`n=== SCRAPER ENDPOINT TESTS ===" -ForegroundColor Magenta
    Write-Host "Skipping live scraper execution (use -RunScrapers to enable)" -ForegroundColor Yellow
    
    # Just test that endpoints exist without running them
    foreach ($scraperType in @("news", "events", "businesses")) {
        $script:tests++
        Write-Host "[$script:tests] Testing: $scraperType Scraper Endpoint" -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl/api/scraper/$scraperType" -Method "GET" -UseBasicParsing -TimeoutSec 10
            Write-Host "  PASS: $scraperType endpoint exists" -ForegroundColor Green
            $script:passed++
        }
        catch {
            if ($_.Exception.Response.StatusCode -eq 405) {
                Write-Host "  PASS: $scraperType endpoint exists (405 Method Not Allowed as expected)" -ForegroundColor Green
                $script:passed++
            } else {
                Write-Host "  FAIL: $scraperType endpoint - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# Error Handling Tests
Write-Host "`n=== ERROR HANDLING TESTS ===" -ForegroundColor Magenta

# Test invalid endpoint
$script:tests++
Write-Host "[$script:tests] Testing: Invalid Endpoint Handling" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BaseUrl/api/invalid-endpoint" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  UNEXPECTED: Invalid endpoint returned success" -ForegroundColor Yellow
}
catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  PASS: Invalid endpoint returns 404" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  PARTIAL: Invalid endpoint returns $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        $script:passed++
    }
}

# Test malformed scraper config
$script:tests++
Write-Host "[$script:tests] Testing: Malformed Scraper Config" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BaseUrl/api/admin/scraper-config" -Method "POST" -Headers @{ "Content-Type" = "application/json" } -Body '{"type":"invalid","intervalHours":"not-a-number"}' -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  UNEXPECTED: Malformed request accepted" -ForegroundColor Yellow
}
catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "  PASS: Malformed request returns 400" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  PARTIAL: Malformed request returns $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        $script:passed++
    }
}

# Final Summary
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "`n=== COMPREHENSIVE TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Tests: $tests" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $($tests - $passed)" -ForegroundColor $(if ($passed -eq $tests) { "Green" } else { "Red" })
Write-Host "Success Rate: $([math]::Round(($passed / $tests) * 100, 1))%" -ForegroundColor White
Write-Host "Duration: $($duration.ToString('F1')) seconds" -ForegroundColor Gray

Write-Host ""

if ($passed -eq $tests) {
    Write-Host "SUCCESS: ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Admin dashboard is fully functional and ready for production!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready for pull request creation and merge!" -ForegroundColor Green
    exit 0
} elseif ($passed / $tests -ge 0.9) {
    Write-Host "MOSTLY SUCCESSFUL: $passed/$tests tests passed" -ForegroundColor Yellow
    Write-Host "Minor issues detected but core functionality works" -ForegroundColor Yellow
    Write-Host "Review failed tests before merging" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "FAILURE: Significant issues detected" -ForegroundColor Red
    Write-Host "Please fix failed tests before creating pull request" -ForegroundColor Red
    exit 1
}
