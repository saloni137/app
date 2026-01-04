import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  ResponsiveContainer, Tooltip, Legend 
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";
import { getMonthlySummary, getBudgetStatus, getTransactions, getCategories } from "@/lib/api";
import { formatCurrency, formatDate, getMonthName, getCurrentMonth, getCurrentYear, getBudgetStatusColor } from "@/lib/utils";
import TransactionModal from "@/components/TransactionModal";
import MonthSelector from "@/components/MonthSelector";

export default function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [summary, setSummary] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, budgetRes, txRes, catRes] = await Promise.all([
        getMonthlySummary(month, year),
        getBudgetStatus(month, year),
        getTransactions({ month, year }),
        getCategories()
      ]);
      setSummary(summaryRes.data);
      setBudgetStatus(budgetRes.data);
      setRecentTransactions(txRes.data.slice(0, 5));
      setCategories(catRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  // Prepare pie chart data for expense categories
  const pieData = summary?.category_breakdown
    ?.filter(c => c.type === "expense" && c.total > 0)
    ?.map(c => ({
      name: c.category_name,
      value: c.total,
      color: c.color
    })) || [];

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
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getMonthName(month)} {year}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your monthly budget overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector 
            month={month} 
            year={year} 
            onMonthChange={setMonth} 
            onYearChange={setYear} 
          />
          <Button 
            onClick={() => setShowTransactionModal(true)}
            data-testid="add-transaction-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border shadow-none hover:border-primary/50 transition-colors" data-testid="balance-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <Wallet className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold tabular-nums ${summary?.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {formatCurrency(summary?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month's net
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-none hover:border-primary/50 transition-colors" data-testid="income-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Income
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-green-700">
              {formatCurrency(summary?.total_income || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total received
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-none hover:border-primary/50 transition-colors" data-testid="expenses-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expenses
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-red-600">
              {formatCurrency(summary?.total_expenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Pie Chart */}
        <Card className="border shadow-none" data-testid="expense-breakdown-card">
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No expenses recorded this month
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card className="border shadow-none" data-testid="budget-status-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Budget Status</CardTitle>
            <Link 
              to="/categories" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
              data-testid="manage-budgets-link"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-4">
                {budgetStatus.filter(b => b.budget_limit > 0).map((budget) => (
                  <div key={budget.category_id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="category-indicator" 
                          style={{ backgroundColor: budget.color }}
                        />
                        <span className="font-medium">{budget.category_name}</span>
                      </div>
                      <span className={`font-medium ${budget.over_budget ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget_limit)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(budget.percentage, 100)} 
                      className="h-2"
                      style={{
                        '--progress-foreground': getBudgetStatusColor(budget.percentage)
                      }}
                    />
                    {budget.over_budget && (
                      <p className="text-xs text-destructive">
                        Over budget by {formatCurrency(budget.spent - budget.budget_limit)}
                      </p>
                    )}
                  </div>
                ))}
                {budgetStatus.filter(b => b.budget_limit > 0).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No budget limits set</p>
                    <Link 
                      to="/categories" 
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <Link 
            to="/transactions" 
            className="text-sm text-primary hover:underline flex items-center gap-1"
            data-testid="view-all-transactions-link"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx) => {
                const category = categoryMap[tx.category_id];
                return (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="category-indicator" 
                        style={{ backgroundColor: category?.color || '#3D405B' }}
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {tx.description || category?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category?.name} • {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold tabular-nums ${
                      tx.type === 'income' ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No transactions this month</p>
              <Button 
                variant="link" 
                onClick={() => setShowTransactionModal(true)}
                className="text-primary"
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
  );
}
