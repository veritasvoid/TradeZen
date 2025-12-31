import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Tag, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/month', icon: Calendar, label: 'Month' },
  { path: '/tags', icon: Tag, label: 'Tags' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export const TopNav = () => {
  const location = useLocation();

  return (
    <nav className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-text-primary">TradeZen</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/month' && location.pathname.startsWith('/month/'));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    transition-colors font-medium
                    ${isActive 
                      ? 'bg-accent text-white' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
