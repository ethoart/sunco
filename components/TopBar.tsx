import React, { useState } from 'react';
import { Bell, MessageSquare, Menu, X, ArrowRight, Check } from 'lucide-react';
import { useERP } from '../contexts/ERPContext';
import { UserRole } from '../types';

interface TopBarProps {
  setSidebarOpen: (open: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setSidebarOpen }) => {
  const { currentUser, stockRequests, updateStockRequest, hubs, products, messages, addMessage } = useERP();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'NOTIFS' | 'MESSAGES'>('NOTIFS');
  const [messageText, setMessageText] = useState('');
  const [selectedHubReceiver, setSelectedHubReceiver] = useState('ALL_HUBS');

  const pendingRequests = stockRequests.filter(r => r.status === 'PENDING');
  const hasNotifs = currentUser?.role === UserRole.SUPER_ADMIN && pendingRequests.length > 0;

  const relevantMessages = messages.filter(m => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) return true;
    return m.receiverId === 'ALL_HUBS' || m.receiverId === currentUser?.hubId || m.senderId === currentUser?.id;
  }).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleApproveStockRequest = (id: string) => {
      // In a real scenario, this would trigger a stock transfer. 
      // For now we just mark APPROVED.
      updateStockRequest(id, { status: 'APPROVED' });
  };

  const handleRejectStockRequest = (id: string) => {
      updateStockRequest(id, { status: 'REJECTED' });
  };

  const handleSendMessage = () => {
      if (!messageText.trim()) return;
      
      const receiver = currentUser?.role === UserRole.SUPER_ADMIN ? selectedHubReceiver : 'HEAD_OFFICE';
      
      addMessage({
          id: `msg-${Date.now()}`,
          senderId: currentUser?.id || 'unknown',
          receiverId: receiver,
          content: messageText,
          createdAt: new Date().toISOString()
      });
      setMessageText('');
  };

  return (
    <>
    <div className="bg-white px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="mr-4 md:hidden text-slate-500 hover:bg-slate-50 p-2 rounded-xl">
          <Menu size={24} />
        </button>
        
        {/* Brand Name */}
        <div className="font-bold text-xl text-slate-800">Sun Cola</div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2 md:space-x-4 ml-auto">
        <button 
            onClick={() => setPanelOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative"
        >
          <Bell size={20} />
          {hasNotifs && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
        
        <div className="flex items-center space-x-3 pl-2 md:pl-4 md:border-l border-slate-100">
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden">
            {/* Placeholder Avatar if no image */}
            <img 
              src={`https://ui-avatars.com/api/?name=${currentUser?.fullName}&background=0f172a&color=fff`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-sm font-bold text-slate-800">{currentUser?.fullName}</div>
            <div className="text-xs text-slate-500">{currentUser?.email}</div>
          </div>
        </div>
      </div>
    </div>

    {/* Right Slide-out Panel */}
    {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setPanelOpen(false)}>
            <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex space-x-4">
                        <button onClick={() => setPanelTab('NOTIFS')} className={`font-bold ${panelTab === 'NOTIFS' ? 'text-sun-600' : 'text-slate-400'}`}>Notifications</button>
                        <button onClick={() => setPanelTab('MESSAGES')} className={`font-bold ${panelTab === 'MESSAGES' ? 'text-sun-600' : 'text-slate-400'}`}>Messages</button>
                    </div>
                    <button onClick={() => setPanelOpen(false)} className="p-2 text-slate-400 hover:text-slate-800">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    {panelTab === 'NOTIFS' && (
                        <div className="space-y-4">
                            {currentUser?.role === UserRole.SUPER_ADMIN ? (
                                <>
                                    {pendingRequests.map(req => {
                                        const hubName = hubs.find(h => h.id === req.hubId)?.name || req.hubId;
                                        return (
                                            <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="font-bold text-slate-800 mb-1">{hubName} requested stock</div>
                                                <div className="text-sm text-slate-500 mb-3">
                                                    {req.items.map(i => {
                                                        const p = products.find(prod => prod.id === i.productId);
                                                        return <div key={i.productId}>{p?.name} x {i.quantity}</div>
                                                    })}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleApproveStockRequest(req.id)} className="flex-1 text-xs font-bold py-2 bg-green-500 text-white rounded hover:bg-green-600">Approve</button>
                                                    <button onClick={() => handleRejectStockRequest(req.id)} className="flex-1 text-xs font-bold py-2 border border-red-500 text-red-500 rounded hover:bg-red-50">Reject</button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {pendingRequests.length === 0 && <div className="text-center text-slate-400 py-8">No new notifications</div>}
                                </>
                            ) : (
                                <div className="text-center text-slate-400 py-8">Notifications are cleared</div>
                            )}
                        </div>
                    )}

                    {panelTab === 'MESSAGES' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                                {relevantMessages.map(msg => {
                                    const isMe = msg.senderId === currentUser?.id;
                                    return (
                                        <div key={msg.id} className={`p-3 rounded-xl max-w-[80%] ${isMe ? 'bg-sun-600 text-white self-end ml-auto' : 'bg-white border text-slate-800'}`}>
                                            {!isMe && <div className="text-xs font-bold mb-1 opacity-50">{msg.senderId} (to {msg.receiverId})</div>}
                                            <div className="text-sm">{msg.content}</div>
                                        </div>
                                    )
                                })}
                                {relevantMessages.length === 0 && <div className="text-center text-slate-400 py-8">No messages</div>}
                            </div>
                        </div>
                    )}
                </div>

                {panelTab === 'MESSAGES' && (
                    <div className="p-4 border-t bg-white">
                        {currentUser?.role === UserRole.SUPER_ADMIN && (
                            <select 
                                className="w-full mb-2 p-2 text-sm border rounded bg-slate-50 outline-none"
                                value={selectedHubReceiver}
                                onChange={e => setSelectedHubReceiver(e.target.value)}
                            >
                                <option value="ALL_HUBS">All Hubs (Broadcast)</option>
                                {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        )}
                        <div className="flex items-center space-x-2">
                            <input 
                                type="text"
                                className="flex-1 p-2 border rounded-lg outline-none text-sm"
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button onClick={handleSendMessage} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )}
    </>
  );
};

export default TopBar;
