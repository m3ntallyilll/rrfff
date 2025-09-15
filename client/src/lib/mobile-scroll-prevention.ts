/**
 * Mobile Scroll Prevention Utilities
 * Prevents pull-to-refresh and overscroll behaviors on iOS/mobile devices
 */

export interface TouchPreventionOptions {
  preventPullToRefresh?: boolean;
  preventHorizontalOverscroll?: boolean;
  preventVerticalOverscroll?: boolean;
  allowVerticalScroll?: boolean;
  allowHorizontalScroll?: boolean;
}

const defaultOptions: TouchPreventionOptions = {
  preventPullToRefresh: true,
  preventHorizontalOverscroll: true,
  preventVerticalOverscroll: true,
  allowVerticalScroll: true,
  allowHorizontalScroll: false,
};

/**
 * Prevents pull-to-refresh and overscroll behaviors on touch devices
 */
export function preventMobileOverscroll(
  element: HTMLElement | Document = document,
  options: TouchPreventionOptions = {}
): () => void {
  const opts = { ...defaultOptions, ...options };
  let startY = 0;
  let startX = 0;

  const handleTouchStart = (e: Event) => {
    const touchEvent = e as TouchEvent;
    startY = touchEvent.touches[0].clientY;
    startX = touchEvent.touches[0].clientX;
  };

  const handleTouchMove = (e: Event) => {
    const touchEvent = e as TouchEvent;
    const currentY = touchEvent.touches[0].clientY;
    const currentX = touchEvent.touches[0].clientX;
    const deltaY = currentY - startY;
    const deltaX = currentX - startX;
    
    const target = touchEvent.target as HTMLElement;
    const isScrollable = target.scrollHeight > target.clientHeight;
    const isAtTop = target.scrollTop === 0;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight;

    // Prevent pull-to-refresh (downward swipe at top of page)
    if (opts.preventPullToRefresh) {
      if (isAtTop && deltaY > 0) {
        touchEvent.preventDefault();
        return false;
      }
    }

    // Prevent vertical overscroll
    if (opts.preventVerticalOverscroll) {
      if (!isScrollable || (isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          touchEvent.preventDefault();
          return false;
        }
      }
    }

    // Prevent horizontal overscroll
    if (opts.preventHorizontalOverscroll && !opts.allowHorizontalScroll) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        touchEvent.preventDefault();
        return false;
      }
    }
  };

  const handleTouchEnd = (e: Event) => {
    startY = 0;
    startX = 0;
  };

  // Add event listeners with passive: false to allow preventDefault
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: false });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Apply mobile scroll prevention to an element using CSS classes
 */
export function applyMobileScrollClasses(element: HTMLElement, type: 'prevent-overscroll' | 'prevent-pull-to-refresh' | 'no-bounce' | 'mobile-scroll-safe' = 'prevent-overscroll') {
  element.classList.add(type);
}

/**
 * React hook for mobile scroll prevention (import React in your component)
 */
export function useMobileScrollPrevention(
  ref: { current: HTMLElement | null } | null,
  options: TouchPreventionOptions = {}
) {
  // This function should be used within a React useEffect hook in your components
  return {
    initialize: () => {
      if (!ref?.current) return;

      const cleanup = preventMobileOverscroll(ref.current, options);
      applyMobileScrollClasses(ref.current);

      return cleanup;
    }
  };
}

/**
 * Initialize global mobile scroll prevention for the entire document
 */
export function initGlobalMobileScrollPrevention(options: TouchPreventionOptions = {}) {
  // Apply to document body
  document.body.classList.add('prevent-overscroll');
  document.documentElement.classList.add('prevent-overscroll');

  // Add global touch event prevention
  const cleanup = preventMobileOverscroll(document, options);

  // Add meta tag to prevent zooming (optional)
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && !viewport.getAttribute('content')?.includes('user-scalable=no')) {
    const currentContent = viewport.getAttribute('content') || '';
    viewport.setAttribute('content', currentContent + ', user-scalable=no');
  }

  return cleanup;
}

// Export for direct import usage
declare global {
  interface Window {
    __mobileScrollPrevention?: () => void;
  }
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  // Initialize global prevention when module loads
  window.__mobileScrollPrevention = initGlobalMobileScrollPrevention({
    preventPullToRefresh: true,
    preventVerticalOverscroll: true,
    preventHorizontalOverscroll: true,
    allowVerticalScroll: true,
    allowHorizontalScroll: false,
  });
}