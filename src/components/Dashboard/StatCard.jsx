import React from 'react';

export default function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div className={`stat-card fade-in ${delay}`}>
      <div className="stat-card-row">
        <div className="stat-card-body">
          <p className="stat-card-label">{label}</p>
          <h3 className="stat-card-value">{value}</h3>
        </div>
        <div className="stat-card-icon-wrap" style={{ color: color || 'var(--accent-1)' }}>
          <Icon size={24} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
