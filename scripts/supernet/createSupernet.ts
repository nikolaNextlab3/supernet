import { Juneo, HDNode } from "../../juneoJS";
import { GetTxStatusResponse, PlatformVMAPI } from "../../juneoJS/apis/platformvm";
import { UTXOSet, UnsignedTx } from "../../juneoJS/apis/platformvm"

const createSupernet = async (): Promise<any> => {

    const protocol: string = "http";            // Setting network protocol of node
    const host: string = "172.104.226.247";     // Setting IP address of node (host)
    const port: number = 9650;                  // Setting port on which juneogo is running on said node
    const networkID: number = 1;                // Setting network ID of JUNEO

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);    // Instantiating a juneo network from given network parameters 
    
    const mnemonic = "cross echo often faith what riot solar sand praise very toss like brand anchor federal differ biology lemon movie across robust song harsh foil";
    const HDWallet = new HDNode(mnemonic);
    const JVMDerived = HDWallet.derive("m/44'/9000'/0'/0/0");           // Default Juneo derive path for X/P chain as of BIP44

    const PChain: PlatformVMAPI = juneo.PChain();
    const PChainKeychain = PChain.keyChain();
    PChainKeychain.importKey(JVMDerived.privateKeyCB58);
    const PChainAddressStrings = PChainKeychain.getAddressStrings();

    const subnetValidatorThreshold = 1;

    const platformVMUTXOResponse: any = await PChain.getUTXOs(PChainAddressStrings)
    const PChainUTXOSet: UTXOSet = platformVMUTXOResponse.utxos

    const unsignedCreateSupernetTX: UnsignedTx = await PChain.buildCreateSubnetTx(
        PChainUTXOSet,
        PChainAddressStrings,
        PChainAddressStrings,
        PChainAddressStrings,
        subnetValidatorThreshold
    )

    const createSupernetTX = unsignedCreateSupernetTX.sign(PChainKeychain);
    const createSupernetTXID = await PChain.issueTx(createSupernetTX);

    // WAITING ON TRANSACTION TO FINISH

    console.log(`\nProcessing transaction (${createSupernetTXID})`);

    let transactionStatus: string | GetTxStatusResponse = "Processing";
    while(transactionStatus === "Processing") {
        transactionStatus = (await PChain.getTxStatus(createSupernetTXID));
    }

    console.log(`Transaction (${createSupernetTXID}) has been processed\n`);
}

createSupernet()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});