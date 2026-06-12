import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, TrendingUp, BookMarked, Zap, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', id: 'nav-tasks' },
  { to: '/progress', icon: TrendingUp, label: 'Progress', id: 'nav-progress' },
  { to: '/revision', icon: BookMarked, label: 'Revision', id: 'nav-revision' },
];

import { supabase } from '../../lib/supabase';

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={18} color="var(--accent-1)" />
          </div>
          <span className="sidebar-logo-text">StudyTrack</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-section-label">Menu</span>
          {navItems.map(({ to, icon: Icon, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={to === '/'}
              onClick={onClose}
            >
              <Icon size={18} className="nav-link-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-glass)' }}>
          <button 
            onClick={handleLogout} 
            className="btn btn-ghost" 
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
          >
            <LogOut size={16} style={{ marginRight: 'var(--space-2)' }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 99, backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}
    </>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map(({ to, icon: Icon, label, id }) => (
        <NavLink
          key={to}
          to={to}
          id={`bottom-${id}`}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          end={to === '/'}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
