import axios from "axios";

// In production (Vercel), use relative URLs. In development, use env variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Categories
export const getCategories = () => API.get("/categories");
export const createCategory = (data) => API.post("/categories", data);
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Transactions
export const getTransactions = (params) => API.get("/transactions", { params });
export const createTransaction = (data) => API.post("/transactions", data);
export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);

// Summary
export const getMonthlySummary = (month, year) => 
  API.get("/summary/monthly", { params: { month, year } });
export const getYearlySummary = (year) => 
  API.get("/summary/yearly", { params: { year } });
export const getBudgetStatus = (month, year) => 
  API.get("/summary/budget-status", { params: { month, year } });

export default API;
