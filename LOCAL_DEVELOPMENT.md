# Local Development Guide

This guide explains how to run the project locally for development.

## Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 16+ and npm/yarn** (for frontend)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** (to clone the repository)

## Quick Start

1. **Set up environment variables**
2. **Start the backend server**
3. **Start the frontend development server**

## Step-by-Step Setup

### 1. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note:** It's recommended to use a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

Add the following environment variables to `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=budget_planner
CORS_ORIGINS=http://localhost:3000
```

**For MongoDB Atlas (cloud):**
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=budget_planner
CORS_ORIGINS=http://localhost:3000
```

#### Start the Backend Server

```bash
cd backend
uvicorn server:app --reload --port 8000
```

The backend will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (FastAPI automatic documentation)
- **Health Check**: http://localhost:8000/api/

The `--reload` flag enables auto-reload on code changes.

### 2. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

**Note:** If you're using Yarn (as indicated by packageManager in package.json):

```bash
cd frontend
yarn install
```

#### Configure Environment Variables (Optional)

Create a `.env` file in the `frontend/` directory for local development:

```bash
cd frontend
touch .env
```

Add the following to `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Note:** If `REACT_APP_BACKEND_URL` is not set, the frontend will try to use relative URLs (`/api`), which won't work for local development with separate servers.

#### Start the Frontend Development Server

```bash
cd frontend
npm start
```

Or with Yarn:

```bash
cd frontend
yarn start
```

The frontend will:
- Start on http://localhost:3000
- Automatically open in your browser
- Hot-reload when you make changes

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **API Documentation**: http://localhost:8000/docs

## Running Both Services

You'll need **two terminal windows/tabs**:

**Terminal 1 - Backend:**
```bash
cd backend
# Activate virtual environment if using one
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

uvicorn server:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# or
yarn start
```

## MongoDB Setup

### Option 1: Local MongoDB

1. **Install MongoDB** (if not already installed):
   - macOS: `brew install mongodb-community`
   - Linux: Follow [MongoDB installation guide](https://www.mongodb.com/docs/manual/installation/)
   - Windows: Download from [MongoDB website](https://www.mongodb.com/try/download/community)

2. **Start MongoDB service**:
   ```bash
   # macOS (with Homebrew):
   brew services start mongodb-community
   
   # Linux:
   sudo systemctl start mongod
   
   # Windows:
   # MongoDB runs as a service, start from Services panel
   ```

3. **Connection string**: `mongodb://localhost:27017`

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string and update `MONGO_URL` in `backend/.env`

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Use a different port
uvicorn server:app --reload --port 8001
```
Then update `REACT_APP_BACKEND_URL=http://localhost:8001` in frontend `.env`

**MongoDB connection error:**
- Verify MongoDB is running (local) or connection string is correct (Atlas)
- Check that `MONGO_URL` and `DB_NAME` are set correctly in `backend/.env`
- For Atlas, ensure your IP is whitelisted

**Module not found errors:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Issues

**Port 3000 already in use:**
- The React dev server will prompt you to use a different port
- Or specify a port: `PORT=3001 npm start`

**API connection errors:**
- Verify backend is running on the correct port
- Check `REACT_APP_BACKEND_URL` in `frontend/.env`
- Check browser console for CORS errors (ensure backend CORS_ORIGINS includes frontend URL)

**npm/yarn install errors:**
- Delete `node_modules` and lock file, then reinstall:
  ```bash
  rm -rf node_modules package-lock.json yarn.lock
  npm install
  ```

**Build errors:**
- Clear cache and reinstall:
  ```bash
  npm cache clean --force
  rm -rf node_modules
  npm install
  ```

## Development Tips

1. **Backend auto-reload**: The `--reload` flag automatically restarts the server on code changes
2. **Frontend hot-reload**: Changes to React components automatically refresh in the browser
3. **API Documentation**: Visit http://localhost:8000/docs to explore and test API endpoints
4. **Environment variables**: Always restart the server after changing `.env` files
5. **Database**: Default categories are automatically created on first startup if the database is empty

## Project Structure

```
/
├── backend/              # FastAPI backend
│   ├── server.py        # Main application file
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables (create this)
├── frontend/            # React frontend
│   ├── src/            # Source code
│   ├── public/         # Static files
│   ├── package.json    # Node dependencies
│   └── .env           # Environment variables (create this)
└── api/                # Vercel serverless functions (for deployment only)
```

## Next Steps

- Check the API documentation at http://localhost:8000/docs
- Explore the codebase structure
- Make your changes and see them hot-reload
- Refer to `DEPLOYMENT.md` when ready to deploy to Vercel

