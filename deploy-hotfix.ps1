# Hotfix Deployment Script for All Things Wetaskiwin
# This script deploys the development banner and disabled business claiming feature

Write-Host "🚀 All Things Wetaskiwin - Hotfix Deployment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Not in the correct directory. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if we have uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Warning: You have uncommitted changes. These will be included in the deployment." -ForegroundColor Yellow
    Write-Host "Files to be committed:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $response = Read-Host "Continue with deployment? (y/n)"
    if ($response -notmatch "^[Yy]$") {
        Write-Host "❌ Deployment cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📋 Deployment Changes:" -ForegroundColor Cyan
Write-Host "- Enhanced development banner (red, more prominent)" -ForegroundColor White
Write-Host "- Disabled business claiming feature temporarily" -ForegroundColor White
Write-Host "- Updated modal messaging" -ForegroundColor White
Write-Host ""

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Commit changes
Write-Host "📝 Committing changes..." -ForegroundColor Cyan
git add .
git commit -m "hotfix: disable business claiming and enhance dev banner

- Updated DevelopmentBanner to be more prominent (red background)
- Disabled business claiming feature temporarily
- Updated ComingSoonModal with new messaging
- Fixed email template syntax issues"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed!" -ForegroundColor Green
Write-Host ""

# Push to main branch
Write-Host "🚀 Pushing to production..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pushed to production!" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Hotfix Deployment Complete!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Development banner is now more prominent" -ForegroundColor Green
Write-Host "✅ Business claiming feature is disabled" -ForegroundColor Green
Write-Host "✅ Users will be directed to email wilfordderek@gmail.com" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Monitor Vercel dashboard for successful deployment" -ForegroundColor White
Write-Host "2. Test the live site to verify changes" -ForegroundColor White
Write-Host "3. Check that the development banner appears on all pages" -ForegroundColor White
Write-Host "4. Verify business claiming shows the 'temporarily disabled' modal" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "- Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Blue
Write-Host "- Production Site: https://allthingswetaskiwin.com (or your domain)" -ForegroundColor Blue
Write-Host ""
Write-Host "📧 Contact: wilfordderek@gmail.com for any deployment issues" -ForegroundColor Yellow
