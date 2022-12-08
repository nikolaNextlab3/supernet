/**
 * @packageDocumentation
 * @module API-Health
 */
import JuneoCore from "../../juneo";
import { JRPCAPI } from "../../common/jrpcapi";
import { HealthResponse } from "./interfaces";
/**
 * Class for interacting with a node API that is using the node's HealthApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
export declare class HealthAPI extends JRPCAPI {
    /**
     *
     * @returns Promise for a [[HealthResponse]]
     */
    health: () => Promise<HealthResponse>;
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/health" as the path to rpc's baseURL
     */
    constructor(core: JuneoCore, baseURL?: string);
}
//# sourceMappingURL=api.d.ts.map