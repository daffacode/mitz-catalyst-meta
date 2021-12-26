export declare function getApprovedListFromContract(network: 'mainnet' | 'ropsten'): Promise<string[]>;
export declare type KnownServersOptions = {
    preKnownServers: {
        list: {
            address: string;
        }[];
    } | {
        network: 'mainnet' | 'ropsten';
    };
    proofOfWorkEnabled?: boolean;
    requiredLists?: number;
    fetchApprovedCatalysts?: (catalystUrl: string) => Promise<string[] | undefined>;
};
export declare function getUpdatedApprovedListWithoutQueryingContract(options: KnownServersOptions): Promise<string[] | undefined>;
