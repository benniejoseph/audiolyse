'use client';

import React from 'react';

interface TalkRatioBarProps {
  agent: number;
  customer: number;
  silence: number;
}

/**
 * Visual representation of talk time distribution
 * Memoized to prevent unnecessary re-renders
 */
export const TalkRatioBar = React.memo(function TalkRatioBar({ 
  agent, 
  customer, 
  silence 
}: TalkRatioBarProps) {
  return (
    <div className="talk-ratio-container">
      <div className="talk-ratio-bar">
        <div 
          className="ratio-segment agent" 
          style={{ width: `${agent}%` }} 
          title={`Agent: ${agent}%`} 
        />
        <div 
          className="ratio-segment customer" 
          style={{ width: `${customer}%` }} 
          title={`Customer: ${customer}%`} 
        />
        <div 
          className="ratio-segment silence" 
          style={{ width: `${silence}%` }} 
          title={`Silence: ${silence}%`} 
        />
      </div>
      <div className="ratio-legend">
        <span><span className="dot agent" /> Agent {agent}%</span>
        <span><span className="dot customer" /> Customer {customer}%</span>
        <span><span className="dot silence" /> Silence {silence}%</span>
      </div>
    </div>
  );
});

export default TalkRatioBar;
