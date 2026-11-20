import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/index.js';

test('live TikTok video search returns videos', { timeout: 120_000 }, async () => {
  const client = createClient({ baseUrl: process.env.TIKTOK_API_URL || 'http://127.0.0.1:8000' });
  const result = await client.searchVideos(process.env.TIKTOK_QUERY || 'dance', { country: process.env.TIKTOK_COUNTRY || 'us' });
  assert.equal(result.query, process.env.TIKTOK_QUERY || 'dance');
  assert.ok(Array.isArray(result.videos));
  assert.ok(result.videos.length > 0, 'TikTok returned no videos');
});
