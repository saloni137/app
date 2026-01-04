import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory, getBudgetStatus } from "@/lib/api";
import { formatCurrency, getCurrentMonth, getCurrentYear, getBudgetStatusColor } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = [
  "#2E5C42", "#8FB339", "#E07A5F", "#3D405B", "#81B29A",
  "#F2CC8F", "#6D597A", "#B56576", "#355070", "#EAAC8B"
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    budget_limit: 0,
    color: COLORS[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, budgetRes] = await Promise.all([
        getCategories(),
        getBudgetStatus(getCurrentMonth(), getCurrentYear())
      ]);
      setCategories(catRes.data);
      setBudgetStatus(budgetRes.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const budgetMap = budgetStatus.reduce((acc, b) => {
    acc[b.category_id] = b;
    return acc;
  }, {});

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        budget_limit: category.budget_limit || 0,
        color: category.color || COLORS[0]
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        type: "expense",
        budget_limit: 0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          budget_limit: parseFloat(formData.budget_limit) || 0,
          color: formData.color
        });
        toast.success("Category updated");
      } else {
        await createCategory(formData);
        toast.success("Category created");
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      toast.error(editingCategory ? "Failed to update category" : "Failed to create category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? Categories with transactions cannot be deleted.")) return;
    
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete category");
    }
  };

  const CategoryCard = ({ category }) => {
    const budget = budgetMap[category.id];
    const hasBudget = category.type === "expense" && category.budget_limit > 0;

    return (
      <Card 
        className="border shadow-none hover:border-primary/50 transition-colors"
        data-testid={`category-${category.id}`}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: category.color }}
              />
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {category.type}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleOpenModal(category)}
                data-testid={`edit-category-${category.id}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(category.id)}
                data-testid={`delete-category-${category.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {hasBudget && budget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className={`font-medium ${budget.over_budget ? 'text-destructive' : ''}`}>
                  {formatCurrency(budget.spent)} / {formatCurrency(category.budget_limit)}
                </span>
              </div>
              <Progress 
                value={Math.min(budget.percentage, 100)} 
                className="h-2"
                style={{
                  '--progress-foreground': getBudgetStatusColor(budget.percentage)
                }}
              />
              <p className="text-xs text-muted-foreground">
                {budget.over_budget 
                  ? `${formatCurrency(budget.spent - category.budget_limit)} over budget`
                  : `${formatCurrency(budget.remaining)} remaining`
                }
              </p>
            </div>
          )}

          {category.type === "expense" && !hasBudget && (
            <p className="text-xs text-muted-foreground">
              No budget limit set
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="categories-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage your income and expense categories
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          data-testid="add-category-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="expense" data-testid="expense-tab">
            Expenses ({expenseCategories.length})
          </TabsTrigger>
          <TabsTrigger value="income" data-testid="income-tab">
            Income ({incomeCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : expenseCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map(cat => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          ) : (
            <Card className="border shadow-none">
              <CardContent className="py-8 text-center text-muted-foreground">
                No expense categories yet
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : incomeCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.map(cat => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          ) : (
            <Card className="border shadow-none">
              <CardContent className="py-8 text-center text-muted-foreground">
                No income categories yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent data-testid="category-modal">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Groceries"
                data-testid="category-name-input"
              />
            </div>

            {!editingCategory && (
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="category-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === "expense" && (
              <div className="space-y-2">
                <Label htmlFor="budget_limit">Monthly Budget Limit (CAD)</Label>
                <Input
                  id="budget_limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget_limit}
                  onChange={(e) => setFormData({ ...formData, budget_limit: e.target.value })}
                  placeholder="0.00"
                  data-testid="category-budget-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded cursor-pointer border-2 transition-all ${
                      formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-category-btn">
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
