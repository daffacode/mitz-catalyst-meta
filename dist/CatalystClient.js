"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalystClient = void 0;
const mitz_catalyst_1 = require("mitz-catalyst");
const ContentClient_1 = require("./ContentClient");
const LambdasClient_1 = require("./LambdasClient");
const CatalystClientBuilder_1 = require("./utils/CatalystClientBuilder");
const Helper_1 = require("./utils/Helper");
class CatalystClient {
    constructor(options) {
        this.catalystUrl = (0, Helper_1.sanitizeUrl)(options.catalystUrl);
        const fetcher = options.fetcher ??
            new mitz_catalyst_1.Fetcher({
                headers: (0, Helper_1.getHeadersWithUserAgent)('catalyst-client')
            });
        this.contentClient = new ContentClient_1.ContentClient({
            contentUrl: this.catalystUrl + '/content',
            proofOfWorkEnabled: options.proofOfWorkEnabled,
            fetcher: fetcher,
            deploymentBuilderClass: options.deploymentBuilderClass
        });
        this.lambdasClient = new LambdasClient_1.LambdasClient({
            lambdasUrl: this.catalystUrl + '/lambdas',
            fetcher: fetcher,
            proofOfWorkEnabled: options.proofOfWorkEnabled
        });
    }
    iterateThroughDeployments(deploymentOptions, options) {
        return this.contentClient.iterateThroughDeployments(deploymentOptions, options);
    }
    buildEntity(options) {
        return this.contentClient.buildEntity(options);
    }
    buildEntityWithoutNewFiles(options) {
        return this.contentClient.buildEntityWithoutNewFiles(options);
    }
    deployEntity(deployData, fix = false, options) {
        return this.contentClient.deployEntity(deployData, fix, options);
    }
    fetchEntitiesByPointers(type, pointers, options) {
        return this.contentClient.fetchEntitiesByPointers(type, pointers, options);
    }
    fetchEntitiesByIds(type, ids, options) {
        return this.contentClient.fetchEntitiesByIds(type, ids, options);
    }
    fetchEntityById(type, id, options) {
        return this.contentClient.fetchEntityById(type, id, options);
    }
    fetchAuditInfo(type, id, options) {
        return this.contentClient.fetchAuditInfo(type, id, options);
    }
    fetchContentStatus(options) {
        return this.contentClient.fetchContentStatus(options);
    }
    fetchAllDeployments(deploymentOptions, options) {
        return this.contentClient.fetchAllDeployments(deploymentOptions, options);
    }
    streamAllDeployments(deploymentOptions, options) {
        return this.contentClient.streamAllDeployments(deploymentOptions, options);
    }
    isContentAvailable(cids, options) {
        return this.contentClient.isContentAvailable(cids, options);
    }
    downloadContent(contentHash, options) {
        return this.contentClient.downloadContent(contentHash, options);
    }
    pipeContent(contentHash, writeTo, options) {
        return this.contentClient.pipeContent(contentHash, writeTo, options);
    }
    fetchProfiles(ethAddresses, profileOptions, options) {
        return this.lambdasClient.fetchProfiles(ethAddresses, profileOptions, options);
    }
    fetchWearables(filters, options) {
        return this.lambdasClient.fetchWearables(filters, options);
    }
    fetchOwnedWearables(ethAddress, includeDefinitions, options) {
        return this.lambdasClient.fetchOwnedWearables(ethAddress, includeDefinitions, options);
    }
    fetchCatalystsApprovedByDAO(options) {
        return this.lambdasClient.fetchCatalystsApprovedByDAO(options);
    }
    fetchLambdasStatus(options) {
        return this.lambdasClient.fetchLambdasStatus(options);
    }
    fetchPeerHealth(options) {
        return this.lambdasClient.fetchPeerHealth(options);
    }
    getCatalystUrl() {
        return this.catalystUrl;
    }
    getContentUrl() {
        return this.contentClient.getContentUrl();
    }
    getLambdasUrl() {
        return this.lambdasClient.getLambdasUrl();
    }
    static connectedToCatalystIn(options) {
        return (0, CatalystClientBuilder_1.clientConnectedToCatalystIn)(options);
    }
}
exports.CatalystClient = CatalystClient;
//# sourceMappingURL=CatalystClient.js.map