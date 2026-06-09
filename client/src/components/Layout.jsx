import { Outlet, useLocation } from 'react-router-dom';
import AppBranding from './AppBranding';
import Sidebar from './Sidebar';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import { BRAND } from '../config/branding';

const titles = {
  '/': 'Summary Dashboard',
  '/projects': 'Project Management',
  '/work-entries': 'Daily Work Entry',
  '/advances': 'Advance Payments',
  '/performance': 'Worker Performance',
  '/attendance': 'Attendance System',
  '/payroll': 'Payroll & Payslip',
  '/users': 'User Management',
  '/access-denied': 'Access Denied',
};

function MenuIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function Layout() {
  const { collapsed, mobileOpen, toggleSidebar, closeMobile, toggleLabel, sidebarExpanded } =
    useSidebarLayout();
  const location = useLocation();
  const title = titles[location.pathname] || BRAND.app;
  usePageTitle(title);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
      />
      <div className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            onClick={toggleSidebar}
            aria-label={toggleLabel}
            aria-expanded={sidebarExpanded}
          >
            <MenuIcon />
          </button>
          <AppBranding variant="header" pageTitle={title} />
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
