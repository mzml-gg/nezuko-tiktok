export interface TikTokClientOptions {
  baseUrl?: string | URL;
  fetch?: typeof globalThis.fetch;
  timeout?: number;
  headers?: Record<string, string>;
  downloadBaseUrl?: string | URL;
}
export interface SearchVideoOptions { country?: string; sort?: 'relevance' | 'likes'; published?: 'day' | 'week' | 'month' | '3months' | '6months'; cursor?: string; }
export declare class TikTokClient {
  constructor(options?: TikTokClientOptions);
  health(): Promise<Record<string, unknown>>;
  searchVideos(query: string, options?: SearchVideoOptions): Promise<Record<string, unknown>>;
  searchUsers(query: string, options?: { cursor?: string }): Promise<Record<string, unknown>>;
  searchTop(query: string, options?: { country?: string; cursor?: string }): Promise<Record<string, unknown>>;
  searchLive(query: string, options?: { country?: string; cursor?: string }): Promise<Record<string, unknown>>;
  suggestions(query: string, options?: { country?: string }): Promise<Record<string, unknown>>;
  videoDetails(video: string, options?: { country?: string }): Promise<Record<string, unknown>>;
  videoMedia(video: string, options?: { country?: string }): Promise<Record<string, unknown>>;
  downloadTikTok(url: string, options?: { quality?: 'hd' | 'sd'; endpoint?: string }): Promise<Record<string, unknown>>;
  iterateVideos(query: string, options?: SearchVideoOptions & { maxPages?: number }): AsyncGenerator<Record<string, unknown>>;
}
export declare const createClient: (options?: TikTokClientOptions) => TikTokClient;
export declare const searchVideos: (query: string, options?: SearchVideoOptions & { clientOptions?: TikTokClientOptions }) => Promise<Record<string, unknown>>;
export declare const downloadTikTok: (url: string, options?: { quality?: 'hd' | 'sd'; endpoint?: string; clientOptions?: TikTokClientOptions }) => Promise<Record<string, unknown>>;
export declare class TikTokError extends Error {}
export declare class TikTokHttpError extends TikTokError { status?: number; endpoint?: string; details?: unknown; }
export declare class TikTokValidationError extends TikTokError {}
export default TikTokClient;
