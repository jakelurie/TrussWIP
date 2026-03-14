import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window per IP address.
 *
 * Usage in an API route:
 *   const limiter = rateLimit({ interval: 60_000, limit: 30 });
 *   export async function POST(req: NextRequest) {
 *     const limited = limiter(req);
 *     if (limited) return limited;
 *     // ... handle request
 *   }
 */

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  interval?: number;
  /** Max requests per window (default: 30) */
  limit?: number;
}

interface TokenBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, TokenBucket>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }, 5 * 60_000);
}

export function rateLimit(options: RateLimitOptions = {}) {
  const { interval = 60_000, limit = 30 } = options;

  return function check(req: NextRequest): NextResponse | null {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + interval });
      return null;
    }

    bucket.count++;

    if (bucket.count > limit) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(bucket.resetAt),
          },
        }
      );
    }

    return null;
  };
}
