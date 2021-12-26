import { AuthChain } from 'mitz-auth';
import { ContentFileHash, EntityId, EntityMetadata, EntityType, EntityVersion, Pointer, Timestamp } from 'mitz-catalyst';
export declare class DeploymentBuilder {
    /**
     * As part of the deployment process, an entity has to be built. In this method, we are building it, based on the data provided.
     * After the entity is built, the user will have to sign the entity id, to prove they are actually who they say they are.
     */
    static buildEntity({ version, type, pointers, files, metadata, timestamp }: {
        version: EntityVersion;
        type: EntityType;
        pointers: Pointer[];
        files?: Map<string, Uint8Array>;
        metadata?: EntityMetadata;
        timestamp?: Timestamp;
    }): Promise<DeploymentPreparationData>;
    /**
     * In cases where we don't need upload content files, we can simply generate the new entity. We can still use already uploaded hashes on this new entity.
     */
    static buildEntityWithoutNewFiles({ version, type, pointers, hashesByKey, metadata, timestamp }: {
        version: EntityVersion;
        type: EntityType;
        pointers: Pointer[];
        hashesByKey?: Map<string, ContentFileHash>;
        metadata?: EntityMetadata;
        timestamp?: Timestamp;
    }): Promise<DeploymentPreparationData>;
    private static buildEntityInternal;
}
/** This data contains everything necessary for the user to sign, so that then a deployment can be executed */
export declare type DeploymentPreparationData = {
    entityId: EntityId;
    files: Map<ContentFileHash, Uint8Array>;
};
export declare type DeploymentData = DeploymentPreparationData & {
    authChain: AuthChain;
};
