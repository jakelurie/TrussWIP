"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CITIES } from "@/lib/cities";

interface CityComboboxProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  exclude?: string[];
  className?: string;
}

export default function CityCombobox({
  value,
  onChange,
  placeholder = "Search cities...",
  exclude = [],
  className = "",
}: CityComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const excludeSet = new Set(exclude);
  const filtered = CITIES.filter(
    (c) =>
      !excludeSet.has(c) &&
      c.toLowerCase().includes(query.toLowerCase())
  );

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = useCallback(
    (city: string) => {
      setQuery(city);
      onChange(city);
      setOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) select(filtered[highlightIndex]);
        break;
      case "Escape":
        setOpen(false);
        setQuery(value);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-deep-stage border border-white/5 rounded-lg text-sm text-house-lights/90 placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 transition-colors"
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightIndex(0);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-deep-stage border border-white/10 rounded-lg shadow-xl"
        >
          {filtered.slice(0, 50).map((city, i) => (
            <li
              key={city}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === highlightIndex
                  ? "bg-signal-orange/10 text-signal-orange"
                  : "text-house-lights/70 hover:bg-white/[0.04]"
              }`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                select(city);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && query.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 px-3 py-3 bg-deep-stage border border-white/10 rounded-lg shadow-xl text-sm text-aluminum/40">
          No cities found
        </div>
      )}
    </div>
  );
}
