export declare class JuneoError extends Error {
    errorCode: string;
    constructor(m: string, code: string);
    getCode(): string;
}
export declare class AddressError extends JuneoError {
    constructor(m: string);
}
export declare class GooseEggCheckError extends JuneoError {
    constructor(m: string);
}
export declare class ChainIdError extends JuneoError {
    constructor(m: string);
}
export declare class NoAtomicUTXOsError extends JuneoError {
    constructor(m: string);
}
export declare class SymbolError extends JuneoError {
    constructor(m: string);
}
export declare class NameError extends JuneoError {
    constructor(m: string);
}
export declare class TransactionError extends JuneoError {
    constructor(m: string);
}
export declare class CodecIdError extends JuneoError {
    constructor(m: string);
}
export declare class CredIdError extends JuneoError {
    constructor(m: string);
}
export declare class TransferableOutputError extends JuneoError {
    constructor(m: string);
}
export declare class TransferableInputError extends JuneoError {
    constructor(m: string);
}
export declare class InputIdError extends JuneoError {
    constructor(m: string);
}
export declare class OperationError extends JuneoError {
    constructor(m: string);
}
export declare class InvalidOperationIdError extends JuneoError {
    constructor(m: string);
}
export declare class ChecksumError extends JuneoError {
    constructor(m: string);
}
export declare class OutputIdError extends JuneoError {
    constructor(m: string);
}
export declare class UTXOError extends JuneoError {
    constructor(m: string);
}
export declare class InsufficientFundsError extends JuneoError {
    constructor(m: string);
}
export declare class ThresholdError extends JuneoError {
    constructor(m: string);
}
export declare class SECPMintOutputError extends JuneoError {
    constructor(m: string);
}
export declare class EVMInputError extends JuneoError {
    constructor(m: string);
}
export declare class EVMOutputError extends JuneoError {
    constructor(m: string);
}
export declare class FeeAssetError extends JuneoError {
    constructor(m: string);
}
export declare class StakeError extends JuneoError {
    constructor(m: string);
}
export declare class TimeError extends JuneoError {
    constructor(m: string);
}
export declare class DelegationFeeError extends JuneoError {
    constructor(m: string);
}
export declare class SubnetOwnerError extends JuneoError {
    constructor(m: string);
}
export declare class BufferSizeError extends JuneoError {
    constructor(m: string);
}
export declare class AddressIndexError extends JuneoError {
    constructor(m: string);
}
export declare class PublicKeyError extends JuneoError {
    constructor(m: string);
}
export declare class MergeRuleError extends JuneoError {
    constructor(m: string);
}
export declare class Base58Error extends JuneoError {
    constructor(m: string);
}
export declare class PrivateKeyError extends JuneoError {
    constructor(m: string);
}
export declare class NodeIdError extends JuneoError {
    constructor(m: string);
}
export declare class HexError extends JuneoError {
    constructor(m: string);
}
export declare class TypeIdError extends JuneoError {
    constructor(m: string);
}
export declare class TypeNameError extends JuneoError {
    constructor(m: string);
}
export declare class UnknownTypeError extends JuneoError {
    constructor(m: string);
}
export declare class Bech32Error extends JuneoError {
    constructor(m: string);
}
export declare class EVMFeeError extends JuneoError {
    constructor(m: string);
}
export declare class InvalidEntropy extends JuneoError {
    constructor(m: string);
}
export declare class ProtocolError extends JuneoError {
    constructor(m: string);
}
export declare class SubnetIdError extends JuneoError {
    constructor(m: string);
}
export declare class SubnetThresholdError extends JuneoError {
    constructor(m: string);
}
export declare class SubnetAddressError extends JuneoError {
    constructor(m: string);
}
export declare class ChainAssetIdError extends JuneoError {
    constructor(m: string);
}
export interface ErrorResponseObject {
    code: number;
    message: string;
    data?: null;
}
//# sourceMappingURL=errors.d.ts.map