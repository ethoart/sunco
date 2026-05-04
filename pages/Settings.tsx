import React, { useState, useEffect } from 'react';
import { useERP } from '../contexts/ERPContext';
import { CompanySettings, Hub, UserRole } from '../types';
import { Building2, Plus, Edit, Trash2, Smartphone, QrCode, PowerOff } from 'lucide-react';

const SettingsPage = () => {
  const { 
    currentUser, 
    companySettings, 
    updateCompanySettings,
    hubs,
    addHub,
    updateHub,
    deleteHub,
    API_BASE_URL
  } = useERP();

  const [activeTab, setActiveTab] = useState<'COMPANY' | 'HUBS' | 'WHATSAPP'>('COMPANY');

  // Company Settings State
  const [compName, setCompName] = useState(companySettings?.companyName || '');
  const [compAddress, setCompAddress] = useState(companySettings?.address || '');
  const [compEmail, setCompEmail] = useState(companySettings?.email || '');
  const [compPhone, setCompPhone] = useState(companySettings?.phone || '');
  const [compTagline, setCompTagline] = useState(companySettings?.tagline || '');
  const [compLogoBase64, setCompLogoBase64] = useState(companySettings?.logoBase64 || '');
  const [salesThreshold, setSalesThreshold] = useState(companySettings?.salesTargetThreshold || 1000000);
  const [salesBonusPct, setSalesBonusPct] = useState(companySettings?.salesTargetBonusPercentage || 5);

  // Hubs State
  const [isEditingHub, setIsEditingHub] = useState<Hub | null>(null);
  const [hubName, setHubName] = useState('');
  const [hubLocation, setHubLocation] = useState('');

  // WhatsApp State
  const [waStatus, setWaStatus] = useState<string>('DISCONNECTED');
  const [waQr, setWaQr] = useState<string | null>(null);

  // Fetch WhatsApp Status periodically if on WhatsApp tab
  useEffect(() => {
     let interval: any;
     if (activeTab === 'WHATSAPP') {
         const fetchStatus = async () => {
             try {
                const res = await fetch(API_BASE_URL + '/api/whatsapp/status');
                const data = await res.json();
                setWaStatus(data.status);
                if (data.qr) setWaQr(data.qr);
             } catch (e) {}
         };
         fetchStatus();
         interval = setInterval(fetchStatus, 3000);
     }
     return () => clearInterval(interval);
  }, [activeTab, API_BASE_URL]);

  const initWhatsApp = async () => {
      try {
          const res = await fetch(API_BASE_URL + '/api/whatsapp/init', { method: 'POST' });
          const data = await res.json();
          setWaStatus(data.status);
      } catch (e) {}
  };

  const logoutWhatsApp = async () => {
      try {
          const res = await fetch(API_BASE_URL + '/api/whatsapp/logout', { method: 'POST' });
          const data = await res.json();
          setWaStatus(data.status);
          setWaQr(null);
      } catch (e) {}
  };

  // Fallback check: only SUPER_ADMIN should be here (optional, handled visually)
  if (currentUser?.role !== UserRole.SUPER_ADMIN) {
    return <div className="p-8 text-center text-slate-500">You do not have permission to view this page.</div>;
  }

  const handleSaveCompany = () => {
    if (companySettings) {
      updateCompanySettings({
        ...companySettings,
        companyName: compName,
        address: compAddress,
        email: compEmail,
        phone: compPhone,
        tagline: compTagline,
        logoBase64: compLogoBase64,
        salesTargetThreshold: salesThreshold,
        salesTargetBonusPercentage: salesBonusPct
      });
      alert('Company Settings updated successfully!');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert("File size should be less than 2MB");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveHub = () => {
    if (!hubName || !hubLocation) return alert("Please fill all Hub details");
    
    if (isEditingHub) {
      updateHub(isEditingHub.id, { name: hubName, location: hubLocation });
    } else {
      addHub({
        id: `hub-${Date.now()}`,
        name: hubName,
        location: hubLocation
      });
    }
    
    setIsEditingHub(null);
    setHubName('');
    setHubLocation('');
  };

  const handeDeleteHub = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteHub(id);
    }
  };

  const startEditHub = (hub: Hub) => {
    setIsEditingHub(hub);
    setHubName(hub.name);
    setHubLocation(hub.location);
    setActiveTab('HUBS');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('COMPANY')}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'COMPANY' ? 'border-sun-600 text-sun-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Company Information
        </button>
        <button
          onClick={() => setActiveTab('HUBS')}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'HUBS' ? 'border-sun-600 text-sun-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Branches / Hubs
        </button>
        <button
          onClick={() => setActiveTab('WHATSAPP')}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 flex items-center space-x-2 ${activeTab === 'WHATSAPP' ? 'border-sun-600 text-sun-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Smartphone size={18} />
          <span>WhatsApp Setup</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        {activeTab === 'COMPANY' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4">
              <Building2 className="mr-2 h-5 w-5 text-sun-600" />
              Invoice & Company Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50"
                  value={compName} onChange={e => setCompName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tagline / Slogan</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50"
                  value={compTagline} onChange={e => setCompTagline(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo (Optional)</label>
                <div className="flex items-center space-x-4">
                  {compLogoBase64 && (
                    <img src={compLogoBase64} alt="Company Logo" className="h-16 w-16 object-contain rounded border border-slate-200" />
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="p-2 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50 text-sm" />
                  {compLogoBase64 && (
                      <button onClick={() => setCompLogoBase64('')} className="text-red-500 text-sm">Remove</button>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Office Address (Line 1/2)</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50"
                  value={compAddress} onChange={e => setCompAddress(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                <input type="email" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50"
                  value={compEmail} onChange={e => setCompEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50"
                  value={compPhone} onChange={e => setCompPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sales Bonus Threshold (LKR)</label>
                <input type="number" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50"
                  value={salesThreshold} onChange={e => setSalesThreshold(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sales Target Bonus (%)</label>
                <input type="number" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-slate-50"
                  value={salesBonusPct} onChange={e => setSalesBonusPct(Number(e.target.value))} />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={handleSaveCompany} className="px-6 py-2 bg-sun-600 text-white font-bold rounded-lg hover:bg-sun-700 transition">
                Save Company Details
              </button>
            </div>
          </div>
        )}

        {activeTab === 'HUBS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Manage Hubs</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hub Name</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-white"
                  value={hubName} onChange={e => setHubName(e.target.value)} placeholder="e.g. Colombo Main Hub" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location / District</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-sun-500 bg-white"
                  value={hubLocation} onChange={e => setHubLocation(e.target.value)} placeholder="e.g. Colombo 03" />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3">
                {isEditingHub && (
                  <button onClick={() => { setIsEditingHub(null); setHubName(''); setHubLocation(''); }} className="px-4 py-2 text-slate-500 hover:text-slate-800">
                    Cancel
                  </button>
                )}
                <button onClick={handleSaveHub} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition flex items-center">
                  <Plus size={18} className="mr-2" />
                  {isEditingHub ? 'Update Hub' : 'Add New Hub'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-6">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hub ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {hubs.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">{h.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{h.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{h.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => startEditHub(h)} className="text-blue-600 hover:text-blue-800 mx-2" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handeDeleteHub(h.id, h.name)} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {hubs.length === 0 && (
                     <tr><td colSpan={4} className="text-center py-4 text-slate-500">No hubs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {activeTab === 'WHATSAPP' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Smartphone className="mr-2 h-5 w-5 text-green-500" />
                WhatsApp API Integration
              </h2>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 max-w-xl text-center space-y-4">
               <div>
                  <h3 className="text-md font-bold text-slate-800">Connection Status</h3>
                  <div className={`mt-2 inline-block px-4 py-1 rounded-full text-sm font-medium border ${
                      waStatus === 'CONNECTED' ? 'bg-green-100 text-green-700 border-green-200' : 
                      waStatus === 'QR_READY' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                      waStatus === 'CONNECTING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                      {waStatus}
                  </div>
               </div>

               {waStatus === 'DISCONNECTED' && (
                  <div>
                      <p className="text-sm text-slate-500 mb-4">Initialize the WhatsApp client to generate a QR code for login. Keep your phone ready.</p>
                      <button onClick={initWhatsApp} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition inline-flex items-center">
                          <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                      </button>
                  </div>
               )}

               {waStatus === 'CONNECTING' && (
                   <p className="text-sm text-slate-500">Initializing browser session, please wait...</p>
               )}

               {waStatus === 'QR_READY' && waQr && (
                   <div className="flex flex-col items-center">
                      <p className="text-sm text-slate-500 mb-2">Scan this QR code using WhatsApp on your phone (Linked Devices):</p>
                      <img src={waQr} alt="WhatsApp QR Code" className="w-64 h-64 border-4 border-white rounded-xl shadow-sm" />
                   </div>
               )}

               {waStatus === 'CONNECTED' && (
                   <div className="flex flex-col items-center space-y-4">
                      <p className="text-sm text-green-600 font-medium">WhatsApp is connected and ready to send invoices!</p>
                      <button onClick={logoutWhatsApp} className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition inline-flex items-center">
                          <PowerOff className="mr-2 h-4 w-4" /> Disconnect Device
                      </button>
                   </div>
               )}
            </div>
            <p className="text-xs text-slate-400 mt-4 max-w-xl">
               Note: To minimize server resource usage, WhatsApp uses an internal headless browser. If the application environment restarts, you may need to scan the QR code again.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPage;
