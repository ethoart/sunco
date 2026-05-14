import React from 'react';
import { StockRequest, Product, CompanySettings, Hub } from '../types';

interface StockRequestTemplateProps {
  request: StockRequest;
  products: Product[];
  hub?: Hub;
  companySettings?: CompanySettings | null;
  className?: string;
}

export const StockRequestTemplate: React.FC<StockRequestTemplateProps> = ({ request, products, hub, companySettings, className }) => {
  return (
    <div className={`bg-white p-8 print:p-0 print:m-0 max-w-4xl mx-auto text-black font-sans ${className || ''}`} id={`stock-request-${request.id}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col items-center">
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
          <p className="text-sm font-medium">{companySettings?.address || 'Kurunagala, Sri Lanka'}</p>
          <p className="text-sm">Email:- {companySettings?.email || 'sunrolankabeverages@gmail.com'}</p>
          <p className="text-sm">Tel/Fax:- {companySettings?.phone || '0727402632'}</p>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-2 tracking-widest text-slate-800">STOCK REQUEST / ORDER SLIP</h2>

      {/* Meta Table */}
      <table className="w-full border-collapse border border-black mb-6 text-sm">
        <tbody>
          <tr>
            <td className="border border-black p-1 pl-2 w-1/3">Hub / Requester Name</td>
            <td className="border border-black p-1 pl-2 font-bold">{hub?.name || 'Unknown Hub'}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Location</td>
            <td className="border border-black p-1 pl-2 font-bold">{hub?.location || '-'}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Date</td>
            <td className="border border-black p-1 pl-2 font-bold">{new Date(request.createdAt).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 pl-2">Order Slip No.</td>
            <td className="border border-black p-1 pl-2 font-bold">{request.id}</td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <div className="border border-black mb-6 text-sm">
        <div className="text-center border-b border-black py-1 font-bold">Requested Products</div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-black text-xs">
                <th className="p-1 pl-2 text-left">Description</th>
                <th className="p-1 text-center">SKU</th>
                <th className="p-1 text-right pr-2">Requested Qty</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map(item => {
              const p = products.find(prod => prod.id === item.productId);
              if (!p) return null;
              return (
                <tr key={item.productId}>
                  <td className="p-1 pl-2 w-1/2 border-b border-black">{p.name}</td>
                  <td className="p-1 text-center w-1/4 border-b border-black">{p.sku}</td>
                  <td className="p-1 text-right pr-2 w-1/4 border-b border-black font-bold">{item.quantity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-sm mb-8">
        <span className="font-bold">Status:</span> {request.status}
      </div>

      {/* Signatures */}
      <div className="flex justify-between text-sm mt-12 px-4 pb-8">
        <div className="text-center">
          <div className="mb-1 tracking-widest">.....................................</div>
          Hub Manager / Requester
        </div>
        <div className="text-center">
          <div className="mb-1 tracking-widest">.....................................</div>
          Head Office Approval
        </div>
      </div>
    </div>
  );
};
