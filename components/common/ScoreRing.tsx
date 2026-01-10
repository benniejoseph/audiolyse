'use client';

import React from 'react';
import { getScoreColor } from '@/lib/constants';

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

/**
 * Circular score indicator with animated ring
 * Memoized to prevent unnecessary re-renders
 */
export const ScoreRing = React.memo(function ScoreRing({ 
  score, 
  size = 80, 
  label 
}: ScoreRingProps) {
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle 
          cx="40" 
          cy="40" 
          r="35" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="6" 
          fill="none" 
        />
        <circle 
          cx="40" 
          cy="40" 
          r="35" 
          stroke={color} 
          strokeWidth="6" 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} 
        />
      </svg>
      <div className="score-value" style={{ color }}>{score}</div>
      {label && <div className="score-label">{label}</div>}
    </div>
  );
});

export default ScoreRing;
