import React from 'react';
import { Bell, Settings, Menu } from 'lucide-react';
import { useERP } from '../contexts/ERPContext';

interface TopBarProps {
  setSidebarOpen: (open: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setSidebarOpen }) => {
  const { currentUser } = useERP();

  return (
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
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
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
  );
};

export default TopBar;
