'use client';

import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (timeMs: number) => void;
  /** External time penalty to add to the final time (in milliseconds) */
  penalty?: number;
}

export default function Timer({ isRunning, onTimeUpdate, penalty = 0 }: TimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const penaltyRef = useRef(penalty);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  // Keep refs in sync with props
  useEffect(() => {
    penaltyRef.current = penalty;
  }, [penalty]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // Calculate total time including penalty for display
  const totalTime = elapsedMs + penalty;

  useEffect(() => {
    if (!isRunning) {
      // Clear interval when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      return;
    }

    // Initialize start time accounting for already elapsed time
    startTimeRef.current = Date.now() - elapsedMs;
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);
      // Use refs to get current values without causing re-renders
      onTimeUpdateRef.current?.(elapsed + penaltyRef.current);
    }, 10);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 font-mono text-xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
      <span className="text-cyan-500/80">⏱️</span>
      <span>{formatTime(totalTime)}</span>
    </div>
  );
}
