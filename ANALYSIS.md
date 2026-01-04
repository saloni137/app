# Repository Analysis: Monorepo Setup for Vercel Deployment

## Current Structure

This repository contains:

1. **Backend** (`/backend`): FastAPI application with MongoDB
   - Python-based REST API
   - Routes prefixed with `/api`
   - Uses MongoDB via Motor (async driver)
   - Has startup/shutdown events for database initialization

2. **Frontend** (`/frontend`): React application
   - Built with Create React App (CRA) and craco
   - Uses React Router for client-side routing
   - Communicates with backend via axios
   - Uses environment variable `REACT_APP_BACKEND_URL` for API URL

## Changes Made for Monorepo Deployment

### 1. Vercel Configuration (`vercel.json`)

Created a root-level `vercel.json` that:
- Builds the frontend React app
- Serves static files from `frontend/build`
- Automatically routes `/api/*` requests to Python serverless functions in `/api` directory
- Routes all other requests to `index.html` for React Router

### 2. Serverless Function Wrapper (`/api/index.py`)

Created a serverless function handler that:
- Wraps the FastAPI app with Mangum adapter (required for serverless)
- Handles path resolution to import the backend code
- Manages environment variables
- Exports a `handler` function that Vercel can invoke

### 3. API Requirements (`/api/requirements.txt`)

Created a requirements file specifically for the serverless function that includes:
- All backend dependencies
- Mangum adapter for ASGI-to-serverless conversion

### 4. Frontend API Configuration Update

Modified `frontend/src/lib/api.js` to:
- Use relative URLs (`/api`) in production (when `REACT_APP_BACKEND_URL` is not set)
- Fall back to environment variable for local development
- This allows the same codebase to work in both development and production

### 5. Backend Dependencies

Added `mangum>=0.17.0` to `backend/requirements.txt` for serverless compatibility.

## How It Works

### Deployment Flow

1. **Build Phase**:
   - Vercel runs `cd frontend && npm install && npm run build`
   - React app is built and output to `frontend/build`
   - Python dependencies are installed for serverless functions

2. **Request Routing**:
   - Requests to `/api/*` → Handled by `api/index.py` serverless function
   - Requests to `/*` → Served from `frontend/build/index.html` (React Router handles routing)

3. **Runtime**:
   - Frontend: Static files served by Vercel's CDN
   - Backend: Serverless functions invoked on-demand (cold starts possible)

### Path Handling

- FastAPI routes are defined with `/api` prefix (e.g., `/api/categories`)
- Vercel automatically routes `/api/*` to the serverless function
- The full path (including `/api`) is passed to FastAPI, which matches correctly

### Environment Variables

**Required in Vercel:**
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `CORS_ORIGINS`: Allowed origins (optional, defaults to `*`)

**Optional:**
- `REACT_APP_BACKEND_URL`: Leave unset for production (uses relative URLs)

## Important Considerations

### Serverless Limitations

1. **Startup Events**: FastAPI startup events (like default category initialization) may not run reliably in serverless environment. Consider making initialization lazy.

2. **Cold Starts**: First request after inactivity may be slower due to cold start.

3. **Connection Pooling**: MongoDB connections are reused across invocations within the same container, but connections may be closed between cold starts.

4. **State**: No persistent state between function invocations.

### Database Connections

- Motor (async MongoDB driver) works well in serverless
- Connections are pooled and reused
- Consider connection timeout settings for long idle periods

### CORS Configuration

- Backend CORS middleware is configured to allow all origins by default
- Set `CORS_ORIGINS` environment variable to restrict in production
- When using relative URLs, CORS is typically not an issue for same-origin requests

## Deployment Steps

1. **Set Environment Variables in Vercel**:
   - Go to project settings → Environment Variables
   - Add: `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`

2. **Deploy**:
   ```bash
   vercel
   # or
   vercel --prod
   ```

3. **Verify**:
   - Frontend should load at root URL
   - API should respond at `/api/*` endpoints
   - Check Vercel function logs for any errors

## Local Development

The setup maintains compatibility with local development:

- Backend can still run with `uvicorn server:app --reload`
- Frontend can still run with `npm start`
- Set `REACT_APP_BACKEND_URL=http://localhost:8000` for local development

## File Structure After Changes

```
/
├── api/                          # NEW: Vercel serverless functions
│   ├── index.py                  # Serverless function handler
│   └── requirements.txt          # Python dependencies for serverless
├── backend/                      # Existing: FastAPI backend
│   ├── server.py
│   └── requirements.txt          # Updated: Added mangum
├── frontend/                     # Existing: React frontend
│   ├── src/
│   │   └── lib/
│   │       └── api.js            # Updated: Relative URL support
│   └── package.json
├── vercel.json                   # NEW: Vercel configuration
├── DEPLOYMENT.md                 # NEW: Deployment guide
└── ANALYSIS.md                   # This file
```

## Next Steps

1. **Test Deployment**: Deploy to Vercel and verify all endpoints work
2. **Environment Setup**: Configure MongoDB and environment variables
3. **Monitoring**: Set up error tracking and monitoring for serverless functions
4. **Optimization**: Consider caching strategies for frequently accessed data
5. **Initialization**: If startup events are critical, consider moving initialization to a separate endpoint or lazy initialization

