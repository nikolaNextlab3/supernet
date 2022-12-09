import { Juneo, BN } from "../../juneoJS";
import { load } from "ts-dotenv";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    JVM_PRIVATE_KEY: String,
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;
const JVMPrivateKey: string = env.JVM_PRIVATE_KEY;

// Function for big number conversion 
const convertBN = (bigNumber: number | BN): number => {
    const amountString: string = bigNumber.toString();
    const amountNumber: number = (+amountString) / 1000000000;
    return amountNumber;
}

const XtoPchainTransfer = async (): Promise<any> => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);    // Instantiating a juneo network from given network parameters 
    
    const XChain = juneo.XChain();                      // Retrieving X chain instance from juneo network
    const PChain = juneo.PChain();                      // Retrieving P chain instance from juneo network

    const XChainKeychain = XChain.keyChain();           // Retrieving X chain keychain  
    const PChainKeychain = PChain.keyChain();           // Retrieving P chain keychain

    XChainKeychain.importKey(JVMPrivateKey);                // Importing JVM derived private key onto X chain keychain (used for X chain public address generation)
    PChainKeychain.importKey(JVMPrivateKey);                // Importing JVM derived private key onto P chain keychain (used for P chain public address generation)   

    const XChainAddressStrings = XChainKeychain.getAddressStrings();    // Getting public addresses of X chain
    const PChainAddressStrings = PChainKeychain.getAddressStrings();    // Getting public addresses of X chain

    // EXPORT TRANSACTION

    const feeAmountXChain = XChain.getTxFee();                  // Getting fee amount for X Chain
    const transferAmount = new BN(1e7);

    const totalAmount = transferAmount.add(feeAmountXChain);    // Defining amount to be sent in said transaction

    const XChainUTXOResponse = await XChain.getUTXOs(XChainAddressStrings);     
    const XChainUTXOSet = XChainUTXOResponse.utxos;                                
    
    const unsignedExportTX = await XChain.buildExportTx(
        XChainUTXOSet,
        totalAmount,
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

    console.log(`${convertBN(transferAmount)} JUNE was transfered from the X to the P chain`);
};

XtoPchainTransfer()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});