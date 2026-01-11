'use client';

import React from 'react';
import { formatDuration } from '@/lib/constants';

interface AudioPlayerProps {
  audioUrl?: string;
  callId?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentlyPlayingId: string | null;
  error: string | null;
  onToggle: () => void;
  onSeek: (time: number) => void;
  fallbackDuration?: number;
}

/**
 * Audio player component with playback controls
 */
export const AudioPlayer = React.memo(function AudioPlayer({
  audioUrl,
  callId,
  isPlaying,
  currentTime,
  duration,
  currentlyPlayingId,
  error,
  onToggle,
  onSeek,
  fallbackDuration = 0,
}: AudioPlayerProps) {
  if (!audioUrl) return null;

  const isThisCallPlaying = currentlyPlayingId === callId && isPlaying;
  const isThisCallLoaded = currentlyPlayingId === callId;
  const displayDuration = isThisCallLoaded && duration > 0 ? duration : fallbackDuration;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  return (
    <div className="audio-player">
      {error && (
        <div className="audio-error" style={{ color: '#ff6b6b', marginBottom: '8px', fontSize: '12px' }}>
          ⚠️ {error}
        </div>
      )}
      <button className="play-btn" onClick={onToggle} aria-label={isThisCallPlaying ? 'Pause' : 'Play'}>
        {isThisCallPlaying ? '⏸️' : '▶️'}
      </button>
      <div className="audio-progress">
        <span className="time-display">
          {formatDuration(isThisCallLoaded ? currentTime : 0)}
        </span>
        <input 
          type="range" 
          min="0" 
          max={displayDuration || 100}
          value={isThisCallLoaded ? currentTime : 0}
          onChange={handleSeek}
          className="progress-slider"
          aria-label="Audio progress"
        />
        <span className="time-display">
          {formatDuration(displayDuration)}
        </span>
      </div>
      <div className="audio-label">
        {isThisCallPlaying 
          ? '🎵 Playing...' 
          : '🎧 Listen to the original recording while reviewing the analysis'}
      </div>
    </div>
  );
});

export default AudioPlayer;
