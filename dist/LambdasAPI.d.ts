import { EthAddress } from 'mitz-auth';
import { EntityMetadata, Profile, RequestOptions, ServerMetadata } from 'mitz-catalyst';
export interface LambdasAPI {
    fetchProfiles(ethAddresses: EthAddress[], profileOptions?: ProfileOptions, options?: RequestOptions): Promise<Profile[]>;
    fetchWearables(filters: WearablesFilters, options?: RequestOptions): Promise<EntityMetadata[]>;
    fetchOwnedWearables<B extends boolean>(ethAddress: EthAddress, includeDefinitions: B, options?: RequestOptions): Promise<OwnedWearables<B>>;
    fetchCatalystsApprovedByDAO(options?: RequestOptions): Promise<ServerMetadata[]>;
    fetchLambdasStatus(options?: RequestOptions): Promise<{
        contentServerUrl: string;
    }>;
    getLambdasUrl(): string;
}
export declare type ProfileOptions = {
    versions?: number[];
    fields?: ProfileFields;
};
export declare class ProfileFields {
    private readonly fields;
    static readonly ONLY_SNAPSHOTS: ProfileFields;
    private constructor();
    getFields(): string;
}
export declare type WearablesFilters = {
    collectionIds?: string[];
    wearableIds?: string[];
    textSearch?: string;
};
export declare type OwnedWearables<B extends boolean> = (B extends false ? OwnedWearablesWithoutDefinition : OwnedWearablesWithDefinition)[];
export declare type OwnedWearablesWithDefinition = OwnedWearablesWithoutDefinition & {
    definition: EntityMetadata;
};
export declare type OwnedWearablesWithoutDefinition = {
    urn: string;
    amount: number;
};
