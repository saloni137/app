# Quick Migration Steps: MongoDB to Supabase

## Step 1: Create Supabase Account (5 minutes)

1. Go to https://supabase.com and sign up (free)
2. Create a new project
3. Save your database password
4. Wait for project to be ready (~1-2 minutes)

## Step 2: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/supabase_schema.sql`
3. Paste and run it (this creates tables and inserts default categories)

## Step 3: Get Connection String

1. Go to **Settings** → **Database**
2. Under **Connection string**, copy the **URI** format
3. It looks like: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
4. Or use the direct connection: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## Step 4: Update Backend Code

1. **Replace the server file:**
   ```bash
   cd backend
   mv server.py server_mongodb_backup.py  # Backup old file
   mv server_postgresql.py server.py      # Use new PostgreSQL version
   ```

2. **Update `.env` file:**
   ```env
   # Remove these:
   # MONGO_URL=...
   # DB_NAME=...
   
   # Add this:
   SUPABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. **Update dependencies:**
   ```bash
   pip install asyncpg
   pip uninstall motor pymongo  # Remove MongoDB packages
   ```

## Step 5: Test Locally

```bash
cd backend
uvicorn server:app --reload --port 8000
```

Visit http://localhost:8000/docs to test the API.

## Step 6: Update Vercel Deployment

1. In Vercel dashboard, go to your project settings
2. Add environment variable:
   - **Name**: `SUPABASE_URL`
   - **Value**: Your Supabase connection string (same as step 3)

3. Redeploy (or push to git to trigger auto-deploy)

## Done! ✅

Your app now uses Supabase (free PostgreSQL) instead of MongoDB!

### Benefits:
- ✅ Free tier (500MB storage, 2GB bandwidth/month)
- ✅ Multi-device sync (data in cloud)
- ✅ No MongoDB Atlas needed
- ✅ Same API endpoints (frontend unchanged)

### Need Help?
- Supabase Docs: https://supabase.com/docs
- Check `MIGRATION_TO_SUPABASE.md` for detailed guide

