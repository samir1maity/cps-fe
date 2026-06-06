import { useEffect, useRef } from 'react';

/**
 * Locks page scroll while `active` is true.
 *
 * Strategy:
 *  1. Record current scrollY and the existing body paddingRight.
 *  2. Add padding-right equal to the scrollbar width so the layout
 *     doesn't shift when the scrollbar disappears.
 *  3. Fix the body in place at -scrollY so the viewport content
 *     appears frozen (works on iOS Safari where overflow:hidden alone
 *     does not prevent rubber-band scrolling).
 *  4. On cleanup, restore every style and jump back to the saved
 *     scroll position — invisible to the user.
 *
 * Multiple hooks can be active simultaneously; the lock is reference-
 * counted so the last one to close performs the actual cleanup.
 */

let lockCount = 0;
let savedScrollY = 0;
let savedPaddingRight = '';
let savedPosition = '';
let savedTop = '';
let savedWidth = '';

function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

function lock() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    savedPaddingRight = document.body.style.paddingRight;
    savedPosition = document.body.style.position;
    savedTop = document.body.style.top;
    savedWidth = document.body.style.width;

    const scrollbarWidth = getScrollbarWidth();

    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.paddingRight = savedPaddingRight;
    document.body.style.position = savedPosition;
    document.body.style.top = savedTop;
    document.body.style.width = savedWidth;
    document.body.style.overflow = '';
    window.scrollTo(0, savedScrollY);
  }
}

export function useScrollLock(active: boolean) {
  // Track whether this instance currently holds a lock
  const locked = useRef(false);

  useEffect(() => {
    if (active && !locked.current) {
      lock();
      locked.current = true;
    } else if (!active && locked.current) {
      unlock();
      locked.current = false;
    }

    return () => {
      if (locked.current) {
        unlock();
        locked.current = false;
      }
    };
  }, [active]);
}
