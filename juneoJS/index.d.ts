/**
 * @packageDocumentation
 * @module Juneo
 */
import JuneoCore from "./juneo";
import { AdminAPI } from "./apis/admin/api";
import { AuthAPI } from "./apis/auth/api";
import { JVMAPI } from "./apis/jvm/api";
import { EVMAPI } from "./apis/evm/api";
import { GenesisAsset } from "./apis/jvm/genesisasset";
import { GenesisData } from "./apis/jvm/genesisdata";
import { HealthAPI } from "./apis/health/api";
import { IndexAPI } from "./apis/index/api";
import { InfoAPI } from "./apis/info/api";
import { KeystoreAPI } from "./apis/keystore/api";
import { MetricsAPI } from "./apis/metrics/api";
import { PlatformVMAPI } from "./apis/platformvm/api";
import { Socket } from "./apis/socket/socket";
import BinTools from "./utils/bintools";
import DB from "./utils/db";
import Mnemonic from "./utils/mnemonic";
import PubSub from "./utils/pubsub";
import HDNode from "./utils/hdnode";
import BN from "bn.js";
import { Buffer } from "buffer/";
/**
 * JuneoJS is middleware for interacting with Juneo node RPC APIs.
 *
 * Example usage:
 * ```js
 * const juneo: Juneo = new Juneo("127.0.0.1", 9650, "https")
 * ```
 *
 */
export default class Juneo extends JuneoCore {
    /**
     * Returns a reference to the Admin RPC.
     */
    Admin: () => AdminAPI;
    /**
     * Returns a reference to the Auth RPC.
     */
    Auth: () => AuthAPI;
    /**
     * Returns a reference to the JVM RPC pointed at the X-Chain.
     */
    XChain: () => JVMAPI;
    /**
     * Returns a reference to the Health RPC for a node.
     */
    Health: () => HealthAPI;
    /**
     * Returns a reference to the Index RPC for a node.
     */
    Index: () => IndexAPI;
    /**
     * Returns a reference to the Info RPC for a node.
     */
    Info: () => InfoAPI;
    /**
     * Returns a reference to the Metrics RPC.
     */
    Metrics: () => MetricsAPI;
    /**
     * Returns a reference to the Keystore RPC for a node. We label it "NodeKeys" to reduce
     * confusion about what it's accessing.
     */
    NodeKeys: () => KeystoreAPI;
    /**
     * Returns a reference to the PlatformVM RPC pointed at the P-Chain.
     */
    PChain: () => PlatformVMAPI;
    EVMChain: (name: string) => EVMAPI;
    addEVMAPI: (apiName: string, baseurl: string, blockchainID: string) => void;
    /**
     * Creates a new Juneo instance. Sets the address and port of the main Juneo Client.
     *
     * @param host The hostname to resolve to reach the Juneo Client RPC APIs
     * @param port The port to resolve to reach the Juneo Client RPC APIs
     * @param protocol The protocol string to use before a "://" in a request,
     * ex: "http", "https", "git", "ws", etc. Defaults to http
     * @param networkID Sets the NetworkID of the class. Default [[DefaultNetworkID]]
     * @param XChainID Sets the blockchainID for the JVM. Will try to auto-detect,
     * otherwise default "2w46yCmx8jsnGWVfuhqA4m8WE7huhVbuvAemAeZUz4HSqynfaD"
     * @param hrp The human-readable part of the bech32 addresses
     * @param skipinit Skips creating the APIs. Defaults to false
     */
    constructor(host?: string, port?: number, protocol?: string, networkID?: number, XChainID?: string, hrp?: string, skipinit?: boolean);
}
export { Juneo };
export { JuneoCore };
export { BinTools };
export { BN };
export { Buffer };
export { DB };
export { HDNode };
export { GenesisAsset };
export { GenesisData };
export { Mnemonic };
export { PubSub };
export { Socket };
export * as admin from "./apis/admin";
export * as auth from "./apis/auth";
export * as jvm from "./apis/jvm";
export * as common from "./common";
export * as evm from "./apis/evm";
export * as health from "./apis/health";
export * as index from "./apis/index";
export * as info from "./apis/info";
export * as keystore from "./apis/keystore";
export * as metrics from "./apis/metrics";
export * as platformvm from "./apis/platformvm";
export * as utils from "./utils";
//# sourceMappingURL=index.d.ts.map