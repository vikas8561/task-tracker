import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, TrendingUp, BookMarked, Zap, LogOut, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', id: 'nav-tasks' },
  { to: '/progress', icon: TrendingUp, label: 'Progress', id: 'nav-progress' },
  { to: '/revision', icon: BookMarked, label: 'Revision', id: 'nav-revision' },
  { to: '/notes', icon: FileText, label: 'Notes', id: 'nav-notes' },
];

export default function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }) {
  const location = useLocation();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Logo row + collapse toggle */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={18} color="var(--accent-1)" />
          </div>
          {!collapsed && <span className="sidebar-logo-text">Taskabelle</span>}

          {/* Collapse toggle button — desktop only */}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            id="sidebar-collapse-btn"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {!collapsed && <span className="nav-section-label">Menu</span>}
          {navItems.map(({ to, icon: Icon, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={to === '/'}
              onClick={onClose}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="nav-link-icon" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="btn btn-ghost sidebar-logout-btn"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span style={{ marginLeft: 'var(--space-2)' }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99, backdropFilter: 'blur(2px)' }}
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
