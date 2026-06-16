import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakDisplay({ streak }) {
  if (!streak) return null;

  return (
    <div className="stat-card fade-in stagger-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Streak</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h3 style={{ 
              fontSize: '2.2rem', 
              fontWeight: 800, 
              marginTop: '4px',
              color: 'var(--text-primary)',
            }}>
              {streak}
            </h3>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>days</span>
          </div>
        </div>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          color: '#ff6b35', 
          borderRadius: '16px',
          padding: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-glass)'
        }}>
          <Flame size={24} />
        </div>
      </div>
    </div>
  );
}
