import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { getYearlySummary, getMonthlySummary, getCategories } from "@/lib/api";
import { formatCurrency, getMonthName, getCurrentYear } from "@/lib/utils";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

const CHART_COLORS = ["#2E5C42", "#8FB339", "#E07A5F", "#3D405B", "#81B29A", "#F2CC8F", "#6D597A", "#B56576"];

export default function Analytics() {
  const [year, setYear] = useState(getCurrentYear());
  const [yearlyData, setYearlyData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [yearRes, catRes, monthRes] = await Promise.all([
        getYearlySummary(year),
        getCategories(),
        getMonthlySummary(selectedMonth, year)
      ]);
      setYearlyData(yearRes.data);
      setCategories(catRes.data);
      setMonthlyBreakdown(monthRes.data.category_breakdown);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [year, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const barChartData = yearlyData?.monthly_data?.map(m => ({
    name: getMonthName(m.month).substring(0, 3),
    Income: m.income,
    Expenses: m.expenses
  })) || [];

  const balanceChartData = yearlyData?.monthly_data?.map(m => ({
    name: getMonthName(m.month).substring(0, 3),
    Balance: m.balance
  })) || [];

  const expensePieData = monthlyBreakdown
    .filter(c => c.type === "expense" && c.total > 0)
    .map(c => ({
      name: c.category_name,
      value: c.total,
      color: c.color
    }));

  const incomePieData = monthlyBreakdown
    .filter(c => c.type === "income" && c.total > 0)
    .map(c => ({
      name: c.category_name,
      value: c.total,
      color: c.color
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
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

  const years = Array.from({ length: 5 }, (_, i) => getCurrentYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            Visualize your financial data
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-20 sm:w-28 h-9" data-testid="year-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Yearly Summary Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card className="border shadow-none" data-testid="yearly-income-card">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <p className="text-xs sm:text-sm text-muted-foreground">Income ({year})</p>
            <p className="text-lg sm:text-3xl font-bold text-green-700 tabular-nums">
              {formatCurrency(yearlyData?.total_income || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none" data-testid="yearly-expenses-card">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <p className="text-xs sm:text-sm text-muted-foreground">Expenses ({year})</p>
            <p className="text-lg sm:text-3xl font-bold text-red-600 tabular-nums">
              {formatCurrency(yearlyData?.total_expenses || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Income vs Expenses Bar Chart */}
      <Card className="border shadow-none" data-testid="monthly-comparison-chart">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Income vs Expenses ({year})</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="h-56 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Income" fill="#2E5C42" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#E07A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Balance Trend */}
      <Card className="border shadow-none" data-testid="balance-trend-chart">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Monthly Balance Trend ({year})</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="Balance" 
                  stroke="#3D405B" 
                  strokeWidth={2}
                  dot={{ fill: '#3D405B', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="border shadow-none" data-testid="category-breakdown-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32" data-testid="month-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expenses">
            <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
            
            <TabsContent value="expenses">
              {expensePieData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No expense data for {getMonthName(selectedMonth)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="income">
              {incomePieData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {incomePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No income data for {getMonthName(selectedMonth)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
