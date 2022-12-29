import { Juneo } from "../../juneoJS";
import { load } from "ts-dotenv";
import { InfoAPI } from "../../juneoJS/apis/info";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;

const printNodeInformation = (node: any) => {
    console.log(`
        Node ID:        ${node.nodeID}
        IP address:     ${node.ip}
        Node version:   ${node.version}`);
}

const getNodePeers = async () => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);
    const infoAPI: InfoAPI = juneo.Info();

    const nodePeers = await infoAPI.peers();

    console.log(`Information of peers for node at ${host}:`);

    nodePeers.forEach((node) => printNodeInformation(node));
}

getNodePeers()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});