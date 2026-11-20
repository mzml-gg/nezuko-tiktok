'use strict';

require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./internal/dist/app.module');
const { TiktokService } = require('./internal/dist/tiktok/tiktok.service');

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function flag(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function normalizeVideo(entry, includeRaw = false) {
  const item = entry && entry.item ? entry.item : entry;
  if (!item || typeof item !== 'object') return null;

  const author = item.author || {};
  const stats = item.stats || {};
  const video = item.video || {};
  const music = item.music || {};
  const id = item.id === null || item.id === undefined ? null : String(item.id);
  const username = author.uniqueId || author.unique_id || null;
  const url = item.shareInfo?.shareUrl || item.share_info?.share_url || item.share_url ||
    (id && username
      ? `https://www.tiktok.com/@${username}/video/${id}`
      : id
        ? `https://www.tiktok.com/video/${id}`
        : null);
  const createdAtSeconds = numberOrNull(item.createTime ?? item.create_time);

  const result = {
    id,
    title: item.desc || '',
    description: item.desc || '',
    url,
    author: {
      username,
      name: author.nickname || null,
      verified: flag(author.verified),
      url: username ? `https://www.tiktok.com/@${username}` : null,
      avatarUrl: author.avatarMedium || author.avatarThumb || author.avatarLarger || null
    },
    views: numberOrNull(stats.playCount ?? stats.play_count),
    likes: numberOrNull(stats.diggCount ?? stats.digg_count),
    comments: numberOrNull(stats.commentCount ?? stats.comment_count),
    shares: numberOrNull(stats.shareCount ?? stats.share_count),
    durationSeconds: numberOrNull(video.duration),
    thumbnail: video.cover || video.originCover || video.dynamicCover || null,
    playUrl: video.playAddr || video.play_addr || null,
    downloadUrl: video.downloadAddr || video.download_addr || null,
    createdAt: createdAtSeconds ? new Date(createdAtSeconds * 1000) : null,
    music: {
      id: music.id ? String(music.id) : null,
      title: music.title || null,
      author: music.authorName || null
    }
  };

  if (includeRaw) result.raw = item;
  return result;
}

function isFlag(value) {
  return flag(value);
}

class TikTokSearchClient {
  constructor(options = {}) {
    this.logger = options.logger ?? false;
    this.contextPromise = null;
    this.closePromise = null;
  }

  async _getService() {
    if (this.closePromise) await this.closePromise;
    if (!this.contextPromise) {
      this.contextPromise = NestFactory.createApplicationContext(AppModule, {
        logger: this.logger
      }).catch((error) => {
        this.contextPromise = null;
        throw error;
      });
    }
    const context = await this.contextPromise;
    return context.get(TiktokService);
  }

  async searchVideos(keyword, options = {}) {
    if (typeof keyword !== 'string' || !keyword.trim()) {
      throw new TypeError('keyword must be a non-empty string.');
    }
    const count = options.count ?? 20;
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      throw new RangeError('count must be an integer from 1 to 50.');
    }

    const service = await this._getService();
    const response = await service.searchGeneral({
      keyword: keyword.trim(),
      count,
      offset: options.offset === undefined || options.offset === null ? '0' : String(options.offset),
      searchId: options.searchId === undefined || options.searchId === null ? undefined : String(options.searchId)
    });
    const body = response.data || {};
    const entries = Array.isArray(body.data) ? body.data : [];
    const videos = entries
      .map((entry) => normalizeVideo(entry, options.includeRaw === true))
      .filter((video) => video && video.id);

    return {
      query: keyword.trim(),
      videos,
      cursor: body.cursor ?? null,
      hasMore: isFlag(body.has_more ?? body.hasMore),
      searchId: body.log_pb?.impr_id ?? null
    };
  }

  async getVideo(videoId, options = {}) {
    if (videoId === undefined || videoId === null || String(videoId).trim() === '') {
      throw new TypeError('videoId must be a non-empty value.');
    }
    const service = await this._getService();
    const response = await service.getItemDetail(String(videoId));
    const item = response.data?.itemInfo?.itemStruct || response.data?.itemStruct || response.data?.item;
    const video = normalizeVideo(item, options.includeRaw === true);
    if (!video) throw new Error('TikTok returned no video information for this id.');
    return video;
  }

  async close() {
    if (this.closePromise) return this.closePromise;
    const pending = this.contextPromise;
    this.contextPromise = null;
    if (!pending) return;

    this.closePromise = (async () => {
      const context = await pending;
      await context.close();
    })();
    try {
      await this.closePromise;
    } finally {
      this.closePromise = null;
    }
  }
}

function createClient(options) {
  return new TikTokSearchClient(options);
}

async function searchVideos(keyword, options = {}) {
  const client = createClient({ logger: options.logger });
  try {
    return await client.searchVideos(keyword, options);
  } finally {
    await client.close();
  }
}

async function getVideo(videoId, options = {}) {
  const client = createClient({ logger: options.logger });
  try {
    return await client.getVideo(videoId, options);
  } finally {
    await client.close();
  }
}

module.exports = {
  searchVideos,
  getVideo,
  createClient,
  TikTokSearchClient
};
