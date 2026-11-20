"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    options;
    queue = [];
    active = 0;
    nextSlotAt = 0;
    timer;
    closed = false;
    constructor(options) {
        this.options = options;
    }
    async run(task) {
        await this.acquire();
        try {
            return await task();
        }
        finally {
            this.release();
        }
    }
    penalise(delayMs) {
        const until = Date.now() + delayMs;
        if (until > this.nextSlotAt) {
            this.nextSlotAt = until;
        }
    }
    get pending() {
        return this.queue.length;
    }
    get inFlight() {
        return this.active;
    }
    close() {
        this.closed = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        while (this.queue.length > 0) {
            this.queue.shift().reject(new Error('Rate limiter closed'));
        }
    }
    acquire() {
        if (this.closed)
            return Promise.reject(new Error('Rate limiter closed'));
        if (this.active < this.options.maxConcurrent && Date.now() >= this.nextSlotAt) {
            return this.start();
        }
        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject });
            this.schedule();
        });
    }
    start() {
        this.active += 1;
        this.nextSlotAt = Date.now() + this.options.minIntervalMs;
        return Promise.resolve();
    }
    release() {
        this.active -= 1;
        this.schedule();
    }
    schedule() {
        if (this.closed || this.timer)
            return;
        if (this.queue.length === 0)
            return;
        if (this.active >= this.options.maxConcurrent)
            return;
        const wait = Math.max(0, this.nextSlotAt - Date.now());
        this.timer = setTimeout(() => {
            this.timer = undefined;
            if (this.closed)
                return;
            const waiter = this.queue.shift();
            if (!waiter)
                return;
            this.start().then(waiter.resolve, waiter.reject);
            this.schedule();
        }, wait);
        this.timer.unref?.();
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map