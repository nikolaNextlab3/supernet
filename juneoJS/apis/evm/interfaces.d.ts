/**
 * @packageDocumentation
 * @module EVM-Interfaces
 */
import { Buffer } from "buffer/";
import { Index, CredsInterface } from "../../common";
export interface GetAssetDescriptionParams {
    assetID: Buffer | string;
}
export interface GetAtomicTxStatusParams {
    txID: string;
}
export interface GetAtomicTxParams {
    txID: string;
}
export interface ExportJUNEParams extends CredsInterface {
    to: string;
    amount: string;
}
export interface ExportParams extends ExportJUNEParams {
    assetID: string;
}
export interface GetUTXOsParams {
    addresses: string[] | string;
    limit: number;
    sourceChain?: string;
    startIndex?: Index;
    encoding?: string;
}
export interface ImportJUNEParams extends CredsInterface {
    to: string;
    sourceChain: string;
}
export interface ImportParams extends ImportJUNEParams {
}
export interface ImportKeyParams extends CredsInterface {
    privateKey: string;
}
export interface ExportKeyParams extends CredsInterface {
    address: string;
}
export interface CreateKeyPairResponse {
    address: string;
    publicKey: string;
    privateKey: string;
}
//# sourceMappingURL=interfaces.d.ts.map