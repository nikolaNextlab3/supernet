import { Juneo, HDNode, BN } from "../../juneoJS";

const XtoPchainTransfer = async (): Promise<any> => {

    const protocol = "http";                // Setting network protocol of node
    const host = "172.104.226.247";         // Setting IP address of node (host)
    const port = 9650;                      // Setting port on which juneogo is running on said node
    const networkID = 1;                    // Setting network ID of JUNEO

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);    // Instantiating a juneo network from given network parameters 
    
    const XChain = juneo.XChain();                      // Retrieving X chain instance from juneo network
    const PChain = juneo.PChain();                      // Retrieving P chain instance from juneo network

    const XChainKeychain = XChain.keyChain();           // Retrieving X chain keychain  
    const PChainKeychain = PChain.keyChain();           // Retrieving P chain keychain

    const mnemonic = "cross echo often faith what riot solar sand praise very toss like brand anchor federal differ biology lemon movie across robust song harsh foil";
    const HDWallet = new HDNode(mnemonic);
    const JVMDerived = HDWallet.derive("m/44'/9000'/0'/0/0");           // Default Juneo derive path for X/P chain as of BIP44

    XChainKeychain.importKey(JVMDerived.privateKeyCB58);                // Importing JVM derived private key onto X chain keychain (used for X chain public address generation)
    PChainKeychain.importKey(JVMDerived.privateKeyCB58);                // Importing JVM derived private key onto P chain keychain (used for P chain public address generation)   

    const XChainAddressStrings = XChainKeychain.getAddressStrings();    // Getting public addresses of X chain
    const PChainAddressStrings = PChainKeychain.getAddressStrings();    // Getting public addresses of X chain

    // EXPORT TRANSACTION

    const amount = new BN(1e6);                                                     // Defining amount to be sent in said transaction

    const XChainUTXOResponse = await XChain.getUTXOs(XChainAddressStrings);     
    const XChainUTXOSet = XChainUTXOResponse.utxos;                                
    
    const unsignedExportTX = await XChain.buildExportTx(
        XChainUTXOSet,
        amount,
        PChain.getBlockchainID(),
        PChainAddressStrings,
        XChainAddressStrings,
        XChainAddressStrings
    );

    const exportTX = unsignedExportTX.sign(XChainKeychain);
    const exportTXID = await XChain.issueTx(exportTX);
    
    console.log(`Export transaction ID (from X chain): ${exportTXID}`);

    // WAIT FOR EXPORT TO FINISH

    console.log(`\nProcessing transaction (${exportTXID})`);

    let transactionStatus: string = "Processing";
    while(transactionStatus === "Processing") {
        transactionStatus = (await XChain.getTxStatus(exportTXID));
    }

    console.log(`Transaction (${exportTXID}) has been processed\n`);
    
    // IMPORT TRANSACTION

    const PChainUTXOResponse = await PChain.getUTXOs(PChainAddressStrings[0], XChain.getBlockchainID());
    const PChainUTXOSet = PChainUTXOResponse.utxos;

    const unsignedImportTX = await PChain.buildImportTx(
        PChainUTXOSet,
        PChainAddressStrings,
        XChain.getBlockchainID(),
        PChainAddressStrings,
        PChainAddressStrings
    );

    const importTX = unsignedImportTX.sign(PChainKeychain);
    const importTXID = await PChain.issueTx(importTX);

    console.log(`Import transaction ID (to P chain): ${importTXID}`);

    // WAIT FOR IMPORT TO FINISH

    console.log(`\nProcessing transaction (${importTXID})`);

    transactionStatus = "Processing";
    while(transactionStatus === "Processing") {
        transactionStatus = (await XChain.getTxStatus(importTXID));
    }

    console.log(`Transaction (${importTXID}) has been processed\n`);
};

XtoPchainTransfer()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});