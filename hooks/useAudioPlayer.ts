'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  currentlyPlayingId: string | null;
}

interface AudioPlayerControls {
  play: (audioUrl: string, callId: string) => void;
  pause: () => void;
  toggle: (audioUrl: string, callId: string) => void;
  seek: (time: number) => void;
  stop: () => void;
}

/**
 * Custom hook for managing audio playback with proper cleanup
 * Prevents memory leaks by properly removing event listeners
 */
export function useAudioPlayer(): [AudioPlayerState, AudioPlayerControls] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    error: null,
    currentlyPlayingId: null,
  });

  // Initialize audio element with proper cleanup
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Event handlers
    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration, error: null }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
    };

    const handleError = () => {
      const errorMessage = audio.error?.message || 'Failed to load audio';
      setState(prev => ({ ...prev, isPlaying: false, error: errorMessage }));
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, error: null }));
    };

    // Attach event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Cleanup function - properly remove all listeners
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      
      // Stop playback and release resources
      audio.pause();
      audio.src = '';
      audio.load(); // Reset the audio element
    };
  }, []);

  const play = useCallback((audioUrl: string, callId: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If different audio, load it first
    if (state.currentlyPlayingId !== callId) {
      audio.src = audioUrl;
      setState(prev => ({ 
        ...prev, 
        currentlyPlayingId: callId,
        currentTime: 0,
        error: null,
      }));
    }

    audio.play().catch(err => {
      setState(prev => ({ ...prev, error: err.message || 'Playback failed' }));
    });
  }, [state.currentlyPlayingId]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback((audioUrl: string, callId: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying && state.currentlyPlayingId === callId) {
      audio.pause();
    } else {
      play(audioUrl, callId);
    }
  }, [state.isPlaying, state.currentlyPlayingId, play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        currentlyPlayingId: null,
      }));
    }
  }, []);

  return [
    state,
    { play, pause, toggle, seek, stop },
  ];
}

export default useAudioPlayer;
