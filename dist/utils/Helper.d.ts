import FormData from 'form-data';
import { Fetcher, RequestOptions } from 'mitz-catalyst';
export declare function addModelToFormData(model: any, form: FormData, namespace?: string): FormData;
/**
 * This method performs one or more fetches to the given server, splitting query params into different queries to avoid exceeding the max length of urls
 */
export declare const MAX_URL_LENGTH: number;
export declare function splitAndFetch<E>({ baseUrl, path, queryParams, fetcher, uniqueBy, options }: Omit<SplitAndFetchParams<E>, 'elementsProperty'>): Promise<E[]>;
/**
 * This method performs one or more fetches to the given server, splitting query params into different queries to avoid exceeding the max length of urls
 * This method should be used if the result is paginated, and needs to be queries many times
 */
export declare function splitAndFetchPaginated<E>({ fetcher, baseUrl, path, queryParams, elementsProperty, uniqueBy, options }: RequiredOne<SplitAndFetchParams<E>, 'uniqueBy'>): Promise<E[]>;
export declare function splitValuesIntoManyQueryBuilders({ queryParams, baseUrl, path, reservedParams }: SplitIntoQueriesParams): QueryBuilder[];
export declare function splitValuesIntoManyQueries(parameters: SplitIntoQueriesParams): string[];
export declare function convertFiltersToQueryParams(filters?: Record<string, any>): Map<string, string[]>;
export declare function isNode(): boolean;
export declare function getHeadersWithUserAgent(client: string): {
    'User-Agent': string;
} | undefined;
/** Remove white spaces and add https if no protocol is specified */
export declare function sanitizeUrl(url: string): string;
declare type RequiredOne<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
declare type QueryParams = {
    name: string;
    values: string[];
} | Map<string, string[]>;
declare type SplitIntoQueriesParams = {
    baseUrl: string;
    path: string;
    queryParams: QueryParams;
    reservedParams?: Map<string, number>;
};
declare type SplitAndFetchParams<E> = {
    baseUrl: string;
    path: string;
    queryParams: QueryParams;
    elementsProperty: string;
    fetcher?: Fetcher;
    uniqueBy?: keyof E;
    options?: RequestOptions;
};
export declare class QueryBuilder {
    private readonly baseUrl;
    private readonly queryParams;
    private readonly reservedParams;
    private length;
    constructor(baseUrl: string, queryParams?: Map<string, string[]>, reservedParams?: Map<string, number>);
    canAddParam(paramName: string, paramValue: string): boolean;
    addParam(paramName: string, paramValue: string): this;
    canSetParams(paramName: string, paramValues: any[]): boolean;
    /** This action will override whatever configuration there was previously for the given query parameter */
    setParams(paramName: string, paramValues: (string | number)[]): this;
    /** This action will override whatever configuration there was previously for the given query parameter */
    setParam(paramName: string, paramValue: string | number): this;
    toString(): string;
    private calculateUrlLength;
    static clone(queryBuilder: QueryBuilder): QueryBuilder;
    private calculateAddedLength;
    private calculateArrayLength;
}
export {};
