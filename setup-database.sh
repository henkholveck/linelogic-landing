#!/bin/bash

echo "🚀 Setting up LineLogic database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found. Please create it with your Supabase credentials:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    exit 1
fi

# Initialize Supabase if not already done
if [ ! -f supabase/config.toml ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
fi

# Link to remote project (requires project ID)
echo "🔗 To link to your remote Supabase project, run:"
echo "supabase link --project-ref YOUR_PROJECT_ID"
echo ""

# Apply migrations
echo "📁 Applying database migrations..."
echo "Run this command to apply the migrations to your Supabase project:"
echo "supabase db push"
echo ""

# Instructions for manual setup
echo "🎯 Manual Setup Instructions:"
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "2. Open the SQL Editor"
echo "3. Copy and paste the contents of: supabase/migrations/20250630_initial_schema.sql"
echo "4. Run the SQL to create all tables and triggers"
echo ""
echo "✅ Database setup complete!"
echo "Your LineLogic app should now properly persist credits and analysis history."
