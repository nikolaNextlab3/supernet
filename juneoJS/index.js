"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.platformvm = exports.metrics = exports.keystore = exports.info = exports.index = exports.health = exports.evm = exports.common = exports.jvm = exports.auth = exports.admin = exports.Socket = exports.PubSub = exports.Mnemonic = exports.GenesisData = exports.GenesisAsset = exports.HDNode = exports.DB = exports.Buffer = exports.BN = exports.BinTools = exports.JuneoCore = exports.Juneo = void 0;
/**
 * @packageDocumentation
 * @module Juneo
 */
const juneo_1 = __importDefault(require("./juneo"));
exports.JuneoCore = juneo_1.default;
const api_1 = require("./apis/admin/api");
const api_2 = require("./apis/auth/api");
const api_3 = require("./apis/jvm/api");
const api_4 = require("./apis/evm/api");
const genesisasset_1 = require("./apis/jvm/genesisasset");
Object.defineProperty(exports, "GenesisAsset", { enumerable: true, get: function () { return genesisasset_1.GenesisAsset; } });
const genesisdata_1 = require("./apis/jvm/genesisdata");
Object.defineProperty(exports, "GenesisData", { enumerable: true, get: function () { return genesisdata_1.GenesisData; } });
const api_5 = require("./apis/health/api");
const api_6 = require("./apis/index/api");
const api_7 = require("./apis/info/api");
const api_8 = require("./apis/keystore/api");
const api_9 = require("./apis/metrics/api");
const api_10 = require("./apis/platformvm/api");
const socket_1 = require("./apis/socket/socket");
Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket_1.Socket; } });
const constants_1 = require("./utils/constants");
const helperfunctions_1 = require("./utils/helperfunctions");
const bintools_1 = __importDefault(require("./utils/bintools"));
exports.BinTools = bintools_1.default;
const db_1 = __importDefault(require("./utils/db"));
exports.DB = db_1.default;
const mnemonic_1 = __importDefault(require("./utils/mnemonic"));
exports.Mnemonic = mnemonic_1.default;
const pubsub_1 = __importDefault(require("./utils/pubsub"));
exports.PubSub = pubsub_1.default;
const hdnode_1 = __importDefault(require("./utils/hdnode"));
exports.HDNode = hdnode_1.default;
const bn_js_1 = __importDefault(require("bn.js"));
exports.BN = bn_js_1.default;
const buffer_1 = require("buffer/");
Object.defineProperty(exports, "Buffer", { enumerable: true, get: function () { return buffer_1.Buffer; } });
/**
 * JuneoJS is middleware for interacting with Juneo node RPC APIs.
 *
 * Example usage:
 * ```js
 * const juneo: Juneo = new Juneo("127.0.0.1", 9650, "https")
 * ```
 *
 */
class Juneo extends juneo_1.default {
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
    constructor(host, port, protocol = "http", networkID = constants_1.DefaultNetworkID, XChainID = undefined, hrp = undefined, skipinit = false) {
        super(host, port, protocol);
        /**
         * Returns a reference to the Admin RPC.
         */
        this.Admin = () => this.apis.admin;
        /**
         * Returns a reference to the Auth RPC.
         */
        this.Auth = () => this.apis.auth;
        /**
         * Returns a reference to the JVM RPC pointed at the X-Chain.
         */
        this.XChain = () => this.apis.xchain;
        /**
         * Returns a reference to the Health RPC for a node.
         */
        this.Health = () => this.apis.health;
        /**
         * Returns a reference to the Index RPC for a node.
         */
        this.Index = () => this.apis.index;
        /**
         * Returns a reference to the Info RPC for a node.
         */
        this.Info = () => this.apis.info;
        /**
         * Returns a reference to the Metrics RPC.
         */
        this.Metrics = () => this.apis.metrics;
        /**
         * Returns a reference to the Keystore RPC for a node. We label it "NodeKeys" to reduce
         * confusion about what it's accessing.
         */
        this.NodeKeys = () => this.apis.keystore;
        /**
         * Returns a reference to the PlatformVM RPC pointed at the P-Chain.
         */
        this.PChain = () => this.apis.pchain;
        this.EVMChain = (name) => this.apis[`${name}`];
        this.addEVMAPI = (apiName, baseurl, blockchainID) => {
            this.apis[`${apiName}`] = new api_4.EVMAPI(this, baseurl, blockchainID);
        };
        let xchainid = XChainID;
        if (typeof XChainID === "undefined" ||
            !XChainID ||
            XChainID.toLowerCase() === "x") {
            if (networkID.toString() in constants_1.Defaults.network) {
                xchainid = constants_1.Defaults.network[`${networkID}`].X.blockchainID;
            }
            else {
                xchainid = constants_1.Defaults.network[12345].X.blockchainID;
            }
        }
        if (typeof networkID === "number" && networkID >= 0) {
            this.networkID = networkID;
        }
        else if (typeof networkID === "undefined") {
            networkID = constants_1.DefaultNetworkID;
        }
        if (typeof hrp !== "undefined") {
            this.hrp = hrp;
        }
        else {
            this.hrp = (0, helperfunctions_1.getPreferredHRP)(this.networkID);
        }
        if (!skipinit) {
            this.addAPI("admin", api_1.AdminAPI);
            this.addAPI("auth", api_2.AuthAPI);
            this.addAPI("xchain", api_3.JVMAPI, "/ext/bc/X", xchainid);
            this.addAPI("health", api_5.HealthAPI);
            this.addAPI("info", api_7.InfoAPI);
            this.addAPI("index", api_6.IndexAPI);
            this.addAPI("keystore", api_8.KeystoreAPI);
            this.addAPI("metrics", api_9.MetricsAPI);
            this.addAPI("pchain", api_10.PlatformVMAPI);
        }
    }
}
exports.default = Juneo;
exports.Juneo = Juneo;
exports.admin = __importStar(require("./apis/admin"));
exports.auth = __importStar(require("./apis/auth"));
exports.jvm = __importStar(require("./apis/jvm"));
exports.common = __importStar(require("./common"));
exports.evm = __importStar(require("./apis/evm"));
exports.health = __importStar(require("./apis/health"));
exports.index = __importStar(require("./apis/index"));
exports.info = __importStar(require("./apis/info"));
exports.keystore = __importStar(require("./apis/keystore"));
exports.metrics = __importStar(require("./apis/metrics"));
exports.platformvm = __importStar(require("./apis/platformvm"));
exports.utils = __importStar(require("./utils"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvREFBK0I7QUFvSnRCLG9CQXBKRixlQUFTLENBb0pFO0FBbkpsQiwwQ0FBMkM7QUFDM0MseUNBQXlDO0FBQ3pDLHdDQUF1QztBQUN2Qyx3Q0FBdUM7QUFDdkMsMERBQXNEO0FBcUo3Qyw2RkFySkEsMkJBQVksT0FxSkE7QUFwSnJCLHdEQUFvRDtBQXFKM0MsNEZBckpBLHlCQUFXLE9BcUpBO0FBcEpwQiwyQ0FBNkM7QUFDN0MsMENBQTJDO0FBQzNDLHlDQUF5QztBQUN6Qyw2Q0FBaUQ7QUFDakQsNENBQStDO0FBQy9DLGdEQUFxRDtBQUNyRCxpREFBNkM7QUFpSnBDLHVGQWpKQSxlQUFNLE9BaUpBO0FBaEpmLGlEQUE4RDtBQUM5RCw2REFBeUQ7QUFDekQsZ0VBQXVDO0FBcUk5QixtQkFySUYsa0JBQVEsQ0FxSUU7QUFwSWpCLG9EQUEyQjtBQXVJbEIsYUF2SUYsWUFBRSxDQXVJRTtBQXRJWCxnRUFBdUM7QUEwSTlCLG1CQTFJRixrQkFBUSxDQTBJRTtBQXpJakIsNERBQW1DO0FBMEkxQixpQkExSUYsZ0JBQU0sQ0EwSUU7QUF6SWYsNERBQW1DO0FBcUkxQixpQkFySUYsZ0JBQU0sQ0FxSUU7QUFwSWYsa0RBQXNCO0FBaUliLGFBaklGLGVBQUUsQ0FpSUU7QUFoSVgsb0NBQWdDO0FBaUl2Qix1RkFqSUEsZUFBTSxPQWlJQTtBQS9IZjs7Ozs7Ozs7R0FRRztBQUNILE1BQXFCLEtBQU0sU0FBUSxlQUFTO0lBcUQxQzs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxZQUNFLElBQWEsRUFDYixJQUFhLEVBQ2IsV0FBbUIsTUFBTSxFQUN6QixZQUFvQiw0QkFBZ0IsRUFDcEMsV0FBbUIsU0FBUyxFQUM1QixNQUFjLFNBQVMsRUFDdkIsV0FBb0IsS0FBSztRQUV6QixLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQTtRQTFFN0I7O1dBRUc7UUFDSCxVQUFLLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFpQixDQUFBO1FBRXpDOztXQUVHO1FBQ0gsU0FBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBZSxDQUFBO1FBRXRDOztXQUVHO1FBQ0gsV0FBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBZ0IsQ0FBQTtRQUV6Qzs7V0FFRztRQUNILFdBQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQW1CLENBQUE7UUFFNUM7O1dBRUc7UUFDSCxVQUFLLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFpQixDQUFBO1FBRXpDOztXQUVHO1FBQ0gsU0FBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBZSxDQUFBO1FBRXRDOztXQUVHO1FBQ0gsWUFBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBcUIsQ0FBQTtRQUUvQzs7O1dBR0c7UUFDSCxhQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUF1QixDQUFBO1FBRWxEOztXQUVHO1FBQ0gsV0FBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBdUIsQ0FBQTtRQUVoRCxhQUFRLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBVyxDQUFBO1FBRTNELGNBQVMsR0FBRyxDQUFDLE9BQWUsRUFBRSxPQUFlLEVBQUUsWUFBb0IsRUFBRSxFQUFFO1lBQ3JFLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksWUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUE7UUFDbkUsQ0FBQyxDQUFBO1FBeUJDLElBQUksUUFBUSxHQUFXLFFBQVEsQ0FBQTtRQUUvQixJQUNFLE9BQU8sUUFBUSxLQUFLLFdBQVc7WUFDL0IsQ0FBQyxRQUFRO1lBQ1QsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLEdBQUcsRUFDOUI7WUFDQSxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxvQkFBUSxDQUFDLE9BQU8sRUFBRTtnQkFDNUMsUUFBUSxHQUFHLG9CQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFBO2FBQzNEO2lCQUFNO2dCQUNMLFFBQVEsR0FBRyxvQkFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFBO2FBQ2xEO1NBQ0Y7UUFDRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxTQUFTLElBQUksQ0FBQyxFQUFFO1lBQ25ELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO1NBQzNCO2FBQU0sSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLEVBQUU7WUFDM0MsU0FBUyxHQUFHLDRCQUFnQixDQUFBO1NBQzdCO1FBQ0QsSUFBSSxPQUFPLEdBQUcsS0FBSyxXQUFXLEVBQUU7WUFDOUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7U0FDZjthQUFNO1lBQ0wsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFBLGlDQUFlLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1NBQzNDO1FBRUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQVEsQ0FBQyxDQUFBO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGFBQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFlBQU0sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsZUFBUyxDQUFDLENBQUE7WUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsYUFBTyxDQUFDLENBQUE7WUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsY0FBUSxDQUFDLENBQUE7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsaUJBQVcsQ0FBQyxDQUFBO1lBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLGdCQUFVLENBQUMsQ0FBQTtZQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxvQkFBYSxDQUFDLENBQUE7U0FDckM7SUFDSCxDQUFDO0NBQ0Y7QUFoSEQsd0JBZ0hDO0FBRVEsc0JBQUs7QUFhZCxzREFBcUM7QUFDckMsb0RBQW1DO0FBQ25DLGtEQUFpQztBQUNqQyxtREFBa0M7QUFDbEMsa0RBQWlDO0FBQ2pDLHdEQUF1QztBQUN2QyxzREFBcUM7QUFDckMsb0RBQW1DO0FBQ25DLDREQUEyQztBQUMzQywwREFBeUM7QUFDekMsZ0VBQStDO0FBQy9DLGlEQUFnQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBKdW5lb1xyXG4gKi9cclxuaW1wb3J0IEp1bmVvQ29yZSBmcm9tIFwiLi9qdW5lb1wiXHJcbmltcG9ydCB7IEFkbWluQVBJIH0gZnJvbSBcIi4vYXBpcy9hZG1pbi9hcGlcIlxyXG5pbXBvcnQgeyBBdXRoQVBJIH0gZnJvbSBcIi4vYXBpcy9hdXRoL2FwaVwiXHJcbmltcG9ydCB7IEpWTUFQSSB9IGZyb20gXCIuL2FwaXMvanZtL2FwaVwiXHJcbmltcG9ydCB7IEVWTUFQSSB9IGZyb20gXCIuL2FwaXMvZXZtL2FwaVwiXHJcbmltcG9ydCB7IEdlbmVzaXNBc3NldCB9IGZyb20gXCIuL2FwaXMvanZtL2dlbmVzaXNhc3NldFwiXHJcbmltcG9ydCB7IEdlbmVzaXNEYXRhIH0gZnJvbSBcIi4vYXBpcy9qdm0vZ2VuZXNpc2RhdGFcIlxyXG5pbXBvcnQgeyBIZWFsdGhBUEkgfSBmcm9tIFwiLi9hcGlzL2hlYWx0aC9hcGlcIlxyXG5pbXBvcnQgeyBJbmRleEFQSSB9IGZyb20gXCIuL2FwaXMvaW5kZXgvYXBpXCJcclxuaW1wb3J0IHsgSW5mb0FQSSB9IGZyb20gXCIuL2FwaXMvaW5mby9hcGlcIlxyXG5pbXBvcnQgeyBLZXlzdG9yZUFQSSB9IGZyb20gXCIuL2FwaXMva2V5c3RvcmUvYXBpXCJcclxuaW1wb3J0IHsgTWV0cmljc0FQSSB9IGZyb20gXCIuL2FwaXMvbWV0cmljcy9hcGlcIlxyXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQVBJIH0gZnJvbSBcIi4vYXBpcy9wbGF0Zm9ybXZtL2FwaVwiXHJcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gXCIuL2FwaXMvc29ja2V0L3NvY2tldFwiXHJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQsIERlZmF1bHRzIH0gZnJvbSBcIi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgZ2V0UHJlZmVycmVkSFJQIH0gZnJvbSBcIi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IERCIGZyb20gXCIuL3V0aWxzL2RiXCJcclxuaW1wb3J0IE1uZW1vbmljIGZyb20gXCIuL3V0aWxzL21uZW1vbmljXCJcclxuaW1wb3J0IFB1YlN1YiBmcm9tIFwiLi91dGlscy9wdWJzdWJcIlxyXG5pbXBvcnQgSEROb2RlIGZyb20gXCIuL3V0aWxzL2hkbm9kZVwiXHJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcblxyXG4vKipcclxuICogSnVuZW9KUyBpcyBtaWRkbGV3YXJlIGZvciBpbnRlcmFjdGluZyB3aXRoIEp1bmVvIG5vZGUgUlBDIEFQSXMuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYGpzXHJcbiAqIGNvbnN0IGp1bmVvOiBKdW5lbyA9IG5ldyBKdW5lbyhcIjEyNy4wLjAuMVwiLCA5NjUwLCBcImh0dHBzXCIpXHJcbiAqIGBgYFxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSnVuZW8gZXh0ZW5kcyBKdW5lb0NvcmUge1xyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEFkbWluIFJQQy5cclxuICAgKi9cclxuICBBZG1pbiA9ICgpID0+IHRoaXMuYXBpcy5hZG1pbiBhcyBBZG1pbkFQSVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBBdXRoIFJQQy5cclxuICAgKi9cclxuICBBdXRoID0gKCkgPT4gdGhpcy5hcGlzLmF1dGggYXMgQXV0aEFQSVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBKVk0gUlBDIHBvaW50ZWQgYXQgdGhlIFgtQ2hhaW4uXHJcbiAgICovXHJcbiAgWENoYWluID0gKCkgPT4gdGhpcy5hcGlzLnhjaGFpbiBhcyBKVk1BUElcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgSGVhbHRoIFJQQyBmb3IgYSBub2RlLlxyXG4gICAqL1xyXG4gIEhlYWx0aCA9ICgpID0+IHRoaXMuYXBpcy5oZWFsdGggYXMgSGVhbHRoQVBJXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEluZGV4IFJQQyBmb3IgYSBub2RlLlxyXG4gICAqL1xyXG4gIEluZGV4ID0gKCkgPT4gdGhpcy5hcGlzLmluZGV4IGFzIEluZGV4QVBJXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEluZm8gUlBDIGZvciBhIG5vZGUuXHJcbiAgICovXHJcbiAgSW5mbyA9ICgpID0+IHRoaXMuYXBpcy5pbmZvIGFzIEluZm9BUElcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgTWV0cmljcyBSUEMuXHJcbiAgICovXHJcbiAgTWV0cmljcyA9ICgpID0+IHRoaXMuYXBpcy5tZXRyaWNzIGFzIE1ldHJpY3NBUElcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgS2V5c3RvcmUgUlBDIGZvciBhIG5vZGUuIFdlIGxhYmVsIGl0IFwiTm9kZUtleXNcIiB0byByZWR1Y2VcclxuICAgKiBjb25mdXNpb24gYWJvdXQgd2hhdCBpdCdzIGFjY2Vzc2luZy5cclxuICAgKi9cclxuICBOb2RlS2V5cyA9ICgpID0+IHRoaXMuYXBpcy5rZXlzdG9yZSBhcyBLZXlzdG9yZUFQSVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBQbGF0Zm9ybVZNIFJQQyBwb2ludGVkIGF0IHRoZSBQLUNoYWluLlxyXG4gICAqL1xyXG4gIFBDaGFpbiA9ICgpID0+IHRoaXMuYXBpcy5wY2hhaW4gYXMgUGxhdGZvcm1WTUFQSVxyXG5cclxuICBFVk1DaGFpbiA9IChuYW1lOiBzdHJpbmcpID0+IHRoaXMuYXBpc1tgJHtuYW1lfWBdIGFzIEVWTUFQSVxyXG5cclxuICBhZGRFVk1BUEkgPSAoYXBpTmFtZTogc3RyaW5nLCBiYXNldXJsOiBzdHJpbmcsIGJsb2NrY2hhaW5JRDogc3RyaW5nKSA9PiB7XHJcbiAgICB0aGlzLmFwaXNbYCR7YXBpTmFtZX1gXSA9IG5ldyBFVk1BUEkodGhpcywgYmFzZXVybCwgYmxvY2tjaGFpbklEKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBKdW5lbyBpbnN0YW5jZS4gU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBKdW5lbyBDbGllbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgSnVuZW8gQ2xpZW50IFJQQyBBUElzXHJcbiAgICogQHBhcmFtIHBvcnQgVGhlIHBvcnQgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgSnVuZW8gQ2xpZW50IFJQQyBBUElzXHJcbiAgICogQHBhcmFtIHByb3RvY29sIFRoZSBwcm90b2NvbCBzdHJpbmcgdG8gdXNlIGJlZm9yZSBhIFwiOi8vXCIgaW4gYSByZXF1ZXN0LFxyXG4gICAqIGV4OiBcImh0dHBcIiwgXCJodHRwc1wiLCBcImdpdFwiLCBcIndzXCIsIGV0Yy4gRGVmYXVsdHMgdG8gaHR0cFxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgU2V0cyB0aGUgTmV0d29ya0lEIG9mIHRoZSBjbGFzcy4gRGVmYXVsdCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBYQ2hhaW5JRCBTZXRzIHRoZSBibG9ja2NoYWluSUQgZm9yIHRoZSBKVk0uIFdpbGwgdHJ5IHRvIGF1dG8tZGV0ZWN0LFxyXG4gICAqIG90aGVyd2lzZSBkZWZhdWx0IFwiMnc0NnlDbXg4anNuR1dWZnVocUE0bThXRTdodWhWYnV2QWVtQWVaVXo0SFNxeW5mYURcIlxyXG4gICAqIEBwYXJhbSBocnAgVGhlIGh1bWFuLXJlYWRhYmxlIHBhcnQgb2YgdGhlIGJlY2gzMiBhZGRyZXNzZXNcclxuICAgKiBAcGFyYW0gc2tpcGluaXQgU2tpcHMgY3JlYXRpbmcgdGhlIEFQSXMuIERlZmF1bHRzIHRvIGZhbHNlXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBob3N0Pzogc3RyaW5nLFxyXG4gICAgcG9ydD86IG51bWJlcixcclxuICAgIHByb3RvY29sOiBzdHJpbmcgPSBcImh0dHBcIixcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIFhDaGFpbklEOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICBocnA6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIHNraXBpbml0OiBib29sZWFuID0gZmFsc2VcclxuICApIHtcclxuICAgIHN1cGVyKGhvc3QsIHBvcnQsIHByb3RvY29sKVxyXG4gICAgbGV0IHhjaGFpbmlkOiBzdHJpbmcgPSBYQ2hhaW5JRFxyXG5cclxuICAgIGlmIChcclxuICAgICAgdHlwZW9mIFhDaGFpbklEID09PSBcInVuZGVmaW5lZFwiIHx8XHJcbiAgICAgICFYQ2hhaW5JRCB8fFxyXG4gICAgICBYQ2hhaW5JRC50b0xvd2VyQ2FzZSgpID09PSBcInhcIlxyXG4gICAgKSB7XHJcbiAgICAgIGlmIChuZXR3b3JrSUQudG9TdHJpbmcoKSBpbiBEZWZhdWx0cy5uZXR3b3JrKSB7XHJcbiAgICAgICAgeGNoYWluaWQgPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldHdvcmtJRH1gXS5YLmJsb2NrY2hhaW5JRFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHhjaGFpbmlkID0gRGVmYXVsdHMubmV0d29ya1sxMjM0NV0uWC5ibG9ja2NoYWluSURcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBuZXR3b3JrSUQgPT09IFwibnVtYmVyXCIgJiYgbmV0d29ya0lEID49IDApIHtcclxuICAgICAgdGhpcy5uZXR3b3JrSUQgPSBuZXR3b3JrSURcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5ldHdvcmtJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBuZXR3b3JrSUQgPSBEZWZhdWx0TmV0d29ya0lEXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGhycCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLmhycCA9IGhycFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5ocnAgPSBnZXRQcmVmZXJyZWRIUlAodGhpcy5uZXR3b3JrSUQpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFza2lwaW5pdCkge1xyXG4gICAgICB0aGlzLmFkZEFQSShcImFkbWluXCIsIEFkbWluQVBJKVxyXG4gICAgICB0aGlzLmFkZEFQSShcImF1dGhcIiwgQXV0aEFQSSlcclxuICAgICAgdGhpcy5hZGRBUEkoXCJ4Y2hhaW5cIiwgSlZNQVBJLCBcIi9leHQvYmMvWFwiLCB4Y2hhaW5pZClcclxuICAgICAgdGhpcy5hZGRBUEkoXCJoZWFsdGhcIiwgSGVhbHRoQVBJKVxyXG4gICAgICB0aGlzLmFkZEFQSShcImluZm9cIiwgSW5mb0FQSSlcclxuICAgICAgdGhpcy5hZGRBUEkoXCJpbmRleFwiLCBJbmRleEFQSSlcclxuICAgICAgdGhpcy5hZGRBUEkoXCJrZXlzdG9yZVwiLCBLZXlzdG9yZUFQSSlcclxuICAgICAgdGhpcy5hZGRBUEkoXCJtZXRyaWNzXCIsIE1ldHJpY3NBUEkpXHJcbiAgICAgIHRoaXMuYWRkQVBJKFwicGNoYWluXCIsIFBsYXRmb3JtVk1BUEkpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBKdW5lbyB9XHJcbmV4cG9ydCB7IEp1bmVvQ29yZSB9XHJcbmV4cG9ydCB7IEJpblRvb2xzIH1cclxuZXhwb3J0IHsgQk4gfVxyXG5leHBvcnQgeyBCdWZmZXIgfVxyXG5leHBvcnQgeyBEQiB9XHJcbmV4cG9ydCB7IEhETm9kZSB9XHJcbmV4cG9ydCB7IEdlbmVzaXNBc3NldCB9XHJcbmV4cG9ydCB7IEdlbmVzaXNEYXRhIH1cclxuZXhwb3J0IHsgTW5lbW9uaWMgfVxyXG5leHBvcnQgeyBQdWJTdWIgfVxyXG5leHBvcnQgeyBTb2NrZXQgfVxyXG5cclxuZXhwb3J0ICogYXMgYWRtaW4gZnJvbSBcIi4vYXBpcy9hZG1pblwiXHJcbmV4cG9ydCAqIGFzIGF1dGggZnJvbSBcIi4vYXBpcy9hdXRoXCJcclxuZXhwb3J0ICogYXMganZtIGZyb20gXCIuL2FwaXMvanZtXCJcclxuZXhwb3J0ICogYXMgY29tbW9uIGZyb20gXCIuL2NvbW1vblwiXHJcbmV4cG9ydCAqIGFzIGV2bSBmcm9tIFwiLi9hcGlzL2V2bVwiXHJcbmV4cG9ydCAqIGFzIGhlYWx0aCBmcm9tIFwiLi9hcGlzL2hlYWx0aFwiXHJcbmV4cG9ydCAqIGFzIGluZGV4IGZyb20gXCIuL2FwaXMvaW5kZXhcIlxyXG5leHBvcnQgKiBhcyBpbmZvIGZyb20gXCIuL2FwaXMvaW5mb1wiXHJcbmV4cG9ydCAqIGFzIGtleXN0b3JlIGZyb20gXCIuL2FwaXMva2V5c3RvcmVcIlxyXG5leHBvcnQgKiBhcyBtZXRyaWNzIGZyb20gXCIuL2FwaXMvbWV0cmljc1wiXHJcbmV4cG9ydCAqIGFzIHBsYXRmb3Jtdm0gZnJvbSBcIi4vYXBpcy9wbGF0Zm9ybXZtXCJcclxuZXhwb3J0ICogYXMgdXRpbHMgZnJvbSBcIi4vdXRpbHNcIlxyXG4iXX0=