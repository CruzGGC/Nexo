'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (timeMs: number) => void;
}

export default function Timer({ isRunning, onTimeUpdate }: TimerProps) {
  const [timeMs, setTimeMs] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const startTime = Date.now() - timeMs;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTimeMs(elapsed);
      onTimeUpdate?.(elapsed);
    }, 10); // Atualiza a cada 10ms para precisão de milissegundos

    return () => clearInterval(interval);
  }, [isRunning, timeMs, onTimeUpdate]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">
      {formatTime(timeMs)}
    </div>
  );
}
