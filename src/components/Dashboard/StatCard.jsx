import React from 'react';

export default function StatCard({ icon: Icon, label, value, color, delay }) {
  // Determine gradient based on color prop
  let gradClass = 'var(--grad-stat-1)';
  let cardRgb = '30, 58, 138'; 
  if (color.includes('accent')) { gradClass = 'var(--grad-stat-2)'; cardRgb = '76, 29, 149'; }
  else if (color.includes('success')) { gradClass = 'var(--grad-stat-4)'; cardRgb = '6, 78, 59'; }
  else if (color.includes('warning')) { gradClass = 'var(--grad-stat-3)'; cardRgb = '136, 19, 55'; }

  return (
    <div 
      className={`card-3d card-3d-glowing stat-card fade-in ${delay}`} 
      style={{ 
        '--card-rgb': cardRgb,
        padding: 'var(--space-5)', 
        background: gradClass,
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: `0 10px 30px rgba(${cardRgb}, 0.2), inset 0 1px 1px rgba(255,255,255,0.1)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
          <h3 style={{ 
            fontSize: '2.2rem', 
            fontWeight: 800, 
            marginTop: '4px', 
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            {value}
          </h3>
        </div>
        <div className="stat-icon" style={{ 
          background: 'rgba(255,255,255,0.1)', 
          color: '#fff', 
          boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2)`,
          borderRadius: '16px',
          padding: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <Icon size={24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
        </div>
      </div>
    </div>
  );
}
