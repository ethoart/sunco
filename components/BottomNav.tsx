import React from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, Package, Users, FileText, 
  DollarSign, LogOut, Settings, MoreHorizontal
} from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  setPage: (p: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setPage, setSidebarOpen }) => {
  const { currentUser } = useERP();

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['all'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['all'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, roles: [UserRole.SUPER_ADMIN, UserRole.HUB_ADMIN, UserRole.STAFF, UserRole.FINANCIAL_MANAGER] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['all'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes('all') || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              currentPage === item.id 
                ? 'text-sun-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon size={20} className={currentPage === item.id ? 'stroke-[2.5px]' : ''} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
