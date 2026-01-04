# Budget Planner Application

A full-stack budget planning application built with React (frontend) and FastAPI (backend).

## Quick Start

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed instructions on running the project locally.

### Quick Commands

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Create .env file with MONGO_URL, DB_NAME, CORS_ORIGINS
uvicorn server:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
# Create .env file with REACT_APP_BACKEND_URL=http://localhost:8000
npm start
```

## Documentation

- [Local Development Guide](./LOCAL_DEVELOPMENT.md) - How to run the project locally
- [Deployment Guide](./DEPLOYMENT.md) - How to deploy to Vercel
- [Architecture Analysis](./ANALYSIS.md) - Technical details and architecture

## Features

- Transaction management (income/expenses)
- Category management with budget limits
- Monthly and yearly analytics
- Budget tracking and status
- Dashboard with visualizations

## Tech Stack

- **Frontend**: React 18, TailwindCSS, Radix UI, Recharts
- **Backend**: FastAPI, MongoDB (Motor), Python
- **Deployment**: Vercel (serverless)
