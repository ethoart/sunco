import React, { useState } from 'react';
import { ERPProvider, useERP } from './contexts/ERPContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Finance from './pages/Finance';
import UsersPage from './pages/Users';
import Customers from './pages/Customers';
import SettingsPage from './pages/Settings';
import { Menu } from 'lucide-react';

const LoginPage = () => {
  const { login } = useERP();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email, password)) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sun-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-sun-600 mb-2">Sun Cola ERP</h1>
            <p className="text-gray-500">Enterprise Resource Planning</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
              placeholder="admin@suncola.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-sun-500 bg-white text-black"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all">
            Login to System
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-gray-400">
            <p>Demo: admin@suncola.com / password123</p>
        </div>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { currentUser } = useERP();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!currentUser) return <LoginPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'customers': return <Customers />;
      case 'invoices': return <Invoices />;
      case 'finance': return <Finance />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        currentPage={currentPage}
        setPage={setCurrentPage}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopBar setSidebarOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ERPProvider>
      <MainLayout />
    </ERPProvider>
  );
};

export default App;