import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  User, Hub, Product, Stock, Invoice, Customer, Transaction, SalarySlip,
  UserRole, StockBatch, ReturnRecord
} from '../types';
import { 
  INITIAL_USERS, INITIAL_HUBS, INITIAL_PRODUCTS, INITIAL_STOCKS, 
  INITIAL_CUSTOMERS, HEAD_OFFICE_ID 
} from '../constants';

interface ERPContextType {
  currentUser: User | null;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  users: User[];
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  hubs: Hub[];
  products: Product[];
  addProduct: (product: Product) => void;
  stocks: Stock[]; // Derived from batches
  stockBatches: StockBatch[];
  addStockBatch: (batch: StockBatch) => void;
  transferStock: (items: { productId: string, qty: number }[], fromHubId: string, toHubId: string) => void;
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  invoices: Invoice[];
  createInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  salarySlips: SalarySlip[];
  addSalarySlip: (slip: SalarySlip) => void;
  returnRecords: ReturnRecord[];
  addReturnRecord: (record: ReturnRecord) => void;
  formatCurrency: (amount: number) => string;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // State Initialization
  const [users, setUsers] = useState<User[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usersRes, hubsRes, productsRes, stocksRes, 
          customersRes, invoicesRes, transactionsRes, 
          slipsRes, returnsRes
        ] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/hubs'),
          fetch('/api/products'),
          fetch('/api/stock-batches'),
          fetch('/api/customers'),
          fetch('/api/invoices'),
          fetch('/api/transactions'),
          fetch('/api/salary-slips'),
          fetch('/api/return-records')
        ]);

        if (usersRes.ok) setUsers(await usersRes.json());
        if (hubsRes.ok) setHubs(await hubsRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());
        if (stocksRes.ok) setStockBatches(await stocksRes.json());
        if (customersRes.ok) setCustomers(await customersRes.json());
        if (invoicesRes.ok) setInvoices(await invoicesRes.json());
        if (transactionsRes.ok) setTransactions(await transactionsRes.json());
        if (slipsRes.ok) setSalarySlips(await slipsRes.json());
        if (returnsRes.ok) setReturnRecords(await returnsRes.json());
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Derived Stocks Summary
  const stocks = useMemo(() => {
    const summary: Stock[] = [];
    stockBatches.forEach(batch => {
      const existing = summary.find(s => s.productId === batch.productId && s.hubId === batch.hubId);
      if (existing) {
        existing.quantity += batch.quantity;
      } else {
        summary.push({ productId: batch.productId, hubId: batch.hubId, quantity: batch.quantity });
      }
    });
    return summary;
  }, [stockBatches]);

  const login = (email: string, password?: string) => {
    const user = users.find(u => u.email === email && (password ? u.password === password : true));
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addUser = async (user: User) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      const newUser = await res.json();
      setUsers(prev => [...prev, newUser]);
    }
  };
  
  const removeUser = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const addStockBatch = async (batch: StockBatch) => {
    const res = await fetch('/api/stock-batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch)
    });
    if (res.ok) {
      const newBatch = await res.json();
      setStockBatches(prev => [...prev, newBatch]);
    }
  };

  const transferStock = async (items: { productId: string, qty: number }[], fromHubId: string, toHubId: string) => {
    const res = await fetch('/api/stock-batches/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, fromHubId, toHubId })
    });
    
    if (res.ok) {
      // Refetch stocks to get updated quantities
      const stocksRes = await fetch('/api/stock-batches');
      if (stocksRes.ok) {
        setStockBatches(await stocksRes.json());
      }
    } else {
      throw new Error("Transfer failed");
    }
  };

  const addCustomer = async (customer: Customer) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    if (res.ok) {
      const newCustomer = await res.json();
      setCustomers(prev => [...prev, newCustomer]);
    }
  };
  
  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    const res = await fetch(`/api/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedCustomer = await res.json();
      setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
    }
  };

  const createInvoice = async (invoice: Invoice) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    
    if (res.ok) {
      const { invoice: newInvoice, transaction } = await res.json();
      setInvoices(prev => [...prev, newInvoice]);
      setTransactions(prev => [...prev, transaction]);
      
      // Refetch stocks as they are deducted on server
      const stocksRes = await fetch('/api/stock-batches');
      if (stocksRes.ok) {
        setStockBatches(await stocksRes.json());
      }
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
    if (res.ok) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>) => {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedInvoice = await res.json();
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? updatedInvoice : inv));
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
    if (res.ok) {
      const newTransaction = await res.json();
      setTransactions(prev => [...prev, newTransaction]);
    }
  };
  
  const addSalarySlip = async (slip: SalarySlip) => {
    const res = await fetch('/api/salary-slips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slip)
    });
    if (res.ok) {
      const { slip: newSlip, transaction } = await res.json();
      setSalarySlips(prev => [...prev, newSlip]);
      setTransactions(prev => [...prev, transaction]);
    }
  };

  const addProduct = async (product: Product) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (res.ok) {
      const newProduct = await res.json();
      setProducts(prev => [...prev, newProduct]);
    }
  };

  const addReturnRecord = async (record: ReturnRecord) => {
    const res = await fetch('/api/return-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    
    if (res.ok) {
      const newRecord = await res.json();
      setReturnRecords(prev => [...prev, newRecord]);
      
      // Refetch stocks if deduction happened
      if (record.reason === 'EXPIRED' || record.reason === 'DAMAGED_BOX') {
        const stocksRes = await fetch('/api/stock-batches');
        if (stocksRes.ok) {
          setStockBatches(await stocksRes.json());
        }
      }
    }
  };

  return (
    <ERPContext.Provider value={{
      currentUser, login, logout,
      users, addUser, removeUser, updateUser,
      hubs,
      products, addProduct,
      stocks, stockBatches, addStockBatch, transferStock,
      customers, addCustomer, updateCustomer,
      invoices, createInvoice, deleteInvoice, updateInvoice,
      transactions, addTransaction,
      salarySlips, addSalarySlip,
      returnRecords, addReturnRecord,
      formatCurrency
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (context === undefined) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
