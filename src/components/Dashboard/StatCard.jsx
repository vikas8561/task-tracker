import React from 'react';

export default function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div className={`stat-card fade-in ${delay}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
          <h3 style={{ 
            fontSize: '2.2rem', 
            fontWeight: 800, 
            marginTop: '4px', 
            color: 'var(--text-primary)'
          }}>
            {value}
          </h3>
        </div>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          color: color || 'var(--accent-1)', 
          borderRadius: '16px',
          padding: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-glass)'
        }}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
