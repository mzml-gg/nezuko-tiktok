import { TikTokHttpError, TikTokValidationError, TikTokError } from './errors.js';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000';
const DEFAULT_DOWNLOAD_BASE_URL = 'https://api.nezuko-wa.web.id';
const SEARCH_SORTS = new Set(['relevance', 'likes']);
const PUBLISHED = new Set(['day', 'week', 'month', '3months', '6months']);

function asPositiveInteger(value, name) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new TikTokValidationError(`${name} must be a positive integer.`);
  return n;
}

export class TikTokClient {
  constructor({ baseUrl = process.env.TIKTOK_API_URL ?? DEFAULT_BASE_URL, downloadBaseUrl = process.env.TIKTOK_DOWNLOAD_API_URL ?? DEFAULT_DOWNLOAD_BASE_URL, fetch: fetchImpl = globalThis.fetch, timeout = 60_000, headers = {} } = {}) {
    if (typeof fetchImpl !== 'function') throw new TikTokValidationError('A fetch implementation is required. Use Node.js 18+ or pass fetch.');
    try { this.baseUrl = new URL(baseUrl); } catch { throw new TikTokValidationError('baseUrl must be a valid URL.'); }
    try { this.downloadBaseUrl = new URL(downloadBaseUrl); } catch { throw new TikTokValidationError('downloadBaseUrl must be a valid URL.'); }
    this.fetch = fetchImpl;
    this.timeout = timeout;
    this.headers = { accept: 'application/json', ...headers };
  }

  async request(path, params = {}) {
    const url = new URL(path.replace(/^\//, ''), this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await this.fetch(url, { method: 'GET', headers: this.headers, signal: controller.signal });
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (cause) {
        throw new TikTokHttpError('TikTok API returned invalid JSON.', { status: response.status, endpoint: url.toString(), cause });
      }
      if (!response.ok) {
        throw new TikTokHttpError(data?.error || `TikTok API request failed with HTTP ${response.status}.`, { status: response.status, endpoint: url.toString(), details: data });
      }
      return data;
    } catch (error) {
      if (error instanceof TikTokError) throw error;
      if (error.name === 'AbortError') throw new TikTokHttpError(`TikTok API request timed out after ${this.timeout} ms.`, { endpoint: url.toString(), cause: error });
      throw new TikTokHttpError(`Could not reach TikTok API: ${error.message}`, { endpoint: url.toString(), cause: error });
    } finally { clearTimeout(timer); }
  }

  health() { return this.request('/health'); }

  searchVideos(query, { country, sort = 'relevance', published, cursor } = {}) {
    if (typeof query !== 'string' || !query.trim()) throw new TikTokValidationError('query must be a non-empty string.');
    if (!SEARCH_SORTS.has(sort)) throw new TikTokValidationError(`sort must be one of: ${[...SEARCH_SORTS].join(', ')}.`);
    if (published !== undefined && !PUBLISHED.has(published)) throw new TikTokValidationError(`published must be one of: ${[...PUBLISHED].join(', ')}.`);
    return this.request('/search/videos', { query: query.trim(), country, sort, published, cursor });
  }

  searchUsers(query, { cursor } = {}) { return this.request('/search/users', { query, cursor }); }
  searchTop(query, { country, cursor } = {}) { return this.request('/search/top', { query, country, cursor }); }
  searchLive(query, { country, cursor } = {}) { return this.request('/search/live', { query, country, cursor }); }
  suggestions(query, { country } = {}) { return this.request('/search/suggestions', { query, country }); }
  videoDetails(video, { country } = {}) { return this.request('/videos/details', { video, country }); }
  videoMedia(video, { country } = {}) { return this.request('/videos/media', { video, country }); }

  async downloadTikTok(url, { quality, endpoint = '/api/download/tiktok-api' } = {}) {
    if (typeof url !== 'string' || !url.trim()) throw new TikTokValidationError('url must be a non-empty TikTok URL.');
    let videoUrl;
    try { videoUrl = new URL(url.trim()); } catch { throw new TikTokValidationError('url must be a valid URL.'); }
    if (!/^(?:www\.)?(?:vm\.|vt\.|m\.)?tiktok\.com$/i.test(videoUrl.hostname) && !/tiktok\.com$/i.test(videoUrl.hostname)) {
      throw new TikTokValidationError('url must be a TikTok URL.');
    }
    const apiUrl = new URL(endpoint.replace(/^\//, ''), this.downloadBaseUrl);
    apiUrl.searchParams.set('url', videoUrl.toString());
    const data = await this.requestAbsolute(apiUrl);
    if (data?.success === false) throw new TikTokHttpError(data.error || 'TikTok download API returned success=false.', { endpoint: apiUrl.toString(), details: data });
    if (!data || typeof data !== 'object') throw new TikTokHttpError('TikTok download API returned an invalid response.', { endpoint: apiUrl.toString(), details: data });
    if (quality && !['hd', 'sd'].includes(quality)) throw new TikTokValidationError('quality must be hd or sd.');
    return { ...data, selected_download: quality ? (data.qualities?.[quality] || data.download || null) : (data.download || data.qualities?.hd || data.qualities?.sd || null) };
  }

  async requestAbsolute(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await this.fetch(url, { method: 'GET', headers: this.headers, signal: controller.signal });
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (cause) { throw new TikTokHttpError('TikTok download API returned invalid JSON.', { status: response.status, endpoint: url.toString(), cause }); }
      if (!response.ok) throw new TikTokHttpError(data?.error || `TikTok download API failed with HTTP ${response.status}.`, { status: response.status, endpoint: url.toString(), details: data });
      return data;
    } catch (error) {
      if (error instanceof TikTokError) throw error;
      if (error.name === 'AbortError') throw new TikTokHttpError(`TikTok download API timed out after ${this.timeout} ms.`, { endpoint: url.toString(), cause: error });
      throw new TikTokHttpError(`Could not reach TikTok download API: ${error.message}`, { endpoint: url.toString(), cause: error });
    } finally { clearTimeout(timer); }
  }

  async *iterateVideos(query, options = {}) {
    let cursor = options.cursor;
    do {
      const page = await this.searchVideos(query, { ...options, cursor });
      for (const video of page.videos ?? []) yield video;
      cursor = page.next_cursor;
    } while (cursor && options.maxPages !== 0 && (!options.maxPages || --options.maxPages > 0));
  }
}

export const createClient = (options) => new TikTokClient(options);
export const searchVideos = (query, options = {}) => {
  const { clientOptions, ...searchOptions } = options;
  return createClient(clientOptions).searchVideos(query, searchOptions);
};
export const downloadTikTok = (url, options = {}) => {
  const { clientOptions, ...downloadOptions } = options;
  return createClient(clientOptions).downloadTikTok(url, downloadOptions);
};
export { TikTokError, TikTokHttpError, TikTokValidationError };
export default TikTokClient;
