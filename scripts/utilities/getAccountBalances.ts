import { Juneo, BN } from "../../juneoJS";
import { JVMAPI } from "../../juneoJS/apis/jvm";
import { PlatformVMAPI } from "../../juneoJS/apis/platformvm";
import { load } from "ts-dotenv";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    X_CHAIN_WALLET: String,
    P_CHAIN_WALLET: String
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;
const XChainWalletAddress: string = env.X_CHAIN_WALLET;
const PChainWalletAddress: string = env.P_CHAIN_WALLET;

// Function for big number conversion 
const convertBN = (bigNumber: number | BN): number => {
    const amountString: string = bigNumber.toString();
    const amountNumber: number = (+amountString) / 1000000000;
    return amountNumber;
}

const getAccountBalances = async (): Promise<any> => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);        // Instantiating a juneo network from given network parameters 

    const XChain: JVMAPI = juneo.XChain();                                  // Retrieving X chain instance from juneo network
    const PChain: PlatformVMAPI = juneo.PChain();                           // Retrieving P chain instance from juneo network

    const assetID: string = "JUNE";             // Defining asset ID (Use specific ID string for other assets)

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