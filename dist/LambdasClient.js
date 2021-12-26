"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdasClient = void 0;
const mitz_catalyst_1 = require("mitz-catalyst");
const Jwt_1 = require("./ports/Jwt");
const Helper_1 = require("./utils/Helper");
class LambdasClient {
    constructor(options) {
        this.lambdasUrl = (0, Helper_1.sanitizeUrl)(options.lambdasUrl);
        this.fetcher =
            options.fetcher ??
                new mitz_catalyst_1.Fetcher({
                    headers: (0, Helper_1.getHeadersWithUserAgent)('lambdas-client')
                });
        if (options.proofOfWorkEnabled) {
            const powAuthBaseUrl = new URL(this.lambdasUrl).origin;
            (0, Jwt_1.configureJWTMiddlewares)(this.fetcher, powAuthBaseUrl);
        }
    }
    fetchProfiles(ethAddresses, profileOptions, options) {
        const queryParams = new Map();
        queryParams.set('id', ethAddresses);
        if (profileOptions?.fields) {
            const fieldsValue = profileOptions?.fields.getFields();
            queryParams.set('fields', [fieldsValue]);
        }
        if (profileOptions?.versions) {
            queryParams.set('version', profileOptions.versions.map(it => it.toString(10)));
        }
        return (0, Helper_1.splitAndFetch)({
            fetcher: this.fetcher,
            baseUrl: this.lambdasUrl,
            path: '/profiles',
            queryParams,
            options
        });
    }
    fetchWearables(filters, options) {
        const queryParams = (0, Helper_1.convertFiltersToQueryParams)(filters);
        if (queryParams.size === 0) {
            throw new Error('You must set at least one filter');
        }
        return (0, Helper_1.splitAndFetchPaginated)({
            fetcher: this.fetcher,
            baseUrl: this.lambdasUrl,
            path: '/collections/wearables',
            queryParams,
            uniqueBy: 'id',
            elementsProperty: 'wearables',
            options
        });
    }
    fetchOwnedWearables(ethAddress, includeDefinitions, options) {
        return (0, Helper_1.splitAndFetch)({
            fetcher: this.fetcher,
            baseUrl: this.lambdasUrl,
            path: `/collections/wearables-by-owner/${ethAddress}`,
            queryParams: { name: 'includeDefinitions', values: [`${includeDefinitions}`] },
            options
        });
    }
    fetchCatalystsApprovedByDAO(options) {
        return this.fetcher.fetchJson(`${this.lambdasUrl}/contracts/servers`, options);
    }
    fetchLambdasStatus(options) {
        return this.fetcher.fetchJson(`${this.lambdasUrl}/status`, options);
    }
    fetchPeerHealth(options) {
        return this.fetcher.fetchJson(`${this.lambdasUrl}/health`, options);
    }
    getLambdasUrl() {
        return this.lambdasUrl;
    }
}
exports.LambdasClient = LambdasClient;
//# sourceMappingURL=LambdasClient.js.map