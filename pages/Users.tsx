import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole, User } from '../types';
import { Users as UserIcon, Shield, MapPin, Plus, Trash2, DollarSign, Briefcase, Mail, Hash, Edit } from 'lucide-react';

const UsersPage = () => {
  const { users, addUser, removeUser, updateUser, hubs, currentUser, formatCurrency } = useERP();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State for New User
  const [newUser, setNewUser] = useState<Partial<User>>({
      username: '', 
      email: '',
      password: '',
      fullName: '', 
      role: UserRole.STAFF, 
      hubId: '',
      jobTitle: '',
      employeeId: '',
      basicSalary: 0,
      bonuses: 0
  });

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isFinancialManager = currentUser?.role === UserRole.FINANCIAL_MANAGER;
  const isHubAdmin = currentUser?.role === UserRole.HUB_ADMIN;

  const canAddUser = isSuperAdmin || isHubAdmin;
  const canManageSalary = isSuperAdmin || isFinancialManager;
  const canDeleteUser = isSuperAdmin;
  const canEditUser = isSuperAdmin || isFinancialManager;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.username || !newUser.fullName || !newUser.email || !newUser.password || !newUser.employeeId) return;

      addUser({
          id: `u-${Date.now()}`,
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          employeeId: newUser.employeeId,
          fullName: newUser.fullName,
          role: newUser.role as UserRole,
          jobTitle: newUser.jobTitle || 'Staff',
          hubId: newUser.role === UserRole.SUPER_ADMIN || newUser.role === UserRole.FINANCIAL_MANAGER ? undefined : (newUser.hubId || currentUser?.hubId),
          permissions: [],
          phone: '',
          basicSalary: newUser.basicSalary || 0,
          bonuses: newUser.bonuses || 0
      });
      setShowForm(false);
      setNewUser({ 
        username: '', email: '', password: '', fullName: '', 
        role: UserRole.STAFF, hubId: '', jobTitle: '', employeeId: '',
        basicSalary: 0, bonuses: 0
      });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Construct updates based on role
    const updates: Partial<User> = {};
    
    if (isSuperAdmin) {
        updates.fullName = editingUser.fullName;
        updates.email = editingUser.email;
        updates.role = editingUser.role;
        updates.hubId = editingUser.hubId;
        updates.jobTitle = editingUser.jobTitle;
        updates.employeeId = editingUser.employeeId;
        updates.basicSalary = editingUser.basicSalary;
        updates.bonuses = editingUser.bonuses;
        // Password update could be added here if needed
    } else if (isFinancialManager) {
        updates.basicSalary = editingUser.basicSalary;
        updates.bonuses = editingUser.bonuses;
    }

    updateUser(editingUser.id, updates);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
           <p className="text-slate-500">Manage system access, roles, and payroll.</p>
        </div>
        {canAddUser && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </button>
        )}
      </div>

      {/* Add User Form */}
      {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-fade-in">
              <h3 className="text-lg font-bold mb-4">Create New User</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Employee ID (e.g. EMP-001)" required
                    className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                    value={newUser.employeeId} onChange={e => setNewUser({...newUser, employeeId: e.target.value})}
                  />
                  <input 
                    placeholder="Full Name" required
                    className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                    value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                  />
                  <input 
                    placeholder="Username" required
                    className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                    value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                  />
                  <input 
                    placeholder="Email" type="email" required
                    className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                    value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                  <input 
                    placeholder="Password" type="password" required
                    className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                    value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                  <input 
                    placeholder="Job Title" required
                    className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                    value={newUser.jobTitle} onChange={e => setNewUser({...newUser, jobTitle: e.target.value})}
                  />
                  
                  <select 
                    className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                  >
                      <option value={UserRole.STAFF}>Staff</option>
                      {isSuperAdmin && <option value={UserRole.HUB_ADMIN}>Hub Admin</option>}
                      {isSuperAdmin && <option value={UserRole.FINANCIAL_MANAGER}>Financial Manager</option>}
                      {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
                  </select>
                  
                  {/* Hub Selection */}
                  {isSuperAdmin && newUser.role !== UserRole.SUPER_ADMIN && newUser.role !== UserRole.FINANCIAL_MANAGER && (
                      <select 
                        className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                        value={newUser.hubId} 
                        onChange={e => setNewUser({...newUser, hubId: e.target.value})}
                        required
                      >
                          <option value="">Select Hub</option>
                          {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                  )}

                  {canManageSalary && (
                    <>
                      <input 
                        placeholder="Basic Salary (LKR)" type="number"
                        className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                        value={newUser.basicSalary || ''} onChange={e => setNewUser({...newUser, basicSalary: Number(e.target.value)})}
                      />
                      <input 
                        placeholder="Bonuses (LKR)" type="number"
                        className="p-2 border border-slate-300 rounded-lg bg-white text-black"
                        value={newUser.bonuses || ''} onChange={e => setNewUser({...newUser, bonuses: Number(e.target.value)})}
                      />
                    </>
                  )}

                  <div className="md:col-span-2 flex justify-end mt-2">
                      <button type="submit" className="px-6 py-2 bg-sun-600 text-white rounded-lg font-medium">Create User</button>
                  </div>
              </form>
          </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
                {isSuperAdmin ? 'Edit User Details' : 'Manage Payroll'}
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              
              {isSuperAdmin && (
                  <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input className="w-full p-2 border rounded-lg" value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input className="w-full p-2 border rounded-lg" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Job Title</label>
                        <input className="w-full p-2 border rounded-lg" value={editingUser.jobTitle} onChange={e => setEditingUser({...editingUser, jobTitle: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select className="w-full p-2 border rounded-lg" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                            <option value={UserRole.STAFF}>Staff</option>
                            <option value={UserRole.HUB_ADMIN}>Hub Admin</option>
                            <option value={UserRole.FINANCIAL_MANAGER}>Financial Manager</option>
                            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                        </select>
                    </div>
                    {editingUser.role !== UserRole.SUPER_ADMIN && editingUser.role !== UserRole.FINANCIAL_MANAGER && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hub</label>
                            <select className="w-full p-2 border rounded-lg" value={editingUser.hubId || ''} onChange={e => setEditingUser({...editingUser, hubId: e.target.value})}>
                                <option value="">Select Hub</option>
                                {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                    )}
                  </>
              )}

              {canManageSalary && (
                  <>
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="font-bold text-sm text-slate-500 mb-2 uppercase">Payroll Details</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Basic Salary (LKR)</label>
                            <input 
                            type="number"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                            value={editingUser.basicSalary || 0}
                            onChange={e => setEditingUser({...editingUser, basicSalary: Number(e.target.value)})}
                            />
                        </div>
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700">Performance Bonus (LKR)</label>
                            <input 
                            type="number"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                            value={editingUser.bonuses || 0}
                            onChange={e => setEditingUser({...editingUser, bonuses: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                  </>
              )}

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                      user.role === UserRole.SUPER_ADMIN ? 'bg-purple-500' :
                      user.role === UserRole.FINANCIAL_MANAGER ? 'bg-yellow-500' :
                      user.role === UserRole.HUB_ADMIN ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  
                  <div className="flex items-start justify-between mb-4 pl-3">
                      <div className="flex items-center space-x-3">
                          <div className="bg-slate-100 p-2 rounded-full">
                              <UserIcon size={20} className="text-slate-600" />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800">{user.fullName}</h3>
                              <p className="text-xs text-slate-500 flex items-center">
                                <Hash size={10} className="mr-1" /> {user.employeeId}
                              </p>
                          </div>
                      </div>
                      <span className="text-xs font-bold uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded">
                          {user.role.replace('_', ' ')}
                      </span>
                  </div>

                  <div className="pl-3 space-y-2 mb-4">
                      <div className="flex items-center text-sm text-slate-600">
                          <Briefcase size={14} className="mr-2 text-slate-400" />
                          <span>{user.jobTitle || 'No Title'}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                          <Mail size={14} className="mr-2 text-slate-400" />
                          <span className="truncate">{user.email}</span>
                      </div>
                      {user.hubId && (
                          <div className="flex items-center text-sm text-slate-600">
                              <MapPin size={14} className="mr-2 text-slate-400" />
                              <span>{hubs.find(h => h.id === user.hubId)?.name || 'Unknown Hub'}</span>
                          </div>
                      )}
                  </div>

                  {canManageSalary && (
                    <div className="pl-3 mb-4 p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Basic Salary:</span>
                        <span className="font-mono font-medium">{formatCurrency(user.basicSalary || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Bonus:</span>
                        <span className="font-mono font-medium text-green-600">+{formatCurrency(user.bonuses || 0)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pl-3 flex space-x-2 pt-4 border-t border-slate-100">
                    {canEditUser && (
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                      >
                        {isSuperAdmin ? <Edit size={14} className="mr-2" /> : <DollarSign size={14} className="mr-2" />}
                        {isSuperAdmin ? 'Edit' : 'Payroll'}
                      </button>
                    )}
                    {canDeleteUser && user.id !== currentUser?.id && (
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this user?')) {
                            removeUser(user.id);
                          }
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default UsersPage;