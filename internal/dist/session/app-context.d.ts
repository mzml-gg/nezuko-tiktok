export interface AppContext {
    aid?: number;
    region?: string;
    wid?: string;
    odinId?: string;
    nonce?: string;
    webIdCreatedTime?: string;
    csrfToken?: string;
    userAgent?: string;
    botType?: string;
    abTestVersions?: string;
    raw: Record<string, unknown>;
}
export declare function parseAppContext(html: string): AppContext | undefined;
