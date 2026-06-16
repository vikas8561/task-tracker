import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakDisplay({ streak }) {
  if (!streak) return null;

  return (
    <div className="stat-card fade-in stagger-4">
      <div className="stat-card-row">
        <div className="stat-card-body">
          <p className="stat-card-label">Current Streak</p>
          <div className="stat-card-streak">
            <h3 className="stat-card-value">{streak}</h3>
            <span className="stat-card-streak-unit">days</span>
          </div>
        </div>
        <div className="stat-card-icon-wrap stat-card-icon-wrap--streak">
          <Flame size={24} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
