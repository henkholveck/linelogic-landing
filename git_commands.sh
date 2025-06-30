#!/bin/bash

# Navigate to the project directory
cd /Users/henkster/Downloads/linelogic-landing

# Add all changes
git add .

# Commit with descriptive message
git commit -m "CRITICAL FIX: Resolve credit duplication and authentication bugs

- Remove localStorage fake authentication system that caused infinite credits
- Fix infinite credits on page refresh by using database as single source of truth
- Implement proper database-only credit management with async/await
- Fix email verification credit allocation (10 credits only after verification)
- Remove conflicting database triggers that caused race conditions
- Add proper debugging logs for credit tracking and auth state changes
- Improve authentication state management and session persistence
- Add payment confirmation modal system for receipts/transaction IDs
- Fix login page redirect to proper Supabase auth flow
- Add crypto payment options (Bitcoin & Ethereum) with address copying
- Update payment receipt system for manual staff verification
- Secure credit system: credits can only be added manually by staff

This fixes the critical security vulnerability where users could get unlimited credits."

# Push to GitHub
git push origin master

echo "✅ Successfully pushed critical credit system fixes to GitHub!"