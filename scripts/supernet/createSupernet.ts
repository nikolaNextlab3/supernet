import { Juneo, HDNode } from "../../juneoJS";
import { GetTxStatusResponse, PlatformVMAPI } from "../../juneoJS/apis/platformvm";
import { UTXOSet, UnsignedTx } from "../../juneoJS/apis/platformvm";
import { load } from "ts-dotenv";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    JVM_PRIVATE_KEY: String
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;
const JVMPrivateKey: string = env.JVM_PRIVATE_KEY;

const createSupernet = async (): Promise<any> => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);    // Instantiating a juneo network from given network parameters 

    const PChain: PlatformVMAPI = juneo.PChain();
    const PChainKeychain = PChain.keyChain();
    PChainKeychain.importKey(JVMPrivateKey);
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

    console.log(`Supenet ID: ${createSupernetTXID}`);
}

createSupernet()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});