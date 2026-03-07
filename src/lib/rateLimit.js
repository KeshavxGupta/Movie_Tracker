/**
 * Simple client-side rate limiter / throttler
 */
export class RateLimiter {
    constructor(limit, interval) {
        this.limit = limit;
        this.interval = interval;
        this.tokens = limit;
        this.lastRefill = Date.now();
    }

    refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const refillTokens = Math.floor(elapsed / (this.interval / this.limit));

        if (refillTokens > 0) {
            this.tokens = Math.min(this.limit, this.tokens + refillTokens);
            this.lastRefill = now;
        }
    }

    async acquire() {
        this.refill();
        if (this.tokens > 0) {
            this.tokens--;
            return true;
        }
        return false;
    }
}

// Global limiter for TMDB calls (e.g., 5 requests per second)
export const tmdbLimiter = new RateLimiter(5, 1000);
