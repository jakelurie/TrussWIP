"use client";

import { useState, useEffect, useRef } from "react";

const taglines = [
  "No middlemen. No markups. No non-competes.",
  "Your rate. Your reputation. Your career.",
  "Payment secured at booking. Not invoiced 90 days later.",
  "Per-event insurance at checkout. No annual policy required.",
  "Both sides verified. Both sides reviewed.",
  "See the rate. Keep the money. Own the reputation.",
];

const DISPLAY_MS = 3400;
const TRANSITION_MS = 600;

type Phase = "visible" | "exiting" | "entering";

export default function RotatingTagline() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("visible");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    if (phase === "visible") {
      timeoutRef.current = setTimeout(() => setPhase("exiting"), DISPLAY_MS);
    } else if (phase === "exiting") {
      timeoutRef.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % taglines.length);
        setPhase("entering");
      }, TRANSITION_MS);
    } else if (phase === "entering") {
      timeoutRef.current = setTimeout(() => setPhase("visible"), TRANSITION_MS);
    }

    return clear;
  }, [phase]);

  const style: React.CSSProperties =
    phase === "exiting"
      ? { opacity: 0, transform: "translateY(-14px)", transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease` }
      : phase === "entering"
      ? { animation: `tagline-slide-in ${TRANSITION_MS}ms ease forwards` }
      : { opacity: 1, transform: "translateY(0)" };

  return (
    <div className="flex flex-col items-center">
      <div className="overflow-hidden h-[3.5rem] sm:h-[3rem] lg:h-[2.5rem] flex items-center justify-center">
        <p
          className="font-heading font-normal tracking-wider text-sm sm:text-base lg:text-lg text-aluminum text-center px-4"
          style={style}
        >
          {taglines[index]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mt-4">
        {taglines.map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors duration-400"
            style={{ backgroundColor: i === index ? "var(--color-signal-orange)" : "#333333" }}
          />
        ))}
      </div>
    </div>
  );
}
