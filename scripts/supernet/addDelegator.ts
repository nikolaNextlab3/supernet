import { Juneo, HDNode, BN } from "../../juneoJS";
import { GetTxStatusResponse, PlatformVMAPI, UnsignedTx, Tx } from "../../juneoJS/apis/platformvm";
import { UTXOSet } from "../../juneoJS/apis/platformvm"
import { UnixNow } from "../../juneoJS/utils";
import { load } from "ts-dotenv";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    JVM_PRIVATE_KEY: String,
    NODE_ID: String
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;
const JVMPrivateKey: string = env.JVM_PRIVATE_KEY;
const nodeID: string = env.NODE_ID;

const addSupernetValidator = async (): Promise<any> => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);    // Instantiating a juneo network from given network parameters 

    const PChain: PlatformVMAPI = juneo.PChain();
    const PChainKeychain = PChain.keyChain();
    PChainKeychain.importKey(JVMPrivateKey);
    const PChainAddressStrings = PChainKeychain.getAddressStrings();

    const startTime: BN = UnixNow().add(new BN(60 * 1));
    const endTime: BN = startTime.add(new BN(30 * 24 * 60 * 60));
    const stakeAmount = (await PChain.getMinStake()).minDelegatorStake;

    const platformVMUTXOResponse: any = await PChain.getUTXOs(PChainAddressStrings)
    const PChainUTXOSet: UTXOSet = platformVMUTXOResponse.utxos

    const unsignedAddDelegatorTX: UnsignedTx = await PChain.buildAddDelegatorTx(
        PChainUTXOSet,
        PChainAddressStrings,
        PChainAddressStrings,
        PChainAddressStrings,
        nodeID,
        startTime,
        endTime,
        stakeAmount,
        PChainAddressStrings
    );

    const addDelegatorTX: Tx = unsignedAddDelegatorTX.sign(PChainKeychain);
    const addDelegatorTXID: string = await PChain.issueTx(addDelegatorTX);

    console.log(`\nProcessing transaction (${addDelegatorTXID})`);

    let transactionStatus: string | GetTxStatusResponse = "Processing";
    while(transactionStatus === "Processing") {
        transactionStatus = (await PChain.getTxStatus(addDelegatorTXID));
    }

    console.log(`Transaction (${addDelegatorTXID}) has been processed\n`);
}

addSupernetValidator()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});