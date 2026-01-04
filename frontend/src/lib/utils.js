import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

export function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function getBudgetStatusColor(percentage) {
  if (percentage >= 100) return 'hsl(10 70% 50%)'; // Over budget - red
  if (percentage >= 80) return 'hsl(40 70% 50%)'; // Warning - yellow
  return 'hsl(145 40% 30%)'; // Safe - green
}

export function getBudgetStatusClass(percentage) {
  if (percentage >= 100) return 'budget-danger';
  if (percentage >= 80) return 'budget-warning';
  return 'budget-safe';
}
