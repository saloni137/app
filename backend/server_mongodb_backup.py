from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

# Models
class CategoryBase(BaseModel):
    name: str
    type: TransactionType
    budget_limit: float = 0.0
    color: str = "#3D405B"

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    budget_limit: Optional[float] = None
    color: Optional[str] = None

class TransactionBase(BaseModel):
    type: TransactionType
    amount: float
    category_id: str
    description: str = ""
    date: str  # ISO format date string

class Transaction(TransactionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: Optional[TransactionType] = None
    amount: Optional[float] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None

class MonthlySummary(BaseModel):
    total_income: float
    total_expenses: float
    balance: float
    category_breakdown: List[dict]

# Default categories
DEFAULT_CATEGORIES = [
    {"name": "Salary", "type": "income", "budget_limit": 0, "color": "#2E5C42"},
    {"name": "Freelance", "type": "income", "budget_limit": 0, "color": "#8FB339"},
    {"name": "Other Income", "type": "income", "budget_limit": 0, "color": "#5C8A4E"},
    {"name": "Food & Dining", "type": "expense", "budget_limit": 500, "color": "#E07A5F"},
    {"name": "Rent", "type": "expense", "budget_limit": 1500, "color": "#3D405B"},
    {"name": "Utilities", "type": "expense", "budget_limit": 200, "color": "#81B29A"},
    {"name": "Transportation", "type": "expense", "budget_limit": 300, "color": "#F2CC8F"},
    {"name": "Entertainment", "type": "expense", "budget_limit": 200, "color": "#6D597A"},
    {"name": "Shopping", "type": "expense", "budget_limit": 300, "color": "#B56576"},
    {"name": "Healthcare", "type": "expense", "budget_limit": 150, "color": "#355070"},
    {"name": "Other Expenses", "type": "expense", "budget_limit": 200, "color": "#EAAC8B"},
]

# Initialize default categories
@app.on_event("startup")
async def init_default_categories():
    count = await db.categories.count_documents({})
    if count == 0:
        for cat in DEFAULT_CATEGORIES:
            category = Category(**cat)
            await db.categories.insert_one(category.model_dump())
        logging.info("Default categories initialized")

# Health check
@api_router.get("/")
async def root():
    return {"message": "Budget Planner API"}

# Category endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate):
    category = Category(**category_data.model_dump())
    await db.categories.insert_one(category.model_dump())
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryUpdate):
    update_dict = {k: v for k, v in category_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.categories.find_one_and_update(
        {"id": category_id},
        {"$set": update_dict},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    
    result.pop("_id", None)
    return result

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    # Check if category has transactions
    tx_count = await db.transactions.count_documents({"category_id": category_id})
    if tx_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with existing transactions")
    
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# Transaction endpoints
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    month: Optional[int] = None,
    year: Optional[int] = None,
    type: Optional[TransactionType] = None,
    category_id: Optional[str] = None
):
    query = {}
    
    if month and year:
        # Filter by month/year
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        query["date"] = {"$gte": start_date, "$lt": end_date}
    
    if type:
        query["type"] = type.value
    
    if category_id:
        query["category_id"] = category_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return transactions

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(tx_data: TransactionCreate):
    # Verify category exists
    category = await db.categories.find_one({"id": tx_data.category_id})
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    transaction = Transaction(**tx_data.model_dump())
    await db.transactions.insert_one(transaction.model_dump())
    return transaction

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, tx_data: TransactionUpdate):
    update_dict = {k: v for k, v in tx_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    if "category_id" in update_dict:
        category = await db.categories.find_one({"id": update_dict["category_id"]})
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
    
    result = await db.transactions.find_one_and_update(
        {"id": transaction_id},
        {"$set": update_dict},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    result.pop("_id", None)
    return result

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}

# Summary endpoints
@api_router.get("/summary/monthly")
async def get_monthly_summary(month: int, year: int):
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    # Get all transactions for the month
    transactions = await db.transactions.find(
        {"date": {"$gte": start_date, "$lt": end_date}},
        {"_id": 0}
    ).to_list(1000)
    
    # Get all categories
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    cat_map = {c["id"]: c for c in categories}
    
    total_income = 0.0
    total_expenses = 0.0
    category_totals = {}
    
    for tx in transactions:
        if tx["type"] == "income":
            total_income += tx["amount"]
        else:
            total_expenses += tx["amount"]
        
        cat_id = tx["category_id"]
        if cat_id not in category_totals:
            category_totals[cat_id] = 0.0
        category_totals[cat_id] += tx["amount"]
    
    category_breakdown = []
    for cat_id, total in category_totals.items():
        cat = cat_map.get(cat_id, {})
        category_breakdown.append({
            "category_id": cat_id,
            "category_name": cat.get("name", "Unknown"),
            "type": cat.get("type", "expense"),
            "total": total,
            "budget_limit": cat.get("budget_limit", 0),
            "color": cat.get("color", "#3D405B")
        })
    
    return {
        "month": month,
        "year": year,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": total_income - total_expenses,
        "category_breakdown": category_breakdown
    }

@api_router.get("/summary/yearly")
async def get_yearly_summary(year: int):
    monthly_data = []
    
    for month in range(1, 13):
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        
        pipeline = [
            {"$match": {"date": {"$gte": start_date, "$lt": end_date}}},
            {"$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }}
        ]
        
        results = await db.transactions.aggregate(pipeline).to_list(10)
        
        income = 0.0
        expenses = 0.0
        for r in results:
            if r["_id"] == "income":
                income = r["total"]
            else:
                expenses = r["total"]
        
        monthly_data.append({
            "month": month,
            "income": income,
            "expenses": expenses,
            "balance": income - expenses
        })
    
    return {
        "year": year,
        "monthly_data": monthly_data,
        "total_income": sum(m["income"] for m in monthly_data),
        "total_expenses": sum(m["expenses"] for m in monthly_data)
    }

@api_router.get("/summary/budget-status")
async def get_budget_status(month: int, year: int):
    """Get budget status for each expense category"""
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    # Get expense categories
    categories = await db.categories.find({"type": "expense"}, {"_id": 0}).to_list(100)
    
    # Get spending by category
    pipeline = [
        {"$match": {"date": {"$gte": start_date, "$lt": end_date}, "type": "expense"}},
        {"$group": {
            "_id": "$category_id",
            "spent": {"$sum": "$amount"}
        }}
    ]
    spending = await db.transactions.aggregate(pipeline).to_list(100)
    spending_map = {s["_id"]: s["spent"] for s in spending}
    
    budget_status = []
    for cat in categories:
        spent = spending_map.get(cat["id"], 0)
        budget_limit = cat.get("budget_limit", 0)
        percentage = (spent / budget_limit * 100) if budget_limit > 0 else 0
        
        budget_status.append({
            "category_id": cat["id"],
            "category_name": cat["name"],
            "budget_limit": budget_limit,
            "spent": spent,
            "remaining": max(0, budget_limit - spent),
            "percentage": min(percentage, 100),
            "over_budget": spent > budget_limit if budget_limit > 0 else False,
            "color": cat.get("color", "#3D405B")
        })
    
    return budget_status

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
