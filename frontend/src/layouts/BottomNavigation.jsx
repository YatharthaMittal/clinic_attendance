import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarCheck, Users, CreditCard, BarChart2 } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Home', Icon: Home },
  { path: '/attendance', label: 'Attend', Icon: CalendarCheck },
  { path: '/patients', label: 'Patients', Icon: Users },
  { path: '/payments', label: 'Payments', Icon: CreditCard },
  { path: '/reports', label: 'Reports', Icon: BarChart2 },
];

const BottomNavigation = () => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-white border-t border-gray-100 z-50"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200
              ${isActive
                ? 'text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <span className={`
                  p-1.5 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-primary-50' : ''}
                `}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
