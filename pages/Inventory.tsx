import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole, StockBatch } from '../types';
import { HEAD_OFFICE_ID } from '../constants';
import { Package, Truck, ArrowRight, RefreshCw, Plus, RotateCcw, Calendar, Printer } from 'lucide-react';
import { InvoiceTemplate } from '../services/invoiceGenerator';

const Inventory = () => {
  const { products, stocks, stockBatches, hubs, currentUser, transferStock, addStockBatch, addReturnRecord, formatCurrency, invoices, addProduct, returnRecords, createInvoice, customers, companySettings } = useERP();
  const [viewMode, setViewMode] = useState<'STOCKS' | 'DISPATCHES'>('STOCKS');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [viewReturnsModalOpen, setViewReturnsModalOpen] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  // Transfer State
  const [targetHub, setTargetHub] = useState('');
  const [transferItems, setTransferItems] = useState<{ productId: string, qty: number }[]>([{ productId: '', qty: 0 }]);

  // Add Stock State
  const [newStockProduct, setNewStockProduct] = useState('');
  const [newStockHub, setNewStockHub] = useState('');
  const [newStockQty, setNewStockQty] = useState(0);
  const [newStockBatch, setNewStockBatch] = useState('');
  const [newStockExpiry, setNewStockExpiry] = useState('');

  // Add Product State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCost, setNewProdCost] = useState(0);
  const [newProdPrice, setNewProdPrice] = useState(0);

  // Return Stock State
  const [returnHub, setReturnHub] = useState('');
  const [returnItems, setReturnItems] = useState<{ productId: string, qty: number, reason: string }[]>([{ productId: '', qty: 0, reason: 'EXPIRED' }]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isHubAdmin = currentUser?.role === UserRole.HUB_ADMIN;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku || newProdCost <= 0 || newProdPrice <= 0) return;

    addProduct({
        id: `prod-${Date.now()}`,
        name: newProdName,
        sku: newProdSku,
        costPrice: newProdCost,
        sellingPrice: newProdPrice
    });

    setAddProductModalOpen(false);
    setNewProdName('');
    setNewProdSku('');
    setNewProdCost(0);
    setNewProdPrice(0);
    alert("Product added successfully!");
  };

  const handleRequestStock = () => {
    if (transferItems.length === 0 || transferItems.some(i => !i.productId || i.qty <= 0)) {
        alert("Please add valid items to request!");
        return;
    }
    useERP().addStockRequest({
        id: `req-${Date.now()}`,
        hubId: currentUser?.hubId || '',
        items: transferItems,
        status: 'PENDING',
        createdAt: new Date().toISOString()
    });
    setTransferModalOpen(false);
    setTransferItems([{ productId: '', qty: 0 }]);
    alert("Stock request submitted to Head Office!");
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return products.map(p => {
      // Added Stock
      const added = stockBatches
        .filter(b => {
          const d = new Date(b.receivedDate);
          return b.productId === p.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear && (isSuperAdmin || b.hubId === currentUser?.hubId);
        })
        .reduce((acc, b) => acc + b.originalQuantity, 0);

      // Sold Stock (Approximate from invoices)
      // We need to access invoices from context, but Inventory doesn't have it.
      // I need to add invoices to useERP destructuring in Inventory.
      // For now, I'll skip Sold if invoices not available, or add it.
      
      return {
        product: p,
        added
      };
    });
  };

  const getStock = (productId: string, hubId: string) => {
    return stocks.find(s => s.productId === productId && s.hubId === hubId)?.quantity || 0;
  };

  const getProductBatches = (productId: string, hubId: string) => {
    return stockBatches.filter(b => b.productId === productId && b.hubId === hubId && b.quantity > 0);
  };

  const handleAddTransferItem = () => {
    setTransferItems([...transferItems, { productId: '', qty: 0 }]);
  };

  const handleRemoveTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleTransferItemChange = (index: number, field: 'productId' | 'qty', value: string | number) => {
    const newItems = [...transferItems];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setTransferItems(newItems);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHub || transferItems.some(item => !item.productId || item.qty <= 0)) return;
    
    try {
        await transferStock(transferItems, HEAD_OFFICE_ID, targetHub);

        // Generate invoice for destination hub
        const targetHubObj = hubs.find(h => h.id === targetHub);
        let totalAmount = 0;
        const invoiceItems = transferItems.map(item => {
            const prod = products.find(p => p.id === item.productId);
            const price = prod?.sellingPrice || 0;
            totalAmount += price * item.qty;
            return {
                productId: item.productId,
                quantity: item.qty,
                priceAtSale: price
            };
        });

        await createInvoice({
            id: `INV-TR-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            customerId: targetHub, // using hub as customer
            customerName: `${targetHubObj?.name || 'Hub'} (Internal Transfer)`,
            hubId: HEAD_OFFICE_ID,
            items: invoiceItems,
            totalAmount,
            status: 'PAID', // mark as paid or completed for internal transfers
            createdBy: currentUser?.id || 'system'
        });

        setTransferModalOpen(false);
        setTransferItems([{ productId: '', qty: 0 }]);
        setViewMode('DISPATCHES');
        alert("Stock transferred and Invoice generated successfully!");
    } catch (err: any) {
        alert("Transfer failed: " + err.message);
    }
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockProduct || !newStockHub || newStockQty <= 0 || !newStockBatch) return;

    addStockBatch({
      id: `batch-${Date.now()}`,
      productId: newStockProduct,
      hubId: newStockHub,
      quantity: newStockQty,
      originalQuantity: newStockQty,
      receivedDate: new Date().toISOString(),
      batchNumber: newStockBatch,
      expiryDate: newStockExpiry || undefined
    });

    setAddStockModalOpen(false);
    setNewStockQty(0);
    setNewStockBatch('');
    setNewStockExpiry('');
    alert("Stock added successfully!");
  };

  const handleAddReturnItem = () => {
    setReturnItems([...returnItems, { productId: '', qty: 0, reason: 'EXPIRED' }]);
  };

  const handleRemoveReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const handleReturnItemChange = (index: number, field: 'productId' | 'qty' | 'reason', value: string | number) => {
    const newItems = [...returnItems];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setReturnItems(newItems);
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnHub || returnItems.some(item => !item.productId || item.qty <= 0)) return;

    try {
        for (const item of returnItems) {
            await addReturnRecord({
                id: `return-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                productId: item.productId,
                hubId: returnHub,
                quantity: item.qty,
                reason: item.reason as any,
                date: new Date().toISOString(),
                status: 'PENDING'
            });
        }

        setReturnModalOpen(false);
        setReturnItems([{ productId: '', qty: 0, reason: 'EXPIRED' }]);
        alert("Return records added successfully!");
    } catch (err) {
        alert("Failed to add return records.");
    }
  };

  const handlePrint = (invId: string) => {
      setPrintingInvoiceId(invId);
      setTimeout(() => {
          window.print();
          setPrintingInvoiceId(null);
      }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-slate-500">Real-time stock tracking across all hubs.</p>
        </div>
        <div className="flex space-x-2 flex-wrap gap-y-2 justify-end">
          {isSuperAdmin && (
            <button 
              onClick={() => setAddProductModalOpen(true)}
              className="group relative w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                New Product
              </span>
            </button>
          )}
          {(isSuperAdmin || isHubAdmin) && (
            <>
              <button 
                onClick={() => setReportModalOpen(true)}
                className="group relative w-10 h-10 flex items-center justify-center bg-slate-600 text-white rounded-full hover:bg-slate-700 shadow-sm transition-colors"
              >
                <Calendar className="h-5 w-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Monthly Report
                </span>
              </button>
              <button 
                onClick={() => setViewReturnsModalOpen(true)}
                className="group relative w-10 h-10 flex items-center justify-center bg-orange-600 text-white rounded-full hover:bg-orange-700 shadow-sm transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  View Returns
                </span>
              </button>
              <button 
                onClick={() => setAddStockModalOpen(true)}
                className="group relative w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Add Stock
                </span>
              </button>
              <button 
                onClick={() => setReturnModalOpen(true)}
                className="group relative w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Return Stock
                </span>
              </button>
            </>
          )}
          {isSuperAdmin && (
            <button 
              onClick={() => setTransferModalOpen(true)}
              className="group relative w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-sm transition-colors"
            >
              <Truck className="h-5 w-5" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Distribute Stock
              </span>
            </button>
          )}
          {isHubAdmin && (
            <button 
              onClick={() => setTransferModalOpen(true)}
              className="group relative w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-full hover:bg-indigo-600 shadow-sm transition-colors"
            >
              <Truck className="h-5 w-5" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Request Stock
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 space-x-4 no-print">
        <button 
            className={`py-2 px-1 font-medium text-sm transition-colors ${viewMode === 'STOCKS' ? 'text-sun-600 border-b-2 border-sun-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setViewMode('STOCKS')}
        >
            Stock Status
        </button>
        {isSuperAdmin && (
            <button 
                className={`py-2 px-1 font-medium text-sm transition-colors ${viewMode === 'DISPATCHES' ? 'text-sun-600 border-b-2 border-sun-600' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setViewMode('DISPATCHES')}
            >
                Dispatch Notes (Transfers)
            </button>
        )}
      </div>

      {viewMode === 'STOCKS' ? (
      <div className="grid grid-cols-1 gap-6 no-print">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div 
              className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-md border border-slate-200">
                  <Package className="text-sun-500 h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{product.name}</h3>
                  <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Unit Price</div>
                <div className="font-bold text-slate-800">{formatCurrency(product.sellingPrice)}</div>
              </div>
            </div>
            
            {expandedProduct === product.id && (
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Batch Details</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pb-2">Batch #</th>
                        <th className="pb-2">Hub</th>
                        <th className="pb-2">Received</th>
                        <th className="pb-2">Expiry</th>
                        <th className="pb-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockBatches
                        .filter(b => b.productId === product.id && (isSuperAdmin || b.hubId === currentUser?.hubId))
                        .map(batch => (
                        <tr key={batch.id} className="border-t border-slate-200">
                          <td className="py-2 font-mono">{batch.batchNumber}</td>
                          <td className="py-2">{hubs.find(h => h.id === batch.hubId)?.name || 'Head Office'}</td>
                          <td className="py-2">{new Date(batch.receivedDate).toLocaleDateString()}</td>
                          <td className="py-2 text-red-600">{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '-'}</td>
                          <td className="py-2 text-right font-bold">{batch.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Head Office Stock (Only visible to SA) */}
              {isSuperAdmin && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="text-xs font-bold text-indigo-800 uppercase mb-1">Head Office (Unified)</div>
                    <div className="text-2xl font-bold text-indigo-900">
                        {getStock(product.id, HEAD_OFFICE_ID).toLocaleString()}
                        <span className="text-xs font-normal text-indigo-600 ml-1">units</span>
                    </div>
                </div>
              )}

              {/* Hub Stocks */}
              {hubs.map(hub => {
                  const qty = getStock(product.id, hub.id);
                  const isMyHub = currentUser?.hubId === hub.id;
                  
                  // Filter visibility: SA sees all, HubAdmin sees own
                  if (!isSuperAdmin && !isMyHub) return null;

                  return (
                    <div key={hub.id} className="p-3 bg-white rounded-lg border border-slate-200">
                         <div className="flex justify-between items-start mb-1">
                            <div className="text-xs font-bold text-slate-600 uppercase">{hub.name}</div>
                            {isMyHub && <div className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">My Hub</div>}
                         </div>
                        <div className={`text-2xl font-bold ${qty < 100 ? 'text-red-600' : 'text-slate-800'}`}>
                            {qty.toLocaleString()}
                            <span className="text-xs font-normal text-slate-500 ml-1">units</span>
                        </div>
                    </div>
                  );
              })}
            </div>
          </div>
        ))}
      </div>
      ) : (
      <div className="space-y-4">
        {/* Hidden Invoice Templates for Printing */}
        <div className="hidden print-only">
          {printingInvoiceId && invoices.find(i => i.id === printingInvoiceId) && (
               <InvoiceTemplate 
                  invoice={invoices.find(i => i.id === printingInvoiceId)!} 
                  products={products} 
                  customer={customers.find(c => c.id === invoices.find(i => i.id === printingInvoiceId)?.customerId)} 
                  companySettings={companySettings}
               />
           )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatch ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {invoices.filter(i => i.id.startsWith('INV-TR-')).map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{inv.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{inv.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {inv.items.map(item => `${products.find(p => p.id === item.productId)?.name || 'Product'} (x${item.quantity})`).join(', ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                    <button onClick={() => handlePrint(inv.id)} className="text-slate-600 hover:text-sun-600 inline-flex items-center">
                                        <Printer size={18} className="mr-1" /> Print Note
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {invoices.filter(i => i.id.startsWith('INV-TR-')).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No dispatch records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      )}

      {/* Add Product Modal */}
      {addProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Plus className="mr-2 text-indigo-600" />
                Create New Product
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                    <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-black"
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        required
                        placeholder="e.g. Sun Cola 2L"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                    <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-black"
                        value={newProdSku}
                        onChange={e => setNewProdSku(e.target.value)}
                        required
                        placeholder="e.g. SC-2000"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (LKR)</label>
                        <input 
                            type="number" 
                            min="0"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-black"
                            value={newProdCost}
                            onChange={e => setNewProdCost(Number(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (LKR)</label>
                        <input 
                            type="number" 
                            min="0"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-black"
                            value={newProdPrice}
                            onChange={e => setNewProdPrice(Number(e.target.value))}
                            required
                        />
                    </div>
                </div>

                <div className="flex space-x-3 mt-6">
                    <button 
                        type="button"
                        onClick={() => setAddProductModalOpen(false)}
                        className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                    >
                        Create Product
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* View Returns Modal */}
      {viewReturnsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <RotateCcw className="mr-2 text-orange-600" />
                    Returns History
                </h2>
                <button onClick={() => setViewReturnsModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                    <ArrowRight className="h-6 w-6 rotate-45" />
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Hub</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {returnRecords
                            .filter(r => isSuperAdmin || r.hubId === currentUser?.hubId)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(r => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{products.find(p => p.id === r.productId)?.name || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-600">{hubs.find(h => h.id === r.hubId)?.name || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            r.reason === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                            r.reason === 'DAMAGED_BOX' ? 'bg-orange-100 text-orange-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {r.reason.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold">{r.quantity}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        {returnRecords.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No return records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                {isHubAdmin ? <Truck className="mr-2 text-indigo-600" /> : <RefreshCw className="mr-2 text-sun-600" />}
                {isHubAdmin ? 'Request Stock from Head Office' : 'Distribute Stock'}
            </h2>
            <form onSubmit={isHubAdmin ? (e) => { e.preventDefault(); handleRequestStock(); } : handleTransfer} className="space-y-4">
                
                {isSuperAdmin && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Destination Hub</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none bg-white text-black"
                            value={targetHub}
                            onChange={e => setTargetHub(e.target.value)}
                            required
                        >
                            <option value="">Select Hub</option>
                            {hubs.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">{isHubAdmin ? 'Products to Request' : 'Products to Transfer'}</label>
                    {transferItems.map((item, index) => (
                        <div key={index} className="flex space-x-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1">Product</label>
                                <select 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none bg-white text-black text-sm"
                                    value={item.productId}
                                    onChange={e => handleTransferItemChange(index, 'productId', e.target.value)}
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (HQ: {getStock(p.id, HEAD_OFFICE_ID)})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs text-slate-500 mb-1">Qty</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sun-500 focus:border-sun-500 outline-none bg-white text-black text-sm"
                                    value={item.qty}
                                    onChange={e => handleTransferItemChange(index, 'qty', parseInt(e.target.value))}
                                    required
                                />
                            </div>
                            {transferItems.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveTransferItem(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        type="button"
                        onClick={handleAddTransferItem}
                        className="text-sm text-sun-600 hover:text-sun-700 font-medium flex items-center"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Add Another Product
                    </button>
                </div>

                <div className="flex space-x-3 mt-6">
                    <button 
                        type="button"
                        onClick={() => setTransferModalOpen(false)}
                        className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                        <button 
                        type="submit"
                        className="flex-1 py-2 px-4 bg-sun-600 text-white rounded-lg hover:bg-sun-700 shadow-md"
                    >
                        {isHubAdmin ? 'Submit Request' : 'Transfer All'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {addStockModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Plus className="mr-2 text-green-600" />
                Add New Stock
            </h2>
            <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-black"
                        value={newStockProduct}
                        onChange={e => setNewStockProduct(e.target.value)}
                        required
                    >
                        <option value="">Select Product</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hub</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-black"
                        value={newStockHub}
                        onChange={e => setNewStockHub(e.target.value)}
                        required
                    >
                        <option value="">Select Hub</option>
                        {isSuperAdmin && <option value={HEAD_OFFICE_ID}>Head Office</option>}
                        {hubs.map(h => (
                            (isSuperAdmin || currentUser?.hubId === h.id) && <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-black"
                            value={newStockQty}
                            onChange={e => setNewStockQty(parseInt(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-black"
                            value={newStockBatch}
                            onChange={e => setNewStockBatch(e.target.value)}
                            required
                            placeholder="e.g. B-001"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                    <input 
                        type="date" 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-black"
                        value={newStockExpiry}
                        onChange={e => setNewStockExpiry(e.target.value)}
                    />
                </div>

                <div className="flex space-x-3 mt-6">
                    <button 
                        type="button"
                        onClick={() => setAddStockModalOpen(false)}
                        className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md"
                    >
                        Add Stock
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Stock Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <RotateCcw className="mr-2 text-red-600" />
                Return Stock
            </h2>
            <form onSubmit={handleReturn} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hub</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white text-black"
                        value={returnHub}
                        onChange={e => setReturnHub(e.target.value)}
                        required
                    >
                        <option value="">Select Hub</option>
                        {hubs.map(h => (
                            (isSuperAdmin || currentUser?.hubId === h.id) && <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Products to Return</label>
                    {returnItems.map((item, index) => (
                        <div key={index} className="flex space-x-2 items-end flex-wrap gap-y-2">
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-xs text-slate-500 mb-1">Product</label>
                                <select 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white text-black text-sm"
                                    value={item.productId}
                                    onChange={e => handleReturnItemChange(index, 'productId', e.target.value)}
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-20">
                                <label className="block text-xs text-slate-500 mb-1">Qty</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white text-black text-sm"
                                    value={item.qty}
                                    onChange={e => handleReturnItemChange(index, 'qty', parseInt(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-xs text-slate-500 mb-1">Reason</label>
                                <select 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white text-black text-sm"
                                    value={item.reason}
                                    onChange={e => handleReturnItemChange(index, 'reason', e.target.value)}
                                    required
                                >
                                    <option value="EXPIRED">Expired</option>
                                    <option value="DAMAGED_BOX">Damaged</option>
                                    <option value="CUSTOMER_RETURN">Cust. Return</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            {returnItems.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveReturnItem(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        type="button"
                        onClick={handleAddReturnItem}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Add Another Product
                    </button>
                </div>

                <div className="flex space-x-3 mt-6">
                    <button 
                        type="button"
                        onClick={() => setReturnModalOpen(false)}
                        className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md"
                    >
                        Submit Returns
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
      {/* Monthly Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <Calendar className="mr-2 text-slate-600" />
                    Monthly Stock Report ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
                </h2>
                <button onClick={() => setReportModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                    <ArrowRight className="h-6 w-6 rotate-45" /> {/* Close icon hack or import X */}
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                        <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3 text-right">Added</th>
                            <th className="px-4 py-3 text-right">Sold</th>
                            <th className="px-4 py-3 text-right">Current Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {products.map(p => {
                            const now = new Date();
                            const currentMonth = now.getMonth();
                            const currentYear = now.getFullYear();

                            // Added
                            const added = stockBatches
                                .filter(b => {
                                    const d = new Date(b.receivedDate);
                                    return b.productId === p.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear && (isSuperAdmin || b.hubId === currentUser?.hubId);
                                })
                                .reduce((acc, b) => acc + b.originalQuantity, 0);

                            // Sold
                            const sold = invoices
                                .filter(inv => {
                                    const d = new Date(inv.date);
                                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && (isSuperAdmin || inv.hubId === currentUser?.hubId);
                                })
                                .reduce((acc, inv) => {
                                    const item = inv.items.find(i => i.productId === p.id);
                                    return acc + (item?.quantity || 0);
                                }, 0);

                            // Current
                            const current = isSuperAdmin 
                                ? stocks.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0)
                                : stocks.find(s => s.productId === p.id && s.hubId === currentUser?.hubId)?.quantity || 0;

                            return (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                                    <td className="px-4 py-3 text-right text-green-600">+{added}</td>
                                    <td className="px-4 py-3 text-right text-blue-600">-{sold}</td>
                                    <td className="px-4 py-3 text-right font-bold">{current}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
