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
/**
 * @packageDocumentation
 * @module JuneoCore
 */
const axios_1 = __importDefault(require("axios"));
const apibase_1 = require("./common/apibase");
const errors_1 = require("./utils/errors");
const fetchadapter_1 = require("./utils/fetchadapter");
const helperfunctions_1 = require("./utils/helperfunctions");
/**
 * JuneoCore is middleware for interacting with Juneo node RPC APIs.
 *
 * Example usage:
 * ```js
 * let juneo = new JuneoCore("127.0.0.1", 9650, "https")
 * ```
 *
 *
 */
class JuneoCore {
    /**
     * Creates a new Juneo instance. Sets the address and port of the main Juneo Client.
     *
     * @param host The hostname to resolve to reach the Juneo Client APIs
     * @param port The port to resolve to reach the Juneo Client APIs
     * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
     */
    constructor(host, port, protocol = "http") {
        this.networkID = 0;
        this.hrp = "";
        this.auth = undefined;
        this.headers = {};
        this.requestConfig = {};
        this.apis = {};
        /**
         * Sets the address and port of the main Juneo Client.
         *
         * @param host The hostname to resolve to reach the Juneo Client RPC APIs.
         * @param port The port to resolve to reach the Juneo Client RPC APIs.
         * @param protocol The protocol string to use before a "://" in a request,
         * ex: "http", "https", etc. Defaults to http
         * @param baseEndpoint the base endpoint to reach the Juneo Client RPC APIs,
         * ex: "/rpc". Defaults to "/"
         * The following special characters are removed from host and protocol
         * &#,@+()$~%'":*?{} also less than and greater than signs
         */
        this.setAddress = (host, port, protocol = "http", baseEndpoint = "") => {
            host = host.replace(/[&#,@+()$~%'":*?<>{}]/g, "");
            protocol = protocol.replace(/[&#,@+()$~%'":*?<>{}]/g, "");
            const protocols = ["http", "https"];
            if (!protocols.includes(protocol)) {
                /* istanbul ignore next */
                throw new errors_1.ProtocolError("Error - JuneoCore.setAddress: Invalid protocol");
            }
            this.host = host;
            this.port = port;
            this.protocol = protocol;
            this.baseEndpoint = baseEndpoint;
            let url = `${protocol}://${host}`;
            if (port != undefined && typeof port === "number" && port >= 0) {
                url = `${url}:${port}`;
            }
            if (baseEndpoint != undefined &&
                typeof baseEndpoint == "string" &&
                baseEndpoint.length > 0) {
                if (baseEndpoint[0] != "/") {
                    baseEndpoint = `/${baseEndpoint}`;
                }
                url = `${url}${baseEndpoint}`;
            }
            this.url = url;
        };
        /**
         * Returns the protocol such as "http", "https", "git", "ws", etc.
         */
        this.getProtocol = () => this.protocol;
        /**
         * Returns the host for the Juneo node.
         */
        this.getHost = () => this.host;
        /**
         * Returns the IP for the Juneo node.
         */
        this.getIP = () => this.host;
        /**
         * Returns the port for the Juneo node.
         */
        this.getPort = () => this.port;
        /**
         * Returns the base endpoint for the Juneo node.
         */
        this.getBaseEndpoint = () => this.baseEndpoint;
        /**
         * Returns the URL of the Juneo node (ip + port)
         */
        this.getURL = () => this.url;
        /**
         * Returns the custom headers
         */
        this.getHeaders = () => this.headers;
        /**
         * Returns the custom request config
         */
        this.getRequestConfig = () => this.requestConfig;
        /**
         * Returns the networkID
         */
        this.getNetworkID = () => this.networkID;
        /**
         * Sets the networkID
         */
        this.setNetworkID = (netID) => {
            this.networkID = netID;
            this.hrp = (0, helperfunctions_1.getPreferredHRP)(this.networkID);
        };
        /**
         * Returns the Human-Readable-Part of the network associated with this key.
         *
         * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
         */
        this.getHRP = () => this.hrp;
        /**
         * Sets the the Human-Readable-Part of the network associated with this key.
         *
         * @param hrp String for the Human-Readable-Part of Bech32 addresses
         */
        this.setHRP = (hrp) => {
            this.hrp = hrp;
        };
        /**
         * Adds a new custom header to be included with all requests.
         *
         * @param key Header name
         * @param value Header value
         */
        this.setHeader = (key, value) => {
            this.headers[`${key}`] = value;
        };
        /**
         * Removes a previously added custom header.
         *
         * @param key Header name
         */
        this.removeHeader = (key) => {
            delete this.headers[`${key}`];
        };
        /**
         * Removes all headers.
         */
        this.removeAllHeaders = () => {
            for (const prop in this.headers) {
                if (Object.prototype.hasOwnProperty.call(this.headers, prop)) {
                    delete this.headers[`${prop}`];
                }
            }
        };
        /**
         * Adds a new custom config value to be included with all requests.
         *
         * @param key Config name
         * @param value Config value
         */
        this.setRequestConfig = (key, value) => {
            this.requestConfig[`${key}`] = value;
        };
        /**
         * Removes a previously added request config.
         *
         * @param key Header name
         */
        this.removeRequestConfig = (key) => {
            delete this.requestConfig[`${key}`];
        };
        /**
         * Removes all request configs.
         */
        this.removeAllRequestConfigs = () => {
            for (const prop in this.requestConfig) {
                if (Object.prototype.hasOwnProperty.call(this.requestConfig, prop)) {
                    delete this.requestConfig[`${prop}`];
                }
            }
        };
        /**
         * Sets the temporary auth token used for communicating with the node.
         *
         * @param auth A temporary token provided by the node enabling access to the endpoints on the node.
         */
        this.setAuthToken = (auth) => {
            this.auth = auth;
        };
        this._setHeaders = (headers) => {
            if (typeof this.headers === "object") {
                for (const [key, value] of Object.entries(this.headers)) {
                    headers[`${key}`] = value;
                }
            }
            if (typeof this.auth === "string") {
                headers.Authorization = `Bearer ${this.auth}`;
            }
            return headers;
        };
        /**
         * Adds an API to the middleware. The API resolves to a registered blockchain's RPC.
         *
         * In TypeScript:
         * ```js
         * juneo.addAPI<MyVMClass>("mychain", MyVMClass, "/ext/bc/mychain")
         * ```
         *
         * In Javascript:
         * ```js
         * juneo.addAPI("mychain", MyVMClass, "/ext/bc/mychain")
         * ```
         *
         * @typeparam GA Class of the API being added
         * @param apiName A label for referencing the API in the future
         * @param ConstructorFN A reference to the class which instantiates the API
         * @param baseurl Path to resolve to reach the API
         *
         */
        this.addAPI = (apiName, ConstructorFN, baseurl = undefined, ...args) => {
            if (typeof baseurl === "undefined") {
                this.apis[`${apiName}`] = new ConstructorFN(this, undefined, ...args);
            }
            else {
                this.apis[`${apiName}`] = new ConstructorFN(this, baseurl, ...args);
            }
        };
        /**
         * Retrieves a reference to an API by its apiName label.
         *
         * @param apiName Name of the API to return
         */
        this.api = (apiName) => this.apis[`${apiName}`];
        /**
         * @ignore
         */
        this._request = (xhrmethod, baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () {
            let config;
            if (axiosConfig) {
                config = Object.assign(Object.assign({}, axiosConfig), this.requestConfig);
            }
            else {
                config = Object.assign({ baseURL: this.url, responseType: "text" }, this.requestConfig);
            }
            config.url = baseurl;
            config.method = xhrmethod;
            config.headers = headers;
            config.data = postdata;
            config.params = getdata;
            // use the fetch adapter if fetch is available e.g. non Node<17 env
            if (typeof fetch !== "undefined") {
                config.adapter = fetchadapter_1.fetchAdapter;
            }
            const resp = yield axios_1.default.request(config);
            // purging all that is axios
            const xhrdata = new apibase_1.RequestResponseData(resp.data, resp.headers, resp.status, resp.statusText, resp.request);
            return xhrdata;
        });
        /**
         * Makes a GET call to an API.
         *
         * @param baseurl Path to the api
         * @param getdata Object containing the key value pairs sent in GET
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.get = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request("GET", baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a DELETE call to an API.
         *
         * @param baseurl Path to the API
         * @param getdata Object containing the key value pairs sent in DELETE
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.delete = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request("DELETE", baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a POST call to an API.
         *
         * @param baseurl Path to the API
         * @param getdata Object containing the key value pairs sent in POST
         * @param postdata Object containing the key value pairs sent in POST
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.post = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request("POST", baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a PUT call to an API.
         *
         * @param baseurl Path to the baseurl
         * @param getdata Object containing the key value pairs sent in PUT
         * @param postdata Object containing the key value pairs sent in PUT
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.put = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request("PUT", baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a PATCH call to an API.
         *
         * @param baseurl Path to the baseurl
         * @param getdata Object containing the key value pairs sent in PATCH
         * @param postdata Object containing the key value pairs sent in PATCH
         * @param parameters Object containing the parameters of the API call
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.patch = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request("PATCH", baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        if (host != undefined) {
            this.setAddress(host, port, protocol);
        }
    }
}
exports.default = JuneoCore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVuZW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvanVuZW8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFLYztBQUNkLDhDQUErRDtBQUMvRCwyQ0FBOEM7QUFDOUMsdURBQW1EO0FBQ25ELDZEQUF5RDtBQUd6RDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFxQixTQUFTO0lBc2I1Qjs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWEsRUFBRSxJQUFhLEVBQUUsV0FBbUIsTUFBTTtRQTViekQsY0FBUyxHQUFXLENBQUMsQ0FBQTtRQUNyQixRQUFHLEdBQVcsRUFBRSxDQUFBO1FBT2hCLFNBQUksR0FBVyxTQUFTLENBQUE7UUFDeEIsWUFBTyxHQUE0QixFQUFFLENBQUE7UUFDckMsa0JBQWEsR0FBdUIsRUFBRSxDQUFBO1FBQ3RDLFNBQUksR0FBNkIsRUFBRSxDQUFBO1FBRTdDOzs7Ozs7Ozs7OztXQVdHO1FBQ0gsZUFBVSxHQUFHLENBQ1gsSUFBWSxFQUNaLElBQVksRUFDWixXQUFtQixNQUFNLEVBQ3pCLGVBQXVCLEVBQUUsRUFDbkIsRUFBRTtZQUNSLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2pELFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3pELE1BQU0sU0FBUyxHQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNqQywwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSxzQkFBYSxDQUFDLGdEQUFnRCxDQUFDLENBQUE7YUFDMUU7WUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtZQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLElB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QVVELElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtZQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDdEM7SUFDSCxDQUFDO0NBQ0Y7QUFsY0QsNEJBa2NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEp1bmVvQ29yZVxyXG4gKi9cclxuaW1wb3J0IGF4aW9zLCB7XHJcbiAgQXhpb3NSZXF1ZXN0Q29uZmlnLFxyXG4gIEF4aW9zUmVxdWVzdEhlYWRlcnMsXHJcbiAgQXhpb3NSZXNwb25zZSxcclxuICBNZXRob2RcclxufSBmcm9tIFwiYXhpb3NcIlxyXG5pbXBvcnQgeyBBUElCYXNlLCBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4vY29tbW9uL2FwaWJhc2VcIlxyXG5pbXBvcnQgeyBQcm90b2NvbEVycm9yIH0gZnJvbSBcIi4vdXRpbHMvZXJyb3JzXCJcclxuaW1wb3J0IHsgZmV0Y2hBZGFwdGVyIH0gZnJvbSBcIi4vdXRpbHMvZmV0Y2hhZGFwdGVyXCJcclxuaW1wb3J0IHsgZ2V0UHJlZmVycmVkSFJQIH0gZnJvbSBcIi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcclxuaW1wb3J0IHsgRVZNQVBJIH0gZnJvbSBcIi4vYXBpcy9ldm1cIlxyXG5cclxuLyoqXHJcbiAqIEp1bmVvQ29yZSBpcyBtaWRkbGV3YXJlIGZvciBpbnRlcmFjdGluZyB3aXRoIEp1bmVvIG5vZGUgUlBDIEFQSXMuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYGpzXHJcbiAqIGxldCBqdW5lbyA9IG5ldyBKdW5lb0NvcmUoXCIxMjcuMC4wLjFcIiwgOTY1MCwgXCJodHRwc1wiKVxyXG4gKiBgYGBcclxuICpcclxuICpcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEp1bmVvQ29yZSB7XHJcbiAgcHJvdGVjdGVkIG5ldHdvcmtJRDogbnVtYmVyID0gMFxyXG4gIHByb3RlY3RlZCBocnA6IHN0cmluZyA9IFwiXCJcclxuICBwcm90ZWN0ZWQgcHJvdG9jb2w6IHN0cmluZ1xyXG4gIHByb3RlY3RlZCBpcDogc3RyaW5nXHJcbiAgcHJvdGVjdGVkIGhvc3Q6IHN0cmluZ1xyXG4gIHByb3RlY3RlZCBwb3J0OiBudW1iZXJcclxuICBwcm90ZWN0ZWQgYmFzZUVuZHBvaW50OiBzdHJpbmdcclxuICBwcm90ZWN0ZWQgdXJsOiBzdHJpbmdcclxuICBwcm90ZWN0ZWQgYXV0aDogc3RyaW5nID0gdW5kZWZpbmVkXHJcbiAgcHJvdGVjdGVkIGhlYWRlcnM6IHsgW2s6IHN0cmluZ106IHN0cmluZyB9ID0ge31cclxuICBwcm90ZWN0ZWQgcmVxdWVzdENvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0ge31cclxuICBwcm90ZWN0ZWQgYXBpczogeyBbazogc3RyaW5nXTogQVBJQmFzZSB9ID0ge31cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBKdW5lbyBDbGllbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgSnVuZW8gQ2xpZW50IFJQQyBBUElzLlxyXG4gICAqIEBwYXJhbSBwb3J0IFRoZSBwb3J0IHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEp1bmVvIENsaWVudCBSUEMgQVBJcy5cclxuICAgKiBAcGFyYW0gcHJvdG9jb2wgVGhlIHByb3RvY29sIHN0cmluZyB0byB1c2UgYmVmb3JlIGEgXCI6Ly9cIiBpbiBhIHJlcXVlc3QsXHJcbiAgICogZXg6IFwiaHR0cFwiLCBcImh0dHBzXCIsIGV0Yy4gRGVmYXVsdHMgdG8gaHR0cFxyXG4gICAqIEBwYXJhbSBiYXNlRW5kcG9pbnQgdGhlIGJhc2UgZW5kcG9pbnQgdG8gcmVhY2ggdGhlIEp1bmVvIENsaWVudCBSUEMgQVBJcyxcclxuICAgKiBleDogXCIvcnBjXCIuIERlZmF1bHRzIHRvIFwiL1wiXHJcbiAgICogVGhlIGZvbGxvd2luZyBzcGVjaWFsIGNoYXJhY3RlcnMgYXJlIHJlbW92ZWQgZnJvbSBob3N0IGFuZCBwcm90b2NvbFxyXG4gICAqICYjLEArKCkkfiUnXCI6Kj97fSBhbHNvIGxlc3MgdGhhbiBhbmQgZ3JlYXRlciB0aGFuIHNpZ25zXHJcbiAgICovXHJcbiAgc2V0QWRkcmVzcyA9IChcclxuICAgIGhvc3Q6IHN0cmluZyxcclxuICAgIHBvcnQ6IG51bWJlcixcclxuICAgIHByb3RvY29sOiBzdHJpbmcgPSBcImh0dHBcIixcclxuICAgIGJhc2VFbmRwb2ludDogc3RyaW5nID0gXCJcIlxyXG4gICk6IHZvaWQgPT4ge1xyXG4gICAgaG9zdCA9IGhvc3QucmVwbGFjZSgvWyYjLEArKCkkfiUnXCI6Kj88Pnt9XS9nLCBcIlwiKVxyXG4gICAgcHJvdG9jb2wgPSBwcm90b2NvbC5yZXBsYWNlKC9bJiMsQCsoKSR+JSdcIjoqPzw+e31dL2csIFwiXCIpXHJcbiAgICBjb25zdCBwcm90b2NvbHM6IHN0cmluZ1tdID0gW1wiaHR0cFwiLCBcImh0dHBzXCJdXHJcbiAgICBpZiAoIXByb3RvY29scy5pbmNsdWRlcyhwcm90b2NvbCkpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoXCJFcnJvciAtIEp1bmVvQ29yZS5zZXRBZGRyZXNzOiBJbnZhbGlkIHByb3RvY29sXCIpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5ob3N0ID0gaG9zdFxyXG4gICAgdGhpcy5wb3J0ID0gcG9ydFxyXG4gICAgdGhpcy5wcm90b2NvbCA9IHByb3RvY29sXHJcbiAgICB0aGlzLmJhc2VFbmRwb2ludCA9IGJhc2VFbmRwb2ludFxyXG4gICAgbGV0IHVybDogc3RyaW5nID0gYCR7cHJvdG9jb2x9Oi8vJHtob3N0fWBcclxuICAgIGlmIChwb3J0ICE9IHVuZGVmaW5lZCAmJiB0eXBlb2YgcG9ydCA9PT0gXCJudW1iZXJcIiAmJiBwb3J0ID49IDApIHtcclxuICAgICAgdXJsID0gYCR7dXJsfToke3BvcnR9YFxyXG4gICAgfVxyXG4gICAgaWYgKFxyXG4gICAgICBiYXNlRW5kcG9pbnQgIT0gdW5kZWZpbmVkICYmXHJcbiAgICAgIHR5cGVvZiBiYXNlRW5kcG9pbnQgPT0gXCJzdHJpbmdcIiAmJlxyXG4gICAgICBiYXNlRW5kcG9pbnQubGVuZ3RoID4gMFxyXG4gICAgKSB7XHJcbiAgICAgIGlmIChiYXNlRW5kcG9pbnRbMF0gIT0gXCIvXCIpIHtcclxuICAgICAgICBiYXNlRW5kcG9pbnQgPSBgLyR7YmFzZUVuZHBvaW50fWBcclxuICAgICAgfVxyXG4gICAgICB1cmwgPSBgJHt1cmx9JHtiYXNlRW5kcG9pbnR9YFxyXG4gICAgfVxyXG4gICAgdGhpcy51cmwgPSB1cmxcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHByb3RvY29sIHN1Y2ggYXMgXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMuXHJcbiAgICovXHJcbiAgZ2V0UHJvdG9jb2wgPSAoKTogc3RyaW5nID0+IHRoaXMucHJvdG9jb2xcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaG9zdCBmb3IgdGhlIEp1bmVvIG5vZGUuXHJcbiAgICovXHJcbiAgZ2V0SG9zdCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5ob3N0XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIElQIGZvciB0aGUgSnVuZW8gbm9kZS5cclxuICAgKi9cclxuICBnZXRJUCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5ob3N0XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBvcnQgZm9yIHRoZSBKdW5lbyBub2RlLlxyXG4gICAqL1xyXG4gIGdldFBvcnQgPSAoKTogbnVtYmVyID0+IHRoaXMucG9ydFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBiYXNlIGVuZHBvaW50IGZvciB0aGUgSnVuZW8gbm9kZS5cclxuICAgKi9cclxuICBnZXRCYXNlRW5kcG9pbnQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmFzZUVuZHBvaW50XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFVSTCBvZiB0aGUgSnVuZW8gbm9kZSAoaXAgKyBwb3J0KVxyXG4gICAqL1xyXG4gIGdldFVSTCA9ICgpOiBzdHJpbmcgPT4gdGhpcy51cmxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VzdG9tIGhlYWRlcnNcclxuICAgKi9cclxuICBnZXRIZWFkZXJzID0gKCk6IG9iamVjdCA9PiB0aGlzLmhlYWRlcnNcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VzdG9tIHJlcXVlc3QgY29uZmlnXHJcbiAgICovXHJcbiAgZ2V0UmVxdWVzdENvbmZpZyA9ICgpOiBBeGlvc1JlcXVlc3RDb25maWcgPT4gdGhpcy5yZXF1ZXN0Q29uZmlnXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG5ldHdvcmtJRFxyXG4gICAqL1xyXG4gIGdldE5ldHdvcmtJRCA9ICgpOiBudW1iZXIgPT4gdGhpcy5uZXR3b3JrSURcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbmV0d29ya0lEXHJcbiAgICovXHJcbiAgc2V0TmV0d29ya0lEID0gKG5ldElEOiBudW1iZXIpOiB2b2lkID0+IHtcclxuICAgIHRoaXMubmV0d29ya0lEID0gbmV0SURcclxuICAgIHRoaXMuaHJwID0gZ2V0UHJlZmVycmVkSFJQKHRoaXMubmV0d29ya0lEKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgSHVtYW4tUmVhZGFibGUtUGFydCBvZiB0aGUgbmV0d29yayBhc3NvY2lhdGVkIHdpdGggdGhpcyBrZXkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgW1tLZXlQYWlyXV0ncyBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrJ3MgQmVjaDMyIGFkZHJlc3Npbmcgc2NoZW1lXHJcbiAgICovXHJcbiAgZ2V0SFJQID0gKCk6IHN0cmluZyA9PiB0aGlzLmhycFxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB0aGUgSHVtYW4tUmVhZGFibGUtUGFydCBvZiB0aGUgbmV0d29yayBhc3NvY2lhdGVkIHdpdGggdGhpcyBrZXkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaHJwIFN0cmluZyBmb3IgdGhlIEh1bWFuLVJlYWRhYmxlLVBhcnQgb2YgQmVjaDMyIGFkZHJlc3Nlc1xyXG4gICAqL1xyXG4gIHNldEhSUCA9IChocnA6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgdGhpcy5ocnAgPSBocnBcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBuZXcgY3VzdG9tIGhlYWRlciB0byBiZSBpbmNsdWRlZCB3aXRoIGFsbCByZXF1ZXN0cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBrZXkgSGVhZGVyIG5hbWVcclxuICAgKiBAcGFyYW0gdmFsdWUgSGVhZGVyIHZhbHVlXHJcbiAgICovXHJcbiAgc2V0SGVhZGVyID0gKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLmhlYWRlcnNbYCR7a2V5fWBdID0gdmFsdWVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYSBwcmV2aW91c2x5IGFkZGVkIGN1c3RvbSBoZWFkZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ga2V5IEhlYWRlciBuYW1lXHJcbiAgICovXHJcbiAgcmVtb3ZlSGVhZGVyID0gKGtleTogc3RyaW5nKTogdm9pZCA9PiB7XHJcbiAgICBkZWxldGUgdGhpcy5oZWFkZXJzW2Ake2tleX1gXVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbGwgaGVhZGVycy5cclxuICAgKi9cclxuICByZW1vdmVBbGxIZWFkZXJzID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMuaGVhZGVycykge1xyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuaGVhZGVycywgcHJvcCkpIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5oZWFkZXJzW2Ake3Byb3B9YF1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIG5ldyBjdXN0b20gY29uZmlnIHZhbHVlIHRvIGJlIGluY2x1ZGVkIHdpdGggYWxsIHJlcXVlc3RzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGtleSBDb25maWcgbmFtZVxyXG4gICAqIEBwYXJhbSB2YWx1ZSBDb25maWcgdmFsdWVcclxuICAgKi9cclxuICBzZXRSZXF1ZXN0Q29uZmlnID0gKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbik6IHZvaWQgPT4ge1xyXG4gICAgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake2tleX1gXSA9IHZhbHVlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCByZXF1ZXN0IGNvbmZpZy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBrZXkgSGVhZGVyIG5hbWVcclxuICAgKi9cclxuICByZW1vdmVSZXF1ZXN0Q29uZmlnID0gKGtleTogc3RyaW5nKTogdm9pZCA9PiB7XHJcbiAgICBkZWxldGUgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake2tleX1gXVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbGwgcmVxdWVzdCBjb25maWdzLlxyXG4gICAqL1xyXG4gIHJlbW92ZUFsbFJlcXVlc3RDb25maWdzID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMucmVxdWVzdENvbmZpZykge1xyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMucmVxdWVzdENvbmZpZywgcHJvcCkpIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake3Byb3B9YF1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdGVtcG9yYXJ5IGF1dGggdG9rZW4gdXNlZCBmb3IgY29tbXVuaWNhdGluZyB3aXRoIHRoZSBub2RlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGF1dGggQSB0ZW1wb3JhcnkgdG9rZW4gcHJvdmlkZWQgYnkgdGhlIG5vZGUgZW5hYmxpbmcgYWNjZXNzIHRvIHRoZSBlbmRwb2ludHMgb24gdGhlIG5vZGUuXHJcbiAgICovXHJcbiAgc2V0QXV0aFRva2VuID0gKGF1dGg6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgdGhpcy5hdXRoID0gYXV0aFxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIF9zZXRIZWFkZXJzID0gKGhlYWRlcnM6IGFueSk6IEF4aW9zUmVxdWVzdEhlYWRlcnMgPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLmhlYWRlcnMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5oZWFkZXJzKSkge1xyXG4gICAgICAgIGhlYWRlcnNbYCR7a2V5fWBdID0gdmFsdWVcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgdGhpcy5hdXRoID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IGBCZWFyZXIgJHt0aGlzLmF1dGh9YFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGhlYWRlcnNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gQVBJIHRvIHRoZSBtaWRkbGV3YXJlLiBUaGUgQVBJIHJlc29sdmVzIHRvIGEgcmVnaXN0ZXJlZCBibG9ja2NoYWluJ3MgUlBDLlxyXG4gICAqXHJcbiAgICogSW4gVHlwZVNjcmlwdDpcclxuICAgKiBgYGBqc1xyXG4gICAqIGp1bmVvLmFkZEFQSTxNeVZNQ2xhc3M+KFwibXljaGFpblwiLCBNeVZNQ2xhc3MsIFwiL2V4dC9iYy9teWNoYWluXCIpXHJcbiAgICogYGBgXHJcbiAgICpcclxuICAgKiBJbiBKYXZhc2NyaXB0OlxyXG4gICAqIGBgYGpzXHJcbiAgICoganVuZW8uYWRkQVBJKFwibXljaGFpblwiLCBNeVZNQ2xhc3MsIFwiL2V4dC9iYy9teWNoYWluXCIpXHJcbiAgICogYGBgXHJcbiAgICpcclxuICAgKiBAdHlwZXBhcmFtIEdBIENsYXNzIG9mIHRoZSBBUEkgYmVpbmcgYWRkZWRcclxuICAgKiBAcGFyYW0gYXBpTmFtZSBBIGxhYmVsIGZvciByZWZlcmVuY2luZyB0aGUgQVBJIGluIHRoZSBmdXR1cmVcclxuICAgKiBAcGFyYW0gQ29uc3RydWN0b3JGTiBBIHJlZmVyZW5jZSB0byB0aGUgY2xhc3Mgd2hpY2ggaW5zdGFudGlhdGVzIHRoZSBBUElcclxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEFQSVxyXG4gICAqXHJcbiAgICovXHJcbiAgYWRkQVBJID0gPEdBIGV4dGVuZHMgQVBJQmFzZT4oXHJcbiAgICBhcGlOYW1lOiBzdHJpbmcsXHJcbiAgICBDb25zdHJ1Y3RvckZOOiBuZXcgKFxyXG4gICAgICBqdW5lOiBKdW5lb0NvcmUsXHJcbiAgICAgIGJhc2V1cmw/OiBzdHJpbmcsXHJcbiAgICAgIC4uLmFyZ3M6IGFueVtdXHJcbiAgICApID0+IEdBLFxyXG4gICAgYmFzZXVybDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgLi4uYXJnczogYW55W11cclxuICApID0+IHtcclxuICAgIGlmICh0eXBlb2YgYmFzZXVybCA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLmFwaXNbYCR7YXBpTmFtZX1gXSA9IG5ldyBDb25zdHJ1Y3RvckZOKHRoaXMsIHVuZGVmaW5lZCwgLi4uYXJncylcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYXBpc1tgJHthcGlOYW1lfWBdID0gbmV3IENvbnN0cnVjdG9yRk4odGhpcywgYmFzZXVybCwgLi4uYXJncylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHJpZXZlcyBhIHJlZmVyZW5jZSB0byBhbiBBUEkgYnkgaXRzIGFwaU5hbWUgbGFiZWwuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXBpTmFtZSBOYW1lIG9mIHRoZSBBUEkgdG8gcmV0dXJuXHJcbiAgICovXHJcbiAgYXBpID0gPEdBIGV4dGVuZHMgQVBJQmFzZT4oYXBpTmFtZTogc3RyaW5nKTogR0EgPT5cclxuICAgIHRoaXMuYXBpc1tgJHthcGlOYW1lfWBdIGFzIEdBXHJcblxyXG4gIC8qKlxyXG4gICAqIEBpZ25vcmVcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgX3JlcXVlc3QgPSBhc3luYyAoXHJcbiAgICB4aHJtZXRob2Q6IE1ldGhvZCxcclxuICAgIGJhc2V1cmw6IHN0cmluZyxcclxuICAgIGdldGRhdGE6IG9iamVjdCxcclxuICAgIHBvc3RkYXRhOiBzdHJpbmcgfCBvYmplY3QgfCBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyxcclxuICAgIGhlYWRlcnM6IEF4aW9zUmVxdWVzdEhlYWRlcnMgPSB7fSxcclxuICAgIGF4aW9zQ29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWRcclxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcclxuICAgIGxldCBjb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZ1xyXG4gICAgaWYgKGF4aW9zQ29uZmlnKSB7XHJcbiAgICAgIGNvbmZpZyA9IHtcclxuICAgICAgICAuLi5heGlvc0NvbmZpZyxcclxuICAgICAgICAuLi50aGlzLnJlcXVlc3RDb25maWdcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uZmlnID0ge1xyXG4gICAgICAgIGJhc2VVUkw6IHRoaXMudXJsLFxyXG4gICAgICAgIHJlc3BvbnNlVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgLi4udGhpcy5yZXF1ZXN0Q29uZmlnXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbmZpZy51cmwgPSBiYXNldXJsXHJcbiAgICBjb25maWcubWV0aG9kID0geGhybWV0aG9kXHJcbiAgICBjb25maWcuaGVhZGVycyA9IGhlYWRlcnNcclxuICAgIGNvbmZpZy5kYXRhID0gcG9zdGRhdGFcclxuICAgIGNvbmZpZy5wYXJhbXMgPSBnZXRkYXRhXHJcbiAgICAvLyB1c2UgdGhlIGZldGNoIGFkYXB0ZXIgaWYgZmV0Y2ggaXMgYXZhaWxhYmxlIGUuZy4gbm9uIE5vZGU8MTcgZW52XHJcbiAgICBpZiAodHlwZW9mIGZldGNoICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGNvbmZpZy5hZGFwdGVyID0gZmV0Y2hBZGFwdGVyXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwOiBBeGlvc1Jlc3BvbnNlPGFueT4gPSBhd2FpdCBheGlvcy5yZXF1ZXN0KGNvbmZpZylcclxuICAgIC8vIHB1cmdpbmcgYWxsIHRoYXQgaXMgYXhpb3NcclxuICAgIGNvbnN0IHhocmRhdGE6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBuZXcgUmVxdWVzdFJlc3BvbnNlRGF0YShcclxuICAgICAgcmVzcC5kYXRhLFxyXG4gICAgICByZXNwLmhlYWRlcnMsXHJcbiAgICAgIHJlc3Auc3RhdHVzLFxyXG4gICAgICByZXNwLnN0YXR1c1RleHQsXHJcbiAgICAgIHJlc3AucmVxdWVzdFxyXG4gICAgKVxyXG4gICAgcmV0dXJuIHhocmRhdGFcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1ha2VzIGEgR0VUIGNhbGwgdG8gYW4gQVBJLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgYXBpXHJcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIEdFVFxyXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXHJcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxyXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXHJcbiAgICovXHJcbiAgZ2V0ID0gKFxyXG4gICAgYmFzZXVybDogc3RyaW5nLFxyXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxyXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXHJcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxyXG4gICAgdGhpcy5fcmVxdWVzdChcclxuICAgICAgXCJHRVRcIixcclxuICAgICAgYmFzZXVybCxcclxuICAgICAgZ2V0ZGF0YSxcclxuICAgICAge30sXHJcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXHJcbiAgICAgIGF4aW9zQ29uZmlnXHJcbiAgICApXHJcblxyXG4gIC8qKlxyXG4gICAqIE1ha2VzIGEgREVMRVRFIGNhbGwgdG8gYW4gQVBJLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgQVBJXHJcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIERFTEVURVxyXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXHJcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxyXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXHJcbiAgICovXHJcbiAgZGVsZXRlID0gKFxyXG4gICAgYmFzZXVybDogc3RyaW5nLFxyXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxyXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXHJcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxyXG4gICAgdGhpcy5fcmVxdWVzdChcclxuICAgICAgXCJERUxFVEVcIixcclxuICAgICAgYmFzZXVybCxcclxuICAgICAgZ2V0ZGF0YSxcclxuICAgICAge30sXHJcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXHJcbiAgICAgIGF4aW9zQ29uZmlnXHJcbiAgICApXHJcblxyXG4gIC8qKlxyXG4gICAqIE1ha2VzIGEgUE9TVCBjYWxsIHRvIGFuIEFQSS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIEFQSVxyXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQT1NUXHJcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQT1NUXHJcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcclxuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXHJcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cclxuICAgKi9cclxuICBwb3N0ID0gKFxyXG4gICAgYmFzZXVybDogc3RyaW5nLFxyXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxyXG4gICAgcG9zdGRhdGE6IHN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxyXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXHJcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxyXG4gICAgdGhpcy5fcmVxdWVzdChcclxuICAgICAgXCJQT1NUXCIsXHJcbiAgICAgIGJhc2V1cmwsXHJcbiAgICAgIGdldGRhdGEsXHJcbiAgICAgIHBvc3RkYXRhLFxyXG4gICAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxyXG4gICAgICBheGlvc0NvbmZpZ1xyXG4gICAgKVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlcyBhIFBVVCBjYWxsIHRvIGFuIEFQSS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGJhc2V1cmxcclxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUFVUXHJcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQVVRcclxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xyXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcclxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxyXG4gICAqL1xyXG4gIHB1dCA9IChcclxuICAgIGJhc2V1cmw6IHN0cmluZyxcclxuICAgIGdldGRhdGE6IG9iamVjdCxcclxuICAgIHBvc3RkYXRhOiBzdHJpbmcgfCBvYmplY3QgfCBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyxcclxuICAgIGhlYWRlcnM6IG9iamVjdCA9IHt9LFxyXG4gICAgYXhpb3NDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZFxyXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT5cclxuICAgIHRoaXMuX3JlcXVlc3QoXHJcbiAgICAgIFwiUFVUXCIsXHJcbiAgICAgIGJhc2V1cmwsXHJcbiAgICAgIGdldGRhdGEsXHJcbiAgICAgIHBvc3RkYXRhLFxyXG4gICAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxyXG4gICAgICBheGlvc0NvbmZpZ1xyXG4gICAgKVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlcyBhIFBBVENIIGNhbGwgdG8gYW4gQVBJLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgYmFzZXVybFxyXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQQVRDSFxyXG4gICAqIEBwYXJhbSBwb3N0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUEFUQ0hcclxuICAgKiBAcGFyYW0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyB0aGUgcGFyYW1ldGVycyBvZiB0aGUgQVBJIGNhbGxcclxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xyXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcclxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxyXG4gICAqL1xyXG4gIHBhdGNoID0gKFxyXG4gICAgYmFzZXVybDogc3RyaW5nLFxyXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxyXG4gICAgcG9zdGRhdGE6IHN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxyXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXHJcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxyXG4gICAgdGhpcy5fcmVxdWVzdChcclxuICAgICAgXCJQQVRDSFwiLFxyXG4gICAgICBiYXNldXJsLFxyXG4gICAgICBnZXRkYXRhLFxyXG4gICAgICBwb3N0ZGF0YSxcclxuICAgICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcclxuICAgICAgYXhpb3NDb25maWdcclxuICAgIClcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBKdW5lbyBpbnN0YW5jZS4gU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBKdW5lbyBDbGllbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgSnVuZW8gQ2xpZW50IEFQSXNcclxuICAgKiBAcGFyYW0gcG9ydCBUaGUgcG9ydCB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBKdW5lbyBDbGllbnQgQVBJc1xyXG4gICAqIEBwYXJhbSBwcm90b2NvbCBUaGUgcHJvdG9jb2wgc3RyaW5nIHRvIHVzZSBiZWZvcmUgYSBcIjovL1wiIGluIGEgcmVxdWVzdCwgZXg6IFwiaHR0cFwiLCBcImh0dHBzXCIsIFwiZ2l0XCIsIFwid3NcIiwgZXRjIC4uLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGhvc3Q/OiBzdHJpbmcsIHBvcnQ/OiBudW1iZXIsIHByb3RvY29sOiBzdHJpbmcgPSBcImh0dHBcIikge1xyXG4gICAgaWYgKGhvc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuc2V0QWRkcmVzcyhob3N0LCBwb3J0LCBwcm90b2NvbClcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19