"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokService = void 0;
const common_1 = require("@nestjs/common");
const configuration_1 = require("../config/configuration");
const tiktok_client_1 = require("./tiktok.client");
const tiktok_errors_1 = require("../common/errors/tiktok-errors");
const softBlocks = {
    userDetail: (payload) => {
        if (!isRecord(payload) || !isRecord(payload.userInfo))
            return false;
        const user = payload.userInfo.user;
        return isRecord(user) && Object.keys(user).length === 0;
    },
    itemDetail: (payload) => {
        if (!isRecord(payload) || hasErrorStatus(payload))
            return false;
        return payload.itemInfo === undefined;
    },
    emptyList: (payload) => {
        if (!isRecord(payload))
            return false;
        return Object.keys(payload).every((key) => BOOKKEEPING_KEYS.has(key));
    },
};
const BOOKKEEPING_KEYS = new Set([
    'status_code',
    'statusCode',
    'log_pb',
]);
function challengeIdFrom(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return null;
    }
    if (!isRecord(parsed) || !isRecord(parsed.challengeInfo))
        return null;
    const challenge = parsed.challengeInfo.challenge;
    if (!isRecord(challenge))
        return null;
    const id = challenge.id;
    return typeof id === 'string' && id.length > 0 ? id : null;
}
function hasErrorStatus(payload) {
    const code = payload.statusCode ?? payload.status_code;
    return typeof code === 'number' && code !== 0;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isEnvelopeOnly(payload) {
    return softBlocks.emptyList(payload);
}
const COVER_FORMAT = '2';
let TiktokService = class TiktokService {
    config;
    client;
    constructor(config, client) {
        this.config = config;
        this.client = client;
    }
    async getUserDetail(input) {
        if (!input.uniqueId && !input.secUid) {
            throw new tiktok_errors_1.BadRequestError('user/detail requires either `uniqueId` or `secUid`.');
        }
        return this.client.get('/api/user/detail/', {
            secUid: input.secUid ?? '',
            uniqueId: input.uniqueId ?? '',
            from_page: 'user',
        }, {
            keepEmpty: ['secUid', 'uniqueId'],
            referer: input.uniqueId ? `${this.config.tiktok.origin}/@${input.uniqueId}` : undefined,
            softBlockDetector: softBlocks.userDetail,
        });
    }
    async getPostItemList(input) {
        return this.client.get('/api/post/item_list/', {
            secUid: input.secUid,
            cursor: input.cursor ?? '0',
            count: input.count ?? 30,
            coverFormat: COVER_FORMAT,
            needPinnedItemIds: 'true',
            locate_item_id: '',
            post_item_list_request_type: '0',
        }, {
            softBlockDetector: isEnvelopeOnly,
            envCode: 64,
        });
    }
    async getMusicDetail(musicId) {
        return this.client.get('/api/music/detail/', { musicId });
    }
    async getSessionState() {
        return this.client.get('/passport/token/beat/web/', { device_platform: 'web', aid: '1459', scene: 'active' }, { sign: false, bare: true, allowEmpty: true });
    }
    async getUserList(secUid, scene, count = 30, cursor) {
        return this.client.get('/api/user/list/', {
            secUid,
            count,
            minCursor: cursor ?? '0',
            maxCursor: '0',
            scene: scene === 'followers' ? '67' : '21',
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getItemDetail(itemId) {
        return this.client.get('/api/item/detail/', { itemId }, {
            referer: `${this.config.tiktok.origin}/`,
            softBlockDetector: softBlocks.itemDetail,
        });
    }
    async getRelatedItemList(itemId, count = 16) {
        return this.client.get('/api/related/item_list/', {
            itemID: itemId,
            count,
            coverFormat: 2,
            isNonPersonalized: false,
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getCommentList(input) {
        return this.client.get('/api/comment/list/', {
            aweme_id: input.awemeId,
            count: input.count ?? 20,
            cursor: input.cursor ?? '0',
            fromWeb: 1,
            enter_from: 'tiktok_web',
            current_region: this.config.tiktok.region,
        }, {
            referer: `${this.config.tiktok.origin}/`,
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getCommentReplyList(input) {
        return this.client.get('/api/comment/list/reply/', {
            item_id: input.awemeId,
            comment_id: input.commentId,
            count: input.count ?? 20,
            cursor: input.cursor ?? '0',
        }, {
            referer: `${this.config.tiktok.origin}/`,
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getLikedItemList(input) {
        return this.client.get('/api/favorite/item_list/', {
            secUid: input.secUid,
            cursor: input.cursor ?? '0',
            count: input.count ?? 30,
            coverFormat: COVER_FORMAT,
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getUserPlaylists(input) {
        return this.client.get('/api/user/playlist/', {
            secUid: input.secUid,
            cursor: input.cursor ?? '0',
            count: input.count ?? 20,
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getMixDetail(mixId) {
        return this.client.get('/api/mix/detail/', { mixId });
    }
    async getMixItemList(input) {
        return this.client.get('/api/mix/item_list/', {
            mixId: input.mixId,
            cursor: input.cursor ?? '0',
            count: input.count ?? 30,
            coverFormat: COVER_FORMAT,
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getRecommendItemList(count = 30) {
        return this.client.get('/api/recommend/item_list/', {
            from_page: 'fyp',
            count,
            coverFormat: COVER_FORMAT,
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getMusicItemList(input) {
        return this.client.get('/api/music/item_list/', {
            musicID: input.musicId,
            cursor: input.cursor ?? '0',
            count: input.count ?? 30,
            coverFormat: COVER_FORMAT,
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getChallengeItemList(input) {
        const challengeID = await this.resolveChallengeId(input.challengeId);
        return this.client.get('/api/challenge/item_list/', {
            challengeID,
            count: input.count ?? 30,
            cursor: input.cursor ?? '0',
            fromWeb: 1,
        }, {
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async getChallengeDetail(challengeIdOrName) {
        const raw = challengeIdOrName.trim();
        const query = /^\d+$/.test(raw)
            ? { challengeId: raw }
            : { challengeName: raw.replace(/^#/, '') };
        return this.client.get('/api/challenge/detail/', query);
    }
    async resolveChallengeId(challengeIdOrName) {
        const raw = challengeIdOrName.trim();
        if (/^\d+$/.test(raw))
            return raw;
        const name = raw.replace(/^#/, '');
        if (!name) {
            throw new tiktok_errors_1.BadRequestError('challengeId must be a numeric id or a hashtag name such as `cat` or `#cat`.');
        }
        const detail = await this.getChallengeDetail(name);
        const challenge = challengeIdFrom(detail.raw);
        if (!challenge) {
            throw new tiktok_errors_1.UpstreamRejectedError(`No TikTok hashtag matches "${name}".`, { hashtag: name, upstreamStatus: detail.status });
        }
        return challenge;
    }
    async searchGeneral(input) {
        return this.client.get('/api/search/general/full/', {
            keyword: input.keyword,
            count: input.count ?? 12,
            offset: input.offset ?? '0',
            search_id: input.searchId,
            search_source: 'normal_search',
            query_type: 'general',
            is_filter_search: 0,
            from_group: 1,
        }, {
            referer: `${this.config.tiktok.origin}/search?q=${encodeURIComponent(input.keyword)}`,
            softBlockDetector: isEnvelopeOnly,
            okStatusCodes: [203],
        });
    }
    async searchUsers(input) {
        return this.client.get('/api/search/user/full/', {
            keyword: input.keyword,
            count: input.count ?? 12,
            cursor: input.offset ?? '0',
            search_id: input.searchId,
            search_source: 'normal_search',
        }, {
            referer: `${this.config.tiktok.origin}/search?q=${encodeURIComponent(input.keyword)}`,
            softBlockDetector: isEnvelopeOnly,
        });
    }
    async raw(input) {
        if (!input.path.startsWith('/')) {
            throw new tiktok_errors_1.BadRequestError('raw.path must begin with "/" and be origin-relative.');
        }
        if (input.path.startsWith('//')) {
            throw new tiktok_errors_1.BadRequestError('raw.path must not be protocol-relative.');
        }
        return this.client.request({
            path: input.path,
            query: input.query,
            headers: undefined,
            referer: input.referer,
            method: input.method ?? 'GET',
            body: input.body,
            sign: input.sign,
            bare: input.bare,
            allowEmpty: input.allowEmpty,
        });
    }
    async probe() {
        try {
            const response = await this.searchGeneral({ keyword: 'a', count: 1 });
            return { ok: true, detail: response };
        }
        catch (error) {
            return { ok: false, detail: undefined, error: error instanceof Error ? error.message : String(error) };
        }
    }
};
exports.TiktokService = TiktokService;
exports.TiktokService = TiktokService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(configuration_1.CONFIG)),
    __metadata("design:paramtypes", [Object, tiktok_client_1.TiktokClient])
], TiktokService);
//# sourceMappingURL=tiktok.service.js.map