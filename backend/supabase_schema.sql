-- Supabase PostgreSQL Schema for Budget Planner
-- Run this in Supabase SQL Editor after creating your project

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    budget_limit DECIMAL(15, 2) DEFAULT 0.0,
    color VARCHAR(7) DEFAULT '#3D405B',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15, 2) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description TEXT DEFAULT '',
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Insert default categories
INSERT INTO categories (id, name, type, budget_limit, color) VALUES
    (gen_random_uuid(), 'Salary', 'income', 0, '#2E5C42'),
    (gen_random_uuid(), 'Freelance', 'income', 0, '#8FB339'),
    (gen_random_uuid(), 'Other Income', 'income', 0, '#5C8A4E'),
    (gen_random_uuid(), 'Food & Dining', 'expense', 500, '#E07A5F'),
    (gen_random_uuid(), 'Rent', 'expense', 1500, '#3D405B'),
    (gen_random_uuid(), 'Utilities', 'expense', 200, '#81B29A'),
    (gen_random_uuid(), 'Transportation', 'expense', 300, '#F2CC8F'),
    (gen_random_uuid(), 'Entertainment', 'expense', 200, '#6D597A'),
    (gen_random_uuid(), 'Shopping', 'expense', 300, '#B56576'),
    (gen_random_uuid(), 'Healthcare', 'expense', 150, '#355070'),
    (gen_random_uuid(), 'Other Expenses', 'expense', 200, '#EAAC8B')
ON CONFLICT DO NOTHING;

