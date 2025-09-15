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
 * Type guard to check if an element has scroll properties
 */
function isScrollableElement(element: any): element is HTMLElement {
  return (
    element &&
    typeof element.scrollHeight === 'number' &&
    typeof element.scrollTop === 'number' &&
    typeof element.clientHeight === 'number'
  );
}

/**
 * Safely access document with SSR compatibility
 */
function getDocument(): Document | null {
  return typeof document !== 'undefined' ? document : null;
}

/**
 * Safely access window with SSR compatibility
 */
function getWindow(): Window | null {
  return typeof window !== 'undefined' ? window : null;
}

/**
 * Prevents pull-to-refresh and overscroll behaviors on touch devices
 */
export function preventMobileOverscroll(
  element?: HTMLElement | Document | null,
  options: TouchPreventionOptions = {}
): () => void {
  // Use default element if none provided
  const targetElement = element || getDocument();
  if (!targetElement) {
    // Return no-op cleanup function for SSR compatibility
    return () => {};
  }

  const opts = { ...defaultOptions, ...options };
  let startY = 0;
  let startX = 0;

  const handleTouchStart = (e: Event) => {
    const touchEvent = e as TouchEvent;
    if (touchEvent.touches && touchEvent.touches.length > 0) {
      startY = touchEvent.touches[0].clientY;
      startX = touchEvent.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: Event) => {
    const touchEvent = e as TouchEvent;
    if (!touchEvent.touches || touchEvent.touches.length === 0) {
      return;
    }
    
    const currentY = touchEvent.touches[0].clientY;
    const currentX = touchEvent.touches[0].clientX;
    const deltaY = currentY - startY;
    const deltaX = currentX - startX;
    
    const target = touchEvent.target as HTMLElement | null;
    if (!target || !isScrollableElement(target)) {
      return;
    }
    
    const isScrollable = target.scrollHeight > target.clientHeight;
    const isAtTop = target.scrollTop === 0;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight;

    // Prevent pull-to-refresh (downward swipe at top of page)
    if (opts.preventPullToRefresh) {
      if (isAtTop && deltaY > 0) {
        touchEvent.preventDefault();
        return;
      }
    }

    // Prevent vertical overscroll
    if (opts.preventVerticalOverscroll) {
      if (!isScrollable || (isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          touchEvent.preventDefault();
          return;
        }
      }
    }

    // Prevent horizontal overscroll
    if (opts.preventHorizontalOverscroll && !opts.allowHorizontalScroll) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        touchEvent.preventDefault();
        return;
      }
    }
  };

  const handleTouchEnd = (_e: Event) => {
    startY = 0;
    startX = 0;
  };

  // Add event listeners with passive: false to allow preventDefault
  targetElement.addEventListener('touchstart', handleTouchStart, { passive: false });
  targetElement.addEventListener('touchmove', handleTouchMove, { passive: false });
  targetElement.addEventListener('touchend', handleTouchEnd, { passive: false });

  // Return cleanup function
  return () => {
    targetElement.removeEventListener('touchstart', handleTouchStart);
    targetElement.removeEventListener('touchmove', handleTouchMove);
    targetElement.removeEventListener('touchend', handleTouchEnd);
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
export function initGlobalMobileScrollPrevention(options: TouchPreventionOptions = {}): (() => void) | null {
  const doc = getDocument();
  if (!doc) {
    return null; // SSR or non-browser environment
  }

  // Apply to document body
  doc.body?.classList.add('prevent-overscroll');
  doc.documentElement?.classList.add('prevent-overscroll');

  // Add global touch event prevention
  const cleanup = preventMobileOverscroll(doc, options);

  // Add meta tag to prevent zooming (optional)
  const viewport = doc.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
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
  const cleanup = initGlobalMobileScrollPrevention({
    preventPullToRefresh: true,
    preventVerticalOverscroll: true,
    preventHorizontalOverscroll: true,
    allowVerticalScroll: true,
    allowHorizontalScroll: false,
  });
  
  if (cleanup) {
    window.__mobileScrollPrevention = cleanup;
  }
}