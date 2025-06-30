# LineLogic Database Setup

This guide will help you set up the Supabase database properly so that credits and analysis history persist between sessions.

## Quick Setup (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your LineLogic project

2. **Open SQL Editor**
   - In the sidebar, click "SQL Editor"
   - Click "New query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/20250630_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

4. **Verify Setup**
   - Check the "Table Editor" in your dashboard
   - You should see these new tables:
     - `user_profiles`
     - `analysis_results`
     - `injection_records`
     - `payment_receipts`
     - `credit_transactions`

## What This Does

### Database Schema
- **user_profiles**: Stores user info and credits
- **analysis_results**: Stores queue analysis history
- **injection_records**: Tracks injection services
- **payment_receipts**: Manual payment verification
- **credit_transactions**: Audit log for all credit changes

### Automatic Features
- ✅ **Auto-create profiles**: New users get 10 credits automatically
- ✅ **Persistent credits**: Credits survive page refreshes/logouts
- ✅ **Analysis history**: All analyses saved to database
- ✅ **Row Level Security**: Users can only see their own data
- ✅ **Credit tracking**: Full audit trail of credit usage

### User Experience
- Credits no longer reset to 10 on refresh
- Analysis history loads from database instead of localStorage
- Proper credit deduction with transaction logging
- Fallback to localStorage if database fails

## Manual Verification

After running the migration, test these features:

1. **Sign up a new account** → Should get 10 credits
2. **Run an analysis** → Credits should deduct to 5
3. **Refresh the page** → Credits should stay at 5 (not reset to 10)
4. **Check history** → Should show your previous analysis
5. **Logout and login** → Credits and history should persist

## Troubleshooting

### Credits still reset to 10
- Check if the migration ran successfully
- Verify `user_profiles` table exists
- Check browser console for database errors

### History not loading
- Verify `analysis_results` table exists
- Check if Row Level Security policies are active
- Look for errors in browser console

### Database timeouts
- Your Supabase project might be paused (free tier)
- Check your project status in the dashboard

## Advanced Setup (CLI)

If you prefer using the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply migrations
supabase db push
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active
3. Ensure your `.env.local` has correct credentials
4. Test with a fresh user account

The fallback system ensures the app works even if database setup fails, but you'll get the full experience with proper database integration.
