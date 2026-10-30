interface RateLimitRecord {
  lastRequestTime: number;
  requestCount: number;
  windowStart: number;
}

export class AIRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private inFlight = new Map<string, Promise<any>>();
  private minIntervalMs = 2500; // 2.5 seconds minimum cooldown between explicit prompts
  private maxRequestsPerMinute = 15;
  private windowDurationMs = 60 * 1000;

  public checkRateLimit(clientId: string = 'global'): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
    const now = Date.now();
    let record = this.records.get(clientId);

    if (!record || now - record.windowStart > this.windowDurationMs) {
      record = { lastRequestTime: now, requestCount: 1, windowStart: now };
      this.records.set(clientId, record);
      return { allowed: true };
    }

    // Cooldown check (prevent rapid button spamming)
    const timeSinceLast = now - record.lastRequestTime;
    if (timeSinceLast < this.minIntervalMs) {
      const waitSec = Math.ceil((this.minIntervalMs - timeSinceLast) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: waitSec,
        reason: `Please wait ${waitSec}s before prompting AI again.`,
      };
    }

    // Window quota check
    if (record.requestCount >= this.maxRequestsPerMinute) {
      const waitSec = Math.ceil((this.windowDurationMs - (now - record.windowStart)) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: waitSec,
        reason: `Rate limit active (max ${this.maxRequestsPerMinute}/min). Try again in ${waitSec}s.`,
      };
    }

    record.requestCount += 1;
    record.lastRequestTime = now;
    return { allowed: true };
  }

  // Deduplicate in-flight identical calls (e.g. user rapid double-clicks)
  public async executeDeduplicated<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }
}

export const aiRateLimiter = new AIRateLimiter();
