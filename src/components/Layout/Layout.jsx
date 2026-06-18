import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import TopNav, { BottomNav } from './Sidebar';

export default function Layout({ children, onAddTask, onImportClick, onAddQuestion, onImportQuestion }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isNotes = location.pathname.startsWith('/notes');

  return (
    <div className={`app-layout${isNotes ? ' app-layout--notes' : ''}`}>
      <TopNav
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onMenuToggle={() => setMobileOpen((v) => !v)}
        onAddTask={onAddTask}
        onImportClick={onImportClick}
        onAddQuestion={onAddQuestion}
        onImportQuestion={onImportQuestion}
      />
      <main className="app-main">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
