#!/bin/bash

# Nexo - Pre-deployment Validation Script
# This script checks if the project is ready for Vercel deployment

echo "🔍 Validating Nexo project for Vercel deployment..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
echo "📋 Checking environment configuration..."
if [ -f .env.local ]; then
    echo -e "${GREEN}✓${NC} .env.local found"
    
    # Check if required variables are set
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${GREEN}✓${NC} Required environment variables present"
    else
        echo -e "${YELLOW}⚠${NC}  Some environment variables may be missing"
    fi
else
    echo -e "${YELLOW}⚠${NC}  .env.local not found (optional for local dev)"
    echo "   Create it using: cp .env.local.example .env.local"
fi
echo ""

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules found"
else
    echo -e "${YELLOW}⚠${NC}  node_modules not found"
    echo "   Installing dependencies..."
    npm install
fi
echo ""

# Run TypeScript check
echo "🔧 Running TypeScript check..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✓${NC} TypeScript check passed"
else
    echo -e "${RED}✗${NC} TypeScript errors found"
    echo "   Fix errors before deploying"
    exit 1
fi
echo ""

# Run ESLint
echo "🧹 Running ESLint..."
if npm run lint; then
    echo -e "${GREEN}✓${NC} ESLint check passed"
else
    echo -e "${YELLOW}⚠${NC}  ESLint warnings found (not blocking)"
fi
echo ""

# Try to build
echo "🏗️  Running production build..."
if npm run build; then
    echo -e "${GREEN}✓${NC} Production build successful"
    echo ""
    echo -e "${GREEN}✅ Project is ready for Vercel deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push your code to GitHub/GitLab/Bitbucket"
    echo "2. Go to https://vercel.com/new"
    echo "3. Import your repository"
    echo "4. Add environment variables:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "5. Deploy!"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo -e "${RED}✗${NC} Production build failed"
    echo "   Fix build errors before deploying"
    exit 1
fi
