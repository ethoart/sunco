import React from 'react';
import { Invoice, Product, Customer } from '../types';

interface InvoiceTemplateProps {
  invoice: Invoice;
  products: Product[];
  customer?: Customer;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, products, customer }) => {
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Item';

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto border border-gray-200 hidden print-only" id={`invoice-${invoice.id}`}>
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-sun-600">INVOICE</h1>
          <p className="text-gray-500">#{invoice.id}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">Sun Cola Pvt Ltd</h2>
          <p className="text-sm text-gray-500">123 Industrial Estate</p>
          <p className="text-sm text-gray-500">Tax ID: 999-888-777</p>
        </div>
      </div>

      <div className="flex justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase">Bill To</h3>
          <p className="font-semibold text-lg">{customer?.name || invoice.customerName}</p>
          {customer?.address && <p className="text-gray-600">{customer.address}</p>}
          <p className="text-gray-600">{customer?.phone}</p>
        </div>
        <div className="text-right">
            <h3 className="text-sm font-bold text-gray-400 uppercase">Date</h3>
            <p className="font-semibold">{new Date(invoice.date).toLocaleDateString()}</p>
            <h3 className="text-sm font-bold text-gray-400 uppercase mt-2">Status</h3>
            <p className="font-semibold text-green-600">{invoice.status}</p>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-2">{getProductName(item.productId)}</td>
              <td className="text-right py-2">{item.quantity}</td>
              <td className="text-right py-2">${item.priceAtSale.toFixed(2)}</td>
              <td className="text-right py-2">${(item.quantity * item.priceAtSale).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-t border-gray-300">
            <span className="font-bold text-xl">Total</span>
            <span className="font-bold text-xl text-sun-600">${invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-gray-400">
        <p>Thank you for your business!</p>
        <p>For inquiries, contact support@suncola.com</p>
      </div>
    </div>
  );
};
