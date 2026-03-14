"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="font-mono text-signal-orange text-sm tracking-widest uppercase mb-4">
          Error
        </p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-house-lights mb-4">
          Something Went Wrong
        </h1>
        <p className="text-aluminum text-lg mb-10">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-signal-orange text-white font-semibold rounded hover:brightness-110 transition"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-ink/10 text-house-lights rounded hover:bg-ink/[0.04] transition"
          >
            Back to Home
          </a>
          <a
            href="/contact"
            className="px-6 py-3 text-aluminum hover:text-house-lights transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
