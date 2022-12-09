import { Juneo, BN } from "../../juneoJS";
import { GetTxStatusResponse, PlatformVMAPI } from "../../juneoJS/apis/platformvm";
import { UnixNow } from "../../juneoJS/utils";
import { UTXOSet, UnsignedTx } from "../../juneoJS/apis/platformvm";
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

const addValidator = async (): Promise<any> => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);    // Instantiating a juneo network from given network parameters 

    const PChain: PlatformVMAPI = juneo.PChain();
    const PChainKeychain = PChain.keyChain();
    PChainKeychain.importKey(JVMPrivateKey);
    const PChainAddressStrings = PChainKeychain.getAddressStrings();

    const platformVMUTXOResponse: any = await PChain.getUTXOs(PChainAddressStrings)
    const PChainUTXOSet: UTXOSet = platformVMUTXOResponse.utxos

    const startTime: BN = UnixNow().add(new BN(30 * 1));
    const endTime: BN = startTime.add(new BN(363 * 24 * 3600));
    const delegationFee: number = 12;
    const stakedAmount = await PChain.getMinStake();

    const unsignedAddValidatorTX: UnsignedTx = await PChain.buildAddValidatorTx(
        PChainUTXOSet,
        PChainAddressStrings,
        PChainAddressStrings,
        PChainAddressStrings,
        nodeID,
        startTime,
        endTime,
        stakedAmount.minValidatorStake,
        PChainAddressStrings,
        delegationFee
    );

    const addValidatorTX = unsignedAddValidatorTX.sign(PChainKeychain);
    const addValidatorTXID = await PChain.issueTx(addValidatorTX);

    // WAITING ON TRANSACTION TO FINISH

    console.log(`\nProcessing transaction (${addValidatorTXID})`);

    let transactionStatus: string | GetTxStatusResponse = "Processing";
    while(transactionStatus === "Processing") {
        transactionStatus = (await PChain.getTxStatus(addValidatorTXID));
    }

    console.log(`Transaction (${addValidatorTXID}) has been processed\n`);
    
    console.log(`Node ${nodeID} is now a validator on the Primary chain`);
}

addValidator()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});