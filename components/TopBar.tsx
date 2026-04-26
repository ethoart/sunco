import React, { useState, useRef } from 'react';
import { Bell, MessageSquare, Menu, X, ArrowRight, Check, Paperclip, XCircle } from 'lucide-react';
import { useERP } from '../contexts/ERPContext';
import { UserRole } from '../types';

interface TopBarProps {
  setSidebarOpen: (open: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setSidebarOpen }) => {
  const { currentUser, stockRequests, updateStockRequest, hubs, products, messages, addMessage, users } = useERP();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'NOTIFS' | 'MESSAGES'>('NOTIFS');
  const [messageText, setMessageText] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('PUBLIC');
  const [attachments, setAttachments] = useState<{name: string, content: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingRequests = stockRequests.filter(r => r.status === 'PENDING');

  const relevantMessages = messages.filter(m => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) return true;
    return m.receiverId === 'ALL_HUBS' || m.receiverId === 'PUBLIC' || m.receiverId === currentUser?.hubId || m.senderId === currentUser?.id || m.receiverId === currentUser?.id;
  }).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const [lastSeenTime, setLastSeenTime] = useState(() => {
    return localStorage.getItem(`lastSeenPanelTime_${currentUser?.id}`) || '1970-01-01T00:00:00Z';
  });

  React.useEffect(() => {
    if (panelOpen) {
      const now = new Date().toISOString();
      setLastSeenTime(now);
      localStorage.setItem(`lastSeenPanelTime_${currentUser?.id}`, now);
    }
  }, [panelOpen, currentUser?.id]);

  const unreadMessagesCount = relevantMessages.filter(m => m.createdAt > lastSeenTime && m.senderId !== currentUser?.id).length;
  const notifCount = (currentUser?.role === UserRole.SUPER_ADMIN ? pendingRequests.length : 0) + unreadMessagesCount;
  const hasNotifs = notifCount > 0;

  const handleApproveStockRequest = (id: string) => {
      // In a real scenario, this would trigger a stock transfer. 
      // For now we just mark APPROVED.
      updateStockRequest(id, { status: 'APPROVED' });
  };

  const handleRejectStockRequest = (id: string) => {
      updateStockRequest(id, { status: 'REJECTED' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files) as File[];
          newFiles.forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  setAttachments(prev => [...prev, { name: file.name, content: reader.result as string }]);
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const removeAttachment = (indexToRemove: number) => {
      setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendMessage = () => {
      if (!messageText.trim() && attachments.length === 0) return;
      
      const attsStrings = attachments.map(a => a.content);

      addMessage({
          id: `msg-${Date.now()}`,
          senderId: currentUser?.id || 'unknown',
          receiverId: selectedReceiver,
          content: messageText,
          attachments: attsStrings,
          createdAt: new Date().toISOString()
      });
      
      setMessageText('');
      setAttachments([]);
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
          {hasNotifs && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{notifCount}</span>}
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
                                    const senderName = users.find(u => u.id === msg.senderId)?.username || msg.senderId;
                                    const receiverName = msg.receiverId === 'PUBLIC' ? 'Public' : msg.receiverId === 'ALL_HUBS' ? 'All Hubs' : msg.receiverId === 'HEAD_OFFICE' ? 'Head Office' : hubs.find(h => h.id === msg.receiverId)?.name || users.find(u => u.id === msg.receiverId)?.username || msg.receiverId;
                                    return (
                                        <div key={msg.id} className={`p-3 rounded-xl max-w-[80%] flex flex-col ${isMe ? 'bg-sun-600 text-white self-end ml-auto' : 'bg-white border text-slate-800'}`}>
                                            <div className="text-[10px] font-bold mb-1 opacity-70">
                                                {isMe ? `You (to ${receiverName})` : `${senderName} (to ${receiverName})`}
                                            </div>
                                            <div className="text-sm">{msg.content}</div>
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {msg.attachments.map((att, i) => (
                                                        <div key={i} className="text-xs">
                                                            {att.startsWith('data:image') ? (
                                                                <img src={att} alt="attachment" className="rounded max-h-32 object-contain" />
                                                            ) : (
                                                                <a href={att} download="attachment" className="underline break-words">Attachment {i+1}</a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                        <select 
                            className="w-full mb-2 p-2 text-sm border rounded bg-slate-50 outline-none"
                            value={selectedReceiver}
                            onChange={e => setSelectedReceiver(e.target.value)}
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="ALL_HUBS">All Hubs (Broadcast)</option>
                            <option value="HEAD_OFFICE">Head Office</option>
                            <optgroup label="Hubs">
                                {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </optgroup>
                            <optgroup label="Users">
                                {users.filter(u => u.id !== currentUser?.id).map(u => <option key={u.id} value={u.id}>{u.username || u.name} ({u.role})</option>)}
                            </optgroup>
                        </select>
                        
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments.map((att, i) => (
                                    <div key={i} className="flex items-center bg-slate-100 rounded-full px-2 py-1 text-xs">
                                        <span className="truncate max-w-[100px]">{att.name}</span>
                                        <button onClick={() => removeAttachment(i)} className="ml-1 text-red-500"><XCircle size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex items-center space-x-2 relative">
                            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-slate-600">
                                <Paperclip size={20} />
                            </button>
                            <input 
                                type="text"
                                className="flex-1 p-2 border rounded-lg outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button onClick={handleSendMessage} className={`p-2 rounded-lg text-white transition-colors ${messageText.trim() || attachments.length > 0 ? 'bg-sun-600 hover:bg-sun-700' : 'bg-slate-300 cursor-not-allowed'}`}>
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
