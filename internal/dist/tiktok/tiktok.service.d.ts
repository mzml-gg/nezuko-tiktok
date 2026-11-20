import { type AppConfig } from '../config/configuration';
import { TiktokClient, TiktokResponse, QueryValue } from './tiktok.client';
export interface UserDetailInput {
    uniqueId?: string;
    secUid?: string;
}
export interface PaginatedInput {
    cursor?: string;
    count?: number;
}
export interface PostItemListInput extends PaginatedInput {
    secUid: string;
}
export interface CommentListInput extends PaginatedInput {
    awemeId: string;
}
export interface SearchInput {
    keyword: string;
    count?: number;
    offset?: string;
    searchId?: string;
}
export interface ChallengeItemListInput extends PaginatedInput {
    challengeId: string;
}
export interface MusicItemListInput extends PaginatedInput {
    musicId: string;
}
export interface CommentReplyListInput extends PaginatedInput {
    awemeId: string;
    commentId: string;
}
export interface MixItemListInput extends PaginatedInput {
    mixId: string;
}
export interface RawRequestInput {
    path: string;
    query?: Record<string, QueryValue>;
    referer?: string;
    method?: 'GET' | 'POST';
    body?: string;
    sign?: boolean;
    bare?: boolean;
    allowEmpty?: boolean;
}
export declare class TiktokService {
    private readonly config;
    private readonly client;
    constructor(config: AppConfig, client: TiktokClient);
    getUserDetail(input: UserDetailInput): Promise<TiktokResponse>;
    getPostItemList(input: PostItemListInput): Promise<TiktokResponse>;
    getMusicDetail(musicId: string): Promise<TiktokResponse>;
    getSessionState(): Promise<TiktokResponse>;
    getUserList(secUid: string, scene: 'followers' | 'following', count?: number, cursor?: string): Promise<TiktokResponse>;
    getItemDetail(itemId: string): Promise<TiktokResponse>;
    getRelatedItemList(itemId: string, count?: number): Promise<TiktokResponse>;
    getCommentList(input: CommentListInput): Promise<TiktokResponse>;
    getCommentReplyList(input: CommentReplyListInput): Promise<TiktokResponse>;
    getLikedItemList(input: PostItemListInput): Promise<TiktokResponse>;
    getUserPlaylists(input: PostItemListInput): Promise<TiktokResponse>;
    getMixDetail(mixId: string): Promise<TiktokResponse>;
    getMixItemList(input: MixItemListInput): Promise<TiktokResponse>;
    getRecommendItemList(count?: number): Promise<TiktokResponse>;
    getMusicItemList(input: MusicItemListInput): Promise<TiktokResponse>;
    getChallengeItemList(input: ChallengeItemListInput): Promise<TiktokResponse>;
    getChallengeDetail(challengeIdOrName: string): Promise<TiktokResponse>;
    private resolveChallengeId;
    searchGeneral(input: SearchInput): Promise<TiktokResponse>;
    searchUsers(input: SearchInput): Promise<TiktokResponse>;
    raw(input: RawRequestInput): Promise<TiktokResponse>;
    probe(): Promise<{
        ok: boolean;
        detail: TiktokResponse | undefined;
        error?: string;
    }>;
}
