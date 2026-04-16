import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  User, Hub, Product, StockBatch, Invoice, Customer, Transaction, SalarySlip, ReturnRecord, UserRole 
} from './types';
import { 
  INITIAL_USERS, INITIAL_HUBS, INITIAL_PRODUCTS, INITIAL_STOCKS, INITIAL_CUSTOMERS 
} from './constants';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MongoDB Connection & Models
const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
      await seedDatabase();
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.log('No MONGODB_URI provided. Please set it in .env');
  }
};

// --- Mongoose Schemas ---
const userSchema = new mongoose.Schema({ id: String, name: String, fullName: String, email: String, password: String, role: String, hubId: String, status: String }, { versionKey: false });
const UserModel = mongoose.model('User', userSchema);

const hubSchema = new mongoose.Schema({ id: String, name: String, location: String, managerId: String, contactNumber: String, status: String }, { versionKey: false });
const HubModel = mongoose.model('Hub', hubSchema);

const productSchema = new mongoose.Schema({ id: String, name: String, category: String, sku: String, unit: String, purchasePrice: Number, sellingPrice: Number, minStockLevel: Number }, { versionKey: false });
const ProductModel = mongoose.model('Product', productSchema);

const stockBatchSchema = new mongoose.Schema({ id: String, productId: String, hubId: String, quantity: Number, originalQuantity: Number, receivedDate: String, expiryDate: String, batchNumber: String }, { versionKey: false });
const StockBatchModel = mongoose.model('StockBatch', stockBatchSchema);

const customerSchema = new mongoose.Schema({ id: String, name: String, shopName: String, phone: String, address: String, type: String, hubId: String, status: String }, { versionKey: false });
const CustomerModel = mongoose.model('Customer', customerSchema);

const invoiceItemSchema = new mongoose.Schema({ productId: String, quantity: Number, priceAtSale: Number }, { _id: false });
const invoiceSchema = new mongoose.Schema({ id: String, date: String, customerId: String, customerName: String, hubId: String, items: [invoiceItemSchema], totalAmount: Number, status: String, createdBy: String }, { versionKey: false });
const InvoiceModel = mongoose.model('Invoice', invoiceSchema);

const transactionSchema = new mongoose.Schema({ id: String, date: String, type: String, category: String, amount: Number, description: String, hubId: String }, { versionKey: false });
const TransactionModel = mongoose.model('Transaction', transactionSchema);

const salarySlipSchema = new mongoose.Schema({ id: String, employeeId: String, employeeName: String, month: String, year: Number, basicSalary: Number, allowances: Number, deductions: Number, netSalary: Number, status: String, hubId: String }, { versionKey: false });
const SalarySlipModel = mongoose.model('SalarySlip', salarySlipSchema);

const returnRecordSchema = new mongoose.Schema({ id: String, date: String, productId: String, hubId: String, quantity: Number, reason: String, status: String, approvedBy: String }, { versionKey: false });
const ReturnRecordModel = mongoose.model('ReturnRecord', returnRecordSchema);

// --- Database Seeding ---
async function seedDatabase() {
  if ((await UserModel.countDocuments()) === 0) {
    console.log('Seeding initial data...');
    let initialUsers = [...INITIAL_USERS];
    if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
      const adminIndex = initialUsers.findIndex(u => u.role === UserRole.SUPER_ADMIN);
      if (adminIndex >= 0) {
        initialUsers[adminIndex].email = process.env.SUPER_ADMIN_EMAIL;
        initialUsers[adminIndex].password = process.env.SUPER_ADMIN_PASSWORD;
      } else {
        initialUsers.push({ id: 'admin-env', name: 'Super Admin', fullName: 'System Super Admin', email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD, role: UserRole.SUPER_ADMIN, hubId: 'HEAD_OFFICE', status: 'ACTIVE' });
      }
    }
    await UserModel.insertMany(initialUsers);
    await HubModel.insertMany(INITIAL_HUBS);
    await ProductModel.insertMany(INITIAL_PRODUCTS);
    await CustomerModel.insertMany(INITIAL_CUSTOMERS);
    
    const initialBatches = INITIAL_STOCKS.map((s, index) => ({
      id: `batch-init-${index}`, productId: s.productId, hubId: s.hubId,
      quantity: s.quantity, originalQuantity: s.quantity,
      receivedDate: new Date().toISOString(), batchNumber: `INIT-${index}`,
    }));
    await StockBatchModel.insertMany(initialBatches);
    console.log('Seeding complete.');
  }
}

// --- API Routes ---

// Users
app.get('/api/users', async (req, res) => res.json(await UserModel.find({}, '-_id')));
app.post('/api/users', async (req, res) => {
  const user = await UserModel.create(req.body);
  res.status(201).json(user);
});
app.put('/api/users/:id', async (req, res) => {
  const user = await UserModel.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(user);
});
app.delete('/api/users/:id', async (req, res) => {
  await UserModel.findOneAndDelete({ id: req.params.id });
  res.status(204).send();
});

// Hubs
app.get('/api/hubs', async (req, res) => res.json(await HubModel.find({}, '-_id')));

// Products
app.get('/api/products', async (req, res) => res.json(await ProductModel.find({}, '-_id')));
app.post('/api/products', async (req, res) => {
  const product = await ProductModel.create(req.body);
  res.status(201).json(product);
});

// Stocks (Batches)
app.get('/api/stock-batches', async (req, res) => res.json(await StockBatchModel.find({}, '-_id')));
app.post('/api/stock-batches', async (req, res) => {
  const batch = await StockBatchModel.create(req.body);
  res.status(201).json(batch);
});
app.post('/api/stock-batches/transfer', async (req, res) => {
  const { items, fromHubId, toHubId } = req.body;
  const newBatches = [];
  
  for (const item of items) {
    const { productId, qty } = item;
    const sourceBatches = await StockBatchModel.find({ productId, hubId: fromHubId, quantity: { $gt: 0 } }).sort({ receivedDate: 1 });
    
    const totalAvailable = sourceBatches.reduce((acc, b) => acc + b.quantity, 0);
    if (totalAvailable < qty) {
      return res.status(400).json({ error: `Insufficient stock for product ${productId}` });
    }

    let remainingToTransfer = qty;
    for (const batch of sourceBatches) {
      if (remainingToTransfer <= 0) break;
      const deduct = Math.min(batch.quantity, remainingToTransfer);
      batch.quantity -= deduct;
      await batch.save();
      remainingToTransfer -= deduct;
    }

    const newBatch = await StockBatchModel.create({
      id: `batch-transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId, hubId: toHubId, quantity: qty, originalQuantity: qty,
      receivedDate: new Date().toISOString(), batchNumber: `TRF-${Date.now()}`
    });
    newBatches.push(newBatch);
  }
  res.json({ message: "Transfer successful", newBatches });
});

// Customers
app.get('/api/customers', async (req, res) => res.json(await CustomerModel.find({}, '-_id')));
app.post('/api/customers', async (req, res) => {
  const customer = await CustomerModel.create(req.body);
  res.status(201).json(customer);
});
app.put('/api/customers/:id', async (req, res) => {
  const customer = await CustomerModel.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(customer);
});

// Invoices
app.get('/api/invoices', async (req, res) => res.json(await InvoiceModel.find({}, '-_id')));
app.post('/api/invoices', async (req, res) => {
  const invoice = req.body;
  
  // Deduct Stock (FIFO)
  for (const item of invoice.items) {
      let remainingToDeduct = item.quantity;
      const productBatches = await StockBatchModel.find({ productId: item.productId, hubId: invoice.hubId, quantity: { $gt: 0 } }).sort({ receivedDate: 1 });

      for (const batch of productBatches) {
          if (remainingToDeduct <= 0) break;
          const deduct = Math.min(batch.quantity, remainingToDeduct);
          batch.quantity -= deduct;
          await batch.save();
          remainingToDeduct -= deduct;
      }
  }

  const newInvoice = await InvoiceModel.create(invoice);

  // Add Income Transaction
  const transaction = await TransactionModel.create({
      id: `txn-${Date.now()}`, date: new Date().toISOString(), type: 'INCOME', category: 'SALES',
      amount: invoice.totalAmount, description: `Invoice #${invoice.id} payment`, hubId: invoice.hubId
  });

  res.status(201).json({ invoice: newInvoice, transaction });
});
app.put('/api/invoices/:id', async (req, res) => {
    const invoice = await InvoiceModel.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(invoice);
});
app.delete('/api/invoices/:id', async (req, res) => {
    await InvoiceModel.findOneAndDelete({ id: req.params.id });
    res.status(204).send();
});

// Transactions
app.get('/api/transactions', async (req, res) => res.json(await TransactionModel.find({}, '-_id')));
app.post('/api/transactions', async (req, res) => {
  const transaction = await TransactionModel.create(req.body);
  res.status(201).json(transaction);
});

// Salary Slips
app.get('/api/salary-slips', async (req, res) => res.json(await SalarySlipModel.find({}, '-_id')));
app.post('/api/salary-slips', async (req, res) => {
  const slip = await SalarySlipModel.create(req.body);
  const transaction = await TransactionModel.create({
      id: `txn-sal-${slip.id}`, date: new Date().toISOString(), type: 'EXPENSE', category: 'SALARY',
      amount: slip.netSalary, description: `Salary for ${slip.employeeName}`, hubId: slip.hubId
  });
  res.status(201).json({ slip, transaction });
});

// Return Records
app.get('/api/return-records', async (req, res) => res.json(await ReturnRecordModel.find({}, '-_id')));
app.post('/api/return-records', async (req, res) => {
  const record = await ReturnRecordModel.create(req.body);

  // Deduct stock if needed
  if (record.reason === 'EXPIRED' || record.reason === 'DAMAGED_BOX') {
      let remainingToDeduct = record.quantity;
      const productBatches = await StockBatchModel.find({ productId: record.productId, hubId: record.hubId, quantity: { $gt: 0 } }).sort({ receivedDate: 1 });

      for (const batch of productBatches) {
          if (remainingToDeduct <= 0) break;
          const deduct = Math.min(batch.quantity, remainingToDeduct);
          batch.quantity -= deduct;
          await batch.save();
          remainingToDeduct -= deduct;
      }
  }

  res.status(201).json(record);
});


// Vite Middleware
async function startServer() {
  await connectDB();
  
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
