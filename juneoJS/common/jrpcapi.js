"use strict";
/**
 * @packageDocumentation
 * @module Common-JRPCAPI
 */
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
exports.JRPCAPI = void 0;
const utils_1 = require("../utils");
const apibase_1 = require("./apibase");
class JRPCAPI extends apibase_1.APIBase {
    /**
     *
     * @param core Reference to the Juneo instance using this endpoint
     * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/jvm"
     * @param jrpcVersion The jrpc version to use, default "2.0".
     */
    constructor(core, baseURL, jrpcVersion = "2.0") {
        super(core, baseURL);
        this.jrpcVersion = "2.0";
        this.rpcID = 1;
        this.callMethod = (method, params, baseURL, headers) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.id = this.rpcID;
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            else if (this.jrpcVersion === "1.0") {
                rpc.params = [];
            }
            if (this.jrpcVersion !== "1.0") {
                rpc.jsonrpc = this.jrpcVersion;
            }
            let headrs = { "Content-Type": "application/json;charset=UTF-8" };
            if (headers) {
                headrs = Object.assign(Object.assign({}, headrs), headers);
            }
            baseURL = this.core.getURL();
            const axConf = {
                baseURL: baseURL,
                responseType: "json",
                // use the fetch adapter if fetch is available e.g. non Node<17 env
                adapter: typeof fetch !== "undefined" ? utils_1.fetchAdapter : undefined
            };
            const resp = yield this.core.post(ep, {}, JSON.stringify(rpc), headrs, axConf);
            if (resp.status >= 200 && resp.status < 300) {
                this.rpcID += 1;
                if (typeof resp.data === "string") {
                    resp.data = JSON.parse(resp.data);
                }
                if (typeof resp.data === "object" &&
                    (resp.data === null || "error" in resp.data)) {
                    throw new Error(resp.data.error.message);
                }
            }
            return resp;
        });
        /**
         * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
         * request ID that will be sent.
         */
        this.getRPCID = () => this.rpcID;
        this.jrpcVersion = jrpcVersion;
        this.rpcID = 1;
    }
}
exports.JRPCAPI = JRPCAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianJwY2FwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vanJwY2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7QUFHSCxvQ0FBdUM7QUFFdkMsdUNBQXdEO0FBRXhELE1BQWEsT0FBUSxTQUFRLGlCQUFPO0lBb0VsQzs7Ozs7T0FLRztJQUNILFlBQVksSUFBZSxFQUFFLE9BQWUsRUFBRSxjQUFzQixLQUFLO1FBQ3ZFLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUExRVosZ0JBQVcsR0FBVyxLQUFLLENBQUE7UUFDM0IsVUFBSyxHQUFHLENBQUMsQ0FBQTtRQUVuQixlQUFVLEdBQUcsQ0FDWCxNQUFjLEVBQ2QsTUFBMEIsRUFDMUIsT0FBZ0IsRUFDaEIsT0FBZ0IsRUFDYyxFQUFFO1lBQ2hDLE1BQU0sRUFBRSxHQUFXLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFBO1lBQzFDLE1BQU0sR0FBRyxHQUFRLEVBQUUsQ0FBQTtZQUNuQixHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUE7WUFDbkIsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7WUFFbkIsMkJBQTJCO1lBQzNCLElBQUksTUFBTSxFQUFFO2dCQUNWLEdBQUcsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO2FBQ3BCO2lCQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUU7Z0JBQ3JDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO2FBQ2hCO1lBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssRUFBRTtnQkFDOUIsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO2FBQy9CO1lBRUQsSUFBSSxNQUFNLEdBQVcsRUFBRSxjQUFjLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQTtZQUN6RSxJQUFJLE9BQU8sRUFBRTtnQkFDWCxNQUFNLG1DQUFRLE1BQU0sR0FBSyxPQUFPLENBQUUsQ0FBQTthQUNuQztZQUVELE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBRTVCLE1BQU0sTUFBTSxHQUF1QjtnQkFDakMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFlBQVksRUFBRSxNQUFNO2dCQUNwQixtRUFBbUU7Z0JBQ25FLE9BQU8sRUFBRSxPQUFPLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLG9CQUFZLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDakUsQ0FBQTtZQUVELE1BQU0sSUFBSSxHQUF3QixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUNwRCxFQUFFLEVBQ0YsRUFBRSxFQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQ25CLE1BQU0sRUFDTixNQUFNLENBQ1AsQ0FBQTtZQUNELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFBO2dCQUNmLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtvQkFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtpQkFDbEM7Z0JBQ0QsSUFDRSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUTtvQkFDN0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxFQUM1QztvQkFDQSxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2lCQUN6QzthQUNGO1lBQ0QsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7V0FHRztRQUNILGFBQVEsR0FBRyxHQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBVWpDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO1FBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBO0lBQ2hCLENBQUM7Q0FDRjtBQS9FRCwwQkErRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQ29tbW9uLUpSUENBUElcclxuICovXHJcblxyXG5pbXBvcnQgeyBBeGlvc1JlcXVlc3RDb25maWcgfSBmcm9tIFwiYXhpb3NcIlxyXG5pbXBvcnQgeyBmZXRjaEFkYXB0ZXIgfSBmcm9tIFwiLi4vdXRpbHNcIlxyXG5pbXBvcnQgSnVuZW9Db3JlIGZyb20gXCIuLi9qdW5lb1wiXHJcbmltcG9ydCB7IEFQSUJhc2UsIFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi9hcGliYXNlXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBKUlBDQVBJIGV4dGVuZHMgQVBJQmFzZSB7XHJcbiAgcHJvdGVjdGVkIGpycGNWZXJzaW9uOiBzdHJpbmcgPSBcIjIuMFwiXHJcbiAgcHJvdGVjdGVkIHJwY0lEID0gMVxyXG5cclxuICBjYWxsTWV0aG9kID0gYXN5bmMgKFxyXG4gICAgbWV0aG9kOiBzdHJpbmcsXHJcbiAgICBwYXJhbXM/OiBvYmplY3RbXSB8IG9iamVjdCxcclxuICAgIGJhc2VVUkw/OiBzdHJpbmcsXHJcbiAgICBoZWFkZXJzPzogb2JqZWN0XHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB7XHJcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcclxuICAgIGNvbnN0IHJwYzogYW55ID0ge31cclxuICAgIHJwYy5pZCA9IHRoaXMucnBjSURcclxuICAgIHJwYy5tZXRob2QgPSBtZXRob2RcclxuXHJcbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcclxuICAgIGlmIChwYXJhbXMpIHtcclxuICAgICAgcnBjLnBhcmFtcyA9IHBhcmFtc1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmpycGNWZXJzaW9uID09PSBcIjEuMFwiKSB7XHJcbiAgICAgIHJwYy5wYXJhbXMgPSBbXVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmpycGNWZXJzaW9uICE9PSBcIjEuMFwiKSB7XHJcbiAgICAgIHJwYy5qc29ucnBjID0gdGhpcy5qcnBjVmVyc2lvblxyXG4gICAgfVxyXG5cclxuICAgIGxldCBoZWFkcnM6IG9iamVjdCA9IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLThcIiB9XHJcbiAgICBpZiAoaGVhZGVycykge1xyXG4gICAgICBoZWFkcnMgPSB7IC4uLmhlYWRycywgLi4uaGVhZGVycyB9XHJcbiAgICB9XHJcblxyXG4gICAgYmFzZVVSTCA9IHRoaXMuY29yZS5nZXRVUkwoKVxyXG5cclxuICAgIGNvbnN0IGF4Q29uZjogQXhpb3NSZXF1ZXN0Q29uZmlnID0ge1xyXG4gICAgICBiYXNlVVJMOiBiYXNlVVJMLFxyXG4gICAgICByZXNwb25zZVR5cGU6IFwianNvblwiLFxyXG4gICAgICAvLyB1c2UgdGhlIGZldGNoIGFkYXB0ZXIgaWYgZmV0Y2ggaXMgYXZhaWxhYmxlIGUuZy4gbm9uIE5vZGU8MTcgZW52XHJcbiAgICAgIGFkYXB0ZXI6IHR5cGVvZiBmZXRjaCAhPT0gXCJ1bmRlZmluZWRcIiA/IGZldGNoQWRhcHRlciA6IHVuZGVmaW5lZFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3A6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNvcmUucG9zdChcclxuICAgICAgZXAsXHJcbiAgICAgIHt9LFxyXG4gICAgICBKU09OLnN0cmluZ2lmeShycGMpLFxyXG4gICAgICBoZWFkcnMsXHJcbiAgICAgIGF4Q29uZlxyXG4gICAgKVxyXG4gICAgaWYgKHJlc3Auc3RhdHVzID49IDIwMCAmJiByZXNwLnN0YXR1cyA8IDMwMCkge1xyXG4gICAgICB0aGlzLnJwY0lEICs9IDFcclxuICAgICAgaWYgKHR5cGVvZiByZXNwLmRhdGEgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICByZXNwLmRhdGEgPSBKU09OLnBhcnNlKHJlc3AuZGF0YSlcclxuICAgICAgfVxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgdHlwZW9mIHJlc3AuZGF0YSA9PT0gXCJvYmplY3RcIiAmJlxyXG4gICAgICAgIChyZXNwLmRhdGEgPT09IG51bGwgfHwgXCJlcnJvclwiIGluIHJlc3AuZGF0YSlcclxuICAgICAgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AuZGF0YS5lcnJvci5tZXNzYWdlKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzcFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcnBjaWQsIGEgc3RyaWN0bHktaW5jcmVhc2luZyBudW1iZXIsIHN0YXJ0aW5nIGZyb20gMSwgaW5kaWNhdGluZyB0aGUgbmV4dFxyXG4gICAqIHJlcXVlc3QgSUQgdGhhdCB3aWxsIGJlIHNlbnQuXHJcbiAgICovXHJcbiAgZ2V0UlBDSUQgPSAoKTogbnVtYmVyID0+IHRoaXMucnBjSURcclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29yZSBSZWZlcmVuY2UgdG8gdGhlIEp1bmVvIGluc3RhbmNlIHVzaW5nIHRoaXMgZW5kcG9pbnRcclxuICAgKiBAcGFyYW0gYmFzZVVSTCBQYXRoIG9mIHRoZSBBUElzIGJhc2VVUkwgLSBleDogXCIvZXh0L2JjL2p2bVwiXHJcbiAgICogQHBhcmFtIGpycGNWZXJzaW9uIFRoZSBqcnBjIHZlcnNpb24gdG8gdXNlLCBkZWZhdWx0IFwiMi4wXCIuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29yZTogSnVuZW9Db3JlLCBiYXNlVVJMOiBzdHJpbmcsIGpycGNWZXJzaW9uOiBzdHJpbmcgPSBcIjIuMFwiKSB7XHJcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxyXG4gICAgdGhpcy5qcnBjVmVyc2lvbiA9IGpycGNWZXJzaW9uXHJcbiAgICB0aGlzLnJwY0lEID0gMVxyXG4gIH1cclxufVxyXG4iXX0=