import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  User, Hub, Product, Stock, Invoice, Customer, Transaction, SalarySlip,
  UserRole, StockBatch, ReturnRecord, CompanySettings, StockRequest, Message
} from '../types';
import { 
  INITIAL_USERS, INITIAL_HUBS, INITIAL_PRODUCTS, INITIAL_STOCKS, 
  INITIAL_CUSTOMERS, HEAD_OFFICE_ID 
} from '../constants';

const API_BASE_URL = window.location.hostname === 'suncola.hyperoms.xyz' 
  ? 'https://suncola.hyperoms.xyz' 
// @ts-ignore
  : (import.meta.env.VITE_API_BASE_URL || (window.location.protocol + '//' + window.location.host));

interface ERPContextType {
  currentUser: User | null;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  users: User[];
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  hubs: Hub[];
  addHub: (hub: Hub) => void;
  updateHub: (hubId: string, updates: Partial<Hub>) => void;
  deleteHub: (hubId: string) => void;
  products: Product[];
  addProduct: (product: Product) => void;
  stocks: Stock[]; // Derived from batches
  stockBatches: StockBatch[];
  addStockBatch: (batch: StockBatch) => void;
  transferStock: (items: { productId: string, qty: number }[], fromHubId: string, toHubId: string) => void;
  stockRequests: StockRequest[];
  addStockRequest: (req: Partial<StockRequest>) => void;
  updateStockRequest: (id: string, updates: Partial<StockRequest>) => void;
  messages: Message[];
  addMessage: (msg: Partial<Message>) => void;
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  deleteCustomer: (customerId: string) => void;
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
  companySettings: CompanySettings | null;
  updateCompanySettings: (settings: CompanySettings) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  // State Initialization
  const [users, setUsers] = useState<User[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usersRes, hubsRes, productsRes, stocksRes, 
          customersRes, invoicesRes, transactionsRes, 
          slipsRes, returnsRes, settingsRes, requestsRes, msgsRes
        ] = await Promise.all([
          fetch(API_BASE_URL + '/api/users'),
          fetch(API_BASE_URL + '/api/hubs'),
          fetch(API_BASE_URL + '/api/products'),
          fetch(API_BASE_URL + '/api/stock-batches'),
          fetch(API_BASE_URL + '/api/customers'),
          fetch(API_BASE_URL + '/api/invoices'),
          fetch(API_BASE_URL + '/api/transactions'),
          fetch(API_BASE_URL + '/api/salary-slips'),
          fetch(API_BASE_URL + '/api/return-records'),
          fetch(API_BASE_URL + '/api/settings'),
          fetch(API_BASE_URL + '/api/stock-requests'),
          fetch(API_BASE_URL + '/api/messages')
        ]);

        if (usersRes.ok) {
           const fetchedUsers = await usersRes.json();
           setUsers(fetchedUsers);
           // Also update current user if it changed in DB
           if (currentUser) {
               const updated = fetchedUsers.find((u: User) => u.id === currentUser.id);
               if (updated) {
                   setCurrentUser(updated);
                   localStorage.setItem('currentUser', JSON.stringify(updated));
               } else {
                   // User might have been deleted
                   setCurrentUser(null);
                   localStorage.removeItem('currentUser');
               }
           }
        }
        if (hubsRes.ok) setHubs(await hubsRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());
        if (stocksRes.ok) setStockBatches(await stocksRes.json());
        if (customersRes.ok) setCustomers(await customersRes.json());
        if (invoicesRes.ok) setInvoices(await invoicesRes.json());
        if (transactionsRes.ok) setTransactions(await transactionsRes.json());
        if (slipsRes.ok) setSalarySlips(await slipsRes.json());
        if (returnsRes.ok) setReturnRecords(await returnsRes.json());
        if (requestsRes.ok) setStockRequests(await requestsRes.json());
        if (msgsRes.ok) setMessages(await msgsRes.json());
        if (settingsRes.ok) {
           const sets = await settingsRes.json();
           if (sets.length > 0) setCompanySettings(sets[0]);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();

    // Polling for realtime updates (messages and stock requests)
    const interval = setInterval(async () => {
        try {
            const [requestsRes, msgsRes] = await Promise.all([
                fetch(API_BASE_URL + '/api/stock-requests'),
                fetch(API_BASE_URL + '/api/messages')
            ]);
            if (requestsRes.ok) setStockRequests(await requestsRes.json());
            if (msgsRes.ok) setMessages(await msgsRes.json());
        } catch (err) {
            console.error("Polling error: ", err);
        }
    }, 5000);

    return () => clearInterval(interval);
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
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.trim().toLowerCase() === normalizedEmail && (password ? u.password === password : true));
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const addUser = async (user: User) => {
    const res = await fetch(API_BASE_URL + '/api/users', {
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
    const res = await fetch(API_BASE_URL + `/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const res = await fetch(API_BASE_URL + `/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    }
  };

  const addHub = async (hub: Hub) => {
    const res = await fetch(API_BASE_URL + '/api/hubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hub)
    });
    if (res.ok) {
      const newHub = await res.json();
      setHubs(prev => [...prev, newHub]);
    }
  };

  const updateHub = async (hubId: string, updates: Partial<Hub>) => {
    const res = await fetch(API_BASE_URL + `/api/hubs/${hubId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedHub = await res.json();
      setHubs(prev => prev.map(h => h.id === hubId ? updatedHub : h));
    }
  };

  const deleteHub = async (hubId: string) => {
    const res = await fetch(API_BASE_URL + `/api/hubs/${hubId}`, { method: 'DELETE' });
    if (res.ok) {
      setHubs(prev => prev.filter(h => h.id !== hubId));
    }
  };

  const updateCompanySettings = async (settings: CompanySettings) => {
    const res = await fetch(API_BASE_URL + `/api/settings/${settings.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const updatedSettings = await res.json();
      setCompanySettings(updatedSettings);
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
    const res = await fetch(API_BASE_URL + '/api/stock-batches', {
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
    const res = await fetch(API_BASE_URL + '/api/stock-batches/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, fromHubId, toHubId })
    });
    
    if (res.ok) {
      // Refetch stocks to get updated quantities
      const stocksRes = await fetch(API_BASE_URL + '/api/stock-batches');
      if (stocksRes.ok) {
        setStockBatches(await stocksRes.json());
      }
    } else {
      throw new Error("Transfer failed");
    }
  };

  const addStockRequest = async (req: Partial<StockRequest>) => {
    const res = await fetch(API_BASE_URL + '/api/stock-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (res.ok) {
      const newReq = await res.json();
      setStockRequests(prev => [...prev, newReq]);

      // Notify Super Admins
      const superAdmins = users.filter(u => u.role === UserRole.SUPER_ADMIN);
      const toEmails = superAdmins.map(u => u.email).filter(e => e);
      if (toEmails.length > 0) {
          try {
              const hubName = hubs.find(h => h.id === req.hubId)?.name || req.hubId;
              const productNames = req.items?.map(i => {
                  const p = products.find(prod => prod.id === i.productId);
                  return `${p?.name || i.productId} (x${i.quantity})`;
              }).join(', ');
              
              await fetch(API_BASE_URL + '/api/send-email', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     to: toEmails.join(','),
                     subject: `System Notification: New Stock Request from ${hubName}`,
                     html: `<p>A new stock request has been submitted by <b>${hubName}</b>.</p><p><b>Items:</b> ${productNames}</p><p><a href="${window.location.origin}/inventory">View in the ERP</a></p>`,
                 })
              });
          } catch(err) {
              console.error("Failed to send email notif");
          }
      }
    }
  };

  const updateStockRequest = async (id: string, updates: Partial<StockRequest>) => {
    const res = await fetch(API_BASE_URL + `/api/stock-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedReq = await res.json();
      setStockRequests(prev => prev.map(r => r.id === id ? updatedReq : r));

      if (updates.status && updates.status !== 'PENDING') {
          const req = stockRequests.find(r => r.id === id);
          if (req) {
              const hubUsers = users.filter(u => u.hubId === req.hubId);
              const toEmails = hubUsers.map(u => u.email).filter(e => e);
              if (toEmails.length > 0) {
                   try {
                       await fetch(API_BASE_URL + '/api/send-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              to: toEmails.join(','),
                              subject: `System Notification: Stock Request ${updates.status}`,
                              html: `<p>Your stock request has been <b>${updates.status}</b>.</p><p><a href="${window.location.origin}/inventory">View in the ERP</a></p>`,
                          })
                       });
                   } catch(err) {
                       console.error("Failed to send email notif");
                   }
              }
          }
      }
    }
  };

  const addMessage = async (msg: Partial<Message>) => {
    const res = await fetch(API_BASE_URL + '/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
    if (res.ok) {
      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
    }
  };

  const addCustomer = async (customer: Customer) => {
    const res = await fetch(API_BASE_URL + '/api/customers', {
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
    const res = await fetch(API_BASE_URL + `/api/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedCustomer = await res.json();
      setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
    }
  };

  const deleteCustomer = async (customerId: string) => {
    const res = await fetch(API_BASE_URL + `/api/customers/${customerId}`, { method: 'DELETE' });
    if (res.ok) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    }
  };

  const createInvoice = async (invoice: Invoice) => {
    const res = await fetch(API_BASE_URL + '/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    
    if (res.ok) {
      const { invoice: newInvoice, transaction } = await res.json();
      setInvoices(prev => [...prev, newInvoice]);
      setTransactions(prev => [...prev, transaction]);
      
      // Refetch stocks as they are deducted on server
      const stocksRes = await fetch(API_BASE_URL + '/api/stock-batches');
      if (stocksRes.ok) {
        setStockBatches(await stocksRes.json());
      }
      const returnsRes = await fetch(API_BASE_URL + '/api/return-records');
      if (returnsRes.ok) {
        setReturnRecords(await returnsRes.json());
      }
    } else {
        const errorText = await res.text();
        console.error("Failed to create invoice:", errorText);
        throw new Error(`Failed to create invoice: ${errorText}`);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    const res = await fetch(API_BASE_URL + `/api/invoices/${invoiceId}`, { method: 'DELETE' });
    if (res.ok) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>) => {
    const res = await fetch(API_BASE_URL + `/api/invoices/${invoiceId}`, {
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
    const res = await fetch(API_BASE_URL + '/api/transactions', {
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
    const res = await fetch(API_BASE_URL + '/api/salary-slips', {
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
    const res = await fetch(API_BASE_URL + '/api/products', {
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
    const res = await fetch(API_BASE_URL + '/api/return-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    
    if (res.ok) {
      const newRecord = await res.json();
      setReturnRecords(prev => [...prev, newRecord]);
      
      // Refetch stocks if deduction happened
      if (record.reason === 'EXPIRED' || record.reason === 'DAMAGED_BOX') {
        const stocksRes = await fetch(API_BASE_URL + '/api/stock-batches');
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
      hubs, addHub, updateHub, deleteHub,
      products, addProduct,
      stocks, stockBatches, addStockBatch, transferStock,
      stockRequests, addStockRequest, updateStockRequest,
      messages, addMessage,
      customers, addCustomer, updateCustomer, deleteCustomer,
      invoices, createInvoice, deleteInvoice, updateInvoice,
      transactions, addTransaction,
      salarySlips, addSalarySlip,
      returnRecords, addReturnRecord,
      formatCurrency, companySettings, updateCompanySettings
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
