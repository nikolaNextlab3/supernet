import { Juneo, HDNode } from "../../juneoJS";
import { load } from "ts-dotenv";

const env = load({
    MNEMONIC: String,
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    JUNE_CHAIN_ID: String
});

const mnemonic = env.MNEMONIC;
const protocol = env.PROTOCOL;
const host = env.HOST;
const port = env.PORT;
const networkID = env.NETWORK_ID;
const JUNEChainID = env.JUNE_CHAIN_ID;

// Function for formating JUNE chain wallet addresses
// NOTE: Will be removed with later versions of JuneoJS
const formatJUNEAddressStrings = (JUNEAddressStrings: string[]): string[] => {
    let formatedAddresses: string[] = [];
    
    JUNEAddressStrings.forEach(address => {
        const split = address.split("-");
        formatedAddresses.push(`J-${split[1]}`);
    });
    
    return formatedAddresses;
};

const deriveAddresse = async (): Promise<any> => {

    const HDWallet = new HDNode(mnemonic);                      // Instantiating wallet with given mnemonic phrase
    const JVMDerived = HDWallet.derive("m/44'/9000'/0'/0/0");   // Default Juneo derive path for X/P chain as of BIP44
    const EVMDerived = HDWallet.derive("m/44'/60'/0'/0/0");     // Default Ethereum derive path for EVM chains as of BIP44

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);        // Instantiating a juneo network from given network parameters  

    juneo.addEVMAPI("june", `ext/bc/${JUNEChainID}/june`, JUNEChainID);     // Adding JUNE chain to network instance 

    const XChain = juneo.XChain();                      // Retrieving X chain instance from juneo network
    const PChain = juneo.PChain();                      // Retrieving P chain instance from juneo network
    const JUNEChain = juneo.EVMChain("june");           // Retrieving JUNE chain instance from juneo network

    const XChainKeychain = XChain.keyChain();           // Retrieving X chain keychain  
    const PChainKeychain = PChain.keyChain();           // Retrieving P chain keychain
    const JUNEChainKeychain = JUNEChain.keyChain();     // Retrieving JUNE chain keychain

    XChainKeychain.importKey(JVMDerived.privateKeyCB58);           // Importing JVM derived private key onto X chain keychain (used for X chain public address generation)
    PChainKeychain.importKey(JVMDerived.privateKeyCB58);           // Importing JVM derived private key onto P chain keychain (used for P chain public address generation)
    JUNEChainKeychain.importKey(EVMDerived.privateKeyCB58);        // Importing EVM derived private key onto JUNE chain keychain (used for JUNE chain public address generation)

    const XChainAddressStrings = XChainKeychain.getAddressStrings();            // Getting public (wallet) addresses of X chain
    const PChainAddressStrings = PChainKeychain.getAddressStrings();            // Getting public (wallet) addresses of P chain
    const JUNEChainAddressStrings = JUNEChainKeychain.getAddressStrings();      // Getting public (wallet) addresses of JUNE chain

    console.log(`
    Private keys: 
        JVM: ${JVMDerived.privateKeyCB58}
        EVM: ${EVMDerived.privateKeyCB58}

    Public keys (Addresses):    
        X Chain:    ${XChainAddressStrings}
        P Chain:    ${PChainAddressStrings}
        JUNE Chain: ${formatJUNEAddressStrings(JUNEChainAddressStrings)}
    `);
}

deriveAddresse()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
});