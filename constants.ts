import { Hub, Product, Stock, User, UserRole, Customer } from "./types";

export const HEAD_OFFICE_ID = 'HEAD_OFFICE';

export const INITIAL_HUBS: Hub[] = [
  { id: 'hub-001', name: 'North District Hub', location: 'Industrial Zone A' },
  { id: 'hub-002', name: 'City Center Hub', location: 'Downtown Market' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p-001', name: 'Sun Cola 300ml', sku: 'SC-300', costPrice: 15, sellingPrice: 25 },
  { id: 'p-002', name: 'Sun Cola 1.5L', sku: 'SC-1500', costPrice: 45, sellingPrice: 70 },
  { id: 'p-003', name: 'Sun Orange 300ml', sku: 'SO-300', costPrice: 15, sellingPrice: 25 },
  { id: 'p-004', name: 'Sun Lemon 500ml', sku: 'SL-500', costPrice: 25, sellingPrice: 40 },
];

export const INITIAL_STOCKS: Stock[] = [
  // Head Office Stock
  { productId: 'p-001', hubId: HEAD_OFFICE_ID, quantity: 50000 },
  { productId: 'p-002', hubId: HEAD_OFFICE_ID, quantity: 20000 },
  { productId: 'p-003', hubId: HEAD_OFFICE_ID, quantity: 30000 },
  { productId: 'p-004', hubId: HEAD_OFFICE_ID, quantity: 25000 },
  // Hub 1 Stock
  { productId: 'p-001', hubId: 'hub-001', quantity: 1200 },
  { productId: 'p-002', hubId: 'hub-001', quantity: 500 },
  // Hub 2 Stock
  { productId: 'p-001', hubId: 'hub-002', quantity: 800 },
];

export const INITIAL_USERS: User[] = [
  { 
    id: 'u-admin', 
    username: 'admin',
    email: 'admin@suncola.com',
    password: 'password123',
    employeeId: 'EMP-001',
    fullName: 'Super Admin', 
    role: UserRole.SUPER_ADMIN, 
    jobTitle: 'Chief Executive Officer',
    permissions: ['all'],
    phone: '999999999',
    basicSalary: 250000,
    bonuses: 50000
  },
  { 
    id: 'u-finance', 
    username: 'finance',
    email: 'finance@suncola.com',
    password: 'password123',
    employeeId: 'EMP-002',
    fullName: 'Finance Manager', 
    role: UserRole.FINANCIAL_MANAGER, 
    jobTitle: 'Finance Manager',
    permissions: ['view_finance', 'manage_salary'],
    phone: '555555555',
    basicSalary: 180000,
    bonuses: 20000
  },
  { 
    id: 'u-hub1', 
    username: 'hub1admin', 
    email: 'hub1@suncola.com',
    password: 'password123',
    employeeId: 'EMP-003',
    fullName: 'North Hub Manager', 
    role: UserRole.HUB_ADMIN, 
    jobTitle: 'Hub Manager',
    hubId: 'hub-001', 
    permissions: ['manage_hub', 'create_invoice', 'view_stock'],
    phone: '888888888',
    basicSalary: 120000,
    bonuses: 10000
  },
  {
    id: 'u-staff1',
    username: 'staff1',
    email: 'staff1@suncola.com',
    password: 'password123',
    employeeId: 'EMP-004',
    fullName: 'Sales Person John',
    role: UserRole.STAFF,
    jobTitle: 'Sales Executive',
    hubId: 'hub-001',
    permissions: ['create_invoice'],
    phone: '777777777',
    basicSalary: 60000,
    bonuses: 5000
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { 
    id: 'c-001', 
    name: 'General Guest', 
    shopName: 'Guest Shop',
    phone: '0000000000', 
    type: 'GUEST', 
    hubId: 'hub-001', // Default to first hub for guest
    status: 'APPROVED',
    address: 'N/A'
  },
  { 
    id: 'c-002', 
    name: 'ABC Mart Owner', 
    shopName: 'ABC Mart',
    phone: '1234567890', 
    type: 'REGISTERED', 
    address: '123 Main St',
    hubId: 'hub-001',
    status: 'APPROVED',
    buyingLimit: 100000
  }
];
