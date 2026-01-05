// Database operations using Supabase client
import { supabase } from './supabase'

// Categories
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data.map(cat => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    budget_limit: parseFloat(cat.budget_limit) || 0,
    color: cat.color,
    created_at: cat.created_at
  }))
}

export async function createCategory(categoryData) {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single()
  
  if (error) throw error
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    budget_limit: parseFloat(data.budget_limit) || 0,
    color: data.color,
    created_at: data.created_at
  }
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    budget_limit: parseFloat(data.budget_limit) || 0,
    color: data.color,
    created_at: data.created_at
  }
}

export async function deleteCategory(id) {
  // Check if category has transactions
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
  
  if (count > 0) {
    throw new Error('Cannot delete category with existing transactions')
  }
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Transactions
export async function getTransactions({ month, year, type, category_id } = {}) {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000)
  
  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
    
    query = query
      .gte('date', startDate)
      .lt('date', endDate)
  }
  
  if (type) {
    query = query.eq('type', type)
  }
  
  if (category_id) {
    query = query.eq('category_id', category_id)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data.map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: parseFloat(tx.amount),
    category_id: tx.category_id,
    description: tx.description || '',
    date: tx.date,
    created_at: tx.created_at
  }))
}

export async function createTransaction(transactionData) {
  // Verify category exists
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('id', transactionData.category_id)
    .single()
  
  if (!category) {
    throw new Error('Category not found')
  }
  
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single()
  
  if (error) throw error
  return {
    id: data.id,
    type: data.type,
    amount: parseFloat(data.amount),
    category_id: data.category_id,
    description: data.description || '',
    date: data.date,
    created_at: data.created_at
  }
}

export async function updateTransaction(id, updates) {
  if (updates.category_id) {
    // Verify category exists
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('id', updates.category_id)
      .single()
    
    if (!category) {
      throw new Error('Category not found')
    }
  }
  
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return {
    id: data.id,
    type: data.type,
    amount: parseFloat(data.amount),
    category_id: data.category_id,
    description: data.description || '',
    date: data.date,
    created_at: data.created_at
  }
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Summary functions
export async function getMonthlySummary(month, year) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
  
  // Get transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, category_id')
    .gte('date', startDate)
    .lt('date', endDate)
  
  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
  
  const catMap = {}
  categories.forEach(cat => {
    catMap[cat.id] = cat
  })
  
  let totalIncome = 0
  let totalExpenses = 0
  let totalInvestments = 0
  const categoryTotals = {}
  
  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount)
    if (tx.type === 'income') {
      totalIncome += amount
    } else if (tx.type === 'investment') {
      totalInvestments += amount
    } else {
      totalExpenses += amount
    }
    
    if (!categoryTotals[tx.category_id]) {
      categoryTotals[tx.category_id] = 0
    }
    categoryTotals[tx.category_id] += amount
  })
  
  const categoryBreakdown = Object.entries(categoryTotals).map(([catId, total]) => {
    const cat = catMap[catId] || {}
    return {
      category_id: catId,
      category_name: cat.name || 'Unknown',
      type: cat.type || 'expense',
      total: total,
      budget_limit: parseFloat(cat.budget_limit) || 0,
      color: cat.color || '#3D405B'
    }
  })
  
  return {
    month,
    year,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    total_investments: totalInvestments,
    balance: totalIncome - totalExpenses,
    category_breakdown: categoryBreakdown
  }
}

export async function getYearlySummary(year) {
  const monthlyData = []
  
  for (let month = 1; month <= 12; month++) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount')
      .gte('date', startDate)
      .lt('date', endDate)
    
    let income = 0
    let expenses = 0
    let investments = 0
    
    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount)
      if (tx.type === 'income') {
        income += amount
      } else if (tx.type === 'investment') {
        investments += amount
      } else {
        expenses += amount
      }
    })
    
    monthlyData.push({
      month,
      income,
      expenses,
      investments,
      balance: income - expenses
    })
  }
  
  return {
    year,
    monthly_data: monthlyData,
    total_income: monthlyData.reduce((sum, m) => sum + m.income, 0),
    total_expenses: monthlyData.reduce((sum, m) => sum + m.expenses, 0),
    total_investments: monthlyData.reduce((sum, m) => sum + (m.investments || 0), 0)
  }
}

export async function getBudgetStatus(month, year) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
  
  // Get expense categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'expense')
  
  // Get spending by category
  const { data: transactions } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('type', 'expense')
    .gte('date', startDate)
    .lt('date', endDate)
  
  const spendingMap = {}
  transactions.forEach(tx => {
    if (!spendingMap[tx.category_id]) {
      spendingMap[tx.category_id] = 0
    }
    spendingMap[tx.category_id] += parseFloat(tx.amount)
  })
  
  return categories.map(cat => {
    const spent = spendingMap[cat.id] || 0
    const budgetLimit = parseFloat(cat.budget_limit) || 0
    const percentage = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0
    
    return {
      category_id: cat.id,
      category_name: cat.name,
      budget_limit: budgetLimit,
      spent: spent,
      remaining: Math.max(0, budgetLimit - spent),
      percentage: Math.min(percentage, 100),
      over_budget: budgetLimit > 0 && spent > budgetLimit,
      color: cat.color
    }
  })
}

