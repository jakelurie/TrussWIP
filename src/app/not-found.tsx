import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Truss",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="font-mono text-signal-orange text-sm tracking-widest uppercase mb-4">
          404
        </p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-house-lights mb-4">
          Page Not Found
        </h1>
        <p className="text-aluminum text-lg mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-signal-orange text-white font-semibold rounded hover:brightness-110 transition"
          >
            Back to Home
          </Link>
          <Link
            href="/browse"
            className="px-6 py-3 border border-ink/10 text-house-lights rounded hover:bg-ink/[0.04] transition"
          >
            Browse Technicians
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 text-aluminum hover:text-house-lights transition"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}
