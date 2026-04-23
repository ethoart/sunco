import React from 'react';
import { SalarySlip, User, Hub } from '../types';

interface SalarySlipTemplateProps {
  slip: SalarySlip;
  employee?: User;
  hub?: Hub;
}

export const SalarySlipTemplate: React.FC<SalarySlipTemplateProps> = ({ slip, employee, hub }) => {
  return (
    <div id={`salary-slip-${slip.id}`} className="hidden print:block p-8 bg-white text-black max-w-3xl mx-auto">
      <div className="border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">SUN COLA</h1>
            <p className="text-sm text-slate-600 mt-1">Beverage Distribution Co.</p>
            <p className="text-sm text-slate-600">Head Office: Colombo, Sri Lanka</p>
            <p className="text-sm text-slate-600">Phone: +94 11 234 5678</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-800">SALARY SLIP</h2>
            <p className="text-slate-600 font-medium mt-1">{slip.month}</p>
            <p className="text-sm text-slate-500">Generated: {new Date(slip.dateGenerated).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Employee Details</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Name:</span> {slip.employeeName}</p>
            <p><span className="font-medium">ID:</span> {employee?.employeeId || 'N/A'}</p>
            <p><span className="font-medium">Role:</span> {slip.role}</p>
            <p><span className="font-medium">Hub:</span> {hub?.name || 'Head Office'}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Pay Period</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Month:</span> {slip.month}</p>
            <p><span className="font-medium">Payment Date:</span> {new Date(slip.dateGenerated).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-3 text-left font-bold text-slate-700">Description</th>
              <th className="border border-slate-300 p-3 text-right font-bold text-slate-700">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-3">Basic Salary</td>
              <td className="border border-slate-300 p-3 text-right">{slip.basicSalary.toFixed(2)}</td>
            </tr>
            {employee?.petrolAllowance ? (
            <tr>
              <td className="border border-slate-300 p-3 text-slate-500 text-sm">-- Petrol Allowance</td>
              <td className="border border-slate-300 p-3 text-right text-sm">({employee.petrolAllowance.toFixed(2)})</td>
            </tr>
            ) : null}
            {employee?.bikeAllowance ? (
            <tr>
              <td className="border border-slate-300 p-3 text-slate-500 text-sm">-- Bike Allowance</td>
              <td className="border border-slate-300 p-3 text-right text-sm">({employee.bikeAllowance.toFixed(2)})</td>
            </tr>
            ) : null}
            <tr>
              <td className="border border-slate-300 p-3">Bonuses / Total Allowances</td>
              <td className="border border-slate-300 p-3 text-right text-green-600">+{slip.bonus.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 p-3">Deductions (Tax, EPF, etc.)</td>
              <td className="border border-slate-300 p-3 text-right text-red-600">-{slip.deductions.toFixed(2)}</td>
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td className="border border-slate-300 p-3 text-right">NET SALARY</td>
              <td className="border border-slate-300 p-3 text-right text-lg">{slip.netSalary.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 pt-8 mt-12">
        <div className="flex justify-between items-end">
          <div className="text-center w-48">
            <div className="border-b border-slate-400 mb-2 h-10"></div>
            <p className="text-xs text-slate-500">Employee Signature</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-slate-400 mb-2 h-10"></div>
            <p className="text-xs text-slate-500">Authorized Signature</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-400">
        <p>This is a computer-generated document. No signature is required.</p>
      </div>
    </div>
  );
};
