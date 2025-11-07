import { useEffect, useRef, useState } from 'react';
import { useDeviceDetection } from '@/utils/mobile';

// Swipe direction types
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// Swipe gesture configuration
interface SwipeConfig {
  minDistance?: number;        // Minimum distance for a valid swipe (px)
  maxTime?: number;           // Maximum time for a valid swipe (ms)
  threshold?: number;         // Threshold for detecting swipe direction
  preventScroll?: boolean;    // Prevent default scroll behavior
  passive?: boolean;          // Use passive event listeners
}

// Swipe event data
interface SwipeEvent {
  direction: SwipeDirection;
  distance: number;
  duration: number;
  velocity: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

// Swipe handlers
interface SwipeHandlers {
  onSwipeLeft?: (event: SwipeEvent) => void;
  onSwipeRight?: (event: SwipeEvent) => void;
  onSwipeUp?: (event: SwipeEvent) => void;
  onSwipeDown?: (event: SwipeEvent) => void;
  onSwipe?: (event: SwipeEvent) => void;
  onSwipeStart?: (point: { x: number; y: number }) => void;
  onSwipeEnd?: (point: { x: number; y: number }) => void;
}

// Default configuration
const defaultConfig: Required<SwipeConfig> = {
  minDistance: 50,
  maxTime: 1000,
  threshold: 10,
  preventScroll: false,
  passive: false,
};

// Touch tracking state
interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
}

export const useSwipeGestures = (
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) => {
  const { isTouchDevice } = useDeviceDetection();
  const elementRef = useRef<HTMLElement | null>(null);
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
  });

  const finalConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (!isTouchDevice) return;

    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const startPoint = { x: touch.clientX, y: touch.clientY };
      
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isTracking: true,
      };

      handlers.onSwipeStart?.(startPoint);

      if (finalConfig.preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchState.current.isTracking) return;

      if (finalConfig.preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchState.current.isTracking) return;

      const touch = e.changedTouches[0];
      const endPoint = { x: touch.clientX, y: touch.clientY };
      const endTime = Date.now();

      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const duration = endTime - touchState.current.startTime;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / duration;

      touchState.current.isTracking = false;
      handlers.onSwipeEnd?.(endPoint);

      // Check if swipe meets minimum requirements
      if (distance < finalConfig.minDistance || duration > finalConfig.maxTime) {
        return;
      }

      // Determine swipe direction
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      let direction: SwipeDirection;

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Create swipe event
      const swipeEvent: SwipeEvent = {
        direction,
        distance,
        duration,
        velocity,
        startPoint: { x: touchState.current.startX, y: touchState.current.startY },
        endPoint,
      };

      // Call appropriate handlers
      handlers.onSwipe?.(swipeEvent);

      switch (direction) {
        case 'left':
          handlers.onSwipeLeft?.(swipeEvent);
          break;
        case 'right':
          handlers.onSwipeRight?.(swipeEvent);
          break;
        case 'up':
          handlers.onSwipeUp?.(swipeEvent);
          break;
        case 'down':
          handlers.onSwipeDown?.(swipeEvent);
          break;
      }
    };

    const handleTouchCancel = () => {
      touchState.current.isTracking = false;
    };

    // Add event listeners
    const options = { passive: finalConfig.passive };
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isTouchDevice, handlers, finalConfig]);

  return elementRef;
};

// Hook for swipeable carousel/slider
export const useSwipeableCarousel = (
  itemCount: number,
  onIndexChange?: (index: number) => void
) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToNext = () => {
    if (isAnimating) return;
    const nextIndex = (currentIndex + 1) % itemCount;
    setCurrentIndex(nextIndex);
    onIndexChange?.(nextIndex);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToPrevious = () => {
    if (isAnimating) return;
    const prevIndex = currentIndex === 0 ? itemCount - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    onIndexChange?.(prevIndex);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToIndex = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setCurrentIndex(index);
    onIndexChange?.(index);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const swipeRef = useSwipeGestures({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
  }, {
    minDistance: 50,
    preventScroll: true,
  });

  return {
    currentIndex,
    isAnimating,
    goToNext,
    goToPrevious,
    goToIndex,
    swipeRef,
  };
};

// Hook for swipeable tabs
export const useSwipeableTabs = (
  tabCount: number,
  initialTab: number = 0,
  onTabChange?: (tabIndex: number) => void
) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const goToNextTab = () => {
    if (activeTab < tabCount - 1) {
      const nextTab = activeTab + 1;
      setActiveTab(nextTab);
      onTabChange?.(nextTab);
    }
  };

  const goToPreviousTab = () => {
    if (activeTab > 0) {
      const prevTab = activeTab - 1;
      setActiveTab(prevTab);
      onTabChange?.(prevTab);
    }
  };

  const goToTab = (tabIndex: number) => {
    if (tabIndex >= 0 && tabIndex < tabCount && tabIndex !== activeTab) {
      setActiveTab(tabIndex);
      onTabChange?.(tabIndex);
    }
  };

  const swipeRef = useSwipeGestures({
    onSwipeLeft: goToNextTab,
    onSwipeRight: goToPreviousTab,
  }, {
    minDistance: 80,
    preventScroll: false,
  });

  return {
    activeTab,
    goToNextTab,
    goToPreviousTab,
    goToTab,
    swipeRef,
  };
};

// Hook for pull-to-refresh functionality
export const usePullToRefresh = (
  onRefresh: () => Promise<void> | void,
  threshold: number = 80
) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const swipeRef = useSwipeGestures({
    onSwipeStart: (point) => {
      // Only start pull-to-refresh if at top of page
      if (window.scrollY === 0) {
        setIsPulling(true);
      }
    },
    onSwipeDown: async (event) => {
      if (!isPulling || window.scrollY > 0) return;

      setPullDistance(event.distance);

      if (event.distance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
        }
      }
    },
    onSwipeEnd: () => {
      if (pullDistance < threshold) {
        setIsPulling(false);
        setPullDistance(0);
      }
    },
  }, {
    minDistance: 20,
    preventScroll: isPulling,
  });

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
    swipeRef,
  };
};

// Hook for swipe-to-dismiss functionality
export const useSwipeToDismiss = (
  onDismiss: (direction: 'left' | 'right') => void,
  threshold: number = 100
) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissDirection, setDismissDirection] = useState<'left' | 'right' | null>(null);

  const swipeRef = useSwipeGestures({
    onSwipeLeft: (event) => {
      if (event.distance >= threshold) {
        setIsDismissing(true);
        setDismissDirection('left');
        setTimeout(() => onDismiss('left'), 200);
      }
    },
    onSwipeRight: (event) => {
      if (event.distance >= threshold) {
        setIsDismissing(true);
        setDismissDirection('right');
        setTimeout(() => onDismiss('right'), 200);
      }
    },
  }, {
    minDistance: threshold,
    preventScroll: false,
  });

  return {
    isDismissing,
    dismissDirection,
    swipeRef,
  };
};

// Hook for long press gestures
export const useLongPress = (
  onLongPress: () => void,
  duration: number = 500
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleStart = () => {
      setIsPressed(true);
      timeoutRef.current = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, duration);
    };

    const handleEnd = () => {
      setIsPressed(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Add both touch and mouse events for broader compatibility
    element.addEventListener('touchstart', handleStart, { passive: true });
    element.addEventListener('touchend', handleEnd, { passive: true });
    element.addEventListener('touchcancel', handleEnd, { passive: true });
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mouseup', handleEnd);
    element.addEventListener('mouseleave', handleEnd);

    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('touchcancel', handleEnd);
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mouseup', handleEnd);
      element.removeEventListener('mouseleave', handleEnd);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onLongPress, duration]);

  return { elementRef, isPressed };
};

export default {
  useSwipeGestures,
  useSwipeableCarousel,
  useSwipeableTabs,
  usePullToRefresh,
  useSwipeToDismiss,
  useLongPress,
};
