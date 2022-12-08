import { Juneo, HDNode } from "../../juneoJS";

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
    
    const mnemonicPhrase: string = "cross echo often faith what riot solar sand praise very toss like brand anchor federal differ biology lemon movie across robust song harsh foil"

    const HDWallet = new HDNode(mnemonicPhrase);                // Instantiating wallet with given mnemonic phrase
    const JVMDerived = HDWallet.derive("m/44'/9000'/0'/0/0");   // Default Juneo derive path for X/P chain as of BIP44
    const EVMDerived = HDWallet.derive("m/44'/60'/0'/0/0");     // Default Ethereum derive path for EVM chains as of BIP44

    const protocol = "http";                    // Setting network protocol of node
    const host = "172.104.226.247";             // Setting IP address of node (host)
    const port = 9650;                          // Setting port on which juneogo is running on said node
    const networkID = 1;                        // Setting network ID of JUNEO

    const JUNEChainID = "jTDzHfaYrjiQ1q3W5zfQDXmq2pmZ7z74m1UM1tW8iJMb7fqrh";        // Getting JUNE Blockchain ID

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

    const XChainAddressStrings = XChainKeychain.getAddressStrings();        // Getting public (wallet) addresses of X chain
    const PChainAddressStrings = PChainKeychain.getAddressStrings();        // Getting public (wallet) addresses of P chain
    const JUNEChainAddressStrings = JUNEChainKeychain.getAddressStrings();  // Getting public (wallet) addresses of JUNE chain

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