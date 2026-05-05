import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole, Customer } from '../types';
import { Search, Plus, Check, X, MapPin, Phone, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';

const Customers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currentUser, hubs, invoices, formatCurrency } = useERP();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Customer State
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    shopName: '',
    phone: '',
    address: '',
    type: 'REGISTERED'
  });

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isHubAdmin = currentUser?.role === UserRole.HUB_ADMIN;
  const isStaff = currentUser?.role === UserRole.STAFF;

  // Filter Customers
  const filteredCustomers = customers.filter(c => {
    // Role Filter
    if (isHubAdmin || isStaff) {
      if (c.hubId !== currentUser?.hubId) return false;
    }
    
    // Search Filter
    const searchLower = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.shopName?.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchTerm)
    );
  });

  // Calculate Stats for Super Admin
  const getCustomerStats = (customerId: string) => {
    const customerInvoices = invoices.filter(i => i.customerId === customerId && i.status === 'PAID');
    const totalSales = customerInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalOrders = customerInvoices.length;
    // Mock return quantity for now as we don't track returns per customer yet in a simple way
    const returnQty = 0; 

    return { totalSales, totalOrders, returnQty };
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.shopName || !newCustomer.phone) return;

    addCustomer({
      id: `c-${Date.now()}`,
      name: newCustomer.name!,
      shopName: newCustomer.shopName!,
      phone: newCustomer.phone!,
      address: newCustomer.address || '',
      hubId: currentUser?.hubId || 'hub-001', // Default to current hub or first
      salesPersonId: currentUser?.id,
      status: isSuperAdmin || isHubAdmin ? 'APPROVED' : 'PENDING', // Auto-approve if admin
      type: 'REGISTERED',
      buyingLimit: 50000 // Default limit
    });

    setIsAddModalOpen(false);
    setNewCustomer({ name: '', shopName: '', phone: '', address: '', type: 'REGISTERED' });
    alert(isSuperAdmin || isHubAdmin ? "Customer added successfully!" : "Customer registration submitted for approval.");
  };

  const handleApprove = (customerId: string) => {
    updateCustomer(customerId, { status: 'APPROVED' });
  };

  const handleReject = (customerId: string) => {
    updateCustomer(customerId, { status: 'REJECTED' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Client Management</h1>
          <p className="text-slate-500">Manage customer relationships and approvals.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-sun-600 text-white rounded-lg hover:bg-sun-700 shadow-sm transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Register Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search clients by name, shop, or phone..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Pending Approvals (Admin Only) */}
      {(isSuperAdmin || isHubAdmin) && filteredCustomers.some(c => c.status === 'PENDING') && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Pending Approvals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.filter(c => c.status === 'PENDING').map(customer => (
              <div key={customer.id} className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800">{customer.shopName}</h4>
                    <p className="text-sm text-slate-500">{customer.name}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Pending</span>
                </div>
                <div className="text-sm text-slate-600 space-y-1 mb-4">
                  <div className="flex items-center"><Phone className="h-3 w-3 mr-2" /> {customer.phone}</div>
                  <div className="flex items-center"><MapPin className="h-3 w-3 mr-2" /> {customer.address}</div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleApprove(customer.id)}
                    className="flex-1 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </button>
                  <button 
                    onClick={() => handleReject(customer.id)}
                    className="flex-1 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 flex items-center justify-center"
                  >
                    <X className="h-3 w-3 mr-1" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Client Details</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hub</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                {isSuperAdmin && (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Total Sales</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Buying Limit</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers
                .filter(c => c.status !== 'PENDING' || (!isSuperAdmin && !isHubAdmin)) // Hide pending from main list for admins (shown above)
                .sort((a, b) => {
                    // Rank by buying limit for Super Admin
                    if (isSuperAdmin) return (b.buyingLimit || 0) - (a.buyingLimit || 0);
                    return 0;
                })
                .map(customer => {
                  const stats = getCustomerStats(customer.id);
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-sun-100 flex items-center justify-center text-sun-600 font-bold mr-3">
                            {customer.shopName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{customer.shopName}</div>
                            <div className="text-sm text-slate-500">{customer.name}</div>
                            <div className="text-xs text-slate-400">{customer.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {hubs.find(h => h.id === customer.hubId)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          customer.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                          customer.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {customer.status || 'APPROVED'}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-slate-800">{formatCurrency(stats.totalSales)}</div>
                            <div className="text-xs text-slate-500">{stats.totalOrders} orders</div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                            {formatCurrency(customer.buyingLimit || 0)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => {
                                if (window.confirm("Are you sure you want to delete this client?")) {
                                    deleteCustomer(customer.id);
                                }
                            }} className="text-red-500 hover:text-red-700">
                                <span className="sr-only">Delete</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Register New Client</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none"
                  value={newCustomer.shopName}
                  onChange={e => setNewCustomer({...newCustomer, shopName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 px-4 bg-sun-600 text-white rounded-lg hover:bg-sun-700 shadow-md"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
