import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CircularLoopRowProps<T> {
  items: T[];
  renderItem: (item: T, copyIndex: number, itemIndex: number) => React.ReactNode;
  getKey: (item: T) => string;
  autoScroll?: boolean;
  autoScrollDirection?: 'right' | 'left';
  autoScrollSpeedPx?: number;
  stepPx?: number;
  title?: string;
  subtitle?: string;
  actionSlot?: React.ReactNode;
  ariaLabel?: string;
  gapClassName?: string;
}

export function CircularLoopRow<T>({
  items,
  renderItem,
  getKey,
  autoScroll = false,
  autoScrollDirection = 'right',
  autoScrollSpeedPx = 0.55,
  stepPx = 320,
  title,
  subtitle,
  actionSlot,
  ariaLabel = 'Yatay döngü şeridi',
  gapClassName = 'gap-4',
}: CircularLoopRowProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Repeat 3x so left and right wrapping is always seamless
  const copies = items.length > 0 ? [0, 1, 2] : [];

  // Initialize scrollLeft in the middle copy
  useEffect(() => {
    const el = containerRef.current;
    if (!el || items.length === 0) return;
    const oneSetWidth = el.scrollWidth / 3;
    if (oneSetWidth > 0 && el.scrollLeft < 10) {
      el.scrollLeft = oneSetWidth;
    }
  }, [items.length]);

  // Normalize scroll position silently when entering the 1st or 3rd copy
  const normalizeScroll = () => {
    const el = containerRef.current;
    if (!el || items.length === 0) return;
    const oneSetWidth = el.scrollWidth / 3;
    if (oneSetWidth <= 0) return;
    if (el.scrollLeft >= oneSetWidth * 2 - 4) {
      el.scrollLeft -= oneSetWidth;
    } else if (el.scrollLeft <= 4) {
      el.scrollLeft += oneSetWidth;
    }
  };

  // Continuous loop only when autoScroll is enabled (e.g. Top Hero News Bar)
  useEffect(() => {
    if (!autoScroll || items.length === 0) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    let carry = 0;

    const tick = () => {
      const el = containerRef.current;
      if (el && !paused) {
        const oneSetWidth = el.scrollWidth / 3;
        if (oneSetWidth > 0) {
          carry += autoScrollSpeedPx;
          if (carry >= 1) {
            const delta = Math.floor(carry);
            carry -= delta;
            if (autoScrollDirection === 'right') {
              // Moving content rightward smoothly decreases scrollLeft and wraps at left boundary
              el.scrollLeft -= delta;
              if (el.scrollLeft <= 4) {
                el.scrollLeft += oneSetWidth;
              }
            } else {
              el.scrollLeft += delta;
              if (el.scrollLeft >= oneSetWidth * 2 - 4) {
                el.scrollLeft -= oneSetWidth;
              }
            }
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoScroll, autoScrollDirection, autoScrollSpeedPx, paused, items.length]);

  const handleStep = (dir: 'prev' | 'next') => {
    const el = containerRef.current;
    if (!el || items.length === 0) return;
    normalizeScroll();
    el.scrollBy({
      left: dir === 'next' ? stepPx : -stepPx,
      behavior: 'smooth',
    });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {(title || subtitle || actionSlot) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actionSlot}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStep('prev')}
                aria-label={`${title || ariaLabel} sola kaydır`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleStep('next')}
                aria-label={`${title || ariaLabel} sağa kaydır`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={normalizeScroll}
        aria-label={ariaLabel}
        className={`flex overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${gapClassName}`}
      >
        {copies.map((copyIndex) =>
          items.map((item, itemIndex) => (
            <div key={`${copyIndex}-${getKey(item)}`} className="shrink-0">
              {renderItem(item, copyIndex, itemIndex)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
