"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdatedApprovedListWithoutQueryingContract = exports.getApprovedListFromContract = void 0;
const mitz_catalyst_1 = require("mitz-catalyst");
const CatalystClient_1 = require("../CatalystClient");
const CatalystsList_1 = __importDefault(require("../CatalystsList"));
const common_1 = require("./common");
async function getApprovedListFromContract(network) {
    const servers = network === 'mainnet' ? await (0, mitz_catalyst_1.getMainnetCatalysts)() : await (0, mitz_catalyst_1.getRopstenCatalysts)();
    return servers.map(({ address }) => address);
}
exports.getApprovedListFromContract = getApprovedListFromContract;
/**
 * The idea here is to build an updated list of the catalysts approved by the DAO, without actually querying the DAO's contract
 * directly. This is because that query is both slow and expensive, so the idea is to use a list of known servers and ask them
 * for the updated list. The thing is this known server list might be outdated, so we need to take that into account. We will
 * take N (defined by REQUIRED_LISTS below) random servers from this known list, and ask them for the currently approved ones. We will then use the intersection of those
 * N lists as the updated list.
 */
const REQUIRED_LISTS = 3;
async function getUpdatedApprovedListWithoutQueryingContract(options) {
    // Set defaults if needed
    const catalystListFetch = options.fetchApprovedCatalysts ??
        ((catalystUrl) => fetchCatalystsApprovedByDAO(catalystUrl, options.proofOfWorkEnabled));
    const requiredAmountOfLists = options.requiredLists ?? REQUIRED_LISTS;
    // Get the list of known servers
    const knownServers = 'list' in options.preKnownServers ? options.preKnownServers.list : CatalystsList_1.default[options.preKnownServers.network];
    // If I don't know enough servers, then it doesn't make sense to continue
    if (knownServers.length < requiredAmountOfLists) {
        return undefined;
    }
    // Shuffle the list
    const shuffledPreKnownServers = (0, common_1.shuffleArray)(knownServers);
    // Ask N of them for their list
    const approvedServersList = await Promise.all(shuffledPreKnownServers
        .slice(0, requiredAmountOfLists + 3)
        .map((server) => server.address)
        .map((address) => catalystListFetch(address)));
    // Removed any failures
    const allLists = approvedServersList.filter((approvedServerList) => !!approvedServerList);
    // Check if we need to ask for anyone else's list
    let i = requiredAmountOfLists + 3;
    while (i < shuffledPreKnownServers.length && allLists.length < requiredAmountOfLists) {
        const list = await catalystListFetch(shuffledPreKnownServers[i].address);
        if (list) {
            allLists.push(list);
        }
        i++;
    }
    // If I didn't manage to get al least N lists from different sources, then abort
    if (allLists.length < requiredAmountOfLists) {
        return undefined;
    }
    // Calculate the intersection
    const intersection = calculateIntersection(allLists);
    return intersection.length > 0 ? intersection : undefined;
}
exports.getUpdatedApprovedListWithoutQueryingContract = getUpdatedApprovedListWithoutQueryingContract;
function calculateIntersection(lists) {
    const count = new Map();
    for (const list of lists) {
        for (const element of list) {
            count.set(element, (count.get(element) ?? 0) + 1);
        }
    }
    return Array.from(count.entries())
        .filter(([_, count]) => count === lists.length)
        .map(([element]) => element);
}
async function fetchCatalystsApprovedByDAO(catalystUrl, proofOfWorkEnabled) {
    const client = new CatalystClient_1.CatalystClient({
        catalystUrl,
        proofOfWorkEnabled
    });
    try {
        const servers = await client.fetchCatalystsApprovedByDAO({ timeout: '10s' });
        return servers.map(({ address }) => address);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=catalystList.js.map