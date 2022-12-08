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
exports.KeystoreAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node API that is using the node's KeystoreAPI.
 *
 * **WARNING**: The KeystoreAPI is to be used by the node-owner as the data is stored locally on the node. Do not trust the root user. If you are not the node-owner, do not use this as your wallet.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class KeystoreAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/keystore" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/keystore") {
        super(core, baseURL);
        /**
         * Creates a user in the node's database.
         *
         * @param username Name of the user to create
         * @param password Password for the user
         *
         * @returns Promise for a boolean with true on success
         */
        this.createUser = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("keystore.createUser", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Exports a user. The user can be imported to another node with keystore.importUser .
         *
         * @param username The name of the user to export
         * @param password The password of the user to export
         *
         * @returns Promise with a string importable using importUser
         */
        this.exportUser = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("keystore.exportUser", params);
            return response.data.result.user
                ? response.data.result.user
                : response.data.result;
        });
        /**
         * Imports a user file into the node's user database and assigns it to a username.
         *
         * @param username The name the user file should be imported into
         * @param user cb58 serialized string represetning a user"s data
         * @param password The user"s password
         *
         * @returns A promise with a true-value on success.
         */
        this.importUser = (username, user, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                user,
                password
            };
            const response = yield this.callMethod("keystore.importUser", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Lists the names of all users on the node.
         *
         * @returns Promise of an array with all user names.
         */
        this.listUsers = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("keystore.listUsers");
            return response.data.result.users;
        });
        /**
         * Deletes a user in the node's database.
         *
         * @param username Name of the user to delete
         * @param password Password for the user
         *
         * @returns Promise for a boolean with true on success
         */
        this.deleteUser = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("keystore.deleteUser", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
    }
}
exports.KeystoreAPI = KeystoreAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMva2V5c3RvcmUvYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUE4QztBQUs5Qzs7Ozs7Ozs7R0FRRztBQUNILE1BQWEsV0FBWSxTQUFRLGlCQUFPO0lBMkd0Qzs7Ozs7T0FLRztJQUNILFlBQVksSUFBZSxFQUFFLFVBQWtCLGVBQWU7UUFDNUQsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQWpIdEI7Ozs7Ozs7V0FPRztRQUNILGVBQVUsR0FBRyxDQUFPLFFBQWdCLEVBQUUsUUFBZ0IsRUFBb0IsRUFBRTtZQUMxRSxNQUFNLE1BQU0sR0FBbUI7Z0JBQzdCLFFBQVE7Z0JBQ1IsUUFBUTthQUNULENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQ2pDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUM5QixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDMUIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsZUFBVSxHQUFHLENBQU8sUUFBZ0IsRUFBRSxRQUFnQixFQUFtQixFQUFFO1lBQ3pFLE1BQU0sTUFBTSxHQUFtQjtnQkFDN0IsUUFBUTtnQkFDUixRQUFRO2FBQ1QsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixFQUNyQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTtnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7Z0JBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsZUFBVSxHQUFHLENBQ1gsUUFBZ0IsRUFDaEIsSUFBWSxFQUNaLFFBQWdCLEVBQ0UsRUFBRTtZQUNwQixNQUFNLE1BQU0sR0FBcUI7Z0JBQy9CLFFBQVE7Z0JBQ1IsSUFBSTtnQkFDSixRQUFRO2FBQ1QsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixFQUNyQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxjQUFTLEdBQUcsR0FBNEIsRUFBRTtZQUN4QyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxvQkFBb0IsQ0FDckIsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFBO1FBQ25DLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7V0FPRztRQUNILGVBQVUsR0FBRyxDQUFPLFFBQWdCLEVBQUUsUUFBZ0IsRUFBb0IsRUFBRTtZQUMxRSxNQUFNLE1BQU0sR0FBbUI7Z0JBQzdCLFFBQVE7Z0JBQ1IsUUFBUTthQUNULENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQ2pDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUM5QixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDMUIsQ0FBQyxDQUFBLENBQUE7SUFVRCxDQUFDO0NBQ0Y7QUFwSEQsa0NBb0hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1LZXlzdG9yZVxyXG4gKi9cclxuaW1wb3J0IEp1bmVvQ29yZSBmcm9tIFwiLi4vLi4vanVuZW9cIlxyXG5pbXBvcnQgeyBKUlBDQVBJIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9qcnBjYXBpXCJcclxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXHJcbmltcG9ydCB7IEltcG9ydFVzZXJQYXJhbXMgfSBmcm9tIFwiLi9pbnRlcmZhY2VzXCJcclxuaW1wb3J0IHsgQ3JlZHNJbnRlcmZhY2UgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2ludGVyZmFjZXNcIlxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSBBUEkgdGhhdCBpcyB1c2luZyB0aGUgbm9kZSdzIEtleXN0b3JlQVBJLlxyXG4gKlxyXG4gKiAqKldBUk5JTkcqKjogVGhlIEtleXN0b3JlQVBJIGlzIHRvIGJlIHVzZWQgYnkgdGhlIG5vZGUtb3duZXIgYXMgdGhlIGRhdGEgaXMgc3RvcmVkIGxvY2FsbHkgb24gdGhlIG5vZGUuIERvIG5vdCB0cnVzdCB0aGUgcm9vdCB1c2VyLiBJZiB5b3UgYXJlIG5vdCB0aGUgbm9kZS1vd25lciwgZG8gbm90IHVzZSB0aGlzIGFzIHlvdXIgd2FsbGV0LlxyXG4gKlxyXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xyXG4gKlxyXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbSnVuZW8uYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBKdW5lby5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBLZXlzdG9yZUFQSSBleHRlbmRzIEpSUENBUEkge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSB1c2VyIGluIHRoZSBub2RlJ3MgZGF0YWJhc2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgTmFtZSBvZiB0aGUgdXNlciB0byBjcmVhdGVcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgUGFzc3dvcmQgZm9yIHRoZSB1c2VyXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJvb2xlYW4gd2l0aCB0cnVlIG9uIHN1Y2Nlc3NcclxuICAgKi9cclxuICBjcmVhdGVVc2VyID0gYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQ3JlZHNJbnRlcmZhY2UgPSB7XHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZFxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwia2V5c3RvcmUuY3JlYXRlVXNlclwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHBvcnRzIGEgdXNlci4gVGhlIHVzZXIgY2FuIGJlIGltcG9ydGVkIHRvIGFub3RoZXIgbm9kZSB3aXRoIGtleXN0b3JlLmltcG9ydFVzZXIgLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIGV4cG9ydFxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIHVzZXIgdG8gZXhwb3J0XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggYSBzdHJpbmcgaW1wb3J0YWJsZSB1c2luZyBpbXBvcnRVc2VyXHJcbiAgICovXHJcbiAgZXhwb3J0VXNlciA9IGFzeW5jICh1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQ3JlZHNJbnRlcmZhY2UgPSB7XHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZFxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwia2V5c3RvcmUuZXhwb3J0VXNlclwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC51c2VyXHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudXNlclxyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbXBvcnRzIGEgdXNlciBmaWxlIGludG8gdGhlIG5vZGUncyB1c2VyIGRhdGFiYXNlIGFuZCBhc3NpZ25zIGl0IHRvIGEgdXNlcm5hbWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgdGhlIHVzZXIgZmlsZSBzaG91bGQgYmUgaW1wb3J0ZWQgaW50b1xyXG4gICAqIEBwYXJhbSB1c2VyIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZXRuaW5nIGEgdXNlclwicyBkYXRhXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSB1c2VyXCJzIHBhc3N3b3JkXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHByb21pc2Ugd2l0aCBhIHRydWUtdmFsdWUgb24gc3VjY2Vzcy5cclxuICAgKi9cclxuICBpbXBvcnRVc2VyID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHVzZXI6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmdcclxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0VXNlclBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHVzZXIsXHJcbiAgICAgIHBhc3N3b3JkXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJrZXlzdG9yZS5pbXBvcnRVc2VyXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpc3RzIHRoZSBuYW1lcyBvZiBhbGwgdXNlcnMgb24gdGhlIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIG9mIGFuIGFycmF5IHdpdGggYWxsIHVzZXIgbmFtZXMuXHJcbiAgICovXHJcbiAgbGlzdFVzZXJzID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImtleXN0b3JlLmxpc3RVc2Vyc1wiXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudXNlcnNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlbGV0ZXMgYSB1c2VyIGluIHRoZSBub2RlJ3MgZGF0YWJhc2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgTmFtZSBvZiB0aGUgdXNlciB0byBkZWxldGVcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgUGFzc3dvcmQgZm9yIHRoZSB1c2VyXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJvb2xlYW4gd2l0aCB0cnVlIG9uIHN1Y2Nlc3NcclxuICAgKi9cclxuICBkZWxldGVVc2VyID0gYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQ3JlZHNJbnRlcmZhY2UgPSB7XHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZFxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwia2V5c3RvcmUuZGVsZXRlVXNlclwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkIHVzZSB0aGUgW1tKdW5lby5hZGRBUEldXSBtZXRob2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgSnVuZW8gY2xhc3NcclxuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9rZXlzdG9yZVwiIGFzIHRoZSBwYXRoIHRvIHJwYydzIGJhc2VVUkxcclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcihjb3JlOiBKdW5lb0NvcmUsIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9rZXlzdG9yZVwiKSB7XHJcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxyXG4gIH1cclxufVxyXG4iXX0=