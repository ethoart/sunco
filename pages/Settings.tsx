import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { CompanySettings, Hub, UserRole } from '../types';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';

const SettingsPage = () => {
  const { 
    currentUser, 
    companySettings, 
    updateCompanySettings,
    hubs,
    addHub,
    updateHub,
    deleteHub 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'COMPANY' | 'HUBS'>('COMPANY');

  // Company Settings State
  const [compName, setCompName] = useState(companySettings?.companyName || '');
  const [compAddress, setCompAddress] = useState(companySettings?.address || '');
  const [compEmail, setCompEmail] = useState(companySettings?.email || '');
  const [compPhone, setCompPhone] = useState(companySettings?.phone || '');
  const [compTagline, setCompTagline] = useState(companySettings?.tagline || '');

  // Hubs State
  const [isEditingHub, setIsEditingHub] = useState<Hub | null>(null);
  const [hubName, setHubName] = useState('');
  const [hubLocation, setHubLocation] = useState('');

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
        tagline: compTagline
      });
      alert('Company Settings updated successfully!');
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

      </div>
    </div>
  );
};

export default SettingsPage;
