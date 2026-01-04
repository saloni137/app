'use client'

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  ResponsiveContainer, Tooltip, Legend 
} from "recharts"
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react"
import { getMonthlySummary, getBudgetStatus, getTransactions, getCategories } from "@/lib/db"
import { formatCurrency, formatDate, getMonthName, getCurrentMonth, getCurrentYear, getBudgetStatusColor } from "@/lib/utils"
import TransactionModal from "@/components/TransactionModal"
import MonthSelector from "@/components/MonthSelector"

export default function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [summary, setSummary] = useState(null)
  const [budgetStatus, setBudgetStatus] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryData, budgetData, transactions, categoriesData] = await Promise.all([
        getMonthlySummary(month, year),
        getBudgetStatus(month, year),
        getTransactions({ month, year }),
        getCategories()
      ])
      setSummary(summaryData)
      setBudgetStatus(budgetData)
      setRecentTransactions(transactions.slice(0, 5))
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat
    return acc
  }, {})

  // Prepare pie chart data for expense categories
  const pieData = summary?.category_breakdown
    ?.filter(c => c.type === "expense" && c.total > 0)
    ?.map(c => ({
      name: c.category_name,
      value: c.total,
      color: c.color
    })) || []

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {getMonthName(month)} {year}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
              Your monthly budget overview
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MonthSelector 
              month={month} 
              year={year} 
              onMonthChange={setMonth} 
              onYearChange={setYear} 
            />
            <Button 
              onClick={() => setShowTransactionModal(true)}
              data-testid="add-transaction-btn"
              size="sm"
              className="sm:hidden"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setShowTransactionModal(true)}
              data-testid="add-transaction-btn-desktop"
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6">
        <Card className="border shadow-none hover:border-primary/50 transition-colors" data-testid="balance-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className={`text-lg sm:text-3xl font-bold tabular-nums ${summary?.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {formatCurrency(summary?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              This month's net
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-none hover:border-primary/50 transition-colors" data-testid="income-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Income
            </CardTitle>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-3xl font-bold tabular-nums text-green-700">
              {formatCurrency(summary?.total_income || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Total received
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-none hover:border-primary/50 transition-colors" data-testid="expenses-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Expenses
            </CardTitle>
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-3xl font-bold tabular-nums text-red-600">
              {formatCurrency(summary?.total_expenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Total spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Expense Breakdown Pie Chart */}
        <Card className="border shadow-none" data-testid="expense-breakdown-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {pieData.length > 0 ? (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      layout="horizontal"
                      align="center" 
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span className="text-xs sm:text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
                No expenses recorded this month
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card className="border shadow-none" data-testid="budget-status-card">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Budget Status</CardTitle>
            <Link 
              href="/categories" 
              className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
              data-testid="manage-budgets-link"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ScrollArea className="h-48 sm:h-64 pr-2 sm:pr-4">
              <div className="space-y-3 sm:space-y-4">
                {budgetStatus.filter(b => b.budget_limit > 0).map((budget) => (
                  <div key={budget.category_id} className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="category-indicator" 
                          style={{ backgroundColor: budget.color }}
                        />
                        <span className="font-medium truncate max-w-[100px] sm:max-w-none">{budget.category_name}</span>
                      </div>
                      <span className={`font-medium text-xs sm:text-sm ${budget.over_budget ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget_limit)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(budget.percentage, 100)} 
                      className="h-1.5 sm:h-2"
                      style={{
                        '--progress-foreground': getBudgetStatusColor(budget.percentage)
                      }}
                    />
                    {budget.over_budget && (
                      <p className="text-xs text-destructive">
                        Over by {formatCurrency(budget.spent - budget.budget_limit)}
                      </p>
                    )}
                  </div>
                ))}
                {budgetStatus.filter(b => b.budget_limit > 0).length === 0 && (
                  <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <p className="text-sm">No budget limits set</p>
                    <Link 
                      href="/categories" 
                      className="text-primary hover:underline text-sm"
                    >
                      Set budget limits
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border shadow-none" data-testid="recent-transactions-card">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
          <Link 
            href="/transactions" 
            className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
            data-testid="view-all-transactions-link"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {recentTransactions.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentTransactions.map((tx) => {
                const category = categoryMap[tx.category_id];
                return (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div 
                        className="category-indicator flex-shrink-0" 
                        style={{ backgroundColor: category?.color || '#3D405B' }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">
                          {tx.description || category?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {category?.name} • {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold tabular-nums text-sm sm:text-base ml-2 flex-shrink-0 ${
                      tx.type === 'income' ? 'text-green-700' : tx.type === 'investment' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'investment' ? '●' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-6 sm:py-8">
              <p className="text-sm">No transactions this month</p>
              <Button 
                variant="link" 
                onClick={() => setShowTransactionModal(true)}
                className="text-primary text-sm"
              >
                Add your first transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal 
        open={showTransactionModal} 
        onOpenChange={setShowTransactionModal}
        categories={categories}
        onSuccess={fetchData}
      />
    </div>
  )
}

