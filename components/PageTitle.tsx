import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titleForPath = (path: string): string => {
  // Normalize without trailing slash except root
  const p = path.replace(/\/$/, '') || '/';
  if (p === '/auth') return 'Login';
  if (p === '/') return 'Dashboard';
  if (p.startsWith('/admin/users')) return 'Manage Users';
  if (p.startsWith('/admin')) return 'Admin Dashboard';
  if (p.startsWith('/automations')) return 'Automations';
  if (p.startsWith('/call-recordings')) return 'Call Recordings';
  if (p.startsWith('/campaigns')) return 'Campaigns';
  if (p.startsWith('/chat')) return 'AI Chat';
  if (p.startsWith('/settings')) return 'Settings';
  return 'App';
};

export const PageTitle = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const next = titleForPath(pathname);
    if (document.title !== next) document.title = next;
  }, [pathname]);
  return null;
};

export default PageTitle;

