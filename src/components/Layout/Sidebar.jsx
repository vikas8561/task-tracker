import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, ListTodo, Flame, BookOpenCheck, NotebookPen, BrainCircuit, LogOut, Plus, Menu, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard', id: 'nav-dashboard', color: '#ff8a00' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks', id: 'nav-tasks', color: '#da1b60' },
  { to: '/progress', icon: Flame, label: 'Progress', id: 'nav-progress', color: '#ff9f43' },
  { to: '/revision', icon: BookOpenCheck, label: 'Revision', id: 'nav-revision', color: '#ff6b35' },
  { to: '/notes', icon: NotebookPen, label: 'Notes', id: 'nav-notes', color: '#e85d75' },
  { to: '/questions', icon: BrainCircuit, label: 'Questions', id: 'nav-questions', color: '#c084fc' },
];

export default function TopNav({
  mobileOpen,
  onClose,
  onMenuToggle,
  onAddTask,
  onImportClick,
  onAddQuestion,
  onImportQuestion,
}) {
  const location = useLocation();
  const isTasksPage = location.pathname === '/tasks';
  const isQuestionsPage = location.pathname === '/questions';
  const { isAdmin, signOut } = useAuth();

  function handleLogout() {
    signOut();
  }

  return (
    <>
      <header className={`top-nav${(isTasksPage || isQuestionsPage) ? ' top-nav--tasks' : ''}`}>
        <div className="top-nav-inner">
          <div className="top-nav-logo">

            <span className="top-nav-logo-text text-gradient">Taskabelle</span>
          </div>

          <nav className="top-nav-links" aria-label="Main navigation">
            {navItems.map(({ to, icon: Icon, label, id, color }) => (
              <NavLink
                key={to}
                to={to}
                id={id}
                className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}
                style={({ isActive }) => isActive ? {
                  color: color,
                  background: `${color}15`,
                  borderColor: `${color}40`,
                  boxShadow: `0 0 16px ${color}25`
                } : {}}
                end={to === '/'}
                onClick={onClose}
              >
                <Icon size={20} className="top-nav-link-icon" style={{ color: 'inherit' }} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="top-nav-actions">
            {isTasksPage && (
              <div className="top-nav-task-tools">
                {isAdmin && (
                  <>
                    <button
                      className="btn btn-secondary top-nav-import-btn"
                      onClick={onImportClick}
                      id="topnav-import-md-btn"
                    >
                      <Upload size={14} /> <span className="top-nav-btn-label">Import MD</span>
                    </button>
                    <button
                      className="btn btn-primary top-nav-add-btn"
                      onClick={onAddTask}
                      id="topnav-add-task-btn"
                    >
                      <Plus size={16} />
                      <span className="top-nav-btn-label">New Task</span>
                    </button>
                  </>
                )}
              </div>
            )}
            {isQuestionsPage && isAdmin && (
              <div className="top-nav-task-tools">
                <button
                  className="btn btn-secondary top-nav-import-btn"
                  onClick={onImportQuestion}
                  id="topnav-import-questions-btn"
                >
                  <Upload size={14} /> <span className="top-nav-btn-label">Import MD</span>
                </button>
                <button
                  className="btn btn-primary top-nav-add-btn"
                  onClick={onAddQuestion}
                  id="topnav-add-question-btn"
                >
                  <Plus size={16} />
                  <span className="top-nav-btn-label">New Question</span>
                </button>
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

          <span className="sidebar-logo-text">Taskabelle</span>
        </div>

        <nav className="sidebar-nav" aria-label="Mobile navigation">
          {navItems.map(({ to, icon: Icon, label, id, color }) => (
            <NavLink
              key={to}
              to={to}
              id={`mobile-${id}`}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={({ isActive }) => isActive ? {
                color: color,
                background: `${color}15`,
                borderColor: `${color}40`
              } : {}}
              end={to === '/'}
              onClick={onClose}
            >
              <Icon size={18} className="nav-link-icon" style={{ color: 'inherit' }} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {isTasksPage && (
          <div className="sidebar-task-tools">
            {isAdmin && (
              <>
                <button className="btn btn-secondary w-full" onClick={() => { onImportClick(); onClose(); }}>
                  <Upload size={14} /> Import MD
                </button>
                <button className="btn btn-primary w-full" onClick={() => { onAddTask(); onClose(); }}>
                  <Plus size={16} /> New Task
                </button>
              </>
            )}
          </div>
        )}
        {isQuestionsPage && isAdmin && (
          <div className="sidebar-task-tools">
            <button className="btn btn-secondary w-full" onClick={() => { onImportQuestion?.(); onClose(); }}>
              <Upload size={14} /> Import MD
            </button>
            <button className="btn btn-primary w-full" onClick={() => { onAddQuestion?.(); onClose(); }}>
              <Plus size={16} /> New Question
            </button>
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
      {navItems.map(({ to, icon: Icon, label, id, color }) => (
        <NavLink
          key={to}
          to={to}
          id={`bottom-${id}`}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          style={({ isActive }) => isActive ? {
            color: color,
          } : {}}
          end={to === '/'}
        >
          <Icon size={20} style={{ color: 'inherit' }} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
