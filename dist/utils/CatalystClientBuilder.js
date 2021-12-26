"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientConnectedToCatalystIn = void 0;
const mitz_catalyst_1 = require("mitz-catalyst");
const CatalystClient_1 = require("../CatalystClient");
const catalystList_1 = require("./catalystList");
const common_1 = require("./common");
const FETCH_HEALTH_TIMEOUT = '10s';
/**
 * Returns a CatalystClient connected to one of the catalysts in the given network
 */
async function clientConnectedToCatalystIn(options) {
    const noContractList = await (0, catalystList_1.getUpdatedApprovedListWithoutQueryingContract)({
        preKnownServers: { network: options.network },
        proofOfWorkEnabled: options.proofOfWorkEnabled
    });
    let list;
    if (noContractList) {
        list = noContractList;
    }
    else {
        console.warn('Falling back to the smart contract to get an updated list of active servers');
        list = await (0, catalystList_1.getApprovedListFromContract)(options.network);
    }
    const shuffled = (0, common_1.shuffleArray)(list);
    for (const catalystUrl of shuffled) {
        const client = new CatalystClient_1.CatalystClient({
            catalystUrl: catalystUrl,
            proofOfWorkEnabled: options.proofOfWorkEnabled
        });
        const isUp = await isServerUp(client);
        if (isUp) {
            return client;
        }
    }
    throw new Error(`Couldn't find a server on the ${options.network} network that was up`);
}
exports.clientConnectedToCatalystIn = clientConnectedToCatalystIn;
async function isServerUp(client) {
    try {
        const result = await client.fetchPeerHealth({ timeout: FETCH_HEALTH_TIMEOUT });
        const isSomeServerDown = Object.keys(result).some((service) => result[service] !== mitz_catalyst_1.HealthStatus.HEALTHY);
        return !isSomeServerDown;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=CatalystClientBuilder.js.map