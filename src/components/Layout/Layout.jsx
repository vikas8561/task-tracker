import { useState } from 'react';
import Sidebar, { BottomNav } from './Sidebar';
import Header from './Header';

export default function Layout({ children, onAddTask, onImportClick, searchQuery, onSearchChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main className="app-main">
        <Header
          onMenuToggle={() => setMobileOpen((v) => !v)}
          onAddTask={onAddTask}
          onImportClick={onImportClick}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        <div className="page-content">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
