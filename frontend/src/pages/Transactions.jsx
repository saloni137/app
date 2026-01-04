import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { getTransactions, getCategories, deleteTransaction } from "@/lib/api";
import { formatCurrency, formatDate, getCurrentMonth, getCurrentYear } from "@/lib/utils";
import { toast } from "sonner";
import TransactionModal from "@/components/TransactionModal";
import MonthSelector from "@/components/MonthSelector";

export default function Transactions() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        getTransactions({ month, year }),
        getCategories()
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryMap[tx.category_id]?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totals = filteredTransactions.reduce(
    (acc, tx) => {
      if (tx.type === "income") acc.income += tx.amount;
      else acc.expenses += tx.amount;
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="transactions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your income and expenses
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
            onClick={() => setShowModal(true)}
            data-testid="add-transaction-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="search-input"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="type-filter">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border shadow-none" data-testid="filtered-income">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Filtered Income</p>
            <p className="text-2xl font-bold text-green-700 tabular-nums">
              {formatCurrency(totals.income)}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none" data-testid="filtered-expenses">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Filtered Expenses</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">
              {formatCurrency(totals.expenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border shadow-none" data-testid="transactions-table-card">
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Description</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const category = categoryMap[tx.category_id];
                    return (
                      <TableRow key={tx.id} data-testid={`transaction-row-${tx.id}`}>
                        <TableCell className="text-sm">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="category-indicator" 
                              style={{ backgroundColor: category?.color || '#3D405B' }}
                            />
                            <span className="text-sm">{category?.name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${
                          tx.type === 'income' ? 'text-green-700' : 'text-red-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                data-testid={`transaction-menu-${tx.id}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(tx)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(tx.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions found</p>
              <Button 
                variant="link" 
                onClick={() => setShowModal(true)}
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
        open={showModal} 
        onOpenChange={handleCloseModal}
        categories={categories}
        transaction={editingTransaction}
        onSuccess={() => {
          fetchData();
          handleCloseModal();
        }}
      />
    </div>
  );
}
