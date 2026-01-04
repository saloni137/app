from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import asyncpg
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# PostgreSQL connection
SUPABASE_URL = os.environ.get('SUPABASE_URL') or os.environ.get('DATABASE_URL')
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL or DATABASE_URL environment variable is required")

# Connection pool (will be initialized on startup)
pool: Optional[asyncpg.Pool] = None

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
    id: str
    created_at: str

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
    id: str
    created_at: str

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

# Initialize database connection pool
@app.on_event("startup")
async def startup_db():
    global pool
    try:
        pool = await asyncpg.create_pool(SUPABASE_URL, min_size=1, max_size=10)
        logging.info("Database connection pool created")
    except Exception as e:
        logging.error(f"Failed to create database pool: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db():
    global pool
    if pool:
        await pool.close()
        logging.info("Database connection pool closed")

# Helper function to get database connection
async def get_db():
    if pool is None:
        raise RuntimeError("Database pool not initialized")
    return pool

# Health check
@api_router.get("/")
async def root():
    return {"message": "Budget Planner API"}

# Category endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT id::text, name, type, budget_limit, color, created_at FROM categories ORDER BY name")
        return [
            Category(
                id=str(row["id"]),
                name=row["name"],
                type=row["type"],
                budget_limit=float(row["budget_limit"]),
                color=row["color"],
                created_at=row["created_at"].isoformat() if row["created_at"] else datetime.now(timezone.utc).isoformat()
            )
            for row in rows
        ]

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate):
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO categories (name, type, budget_limit, color) VALUES ($1, $2, $3, $4) RETURNING id::text, name, type, budget_limit, color, created_at",
            category_data.name, category_data.type.value, category_data.budget_limit, category_data.color
        )
        return Category(
            id=row["id"],
            name=row["name"],
            type=row["type"],
            budget_limit=float(row["budget_limit"]),
            color=row["color"],
            created_at=row["created_at"].isoformat()
        )

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryUpdate):
    db_pool = await get_db()
    update_fields = []
    values = []
    param_num = 1
    
    if category_data.name is not None:
        update_fields.append(f"name = ${param_num}")
        values.append(category_data.name)
        param_num += 1
    if category_data.budget_limit is not None:
        update_fields.append(f"budget_limit = ${param_num}")
        values.append(category_data.budget_limit)
        param_num += 1
    if category_data.color is not None:
        update_fields.append(f"color = ${param_num}")
        values.append(category_data.color)
        param_num += 1
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    values.append(category_id)
    query = f"UPDATE categories SET {', '.join(update_fields)} WHERE id::text = ${param_num} RETURNING id::text, name, type, budget_limit, color, created_at"
    
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="Category not found")
        return Category(
            id=row["id"],
            name=row["name"],
            type=row["type"],
            budget_limit=float(row["budget_limit"]),
            color=row["color"],
            created_at=row["created_at"].isoformat()
        )

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        # Check if category has transactions
        tx_count = await conn.fetchval(
            "SELECT COUNT(*) FROM transactions WHERE category_id::text = $1",
            category_id
        )
        if tx_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete category with existing transactions")
        
        result = await conn.execute(
            "DELETE FROM categories WHERE id::text = $1",
            category_id
        )
        if result == "DELETE 0":
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
    db_pool = await get_db()
    query_parts = ["SELECT id::text, type, amount, category_id::text, description, date, created_at FROM transactions WHERE 1=1"]
    params = []
    param_num = 1
    
    if month and year:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        query_parts.append(f"AND date >= ${param_num} AND date < ${param_num + 1}")
        params.extend([start_date, end_date])
        param_num += 2
    
    if type:
        query_parts.append(f"AND type = ${param_num}")
        params.append(type.value)
        param_num += 1
    
    if category_id:
        query_parts.append(f"AND category_id::text = ${param_num}")
        params.append(category_id)
        param_num += 1
    
    query_parts.append("ORDER BY date DESC LIMIT 1000")
    query = " ".join(query_parts)
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        return [
            Transaction(
                id=str(row["id"]),
                type=row["type"],
                amount=float(row["amount"]),
                category_id=str(row["category_id"]),
                description=row["description"] or "",
                date=str(row["date"]),
                created_at=row["created_at"].isoformat() if row["created_at"] else datetime.now(timezone.utc).isoformat()
            )
            for row in rows
        ]

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(tx_data: TransactionCreate):
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        # Verify category exists
        category = await conn.fetchrow(
            "SELECT id FROM categories WHERE id::text = $1",
            tx_data.category_id
        )
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
        
        row = await conn.fetchrow(
            "INSERT INTO transactions (type, amount, category_id, description, date) VALUES ($1, $2, $3::uuid, $4, $5) RETURNING id::text, type, amount, category_id::text, description, date, created_at",
            tx_data.type.value, tx_data.amount, tx_data.category_id, tx_data.description, tx_data.date
        )
        return Transaction(
            id=row["id"],
            type=row["type"],
            amount=float(row["amount"]),
            category_id=row["category_id"],
            description=row["description"] or "",
            date=str(row["date"]),
            created_at=row["created_at"].isoformat()
        )

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, tx_data: TransactionUpdate):
    db_pool = await get_db()
    update_fields = []
    values = []
    param_num = 1
    
    async with db_pool.acquire() as conn:
        if tx_data.category_id is not None:
            # Verify category exists
            category = await conn.fetchrow(
                "SELECT id FROM categories WHERE id::text = $1",
                tx_data.category_id
            )
            if not category:
                raise HTTPException(status_code=400, detail="Category not found")
        
        if tx_data.type is not None:
            update_fields.append(f"type = ${param_num}")
            values.append(tx_data.type.value)
            param_num += 1
        if tx_data.amount is not None:
            update_fields.append(f"amount = ${param_num}")
            values.append(tx_data.amount)
            param_num += 1
        if tx_data.category_id is not None:
            update_fields.append(f"category_id = ${param_num}::uuid")
            values.append(tx_data.category_id)
            param_num += 1
        if tx_data.description is not None:
            update_fields.append(f"description = ${param_num}")
            values.append(tx_data.description)
            param_num += 1
        if tx_data.date is not None:
            update_fields.append(f"date = ${param_num}")
            values.append(tx_data.date)
            param_num += 1
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(transaction_id)
        query = f"UPDATE transactions SET {', '.join(update_fields)} WHERE id::text = ${param_num} RETURNING id::text, type, amount, category_id::text, description, date, created_at"
        
        row = await conn.fetchrow(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return Transaction(
            id=row["id"],
            type=row["type"],
            amount=float(row["amount"]),
            category_id=row["category_id"],
            description=row["description"] or "",
            date=str(row["date"]),
            created_at=row["created_at"].isoformat()
        )

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM transactions WHERE id::text = $1",
            transaction_id
        )
        if result == "DELETE 0":
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
    
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        # Get transactions for the month
        transactions = await conn.fetch(
            "SELECT type, amount, category_id::text FROM transactions WHERE date >= $1 AND date < $2",
            start_date, end_date
        )
        
        # Get all categories
        categories = await conn.fetch(
            "SELECT id::text, name, type, budget_limit, color FROM categories"
        )
        cat_map = {row["id"]: dict(row) for row in categories}
        
        total_income = 0.0
        total_expenses = 0.0
        category_totals = {}
        
        for tx in transactions:
            amount = float(tx["amount"])
            if tx["type"] == "income":
                total_income += amount
            else:
                total_expenses += amount
            
            cat_id = tx["category_id"]
            if cat_id not in category_totals:
                category_totals[cat_id] = 0.0
            category_totals[cat_id] += amount
        
        category_breakdown = []
        for cat_id, total in category_totals.items():
            cat = cat_map.get(cat_id, {})
            category_breakdown.append({
                "category_id": cat_id,
                "category_name": cat.get("name", "Unknown"),
                "type": cat.get("type", "expense"),
                "total": total,
                "budget_limit": float(cat.get("budget_limit", 0)),
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
    
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        for month in range(1, 13):
            start_date = f"{year}-{month:02d}-01"
            if month == 12:
                end_date = f"{year + 1}-01-01"
            else:
                end_date = f"{year}-{month + 1:02d}-01"
            
            rows = await conn.fetch(
                "SELECT type, SUM(amount) as total FROM transactions WHERE date >= $1 AND date < $2 GROUP BY type",
                start_date, end_date
            )
            
            income = 0.0
            expenses = 0.0
            for row in rows:
                if row["type"] == "income":
                    income = float(row["total"])
                else:
                    expenses = float(row["total"])
            
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
    
    db_pool = await get_db()
    async with db_pool.acquire() as conn:
        # Get expense categories
        categories = await conn.fetch(
            "SELECT id::text, name, budget_limit, color FROM categories WHERE type = 'expense'"
        )
        
        # Get spending by category
        spending = await conn.fetch(
            "SELECT category_id::text, SUM(amount) as spent FROM transactions WHERE date >= $1 AND date < $2 AND type = 'expense' GROUP BY category_id",
            start_date, end_date
        )
        spending_map = {row["category_id"]: float(row["spent"]) for row in spending}
        
        budget_status = []
        for cat in categories:
            spent = spending_map.get(cat["id"], 0.0)
            budget_limit = float(cat["budget_limit"])
            percentage = (spent / budget_limit * 100) if budget_limit > 0 else 0
            
            budget_status.append({
                "category_id": cat["id"],
                "category_name": cat["name"],
                "budget_limit": budget_limit,
                "spent": spent,
                "remaining": max(0, budget_limit - spent),
                "percentage": min(percentage, 100),
                "over_budget": spent > budget_limit if budget_limit > 0 else False,
                "color": cat["color"]
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

