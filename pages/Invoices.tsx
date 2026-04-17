import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { InvoiceTemplate } from '../services/invoiceGenerator';
import { UserRole, Invoice, InvoiceItem, Product } from '../types';
import { Plus, Trash2, Printer, Share2, Search, FilePlus, Edit, X, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  stock: number;
  onAdd: (id: string, qty: number) => void;
  formatCurrency: (v: number) => string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, stock, onAdd, formatCurrency }) => {
  const [qty, setQty] = useState(1);

  return (
    <div className={`p-4 rounded-lg border text-left transition-all ${stock > 0 ? 'border-slate-200 hover:border-sun-500' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
       <div className="font-bold text-slate-800">{product.name}</div>
       <div className="text-sm text-slate-500">{formatCurrency(product.sellingPrice)}</div>
       <div className={`text-xs mt-2 ${stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
           Stock: {stock}
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
                 setQty(1); // Reset after adding
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

const Invoices = () => {
  const { 
    currentUser, products, customers, invoices, hubs,
    createInvoice, addCustomer, stocks, deleteInvoice, updateInvoice, formatCurrency
  } = useERP();

  const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);

  // Creation/Edit State
  const [newCustType, setNewCustType] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedCustId, setSelectedCustId] = useState('');
  const [guestDetails, setGuestDetails] = useState({ name: '', phone: '', address: '' });
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [selectedHubId, setSelectedHubId] = useState(currentUser?.hubId || '');

  // Filter invoices for current user's hub (unless SA)
  const myHubId = currentUser?.hubId;
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.includes(searchTerm);
    if (currentUser?.role === UserRole.SUPER_ADMIN) return matchesSearch;
    return inv.hubId === myHubId && matchesSearch;
  });

  const getStock = (productId: string) => {
    const hub = currentUser?.role === UserRole.SUPER_ADMIN ? selectedHubId : currentUser?.hubId;
    if (!hub) return 0;
    return stocks.find(s => s.productId === productId && s.hubId === hub)?.quantity || 0;
  };

  const addToCart = (productId: string, qty: number) => {
    if (currentUser?.role === UserRole.SUPER_ADMIN && !selectedHubId) {
        alert("Please select a hub first!");
        return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentQtyInCart = cart.find(c => c.productId === productId)?.quantity || 0;
    const available = getStock(productId);

    // If editing, we technically already have some stock allocated, but for simplicity we check against current available + what was in the cart
    const previouslyAllocated = editingInvoice?.items.find(i => i.productId === productId)?.quantity || 0;
    
    if (currentQtyInCart + qty > available + previouslyAllocated) {
        alert("Insufficient stock in the selected hub!");
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { productId, quantity: qty, priceAtSale: product.sellingPrice }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCreateOrUpdateInvoice = () => {
    if (cart.length === 0) return;
    if (currentUser?.role === UserRole.SUPER_ADMIN && !selectedHubId) {
        alert("Please select a hub!");
        return;
    }

    let custId = selectedCustId;
    let custName = '';

    if (newCustType === 'NEW') {
        custId = `c-${Date.now()}`;
        custName = guestDetails.name;
        addCustomer({
            id: custId,
            name: guestDetails.name,
            phone: guestDetails.phone,
            address: guestDetails.address,
            type: 'GUEST',
            hubId: selectedHubId || currentUser?.hubId || 'hub-001',
            status: 'APPROVED',
            shopName: 'Guest Walk-in'
        });
    } else {
        const c = customers.find(c => c.id === selectedCustId);
        if (!c) return alert("Select a customer");
        custName = c.name;
    }

    const total = cart.reduce((acc, item) => acc + (item.quantity * item.priceAtSale), 0);

    if (view === 'EDIT' && editingInvoice) {
        updateInvoice(editingInvoice.id, {
            customerId: custId,
            customerName: custName,
            hubId: selectedHubId || currentUser?.hubId || 'HEAD_OFFICE',
            items: cart,
            totalAmount: total,
        });
    } else {
        const newInvoice: Invoice = {
            id: `INV-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            customerId: custId,
            customerName: custName,
            hubId: selectedHubId || currentUser?.hubId || 'HEAD_OFFICE',
            items: cart,
            totalAmount: total,
            status: 'PAID', // Assuming instant cash payment for this ERP
            createdBy: currentUser?.id || 'unknown'
        };
        createInvoice(newInvoice);
    }

    setView('LIST');
    setCart([]);
    setGuestDetails({ name: '', phone: '', address: '' });
    setEditingInvoice(null);
    if (currentUser?.role === UserRole.SUPER_ADMIN) setSelectedHubId('');
  };

  const handleDelete = (id: string) => {
      if (confirm('Are you sure you want to delete this invoice?')) {
          deleteInvoice(id);
      }
  };

  const startEdit = (inv: Invoice) => {
      setEditingInvoice(inv);
      setCart(inv.items);
      setSelectedCustId(inv.customerId);
      setSelectedHubId(inv.hubId);
      setNewCustType('EXISTING');
      setView('EDIT');
  };

  const handlePrint = (invId: string) => {
      setPrintingInvoiceId(invId);
      setTimeout(() => {
          window.print();
          setPrintingInvoiceId(null);
      }, 100);
  };

  const handleWhatsApp = (inv: Invoice) => {
      const customer = customers.find(c => c.id === inv.customerId);
      const phone = customer?.phone || '0000000000';
      const message = `Hello ${inv.customerName}, here is your invoice #${inv.id} from Sun Cola for ${formatCurrency(inv.totalAmount)}. Thank you!`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
       {/* Invoice Template Rendering Area (Hidden until print) */}
       <div className="hidden print-only">
         {printingInvoiceId && invoices.find(i => i.id === printingInvoiceId) && (
             <InvoiceTemplate 
                invoice={invoices.find(i => i.id === printingInvoiceId)!} 
                products={products} 
                customer={customers.find(c => c.id === invoices.find(i => i.id === printingInvoiceId)?.customerId)} 
                companySettings={useERP().companySettings}
             />
         )}
       </div>

      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold text-slate-800">
          {view === 'LIST' ? 'Invoices' : view === 'EDIT' ? `Edit Invoice #${editingInvoice?.id}` : 'New Invoice'}
        </h1>
        {view === 'LIST' && (
          <button 
            onClick={() => {
                setEditingInvoice(null);
                setCart([]);
                setSelectedCustId('');
                setNewCustType('EXISTING');
                setView('CREATE');
            }}
            className="flex items-center px-4 py-2 bg-sun-600 text-white rounded-lg hover:bg-sun-700 shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </button>
        )}
        {(view === 'CREATE' || view === 'EDIT') && (
          <button onClick={() => {
              setView('LIST');
              setEditingInvoice(null);
          }} className="text-slate-500 hover:text-slate-800">Cancel</button>
        )}
      </div>

      {viewingInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print overflow-y-auto">
              <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col relative">
                  <div className="flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-xl">
                      <h3 className="text-lg font-bold text-slate-800">View Invoice #{viewingInvoice.id}</h3>
                      <div className="flex space-x-2">
                          <button onClick={() => handlePrint(viewingInvoice.id)} className="flex items-center px-4 py-2 bg-sun-600 text-white rounded-lg hover:bg-sun-700">
                              <Printer size={18} className="mr-2" /> Print
                          </button>
                          <button onClick={() => setViewingInvoice(null)} className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300 text-slate-600">
                              <X size={20} />
                          </button>
                      </div>
                  </div>
                  <div className="p-6 overflow-y-auto bg-slate-100">
                      <InvoiceTemplate 
                          invoice={viewingInvoice} 
                          products={products} 
                          customer={customers.find(c => c.id === viewingInvoice.customerId)} 
                          companySettings={useERP().companySettings}
                          className="shadow-md"
                      />
                  </div>
              </div>
          </div>
      )}

      {view === 'LIST' ? (
        <div className="space-y-4 no-print">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search invoices..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sun-500 outline-none bg-white text-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{inv.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{inv.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-700">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        <button onClick={() => setViewingInvoice(inv)} className="text-slate-600 hover:text-sun-600" title="View">
                                            <Eye size={18} />
                                        </button>
                                        <button onClick={() => handlePrint(inv.id)} className="text-slate-600 hover:text-sun-600" title="Print">
                                            <Printer size={18} />
                                        </button>
                                        {(currentUser?.role === UserRole.SUPER_ADMIN) && (
                                            <>
                                                <button onClick={() => handleWhatsApp(inv)} className="text-green-600 hover:text-green-800" title="Share WhatsApp">
                                                    <Share2 size={18} />
                                                </button>
                                                <button onClick={() => startEdit(inv)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-800" title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No invoices found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
            {/* Left: Product Selection */}
            <div className="lg:col-span-2 space-y-6">
                {currentUser?.role === UserRole.SUPER_ADMIN && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">Select Hub for Invoice</h3>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white text-black"
                            value={selectedHubId}
                            onChange={(e) => {
                                setSelectedHubId(e.target.value);
                                setCart([]); // Clear cart when hub changes to avoid stock mismatch
                            }}
                            disabled={view === 'EDIT'} // Cannot change hub while editing
                        >
                            <option value="">Select a Hub</option>
                            {hubs.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                )}

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
                                    formatCurrency={formatCurrency}
                                />
                            )
                        })}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <h3 className="font-bold text-slate-800 mb-4">Customer Details</h3>
                     <div className="flex space-x-4 mb-4">
                         <button 
                            className={`flex-1 py-2 rounded-lg text-sm font-medium ${newCustType === 'EXISTING' ? 'bg-sun-100 text-sun-800' : 'bg-slate-100 text-slate-600'}`}
                            onClick={() => setNewCustType('EXISTING')}
                         >
                             Existing Customer
                         </button>
                         <button 
                            className={`flex-1 py-2 rounded-lg text-sm font-medium ${newCustType === 'NEW' ? 'bg-sun-100 text-sun-800' : 'bg-slate-100 text-slate-600'}`}
                            onClick={() => setNewCustType('NEW')}
                         >
                             New / Guest
                         </button>
                     </div>

                     {newCustType === 'EXISTING' ? (
                         <select 
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white text-black"
                            value={selectedCustId}
                            onChange={(e) => setSelectedCustId(e.target.value)}
                         >
                             <option value="">Select Customer</option>
                             {customers
                                .filter(c => currentUser?.role === UserRole.SUPER_ADMIN || c.hubId === currentUser?.hubId)
                                .map(c => (
                                 <option key={c.id} value={c.id}>{c.name} - {c.shopName} ({c.status})</option>
                             ))}
                         </select>
                     ) : (
                         <div className="space-y-3">
                             <input 
                                type="text" placeholder="Full Name" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-black"
                                value={guestDetails.name} onChange={e => setGuestDetails({...guestDetails, name: e.target.value})}
                             />
                             <input 
                                type="text" placeholder="Phone Number" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-black"
                                value={guestDetails.phone} onChange={e => setGuestDetails({...guestDetails, phone: e.target.value})}
                             />
                             <input 
                                type="text" placeholder="Address (Optional)" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-black"
                                value={guestDetails.address} onChange={e => setGuestDetails({...guestDetails, address: e.target.value})}
                             />
                         </div>
                     )}
                </div>
            </div>

            {/* Right: Cart Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Current Invoice</h3>
                <div className="space-y-4 mb-6">
                    {cart.map(item => {
                        const p = products.find(prod => prod.id === item.productId);
                        return (
                            <div key={item.productId} className="flex justify-between items-center text-sm">
                                <div>
                                    <div className="font-medium text-slate-800">{p?.name}</div>
                                    <div className="text-slate-500">{item.quantity} x {formatCurrency(item.priceAtSale)}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="font-bold text-slate-800">{formatCurrency(item.quantity * item.priceAtSale)}</span>
                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {cart.length === 0 && (
                        <div className="text-center text-slate-400 py-4">Cart is empty</div>
                    )}
                </div>
                
                <div className="border-t border-slate-200 pt-4 mb-6">
                    <div className="flex justify-between items-center text-xl font-bold text-slate-800">
                        <span>Total</span>
                        <span>{formatCurrency(cart.reduce((acc, item) => acc + (item.quantity * item.priceAtSale), 0))}</span>
                    </div>
                </div>

                <button 
                    onClick={handleCreateOrUpdateInvoice}
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-sun-600 text-white font-bold rounded-lg hover:bg-sun-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    <FilePlus className="mr-2 h-5 w-5" />
                    {view === 'EDIT' ? 'Update Invoice' : 'Generate Invoice'}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;