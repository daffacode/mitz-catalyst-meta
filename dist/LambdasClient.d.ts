import { EthAddress } from 'mitz-auth';
import { EntityMetadata, Fetcher, HealthStatus, Profile, RequestOptions, ServerMetadata } from 'mitz-catalyst';
import { LambdasAPI, OwnedWearables, ProfileOptions, WearablesFilters } from './LambdasAPI';
export declare type LambdasClientOptions = {
    lambdasUrl: string;
    proofOfWorkEnabled?: boolean;
    fetcher?: Fetcher;
};
export declare class LambdasClient implements LambdasAPI {
    private readonly lambdasUrl;
    private readonly fetcher;
    constructor(options: LambdasClientOptions);
    fetchProfiles(ethAddresses: EthAddress[], profileOptions?: ProfileOptions, options?: RequestOptions): Promise<Profile[]>;
    fetchWearables(filters: WearablesFilters, options?: RequestOptions): Promise<EntityMetadata[]>;
    fetchOwnedWearables<B extends boolean>(ethAddress: EthAddress, includeDefinitions: B, options?: RequestOptions): Promise<OwnedWearables<B>>;
    fetchCatalystsApprovedByDAO(options?: RequestOptions): Promise<ServerMetadata[]>;
    fetchLambdasStatus(options?: RequestOptions): Promise<{
        contentServerUrl: string;
    }>;
    fetchPeerHealth(options?: RequestOptions): Promise<Record<string, HealthStatus>>;
    getLambdasUrl(): string;
}
