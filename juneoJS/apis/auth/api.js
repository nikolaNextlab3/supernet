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
exports.AuthAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's AuthAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class AuthAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]]
     * method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/auth" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/auth") {
        super(core, baseURL);
        /**
         * Creates a new authorization token that grants access to one or more API endpoints.
         *
         * @param password This node's authorization token password, set through the CLI when the node was launched.
         * @param endpoints A list of endpoints that will be accessible using the generated token. If there"s an element that is "*", this token can reach any endpoint.
         *
         * @returns Returns a Promise string containing the authorization token.
         */
        this.newToken = (password, endpoints) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                password,
                endpoints
            };
            const response = yield this.callMethod("auth.newToken", params);
            return response.data.result.token
                ? response.data.result.token
                : response.data.result;
        });
        /**
         * Revokes an authorization token, removing all of its rights to access endpoints.
         *
         * @param password This node's authorization token password, set through the CLI when the node was launched.
         * @param token An authorization token whose access should be revoked.
         *
         * @returns Returns a Promise boolean indicating if a token was successfully revoked.
         */
        this.revokeToken = (password, token) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                password,
                token
            };
            const response = yield this.callMethod("auth.revokeToken", params);
            return response.data.result.success;
        });
        /**
         * Change this node's authorization token password. **Any authorization tokens created under an old password will become invalid.**
         *
         * @param oldPassword This node's authorization token password, set through the CLI when the node was launched.
         * @param newPassword A new password for this node's authorization token issuance.
         *
         * @returns Returns a Promise boolean indicating if the password was successfully changed.
         */
        this.changePassword = (oldPassword, newPassword) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                oldPassword,
                newPassword
            };
            const response = yield this.callMethod("auth.changePassword", params);
            return response.data.result.success;
        });
    }
}
exports.AuthAPI = AuthAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXV0aC9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBS0Esa0RBQThDO0FBUzlDOzs7Ozs7R0FNRztBQUNILE1BQWEsT0FBUSxTQUFRLGlCQUFPO0lBcUVsQzs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWUsRUFBRSxVQUFrQixXQUFXO1FBQ3hELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUE1RXRCOzs7Ozs7O1dBT0c7UUFDSCxhQUFRLEdBQUcsQ0FDVCxRQUFnQixFQUNoQixTQUFtQixFQUNvQixFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFzQjtnQkFDaEMsUUFBUTtnQkFDUixTQUFTO2FBQ1YsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELGVBQWUsRUFDZixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSztnQkFDL0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7Z0JBQzVCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7O1dBT0c7UUFDSCxnQkFBVyxHQUFHLENBQU8sUUFBZ0IsRUFBRSxLQUFhLEVBQW9CLEVBQUU7WUFDeEUsTUFBTSxNQUFNLEdBQXlCO2dCQUNuQyxRQUFRO2dCQUNSLEtBQUs7YUFDTixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsa0JBQWtCLEVBQ2xCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUE7UUFDckMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsbUJBQWMsR0FBRyxDQUNmLFdBQW1CLEVBQ25CLFdBQW1CLEVBQ0QsRUFBRTtZQUNwQixNQUFNLE1BQU0sR0FBNEI7Z0JBQ3RDLFdBQVc7Z0JBQ1gsV0FBVzthQUNaLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtRQUNyQyxDQUFDLENBQUEsQ0FBQTtJQVdELENBQUM7Q0FDRjtBQS9FRCwwQkErRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLUF1dGhcclxuICovXHJcbmltcG9ydCBKdW5lb0NvcmUgZnJvbSBcIi4uLy4uL2p1bmVvXCJcclxuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gXCIuLi8uLi9jb21tb24vanJwY2FwaVwiXHJcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaWJhc2VcIlxyXG5pbXBvcnQgeyBFcnJvclJlc3BvbnNlT2JqZWN0IH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcbmltcG9ydCB7XHJcbiAgQ2hhbmdlUGFzc3dvcmRJbnRlcmZhY2UsXHJcbiAgTmV3VG9rZW5JbnRlcmZhY2UsXHJcbiAgUmV2b2tlVG9rZW5JbnRlcmZhY2VcclxufSBmcm9tIFwiLi9pbnRlcmZhY2VzXCJcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBBdXRoQVBJLlxyXG4gKlxyXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xyXG4gKlxyXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbSnVuZW8uYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBKdW5lby5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoQVBJIGV4dGVuZHMgSlJQQ0FQSSB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBhdXRob3JpemF0aW9uIHRva2VuIHRoYXQgZ3JhbnRzIGFjY2VzcyB0byBvbmUgb3IgbW9yZSBBUEkgZW5kcG9pbnRzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoaXMgbm9kZSdzIGF1dGhvcml6YXRpb24gdG9rZW4gcGFzc3dvcmQsIHNldCB0aHJvdWdoIHRoZSBDTEkgd2hlbiB0aGUgbm9kZSB3YXMgbGF1bmNoZWQuXHJcbiAgICogQHBhcmFtIGVuZHBvaW50cyBBIGxpc3Qgb2YgZW5kcG9pbnRzIHRoYXQgd2lsbCBiZSBhY2Nlc3NpYmxlIHVzaW5nIHRoZSBnZW5lcmF0ZWQgdG9rZW4uIElmIHRoZXJlXCJzIGFuIGVsZW1lbnQgdGhhdCBpcyBcIipcIiwgdGhpcyB0b2tlbiBjYW4gcmVhY2ggYW55IGVuZHBvaW50LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGF1dGhvcml6YXRpb24gdG9rZW4uXHJcbiAgICovXHJcbiAgbmV3VG9rZW4gPSBhc3luYyAoXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgZW5kcG9pbnRzOiBzdHJpbmdbXVxyXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBOZXdUb2tlbkludGVyZmFjZSA9IHtcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIGVuZHBvaW50c1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwiYXV0aC5uZXdUb2tlblwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50b2tlblxyXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnRva2VuXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldm9rZXMgYW4gYXV0aG9yaXphdGlvbiB0b2tlbiwgcmVtb3ZpbmcgYWxsIG9mIGl0cyByaWdodHMgdG8gYWNjZXNzIGVuZHBvaW50cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGlzIG5vZGUncyBhdXRob3JpemF0aW9uIHRva2VuIHBhc3N3b3JkLCBzZXQgdGhyb3VnaCB0aGUgQ0xJIHdoZW4gdGhlIG5vZGUgd2FzIGxhdW5jaGVkLlxyXG4gICAqIEBwYXJhbSB0b2tlbiBBbiBhdXRob3JpemF0aW9uIHRva2VuIHdob3NlIGFjY2VzcyBzaG91bGQgYmUgcmV2b2tlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBhIHRva2VuIHdhcyBzdWNjZXNzZnVsbHkgcmV2b2tlZC5cclxuICAgKi9cclxuICByZXZva2VUb2tlbiA9IGFzeW5jIChwYXNzd29yZDogc3RyaW5nLCB0b2tlbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IFJldm9rZVRva2VuSW50ZXJmYWNlID0ge1xyXG4gICAgICBwYXNzd29yZCxcclxuICAgICAgdG9rZW5cclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImF1dGgucmV2b2tlVG9rZW5cIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hhbmdlIHRoaXMgbm9kZSdzIGF1dGhvcml6YXRpb24gdG9rZW4gcGFzc3dvcmQuICoqQW55IGF1dGhvcml6YXRpb24gdG9rZW5zIGNyZWF0ZWQgdW5kZXIgYW4gb2xkIHBhc3N3b3JkIHdpbGwgYmVjb21lIGludmFsaWQuKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBvbGRQYXNzd29yZCBUaGlzIG5vZGUncyBhdXRob3JpemF0aW9uIHRva2VuIHBhc3N3b3JkLCBzZXQgdGhyb3VnaCB0aGUgQ0xJIHdoZW4gdGhlIG5vZGUgd2FzIGxhdW5jaGVkLlxyXG4gICAqIEBwYXJhbSBuZXdQYXNzd29yZCBBIG5ldyBwYXNzd29yZCBmb3IgdGhpcyBub2RlJ3MgYXV0aG9yaXphdGlvbiB0b2tlbiBpc3N1YW5jZS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGJvb2xlYW4gaW5kaWNhdGluZyBpZiB0aGUgcGFzc3dvcmQgd2FzIHN1Y2Nlc3NmdWxseSBjaGFuZ2VkLlxyXG4gICAqL1xyXG4gIGNoYW5nZVBhc3N3b3JkID0gYXN5bmMgKFxyXG4gICAgb2xkUGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIG5ld1Bhc3N3b3JkOiBzdHJpbmdcclxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQ2hhbmdlUGFzc3dvcmRJbnRlcmZhY2UgPSB7XHJcbiAgICAgIG9sZFBhc3N3b3JkLFxyXG4gICAgICBuZXdQYXNzd29yZFxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwiYXV0aC5jaGFuZ2VQYXNzd29yZFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkIHVzZSB0aGUgW1tKdW5lby5hZGRBUEldXVxyXG4gICAqIG1ldGhvZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb3JlIEEgcmVmZXJlbmNlIHRvIHRoZSBKdW5lbyBjbGFzc1xyXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L2F1dGhcIiBhcyB0aGUgcGF0aCB0byBycGMncyBiYXNlVVJMXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29yZTogSnVuZW9Db3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvYXV0aFwiKSB7XHJcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxyXG4gIH1cclxufVxyXG4iXX0=