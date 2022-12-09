import { Juneo } from "../../../juneoJS";
import { GetTxStatusResponse, PlatformVMAPI } from "../../../juneoJS/apis/platformvm";
import { UTXOSet, UnsignedTx } from "../../../juneoJS/apis/platformvm";
import genesisBlock from "./genesis.json";
import { load } from "ts-dotenv";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    JVM_PRIVATE_KEY: String,
    SUPERNET_ID: String,
    BLOCKCHAIN_NAME: String,
    BLOCKCHAIN_EVM_ID: String
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;
const JVMPrivateKey: string = env.JVM_PRIVATE_KEY;
const supernetID: string = env.SUPERNET_ID;
const blockchainName: string = env.BLOCKCHAIN_NAME;
const VMID: string = env.BLOCKCHAIN_EVM_ID;

const addSupernetValidator = async (): Promise<any> => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);    // Instantiating a juneo network from given network parameters 

    const PChain: PlatformVMAPI = juneo.PChain();
    const PChainKeychain = PChain.keyChain();
    PChainKeychain.importKey(JVMPrivateKey);
    const PChainAddressStrings = PChainKeychain.getAddressStrings();

    const genesisData = genesisBlock;
    const genesisBytes = JSON.stringify(genesisData);
    const FXIDs: string[] = [];

    const platformVMUTXOResponse: any = await PChain.getUTXOs(PChainAddressStrings);
    const PChainUTXOSet: UTXOSet = platformVMUTXOResponse.utxos;

    const unsignedBlockchainCreationTX: UnsignedTx = await PChain.buildCreateChainTx(
        PChainUTXOSet,
        PChainAddressStrings,
        PChainAddressStrings,
        supernetID,
        blockchainName,
        VMID,
        FXIDs,
        genesisBytes
    );

    const createBlockchainTX = unsignedBlockchainCreationTX.sign(PChainKeychain);
    const createBlockchainTXID = await PChain.issueTx(createBlockchainTX);

    console.log(`\nProcessing transaction (${createBlockchainTXID})`);

    let transactionStatus: string | GetTxStatusResponse = "Processing";
    while(transactionStatus === "Processing") {
        transactionStatus = (await PChain.getTxStatus(createBlockchainTXID));
    }

    console.log(`Transaction (${createBlockchainTXID}) has been processed\n`);
}

addSupernetValidator()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});