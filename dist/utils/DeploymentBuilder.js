"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentBuilder = void 0;
const mitz_catalyst_1 = require("mitz-catalyst");
class DeploymentBuilder {
    /**
     * As part of the deployment process, an entity has to be built. In this method, we are building it, based on the data provided.
     * After the entity is built, the user will have to sign the entity id, to prove they are actually who they say they are.
     */
    static async buildEntity({ version, type, pointers, files, metadata, timestamp }) {
        // Reorder input
        const contentFiles = Array.from(files ?? []).map(([key, content]) => ({
            key,
            content
        }));
        // Calculate hashes
        const hashing = version === mitz_catalyst_1.EntityVersion.V3 ? mitz_catalyst_1.Hashing.calculateBufferHash : mitz_catalyst_1.Hashing.calculateIPFSHash;
        const allInfo = await Promise.all(contentFiles.map(async ({ key, content }) => ({ key, content, hash: await hashing(content) })));
        const hashesByKey = new Map(allInfo.map(({ hash, key }) => [key, hash]));
        const filesByHash = new Map(allInfo.map(({ hash, content }) => [hash, content]));
        return DeploymentBuilder.buildEntityInternal(version, type, pointers, {
            hashesByKey,
            filesByHash,
            metadata,
            timestamp
        });
    }
    /**
     * In cases where we don't need upload content files, we can simply generate the new entity. We can still use already uploaded hashes on this new entity.
     */
    static async buildEntityWithoutNewFiles({ version, type, pointers, hashesByKey, metadata, timestamp }) {
        return DeploymentBuilder.buildEntityInternal(version, type, pointers, { hashesByKey, metadata, timestamp });
    }
    static async buildEntityInternal(version, type, pointers, options) {
        // Make sure that there is at least one pointer
        if (pointers.length === 0) {
            throw new Error(`All entities must have at least one pointer.`);
        }
        // Re-organize the hashes
        const hashesByKey = options?.hashesByKey ?? new Map();
        const entityContent = Array.from(hashesByKey.entries()).map(([key, hash]) => ({
            file: key,
            hash
        }));
        // Calculate timestamp if necessary
        const timestamp = options?.timestamp ?? Date.now();
        // Build entity file
        const { entity, entityFile } = await (0, mitz_catalyst_1.buildEntityAndFile)({
            version,
            type,
            pointers,
            timestamp,
            content: entityContent,
            metadata: options?.metadata
        });
        // Add entity file to content files
        const filesByHash = options?.filesByHash ?? new Map();
        filesByHash.set(entity.id, entityFile);
        return { files: filesByHash, entityId: entity.id };
    }
}
exports.DeploymentBuilder = DeploymentBuilder;
//# sourceMappingURL=DeploymentBuilder.js.map