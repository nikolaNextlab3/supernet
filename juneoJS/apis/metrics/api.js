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
exports.MetricsAPI = void 0;
const restapi_1 = require("../../common/restapi");
/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class MetricsAPI extends restapi_1.RESTAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/metrics" as the path to rpc's baseurl
     */
    constructor(core, baseURL = "/ext/metrics") {
        super(core, baseURL);
        this.axConf = () => {
            return {
                baseURL: `${this.core.getProtocol()}://${this.core.getHost()}:${this.core.getPort()}`,
                responseType: "text"
            };
        };
        /**
         *
         * @returns Promise for an object containing the metrics response
         */
        this.getMetrics = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post("");
            return response.data;
        });
    }
}
exports.MetricsAPI = MetricsAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvbWV0cmljcy9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBS0Esa0RBQThDO0FBSTlDOzs7Ozs7R0FNRztBQUNILE1BQWEsVUFBVyxTQUFRLGlCQUFPO0lBaUJyQzs7Ozs7T0FLRztJQUNILFlBQVksSUFBZSxFQUFFLFVBQWtCLGNBQWM7UUFDM0QsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQXZCWixXQUFNLEdBQUcsR0FBdUIsRUFBRTtZQUMxQyxPQUFPO2dCQUNMLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUNyRixZQUFZLEVBQUUsTUFBTTthQUNyQixDQUFBO1FBQ0gsQ0FBQyxDQUFBO1FBRUQ7OztXQUdHO1FBQ0gsZUFBVSxHQUFHLEdBQTBCLEVBQUU7WUFDdkMsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN6RCxPQUFPLFFBQVEsQ0FBQyxJQUFjLENBQUE7UUFDaEMsQ0FBQyxDQUFBLENBQUE7SUFVRCxDQUFDO0NBQ0Y7QUExQkQsZ0NBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1NZXRyaWNzXHJcbiAqL1xyXG5pbXBvcnQgSnVuZW9Db3JlIGZyb20gXCIuLi8uLi9qdW5lb1wiXHJcbmltcG9ydCB7IFJFU1RBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3Jlc3RhcGlcIlxyXG5pbXBvcnQgeyBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGliYXNlXCJcclxuaW1wb3J0IHsgQXhpb3NSZXF1ZXN0Q29uZmlnIH0gZnJvbSBcImF4aW9zXCJcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUgQVBJIHRoYXQgaXMgdXNpbmcgdGhlIG5vZGUncyBNZXRyaWNzQXBpLlxyXG4gKlxyXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xyXG4gKlxyXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbUkVTVEFQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbSnVuZW8uYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBKdW5lby5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBNZXRyaWNzQVBJIGV4dGVuZHMgUkVTVEFQSSB7XHJcbiAgcHJvdGVjdGVkIGF4Q29uZiA9ICgpOiBBeGlvc1JlcXVlc3RDb25maWcgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYmFzZVVSTDogYCR7dGhpcy5jb3JlLmdldFByb3RvY29sKCl9Oi8vJHt0aGlzLmNvcmUuZ2V0SG9zdCgpfToke3RoaXMuY29yZS5nZXRQb3J0KCl9YCxcclxuICAgICAgcmVzcG9uc2VUeXBlOiBcInRleHRcIlxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgbWV0cmljcyByZXNwb25zZVxyXG4gICAqL1xyXG4gIGdldE1ldHJpY3MgPSBhc3luYyAoKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5wb3N0KFwiXCIpXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YSBhcyBzdHJpbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0p1bmVvLmFkZEFQSV1dIG1ldGhvZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb3JlIEEgcmVmZXJlbmNlIHRvIHRoZSBKdW5lbyBjbGFzc1xyXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L21ldHJpY3NcIiBhcyB0aGUgcGF0aCB0byBycGMncyBiYXNldXJsXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29yZTogSnVuZW9Db3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvbWV0cmljc1wiKSB7XHJcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxyXG4gIH1cclxufVxyXG4iXX0=