'use client'

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createTransaction, updateTransaction } from "@/lib/db"
import { toast } from "sonner"

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
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        category_id: transaction.category_id,
        description: transaction.description || "",
        date: new Date(transaction.date)
      })
    } else {
      setFormData({
        type: "expense",
        amount: "",
        category_id: "",
        description: "",
        date: new Date()
      })
    }
  }, [transaction, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.category_id) {
      toast.error("Please select a category")
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      const data = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        description: formData.description,
        date: format(formData.date, 'yyyy-MM-dd')
      }

      if (transaction) {
        await updateTransaction(transaction.id, data)
        toast.success("Transaction updated")
      } else {
        await createTransaction(data)
        toast.success("Transaction created")
      }
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error.message || (transaction ? "Failed to update transaction" : "Failed to create transaction"))
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(cat => cat.type === formData.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value, category_id: "" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (CAD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a note..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData({ ...formData, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (transaction ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
