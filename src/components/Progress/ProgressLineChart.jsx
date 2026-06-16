import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function ProgressLineChart({ completedTimestamps = [] }) {
  // Generate data for the last 14 days
  const daysToShow = 14;

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const countsByDate = {};
    completedTimestamps.forEach((ts) => {
      const dateObj = new Date(ts);
      if (!isNaN(dateObj.getTime())) {
        const dateStr = dateObj.toLocaleDateString('en-CA'); 
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      }
    });

    const data = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('en-CA');
      
      data.push({
        name: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        completed: countsByDate[dateStr] || 0,
      });
    }

    return data;
  }, [completedTimestamps]);

  // Custom tooltip for premium look
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(26, 28, 32, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px', fontWeight: '600' }}>{label}</p>
          <p style={{ color: 'var(--accent-1)', fontSize: '1.1rem', fontWeight: '700' }}>
            {payload[0].value} <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>tasks completed</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-3d progress-chart-card slide-up" style={{ 
      animationDelay: '100ms', 
      padding: 'clamp(var(--space-4), 3vw, var(--space-6))',
      borderRadius: '24px',
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-glass)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="progress-chart-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Activity size={24} color="var(--accent-1)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Completion Trends</h3>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Tasks completed per day over the last 14 days
        </p>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 20, left: -20, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff8a00" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ff8a00" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a8adb5', fontSize: 12, fontWeight: 500 }}
              dy={15}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a8adb5', fontSize: 12, fontWeight: 500 }}
              allowDecimals={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="completed" 
              stroke="#ff8a00" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCompleted)" 
              activeDot={{ r: 6, fill: '#ff8a00', stroke: '#1a1c20', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
