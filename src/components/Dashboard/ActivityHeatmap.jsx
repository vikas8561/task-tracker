import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export default function ActivityHeatmap({ completedTimestamps = [] }) {
  // Generate data for the last 12 weeks (~3 months)
  const weeksToShow = 14;
  const daysToShow = weeksToShow * 7;

  const { weeks, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);
    
    // Adjust to previous Sunday
    const startDayOfWeek = startDate.getDay();
    if (startDayOfWeek !== 0) {
      startDate.setDate(startDate.getDate() - startDayOfWeek);
    }

    const countsByDate = {};
    completedTimestamps.forEach((ts) => {
      const dateObj = new Date(ts);
      if (!isNaN(dateObj.getTime())) {
        const dateStr = dateObj.toLocaleDateString('en-CA'); 
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      }
    });

    const weeksArray = [];
    const monthsArray = [];
    let currentMonth = -1;
    let currentMax = 0;
    
    const totalWeeks = Math.ceil((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    for (let week = 0; week <= totalWeeks; week++) {
      const weekData = [];
      let weekMonth = -1;
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + (week * 7) + dayOfWeek);
        
        if (dayOfWeek === 0) {
          weekMonth = cellDate.getMonth();
        }

        if (cellDate > today) {
          weekData.push({ date: cellDate, count: -1, isFuture: true });
        } else {
          const dateStr = cellDate.toLocaleDateString('en-CA');
          const count = countsByDate[dateStr] || 0;
          if (count > currentMax) currentMax = count;
          
          weekData.push({
            date: cellDate,
            dateStr: cellDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            count,
            isFuture: false
          });
        }
      }
      
      if (weekMonth !== -1 && weekMonth !== currentMonth) {
        monthsArray.push({ weekIndex: week, label: new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short' }) });
        currentMonth = weekMonth;
      }
      
      weeksArray.push(weekData);
    }

    return { weeks: weeksArray, monthLabels: monthsArray, maxCount: Math.max(currentMax, 4) };
  }, [completedTimestamps]);

  const getIntensityClass = (count) => {
    if (count < 0) return 'heatmap-cell-empty';
    if (count === 0) return 'heatmap-cell-0';
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'heatmap-cell-1';
    if (ratio <= 0.5) return 'heatmap-cell-2';
    if (ratio <= 0.75) return 'heatmap-cell-3';
    return 'heatmap-cell-4';
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card-3d heatmap-card slide-up" style={{ animationDelay: '100ms' }}>
      <div className="heatmap-header">
        <div className="heatmap-title-row">
          <Calendar size={20} className="heatmap-icon" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Activity & Consistency</h3>
        </div>
        <p className="heatmap-subtitle">Your task completions over the last 3 months</p>
      </div>

      <div className="heatmap-container">
        <div className="heatmap-grid-wrapper">
          {/* Y Axis labels */}
          <div className="heatmap-y-axis">
            <div className="heatmap-month-spacer"></div>
            {daysOfWeek.map((d, i) => (
              <div key={i} className="heatmap-y-label">{i % 2 === 0 ? d : ''}</div>
            ))}
          </div>
          
          {/* Grid and X Axis labels */}
          <div className="heatmap-grid-inner">
            <div className="heatmap-months">
              {monthLabels.map((m, i) => (
                <div key={i} className="heatmap-month-label" style={{ left: `calc(${m.weekIndex} * (var(--heatmap-cell-size) + var(--heatmap-gap)))` }}>
                  {m.label}
                </div>
              ))}
            </div>
            <div className="heatmap-weeks">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="heatmap-week">
                  {week.map((cell, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`heatmap-cell ${getIntensityClass(cell.count)}`}
                      title={cell.isFuture ? '' : `${cell.count} task${cell.count !== 1 ? 's' : ''} on ${cell.dateStr}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="heatmap-footer">
          <div className="heatmap-stats">
            <div className="heatmap-stat-item">
              <span className="heatmap-stat-value">{completedTimestamps.length}</span>
              <span className="heatmap-stat-label">Total tasks</span>
            </div>
            <div className="heatmap-stat-item">
              <span className="heatmap-stat-value">{maxCount}</span>
              <span className="heatmap-stat-label">Best day</span>
            </div>
          </div>
          
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="heatmap-cell heatmap-cell-0"></div>
            <div className="heatmap-cell heatmap-cell-1"></div>
            <div className="heatmap-cell heatmap-cell-2"></div>
            <div className="heatmap-cell heatmap-cell-3"></div>
            <div className="heatmap-cell heatmap-cell-4"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
