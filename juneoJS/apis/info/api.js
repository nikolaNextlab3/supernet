"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
const bn_js_1 = __importDefault(require("bn.js"));
/**
 * Class for interacting with a node's InfoAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class InfoAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/info" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/info") {
        super(core, baseURL);
        /**
         * Fetches the blockchainID from the node for a given alias.
         *
         * @param alias The blockchain alias to get the blockchainID
         *
         * @returns Returns a Promise string containing the base 58 string representation of the blockchainID.
         */
        this.getBlockchainID = (alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                alias
            };
            const response = yield this.callMethod("info.getBlockchainID", params);
            return response.data.result.blockchainID;
        });
        /**
         * Fetches the IP address from the node.
         *
         * @returns Returns a Promise string of the node IP address.
         */
        this.getNodeIP = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getBlockchainID");
            return response.data.result.ip;
        });
        /**
         * Fetches the networkID from the node.
         *
         * @returns Returns a Promise number of the networkID.
         */
        this.getNetworkID = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNetworkID");
            return response.data.result.networkID;
        });
        /**
         * Fetches the network name this node is running on
         *
         * @returns Returns a Promise string containing the network name.
         */
        this.getNetworkName = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNetworkName");
            return response.data.result.networkName;
        });
        /**
         * Fetches the nodeID from the node.
         *
         * @returns Returns a Promise string of the nodeID.
         */
        this.getNodeID = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNodeID");
            return response.data.result.nodeID;
        });
        /**
         * Fetches the version of Gecko this node is running
         *
         * @returns Returns a Promise string containing the version of Gecko.
         */
        this.getNodeVersion = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNodeVersion");
            return response.data.result.version;
        });
        /**
         * Fetches the transaction fee from the node.
         *
         * @returns Returns a Promise object of the transaction fee in nJUNE.
         */
        this.getTxFee = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getTxFee");
            return {
                txFee: new bn_js_1.default(response.data.result.txFee, 10),
                creationTxFee: new bn_js_1.default(response.data.result.creationTxFee, 10)
            };
        });
        /**
         * Check whether a given chain is done bootstrapping
         * @param chain The ID or alias of a chain.
         *
         * @returns Returns a Promise boolean of whether the chain has completed bootstrapping.
         */
        this.isBootstrapped = (chain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                chain
            };
            const response = yield this.callMethod("info.isBootstrapped", params);
            return response.data.result.isBootstrapped;
        });
        /**
         * Returns the peers connected to the node.
         * @param nodeIDs an optional parameter to specify what nodeID's descriptions should be returned.
         * If this parameter is left empty, descriptions for all active connections will be returned.
         * If the node is not connected to a specified nodeID, it will be omitted from the response.
         *
         * @returns Promise for the list of connected peers in PeersResponse format.
         */
        this.peers = (nodeIDs = []) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                nodeIDs
            };
            const response = yield this.callMethod("info.peers", params);
            return response.data.result.peers;
        });
        /**
         * Returns the network's observed uptime of this node.
         *
         * @returns Returns a Promise UptimeResponse which contains rewardingStakePercentage and weightedAveragePercentage.
         */
        this.uptime = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.uptime");
            return response.data.result;
        });
    }
}
exports.InfoAPI = InfoAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvaW5mby9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBS0Esa0RBQThDO0FBRTlDLGtEQUFzQjtBQVV0Qjs7Ozs7O0dBTUc7QUFDSCxNQUFhLE9BQVEsU0FBUSxpQkFBTztJQTJJbEM7Ozs7O09BS0c7SUFDSCxZQUFZLElBQWUsRUFBRSxVQUFrQixXQUFXO1FBQ3hELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFqSnRCOzs7Ozs7V0FNRztRQUNILG9CQUFlLEdBQUcsQ0FBTyxLQUFhLEVBQW1CLEVBQUU7WUFDekQsTUFBTSxNQUFNLEdBQTBCO2dCQUNwQyxLQUFLO2FBQ04sQ0FBQTtZQUVELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHNCQUFzQixFQUN0QixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFBO1FBQzFDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILGNBQVMsR0FBRyxHQUEwQixFQUFFO1lBQ3RDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHNCQUFzQixDQUN2QixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUE7UUFDaEMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsaUJBQVksR0FBRyxHQUEwQixFQUFFO1lBQ3pDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELG1CQUFtQixDQUNwQixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7UUFDdkMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsbUJBQWMsR0FBRyxHQUEwQixFQUFFO1lBQzNDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixDQUN0QixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUE7UUFDekMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsY0FBUyxHQUFHLEdBQTBCLEVBQUU7WUFDdEMsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsZ0JBQWdCLENBQ2pCLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtRQUNwQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxtQkFBYyxHQUFHLEdBQTBCLEVBQUU7WUFDM0MsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQscUJBQXFCLENBQ3RCLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtRQUNyQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxhQUFRLEdBQUcsR0FBb0MsRUFBRTtZQUMvQyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1lBQzVFLE9BQU87Z0JBQ0wsS0FBSyxFQUFFLElBQUksZUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQzdDLGFBQWEsRUFBRSxJQUFJLGVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2FBQzlELENBQUE7UUFDSCxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7OztXQUtHO1FBQ0gsbUJBQWMsR0FBRyxDQUFPLEtBQWEsRUFBb0IsRUFBRTtZQUN6RCxNQUFNLE1BQU0sR0FBeUI7Z0JBQ25DLEtBQUs7YUFDTixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQscUJBQXFCLEVBQ3JCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUE7UUFDNUMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsVUFBSyxHQUFHLENBQU8sVUFBb0IsRUFBRSxFQUE0QixFQUFFO1lBQ2pFLE1BQU0sTUFBTSxHQUFnQjtnQkFDMUIsT0FBTzthQUNSLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxZQUFZLEVBQ1osTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQTtRQUNuQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxXQUFNLEdBQUcsR0FBa0MsRUFBRTtZQUMzQyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1lBQzFFLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDN0IsQ0FBQyxDQUFBLENBQUE7SUFVRCxDQUFDO0NBQ0Y7QUFwSkQsMEJBb0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1JbmZvXHJcbiAqL1xyXG5pbXBvcnQgSnVuZW9Db3JlIGZyb20gXCIuLi8uLi9qdW5lb1wiXHJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxyXG5pbXBvcnQgeyBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGliYXNlXCJcclxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXHJcbmltcG9ydCB7XHJcbiAgR2V0QmxvY2tjaGFpbklEUGFyYW1zLFxyXG4gIEdldFR4RmVlUmVzcG9uc2UsXHJcbiAgSXNCb290c3RyYXBwZWRQYXJhbXMsXHJcbiAgUGVlcnNQYXJhbXMsXHJcbiAgUGVlcnNSZXNwb25zZSxcclxuICBVcHRpbWVSZXNwb25zZVxyXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSdzIEluZm9BUEkuXHJcbiAqXHJcbiAqIEBjYXRlZ29yeSBSUENBUElzXHJcbiAqXHJcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuIEluc3RlYWQsIHVzZSB0aGUgW1tKdW5lby5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEp1bmVvLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEluZm9BUEkgZXh0ZW5kcyBKUlBDQVBJIHtcclxuICAvKipcclxuICAgKiBGZXRjaGVzIHRoZSBibG9ja2NoYWluSUQgZnJvbSB0aGUgbm9kZSBmb3IgYSBnaXZlbiBhbGlhcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbGlhcyBUaGUgYmxvY2tjaGFpbiBhbGlhcyB0byBnZXQgdGhlIGJsb2NrY2hhaW5JRFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJhc2UgNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBibG9ja2NoYWluSUQuXHJcbiAgICovXHJcbiAgZ2V0QmxvY2tjaGFpbklEID0gYXN5bmMgKGFsaWFzOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRCbG9ja2NoYWluSURQYXJhbXMgPSB7XHJcbiAgICAgIGFsaWFzXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwiaW5mby5nZXRCbG9ja2NoYWluSURcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYmxvY2tjaGFpbklEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaGVzIHRoZSBJUCBhZGRyZXNzIGZyb20gdGhlIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgb2YgdGhlIG5vZGUgSVAgYWRkcmVzcy5cclxuICAgKi9cclxuICBnZXROb2RlSVAgPSBhc3luYyAoKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImluZm8uZ2V0QmxvY2tjaGFpbklEXCJcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5pcFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2hlcyB0aGUgbmV0d29ya0lEIGZyb20gdGhlIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBudW1iZXIgb2YgdGhlIG5ldHdvcmtJRC5cclxuICAgKi9cclxuICBnZXROZXR3b3JrSUQgPSBhc3luYyAoKTogUHJvbWlzZTxudW1iZXI+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImluZm8uZ2V0TmV0d29ya0lEXCJcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5uZXR3b3JrSURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoZXMgdGhlIG5ldHdvcmsgbmFtZSB0aGlzIG5vZGUgaXMgcnVubmluZyBvblxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIG5ldHdvcmsgbmFtZS5cclxuICAgKi9cclxuICBnZXROZXR3b3JrTmFtZSA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwiaW5mby5nZXROZXR3b3JrTmFtZVwiXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQubmV0d29ya05hbWVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoZXMgdGhlIG5vZGVJRCBmcm9tIHRoZSBub2RlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIG9mIHRoZSBub2RlSUQuXHJcbiAgICovXHJcbiAgZ2V0Tm9kZUlEID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJpbmZvLmdldE5vZGVJRFwiXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQubm9kZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaGVzIHRoZSB2ZXJzaW9uIG9mIEdlY2tvIHRoaXMgbm9kZSBpcyBydW5uaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgdmVyc2lvbiBvZiBHZWNrby5cclxuICAgKi9cclxuICBnZXROb2RlVmVyc2lvbiA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwiaW5mby5nZXROb2RlVmVyc2lvblwiXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudmVyc2lvblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2hlcyB0aGUgdHJhbnNhY3Rpb24gZmVlIGZyb20gdGhlIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBvYmplY3Qgb2YgdGhlIHRyYW5zYWN0aW9uIGZlZSBpbiBuSlVORS5cclxuICAgKi9cclxuICBnZXRUeEZlZSA9IGFzeW5jICgpOiBQcm9taXNlPEdldFR4RmVlUmVzcG9uc2U+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFwiaW5mby5nZXRUeEZlZVwiKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHhGZWU6IG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC50eEZlZSwgMTApLFxyXG4gICAgICBjcmVhdGlvblR4RmVlOiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuY3JlYXRpb25UeEZlZSwgMTApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVjayB3aGV0aGVyIGEgZ2l2ZW4gY2hhaW4gaXMgZG9uZSBib290c3RyYXBwaW5nXHJcbiAgICogQHBhcmFtIGNoYWluIFRoZSBJRCBvciBhbGlhcyBvZiBhIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgYm9vbGVhbiBvZiB3aGV0aGVyIHRoZSBjaGFpbiBoYXMgY29tcGxldGVkIGJvb3RzdHJhcHBpbmcuXHJcbiAgICovXHJcbiAgaXNCb290c3RyYXBwZWQgPSBhc3luYyAoY2hhaW46IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBJc0Jvb3RzdHJhcHBlZFBhcmFtcyA9IHtcclxuICAgICAgY2hhaW5cclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImluZm8uaXNCb290c3RyYXBwZWRcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuaXNCb290c3RyYXBwZWRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBlZXJzIGNvbm5lY3RlZCB0byB0aGUgbm9kZS5cclxuICAgKiBAcGFyYW0gbm9kZUlEcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB3aGF0IG5vZGVJRCdzIGRlc2NyaXB0aW9ucyBzaG91bGQgYmUgcmV0dXJuZWQuXHJcbiAgICogSWYgdGhpcyBwYXJhbWV0ZXIgaXMgbGVmdCBlbXB0eSwgZGVzY3JpcHRpb25zIGZvciBhbGwgYWN0aXZlIGNvbm5lY3Rpb25zIHdpbGwgYmUgcmV0dXJuZWQuXHJcbiAgICogSWYgdGhlIG5vZGUgaXMgbm90IGNvbm5lY3RlZCB0byBhIHNwZWNpZmllZCBub2RlSUQsIGl0IHdpbGwgYmUgb21pdHRlZCBmcm9tIHRoZSByZXNwb25zZS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSBsaXN0IG9mIGNvbm5lY3RlZCBwZWVycyBpbiBQZWVyc1Jlc3BvbnNlIGZvcm1hdC5cclxuICAgKi9cclxuICBwZWVycyA9IGFzeW5jIChub2RlSURzOiBzdHJpbmdbXSA9IFtdKTogUHJvbWlzZTxQZWVyc1Jlc3BvbnNlW10+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogUGVlcnNQYXJhbXMgPSB7XHJcbiAgICAgIG5vZGVJRHNcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImluZm8ucGVlcnNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQucGVlcnNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG5ldHdvcmsncyBvYnNlcnZlZCB1cHRpbWUgb2YgdGhpcyBub2RlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgVXB0aW1lUmVzcG9uc2Ugd2hpY2ggY29udGFpbnMgcmV3YXJkaW5nU3Rha2VQZXJjZW50YWdlIGFuZCB3ZWlnaHRlZEF2ZXJhZ2VQZXJjZW50YWdlLlxyXG4gICAqL1xyXG4gIHVwdGltZSA9IGFzeW5jICgpOiBQcm9taXNlPFVwdGltZVJlc3BvbnNlPiA9PiB7XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcImluZm8udXB0aW1lXCIpXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0p1bmVvLmFkZEFQSV1dIG1ldGhvZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb3JlIEEgcmVmZXJlbmNlIHRvIHRoZSBKdW5lbyBjbGFzc1xyXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L2luZm9cIiBhcyB0aGUgcGF0aCB0byBycGMncyBiYXNlVVJMXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29yZTogSnVuZW9Db3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvaW5mb1wiKSB7XHJcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxyXG4gIH1cclxufVxyXG4iXX0=