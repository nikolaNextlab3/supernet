import { Juneo, HDNode, BN } from "../../juneoJS";
import { GetTxStatusResponse, PlatformVMAPI } from "../../juneoJS/apis/platformvm";
import { UnixNow } from "../../juneoJS/utils";
import { UTXOSet, UnsignedTx } from "../../juneoJS/apis/platformvm"

const addSupernetValidator = async (): Promise<any> => {

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

    const nodeID: string = "NodeID-6WqqCvQNbq3nkWsxqpDw5VkTGgxB5XA4H";
    const startTime: BN = UnixNow().add(new BN(30 * 1));
    const endTime: BN = startTime.add(new BN(364 * 24 * 3600));
    const weight: BN = new BN(100);
    const supernetID: string = "238tvJi4tpVum2jDqFf3CdtaGxmyo8dywUMTHuumyifiBSABb";

    const platformVMUTXOResponse: any = await PChain.getUTXOs(PChainAddressStrings);
    const PChainUTXOSet: UTXOSet = platformVMUTXOResponse.utxos;

    const unsignedAddSupernetValidatorTX: UnsignedTx = await PChain.buildAddSubnetValidatorTx(
        PChainUTXOSet,
        PChainAddressStrings,
        PChainAddressStrings,
        nodeID,
        startTime,
        endTime,
        weight,
        supernetID
    );

    const addSupernetValidatorTX = unsignedAddSupernetValidatorTX.sign(PChainKeychain);
    const addValidatorTXID = await PChain.issueTx(addSupernetValidatorTX);

    console.log(`\nProcessing transaction (${addValidatorTXID})`);

    let transactionStatus: string | GetTxStatusResponse = "Processing";
    while(transactionStatus === "Processing") {
        transactionStatus = (await PChain.getTxStatus(addValidatorTXID));
    }

    console.log(`Transaction (${addValidatorTXID}) has been processed\n`);
}

addSupernetValidator()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});