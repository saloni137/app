from mangum import Mangum
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

# Set up environment variables if not already set (Vercel sets these)
# For local .env file, dotenv will handle it in server.py
if not os.environ.get('MONGO_URL'):
    from dotenv import load_dotenv
    load_dotenv(backend_dir / '.env')

# Import the FastAPI app from server.py (after path is set)
from server import app

# Create the handler for Vercel serverless functions
# Using lifespan="auto" to support FastAPI lifespan events if available
handler = Mangum(app, lifespan="auto")

