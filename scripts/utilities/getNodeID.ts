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

const getNodeID = async () => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);
    const infoAPI: InfoAPI = juneo.Info();

    const nodeID: string = await infoAPI.getNodeID();

    console.log(`Node ID at ${host} is: ${nodeID}`);
}

getNodeID()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});