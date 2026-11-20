export declare const DYNOSAUR_PARAM = "X-Dynosaur";
export declare const MS_TOKEN_PARAM = "msToken";
export declare const BOGUS_PARAM = "X-Bogus";
export declare const GNARLY_PARAM = "X-Gnarly";
export declare const BOGUS_VALUE = "1";
export declare const DEFAULT_SDK_VERSION = "5.3.2";
export declare const DEFAULT_SCM_VERSION = "2.0.0.561";
export declare const ENCODER_A: readonly [103, 1, null, 2, 1];
export declare const ENCODER_B: readonly [102, 0, 165, 1, 0];
type Encoder = readonly [number, number, number | null, number, number];
export interface SignOptions {
    msToken?: string;
    body?: Buffer | string;
    userAgent: string;
    timestamp?: number;
    nonce?: number;
    nonce2?: number;
    sequence?: number;
    sdkVersion?: string;
    scmVersion?: string;
    page?: string;
    envCode?: number;
    ubCode?: number;
}
export interface SignedRequest {
    query: string;
    parameters: Record<string, string>;
}
export declare function encodeQuery(pairs: ReadonlyArray<readonly [string, string]>): string;
export declare function hashState(text: string): number;
export declare function encodeField(text: string, config: Encoder): Buffer;
export declare function packPayload(fields: ReadonlyMap<number, Buffer>, order?: readonly number[], leadCount?: boolean): Buffer;
export declare function mixState(timestamp: number, nonce: number, envCode?: number): number;
export declare function foldChecksum(values: ReadonlyArray<number | string>, mode: number): number;
export declare function seal(payload: Buffer, key: readonly number[]): string;
export interface VersionStrings {
    sdkVersion: string;
    scmVersion: string;
}
export declare function dynosaurPayload(query: string, userAgent: string, options: {
    timestamp: number;
    nonce: number;
    sequence?: number;
    versions?: VersionStrings;
    page?: string;
    envCode?: number;
    ubCode?: number;
}): Buffer;
export declare function gnarlyFields(signedQuery: string, userAgent: string, options: {
    body?: Buffer | string;
    timestamp: number;
    nonce: number;
    nonce2: number;
    sequence?: number;
    versions?: VersionStrings;
    envCode?: number;
    ubCode?: number;
}): Map<number, Buffer>;
export declare function gnarlyPayload(signedQuery: string, userAgent: string, options: Parameters<typeof gnarlyFields>[2] & {
    order?: readonly number[];
}): Buffer;
export declare function signRequest(pairs: ReadonlyArray<readonly [string, string]>, options: SignOptions): SignedRequest;
export declare function extractSignatureParameters(signedQuery: string): Record<string, string>;
export {};
