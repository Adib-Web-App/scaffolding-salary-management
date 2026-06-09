import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sidebar_collapsed';

function readCollapsedPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useSidebarLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => {
      setIsDesktop(media.matches);
      if (media.matches) setMobileOpen(false);
    };
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      return;
    }
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const toggleLabel = isDesktop
    ? collapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar'
    : mobileOpen
      ? 'Close menu'
      : 'Open menu';

  const sidebarExpanded = isDesktop ? !collapsed : mobileOpen;

  return {
    collapsed,
    mobileOpen,
    isDesktop,
    toggleSidebar,
    closeMobile,
    toggleLabel,
    sidebarExpanded,
  };
}
