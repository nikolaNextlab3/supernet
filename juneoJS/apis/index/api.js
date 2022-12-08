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
exports.IndexAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's IndexAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class IndexAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/index/X/tx" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/index/X/tx") {
        super(core, baseURL);
        /**
         * Get last accepted tx, vtx or block
         *
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetLastAcceptedResponse.
         */
        this.getLastAccepted = (encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                encoding
            };
            try {
                const response = yield this.callMethod("index.getLastAccepted", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get container by index
         *
         * @param index
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerByIndexResponse.
         */
        this.getContainerByIndex = (index = "0", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                index,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerByIndex", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get contrainer by ID
         *
         * @param id
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerByIDResponse.
         */
        this.getContainerByID = (id = "0", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                id,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerByID", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get container range
         *
         * @param startIndex
         * @param numToFetch
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerRangeResponse.
         */
        this.getContainerRange = (startIndex = 0, numToFetch = 100, encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                startIndex,
                numToFetch,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerRange", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get index by containerID
         *
         * @param id
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetIndexResponse.
         */
        this.getIndex = (id = "", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                id,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getIndex", params);
                return response.data.result.index;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Check if container is accepted
         *
         * @param id
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetIsAcceptedResponse.
         */
        this.isAccepted = (id = "", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                id,
                encoding
            };
            try {
                const response = yield this.callMethod("index.isAccepted", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.IndexAPI = IndexAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvaW5kZXgvYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUE4QztBQWdCOUM7Ozs7OztHQU1HO0FBQ0gsTUFBYSxRQUFTLFNBQVEsaUJBQU87SUEyTG5DOzs7OztPQUtHO0lBQ0gsWUFBWSxJQUFlLEVBQUUsVUFBa0IsaUJBQWlCO1FBQzlELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFqTXRCOzs7Ozs7O1dBT0c7UUFDSCxvQkFBZSxHQUFHLENBQ2hCLFdBQW1CLEtBQUssRUFDeEIsVUFBa0IsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUNELEVBQUU7WUFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN4QixNQUFNLE1BQU0sR0FBMEI7Z0JBQ3BDLFFBQVE7YUFDVCxDQUFBO1lBRUQsSUFBSTtnQkFDRixNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx1QkFBdUIsRUFDdkIsTUFBTSxDQUNQLENBQUE7Z0JBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTthQUM1QjtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDbkI7UUFDSCxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsd0JBQW1CLEdBQUcsQ0FDcEIsUUFBZ0IsR0FBRyxFQUNuQixXQUFtQixLQUFLLEVBQ3hCLFVBQWtCLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFDRyxFQUFFO1lBQ3hDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDeEIsTUFBTSxNQUFNLEdBQThCO2dCQUN4QyxLQUFLO2dCQUNMLFFBQVE7YUFDVCxDQUFBO1lBRUQsSUFBSTtnQkFDRixNQUFNLFFB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RCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO2FBQzVCO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUNuQjtRQUNILENBQUMsQ0FBQSxDQUFBO0lBVUQsQ0FBQztDQUNGO0FBcE1ELDRCQW9NQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktSW5kZXhcclxuICovXHJcbmltcG9ydCBKdW5lb0NvcmUgZnJvbSBcIi4uLy4uL2p1bmVvXCJcclxuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gXCIuLi8uLi9jb21tb24vanJwY2FwaVwiXHJcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaWJhc2VcIlxyXG5pbXBvcnQge1xyXG4gIEdldExhc3RBY2NlcHRlZFBhcmFtcyxcclxuICBHZXRMYXN0QWNjZXB0ZWRSZXNwb25zZSxcclxuICBHZXRDb250YWluZXJCeUluZGV4UGFyYW1zLFxyXG4gIEdldENvbnRhaW5lckJ5SW5kZXhSZXNwb25zZSxcclxuICBHZXRDb250YWluZXJCeUlEUGFyYW1zLFxyXG4gIEdldENvbnRhaW5lckJ5SURSZXNwb25zZSxcclxuICBHZXRDb250YWluZXJSYW5nZVBhcmFtcyxcclxuICBHZXRDb250YWluZXJSYW5nZVJlc3BvbnNlLFxyXG4gIEdldEluZGV4UGFyYW1zLFxyXG4gIEdldElzQWNjZXB0ZWRQYXJhbXMsXHJcbiAgSXNBY2NlcHRlZFJlc3BvbnNlXHJcbn0gZnJvbSBcIi4vaW50ZXJmYWNlc1wiXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggYSBub2RlJ3MgSW5kZXhBUEkuXHJcbiAqXHJcbiAqIEBjYXRlZ29yeSBSUENBUElzXHJcbiAqXHJcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuIEluc3RlYWQsIHVzZSB0aGUgW1tKdW5lby5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEp1bmVvLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEluZGV4QVBJIGV4dGVuZHMgSlJQQ0FQSSB7XHJcbiAgLyoqXHJcbiAgICogR2V0IGxhc3QgYWNjZXB0ZWQgdHgsIHZ0eCBvciBibG9ja1xyXG4gICAqXHJcbiAgICogQHBhcmFtIGVuY29kaW5nXHJcbiAgICogQHBhcmFtIGJhc2VVUkxcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldExhc3RBY2NlcHRlZFJlc3BvbnNlLlxyXG4gICAqL1xyXG4gIGdldExhc3RBY2NlcHRlZCA9IGFzeW5jIChcclxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxyXG4gICAgYmFzZVVSTDogc3RyaW5nID0gdGhpcy5nZXRCYXNlVVJMKClcclxuICApOiBQcm9taXNlPEdldExhc3RBY2NlcHRlZFJlc3BvbnNlPiA9PiB7XHJcbiAgICB0aGlzLnNldEJhc2VVUkwoYmFzZVVSTClcclxuICAgIGNvbnN0IHBhcmFtczogR2V0TGFzdEFjY2VwdGVkUGFyYW1zID0ge1xyXG4gICAgICBlbmNvZGluZ1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICAgIFwiaW5kZXguZ2V0TGFzdEFjY2VwdGVkXCIsXHJcbiAgICAgICAgcGFyYW1zXHJcbiAgICAgIClcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBjb250YWluZXIgYnkgaW5kZXhcclxuICAgKlxyXG4gICAqIEBwYXJhbSBpbmRleFxyXG4gICAqIEBwYXJhbSBlbmNvZGluZ1xyXG4gICAqIEBwYXJhbSBiYXNlVVJMXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBHZXRDb250YWluZXJCeUluZGV4UmVzcG9uc2UuXHJcbiAgICovXHJcbiAgZ2V0Q29udGFpbmVyQnlJbmRleCA9IGFzeW5jIChcclxuICAgIGluZGV4OiBzdHJpbmcgPSBcIjBcIixcclxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxyXG4gICAgYmFzZVVSTDogc3RyaW5nID0gdGhpcy5nZXRCYXNlVVJMKClcclxuICApOiBQcm9taXNlPEdldENvbnRhaW5lckJ5SW5kZXhSZXNwb25zZT4gPT4ge1xyXG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXHJcbiAgICBjb25zdCBwYXJhbXM6IEdldENvbnRhaW5lckJ5SW5kZXhQYXJhbXMgPSB7XHJcbiAgICAgIGluZGV4LFxyXG4gICAgICBlbmNvZGluZ1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICAgIFwiaW5kZXguZ2V0Q29udGFpbmVyQnlJbmRleFwiLFxyXG4gICAgICAgIHBhcmFtc1xyXG4gICAgICApXHJcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5sb2coZXJyb3IpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgY29udHJhaW5lciBieSBJRFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGlkXHJcbiAgICogQHBhcmFtIGVuY29kaW5nXHJcbiAgICogQHBhcmFtIGJhc2VVUkxcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldENvbnRhaW5lckJ5SURSZXNwb25zZS5cclxuICAgKi9cclxuICBnZXRDb250YWluZXJCeUlEID0gYXN5bmMgKFxyXG4gICAgaWQ6IHN0cmluZyA9IFwiMFwiLFxyXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCIsXHJcbiAgICBiYXNlVVJMOiBzdHJpbmcgPSB0aGlzLmdldEJhc2VVUkwoKVxyXG4gICk6IFByb21pc2U8R2V0Q29udGFpbmVyQnlJRFJlc3BvbnNlPiA9PiB7XHJcbiAgICB0aGlzLnNldEJhc2VVUkwoYmFzZVVSTClcclxuICAgIGNvbnN0IHBhcmFtczogR2V0Q29udGFpbmVyQnlJRFBhcmFtcyA9IHtcclxuICAgICAgaWQsXHJcbiAgICAgIGVuY29kaW5nXHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgICAgXCJpbmRleC5nZXRDb250YWluZXJCeUlEXCIsXHJcbiAgICAgICAgcGFyYW1zXHJcbiAgICAgIClcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBjb250YWluZXIgcmFuZ2VcclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdGFydEluZGV4XHJcbiAgICogQHBhcmFtIG51bVRvRmV0Y2hcclxuICAgKiBAcGFyYW0gZW5jb2RpbmdcclxuICAgKiBAcGFyYW0gYmFzZVVSTFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgR2V0Q29udGFpbmVyUmFuZ2VSZXNwb25zZS5cclxuICAgKi9cclxuICBnZXRDb250YWluZXJSYW5nZSA9IGFzeW5jIChcclxuICAgIHN0YXJ0SW5kZXg6IG51bWJlciA9IDAsXHJcbiAgICBudW1Ub0ZldGNoOiBudW1iZXIgPSAxMDAsXHJcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIixcclxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXHJcbiAgKTogUHJvbWlzZTxHZXRDb250YWluZXJSYW5nZVJlc3BvbnNlW10+ID0+IHtcclxuICAgIHRoaXMuc2V0QmFzZVVSTChiYXNlVVJMKVxyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRDb250YWluZXJSYW5nZVBhcmFtcyA9IHtcclxuICAgICAgc3RhcnRJbmRleCxcclxuICAgICAgbnVtVG9GZXRjaCxcclxuICAgICAgZW5jb2RpbmdcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgICBcImluZGV4LmdldENvbnRhaW5lclJhbmdlXCIsXHJcbiAgICAgICAgcGFyYW1zXHJcbiAgICAgIClcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBpbmRleCBieSBjb250YWluZXJJRFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGlkXHJcbiAgICogQHBhcmFtIGVuY29kaW5nXHJcbiAgICogQHBhcmFtIGJhc2VVUkxcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldEluZGV4UmVzcG9uc2UuXHJcbiAgICovXHJcbiAgZ2V0SW5kZXggPSBhc3luYyAoXHJcbiAgICBpZDogc3RyaW5nID0gXCJcIixcclxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxyXG4gICAgYmFzZVVSTDogc3RyaW5nID0gdGhpcy5nZXRCYXNlVVJMKClcclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXHJcbiAgICBjb25zdCBwYXJhbXM6IEdldEluZGV4UGFyYW1zID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgZW5jb2RpbmdcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgICBcImluZGV4LmdldEluZGV4XCIsXHJcbiAgICAgICAgcGFyYW1zXHJcbiAgICAgIClcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmluZGV4XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIGlmIGNvbnRhaW5lciBpcyBhY2NlcHRlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGlkXHJcbiAgICogQHBhcmFtIGVuY29kaW5nXHJcbiAgICogQHBhcmFtIGJhc2VVUkxcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldElzQWNjZXB0ZWRSZXNwb25zZS5cclxuICAgKi9cclxuICBpc0FjY2VwdGVkID0gYXN5bmMgKFxyXG4gICAgaWQ6IHN0cmluZyA9IFwiXCIsXHJcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIixcclxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXHJcbiAgKTogUHJvbWlzZTxJc0FjY2VwdGVkUmVzcG9uc2U+ID0+IHtcclxuICAgIHRoaXMuc2V0QmFzZVVSTChiYXNlVVJMKVxyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRJc0FjY2VwdGVkUGFyYW1zID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgZW5jb2RpbmdcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgICBcImluZGV4LmlzQWNjZXB0ZWRcIixcclxuICAgICAgICBwYXJhbXNcclxuICAgICAgKVxyXG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCB1c2UgdGhlIFtbSnVuZW8uYWRkQVBJXV0gbWV0aG9kLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEp1bmVvIGNsYXNzXHJcbiAgICogQHBhcmFtIGJhc2VVUkwgRGVmYXVsdHMgdG8gdGhlIHN0cmluZyBcIi9leHQvaW5kZXgvWC90eFwiIGFzIHRoZSBwYXRoIHRvIHJwYydzIGJhc2VVUkxcclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcihjb3JlOiBKdW5lb0NvcmUsIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9pbmRleC9YL3R4XCIpIHtcclxuICAgIHN1cGVyKGNvcmUsIGJhc2VVUkwpXHJcbiAgfVxyXG59XHJcbiJdfQ==