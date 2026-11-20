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
exports.InternalController = exports.TiktokController = void 0;
const common_1 = require("@nestjs/common");
const tiktok_service_1 = require("./tiktok.service");
const upstream_headers_interceptor_1 = require("./upstream-headers.interceptor");
const session_service_1 = require("../session/session.service");
const rate_limiter_1 = require("../common/http/rate-limiter");
const http_client_1 = require("../common/http/http-client");
const numeric_id_pipe_1 = require("../common/pipes/numeric-id.pipe");
const configuration_1 = require("../config/configuration");
const tiktok_dto_1 = require("./dto/tiktok.dto");
let TiktokController = class TiktokController {
    tiktok;
    constructor(tiktok) {
        this.tiktok = tiktok;
    }
    userDetail(query) {
        return this.tiktok.getUserDetail(query);
    }
    userPosts(query) {
        return this.tiktok.getPostItemList(query);
    }
    userFollowers({ secUid, count, cursor }) {
        return this.tiktok.getUserList(secUid, 'followers', count, cursor);
    }
    userFollowing({ secUid, count, cursor }) {
        return this.tiktok.getUserList(secUid, 'following', count, cursor);
    }
    userLiked(query) {
        return this.tiktok.getLikedItemList(query);
    }
    userPlaylists(query) {
        return this.tiktok.getUserPlaylists(query);
    }
    trending({ count }) {
        return this.tiktok.getRecommendItemList(count);
    }
    video(itemId) {
        return this.tiktok.getItemDetail(itemId);
    }
    relatedVideos(itemId) {
        return this.tiktok.getRelatedItemList(itemId);
    }
    comments(awemeId, { count, cursor }) {
        return this.tiktok.getCommentList({ awemeId, count, cursor });
    }
    commentReplies(awemeId, commentId, { count, cursor }) {
        return this.tiktok.getCommentReplyList({ awemeId, commentId, count, cursor });
    }
    playlist(mixId) {
        return this.tiktok.getMixDetail(mixId);
    }
    playlistVideos(mixId, { count, cursor }) {
        return this.tiktok.getMixItemList({ mixId, count, cursor });
    }
    music(musicId) {
        return this.tiktok.getMusicDetail(musicId);
    }
    musicVideos(musicId, { count, cursor }) {
        return this.tiktok.getMusicItemList({ musicId, count, cursor });
    }
    challenge(tag) {
        return this.tiktok.getChallengeDetail(tag);
    }
    challengeVideos(challengeId, { count, cursor }) {
        return this.tiktok.getChallengeItemList({ challengeId, count, cursor });
    }
    searchGeneral(query) {
        return this.tiktok.searchGeneral(query);
    }
    searchUsers(query) {
        return this.tiktok.searchUsers(query);
    }
    raw(body) {
        return this.tiktok.raw(body);
    }
};
exports.TiktokController = TiktokController;
__decorate([
    (0, common_1.Get)('user/detail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.UserDetailQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "userDetail", null);
__decorate([
    (0, common_1.Get)('user/posts'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.UserPageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "userPosts", null);
__decorate([
    (0, common_1.Get)('user/followers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.UserPageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "userFollowers", null);
__decorate([
    (0, common_1.Get)('user/following'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.UserPageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "userFollowing", null);
__decorate([
    (0, common_1.Get)('user/liked'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.UserPageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "userLiked", null);
__decorate([
    (0, common_1.Get)('user/playlists'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.UserPageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "userPlaylists", null);
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.CountQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "trending", null);
__decorate([
    (0, common_1.Get)('video/:itemId'),
    __param(0, (0, common_1.Param)('itemId', numeric_id_pipe_1.NumericIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "video", null);
__decorate([
    (0, common_1.Get)('video/:itemId/related'),
    __param(0, (0, common_1.Param)('itemId', numeric_id_pipe_1.NumericIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "relatedVideos", null);
__decorate([
    (0, common_1.Get)('video/:itemId/comments'),
    __param(0, (0, common_1.Param)('itemId', numeric_id_pipe_1.NumericIdPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tiktok_dto_1.PageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "comments", null);
__decorate([
    (0, common_1.Get)('video/:itemId/comments/:commentId/replies'),
    __param(0, (0, common_1.Param)('itemId', numeric_id_pipe_1.NumericIdPipe)),
    __param(1, (0, common_1.Param)('commentId', numeric_id_pipe_1.NumericIdPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, tiktok_dto_1.PageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "commentReplies", null);
__decorate([
    (0, common_1.Get)('playlist/:mixId'),
    __param(0, (0, common_1.Param)('mixId', numeric_id_pipe_1.NumericIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "playlist", null);
__decorate([
    (0, common_1.Get)('playlist/:mixId/videos'),
    __param(0, (0, common_1.Param)('mixId', numeric_id_pipe_1.NumericIdPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tiktok_dto_1.PageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "playlistVideos", null);
__decorate([
    (0, common_1.Get)('music/:musicId'),
    __param(0, (0, common_1.Param)('musicId', numeric_id_pipe_1.NumericIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "music", null);
__decorate([
    (0, common_1.Get)('music/:musicId/videos'),
    __param(0, (0, common_1.Param)('musicId', numeric_id_pipe_1.NumericIdPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tiktok_dto_1.PageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "musicVideos", null);
__decorate([
    (0, common_1.Get)('challenge/:tag'),
    __param(0, (0, common_1.Param)('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "challenge", null);
__decorate([
    (0, common_1.Get)('challenge/:tag/videos'),
    __param(0, (0, common_1.Param)('tag')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tiktok_dto_1.PageQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "challengeVideos", null);
__decorate([
    (0, common_1.Get)('search/general'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "searchGeneral", null);
__decorate([
    (0, common_1.Get)('search/users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Post)('raw'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tiktok_dto_1.RawRequestDto]),
    __metadata("design:returntype", Promise)
], TiktokController.prototype, "raw", null);
exports.TiktokController = TiktokController = __decorate([
    (0, common_1.Controller)('tiktok'),
    (0, common_1.UseInterceptors)(upstream_headers_interceptor_1.UpstreamHeadersInterceptor),
    __metadata("design:paramtypes", [tiktok_service_1.TiktokService])
], TiktokController);
let InternalController = class InternalController {
    tiktok;
    session;
    rateLimiter;
    http;
    config;
    constructor(tiktok, session, rateLimiter, http, config) {
        this.tiktok = tiktok;
        this.session = session;
        this.rateLimiter = rateLimiter;
        this.http = http;
        this.config = config;
    }
    async health(req) {
        const probe = await this.tiktok.probe();
        const impersonator = this.http.impersonatorStatus;
        const chromeHandshake = impersonator.inUse === 'tls';
        return {
            status: probe.ok ? 'ok' : 'degraded',
            transport: {
                configured: this.config.tiktok.transport,
                inUse: impersonator.inUse,
                backend: impersonator.backend,
                chromeHandshake,
                clientIdentifier: chromeHandshake ? this.config.tiktok.tlsClientIdentifier : null,
                backends: impersonator.backends,
                note: chromeHandshake
                    ? `Chrome ClientHello via ${impersonator.backend}`
                    : 'undici, Node/OpenSSL ClientHello. Six API paths refuse this handshake; ' +
                        'see backends for why the Chrome-shaped options were rejected.',
            },
            session: this.describeSession(),
            upstream: probe.ok
                ? {
                    reachable: true,
                    logId: probe.detail?.logId,
                    elapsedMs: probe.detail?.elapsedMs,
                    signMs: probe.detail?.signature.ms,
                    ticketGuardResult: probe.detail?.ticketGuardResult,
                }
                : { reachable: false, error: probe.error },
            pacing: {
                minIntervalMs: this.config.tiktok.minRequestIntervalMs,
                maxConcurrent: this.config.tiktok.maxConcurrentRequests,
                inFlight: this.rateLimiter.inFlight,
                queued: this.rateLimiter.pending,
                retryOnThrottle: this.config.tiktok.retryOnThrottle,
                throttleBackoffBaseMs: this.config.tiktok.throttleBackoffBaseMs,
            },
            config: {
                origin: this.config.tiktok.origin,
                region: this.config.tiktok.region,
                proxy: Boolean(this.config.tiktok.proxyUrl),
                timeoutMs: this.config.tiktok.timeoutMs,
                maxRetries: this.config.tiktok.maxRetries,
            },
            requestId: req.id,
        };
    }
    async currentSession() {
        await this.session.get();
        return this.session.describe();
    }
    async sessionState() {
        const response = await this.tiktok.getSessionState();
        return response.data;
    }
    resetSession() {
        this.session.invalidate('operator requested');
        return { status: 'reset' };
    }
    describeSession() {
        try {
            return this.session.describe();
        }
        catch {
            return null;
        }
    }
};
exports.InternalController = InternalController;
__decorate([
    (0, common_1.Get)('health'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InternalController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InternalController.prototype, "currentSession", null);
__decorate([
    (0, common_1.Get)('session-state'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InternalController.prototype, "sessionState", null);
__decorate([
    (0, common_1.Post)('session/reset'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], InternalController.prototype, "resetSession", null);
exports.InternalController = InternalController = __decorate([
    (0, common_1.Controller)('internal'),
    __param(4, (0, common_1.Inject)(configuration_1.CONFIG)),
    __metadata("design:paramtypes", [tiktok_service_1.TiktokService,
        session_service_1.SessionService,
        rate_limiter_1.RateLimiter,
        http_client_1.HttpClient, Object])
], InternalController);
//# sourceMappingURL=tiktok.controller.js.map