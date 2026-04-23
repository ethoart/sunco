import React from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, Package, Users, FileText, 
  DollarSign, LogOut, X, Settings, PieChart, HelpCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  currentPage: string;
  setPage: (p: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentPage, setPage }) => {
  const { currentUser, logout } = useERP();

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['all'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['all'] },
    { id: 'dispatch', label: 'Dispatch', icon: Package, roles: [UserRole.SUPER_ADMIN] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['all'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, roles: [UserRole.HUB_ADMIN, UserRole.STAFF, UserRole.FINANCIAL_MANAGER] },
    { id: 'finance', label: 'Finance', icon: DollarSign, roles: [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_MANAGER] },
    { id: 'users', label: 'Users', icon: Users, roles: [UserRole.SUPER_ADMIN, UserRole.HUB_ADMIN, UserRole.FINANCIAL_MANAGER] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes('all') || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-24 bg-white border-r border-slate-100 flex flex-col items-center py-8 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto overflow-x-hidden h-screen no-scrollbar`}>
        
        {/* Logo */}
        <div className="mb-12">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200 text-xl">
            S
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full px-4 space-y-4 flex flex-col items-center">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                setIsOpen(false);
              }}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group relative ${
                currentPage === item.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={item.label}
            >
              <item.icon size={22} strokeWidth={currentPage === item.id ? 2.5 : 2} />
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto space-y-4 flex flex-col items-center w-full px-4">
          {currentUser && currentUser.role === UserRole.SUPER_ADMIN && (
            <button 
              onClick={() => {
                setPage('settings');
                setIsOpen(false);
              }}
              title="Settings"
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors ${
                currentPage === 'settings'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings size={22} />
            </button>
          )}
          <button 
            onClick={logout}
            className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Sign Out"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
