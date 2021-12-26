import { CrossFetchRequest, Fetcher } from 'mitz-catalyst';
export declare function obtainJWT(fetcher: Fetcher, catalystUrl: string): Promise<string | undefined>;
export declare function isJWTCookieRemoved(response: Response): boolean;
export declare function missingJWTInRequest(request: CrossFetchRequest): boolean;
export declare function configureJWTMiddlewares(fetcher: Fetcher, baseUrl: string): void;
