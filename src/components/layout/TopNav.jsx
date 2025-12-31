import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Tag, Settings, TrendingUp } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/month', icon: Calendar, label: 'Month' },
  { path: '/tags', icon: Tag, label: 'Tags' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export const TopNav = () => {
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Premium Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl">
                <TrendingUp size={28} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                TradeZen
              </h1>
              <span className="text-xs text-slate-400 font-medium -mt-1">Trading Journal</span>
            </div>
          </Link>

          {/* Premium Navigation */}
          <div className="flex items-center gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/month' && location.pathname.startsWith('/month/'));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl
                    font-semibold text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }
                  `}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  <span className="hidden sm:inline">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-white/10 rounded-xl" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
