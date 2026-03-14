"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref to attach to any element and a boolean `visible`
 * that flips to true once the element enters the viewport.
 * Once visible it stays visible (no re-hide on scroll out).
 */
export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
