import { Juneo, BN } from "../../juneoJS";
import { JVMAPI } from "../../juneoJS/apis/jvm";
import { PlatformVMAPI } from "../../juneoJS/apis/platformvm";

// Function for big number conversion 
const convertBN = (bigNumber: number | BN): number => {
    const amountString: string = bigNumber.toString();
    const amountNumber: number = (+amountString) / 1000000000;
    return amountNumber;
}

const getAccountBalances = async (): Promise<any> => {

    const protocol: string = "http";            // Setting network protocol of node
    const host: string = "172.104.226.247";     // Setting IP address of node (host)
    const port: number = 9650;                  // Setting port on which juneogo is running on said node
    const networkID: number = 1;                // Setting network ID of JUNEO

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);        // Instantiating a juneo network from given network parameters 

    const XChain: JVMAPI = juneo.XChain();                                  // Retrieving X chain instance from juneo network
    const PChain: PlatformVMAPI = juneo.PChain();                           // Retrieving P chain instance from juneo network

    const assetID: string = "JUNE";                        // Defining asset ID (Use specific ID string for other assets)

    const XChainWalletAddress: string = "X-june10cqp565uvecm4av86cmstcxa6m8nydu33hrrg6";                // Retrieving X chain wallet address
    const PChainWalletAddress: string = "P-june10cqp565uvecm4av86cmstcxa6m8nydu33hrrg6";                // Retrieving P chain wallet address

    const balancesXChain = (await XChain.getBalance(XChainWalletAddress, assetID, false)).balance;      // Getting JUNE balances of X chain 
    const balancesPChain = (await PChain.getBalance(PChainWalletAddress)).balance;                      // Getting JUNE balances of P chain

    console.log(`
    Balances:
        X Chain:
        ${convertBN(balancesXChain)} JUNE
        P Chain:
        ${convertBN(balancesPChain)} JUNE
    `);
}

getAccountBalances()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});