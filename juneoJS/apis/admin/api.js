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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's AdminAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called.
 * Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class AdminAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]]
     * method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/admin" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/admin") {
        super(core, baseURL);
        /**
         * Assign an API an alias, a different endpoint for the API. The original endpoint will still
         * work. This change only affects this node other nodes will not know about this alias.
         *
         * @param endpoint The original endpoint of the API. endpoint should only include the part of
         * the endpoint after /ext/
         * @param alias The API being aliased can now be called at ext/alias
         *
         * @returns Returns a Promise boolean containing success, true for success, false for failure.
         */
        this.alias = (endpoint, alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                endpoint,
                alias
            };
            const response = yield this.callMethod("admin.alias", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Give a blockchain an alias, a different name that can be used any place the blockchain’s
         * ID is used.
         *
         * @param chain The blockchain’s ID
         * @param alias Can now be used in place of the blockchain’s ID (in API endpoints, for example)
         *
         * @returns Returns a Promise boolean containing success, true for success, false for failure.
         */
        this.aliasChain = (chain, alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                chain,
                alias
            };
            const response = yield this.callMethod("admin.aliasChain", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Get all aliases for given blockchain
         *
         * @param chain The blockchain’s ID
         *
         * @returns Returns a Promise string[] containing aliases of the blockchain.
         */
        this.getChainAliases = (chain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                chain
            };
            const response = yield this.callMethod("admin.getChainAliases", params);
            return response.data.result.aliases
                ? response.data.result.aliases
                : response.data.result;
        });
        /**
         * Returns log and display levels of loggers
         *
         * @param loggerName the name of the logger to be returned. This is an optional argument. If not specified, it returns all possible loggers.
         *
         * @returns Returns a Promise containing logger levels
         */
        this.getLoggerLevel = (loggerName) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof loggerName !== "undefined") {
                params.loggerName = loggerName;
            }
            const response = yield this.callMethod("admin.getLoggerLevel", params);
            return response.data.result;
        });
        /**
         * Dynamically loads any virtual machines installed on the node as plugins
         *
         * @returns Returns a Promise containing new VMs and failed VMs
         */
        this.loadVMs = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.loadVMs");
            return response.data.result.aliases
                ? response.data.result.aliases
                : response.data.result;
        });
        /**
         * Dump the mutex statistics of the node to the specified file.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.lockProfile = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.lockProfile");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Dump the current memory footprint of the node to the specified file.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.memoryProfile = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.memoryProfile");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Sets log and display levels of loggers.
         *
         * @param loggerName the name of the logger to be changed. This is an optional parameter.
         * @param logLevel the log level of written logs, can be omitted.
         * @param displayLevel the log level of displayed logs, can be omitted.
         *
         * @returns Returns a Promise containing logger levels
         */
        this.setLoggerLevel = (loggerName, logLevel, displayLevel) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof loggerName !== "undefined") {
                params.loggerName = loggerName;
            }
            if (typeof logLevel !== "undefined") {
                params.logLevel = logLevel;
            }
            if (typeof displayLevel !== "undefined") {
                params.displayLevel = displayLevel;
            }
            const response = yield this.callMethod("admin.setLoggerLevel", params);
            return response.data.result;
        });
        /**
         * Start profiling the cpu utilization of the node. Will dump the profile information into
         * the specified file on stop.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.startCPUProfiler = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.startCPUProfiler");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Stop the CPU profile that was previously started.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.stopCPUProfiler = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.stopCPUProfiler");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
    }
}
exports.AdminAPI = AdminAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYWRtaW4vYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUE4QztBQWE5Qzs7Ozs7OztHQU9HO0FBRUgsTUFBYSxRQUFTLFNBQVEsaUJBQU87SUE2TG5DOzs7Ozs7T0FNRztJQUNILFlBQVksSUFBZSxFQUFFLFVBQWtCLFlBQVk7UUFDekQsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQXBNdEI7Ozs7Ozs7OztXQVNHO1FBQ0gsVUFBSyxHQUFHLENBQU8sUUFBZ0IsRUFBRSxLQUFhLEVBQW9CLEVBQUU7WUFDbEUsTUFBTSxNQUFNLEdBQWdCO2dCQUMxQixRQUFRO2dCQUNSLEtBQUs7YUFDTixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsYUFBYSxFQUNiLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUNqQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7O1dBUUc7UUFDSCxlQUFVLEdBQUcsQ0FBTyxLQUFhLEVBQUUsS0FBYSxFQUFvQixFQUFFO1lBQ3BFLE1BQU0sTUFBTSxHQUFxQjtnQkFDL0IsS0FBSztnQkFDTCxLQUFLO2FBQ04sQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELGtCQUFrQixFQUNsQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7V0FNRztRQUNILG9CQUFlLEdBQUcsQ0FBTyxLQUFhLEVBQXFCLEVBQUU7WUFDM0QsTUFBTSxNQUFNLEdBQTBCO2dCQUNwQyxLQUFLO2FBQ04sQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHVCQUF1QixFQUN2QixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7V0FNRztRQUNILG1CQUFjLEdBQUcsQ0FDZixVQUFtQixFQUNjLEVBQUU7WUFDbkMsTUFBTSxNQUFNLEdBQXlCLEVBQUUsQ0FBQTtZQUN2QyxJQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtnQkFDckMsTUFBTSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7YUFDL0I7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxzQkFBc0IsRUFDdEIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzdCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILFlBQU8sR0FBRyxHQUFtQyxFQUFFO1lBQzdDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDNUUsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUNqQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILGdCQUFXLEdBQUcsR0FBMkIsRUFBRTtZQUN6QyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxtQkFBbUIsQ0FDcEIsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxrQkFBYSxHQUFHLEdBQTJCLEVBQUU7WUFDM0MsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQscUJBQXFCLENBQ3RCLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQ2pDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUM5QixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDMUIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7V0FRRztRQUNILG1CQUFjLEdBQUcsQ0FDZixVQUFtQixFQUNuQixRQUFpQixFQUNqQixZQUFxQixFQUNZLEVBQUU7WUFDbkMsTUFBTSxNQUFNLEdBQXlCLEVBQUUsQ0FBQTtZQUN2QyxJQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtnQkFDckMsTUFBTSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7YUFDL0I7WUFDRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFdBQVcsRUFBRTtnQkFDbkMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7YUFDM0I7WUFDRCxJQUFJLE9BQU8sWUFBWSxLQUFLLFdBQVcsRUFBRTtnQkFDdkMsTUFBTSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7YUFDbkM7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxzQkFBc0IsRUFDdEIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzdCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7O1dBS0c7UUFDSCxxQkFBZ0IsR0FBRyxHQUEyQixFQUFFO1lBQzlDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHdCQUF3QixDQUN6QixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUNqQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILG9CQUFlLEdBQUcsR0FBMkIsRUFBRTtZQUM3QyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx1QkFBdUIsQ0FDeEIsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtJQVdELENBQUM7Q0FDRjtBQXZNRCw0QkF1TUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLUFkbWluXHJcbiAqL1xyXG5pbXBvcnQgSnVuZW9Db3JlIGZyb20gXCIuLi8uLi9qdW5lb1wiXHJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxyXG5pbXBvcnQgeyBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGliYXNlXCJcclxuaW1wb3J0IHtcclxuICBBbGlhc0NoYWluUGFyYW1zLFxyXG4gIEFsaWFzUGFyYW1zLFxyXG4gIEdldENoYWluQWxpYXNlc1BhcmFtcyxcclxuICBHZXRMb2dnZXJMZXZlbFBhcmFtcyxcclxuICBHZXRMb2dnZXJMZXZlbFJlc3BvbnNlLFxyXG4gIExvYWRWTXNSZXNwb25zZSxcclxuICBTZXRMb2dnZXJMZXZlbFBhcmFtcyxcclxuICBTZXRMb2dnZXJMZXZlbFJlc3BvbnNlXHJcbn0gZnJvbSBcIi4vaW50ZXJmYWNlc1wiXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggYSBub2RlJ3MgQWRtaW5BUEkuXHJcbiAqXHJcbiAqIEBjYXRlZ29yeSBSUENBUElzXHJcbiAqXHJcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuXHJcbiAqIEluc3RlYWQsIHVzZSB0aGUgW1tKdW5lby5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEp1bmVvLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBBZG1pbkFQSSBleHRlbmRzIEpSUENBUEkge1xyXG4gIC8qKlxyXG4gICAqIEFzc2lnbiBhbiBBUEkgYW4gYWxpYXMsIGEgZGlmZmVyZW50IGVuZHBvaW50IGZvciB0aGUgQVBJLiBUaGUgb3JpZ2luYWwgZW5kcG9pbnQgd2lsbCBzdGlsbFxyXG4gICAqIHdvcmsuIFRoaXMgY2hhbmdlIG9ubHkgYWZmZWN0cyB0aGlzIG5vZGUgb3RoZXIgbm9kZXMgd2lsbCBub3Qga25vdyBhYm91dCB0aGlzIGFsaWFzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGVuZHBvaW50IFRoZSBvcmlnaW5hbCBlbmRwb2ludCBvZiB0aGUgQVBJLiBlbmRwb2ludCBzaG91bGQgb25seSBpbmNsdWRlIHRoZSBwYXJ0IG9mXHJcbiAgICogdGhlIGVuZHBvaW50IGFmdGVyIC9leHQvXHJcbiAgICogQHBhcmFtIGFsaWFzIFRoZSBBUEkgYmVpbmcgYWxpYXNlZCBjYW4gbm93IGJlIGNhbGxlZCBhdCBleHQvYWxpYXNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGJvb2xlYW4gY29udGFpbmluZyBzdWNjZXNzLCB0cnVlIGZvciBzdWNjZXNzLCBmYWxzZSBmb3IgZmFpbHVyZS5cclxuICAgKi9cclxuICBhbGlhcyA9IGFzeW5jIChlbmRwb2ludDogc3RyaW5nLCBhbGlhczogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEFsaWFzUGFyYW1zID0ge1xyXG4gICAgICBlbmRwb2ludCxcclxuICAgICAgYWxpYXNcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImFkbWluLmFsaWFzXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmUgYSBibG9ja2NoYWluIGFuIGFsaWFzLCBhIGRpZmZlcmVudCBuYW1lIHRoYXQgY2FuIGJlIHVzZWQgYW55IHBsYWNlIHRoZSBibG9ja2NoYWlu4oCZc1xyXG4gICAqIElEIGlzIHVzZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2hhaW4gVGhlIGJsb2NrY2hhaW7igJlzIElEXHJcbiAgICogQHBhcmFtIGFsaWFzIENhbiBub3cgYmUgdXNlZCBpbiBwbGFjZSBvZiB0aGUgYmxvY2tjaGFpbuKAmXMgSUQgKGluIEFQSSBlbmRwb2ludHMsIGZvciBleGFtcGxlKVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgYm9vbGVhbiBjb250YWluaW5nIHN1Y2Nlc3MsIHRydWUgZm9yIHN1Y2Nlc3MsIGZhbHNlIGZvciBmYWlsdXJlLlxyXG4gICAqL1xyXG4gIGFsaWFzQ2hhaW4gPSBhc3luYyAoY2hhaW46IHN0cmluZywgYWxpYXM6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBBbGlhc0NoYWluUGFyYW1zID0ge1xyXG4gICAgICBjaGFpbixcclxuICAgICAgYWxpYXNcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImFkbWluLmFsaWFzQ2hhaW5cIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xyXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcclxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGFsbCBhbGlhc2VzIGZvciBnaXZlbiBibG9ja2NoYWluXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2hhaW4gVGhlIGJsb2NrY2hhaW7igJlzIElEXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmdbXSBjb250YWluaW5nIGFsaWFzZXMgb2YgdGhlIGJsb2NrY2hhaW4uXHJcbiAgICovXHJcbiAgZ2V0Q2hhaW5BbGlhc2VzID0gYXN5bmMgKGNoYWluOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEdldENoYWluQWxpYXNlc1BhcmFtcyA9IHtcclxuICAgICAgY2hhaW5cclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImFkbWluLmdldENoYWluQWxpYXNlc1wiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hbGlhc2VzXHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWxpYXNlc1xyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGxvZyBhbmQgZGlzcGxheSBsZXZlbHMgb2YgbG9nZ2Vyc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIGxvZ2dlck5hbWUgdGhlIG5hbWUgb2YgdGhlIGxvZ2dlciB0byBiZSByZXR1cm5lZC4gVGhpcyBpcyBhbiBvcHRpb25hbCBhcmd1bWVudC4gSWYgbm90IHNwZWNpZmllZCwgaXQgcmV0dXJucyBhbGwgcG9zc2libGUgbG9nZ2Vycy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGNvbnRhaW5pbmcgbG9nZ2VyIGxldmVsc1xyXG4gICAqL1xyXG4gIGdldExvZ2dlckxldmVsID0gYXN5bmMgKFxyXG4gICAgbG9nZ2VyTmFtZT86IHN0cmluZ1xyXG4gICk6IFByb21pc2U8R2V0TG9nZ2VyTGV2ZWxSZXNwb25zZT4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRMb2dnZXJMZXZlbFBhcmFtcyA9IHt9XHJcbiAgICBpZiAodHlwZW9mIGxvZ2dlck5hbWUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgcGFyYW1zLmxvZ2dlck5hbWUgPSBsb2dnZXJOYW1lXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJhZG1pbi5nZXRMb2dnZXJMZXZlbFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHluYW1pY2FsbHkgbG9hZHMgYW55IHZpcnR1YWwgbWFjaGluZXMgaW5zdGFsbGVkIG9uIHRoZSBub2RlIGFzIHBsdWdpbnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGNvbnRhaW5pbmcgbmV3IFZNcyBhbmQgZmFpbGVkIFZNc1xyXG4gICAqL1xyXG4gIGxvYWRWTXMgPSBhc3luYyAoKTogUHJvbWlzZTxMb2FkVk1zUmVzcG9uc2U+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFwiYWRtaW4ubG9hZFZNc1wiKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFsaWFzZXNcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5hbGlhc2VzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIER1bXAgdGhlIG11dGV4IHN0YXRpc3RpY3Mgb2YgdGhlIG5vZGUgdG8gdGhlIHNwZWNpZmllZCBmaWxlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBib29sZWFuIHRoYXQgaXMgdHJ1ZSBvbiBzdWNjZXNzLlxyXG4gICAqL1xyXG4gIGxvY2tQcm9maWxlID0gYXN5bmMgKCk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwiYWRtaW4ubG9ja1Byb2ZpbGVcIlxyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIER1bXAgdGhlIGN1cnJlbnQgbWVtb3J5IGZvb3RwcmludCBvZiB0aGUgbm9kZSB0byB0aGUgc3BlY2lmaWVkIGZpbGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJvb2xlYW4gdGhhdCBpcyB0cnVlIG9uIHN1Y2Nlc3MuXHJcbiAgICovXHJcbiAgbWVtb3J5UHJvZmlsZSA9IGFzeW5jICgpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImFkbWluLm1lbW9yeVByb2ZpbGVcIlxyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgbG9nIGFuZCBkaXNwbGF5IGxldmVscyBvZiBsb2dnZXJzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGxvZ2dlck5hbWUgdGhlIG5hbWUgb2YgdGhlIGxvZ2dlciB0byBiZSBjaGFuZ2VkLiBUaGlzIGlzIGFuIG9wdGlvbmFsIHBhcmFtZXRlci5cclxuICAgKiBAcGFyYW0gbG9nTGV2ZWwgdGhlIGxvZyBsZXZlbCBvZiB3cml0dGVuIGxvZ3MsIGNhbiBiZSBvbWl0dGVkLlxyXG4gICAqIEBwYXJhbSBkaXNwbGF5TGV2ZWwgdGhlIGxvZyBsZXZlbCBvZiBkaXNwbGF5ZWQgbG9ncywgY2FuIGJlIG9taXR0ZWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBjb250YWluaW5nIGxvZ2dlciBsZXZlbHNcclxuICAgKi9cclxuICBzZXRMb2dnZXJMZXZlbCA9IGFzeW5jIChcclxuICAgIGxvZ2dlck5hbWU/OiBzdHJpbmcsXHJcbiAgICBsb2dMZXZlbD86IHN0cmluZyxcclxuICAgIGRpc3BsYXlMZXZlbD86IHN0cmluZ1xyXG4gICk6IFByb21pc2U8U2V0TG9nZ2VyTGV2ZWxSZXNwb25zZT4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBTZXRMb2dnZXJMZXZlbFBhcmFtcyA9IHt9XHJcbiAgICBpZiAodHlwZW9mIGxvZ2dlck5hbWUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgcGFyYW1zLmxvZ2dlck5hbWUgPSBsb2dnZXJOYW1lXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGxvZ0xldmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtcy5sb2dMZXZlbCA9IGxvZ0xldmVsXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGRpc3BsYXlMZXZlbCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBwYXJhbXMuZGlzcGxheUxldmVsID0gZGlzcGxheUxldmVsXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJhZG1pbi5zZXRMb2dnZXJMZXZlbFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RhcnQgcHJvZmlsaW5nIHRoZSBjcHUgdXRpbGl6YXRpb24gb2YgdGhlIG5vZGUuIFdpbGwgZHVtcCB0aGUgcHJvZmlsZSBpbmZvcm1hdGlvbiBpbnRvXHJcbiAgICogdGhlIHNwZWNpZmllZCBmaWxlIG9uIHN0b3AuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJvb2xlYW4gdGhhdCBpcyB0cnVlIG9uIHN1Y2Nlc3MuXHJcbiAgICovXHJcbiAgc3RhcnRDUFVQcm9maWxlciA9IGFzeW5jICgpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImFkbWluLnN0YXJ0Q1BVUHJvZmlsZXJcIlxyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0b3AgdGhlIENQVSBwcm9maWxlIHRoYXQgd2FzIHByZXZpb3VzbHkgc3RhcnRlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgYm9vbGVhbiB0aGF0IGlzIHRydWUgb24gc3VjY2Vzcy5cclxuICAgKi9cclxuICBzdG9wQ1BVUHJvZmlsZXIgPSBhc3luYyAoKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJhZG1pbi5zdG9wQ1BVUHJvZmlsZXJcIlxyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0p1bmVvLmFkZEFQSV1dXHJcbiAgICogbWV0aG9kLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEp1bmVvIGNsYXNzXHJcbiAgICogQHBhcmFtIGJhc2VVUkwgRGVmYXVsdHMgdG8gdGhlIHN0cmluZyBcIi9leHQvYWRtaW5cIiBhcyB0aGUgcGF0aCB0byBycGMncyBiYXNlVVJMXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29yZTogSnVuZW9Db3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvYWRtaW5cIikge1xyXG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcclxuICB9XHJcbn1cclxuIl19