import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar, { BottomNav } from './Sidebar';
import Header from './Header';

export default function Layout({ children, onAddTask, onImportClick, searchQuery, onSearchChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Persist collapsed state across reloads
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });

  // Auto-collapse when entering /notes, restore when leaving
  const isNotes = location.pathname.startsWith('/notes');
  useEffect(() => {
    if (isNotes) {
      setSidebarCollapsed(true);
    }
  }, [isNotes]);

  const toggleSidebar = () => {
    setSidebarCollapsed((v) => {
      try { localStorage.setItem('sidebar-collapsed', String(!v)); } catch {}
      return !v;
    });
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <main className="app-main">
        {!isNotes && (
          <Header
            onMenuToggle={() => setMobileOpen((v) => !v)}
            onAddTask={onAddTask}
            onImportClick={onImportClick}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}
        <div className="page-content">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
