/// <reference types="node" />
import { EthAddress } from 'mitz-auth';
import { AvailableContentResult, CompleteRequestOptions, ContentFileHash, DeploymentBase, Entity, EntityId, EntityType, Fetcher, HealthStatus, LegacyAuditInfo, Pointer, Profile, RequestOptions, ServerMetadata, ServerStatus, Timestamp } from 'mitz-catalyst';
import { Readable, Writable } from 'stream';
import { CatalystAPI } from './CatalystAPI';
import { DeploymentWithMetadataContentAndPointers } from './ContentAPI';
import { BuildEntityOptions, BuildEntityWithoutFilesOptions, DeploymentOptions } from './ContentClient';
import { OwnedWearables, ProfileOptions, WearablesFilters } from './LambdasAPI';
import { DeploymentBuilder, DeploymentData, DeploymentPreparationData } from './utils/DeploymentBuilder';
export declare type CatalystClientOptions = {
    catalystUrl: string;
    proofOfWorkEnabled?: boolean;
    fetcher?: Fetcher;
    deploymentBuilderClass?: typeof DeploymentBuilder;
};
export declare class CatalystClient implements CatalystAPI {
    private readonly contentClient;
    private readonly lambdasClient;
    private readonly catalystUrl;
    constructor(options: CatalystClientOptions);
    iterateThroughDeployments<T extends DeploymentBase = DeploymentWithMetadataContentAndPointers>(deploymentOptions?: DeploymentOptions<T>, options?: Partial<CompleteRequestOptions>): AsyncIterable<T>;
    buildEntity(options: BuildEntityOptions): Promise<DeploymentPreparationData>;
    buildEntityWithoutNewFiles(options: BuildEntityWithoutFilesOptions): Promise<DeploymentPreparationData>;
    deployEntity(deployData: DeploymentData, fix?: boolean, options?: RequestOptions): Promise<Timestamp>;
    fetchEntitiesByPointers(type: EntityType, pointers: Pointer[], options?: RequestOptions): Promise<Entity[]>;
    fetchEntitiesByIds(type: EntityType, ids: EntityId[], options?: RequestOptions): Promise<Entity[]>;
    fetchEntityById(type: EntityType, id: EntityId, options?: RequestOptions): Promise<Entity>;
    fetchAuditInfo(type: EntityType, id: EntityId, options?: RequestOptions): Promise<LegacyAuditInfo>;
    fetchContentStatus(options?: RequestOptions): Promise<ServerStatus>;
    fetchAllDeployments<T extends DeploymentBase = DeploymentWithMetadataContentAndPointers>(deploymentOptions: DeploymentOptions<T>, options?: RequestOptions): Promise<T[]>;
    streamAllDeployments<T extends DeploymentBase = DeploymentWithMetadataContentAndPointers>(deploymentOptions: DeploymentOptions<T>, options?: RequestOptions): Readable;
    isContentAvailable(cids: string[], options?: RequestOptions): Promise<AvailableContentResult>;
    downloadContent(contentHash: ContentFileHash, options?: RequestOptions): Promise<Buffer>;
    pipeContent(contentHash: ContentFileHash, writeTo: Writable, options?: RequestOptions): Promise<Map<string, string>>;
    fetchProfiles(ethAddresses: EthAddress[], profileOptions?: ProfileOptions, options?: RequestOptions): Promise<Profile[]>;
    fetchWearables(filters: WearablesFilters, options?: RequestOptions): Promise<any[]>;
    fetchOwnedWearables<B extends boolean>(ethAddress: EthAddress, includeDefinitions: B, options?: RequestOptions): Promise<OwnedWearables<B>>;
    fetchCatalystsApprovedByDAO(options?: RequestOptions): Promise<ServerMetadata[]>;
    fetchLambdasStatus(options?: RequestOptions): Promise<{
        contentServerUrl: string;
    }>;
    fetchPeerHealth(options?: RequestOptions): Promise<Record<string, HealthStatus>>;
    getCatalystUrl(): string;
    getContentUrl(): string;
    getLambdasUrl(): string;
    static connectedToCatalystIn(options: CatalystConnectOptions): Promise<CatalystClient>;
}
export declare type CatalystConnectOptions = {
    network: 'mainnet' | 'ropsten';
    proofOfWorkEnabled?: boolean;
};
