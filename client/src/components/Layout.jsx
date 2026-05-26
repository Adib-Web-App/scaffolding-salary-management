import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppBranding from './AppBranding';
import Sidebar from './Sidebar';
import { usePageTitle } from '../hooks/usePageTitle';
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

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || BRAND.app;
  usePageTitle(title);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
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
