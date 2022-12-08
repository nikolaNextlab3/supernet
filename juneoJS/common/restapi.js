"use strict";
/**
 * @packageDocumentation
 * @module Common-RESTAPI
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
exports.RESTAPI = void 0;
const apibase_1 = require("./apibase");
class RESTAPI extends apibase_1.APIBase {
    /**
     *
     * @param core Reference to the Juneo instance using this endpoint
     * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/jvm"
     * @param contentType Optional Determines the type of the entity attached to the
     * incoming request
     * @param acceptType Optional Determines the type of representation which is
     * desired on the client side
     */
    constructor(core, baseURL, contentType = "application/json;charset=UTF-8", acceptType = undefined) {
        super(core, baseURL);
        this.prepHeaders = (contentType, acceptType) => {
            const headers = {};
            if (contentType !== undefined) {
                headers["Content-Type"] = contentType;
            }
            else {
                headers["Content-Type"] = this.contentType;
            }
            if (acceptType !== undefined) {
                headers["Accept"] = acceptType;
            }
            else if (this.acceptType !== undefined) {
                headers["Accept"] = this.acceptType;
            }
            return headers;
        };
        this.axConf = () => {
            return {
                baseURL: this.core.getURL(),
                responseType: "json"
            };
        };
        this.get = (baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.get(ep, {}, headers, this.axConf());
            return resp;
        });
        this.post = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.post(ep, {}, JSON.stringify(rpc), headers, this.axConf());
            return resp;
        });
        this.put = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.put(ep, {}, JSON.stringify(rpc), headers, this.axConf());
            return resp;
        });
        this.delete = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.delete(ep, {}, headers, this.axConf());
            return resp;
        });
        this.patch = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.patch(ep, {}, JSON.stringify(rpc), headers, this.axConf());
            return resp;
        });
        /**
         * Returns the type of the entity attached to the incoming request
         */
        this.getContentType = () => this.contentType;
        /**
         * Returns what type of representation is desired at the client side
         */
        this.getAcceptType = () => this.acceptType;
        this.contentType = contentType;
        this.acceptType = acceptType;
    }
}
exports.RESTAPI = RESTAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdGFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vcmVzdGFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7QUFJSCx1Q0FBd0Q7QUFFeEQsTUFBYSxPQUFRLFNBQVEsaUJBQU87SUFtS2xDOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxJQUFlLEVBQ2YsT0FBZSxFQUNmLGNBQXNCLGdDQUFnQyxFQUN0RCxhQUFxQixTQUFTO1FBRTlCLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUE5S1osZ0JBQVcsR0FBRyxDQUN0QixXQUFvQixFQUNwQixVQUFtQixFQUNYLEVBQUU7WUFDVixNQUFNLE9BQU8sR0FBVyxFQUFFLENBQUE7WUFDMUIsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO2dCQUM3QixPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsV0FBVyxDQUFBO2FBQ3RDO2lCQUFNO2dCQUNMLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO2FBQzNDO1lBRUQsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUM1QixPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFBO2FBQy9CO2lCQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFBO2FBQ3BDO1lBQ0QsT0FBTyxPQUFPLENBQUE7UUFDaEIsQ0FBQyxDQUFBO1FBRVMsV0FBTSxHQUFHLEdBQXVCLEVBQUU7WUFDMUMsT0FBTztnQkFDTCxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxNQUFNO2FBQ3JCLENBQUE7UUFDSCxDQUFDLENBQUE7UUFFRCxRQUFHLEdBQUcsQ0FDSixPQUFnQixFQUNoQixX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b21tb24tUkVTVEFQSVxyXG4gKi9cclxuXHJcbmltcG9ydCB7IEF4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gXCJheGlvc1wiXHJcbmltcG9ydCBKdW5lb0NvcmUgZnJvbSBcIi4uL2p1bmVvXCJcclxuaW1wb3J0IHsgQVBJQmFzZSwgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuL2FwaWJhc2VcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFJFU1RBUEkgZXh0ZW5kcyBBUElCYXNlIHtcclxuICBwcm90ZWN0ZWQgY29udGVudFR5cGU6IHN0cmluZ1xyXG4gIHByb3RlY3RlZCBhY2NlcHRUeXBlOiBzdHJpbmdcclxuXHJcbiAgcHJvdGVjdGVkIHByZXBIZWFkZXJzID0gKFxyXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXHJcbiAgICBhY2NlcHRUeXBlPzogc3RyaW5nXHJcbiAgKTogb2JqZWN0ID0+IHtcclxuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHt9XHJcbiAgICBpZiAoY29udGVudFR5cGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBoZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdID0gY29udGVudFR5cGVcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0gPSB0aGlzLmNvbnRlbnRUeXBlXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFjY2VwdFR5cGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBoZWFkZXJzW1wiQWNjZXB0XCJdID0gYWNjZXB0VHlwZVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLmFjY2VwdFR5cGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBoZWFkZXJzW1wiQWNjZXB0XCJdID0gdGhpcy5hY2NlcHRUeXBlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gaGVhZGVyc1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGF4Q29uZiA9ICgpOiBBeGlvc1JlcXVlc3RDb25maWcgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYmFzZVVSTDogdGhpcy5jb3JlLmdldFVSTCgpLFxyXG4gICAgICByZXNwb25zZVR5cGU6IFwianNvblwiXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXQgPSBhc3luYyAoXHJcbiAgICBiYXNlVVJMPzogc3RyaW5nLFxyXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXHJcbiAgICBhY2NlcHRUeXBlPzogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB7XHJcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcclxuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHRoaXMucHJlcEhlYWRlcnMoY29udGVudFR5cGUsIGFjY2VwdFR5cGUpXHJcbiAgICBjb25zdCByZXNwOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jb3JlLmdldChcclxuICAgICAgZXAsXHJcbiAgICAgIHt9LFxyXG4gICAgICBoZWFkZXJzLFxyXG4gICAgICB0aGlzLmF4Q29uZigpXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcFxyXG4gIH1cclxuXHJcbiAgcG9zdCA9IGFzeW5jIChcclxuICAgIG1ldGhvZDogc3RyaW5nLFxyXG4gICAgcGFyYW1zPzogb2JqZWN0W10gfCBvYmplY3QsXHJcbiAgICBiYXNlVVJMPzogc3RyaW5nLFxyXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXHJcbiAgICBhY2NlcHRUeXBlPzogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB7XHJcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcclxuICAgIGNvbnN0IHJwYzogYW55ID0ge31cclxuICAgIHJwYy5tZXRob2QgPSBtZXRob2RcclxuXHJcbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcclxuICAgIGlmIChwYXJhbXMpIHtcclxuICAgICAgcnBjLnBhcmFtcyA9IHBhcmFtc1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHRoaXMucHJlcEhlYWRlcnMoY29udGVudFR5cGUsIGFjY2VwdFR5cGUpXHJcbiAgICBjb25zdCByZXNwOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jb3JlLnBvc3QoXHJcbiAgICAgIGVwLFxyXG4gICAgICB7fSxcclxuICAgICAgSlNPTi5zdHJpbmdpZnkocnBjKSxcclxuICAgICAgaGVhZGVycyxcclxuICAgICAgdGhpcy5heENvbmYoKVxyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BcclxuICB9XHJcblxyXG4gIHB1dCA9IGFzeW5jIChcclxuICAgIG1ldGhvZDogc3RyaW5nLFxyXG4gICAgcGFyYW1zPzogb2JqZWN0W10gfCBvYmplY3QsXHJcbiAgICBiYXNlVVJMPzogc3RyaW5nLFxyXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXHJcbiAgICBhY2NlcHRUeXBlPzogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB7XHJcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcclxuICAgIGNvbnN0IHJwYzogYW55ID0ge31cclxuICAgIHJwYy5tZXRob2QgPSBtZXRob2RcclxuXHJcbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcclxuICAgIGlmIChwYXJhbXMpIHtcclxuICAgICAgcnBjLnBhcmFtcyA9IHBhcmFtc1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHRoaXMucHJlcEhlYWRlcnMoY29udGVudFR5cGUsIGFjY2VwdFR5cGUpXHJcbiAgICBjb25zdCByZXNwOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jb3JlLnB1dChcclxuICAgICAgZXAsXHJcbiAgICAgIHt9LFxyXG4gICAgICBKU09OLnN0cmluZ2lmeShycGMpLFxyXG4gICAgICBoZWFkZXJzLFxyXG4gICAgICB0aGlzLmF4Q29uZigpXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcFxyXG4gIH1cclxuXHJcbiAgZGVsZXRlID0gYXN5bmMgKFxyXG4gICAgbWV0aG9kOiBzdHJpbmcsXHJcbiAgICBwYXJhbXM/OiBvYmplY3RbXSB8IG9iamVjdCxcclxuICAgIGJhc2VVUkw/OiBzdHJpbmcsXHJcbiAgICBjb250ZW50VHlwZT86IHN0cmluZyxcclxuICAgIGFjY2VwdFR5cGU/OiBzdHJpbmdcclxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcclxuICAgIGNvbnN0IGVwOiBzdHJpbmcgPSBiYXNlVVJMIHx8IHRoaXMuYmFzZVVSTFxyXG4gICAgY29uc3QgcnBjOiBhbnkgPSB7fVxyXG4gICAgcnBjLm1ldGhvZCA9IG1ldGhvZFxyXG5cclxuICAgIC8vIFNldCBwYXJhbWV0ZXJzIGlmIGV4aXN0c1xyXG4gICAgaWYgKHBhcmFtcykge1xyXG4gICAgICBycGMucGFyYW1zID0gcGFyYW1zXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaGVhZGVyczogb2JqZWN0ID0gdGhpcy5wcmVwSGVhZGVycyhjb250ZW50VHlwZSwgYWNjZXB0VHlwZSlcclxuICAgIGNvbnN0IHJlc3A6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNvcmUuZGVsZXRlKFxyXG4gICAgICBlcCxcclxuICAgICAge30sXHJcbiAgICAgIGhlYWRlcnMsXHJcbiAgICAgIHRoaXMuYXhDb25mKClcclxuICAgIClcclxuICAgIHJldHVybiByZXNwXHJcbiAgfVxyXG5cclxuICBwYXRjaCA9IGFzeW5jIChcclxuICAgIG1ldGhvZDogc3RyaW5nLFxyXG4gICAgcGFyYW1zPzogb2JqZWN0W10gfCBvYmplY3QsXHJcbiAgICBiYXNlVVJMPzogc3RyaW5nLFxyXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXHJcbiAgICBhY2NlcHRUeXBlPzogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB7XHJcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcclxuICAgIGNvbnN0IHJwYzogYW55ID0ge31cclxuICAgIHJwYy5tZXRob2QgPSBtZXRob2RcclxuXHJcbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcclxuICAgIGlmIChwYXJhbXMpIHtcclxuICAgICAgcnBjLnBhcmFtcyA9IHBhcmFtc1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHRoaXMucHJlcEhlYWRlcnMoY29udGVudFR5cGUsIGFjY2VwdFR5cGUpXHJcbiAgICBjb25zdCByZXNwOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jb3JlLnBhdGNoKFxyXG4gICAgICBlcCxcclxuICAgICAge30sXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHJwYyksXHJcbiAgICAgIGhlYWRlcnMsXHJcbiAgICAgIHRoaXMuYXhDb25mKClcclxuICAgIClcclxuICAgIHJldHVybiByZXNwXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB0eXBlIG9mIHRoZSBlbnRpdHkgYXR0YWNoZWQgdG8gdGhlIGluY29taW5nIHJlcXVlc3RcclxuICAgKi9cclxuICBnZXRDb250ZW50VHlwZSA9ICgpOiBzdHJpbmcgPT4gdGhpcy5jb250ZW50VHlwZVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoYXQgdHlwZSBvZiByZXByZXNlbnRhdGlvbiBpcyBkZXNpcmVkIGF0IHRoZSBjbGllbnQgc2lkZVxyXG4gICAqL1xyXG4gIGdldEFjY2VwdFR5cGUgPSAoKTogc3RyaW5nID0+IHRoaXMuYWNjZXB0VHlwZVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb3JlIFJlZmVyZW5jZSB0byB0aGUgSnVuZW8gaW5zdGFuY2UgdXNpbmcgdGhpcyBlbmRwb2ludFxyXG4gICAqIEBwYXJhbSBiYXNlVVJMIFBhdGggb2YgdGhlIEFQSXMgYmFzZVVSTCAtIGV4OiBcIi9leHQvYmMvanZtXCJcclxuICAgKiBAcGFyYW0gY29udGVudFR5cGUgT3B0aW9uYWwgRGV0ZXJtaW5lcyB0aGUgdHlwZSBvZiB0aGUgZW50aXR5IGF0dGFjaGVkIHRvIHRoZVxyXG4gICAqIGluY29taW5nIHJlcXVlc3RcclxuICAgKiBAcGFyYW0gYWNjZXB0VHlwZSBPcHRpb25hbCBEZXRlcm1pbmVzIHRoZSB0eXBlIG9mIHJlcHJlc2VudGF0aW9uIHdoaWNoIGlzXHJcbiAgICogZGVzaXJlZCBvbiB0aGUgY2xpZW50IHNpZGVcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGNvcmU6IEp1bmVvQ29yZSxcclxuICAgIGJhc2VVUkw6IHN0cmluZyxcclxuICAgIGNvbnRlbnRUeXBlOiBzdHJpbmcgPSBcImFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOFwiLFxyXG4gICAgYWNjZXB0VHlwZTogc3RyaW5nID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxyXG4gICAgdGhpcy5jb250ZW50VHlwZSA9IGNvbnRlbnRUeXBlXHJcbiAgICB0aGlzLmFjY2VwdFR5cGUgPSBhY2NlcHRUeXBlXHJcbiAgfVxyXG59XHJcbiJdfQ==