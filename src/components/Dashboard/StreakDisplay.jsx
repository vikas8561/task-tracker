import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakDisplay({ streak }) {
  if (!streak) return null;

  return (
    <div 
      className="card-3d card-3d-glowing stat-card fade-in stagger-4" 
      style={{ 
        '--card-rgb': '30, 58, 138',
        padding: 'var(--space-4) var(--space-5)', 
        background: 'var(--grad-stat-1)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: `0 10px 30px rgba(30, 58, 138, 0.2), inset 0 1px 1px rgba(255,255,255,0.1)`,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '16px', 
        borderRadius: '20px', 
        color: 'white',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
        position: 'relative',
        zIndex: 2,
        backdropFilter: 'blur(8px)'
      }}>
        <Flame size={28} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Streak</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h3 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            {streak}
          </h3>
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>days</span>
        </div>
      </div>
    </div>
  );
}
