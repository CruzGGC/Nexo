'use client';

/**
 * Skeleton Loading Components
 * 
 * Provides shimmer-effect skeleton loaders for various game components.
 * Uses CSS animations for performance and matches the cyberpunk theme.
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base skeleton with shimmer animation
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/5',
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton for text content
 */
export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// Deterministic pseudo-random function based on index (for skeleton patterns)
const isPseudoRandomDark = (index: number, total: number): boolean => {
  // Use a simple hash-like function to create a deterministic pattern
  const hash = (index * 2654435761) % total;
  return hash < total * 0.15; // ~15% dark cells
};

/**
 * Skeleton for crossword grid
 */
export function CrosswordSkeleton({ size = 10 }: { size?: number }) {
  const totalCells = size * size;
  
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Grid skeleton */}
      <div 
        className="grid gap-0.5 bg-white/5 p-1 rounded-xl"
        style={{ 
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` 
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'aspect-square w-8 sm:w-10 rounded-sm',
              isPseudoRandomDark(i, totalCells) ? 'bg-zinc-900' : 'bg-white/10'
            )}
          />
        ))}
      </div>
      
      {/* Clues skeleton */}
      <div className="w-full max-w-lg grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <SkeletonText lines={4} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-20" />
          <SkeletonText lines={4} />
        </div>
      </div>
    </div>
  );
}

// Deterministic widths for word tag skeletons
const WORD_TAG_WIDTHS = [72, 88, 64, 96, 80, 68, 92, 76];

/**
 * Skeleton for word search grid
 */
export function WordSearchSkeleton({ size = 12 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Grid skeleton */}
      <div 
        className="grid gap-0.5 bg-white/5 p-2 rounded-xl"
        style={{ 
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` 
        }}
      >
        {Array.from({ length: size * size }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-square w-6 sm:w-7 rounded-sm bg-white/10"
          />
        ))}
      </div>
      
      {/* Word list skeleton */}
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {WORD_TAG_WIDTHS.map((width, i) => (
          <Skeleton 
            key={i} 
            className="h-8 rounded-full"
            style={{ width: `${width}px` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for battleship grid
 */
export function BattleshipSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
      {/* Player board */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24 mx-auto" />
        <div className="grid grid-cols-10 gap-0.5 bg-white/5 p-1 rounded-lg">
          {Array.from({ length: 100 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-square w-6 sm:w-8 rounded-sm bg-white/10"
            />
          ))}
        </div>
      </div>
      
      {/* Opponent board */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-28 mx-auto" />
        <div className="grid grid-cols-10 gap-0.5 bg-white/5 p-1 rounded-lg">
          {Array.from({ length: 100 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-square w-6 sm:w-8 rounded-sm bg-white/10"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for tic-tac-toe grid
 */
export function TicTacToeSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton
          key={i}
          className="aspect-square rounded-xl bg-white/10"
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for leaderboard entries
 */
export function LeaderboardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i}
          className="flex items-center gap-4 p-3 rounded-xl bg-white/5"
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for game card on homepage
 */
export function GameCardSkeleton() {
  return (
    <div className="h-[320px] rounded-[2.5rem] bg-white/5 p-8 animate-pulse">
      <div className="space-y-6">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <SkeletonText lines={2} />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for mode selection cards
 */
export function ModeSelectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/5] rounded-2xl bg-white/5 p-6 animate-pulse"
        >
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <Skeleton className="h-6 w-24" />
            <SkeletonText lines={2} className="w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030014] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="spinner mx-auto" />
        {children || (
          <p className="text-zinc-400 animate-pulse">A carregar...</p>
        )}
      </div>
    </div>
  );
}
