/**
 * @packageDocumentation
 * @module Utils-Constants
 */
import BN from "bn.js";
export declare const PrivateKeyPrefix: string;
export declare const NodeIDPrefix: string;
export declare const PrimaryAssetAlias: string;
export declare const BelgradeAPI: string;
export declare const MainnetAPI: string;
export interface EVM {
    blockchainID: string;
    vm: string;
    fee?: BN;
    gasPrice: BN | number;
    chainID?: number;
    minGasPrice?: BN;
    maxGasPrice?: BN;
    txBytesGas?: number;
    costPerSignature?: number;
    txFee?: BN;
    juneAssetID?: string;
}
export interface X {
    blockchainID: string;
    alias: string;
    vm: string;
    creationTxFee: BN | number;
    mintTxFee: BN;
    juneAssetID?: string;
    txFee?: BN | number;
    fee?: BN;
}
export interface P {
    blockchainID: string;
    alias: string;
    vm: string;
    creationTxFee: BN | number;
    createSubnetTx: BN | number;
    createChainTx: BN | number;
    minConsumption: number;
    maxConsumption: number;
    maxStakingDuration: BN;
    maxSupply: BN;
    minStake: BN;
    minStakeDuration: number;
    maxStakeDuration: number;
    minDelegationStake: BN;
    minDelegationFee: BN;
    juneAssetID?: string;
    txFee?: BN | number;
    fee?: BN;
}
export interface Network {
    hrp: string;
    X: X;
    P: P;
    EVM: EVM;
    [key: string]: EVM | X | P | string;
}
export interface Networks {
    [key: number]: Network;
}
export declare const NetworkIDToHRP: object;
export declare const HRPToNetworkID: object;
export declare const NetworkIDToNetworkNames: object;
export declare const NetworkNameToNetworkID: object;
export declare const FallbackHRP: string;
export declare const FallbackNetworkName: string;
export declare const FallbackEVMChainID: number;
export declare const DefaultNetworkID: number;
export declare const PlatformChainID: string;
export declare const PrimaryNetworkID: string;
export declare const XChainAlias: string;
export declare const PChainAlias: string;
export declare const XChainVMName: string;
export declare const CChainVMName: string;
export declare const PChainVMName: string;
export declare const DefaultLocalGenesisPrivateKey: string;
export declare const DefaultEVMLocalGenesisPrivateKey: string;
export declare const DefaultEVMLocalGenesisAddress: string;
export declare const mnemonic: string;
export declare const ONEJUNE: BN;
export declare const DECIJUNE: BN;
export declare const CENTIJUNE: BN;
export declare const MILLIJUNE: BN;
export declare const MICROJUNE: BN;
export declare const NANOJUNE: BN;
export declare const WEI: BN;
export declare const GWEI: BN;
export declare const JUNEGWEI: BN;
export declare const JUNESTAKECAP: BN;
export declare class Defaults {
    static network: Networks;
}
/**
 * Rules used when merging sets
 */
export declare type MergeRule = "intersection" | "differenceSelf" | "differenceNew" | "symDifference" | "union" | "unionMinusNew" | "unionMinusSelf" | "ERROR";
//# sourceMappingURL=constants.d.ts.map