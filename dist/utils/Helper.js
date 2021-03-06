"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = exports.sanitizeUrl = exports.getHeadersWithUserAgent = exports.isNode = exports.convertFiltersToQueryParams = exports.splitValuesIntoManyQueries = exports.splitValuesIntoManyQueryBuilders = exports.splitAndFetchPaginated = exports.splitAndFetch = exports.MAX_URL_LENGTH = exports.addModelToFormData = void 0;
const mitz_catalyst_1 = require("mitz-catalyst");
const Environment_1 = require("./Environment");
function addModelToFormData(model, form, namespace = '') {
    for (const propertyName in model) {
        if (!model.hasOwnProperty(propertyName) || model[propertyName] === null || model[propertyName] === undefined)
            continue;
        const formKey = namespace ? `${namespace}[${propertyName}]` : propertyName;
        if (model[propertyName] instanceof Date) {
            form.append(formKey, model[propertyName].toISOString());
        }
        else if (model[propertyName] instanceof Array) {
            model[propertyName].forEach((element, index) => {
                const tempFormKey = `${formKey}[${index}]`;
                addModelToFormData(element, form, tempFormKey);
            });
        }
        else if (typeof model[propertyName] === 'object') {
            addModelToFormData(model[propertyName], form, formKey);
        }
        else {
            form.append(formKey, model[propertyName].toString());
        }
    }
    return form;
}
exports.addModelToFormData = addModelToFormData;
function removeDuplicates(array) {
    return Array.from(new Set(array));
}
/**
 * This method performs one or more fetches to the given server, splitting query params into different queries to avoid exceeding the max length of urls
 */
exports.MAX_URL_LENGTH = 2048;
async function splitAndFetch({ baseUrl, path, queryParams, fetcher, uniqueBy, options }) {
    // Adding default
    fetcher = fetcher ?? new mitz_catalyst_1.Fetcher();
    // Split values into different queries
    const queries = splitValuesIntoManyQueries({ baseUrl, path, queryParams });
    const results = new Map();
    for (const query of queries) {
        // Perform the different queries
        const elements = (await fetcher.fetchJson(query, options));
        // Group by unique property (if set), or add all of them to the map
        elements.forEach((element) => results.set(uniqueBy ? element[uniqueBy] : results.size, element));
    }
    // Return results
    return Array.from(results.values());
}
exports.splitAndFetch = splitAndFetch;
const CHARS_LEFT_FOR_OFFSET = 7;
/**
 * This method performs one or more fetches to the given server, splitting query params into different queries to avoid exceeding the max length of urls
 * This method should be used if the result is paginated, and needs to be queries many times
 */
async function splitAndFetchPaginated({ fetcher, baseUrl, path, queryParams, elementsProperty, uniqueBy, options }) {
    // Set default
    fetcher = fetcher ?? new mitz_catalyst_1.Fetcher();
    // Reserve a few chars to send the offset
    const reservedParams = new Map([['offset', CHARS_LEFT_FOR_OFFSET]]);
    // Split values into different queries
    const queries = splitValuesIntoManyQueries({ baseUrl, path, queryParams, reservedParams });
    // Perform the different queries
    const foundElements = new Map();
    let exit = false;
    for (let i = 0; i < queries.length && !exit; i++) {
        let url = queries[i];
        while (url && !exit) {
            try {
                const response = (await fetcher.fetchJson(url, options));
                const elements = response[elementsProperty];
                elements.forEach((element) => foundElements.set(element[uniqueBy], element));
                const nextRelative = response.pagination.next;
                url = nextRelative ? new URL(nextRelative, url).toString() : undefined;
            }
            catch (error) {
                exit = true;
            }
        }
    }
    return Array.from(foundElements.values());
}
exports.splitAndFetchPaginated = splitAndFetchPaginated;
function splitValuesIntoManyQueryBuilders({ queryParams, baseUrl, path, reservedParams }) {
    const queryParamsMap = 'name' in queryParams ? new Map([[queryParams.name, queryParams.values]]) : queryParams;
    // Check that it makes sent to apply the algorithm
    if (queryParamsMap.size === 0) {
        return [new QueryBuilder(baseUrl + path, queryParamsMap, reservedParams)];
    }
    // Remove duplicates
    const withoutDuplicates = Array.from(queryParamsMap.entries()).map(([name, values]) => [
        name,
        removeDuplicates(values)
    ]);
    // Sort params by amount of values
    const sortedByValues = withoutDuplicates.sort(([_, values1], [__, values2]) => values1.length - values2.length);
    // Add all params (except the last one that is the one with the most values) into the url
    const defaultQueryBuilder = new QueryBuilder(baseUrl + path, new Map(), reservedParams);
    for (let i = 0; i < sortedByValues.length - 1; i++) {
        const [paramName, paramValues] = sortedByValues[i];
        if (!defaultQueryBuilder.canSetParams(paramName, paramValues)) {
            throw new Error(`This library can split one query param into many HTTP requests, but it can't split more than one. You will need to do that on the client side.`);
        }
        defaultQueryBuilder.setParams(paramName, paramValues);
    }
    // Prepare everything
    let queryBuilder = QueryBuilder.clone(defaultQueryBuilder);
    const [lastParamName, lastParamValues] = sortedByValues[sortedByValues.length - 1];
    const result = [];
    for (const value of lastParamValues) {
        // Check url length
        if (!queryBuilder.canAddParam(lastParamName, value)) {
            result.push(queryBuilder);
            queryBuilder = QueryBuilder.clone(defaultQueryBuilder);
        }
        queryBuilder.addParam(lastParamName, value);
    }
    // Add current builder one last time
    result.push(queryBuilder);
    return result;
}
exports.splitValuesIntoManyQueryBuilders = splitValuesIntoManyQueryBuilders;
function splitValuesIntoManyQueries(parameters) {
    const builders = splitValuesIntoManyQueryBuilders(parameters);
    return builders.map((builder) => builder.toString());
}
exports.splitValuesIntoManyQueries = splitValuesIntoManyQueries;
function convertFiltersToQueryParams(filters) {
    if (!filters) {
        return new Map();
    }
    const entries = Object.entries(filters)
        .filter(([_, value]) => !!value)
        .map(([name, value]) => {
        const newName = name.endsWith('s') ? name.slice(0, -1) : name;
        let newValues;
        // Force coersion of number, boolean, or string into string
        if (Array.isArray(value)) {
            newValues = [...value].filter(isValidQueryParamValue).map((_) => `${_}`);
        }
        else if (isValidQueryParamValue(value)) {
            newValues = [`${value}`];
        }
        else {
            throw new Error('Query params must be either a string, a number, a boolean or an array of the types just mentioned');
        }
        return [newName, newValues];
    })
        .filter(([_, values]) => values.length > 0);
    return new Map(entries);
}
exports.convertFiltersToQueryParams = convertFiltersToQueryParams;
function isNode() {
    return Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
}
exports.isNode = isNode;
function getHeadersWithUserAgent(client) {
    return isNode()
        ? { 'User-Agent': `${client}/${Environment_1.RUNNING_VERSION} (+https://github.com/decentraland/catalyst-client)` }
        : undefined;
}
exports.getHeadersWithUserAgent = getHeadersWithUserAgent;
function isValidQueryParamValue(value) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
/** Remove white spaces and add https if no protocol is specified */
function sanitizeUrl(url) {
    // Remove empty spaces
    url = url.trim();
    // Add protocol if necessary
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
        url = 'https://' + url;
    }
    // Remove trailing slash if present
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    return url;
}
exports.sanitizeUrl = sanitizeUrl;
class QueryBuilder {
    constructor(baseUrl, queryParams = new Map(), reservedParams = new Map()) {
        this.baseUrl = baseUrl;
        this.queryParams = queryParams;
        this.reservedParams = reservedParams;
        this.length = this.calculateUrlLength(queryParams, reservedParams);
    }
    canAddParam(paramName, paramValue) {
        return this.length + paramName.length + paramValue.length + 2 < exports.MAX_URL_LENGTH;
    }
    addParam(paramName, paramValue) {
        if (!this.canAddParam(paramName, paramValue)) {
            throw new Error(`You can't add this parameter '${paramName}', since it would exceed the max url length`);
        }
        const values = this.queryParams.get(paramName) ?? [];
        values.push(paramValue);
        this.queryParams.set(paramName, values);
        this.length += this.calculateAddedLength(paramName, [paramValue]);
        return this;
    }
    canSetParams(paramName, paramValues) {
        const newQueryParams = new Map([...this.queryParams, [paramName, paramValues]]);
        const newLength = this.calculateUrlLength(newQueryParams, this.reservedParams);
        return newLength < exports.MAX_URL_LENGTH;
    }
    /** This action will override whatever configuration there was previously for the given query parameter */
    setParams(paramName, paramValues) {
        if (!this.canSetParams(paramName, paramValues)) {
            throw new Error(`You can't add this parameter '${paramName}', since it would exceed the max url length`);
        }
        this.queryParams.set(paramName, paramValues.map((value) => `${value}`));
        this.length = this.calculateUrlLength(this.queryParams, this.reservedParams);
        return this;
    }
    /** This action will override whatever configuration there was previously for the given query parameter */
    setParam(paramName, paramValue) {
        this.setParams(paramName, [paramValue]);
        return this;
    }
    toString() {
        let url = this.baseUrl;
        let addedParamAlready = false;
        for (const [paramName, paramValues] of this.queryParams) {
            for (const paramValue of paramValues) {
                if (addedParamAlready) {
                    url += `&${paramName}=${paramValue}`;
                }
                else {
                    url += `?${paramName}=${paramValue}`;
                    addedParamAlready = true;
                }
            }
        }
        return url;
    }
    calculateUrlLength(queryParams, reservedParams) {
        let length = this.baseUrl.length;
        for (const [paramName, reserved] of reservedParams) {
            if (!this.queryParams.has(paramName)) {
                // We will avoid the reserved parameters that already have a value set
                length += paramName.length + 2 + reserved;
            }
        }
        for (const [paramName, paramValues] of queryParams) {
            length += this.calculateAddedLength(paramName, paramValues);
        }
        return length;
    }
    static clone(queryBuilder) {
        return new QueryBuilder(queryBuilder.baseUrl, new Map(queryBuilder.queryParams), queryBuilder.reservedParams);
    }
    calculateAddedLength(paramName, paramValues) {
        const valuesLength = this.calculateArrayLength(paramValues);
        return valuesLength + (paramName.length + 2) * paramValues.length;
    }
    calculateArrayLength(array) {
        return array.map((value) => `${value}`).reduce((accum, curr) => accum + curr.length, 0);
    }
}
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=Helper.js.map