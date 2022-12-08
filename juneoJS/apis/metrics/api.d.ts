/**
 * @packageDocumentation
 * @module API-Metrics
 */
import JuneoCore from "../../juneo";
import { RESTAPI } from "../../common/restapi";
import { AxiosRequestConfig } from "axios";
/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
export declare class MetricsAPI extends RESTAPI {
    protected axConf: () => AxiosRequestConfig;
    /**
     *
     * @returns Promise for an object containing the metrics response
     */
    getMetrics: () => Promise<string>;
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/metrics" as the path to rpc's baseurl
     */
    constructor(core: JuneoCore, baseURL?: string);
}
//# sourceMappingURL=api.d.ts.map