"use client";

import { useEffect, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms
 * when `trigger` flips to true. Returns the current display value.
 */
export function useCountUp(target: number, trigger: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger || target === 0) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [trigger, target, duration]);

  return value;
}
