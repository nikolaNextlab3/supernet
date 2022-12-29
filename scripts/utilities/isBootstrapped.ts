import { Juneo } from "../../juneoJS";
import { load } from "ts-dotenv";
import { InfoAPI } from "../../juneoJS/apis/info";

const env = load({
    PROTOCOL: String,
    HOST: String,
    PORT: Number,
    NETWORK_ID: Number,
    JUNE_CHAIN_ID: String
});

const protocol: string = env.PROTOCOL;
const host: string = env.HOST;
const port: number = env.PORT;
const networkID: number = env.NETWORK_ID;
const juneChainID: string = env.JUNE_CHAIN_ID;

const isBootstrapped = async () => {

    const juneo: Juneo = new Juneo(host, port, protocol, networkID);
    const infoAPI: InfoAPI = juneo.Info();

    const isBootstrapped = await infoAPI.isBootstrapped(juneChainID);

    console.log(`
    Node bootstrapping status: ${isBootstrapped ? 'bootstrapped' : 'bootstrapping...'}
    `);
}

isBootstrapped()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});