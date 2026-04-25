import React, { useState, useRef } from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole } from '../types';
import { DollarSign, Wallet, FileText, PieChart as PieChartIcon, Building2, Users, Printer, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SalarySlipTemplate } from '../components/SalarySlipTemplate';

const Finance = () => {
  const { currentUser, transactions, addSalarySlip, salarySlips, formatCurrency, hubs, users, addTransaction, invoices } = useERP();
  const [activeTab, setActiveTab] = useState<'PNL' | 'SALARY' | 'EXPENSES'>('PNL');
  
  // Salary Form
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [basicSalary, setBasicSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  
  // Expense Form
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState<'OPERATIONAL' | 'RESTOCKING' | 'OTHER'>('OPERATIONAL');

  const [selectedHubId, setSelectedHubId] = useState<string>(''); // For SA filtering

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isFinancialManager = currentUser?.role === UserRole.FINANCIAL_MANAGER;
  const isHubAdmin = currentUser?.role === UserRole.HUB_ADMIN;

  if (!isSuperAdmin && !isFinancialManager && !isHubAdmin) {
      return <div className="text-red-500">Access Denied</div>;
  }

  // Determine which transactions/users to show
  const targetHubId = isSuperAdmin || isFinancialManager ? selectedHubId : currentUser?.hubId;
  
  const filteredTransactions = transactions.filter(t => 
    targetHubId ? t.hubId === targetHubId : true
  );

  const filteredSalarySlips = salarySlips.filter(s => 
    targetHubId ? s.hubId === targetHubId : true
  );

  // Filter users based on selected hub (or current user's hub)
  const availableEmployees = users.filter(u => 
    targetHubId ? u.hubId === targetHubId : true
  );

  // Financial Calcs
  const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((acc, c) => acc + c.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, c) => acc + c.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const dataPnl = [
      { name: 'Income', value: totalIncome, color: '#10b981' },
      { name: 'Expense', value: totalExpense, color: '#ef4444' }
  ];

  const { companySettings } = useERP();

  // Hub-wise Aggregation (Only for SA/FM)
  const hubStats = hubs.map(hub => {
      const hubTxns = transactions.filter(t => t.hubId === hub.id);
      const income = hubTxns.filter(t => t.type === 'INCOME').reduce((acc, c) => acc + c.amount, 0);
      const expense = hubTxns.filter(t => t.type === 'EXPENSE').reduce((acc, c) => acc + c.amount, 0);
      const empCount = users.filter(u => u.hubId === hub.id).length;
      const totalSalaries = salarySlips.filter(s => s.hubId === hub.id).reduce((acc, s) => acc + s.netSalary, 0);
      
      return { ...hub, income, expense, netProfit: income - expense, empCount, totalSalaries };
  });

  const handleSelectEmployee = (empId: string) => {
      setSelectedEmpId(empId);
      const employee = users.find(u => u.id === empId);
      if (employee) {
          setBasicSalary(employee.basicSalary || 0);
          
          let calculatedBonus = employee.bonuses || 0;
          let calculatedAllocations = 0;

          // Add Petrol and Bike allowance
          if (employee.petrolAllowance) calculatedAllocations += employee.petrolAllowance;
          if (employee.bikeAllowance) calculatedAllocations += employee.bikeAllowance;

          // Check if salesperson achieved target
          const employeeInvoices = invoices.filter(inv => inv.createdBy === employee.id);
          const totalSales = employeeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

          const targetThreshold = companySettings?.salesTargetThreshold || 1000000;
          const targetBonusPct = companySettings?.salesTargetBonusPercentage || 5;

          if (totalSales >= targetThreshold) {
              const salesBonus = totalSales * (targetBonusPct / 100);
              calculatedBonus += salesBonus;
          }

          // Add allowances to the flat basic salary to make it appear separated, or lump it as bonus
          setBonus(calculatedBonus + calculatedAllocations);
      } else {
          setBasicSalary(0);
          setBonus(0);
      }
      setDeductions(0);
  };

  const handleCreateSalary = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedEmpId || basicSalary <= 0) return;

      const employee = users.find(u => u.id === selectedEmpId);
      if (!employee) return;

      const netSalary = basicSalary + bonus - deductions;
      
      addSalarySlip({
          id: Date.now().toString(),
          employeeName: employee.fullName,
          role: employee.role,
          hubId: employee.hubId || 'HEAD_OFFICE',
          month: salaryMonth,
          basicSalary,
          bonus,
          deductions,
          netSalary,
          dateGenerated: new Date().toISOString()
      });

      // Reset Form
      setSelectedEmpId('');
      setBasicSalary(0);
      setBonus(0);
      setDeductions(0);
      alert("Salary Slip Generated!");
  };

  const handleAddExpense = (e: React.FormEvent) => {
      e.preventDefault();
      if (!expenseDesc || expenseAmount <= 0) return;

      const expenseHubId = (isSuperAdmin || isFinancialManager) 
        ? (selectedHubId || 'HEAD_OFFICE') 
        : currentUser?.hubId!;

      addTransaction({
          id: `txn-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'EXPENSE',
          category: expenseCategory,
          amount: expenseAmount,
          description: expenseDesc,
          hubId: expenseHubId
      });

      setExpenseDesc('');
      setExpenseAmount(0);
      alert("Expense Recorded!");
  };

  const handlePrintSalary = (slipId: string) => {
      const printContent = document.getElementById(`salary-slip-${slipId}`);
      if (printContent) {
          const originalContents = document.body.innerHTML;
          const printContents = printContent.innerHTML;
          
          // Create a temporary container for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Print Salary Slip</title>
                  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                </head>
                <body class="p-8">
                  ${printContents}
                  <script>
                    window.onload = function() { window.print(); window.close(); }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
      } else {
          alert("Error preparing print document");
      }
  };

  return (
    <div className="space-y-6">
      {/* Hidden Templates for Printing */}
      <div className="hidden">
        {salarySlips.map(slip => (
            <SalarySlipTemplate 
                key={slip.id} 
                slip={slip} 
                employee={users.find(u => u.fullName === slip.employeeName)} // Simple match for demo
                hub={hubs.find(h => h.id === slip.hubId)}
            />
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex space-x-4">
            <button 
                onClick={() => setActiveTab('PNL')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'PNL' ? 'bg-sun-100 text-sun-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <PieChartIcon className="mr-2 h-5 w-5" />
                Profit & Loss
            </button>
            <button 
                onClick={() => setActiveTab('SALARY')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'SALARY' ? 'bg-sun-100 text-sun-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Wallet className="mr-2 h-5 w-5" />
                Payroll
            </button>
            <button 
                onClick={() => setActiveTab('EXPENSES')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'EXPENSES' ? 'bg-sun-100 text-sun-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <DollarSign className="mr-2 h-5 w-5" />
                Expenses
            </button>
        </div>

        {(isSuperAdmin || isFinancialManager) && (
            <select 
                className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-sun-500"
                value={selectedHubId}
                onChange={(e) => setSelectedHubId(e.target.value)}
            >
                <option value="">All Hubs (Global View)</option>
                <option value="HEAD_OFFICE">Head Office</option>
                {hubs.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                ))}
            </select>
        )}
      </div>

      {activeTab === 'PNL' && (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 font-medium mb-2">Total Income</div>
                    <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalIncome)}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 font-medium mb-2">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalExpense)}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 font-medium mb-2">Net Profit</div>
                    <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ratio Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Income vs Expense Ratio</h2>
                    <div className="flex justify-center w-full">
                        <PieChart width={300} height={300}>
                            <Pie 
                                data={dataPnl} 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                            >
                                {dataPnl.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                    </div>
                    <div className="flex space-x-6 mt-4">
                        {dataPnl.map((item, idx) => (
                            <div key={idx} className="flex items-center text-sm">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                <span className="text-slate-600">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hub Breakdown Table (Only visible to SA/FM when viewing All Hubs) */}
                {(isSuperAdmin || isFinancialManager) && !selectedHubId && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h2 className="font-bold text-slate-700">Hub Performance Breakdown</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hub</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Income</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Expense</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {hubStats.map(hub => (
                                        <tr key={hub.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{hub.name}</td>
                                            <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(hub.income)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(hub.expense)}</td>
                                            <td className={`px-4 py-3 text-sm text-right font-bold ${hub.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                {formatCurrency(hub.netProfit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'SALARY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Generate Salary Slip</h2>
                <form onSubmit={handleCreateSalary} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Select Employee</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                            value={selectedEmpId}
                            onChange={e => handleSelectEmployee(e.target.value)}
                            required
                        >
                            <option value="">Select Employee</option>
                            {availableEmployees.map(u => (
                                <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Month</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                            value={salaryMonth}
                            onChange={e => setSalaryMonth(e.target.value)}
                        >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Basic Salary (LKR)</label>
                        <input 
                            type="number" required min="0"
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                            value={basicSalary} onChange={e => setBasicSalary(parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Bonus</label>
                            <input 
                                type="number" min="0"
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                                value={bonus} onChange={e => setBonus(parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Deductions</label>
                            <input 
                                type="number" min="0"
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                                value={deductions} onChange={e => setDeductions(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex justify-between font-bold text-slate-800 mb-4">
                            <span>Net Salary:</span>
                            <span>{formatCurrency(basicSalary + bonus - deductions)}</span>
                        </div>
                        <button className="w-full py-2 bg-sun-600 text-white rounded-lg hover:bg-sun-700 shadow-md">
                            Generate Slip
                        </button>
                    </div>
                </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-bold text-slate-700">Salary Slips</h2>
                        {selectedHubId && <span className="text-xs bg-sun-100 text-sun-800 px-2 py-1 rounded-full">{hubs.find(h => h.id === selectedHubId)?.name}</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Month</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Net Pay</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredSalarySlips.map(slip => (
                                    <tr key={slip.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{slip.employeeName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{slip.month}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-700">{formatCurrency(slip.netSalary)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handlePrintSalary(slip.id)}
                                                className="text-slate-600 hover:text-sun-600"
                                                title="Print Slip"
                                            >
                                                <Printer size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSalarySlips.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-6 text-slate-400">No records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'EXPENSES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Record Expense</h2>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                          <input 
                              type="text" required
                              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                              value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)}
                              placeholder="e.g., Office Rent, Electricity Bill"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Amount (LKR)</label>
                          <input 
                              type="number" required min="1"
                              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                              value={expenseAmount} onChange={e => setExpenseAmount(parseFloat(e.target.value))}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
                              value={expenseCategory}
                              onChange={e => setExpenseCategory(e.target.value as any)}
                          >
                              <option value="OPERATIONAL">Operational</option>
                              <option value="RESTOCKING">Restocking</option>
                              <option value="OTHER">Other</option>
                          </select>
                      </div>
                      <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md">
                          Record Expense
                      </button>
                  </form>
              </div>

              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-200 bg-slate-50">
                          <h2 className="font-bold text-slate-700">Recent Expenses</h2>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-white">
                                  <tr>
                                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Description</th>
                                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Category</th>
                                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Amount</th>
                                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                  {filteredTransactions.filter(t => t.type === 'EXPENSE').map(txn => (
                                      <tr key={txn.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{txn.description}</td>
                                          <td className="px-6 py-4 text-sm text-slate-500">
                                              <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{txn.category}</span>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-right font-bold text-red-600">{formatCurrency(txn.amount)}</td>
                                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(txn.date).toLocaleDateString()}</td>
                                      </tr>
                                  ))}
                                  {filteredTransactions.filter(t => t.type === 'EXPENSE').length === 0 && (
                                      <tr><td colSpan={4} className="text-center py-6 text-slate-400">No expenses found</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;
