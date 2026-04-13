import express from 'express';
import { createServer as createViteServer } from 'vite';
import { 
  User, Hub, Product, StockBatch, Invoice, Customer, Transaction, SalarySlip, ReturnRecord, UserRole 
} from './types';
import { 
  INITIAL_USERS, INITIAL_HUBS, INITIAL_PRODUCTS, INITIAL_STOCKS, INITIAL_CUSTOMERS 
} from './constants';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store
let users: User[] = [...INITIAL_USERS];
let hubs: Hub[] = [...INITIAL_HUBS];
let products: Product[] = [...INITIAL_PRODUCTS];
let stockBatches: StockBatch[] = INITIAL_STOCKS.map((s, index) => ({
  id: `batch-init-${index}`,
  productId: s.productId,
  hubId: s.hubId,
  quantity: s.quantity,
  originalQuantity: s.quantity,
  receivedDate: new Date().toISOString(),
  batchNumber: `INIT-${index}`,
}));
let customers: Customer[] = [...INITIAL_CUSTOMERS];
let invoices: Invoice[] = [];
let transactions: Transaction[] = [];
let salarySlips: SalarySlip[] = [];
let returnRecords: ReturnRecord[] = [];

// --- API Routes ---

// Users
app.get('/api/users', (req, res) => res.json(users));
app.post('/api/users', (req, res) => {
  const user = req.body;
  users.push(user);
  res.status(201).json(user);
});
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  users = users.map(u => u.id === id ? { ...u, ...updates } : u);
  res.json(users.find(u => u.id === id));
});
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.filter(u => u.id !== id);
  res.status(204).send();
});

// Hubs
app.get('/api/hubs', (req, res) => res.json(hubs));

// Products
app.get('/api/products', (req, res) => res.json(products));
app.post('/api/products', (req, res) => {
  const product = req.body;
  products.push(product);
  res.status(201).json(product);
});

// Stocks (Batches)
app.get('/api/stock-batches', (req, res) => res.json(stockBatches));
app.post('/api/stock-batches', (req, res) => {
  const batch = req.body;
  stockBatches.push(batch);
  res.status(201).json(batch);
});
app.post('/api/stock-batches/transfer', (req, res) => {
  const { items, fromHubId, toHubId } = req.body;
  
  const newBatches: StockBatch[] = [];
  
  for (const item of items) {
    const { productId, qty } = item;
    
    // Sort batches by date (FIFO)
    const sourceBatches = stockBatches
      .filter(b => b.productId === productId && b.hubId === fromHubId && b.quantity > 0)
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

    const totalAvailable = sourceBatches.reduce((acc, b) => acc + b.quantity, 0);
    if (totalAvailable < qty) {
      return res.status(400).json({ error: `Insufficient stock for product ${productId}` });
    }

    let remainingToTransfer = qty;
    
    // Deduct from source batches
    for (const batch of sourceBatches) {
      if (remainingToTransfer <= 0) break;
      
      const deduct = Math.min(batch.quantity, remainingToTransfer);
      const batchIndex = stockBatches.findIndex(b => b.id === batch.id);
      
      if (batchIndex >= 0) {
        stockBatches[batchIndex] = {
          ...stockBatches[batchIndex],
          quantity: stockBatches[batchIndex].quantity - deduct
        };
        remainingToTransfer -= deduct;
      }
    }

    // Add to destination
    const newBatch: StockBatch = {
      id: `batch-transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      hubId: toHubId,
      quantity: qty,
      originalQuantity: qty,
      receivedDate: new Date().toISOString(),
      batchNumber: `TRF-${Date.now()}`
    };
    stockBatches.push(newBatch);
    newBatches.push(newBatch);
  }

  res.json({ message: "Transfer successful", newBatches });
});

// Customers
app.get('/api/customers', (req, res) => res.json(customers));
app.post('/api/customers', (req, res) => {
  const customer = req.body;
  customers.push(customer);
  res.status(201).json(customer);
});
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  customers = customers.map(c => c.id === id ? { ...c, ...updates } : c);
  res.json(customers.find(c => c.id === id));
});

// Invoices
app.get('/api/invoices', (req, res) => res.json(invoices));
app.post('/api/invoices', (req, res) => {
  const invoice = req.body;
  
  // Deduct Stock (FIFO)
  invoice.items.forEach((item: any) => {
      let remainingToDeduct = item.quantity;
      const productBatches = stockBatches
          .filter(b => b.productId === item.productId && b.hubId === invoice.hubId && b.quantity > 0)
          .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

      for (const batch of productBatches) {
          if (remainingToDeduct <= 0) break;
          
          const deduct = Math.min(batch.quantity, remainingToDeduct);
          const batchIndex = stockBatches.findIndex(b => b.id === batch.id);
          
          if (batchIndex >= 0) {
              stockBatches[batchIndex] = {
                  ...stockBatches[batchIndex],
                  quantity: stockBatches[batchIndex].quantity - deduct
              };
              remainingToDeduct -= deduct;
          }
      }
  });

  invoices.push(invoice);

  // Add Income Transaction
  const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'INCOME',
      category: 'SALES',
      amount: invoice.totalAmount,
      description: `Invoice #${invoice.id} payment`,
      hubId: invoice.hubId
  };
  transactions.push(transaction);

  res.status(201).json({ invoice, transaction });
});
app.put('/api/invoices/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    invoices = invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv);
    res.json(invoices.find(inv => inv.id === id));
});
app.delete('/api/invoices/:id', (req, res) => {
    const { id } = req.params;
    invoices = invoices.filter(inv => inv.id !== id);
    res.status(204).send();
});

// Transactions
app.get('/api/transactions', (req, res) => res.json(transactions));
app.post('/api/transactions', (req, res) => {
  const transaction = req.body;
  transactions.push(transaction);
  res.status(201).json(transaction);
});

// Salary Slips
app.get('/api/salary-slips', (req, res) => res.json(salarySlips));
app.post('/api/salary-slips', (req, res) => {
  const slip = req.body;
  salarySlips.push(slip);
  
  // Add Expense Transaction
  const transaction: Transaction = {
      id: `txn-sal-${slip.id}`,
      date: new Date().toISOString(),
      type: 'EXPENSE',
      category: 'SALARY',
      amount: slip.netSalary,
      description: `Salary for ${slip.employeeName}`,
      hubId: slip.hubId
  };
  transactions.push(transaction);

  res.status(201).json({ slip, transaction });
});

// Return Records
app.get('/api/return-records', (req, res) => res.json(returnRecords));
app.post('/api/return-records', (req, res) => {
  const record = req.body;
  returnRecords.push(record);

  // Deduct stock if needed
  if (record.reason === 'EXPIRED' || record.reason === 'DAMAGED_BOX') {
      let remainingToDeduct = record.quantity;
      const productBatches = stockBatches
          .filter(b => b.productId === record.productId && b.hubId === record.hubId && b.quantity > 0)
          .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

      for (const batch of productBatches) {
          if (remainingToDeduct <= 0) break;
          
          const deduct = Math.min(batch.quantity, remainingToDeduct);
          const batchIndex = stockBatches.findIndex(b => b.id === batch.id);
          
          if (batchIndex >= 0) {
              stockBatches[batchIndex] = {
                  ...stockBatches[batchIndex],
                  quantity: stockBatches[batchIndex].quantity - deduct
              };
              remainingToDeduct -= deduct;
          }
      }
  }

  res.status(201).json(record);
});


// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
