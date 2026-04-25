import React from 'react';
import { Invoice, Product, Customer, CompanySettings } from '../types';

interface InvoiceTemplateProps {
  invoice: Invoice;
  products: Product[];
  customer?: Customer;
  companySettings?: CompanySettings | null;
  className?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, products, customer, companySettings, className }) => {
  return (
    <div className={`bg-white p-8 max-w-4xl mx-auto text-black font-sans ${className || ''}`} id={`invoice-${invoice.id}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col items-center">
          {/* Logo Placeholder */}
          <div className="w-24 h-24 mb-1 relative flex items-center justify-center">
            {companySettings?.logoBase64 ? (
              <img src={companySettings.logoBase64} alt="Company Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" fill="white" />
                <path d="M10 10 h 20 v 80 h -20 z" fill="black" transform="rotate(45 50 50)" />
                <path d="M40 10 h 20 v 80 h -20 z" fill="black" transform="rotate(45 50 50)" />
                <path d="M70 10 h 20 v 80 h -20 z" fill="black" transform="rotate(45 50 50)" />
              </svg>
            )}
          </div>
          <div className="font-bold text-sm tracking-tight">{companySettings?.companyName || 'Sunro Lanka Pvt Ltd.'}</div>
          <div className="text-[10px] text-gray-600">{companySettings?.tagline || 'Delivering Premium Excellence.'}</div>
        </div>
        <div className="text-right pt-4">
          <h1 className="text-2xl font-bold text-red-600 mb-1">{companySettings?.companyName || 'Sunro Lanka Beverages.'}</h1>
          <p className="text-sm font-medium">{companySettings?.address || 'Ranasgalla,Nakkawaththa,Kurunegala,Srilanka'}</p>
          <p className="text-sm">Email:-{companySettings?.email || 'sunrolankabeverages@gmail.com'}</p>
          <p className="text-sm">Tel/Fax:- {companySettings?.phone || '0777402632'}</p>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-2 tracking-widest">INVOICE</h2>

      {/* Meta Table */}
      <table className="w-full border-collapse border border-black mb-6 text-sm">
        <tbody>
          <tr>
            <td className="border border-black p-1 pl-2 w-1/3">Distributor Name</td>
            <td className="border border-black p-1 pl-2 font-bold">{customer?.name || invoice.customerName}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Area</td>
            <td className="border border-black p-1 pl-2 font-bold">{customer?.address || '-'}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Date</td>
            <td className="border border-black p-1 pl-2 font-bold">{new Date(invoice.date).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Invoice No.</td>
            <td className="border border-black p-1 pl-2 font-bold">{invoice.id}</td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <div className="border border-black mb-6 text-sm">
        <div className="text-center border-b border-black py-1">Products</div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-black text-xs">
                <th className="p-1 pl-2 text-left">Description</th>
                <th className="p-1 text-center">Qty</th>
                <th className="p-1 text-center">Unit Price</th>
                <th className="p-1 text-right pr-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => {
              const p = products.find(prod => prod.id === item.productId);
              if (!p) return null;
              const total = item.quantity * item.priceAtSale;
              return (
                <tr key={item.productId}>
                  <td className="p-1 pl-2 w-1/3">{p.name}</td>
                  <td className="p-1 text-center w-1/6">{item.quantity}</td>
                  <td className="p-1 text-center w-1/4">{item.priceAtSale}</td>
                  <td className="p-1 text-right pr-2 w-1/4">{total.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <table className="w-full border-collapse border border-black mb-12 text-sm">
        <tbody>
          <tr>
            <td className="border border-black p-1 pl-2 w-3/4">Total Invoice Value</td>
            <td className="border border-black p-1 text-right pr-2">{invoice.totalAmount}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Discount</td>
            <td className="border border-black p-1 text-right pr-2">0</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Net Invoice Value</td>
            <td className="border border-black p-1 text-right pr-2">{invoice.totalAmount}</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div className="flex justify-between text-sm mt-16 px-4">
        <div className="text-center">
          <div className="mb-1 tracking-widest">.....................................</div>
          Prepared By
        </div>
        <div className="text-center">
          <div className="mb-1 tracking-widest">.....................................</div>
          Distributor Signature
        </div>
        <div className="text-center">
          <div className="mb-1 tracking-widest">.....................................</div>
          Authorized Signature
        </div>
      </div>
    </div>
  );
};
