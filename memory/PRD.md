# Monthly Budget Planner PRD

## Original Problem Statement
Build a monthly budget planner app with income & expense tracking, category-wise expense breakdown, budget goals/limits per category, visual charts & analytics. Manual entry only, no recurring. Currency: CAD. No authentication.

## User Personas
- Individual user tracking personal monthly budget in Canadian Dollars

## Core Requirements
- [x] Income & expense tracking
- [x] Category-wise expense breakdown
- [x] Budget goals/limits per category
- [x] Visual charts (pie charts, bar graphs)
- [x] Manual transaction entry
- [x] Clean & minimal design

## What's Been Implemented (January 4, 2026)

### Backend (FastAPI + MongoDB)
- Categories CRUD with 11 default categories
- Transactions CRUD with filtering by month/year
- Monthly summary endpoint
- Yearly analytics summary
- Budget status tracking per category

### Frontend (React + Shadcn UI + Recharts)
- Dashboard with balance, income, expense cards
- Expense breakdown pie chart
- Budget status with progress bars
- Recent transactions list
- Transactions page with search/filter
- Categories page with budget limits
- Analytics page with yearly charts
- Month/Year navigation
- Transaction add/edit modal

## Prioritized Backlog

### P0 (Done)
- All core features implemented

### P1 (Future Enhancements)
- Export transactions to CSV
- Import from bank statements
- Multiple currency support
- Data persistence/backup

### P2 (Nice to Have)
- Dark mode toggle
- Savings goals tracking
- Bill reminders
- Receipt image upload

## Next Tasks
- Add CSV export feature
- Implement savings goals
