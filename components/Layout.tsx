
import React from 'react';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: { fullName: string; role: Role };
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'production', label: 'Production', icon: '🏭' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'costs', label: 'Costs', icon: '💵', restricted: [Role.ADMIN, Role.MANAGEMENT] },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'integrity', label: 'Integrity', icon: '⚖️', restricted: [Role.ADMIN, Role.MANAGEMENT] },
    { id: 'admin', label: 'Settings', icon: '⚙️', restricted: [Role.ADMIN] },
  ];

  const filteredTabs = tabs.filter(t => !t.restricted || t.restricted.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <nav className="bg-slate-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col fixed md:relative bottom-0 md:bottom-auto z-50 md:min-h-screen border-r border-slate-800">
        <div className="p-8 hidden md:block">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">F</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">FOCIS</h1>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1">v1.5 FINAL</p>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto flex-1 px-4 py-2 space-x-1 md:space-x-0 md:space-y-1">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col md:flex-row items-center p-4 md:px-5 md:py-4 rounded-2xl transition-all flex-1 md:flex-none ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl md:mr-4">{tab.icon}</span>
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-800 hidden md:block">
          <div className="bg-slate-800/50 p-4 rounded-2xl mb-6">
            <p className="text-xs font-black truncate text-slate-100 uppercase tracking-tight">{user.fullName}</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full text-left text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors flex items-center"
          >
            <span className="mr-3">🚪</span> Terminate Session
          </button>
        </div>
      </nav>

      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto max-h-screen">
        <header className="bg-white/90 backdrop-blur-xl border-b p-6 md:px-12 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center space-x-4">
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Status</div>
              <div className="text-[11px] font-black text-emerald-600 uppercase">Non-Negotiable Truth Active</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-100"></div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center font-black text-slate-400 text-xs">A</div>
          </div>
        </header>
        <div className="p-6 md:p-12 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
