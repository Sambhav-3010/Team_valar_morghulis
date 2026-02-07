'use client';

import { useEffect, useState } from 'react';

export function useAnimateOnMount(delay = 0) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return mounted;
}

export function useStaggerDelay(index: number, baseDelay = 50) {
  return index * baseDelay;
}
