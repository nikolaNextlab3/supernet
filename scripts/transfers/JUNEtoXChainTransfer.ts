import { Juneo, BN } from "../../juneoJS";
import { load } from "ts-dotenv";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    JUNE_CHAIN_ID: String,
    JVM_PRIVATE_KEY: String,
    EVM_PRIVATE_KEY: String,
    WALLET_ADDRESS: String,
    WALLET_PRIVATE: String,
    JUNE_CHAIN_ASSET_ID: String
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;
const juneChainID: string = env.JUNE_CHAIN_ID;
const JVMPrivateKey: string = env.JVM_PRIVATE_KEY;
const EVMPrivateKey: string = env.EVM_PRIVATE_KEY;
const walletAddress: string = env.WALLET_ADDRESS;
const juneAssetID: string = env.JUNE_CHAIN_ASSET_ID;

const JUNEtoXchainTransfer = async (): Promise<any> => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);        // Instantiating a juneo network from given network parameters 
    juneo.addEVMAPI('JUNE', `/ext/bc/${juneChainID}/june`, juneChainID);

    const XChain = juneo.XChain();                          // Retrieving X chain instance from juneo network
    const JUNEChain = juneo.EVMChain('JUNE');

    const XChainKeychain = XChain.keyChain();               // Retrieving X chain keychain  
    const JUNEChainKeychain = JUNEChain.keyChain();         // Retrieving JUNE chain keychain

    XChainKeychain.importKey(JVMPrivateKey);                // Importing JVM derived private key onto X chain keychain (used for X chain public address generation)
    JUNEChainKeychain.importKey(EVMPrivateKey);             // Importing JVM derived private key onto P chain keychain (used for P chain public address generation)   

    const XChainAddressStrings = XChainKeychain.getAddressStrings();            // Getting public addresses of X chain
    const JUNEChainAddressStrings = JUNEChainKeychain.getAddressStrings();        // Getting public addresses of X chain

    const transferAmount = new BN(1e7);

    // EXPORT TRANSACTION
                     
    const unsignedExportTX = await JUNEChain.buildExportTx(
        transferAmount,
        juneAssetID,
        XChain.getBlockchainID(),
        walletAddress,
        JUNEChainAddressStrings[0],
        XChainAddressStrings
    );
};

JUNEtoXchainTransfer()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});