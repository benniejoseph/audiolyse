'use client';

import React from 'react';
import type { BulkCallResult } from '@/lib/types';

interface FloatingAudioIndicatorProps {
  isPlaying: boolean;
  currentlyPlayingId: string | null;
  results: BulkCallResult[];
  isDetailView: boolean;
  onClickIndicator: (call: BulkCallResult) => void;
  onStop: () => void;
}

/**
 * Floating indicator showing currently playing audio
 * Appears when navigating away from detail view while audio plays
 */
export const FloatingAudioIndicator = React.memo(function FloatingAudioIndicator({
  isPlaying,
  currentlyPlayingId,
  results,
  isDetailView,
  onClickIndicator,
  onStop,
}: FloatingAudioIndicatorProps) {
  // Don't show if not playing or already in detail view
  if (!isPlaying || isDetailView) return null;

  const playingCall = results.find(r => r.id === currentlyPlayingId);
  if (!playingCall) return null;

  const handleClick = () => {
    onClickIndicator(playingCall);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStop();
  };

  return (
    <div 
      className="floating-audio-indicator" 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <span className="playing-icon">🎵</span>
      <span className="playing-text">Playing: {playingCall.fileName}</span>
      <button 
        className="stop-btn" 
        onClick={handleStop}
        aria-label="Stop playback"
      >
        ⏹️
      </button>
    </div>
  );
});

export default FloatingAudioIndicator;
