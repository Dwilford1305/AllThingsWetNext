#!/bin/bash

# Hotfix Deployment Script for All Things Wetaskiwin
# This script deploys the development banner and disabled business claiming feature

echo "🚀 All Things Wetaskiwin - Hotfix Deployment"
echo "============================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct directory. Please run this script from the project root."
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. These will be included in the deployment."
    echo "Files to be committed:"
    git status --short
    echo ""
    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

echo "📋 Deployment Changes:"
echo "- Enhanced development banner (red, more prominent)"
echo "- Disabled business claiming feature temporarily"
echo "- Updated modal messaging"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Commit changes
echo "📝 Committing changes..."
git add .
git commit -m "hotfix: disable business claiming and enhance dev banner

- Updated DevelopmentBanner to be more prominent (red background)
- Disabled business claiming feature temporarily
- Updated ComingSoonModal with new messaging
- Fixed email template syntax issues"

if [ $? -ne 0 ]; then
    echo "❌ Git commit failed!"
    exit 1
fi

echo "✅ Changes committed!"
echo ""

# Push to main branch
echo "🚀 Pushing to production..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed!"
    exit 1
fi

echo "✅ Pushed to production!"
echo ""

echo "🎉 Hotfix Deployment Complete!"
echo "=============================="
echo ""
echo "✅ Development banner is now more prominent"
echo "✅ Business claiming feature is disabled"
echo "✅ Users will be directed to email wilfordderek@gmail.com"
echo ""
echo "📍 Next Steps:"
echo "1. Monitor Vercel dashboard for successful deployment"
echo "2. Test the live site to verify changes"
echo "3. Check that the development banner appears on all pages"
echo "4. Verify business claiming shows the 'temporarily disabled' modal"
echo ""
echo "🔗 Useful Links:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Production Site: https://allthingswetaskiwin.com (or your domain)"
echo ""
echo "📧 Contact: wilfordderek@gmail.com for any deployment issues"
