'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../internal/dist/app.module');
const { TiktokService } = require('../internal/dist/tiktok/tiktok.service');
const originalCreate = NestFactory.createApplicationContext;

const sampleItem = {
  id: '123456789',
  desc: 'فيديو قطط لطيف',
  createTime: 1700000000,
  author: { uniqueId: 'cat_user', nickname: 'Cat User', verified: true },
  stats: { playCount: 1200, diggCount: 88, commentCount: 5, shareCount: 2 },
  video: { duration: 12, cover: 'https://img.example/cover.jpg', playAddr: 'https://cdn.example/video.mp4' },
  music: { id: 'music-1', title: 'Sound', authorName: 'Artist' }
};

function mockContext(service, onClose = () => {}) {
  return {
    get(token) {
      assert.equal(token, TiktokService);
      return service;
    },
    async close() { onClose(); }
  };
}

test('client search calls the embedded service and normalizes video results', async () => {
  let createdModule;
  let searchInput;
  NestFactory.createApplicationContext = async (module) => {
    createdModule = module;
    return mockContext({
      async searchGeneral(input) {
        searchInput = input;
        return {
          data: {
            status_code: 0,
            data: [{ item: sampleItem }],
            cursor: '50',
            has_more: 1,
            log_pb: { impr_id: 'search-abc' }
          }
        };
      }
    });
  };

  try {
    const { createClient } = require('../index.js');
    const client = createClient();
    const result = await client.searchVideos(' قطط ', { count: 5 });
    assert.equal(createdModule, AppModule);
    assert.deepEqual(searchInput, { keyword: 'قطط', count: 5, offset: '0', searchId: undefined });
    assert.equal(result.query, 'قطط');
    assert.equal(result.videos.length, 1);
    assert.equal(result.videos[0].url, 'https://www.tiktok.com/@cat_user/video/123456789');
    assert.equal(result.videos[0].title, 'فيديو قطط لطيف');
    assert.equal(result.videos[0].views, 1200);
    assert.equal(result.videos[0].likes, 88);
    assert.equal(result.videos[0].author.verified, true);
    assert.equal(result.hasMore, true);
    assert.equal(result.cursor, '50');
    assert.equal(result.searchId, 'search-abc');
    await client.close();
  } finally {
    NestFactory.createApplicationContext = originalCreate;
  }
});

test('one-shot search closes its internal context and supports pagination parameters', async () => {
  let searchInput;
  let closed = false;
  NestFactory.createApplicationContext = async () => mockContext({
    async searchGeneral(input) {
      searchInput = input;
      return { data: { status_code: 203, data: [{ item: sampleItem }], has_more: 0 } };
    }
  }, () => { closed = true; });

  try {
    const { searchVideos } = require('../index.js');
    const result = await searchVideos('cats', { offset: '50', searchId: 'search-abc' });
    assert.equal(searchInput.offset, '50');
    assert.equal(searchInput.searchId, 'search-abc');
    assert.equal(result.videos.length, 1);
    assert.equal(result.hasMore, false);
    assert.equal(closed, true);
  } finally {
    NestFactory.createApplicationContext = originalCreate;
  }
});

test('searchVideos validates keyword and count before starting the service', async () => {
  const { searchVideos } = require('../index.js');
  await assert.rejects(searchVideos('  '), TypeError);
  await assert.rejects(searchVideos('cats', { count: 51 }), RangeError);
});

test('getVideo normalizes video details from the embedded service', async () => {
  NestFactory.createApplicationContext = async () => mockContext({
    async getItemDetail(id) {
      assert.equal(id, '123456789');
      return { data: { itemInfo: { itemStruct: sampleItem } } };
    }
  });
  try {
    const { createClient } = require('../index.js');
    const client = createClient();
    const video = await client.getVideo('123456789');
    assert.equal(video.id, '123456789');
    assert.equal(video.author.username, 'cat_user');
    await client.close();
  } finally {
    NestFactory.createApplicationContext = originalCreate;
  }
});
