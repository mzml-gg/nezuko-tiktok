import type { Request } from 'express';
import { TiktokService } from './tiktok.service';
import { TiktokResponse } from './tiktok.client';
import { SessionService } from '../session/session.service';
import { RateLimiter } from '../common/http/rate-limiter';
import { HttpClient } from '../common/http/http-client';
import { type AppConfig } from '../config/configuration';
import { CountQueryDto, PageQueryDto, RawRequestDto, SearchQueryDto, UserDetailQueryDto, UserPageQueryDto } from './dto/tiktok.dto';
export declare class TiktokController {
    private readonly tiktok;
    constructor(tiktok: TiktokService);
    userDetail(query: UserDetailQueryDto): Promise<TiktokResponse>;
    userPosts(query: UserPageQueryDto): Promise<TiktokResponse>;
    userFollowers({ secUid, count, cursor }: UserPageQueryDto): Promise<TiktokResponse>;
    userFollowing({ secUid, count, cursor }: UserPageQueryDto): Promise<TiktokResponse>;
    userLiked(query: UserPageQueryDto): Promise<TiktokResponse>;
    userPlaylists(query: UserPageQueryDto): Promise<TiktokResponse>;
    trending({ count }: CountQueryDto): Promise<TiktokResponse>;
    video(itemId: string): Promise<TiktokResponse>;
    relatedVideos(itemId: string): Promise<TiktokResponse>;
    comments(awemeId: string, { count, cursor }: PageQueryDto): Promise<TiktokResponse>;
    commentReplies(awemeId: string, commentId: string, { count, cursor }: PageQueryDto): Promise<TiktokResponse>;
    playlist(mixId: string): Promise<TiktokResponse>;
    playlistVideos(mixId: string, { count, cursor }: PageQueryDto): Promise<TiktokResponse>;
    music(musicId: string): Promise<TiktokResponse>;
    musicVideos(musicId: string, { count, cursor }: PageQueryDto): Promise<TiktokResponse>;
    challenge(tag: string): Promise<TiktokResponse>;
    challengeVideos(challengeId: string, { count, cursor }: PageQueryDto): Promise<TiktokResponse>;
    searchGeneral(query: SearchQueryDto): Promise<TiktokResponse>;
    searchUsers(query: SearchQueryDto): Promise<TiktokResponse>;
    raw(body: RawRequestDto): Promise<TiktokResponse>;
}
export declare class InternalController {
    private readonly tiktok;
    private readonly session;
    private readonly rateLimiter;
    private readonly http;
    private readonly config;
    constructor(tiktok: TiktokService, session: SessionService, rateLimiter: RateLimiter, http: HttpClient, config: AppConfig);
    health(req: Request & {
        id?: string;
    }): Promise<unknown>;
    currentSession(): Promise<unknown>;
    sessionState(): Promise<unknown>;
    resetSession(): {
        status: 'reset';
    };
    private describeSession;
}
