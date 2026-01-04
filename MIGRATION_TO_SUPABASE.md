# Migration Guide: MongoDB to Supabase (PostgreSQL)

## Why Supabase?

- ✅ **Free tier** - Perfect for personal projects (500MB database, 2GB bandwidth/month)
- ✅ **Multi-device sync** - Your data is in the cloud, accessible from any device
- ✅ **PostgreSQL** - Reliable SQL database (easier to work with than MongoDB for this use case)
- ✅ **Easy setup** - Simple connection string, no complex configuration
- ✅ **Works with Vercel** - Free deployment compatible

## Setup Steps

### 1. Create Supabase Account and Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free account)
3. Click "New Project"
4. Choose organization (or create one)
5. Fill in:
   - **Name**: `budget-planner` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
6. Click "Create new project" (takes 1-2 minutes)

### 2. Get Your Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Copy the **URI** connection string (not the Pooling one)
4. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
5. Replace `[YOUR-PASSWORD]` with the password you set during project creation

### 3. Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Run the SQL script from `backend/supabase_schema.sql` (will be created)
3. This creates the `categories` and `transactions` tables

### 4. Update Environment Variables

Update your `backend/.env` file:

```env
# Remove MongoDB variables, add Supabase:
SUPABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
DB_NAME=postgres

# Keep CORS_ORIGINS for local development
CORS_ORIGINS=http://localhost:3000
```

For Vercel deployment, add `SUPABASE_URL` in Vercel environment variables.

## Migration Complete!

Your app will now:
- Store data in Supabase (free cloud PostgreSQL)
- Sync across all your devices automatically
- Work with the same API endpoints (no frontend changes needed)

## Free Tier Limits

Supabase free tier includes:
- 500MB database storage
- 2GB bandwidth/month
- Unlimited API requests
- Perfect for personal budget tracking!

## Backup

Supabase free tier includes daily backups. You can also export your data anytime from the dashboard.

