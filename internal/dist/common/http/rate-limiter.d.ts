export interface RateLimiterOptions {
    minIntervalMs: number;
    maxConcurrent: number;
}
export declare class RateLimiter {
    private readonly options;
    private readonly queue;
    private active;
    private nextSlotAt;
    private timer?;
    private closed;
    constructor(options: RateLimiterOptions);
    run<T>(task: () => Promise<T>): Promise<T>;
    penalise(delayMs: number): void;
    get pending(): number;
    get inFlight(): number;
    close(): void;
    private acquire;
    private start;
    private release;
    private schedule;
}
