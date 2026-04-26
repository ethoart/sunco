import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Calendar, Building2, CreditCard, MoreHorizontal, Filter, Search, Plus, Package, ChevronDown, X } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, hubs, invoices, transactions, formatCurrency } = useERP();
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'MONTH' | 'YEAR'>('MONTH');
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isFinancialManager = currentUser?.role === UserRole.FINANCIAL_MANAGER;
  
  // Determine the effective hub ID for filtering
  // If Super Admin/Finance: Use selectedHubId if set, otherwise null (show all)
  // If Hub Admin/Staff: Always use their assigned hubId
  const effectiveHubId = (isSuperAdmin || isFinancialManager) ? selectedHubId : currentUser?.hubId;

  // Filter Logic
  const filterByDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (dateFilter === 'TODAY') return date.toDateString() === now.toDateString();
    if (dateFilter === 'MONTH') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (dateFilter === 'YEAR') return date.getFullYear() === now.getFullYear();
    return true;
  };

  const isStaff = currentUser?.role === UserRole.STAFF;

  const filteredInvoices = invoices
    .filter(i => effectiveHubId ? i.hubId === effectiveHubId : true)
    .filter(i => isStaff ? i.createdBy === currentUser?.id : true)
    .filter(i => filterByDate(i.date));

  const filteredTransactions = transactions
    .filter(t => effectiveHubId ? t.hubId === effectiveHubId : true)
    .filter(t => filterByDate(t.date));

  // KPIs
  const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalExpenses = isStaff ? 0 : filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  // Chart Data
  const salesData = hubs.map(hub => {
      const hubSales = invoices.filter(i => i.hubId === hub.id && (!isStaff || i.createdBy === currentUser?.id)).reduce((acc, i) => acc + i.totalAmount, 0);
      return { name: hub.name, sales: hubSales, expenses: hubSales * 0.7 }; // Mock expenses for chart
  });

  const recentInvoices = [...filteredInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const handleHubClick = (hubId: string) => {
    if (isSuperAdmin || isFinancialManager) {
      setSelectedHubId(hubId === selectedHubId ? null : hubId);
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Good morning, {currentUser?.fullName.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1">Stay on top of your tasks, monitor progress, and track status.</p>
        </div>
        
        {/* Active Filter Indicator */}
        {selectedHubId && (
          <div className="flex items-center bg-orange-100 text-orange-800 px-4 py-2 rounded-xl font-bold text-sm">
            <Building2 size={16} className="mr-2" />
            Filtered by: {hubs.find(h => h.id === selectedHubId)?.name}
            <button onClick={() => setSelectedHubId(null)} className="ml-3 hover:text-orange-900">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Balance & Hubs (Col Span 3) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          {/* Total Revenue Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 font-medium">Total Revenue</p>
              
              {/* Date Filter Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  <span>{dateFilter.charAt(0) + dateFilter.slice(1).toLowerCase()}</span>
                  <ChevronDown size={14} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block z-20">
                  {['TODAY', 'MONTH', 'YEAR'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter as any)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    >
                      {filter.charAt(0) + filter.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(totalRevenue)}</h2>
            <div className="flex items-center text-green-600 text-xs font-bold bg-green-50 w-fit px-2 py-1 rounded-md mb-6">
              <TrendingUp size={12} className="mr-1" />
              +12% than last period
            </div>
          </div>

          {/* Hubs List */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Active Hubs</h3>
              <span className="text-xs text-slate-500 font-medium">Total {hubs.length}</span>
            </div>
            <div className="space-y-4">
              {hubs.slice(0, 3).map((hub, idx) => (
                <div 
                  key={hub.id} 
                  onClick={() => handleHubClick(hub.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group border ${
                    selectedHubId === hub.id 
                      ? 'bg-slate-900 border-slate-900 shadow-md' 
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      selectedHubId === hub.id 
                        ? 'bg-slate-800 text-white' 
                        : (idx === 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600')
                    }`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${selectedHubId === hub.id ? 'text-white' : 'text-slate-900'}`}>
                        {hub.name}
                      </p>
                    </div>
                  </div>
                  {(isSuperAdmin || isFinancialManager) && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-lg ${selectedHubId === hub.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      View
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Stats Grid (Col Span 5) */}
        <div className="lg:col-span-8 xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Net Profit - Orange */}
          <div className="bg-orange-500 p-6 rounded-3xl shadow-lg shadow-orange-200 text-white relative overflow-hidden flex flex-col justify-between h-48">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-orange-100 font-medium text-sm mb-1">Net Profit</p>
                <h3 className="text-3xl font-bold">{formatCurrency(netProfit)}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="flex items-center text-sm text-orange-100 font-medium relative z-10">
              <span className="bg-white/20 px-2 py-0.5 rounded mr-2 flex items-center text-xs">
                <TrendingUp size={12} className="mr-1" /> +7%
              </span>
              This month
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Total Spending */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm mb-1">Total Expenses</p>
                <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</h3>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-500 font-medium">
              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded mr-2 flex items-center text-xs">
                <TrendingDown size={12} className="mr-1" /> 5%
              </span>
              This month
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm mb-1">Total Orders</p>
                <h3 className="text-3xl font-bold text-slate-900">{filteredInvoices.length}</h3>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                <Activity size={20} />
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-500 font-medium">
              <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded mr-2 flex items-center text-xs">
                <TrendingUp size={12} className="mr-1" /> 8%
              </span>
              This month
            </div>
          </div>

          {/* Avg Order Value */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm mb-1">Avg. Order Value</p>
                <h3 className="text-3xl font-bold text-slate-900">
                  {formatCurrency(filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0)}
                </h3>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-500 font-medium">
              <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded mr-2 flex items-center text-xs">
                <TrendingUp size={12} className="mr-1" /> 4%
              </span>
              This month
            </div>
          </div>
        </div>

        {/* Right Column: Chart (Col Span 4) */}
        <div className="lg:col-span-12 xl:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Revenue Analytics</h3>
            <p className="text-xs text-slate-500">Income vs Expenses over time</p>
          </div>
          
          <div className="flex items-center justify-between mb-4">
             <div className="text-sm font-bold text-slate-800">Profit and Loss</div>
             <div className="flex space-x-3 text-xs">
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span> Profit</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-900 mr-1"></span> Loss</div>
             </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                />
                <Bar dataKey="sales" fill="#f97316" radius={[2, 2, 2, 2]} stackId="a" />
                <Bar dataKey="expenses" fill="#0f172a" radius={[2, 2, 2, 2]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activities (Full Width) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
          <div className="flex space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search" 
                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full"
              />
            </div>
            <button className="flex items-center px-4 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
              <Filter size={16} className="mr-2" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-400 border-b border-slate-50">
                <th className="pb-4 pl-4 font-medium"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="pb-4 font-medium">Order ID</th>
                <th className="pb-4 font-medium">Customer</th>
                <th className="pb-4 font-medium">Amount</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentInvoices.map((inv, idx) => (
                <tr key={inv.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 pl-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="py-4 text-sm font-medium text-slate-500">#{inv.id}</td>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${idx % 2 === 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {idx % 2 === 0 ? <Activity size={16} /> : <Calendar size={16} />}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{inv.customerName}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-4">
                    <div className="flex items-center text-xs font-medium text-slate-600">
                      <span className={`w-2 h-2 rounded-full mr-2 ${inv.status === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {inv.status === 'PAID' ? 'Completed' : 'Pending'}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="py-4 text-right pr-4">
                    <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
