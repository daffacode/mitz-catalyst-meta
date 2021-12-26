import { CatalystClient, CatalystConnectOptions } from '../CatalystClient';
/**
 * Returns a CatalystClient connected to one of the catalysts in the given network
 */
export declare function clientConnectedToCatalystIn(options: CatalystConnectOptions): Promise<CatalystClient>;
