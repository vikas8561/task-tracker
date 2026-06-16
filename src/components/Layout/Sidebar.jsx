import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, TrendingUp, BookMarked, Zap, LogOut, FileText, Search, Plus, Menu } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', id: 'nav-tasks' },
  { to: '/progress', icon: TrendingUp, label: 'Progress', id: 'nav-progress' },
  { to: '/revision', icon: BookMarked, label: 'Revision', id: 'nav-revision' },
  { to: '/notes', icon: FileText, label: 'Notes', id: 'nav-notes' },
];

export default function TopNav({
  mobileOpen,
  onClose,
  onMenuToggle,
  onAddTask,
  onImportClick,
  searchQuery,
  onSearchChange,
}) {
  const location = useLocation();
  const isTasksPage = location.pathname === '/tasks';
  const { isAdmin } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      <header className={`top-nav${isTasksPage ? ' top-nav--tasks' : ''}`}>
        <div className="top-nav-inner">
          <div className="top-nav-logo">
            <div className="top-nav-logo-icon">
              <Zap size={18} color="#ffffff" />
            </div>
            <span className="top-nav-logo-text text-gradient">Taskabelle</span>
          </div>

          <nav className="top-nav-links" aria-label="Main navigation">
            {navItems.map(({ to, icon: Icon, label, id }) => (
              <NavLink
                key={to}
                to={to}
                id={id}
                className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}
                end={to === '/'}
                onClick={onClose}
              >
                <Icon size={20} className="top-nav-link-icon" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="top-nav-actions">
            {isTasksPage && (
              <div className="top-nav-task-tools">
                <div className="top-nav-search">
                  <Search size={15} className="top-nav-search-icon" />
                  <input
                    type="search"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label="Search tasks"
                    id="topnav-search-input"
                  />
                </div>
                {isAdmin && (
                  <>
                    <button
                      className="btn btn-secondary top-nav-import-btn"
                      onClick={onImportClick}
                      id="topnav-import-md-btn"
                    >
                      Import MD
                    </button>
                    <button
                      className="btn btn-primary top-nav-add-btn"
                      onClick={onAddTask}
                      id="topnav-add-task-btn"
                    >
                      <Plus size={16} />
                      <span className="top-nav-add-label">New Task</span>
                    </button>
                  </>
                )}
              </div>
            )}
            <button
              className="btn btn-ghost btn-icon mobile-only top-nav-menu-btn"
              onClick={onMenuToggle}
              aria-label="Toggle menu"
              id="topnav-menu-toggle"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-ghost top-nav-logout-btn desktop-only"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={18} color="#ffffff" />
          </div>
          <span className="sidebar-logo-text">Taskabelle</span>
        </div>

        <nav className="sidebar-nav" aria-label="Mobile navigation">
          {navItems.map(({ to, icon: Icon, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={`mobile-${id}`}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={to === '/'}
              onClick={onClose}
            >
              <Icon size={18} className="nav-link-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {isTasksPage && (
          <div className="sidebar-task-tools">
            <div className="top-nav-search sidebar-search">
              <Search size={15} className="top-nav-search-icon" />
              <input
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search tasks"
              />
            </div>
            {isAdmin && (
              <>
                <button className="btn btn-secondary w-full" onClick={() => { onImportClick(); onClose(); }}>
                  Import MD
                </button>
                <button className="btn btn-primary w-full" onClick={() => { onAddTask(); onClose(); }}>
                  <Plus size={16} /> New Task
                </button>
              </>
            )}
          </div>
        )}

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-ghost sidebar-logout-btn">
            <LogOut size={16} />
            <span style={{ marginLeft: 'var(--space-2)' }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
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
