import { useEffect } from 'react';
import { documentTitle } from '../config/branding';

export function usePageTitle(pageTitle) {
  useEffect(() => {
    if (pageTitle === null) return;
    document.title = documentTitle(pageTitle);
    return () => {
      document.title = documentTitle();
    };
  }, [pageTitle]);
}
