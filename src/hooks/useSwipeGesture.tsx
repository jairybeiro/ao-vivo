import { useRef, useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipeGesture = ({
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: SwipeGestureOptions) => {
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndY.current = null;
    touchStartY.current = e.targetTouches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartY.current || !touchEndY.current) return;

    const distance = touchStartY.current - touchEndY.current;
    const isSwipeUp = distance > threshold;
    const isSwipeDown = distance < -threshold;

    if (isSwipeUp && onSwipeUp) {
      onSwipeUp();
    }

    if (isSwipeDown && onSwipeDown) {
      onSwipeDown();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  }, [onSwipeUp, onSwipeDown, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
