import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole, Product } from '../types';
import { InvoiceTemplate } from '../services/invoiceGenerator';
import { Plus, Trash2, Share2, Search, FilePlus, Edit, Eye, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  stock: number;
  onAdd: (id: string, qty: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, stock, onAdd }) => {
  const [qty, setQty] = useState(1);

  return (
    <div className={`p-4 rounded-lg border text-left transition-all ${stock > 0 ? 'border-slate-200 hover:border-sun-500' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
       <div className="font-bold text-slate-800">{product.name}</div>
       <div className="text-sm text-slate-500">SKU: {product.sku}</div>
       <div className={`text-xs mt-2 ${stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
           Head Office Stock: {stock}
       </div>
       <div className="flex items-center space-x-2 mt-3">
          <input
             type="number"
             min="1"
             max={stock}
             className="w-16 p-1 border border-slate-300 rounded text-sm text-center outline-none focus:border-sun-500 bg-white text-black"
             value={qty}
             onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 0))}
             disabled={stock === 0}
          />
          <button
             onClick={() => {
                 onAdd(product.id, qty);
                 setQty(1);
             }}
             disabled={stock === 0}
             className="flex-1 px-3 py-1 bg-sun-600 text-white text-sm rounded hover:bg-sun-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             Add
          </button>
       </div>
    </div>
  );
};

const Dispatch = () => {
  const { 
    currentUser, products, hubs, stocks, transferStock, formatCurrency, createInvoice, invoices, companySettings, customers
  } = useERP();

  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedHubId, setSelectedHubId] = useState('');
  const [cart, setCart] = useState<{productId: string, quantity: number}[]>([]);
  const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);

  // Only Head office stock available for dispatch
  const getStock = (productId: string) => {
    return stocks.find(s => s.productId === productId && s.hubId === 'HEAD_OFFICE')?.quantity || 0;
  };

  const addToCart = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentQtyInCart = cart.find(c => c.productId === productId)?.quantity || 0;
    const available = getStock(productId);
    
    if (currentQtyInCart + qty > available) {
        alert("Insufficient stock in Head Office!");
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { productId, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleDispatch = async () => {
    if (cart.length === 0) return;
    if (!selectedHubId) {
        alert("Please select a destination hub!");
        return;
    }

    try {
        await transferStock(cart.map(c => ({ productId: c.productId, qty: c.quantity })), 'HEAD_OFFICE', selectedHubId);
        
        // Generate invoice for destination hub
        const targetHubObj = hubs.find(h => h.id === selectedHubId);
        let totalAmount = 0;
        const invoiceItems = cart.map(item => {
            const prod = products.find(p => p.id === item.productId);
            const price = prod?.sellingPrice || 0;
            totalAmount += price * item.quantity;
            return {
                productId: item.productId,
                quantity: item.quantity,
                priceAtSale: price
            };
        });

        await createInvoice({
            id: `INV-TR-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            customerId: selectedHubId, // using hub as customer
            customerName: `${targetHubObj?.name || 'Hub'} (Internal Transfer)`,
            hubId: 'HEAD_OFFICE',
            items: invoiceItems,
            totalAmount,
            status: 'PAID',
            createdBy: currentUser?.id || 'HEAD_OFFICE'
        });

        alert("Stock Dispatched and Invoice Generated Successfully!");
        setView('LIST');
        setCart([]);
        setSelectedHubId('');
    } catch (e: any) {
        alert(e.message || 'Dispatch failed');
    }
  };

  const handlePrint = (invId: string) => {
      setPrintingInvoiceId(invId);
      setTimeout(() => {
          window.print();
          setPrintingInvoiceId(null);
      }, 100);
  };

  if (currentUser?.role !== UserRole.SUPER_ADMIN) {
      return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="hidden print-only">
        {printingInvoiceId && invoices.find(i => i.id === printingInvoiceId) && (
             <InvoiceTemplate 
                key={printingInvoiceId}
                invoice={invoices.find(i => i.id === printingInvoiceId)!} 
                products={products} 
                customer={customers.find(c => c.id === invoices.find(i => i.id === printingInvoiceId)?.customerId)} 
                companySettings={companySettings}
             />
         )}
      </div>

      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold text-slate-800">
          {view === 'LIST' ? 'Stock Dispatch' : 'New Dispatch'}
        </h1>
        {view === 'LIST' && (
          <button 
            onClick={() => {
                setCart([]);
                setSelectedHubId('');
                setView('CREATE');
            }}
            className="flex items-center px-4 py-2 bg-sun-600 text-white rounded-lg hover:bg-sun-700 shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Dispatch
          </button>
        )}
        {view === 'CREATE' && (
          <button onClick={() => {
              setView('LIST');
          }} className="text-slate-500 hover:text-slate-800">Cancel</button>
        )}
      </div>

      {view === 'LIST' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatch ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Destination Hub</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {invoices.filter(i => i.id.startsWith('INV-TR-')).map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{inv.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{inv.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-700">Rs {inv.totalAmount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                    <button onClick={() => handlePrint(inv.id)} className="text-slate-600 hover:text-sun-600 inline-flex items-center">
                                         Print Note
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {invoices.filter(i => i.id.startsWith('INV-TR-')).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    <PackageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    No dispatch records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
            {/* Left: Product Selection */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Destination Hub</h3>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white text-black"
                        value={selectedHubId}
                        onChange={(e) => setSelectedHubId(e.target.value)}
                    >
                        <option value="">Select Destination Hub</option>
                        {hubs.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Select Products</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {products.map(p => {
                            const stock = getStock(p.id);
                            return (
                                <ProductCard 
                                    key={p.id} 
                                    product={p} 
                                    stock={stock} 
                                    onAdd={addToCart} 
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Right: Cart Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Dispatch Summary</h3>
                <div className="space-y-4 mb-6">
                    {cart.map(item => {
                        const p = products.find(prod => prod.id === item.productId);
                        return (
                            <div key={item.productId} className="flex justify-between items-center text-sm">
                                <div>
                                    <div className="font-medium text-slate-800">{p?.name}</div>
                                    <div className="text-slate-500">Qty: {item.quantity}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {cart.length === 0 && (
                        <div className="text-center text-slate-400 py-4">No items selected</div>
                    )}
                </div>

                <button 
                    onClick={handleDispatch}
                    disabled={cart.length === 0 || !selectedHubId}
                    className="w-full py-3 bg-sun-600 text-white font-bold rounded-lg hover:bg-sun-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Dispatch Stock
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dispatch;

// Temp import for the missing icon:
import { Package as PackageIcon } from 'lucide-react';
