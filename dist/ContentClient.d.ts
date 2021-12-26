/// <reference types="node" />
import FormData from 'form-data';
import { AvailableContentResult, ContentFileHash, Deployment, DeploymentBase, DeploymentFilters, DeploymentSorting, DeploymentWithAuditInfo, Entity, EntityId, EntityMetadata, EntityType, Fetcher, LegacyAuditInfo, Pointer, RequestOptions, ServerStatus, Timestamp } from 'mitz-catalyst';
import { Readable } from 'stream';
import { ContentAPI, DeploymentWithMetadataContentAndPointers } from './ContentAPI';
import { DeploymentBuilder, DeploymentData, DeploymentPreparationData } from './utils/DeploymentBuilder';
export declare type ContentClientOptions = {
    contentUrl: string;
    proofOfWorkEnabled?: boolean;
    fetcher?: Fetcher;
    deploymentBuilderClass?: typeof DeploymentBuilder;
};
export declare class ContentClient implements ContentAPI {
    private readonly contentUrl;
    private readonly fetcher;
    private readonly deploymentBuilderClass;
    constructor(options: ContentClientOptions);
    buildEntityWithoutNewFiles({ type, pointers, hashesByKey, metadata, timestamp }: BuildEntityWithoutFilesOptions): Promise<DeploymentPreparationData>;
    buildEntity({ type, pointers, files, metadata, timestamp }: BuildEntityOptions): Promise<DeploymentPreparationData>;
    buildEntityFormDataForDeployment(deployData: DeploymentData, options?: RequestOptions): Promise<FormData>;
    deployEntity(deployData: DeploymentData, fix?: boolean, options?: RequestOptions): Promise<Timestamp>;
    fetchEntitiesByPointers(type: EntityType, pointers: Pointer[], options?: RequestOptions): Promise<Entity[]>;
    fetchEntitiesByIds(type: EntityType, ids: EntityId[], options?: RequestOptions): Promise<Entity[]>;
    fetchEntityById(type: EntityType, id: EntityId, options?: RequestOptions): Promise<Entity>;
    fetchAuditInfo(type: EntityType, id: EntityId, options?: RequestOptions): Promise<LegacyAuditInfo>;
    fetchContentStatus(options?: RequestOptions): Promise<ServerStatus>;
    downloadContent(contentHash: ContentFileHash, options?: Partial<RequestOptions>): Promise<Buffer>;
    pipeContent(contentHash: ContentFileHash, writeTo: any, options?: Partial<RequestOptions>): Promise<Map<string, string>>;
    private KNOWN_HEADERS;
    private fixHeaderNameCase;
    private onlyKnownHeaders;
    /**
     * This method fetches all deployments that match the given filters.
     *  It is important to mention, that if there are too many filters, then the URL might get too long.
     *  In that case, we will internally make the necessary requests,
     *  but then the order of the deployments is not guaranteed.
     */
    fetchAllDeployments<T extends DeploymentBase = DeploymentWithMetadataContentAndPointers>(deploymentOptions: DeploymentOptions<T>, options?: RequestOptions): Promise<T[]>;
    /**
     * @deprecated use iterateThroughDeployments instead
     */
    streamAllDeployments<T extends DeploymentBase = DeploymentWithMetadataContentAndPointers>(deploymentOptions: DeploymentOptions<T>, options?: RequestOptions): Readable;
    iterateThroughDeployments<T extends DeploymentBase = DeploymentWithMetadataContentAndPointers>(deploymentOptions?: DeploymentOptions<T>, options?: RequestOptions): AsyncIterable<T>;
    iterateThroughDeploymentsBasedOnResult<T extends DeploymentBase = DeploymentWithMetadataContentAndPointers>(queryParams: Map<string, string[]>, reservedParams: Map<string, number>, errorListener?: (errorMessage: string) => void, options?: RequestOptions): AsyncIterable<T>;
    private assertFiltersAreSet;
    private sortingToQueryParams;
    isContentAvailable(cids: string[], options?: RequestOptions): Promise<AvailableContentResult>;
    getContentUrl(): string;
    /** Given an array of file hashes, return a set with those already uploaded on the server */
    private hashesAlreadyOnServer;
    private fetchJson;
}
export declare type DeploymentOptions<T> = {
    filters: DeploymentFilters;
    sortBy?: DeploymentSorting;
    fields?: DeploymentFields<T>;
    /**
     * @deprecated please use try-catch and iterators instead
     */
    errorListener?: (errorMessage: string) => void;
    /**
     * Amount of elements per page
     */
    limit?: number;
};
export interface BuildEntityOptions {
    type: EntityType;
    pointers: Pointer[];
    files?: Map<string, Uint8Array>;
    metadata?: EntityMetadata;
    timestamp?: Timestamp;
}
export interface BuildEntityWithoutFilesOptions {
    type: EntityType;
    pointers: Pointer[];
    hashesByKey?: Map<string, ContentFileHash>;
    metadata?: EntityMetadata;
    timestamp?: Timestamp;
}
export declare class DeploymentFields<T extends Partial<Deployment>> {
    private readonly fields;
    static readonly AUDIT_INFO: DeploymentFields<DeploymentWithAuditInfo>;
    static readonly POINTERS_CONTENT_METADATA_AND_AUDIT_INFO: DeploymentFields<Deployment>;
    static readonly POINTERS_CONTENT_AND_METADATA: DeploymentFields<DeploymentWithMetadataContentAndPointers>;
    private constructor();
    getFields(): string;
    isFieldIncluded(name: string): boolean;
}
