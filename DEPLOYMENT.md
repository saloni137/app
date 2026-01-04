# Monorepo Deployment Guide for Vercel

This guide explains how to deploy this monorepo to Vercel as a single application accessible at the root path.

## Repository Structure

```
/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── api/              # Vercel serverless function wrapper
└── vercel.json       # Vercel configuration
```

## Architecture Overview

- **Frontend**: React app built with Create React App (CRA) and served as static files
- **Backend**: FastAPI application wrapped with Mangum adapter for Vercel serverless functions
- **Routing**: All `/api/*` requests go to the serverless function, everything else serves the React app

## Prerequisites

1. Vercel account
2. MongoDB database (MongoDB Atlas or similar)
3. Environment variables configured in Vercel

## Setup Instructions

### 1. Environment Variables

Configure these environment variables in your Vercel project settings:

**Backend Variables:**
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: MongoDB database name
- `CORS_ORIGINS`: Comma-separated list of allowed origins (or `*` for all)

**Frontend Variables (Optional for production):**
- `REACT_APP_BACKEND_URL`: Leave empty or unset for production (uses relative URLs)
  - Only set this for local development or if backend is on a different domain

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the root directory
vercel

# For production deployment
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add environment variables in the project settings
6. Deploy

### 3. How It Works

#### Routing

- Requests to `/api/*` are handled by the serverless function at `api/index.py`
- All other requests serve the React app's `index.html` (for client-side routing)
- Static assets are served from the `frontend/build` directory

#### Build Process

1. Vercel builds the frontend: `cd frontend && npm install && npm run build`
2. Output is placed in `frontend/build`
3. Python serverless function is deployed from `api/index.py`
4. Dependencies are installed from `api/requirements.txt` (which references `backend/requirements.txt`)

## Configuration Files

### `vercel.json`

This file configures:
- Build command for the frontend
- Output directory for static files
- Serverless function configuration
- URL rewriting rules

### `api/index.py`

This is the entry point for all `/api/*` requests. It:
- Imports the FastAPI app from `backend/server.py`
- Wraps it with Mangum adapter for serverless compatibility
- Handles environment variable loading

### `api/requirements.txt`

References the backend requirements to ensure all dependencies are available in the serverless function.

## Local Development

For local development, you can still run frontend and backend separately:

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

Set `REACT_APP_BACKEND_URL=http://localhost:8000` in `frontend/.env` for local development.

## Troubleshooting

### API Routes Return 404

- Ensure `vercel.json` rewrites are correct
- Check that `api/index.py` exists and exports `handler`
- Verify Python runtime version in `vercel.json` functions config

### Database Connection Issues

- Verify `MONGO_URL` is set correctly in Vercel environment variables
- Check MongoDB connection string includes authentication
- Ensure MongoDB allows connections from Vercel's IP ranges (or use 0.0.0.0/0 for MongoDB Atlas)

### Frontend Can't Reach API

- In production, ensure `REACT_APP_BACKEND_URL` is not set (uses relative URLs)
- Check browser console for CORS errors
- Verify `CORS_ORIGINS` environment variable includes your domain

### Build Failures

- Check that all dependencies in `backend/requirements.txt` are compatible with Python 3.9
- Ensure `frontend/package.json` has all required dependencies
- Review build logs in Vercel dashboard for specific errors

## Notes

- The FastAPI startup event (default categories initialization) may not run in serverless environment
- Consider making initialization lazy (on first request) if needed
- MongoDB connections are pooled and reused across function invocations
- Serverless functions have a cold start time on first invocation after inactivity

