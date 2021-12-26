"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentFields = exports.ContentClient = void 0;
const form_data_1 = __importDefault(require("form-data"));
const mitz_catalyst_1 = require("mitz-catalyst");
const stream_1 = require("stream");
const Jwt_1 = require("./ports/Jwt");
const DeploymentBuilder_1 = require("./utils/DeploymentBuilder");
const Helper_1 = require("./utils/Helper");
class ContentClient {
    constructor(options) {
        this.KNOWN_HEADERS = [
            'Content-Type',
            'Access-Control-Allow-Origin',
            'Access-Control-Expose-Headers',
            'ETag',
            'Date',
            'Content-Length',
            'Cache-Control'
        ];
        this.contentUrl = (0, Helper_1.sanitizeUrl)(options.contentUrl);
        this.fetcher =
            options.fetcher ??
                new mitz_catalyst_1.Fetcher({
                    headers: (0, Helper_1.getHeadersWithUserAgent)('content-client')
                });
        this.deploymentBuilderClass = options.deploymentBuilderClass ?? DeploymentBuilder_1.DeploymentBuilder;
        if (options.proofOfWorkEnabled) {
            const powAuthBaseUrl = new URL(this.contentUrl).origin;
            (0, Jwt_1.configureJWTMiddlewares)(this.fetcher, powAuthBaseUrl);
        }
    }
    async buildEntityWithoutNewFiles({ type, pointers, hashesByKey, metadata, timestamp }) {
        const result = timestamp ?? Date.now();
        return this.deploymentBuilderClass.buildEntityWithoutNewFiles({
            version: mitz_catalyst_1.EntityVersion.V3,
            type,
            pointers,
            hashesByKey,
            metadata,
            timestamp: result
        });
    }
    async buildEntity({ type, pointers, files, metadata, timestamp }) {
        const result = timestamp ?? Date.now();
        return this.deploymentBuilderClass.buildEntity({
            version: mitz_catalyst_1.EntityVersion.V3,
            type,
            pointers,
            files,
            metadata,
            timestamp: result
        });
    }
    async buildEntityFormDataForDeployment(deployData, options) {
        // Check if we are running in node or browser
        const areWeRunningInNode = (0, Helper_1.isNode)();
        const form = new form_data_1.default();
        form.append('entityId', deployData.entityId);
        (0, Helper_1.addModelToFormData)(deployData.authChain, form, 'authChain');
        const alreadyUploadedHashes = await this.hashesAlreadyOnServer(Array.from(deployData.files.keys()), options);
        for (const [fileHash, file] of deployData.files) {
            if (!alreadyUploadedHashes.has(fileHash) || fileHash === deployData.entityId) {
                if (areWeRunningInNode) {
                    // Node
                    form.append(fileHash, Buffer.isBuffer(file) ? file : Buffer.from(arrayBufferFrom(file)), fileHash);
                }
                else {
                    // Browser
                    form.append(fileHash, new Blob([arrayBufferFrom(file)]), fileHash);
                }
            }
        }
        return form;
    }
    async deployEntity(deployData, fix = false, options) {
        const form = await this.buildEntityFormDataForDeployment(deployData, options);
        const requestOptions = (0, mitz_catalyst_1.mergeRequestOptions)(options ?? {}, {
            body: form
        });
        const { creationTimestamp } = (await this.fetcher.postForm(`${this.contentUrl}/entities${fix ? '?fix=true' : ''}`, requestOptions));
        return creationTimestamp;
    }
    fetchEntitiesByPointers(type, pointers, options) {
        if (pointers.length === 0) {
            return Promise.reject(`You must set at least one pointer.`);
        }
        return (0, Helper_1.splitAndFetch)({
            fetcher: this.fetcher,
            baseUrl: this.contentUrl,
            path: `/entities/${type}`,
            queryParams: { name: 'pointer', values: pointers },
            uniqueBy: 'id',
            options
        });
    }
    fetchEntitiesByIds(type, ids, options) {
        if (ids.length === 0) {
            return Promise.reject(`You must set at least one id.`);
        }
        return (0, Helper_1.splitAndFetch)({
            fetcher: this.fetcher,
            baseUrl: this.contentUrl,
            path: `/entities/${type}`,
            queryParams: { name: 'id', values: ids },
            uniqueBy: 'id',
            options
        });
    }
    async fetchEntityById(type, id, options) {
        const entities = await this.fetchEntitiesByIds(type, [id], options);
        if (entities.length === 0) {
            return Promise.reject(`Failed to find an entity with type '${type}' and id '${id}'.`);
        }
        return entities[0];
    }
    fetchAuditInfo(type, id, options) {
        return this.fetchJson(`/audit/${type}/${id}`, options);
    }
    fetchContentStatus(options) {
        return this.fetchJson('/status', options);
    }
    async downloadContent(contentHash, options) {
        const { attempts = 3, waitTime = '0.5s' } = options ?? {};
        const timeout = options?.timeout ? { timeout: options.timeout } : {};
        return (0, mitz_catalyst_1.retry)(async () => {
            const content = await this.fetcher.fetchBuffer(`${this.contentUrl}/contents/${contentHash}`, timeout);
            const downloadedHash = contentHash.startsWith('Qm')
                ? await mitz_catalyst_1.Hashing.calculateBufferHash(content)
                : await mitz_catalyst_1.Hashing.calculateIPFSHash(content);
            // Sometimes, the downloaded file is not complete, so the hash turns out to be different.
            // So we will check the hash before considering the download successful.
            if (downloadedHash === contentHash) {
                return content;
            }
            throw new Error(`Failed to fetch file with hash ${contentHash} from ${this.contentUrl}`);
        }, attempts, waitTime);
    }
    async pipeContent(contentHash, writeTo, options) {
        return this.onlyKnownHeaders(await this.fetcher.fetchPipe(`${this.contentUrl}/contents/${contentHash}`, writeTo, options));
    }
    fixHeaderNameCase(headerName) {
        return this.KNOWN_HEADERS.find((item) => item.toLowerCase() === headerName.toLowerCase());
    }
    onlyKnownHeaders(headersFromResponse) {
        const headers = new Map();
        headersFromResponse?.forEach((headerValue, headerName) => {
            const fixedHeader = this.fixHeaderNameCase(headerName);
            if (fixedHeader) {
                headers.set(fixedHeader, headerValue);
            }
        });
        return headers;
    }
    /**
     * This method fetches all deployments that match the given filters.
     *  It is important to mention, that if there are too many filters, then the URL might get too long.
     *  In that case, we will internally make the necessary requests,
     *  but then the order of the deployments is not guaranteed.
     */
    async fetchAllDeployments(deploymentOptions, options) {
        const ret = [];
        for await (const it of this.iterateThroughDeployments(deploymentOptions, options)) {
            ret.push(it);
        }
        return ret;
    }
    /**
     * @deprecated use iterateThroughDeployments instead
     */
    streamAllDeployments(deploymentOptions, options) {
        return stream_1.Readable.from(this.iterateThroughDeployments(deploymentOptions, options));
    }
    iterateThroughDeployments(deploymentOptions, options) {
        // We are setting different defaults in this case, because if one of the request fails, then all fail
        const withSomeDefaults = (0, mitz_catalyst_1.applySomeDefaults)({ attempts: 3, waitTime: '1s' }, options);
        // Validate that some params were used, so that not everything is fetched
        this.assertFiltersAreSet(deploymentOptions?.filters);
        // Transform filters object into query params map
        const filterQueryParams = (0, Helper_1.convertFiltersToQueryParams)(deploymentOptions?.filters);
        // Transform sorting object into query params map
        const sortingQueryParams = this.sortingToQueryParams(deploymentOptions?.sortBy);
        // Initialize query params with filters and sorting
        const queryParams = new Map([...filterQueryParams, ...sortingQueryParams]);
        if (deploymentOptions?.fields) {
            const fieldsValue = deploymentOptions?.fields.getFields();
            queryParams.set('fields', [fieldsValue]);
        }
        if (deploymentOptions?.limit) {
            queryParams.set('limit', [deploymentOptions?.limit.toFixed()]);
        }
        // Reserve space in the url for possible pagination
        const reservedParams = new Map([
            ['from', 13],
            ['to', 13]
        ]);
        return this.iterateThroughDeploymentsBasedOnResult(queryParams, reservedParams, deploymentOptions?.errorListener, withSomeDefaults);
    }
    async *iterateThroughDeploymentsBasedOnResult(queryParams, reservedParams, errorListener, options = {}) {
        // Split values into different queries
        const queries = (0, Helper_1.splitValuesIntoManyQueries)({
            baseUrl: this.contentUrl,
            path: '/deployments',
            queryParams,
            reservedParams
        });
        // Perform the different queries
        const foundIds = new Set();
        let exit = false;
        for (let i = 0; i < queries.length && !exit; i++) {
            let url = queries[i];
            while (url && !exit) {
                try {
                    const res = await this.fetcher.fetch(url, options);
                    if (!res.ok) {
                        throw new Error('Error while requesting deployments to the url ' +
                            url +
                            '. Status code was: ' +
                            res.status +
                            ' Response text was: ' +
                            JSON.stringify(await res.text()));
                    }
                    const partialHistory = await res.json();
                    for (const deployment of partialHistory.deployments) {
                        if (!foundIds.has(deployment.entityId)) {
                            foundIds.add(deployment.entityId);
                            yield deployment;
                        }
                    }
                    const nextRelative = partialHistory.pagination.next;
                    url = nextRelative ? new URL(nextRelative, url).toString() : undefined;
                }
                catch (error) {
                    if (errorListener) {
                        errorListener(`${error}`);
                        exit = true;
                    }
                    else {
                        throw error;
                    }
                }
            }
        }
    }
    assertFiltersAreSet(filters) {
        const filtersAreSet = filters?.from ||
            filters?.to ||
            (filters?.deployedBy && filters?.deployedBy.length > 0) ||
            (filters?.entityTypes && filters?.entityTypes.length > 0) ||
            (filters?.entityIds && filters?.entityIds.length > 0) ||
            (filters?.pointers && filters?.pointers.length > 0);
        if (!filtersAreSet) {
            throw new Error(`When fetching deployments, you must set at least one filter that isn't 'onlyCurrentlyPointed'`);
        }
    }
    sortingToQueryParams(sort) {
        const sortQueryParams = new Map();
        if (sort?.field) {
            sortQueryParams.set('sortingField', [sort.field]);
        }
        if (sort?.order) {
            sortQueryParams.set('sortingOrder', [sort.order]);
        }
        return sortQueryParams;
    }
    isContentAvailable(cids, options) {
        if (cids.length === 0) {
            return Promise.reject(`You must set at least one cid.`);
        }
        return (0, Helper_1.splitAndFetch)({
            fetcher: this.fetcher,
            baseUrl: this.contentUrl,
            path: `/available-content`,
            queryParams: { name: 'cid', values: cids },
            uniqueBy: 'cid',
            options
        });
    }
    getContentUrl() {
        return this.contentUrl;
    }
    /** Given an array of file hashes, return a set with those already uploaded on the server */
    async hashesAlreadyOnServer(hashes, options) {
        const result = await this.isContentAvailable(hashes, options);
        const alreadyUploaded = result.filter(($) => $.available).map(({ cid }) => cid);
        return new Set(alreadyUploaded);
    }
    fetchJson(path, options) {
        return this.fetcher.fetchJson(`${this.contentUrl}${path}`, options);
    }
}
exports.ContentClient = ContentClient;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
class DeploymentFields {
    constructor(fields) {
        this.fields = fields;
    }
    getFields() {
        return this.fields.join(',');
    }
    isFieldIncluded(name) {
        return this.fields.includes(name);
    }
}
exports.DeploymentFields = DeploymentFields;
DeploymentFields.AUDIT_INFO = new DeploymentFields(['auditInfo']);
DeploymentFields.POINTERS_CONTENT_METADATA_AND_AUDIT_INFO = new DeploymentFields([
    'pointers',
    'content',
    'metadata',
    'auditInfo'
]);
DeploymentFields.POINTERS_CONTENT_AND_METADATA = new DeploymentFields([
    'pointers',
    'content',
    'metadata'
]);
function arrayBufferFrom(value) {
    if (value.buffer) {
        return value.buffer;
    }
    return value;
}
//# sourceMappingURL=ContentClient.js.map