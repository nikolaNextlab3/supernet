"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = void 0;
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const utils_1 = require("../../utils");
class Socket extends isomorphic_ws_1.default {
    /**
     * Provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection.
     *
     * @param url Defaults to [[MainnetAPI]]
     * @param options Optional
     */
    constructor(url = `wss://${utils_1.MainnetAPI}:9650/ext/bc/X/events`, options) {
        super(url, options);
    }
    /**
     * Send a message to the server
     *
     * @param data
     * @param cb Optional
     */
    send(data, cb) {
        super.send(data, cb);
    }
    /**
     * Terminates the connection completely
     *
     * @param mcode Optional
     * @param data Optional
     */
    close(mcode, data) {
        super.close(mcode, data);
    }
}
exports.Socket = Socket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvc29ja2V0L3NvY2tldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFLQSxrRUFBcUM7QUFDckMsdUNBQXdDO0FBQ3hDLE1BQWEsTUFBTyxTQUFRLHVCQUFTO0lBOEJuQzs7Ozs7T0FLRztJQUNILFlBQ0UsTUFBa0MsU0FBUyxrQkFBVSx1QkFBdUIsRUFDNUUsT0FBcUQ7UUFFckQsS0FBSyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNyQixDQUFDO0lBL0JEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFDLElBQVMsRUFBRSxFQUFRO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3RCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxLQUFjLEVBQUUsSUFBYTtRQUNqQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUMxQixDQUFDO0NBY0Y7QUExQ0Qsd0JBMENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1Tb2NrZXRcclxuICovXHJcbmltcG9ydCB7IENsaWVudFJlcXVlc3RBcmdzIH0gZnJvbSBcImh0dHBcIlxyXG5pbXBvcnQgV2ViU29ja2V0IGZyb20gXCJpc29tb3JwaGljLXdzXCJcclxuaW1wb3J0IHsgTWFpbm5ldEFQSSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXHJcbmV4cG9ydCBjbGFzcyBTb2NrZXQgZXh0ZW5kcyBXZWJTb2NrZXQge1xyXG4gIC8vIEZpcmVzIG9uY2UgdGhlIGNvbm5lY3Rpb24gaGFzIGJlZW4gZXN0YWJsaXNoZWQgYmV0d2VlbiB0aGUgY2xpZW50IGFuZCB0aGUgc2VydmVyXHJcbiAgb25vcGVuOiBhbnlcclxuICAvLyBGaXJlcyB3aGVuIHRoZSBzZXJ2ZXIgc2VuZHMgc29tZSBkYXRhXHJcbiAgb25tZXNzYWdlOiBhbnlcclxuICAvLyBGaXJlcyBhZnRlciBlbmQgb2YgdGhlIGNvbW11bmljYXRpb24gYmV0d2VlbiBzZXJ2ZXIgYW5kIHRoZSBjbGllbnRcclxuICBvbmNsb3NlOiBhbnlcclxuICAvLyBGaXJlcyBmb3Igc29tZSBtaXN0YWtlLCB3aGljaCBoYXBwZW5zIGR1cmluZyB0aGUgY29tbXVuaWNhdGlvblxyXG4gIG9uZXJyb3I6IGFueVxyXG5cclxuICAvKipcclxuICAgKiBTZW5kIGEgbWVzc2FnZSB0byB0aGUgc2VydmVyXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZGF0YVxyXG4gICAqIEBwYXJhbSBjYiBPcHRpb25hbFxyXG4gICAqL1xyXG4gIHNlbmQoZGF0YTogYW55LCBjYj86IGFueSk6IHZvaWQge1xyXG4gICAgc3VwZXIuc2VuZChkYXRhLCBjYilcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRlcm1pbmF0ZXMgdGhlIGNvbm5lY3Rpb24gY29tcGxldGVseVxyXG4gICAqXHJcbiAgICogQHBhcmFtIG1jb2RlIE9wdGlvbmFsXHJcbiAgICogQHBhcmFtIGRhdGEgT3B0aW9uYWxcclxuICAgKi9cclxuICBjbG9zZShtY29kZT86IG51bWJlciwgZGF0YT86IHN0cmluZyk6IHZvaWQge1xyXG4gICAgc3VwZXIuY2xvc2UobWNvZGUsIGRhdGEpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQcm92aWRlcyB0aGUgQVBJIGZvciBjcmVhdGluZyBhbmQgbWFuYWdpbmcgYSBXZWJTb2NrZXQgY29ubmVjdGlvbiB0byBhIHNlcnZlciwgYXMgd2VsbCBhcyBmb3Igc2VuZGluZyBhbmQgcmVjZWl2aW5nIGRhdGEgb24gdGhlIGNvbm5lY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXJsIERlZmF1bHRzIHRvIFtbTWFpbm5ldEFQSV1dXHJcbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWxcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHVybDogc3RyaW5nIHwgaW1wb3J0KFwidXJsXCIpLlVSTCA9IGB3c3M6Ly8ke01haW5uZXRBUEl9Ojk2NTAvZXh0L2JjL1gvZXZlbnRzYCxcclxuICAgIG9wdGlvbnM/OiBXZWJTb2NrZXQuQ2xpZW50T3B0aW9ucyB8IENsaWVudFJlcXVlc3RBcmdzXHJcbiAgKSB7XHJcbiAgICBzdXBlcih1cmwsIG9wdGlvbnMpXHJcbiAgfVxyXG59XHJcbiJdfQ==