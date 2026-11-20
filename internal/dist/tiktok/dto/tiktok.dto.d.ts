export declare class CountQueryDto {
    count?: number;
}
export declare class PageQueryDto extends CountQueryDto {
    cursor?: string;
}
export declare class UserDetailQueryDto {
    uniqueId?: string;
    secUid?: string;
}
export declare class UserPageQueryDto extends PageQueryDto {
    secUid: string;
}
export declare class SearchQueryDto extends CountQueryDto {
    keyword: string;
    offset?: string;
    searchId?: string;
}
export declare class RawRequestDto {
    path: string;
    query?: Record<string, string | number | boolean>;
    referer?: string;
    method?: 'GET' | 'POST';
    body?: string;
    sign?: boolean;
    bare?: boolean;
    allowEmpty?: boolean;
}
