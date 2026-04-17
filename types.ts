export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HUB_ADMIN = 'HUB_ADMIN',
  FINANCIAL_MANAGER = 'FINANCIAL_MANAGER',
  STAFF = 'STAFF',
}

export interface Hub {
  id: string;
  name: string;
  location: string;
  adminId?: string; // Links to a User
}

export interface User {
  id: string;
  username: string; // Kept for display, but login uses email
  email: string;
  password?: string; // In a real app, this would be hashed
  employeeId: string; // Unique register number
  fullName: string;
  role: UserRole;
  jobTitle: string;
  hubId?: string; // If null, belongs to Head Office
  permissions: string[]; // e.g., 'view_finance', 'create_invoice'
  phone?: string;
  basicSalary?: number;
  bonuses?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  description?: string;
}

export interface StockBatch {
  id: string;
  productId: string;
  hubId: string;
  quantity: number;
  originalQuantity: number;
  receivedDate: string;
  expiryDate?: string;
  batchNumber: string;
}

export interface Stock {
  productId: string;
  hubId: string; // 'HEAD_OFFICE' for main stock
  quantity: number;
}

export interface ReturnRecord {
  id: string;
  productId: string;
  hubId: string;
  quantity: number;
  reason: 'EXPIRED' | 'DAMAGED_BOX' | 'CUSTOMER_RETURN' | 'OTHER';
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  invoiceId?: string;
}

export interface Customer {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  address: string;
  hubId: string;
  salesPersonId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: 'REGISTERED' | 'GUEST';
  email?: string;
  buyingLimit?: number;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  address: string;
  email: string;
  phone: string;
  tagline: string;
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  priceAtSale: number;
}

export interface Invoice {
  id: string;
  date: string; // ISO String
  customerId: string;
  customerName: string; // Store snapshot
  hubId: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  createdBy: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'SALES' | 'SALARY' | 'RESTOCKING' | 'OPERATIONAL' | 'OTHER';
  amount: number;
  description: string;
  hubId?: string; // Optional if head office expense
}

export interface SalarySlip {
  id: string;
  employeeName: string;
  role: string;
  hubId: string; // Linked to the hub the employee belongs to
  month: string;
  basicSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  dateGenerated: string;
}
