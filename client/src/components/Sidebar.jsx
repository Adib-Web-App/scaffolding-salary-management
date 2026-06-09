import { NavLink, useNavigate } from 'react-router-dom';
import AppBranding from './AppBranding';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/projects', label: 'Projects', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { to: '/work-entries', label: 'Daily Work', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/advances', label: 'Advances', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/performance', label: 'Performance', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { to: '/attendance', label: 'Attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/payroll', label: 'Payroll & Payslip', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const usersNavItem = {
  to: '/users',
  label: 'Users',
  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
};

const roleBadgeClass = {
  ADMIN: 'bg-primary-100 text-primary-800',
  SUPERVISOR: 'bg-amber-100 text-amber-800',
  VIEWER: 'bg-slate-100 text-slate-700',
};

function NavItem({ to, label, icon, end, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'flex items-center rounded-lg text-sm font-medium transition',
          collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        ].join(' ')
      }
    >
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const showUsers = hasPermission('users:read');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white',
          'transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        ].join(' ')}
      >
        <div
          className={[
            'shrink-0 border-b border-slate-200 py-4 transition-all duration-300',
            collapsed ? 'px-4 lg:px-2' : 'px-4',
          ].join(' ')}
        >
          <AppBranding variant="sidebar" compact={collapsed} />
        </div>
        <nav
          className={[
            'flex-1 space-y-1 overflow-y-auto transition-all duration-300',
            collapsed ? 'p-4 lg:p-2' : 'p-4',
          ].join(' ')}
        >
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              end={item.to === '/'}
              collapsed={collapsed}
              onNavigate={handleNavClick}
            />
          ))}
          {showUsers && (
            <NavItem
              to={usersNavItem.to}
              label={usersNavItem.label}
              icon={usersNavItem.icon}
              collapsed={collapsed}
              onNavigate={handleNavClick}
            />
          )}
        </nav>
        <div
          className={[
            'shrink-0 border-t border-slate-200 transition-all duration-300',
            collapsed ? 'p-4 lg:p-2' : 'p-4',
          ].join(' ')}
        >
          {user && (
            <div className={`mb-3 rounded-lg bg-slate-50 p-3 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-sm font-medium text-slate-900">{user.username}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass[user.role] || roleBadgeClass.VIEWER}`}
              >
                {user.role}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={[
              'flex w-full items-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
              collapsed ? 'justify-center gap-2 px-3 py-2 lg:px-2' : 'justify-center gap-2 px-3 py-2',
            ].join(' ')}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
