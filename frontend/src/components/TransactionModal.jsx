import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/lib/api";
import { toast } from "sonner";

export default function TransactionModal({ 
  open, 
  onOpenChange, 
  categories, 
  transaction = null,
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category_id: "",
    description: "",
    date: new Date()
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        category_id: transaction.category_id,
        description: transaction.description || "",
        date: new Date(transaction.date)
      });
    } else {
      setFormData({
        type: "expense",
        amount: "",
        category_id: "",
        description: "",
        date: new Date()
      });
    }
  }, [transaction, open]);

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!formData.category_id) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        description: formData.description,
        date: format(formData.date, "yyyy-MM-dd")
      };

      if (transaction) {
        await updateTransaction(transaction.id, payload);
        toast.success("Transaction updated");
      } else {
        await createTransaction(payload);
        toast.success("Transaction added");
      }
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(transaction ? "Failed to update transaction" : "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setFormData({ 
      ...formData, 
      type, 
      category_id: "" // Reset category when type changes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="transaction-modal">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === "expense" ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleTypeChange("expense")}
                data-testid="type-expense-btn"
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={formData.type === "income" ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleTypeChange("income")}
                data-testid="type-income-btn"
              >
                Income
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (CAD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-7"
                placeholder="0.00"
                data-testid="amount-input"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger data-testid="category-select">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                  data-testid="date-picker-btn"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData({ ...formData, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What was this for?"
              rows={2}
              data-testid="description-input"
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} data-testid="save-transaction-btn">
              {loading ? "Saving..." : (transaction ? "Update" : "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
