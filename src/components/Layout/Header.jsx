import { useLocation } from 'react-router-dom';
import { Search, Menu, Plus } from 'lucide-react';

const titles = {
  '/': 'Dashboard',
  '/tasks': 'My Tasks',
  '/progress': 'Progress',
  '/revision': 'Revision',
  '/notes': 'Notes',
};

export default function Header({ onMenuToggle, onAddTask, onImportClick, searchQuery, onSearchChange }) {
  const location = useLocation();
  const title = titles[location.pathname] || 'Taskabelle';

  return (
    <header className="header">
      {/* Mobile menu toggle — hidden on desktop via CSS */}
      <button
        className="btn btn-ghost btn-icon mobile-only"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        id="header-menu-toggle"
      >
        <Menu size={20} />
      </button>

      <h1 className="header-title">{title}</h1>

      <div className="header-search">
        <Search size={15} className="header-search-icon" />
        <input
          type="search"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search tasks"
          id="header-search-input"
        />
      </div>

      <div className="header-actions">
        {onImportClick && (
          <button
            className="btn btn-secondary"
            onClick={onImportClick}
            id="header-import-md-btn"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            Import MD
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={onAddTask}
          id="header-add-task-btn"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>
    </header>
  );
}
