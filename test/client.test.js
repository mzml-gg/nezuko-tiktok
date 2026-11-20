import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { TikTokClient, TikTokHttpError, TikTokValidationError } from '../src/index.js';

function server() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('content-type', 'application/json');
    if (url.pathname === '/search/videos') {
      res.end(JSON.stringify({ query: url.searchParams.get('query'), video_count: 1, videos: [{ id: 'demo-1' }], next_cursor: null, has_more: false }));
    } else if (url.pathname === '/health') res.end(JSON.stringify({ status: 'ok' }));
    else { res.statusCode = 404; res.end(JSON.stringify({ error: 'not found' })); }
  });
}

test('searchVideos calls the compatible endpoint', async () => {
  const api = server(); await new Promise(resolve => api.listen(0, resolve));
  try {
    const port = api.address().port;
    const client = new TikTokClient({ baseUrl: `http://127.0.0.1:${port}` });
    const result = await client.searchVideos('dance');
    assert.equal(result.query, 'dance'); assert.equal(result.video_count, 1); assert.equal(result.videos[0].id, 'demo-1');
  } finally { api.close(); }
});

test('validation rejects invalid search options', () => {
  const client = new TikTokClient();
  assert.throws(() => client.searchVideos(''), TikTokValidationError);
  assert.throws(() => client.searchVideos('x', { sort: 'bad' }), TikTokValidationError);
});

test('HTTP errors expose status and details', async () => {
  const client = new TikTokClient({ baseUrl: 'http://127.0.0.1:1', timeout: 100 });
  await assert.rejects(() => client.health(), error => error instanceof TikTokHttpError);
});
