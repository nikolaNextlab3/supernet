"use strict";
/**
 * @packageDocumentation
 * @module Common-Transactions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMStandardTx = exports.EVMStandardUnsignedTx = exports.EVMStandardBaseTx = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const input_1 = require("./input");
const output_1 = require("./output");
const constants_1 = require("../utils/constants");
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing a base for all transactions.
 */
class EVMStandardBaseTx extends serialization_1.Serializable {
    /**
     * Class representing a StandardBaseTx which is the foundation for all transactions.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     */
    constructor(networkID = constants_1.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16)) {
        super();
        this._typeName = "EVMStandardBaseTx";
        this._typeID = undefined;
        this.networkID = buffer_1.Buffer.alloc(4);
        this.blockchainID = buffer_1.Buffer.alloc(32);
        this.networkID.writeUInt32BE(networkID, 0);
        this.blockchainID = blockchainID;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { networkID: serializer.encoder(this.networkID, encoding, "Buffer", "decimalString"), blockchainID: serializer.encoder(this.blockchainID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.networkID = serializer.decoder(fields["networkID"], encoding, "decimalString", "Buffer", 4);
        this.blockchainID = serializer.decoder(fields["blockchainID"], encoding, "cb58", "Buffer", 32);
    }
    /**
     * Returns the NetworkID as a number
     */
    getNetworkID() {
        return this.networkID.readUInt32BE(0);
    }
    /**
     * Returns the Buffer representation of the BlockchainID
     */
    getBlockchainID() {
        return this.blockchainID;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardBaseTx]].
     */
    toBuffer() {
        let bsize = this.networkID.length + this.blockchainID.length;
        const barr = [this.networkID, this.blockchainID];
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Returns a base-58 representation of the [[StandardBaseTx]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.EVMStandardBaseTx = EVMStandardBaseTx;
/**
 * Class representing an unsigned transaction.
 */
class EVMStandardUnsignedTx extends serialization_1.Serializable {
    constructor(transaction = undefined, codecID = 0) {
        super();
        this._typeName = "StandardUnsignedTx";
        this._typeID = undefined;
        this.codecID = 0;
        this.codecID = codecID;
        this.transaction = transaction;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { codecID: serializer.encoder(this.codecID, encoding, "number", "decimalString", 2), transaction: this.transaction.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.codecID = serializer.decoder(fields["codecID"], encoding, "decimalString", "number");
    }
    /**
     * Returns the CodecID as a number
     */
    getCodecID() {
        return this.codecID;
    }
    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
     */
    getCodecIDBuffer() {
        let codecBuf = buffer_1.Buffer.alloc(2);
        codecBuf.writeUInt16BE(this.codecID, 0);
        return codecBuf;
    }
    /**
     * Returns the inputTotal as a BN
     */
    getInputTotal(assetID) {
        const ins = [];
        const aIDHex = assetID.toString("hex");
        let total = new bn_js_1.default(0);
        ins.forEach((input) => {
            // only check StandardAmountInputs
            if (input.getInput() instanceof input_1.StandardAmountInput &&
                aIDHex === input.getAssetID().toString("hex")) {
                const i = input.getInput();
                total = total.add(i.getAmount());
            }
        });
        return total;
    }
    /**
     * Returns the outputTotal as a BN
     */
    getOutputTotal(assetID) {
        const outs = [];
        const aIDHex = assetID.toString("hex");
        let total = new bn_js_1.default(0);
        outs.forEach((out) => {
            // only check StandardAmountOutput
            if (out.getOutput() instanceof output_1.StandardAmountOutput &&
                aIDHex === out.getAssetID().toString("hex")) {
                const output = out.getOutput();
                total = total.add(output.getAmount());
            }
        });
        return total;
    }
    /**
     * Returns the number of burned tokens as a BN
     */
    getBurn(assetID) {
        return this.getInputTotal(assetID).sub(this.getOutputTotal(assetID));
    }
    toBuffer() {
        const codecID = this.getCodecIDBuffer();
        const txtype = buffer_1.Buffer.alloc(4);
        txtype.writeUInt32BE(this.transaction.getTxType(), 0);
        const basebuff = this.transaction.toBuffer();
        return buffer_1.Buffer.concat([codecID, txtype, basebuff], codecID.length + txtype.length + basebuff.length);
    }
}
exports.EVMStandardUnsignedTx = EVMStandardUnsignedTx;
/**
 * Class representing a signed transaction.
 */
class EVMStandardTx extends serialization_1.Serializable {
    /**
     * Class representing a signed transaction.
     *
     * @param unsignedTx Optional [[StandardUnsignedTx]]
     * @param signatures Optional array of [[Credential]]s
     */
    constructor(unsignedTx = undefined, credentials = undefined) {
        super();
        this._typeName = "StandardTx";
        this._typeID = undefined;
        this.unsignedTx = undefined;
        this.credentials = [];
        if (typeof unsignedTx !== "undefined") {
            this.unsignedTx = unsignedTx;
            if (typeof credentials !== "undefined") {
                this.credentials = credentials;
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { unsignedTx: this.unsignedTx.serialize(encoding), credentials: this.credentials.map((c) => c.serialize(encoding)) });
    }
    /**
     * Returns the [[StandardUnsignedTx]]
     */
    getUnsignedTx() {
        return this.unsignedTx;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTx]].
     */
    toBuffer() {
        const txbuff = this.unsignedTx.toBuffer();
        let bsize = txbuff.length;
        const credlen = buffer_1.Buffer.alloc(4);
        credlen.writeUInt32BE(this.credentials.length, 0);
        const barr = [txbuff, credlen];
        bsize += credlen.length;
        this.credentials.forEach((credential) => {
            const credid = buffer_1.Buffer.alloc(4);
            credid.writeUInt32BE(credential.getCredentialID(), 0);
            barr.push(credid);
            bsize += credid.length;
            const credbuff = credential.toBuffer();
            bsize += credbuff.length;
            barr.push(credbuff);
        });
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Takes a base-58 string containing an [[StandardTx]], parses it, populates the class, and returns the length of the Tx in bytes.
     *
     * @param serialized A base-58 string containing a raw [[StandardTx]]
     *
     * @returns The length of the raw [[StandardTx]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
    fromString(serialized) {
        return this.fromBuffer(bintools.cb58Decode(serialized));
    }
    /**
     * Returns a cb58 representation of the [[StandardTx]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    toStringHex() {
        return `0x${bintools.addChecksum(this.toBuffer()).toString("hex")}`;
    }
}
exports.EVMStandardTx = EVMStandardTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZtdHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2V2bXR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7OztBQUVILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFFeEMsa0RBQXNCO0FBRXRCLG1DQUF3RTtBQUN4RSxxQ0FBMkU7QUFDM0Usa0RBQXFEO0FBQ3JELDBEQUkrQjtBQUUvQjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxVQUFVLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFN0Q7O0dBRUc7QUFDSCxNQUFzQixpQkFHcEIsU0FBUSw0QkFBWTtJQXNGcEI7Ozs7Ozs7T0FPRztJQUNILFlBQ0UsWUFBb0IsNEJBQWdCLEVBQ3BDLGVBQXVCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUUzQyxLQUFLLEVBQUUsQ0FBQTtRQWpHQyxjQUFTLEdBQUcsbUJBQW1CLENBQUE7UUFDL0IsWUFBTyxHQUFHLFNBQVMsQ0FBQTtRQXVDbkIsY0FBUyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbkMsaUJBQVksR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBeUQvQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDMUMsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7SUFDbEMsQ0FBQztJQWpHRCxTQUFTLENBQUMsV0FBK0IsS0FBSztRQUM1QyxJQUFJLE1BQU0sR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlDLHVDQUNLLE1BQU0sS0FDVCxTQUFTLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FDM0IsSUFBSSxDQUFDLFNBQVMs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LENBQUMsRUFBRSxDQUFBO0lBQ3JFLENBQUM7Q0FvQkY7QUF0R0Qsc0NBc0dDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIENvbW1vbi1UcmFuc2FjdGlvbnNcclxuICovXHJcblxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBDcmVkZW50aWFsIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHsgU3RhbmRhcmRLZXlDaGFpbiwgU3RhbmRhcmRLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxyXG5pbXBvcnQgeyBTdGFuZGFyZEFtb3VudElucHV0LCBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRcIlxyXG5pbXBvcnQgeyBTdGFuZGFyZEFtb3VudE91dHB1dCwgU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRcIlxyXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgU2VyaWFsaXphYmxlLFxyXG4gIFNlcmlhbGl6YXRpb24sXHJcbiAgU2VyaWFsaXplZEVuY29kaW5nXHJcbn0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXplcjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIGJhc2UgZm9yIGFsbCB0cmFuc2FjdGlvbnMuXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRVZNU3RhbmRhcmRCYXNlVHg8XHJcbiAgS1BDbGFzcyBleHRlbmRzIFN0YW5kYXJkS2V5UGFpcixcclxuICBLQ0NsYXNzIGV4dGVuZHMgU3RhbmRhcmRLZXlDaGFpbjxLUENsYXNzPlxyXG4+IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJFVk1TdGFuZGFyZEJhc2VUeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgbmV0d29ya0lEOiBzZXJpYWxpemVyLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5uZXR3b3JrSUQsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxyXG4gICAgICApLFxyXG4gICAgICBibG9ja2NoYWluSUQ6IHNlcmlhbGl6ZXIuZW5jb2RlcihcclxuICAgICAgICB0aGlzLmJsb2NrY2hhaW5JRCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiY2I1OFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMubmV0d29ya0lEID0gc2VyaWFsaXplci5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJuZXR3b3JrSURcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgNFxyXG4gICAgKVxyXG4gICAgdGhpcy5ibG9ja2NoYWluSUQgPSBzZXJpYWxpemVyLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImJsb2NrY2hhaW5JRFwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIFwiY2I1OFwiLFxyXG4gICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAzMlxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIG5ldHdvcmtJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tTdGFuZGFyZEJhc2VUeF1dXHJcbiAgICovXHJcbiAgYWJzdHJhY3QgZ2V0VHhUeXBlKCk6IG51bWJlclxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBOZXR3b3JrSUQgYXMgYSBudW1iZXJcclxuICAgKi9cclxuICBnZXROZXR3b3JrSUQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLm5ldHdvcmtJRC5yZWFkVUludDMyQkUoMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIEJ1ZmZlciByZXByZXNlbnRhdGlvbiBvZiB0aGUgQmxvY2tjaGFpbklEXHJcbiAgICovXHJcbiAgZ2V0QmxvY2tjaGFpbklEKCk6IEJ1ZmZlciB7XHJcbiAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluSURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZEJhc2VUeF1dLlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHRoaXMubmV0d29ya0lELmxlbmd0aCArIHRoaXMuYmxvY2tjaGFpbklELmxlbmd0aFxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5uZXR3b3JrSUQsIHRoaXMuYmxvY2tjaGFpbklEXVxyXG4gICAgY29uc3QgYnVmZjogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcclxuICAgIHJldHVybiBidWZmXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZEJhc2VUeF1dLlxyXG4gICAqL1xyXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKVxyXG4gIH1cclxuXHJcbiAgYWJzdHJhY3QgY2xvbmUoKTogdGhpc1xyXG5cclxuICBhYnN0cmFjdCBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzXHJcblxyXG4gIGFic3RyYWN0IHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IHRoaXNcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgU3RhbmRhcmRCYXNlVHggd2hpY2ggaXMgdGhlIGZvdW5kYXRpb24gZm9yIGFsbCB0cmFuc2FjdGlvbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIG5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxyXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xyXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNilcclxuICApIHtcclxuICAgIHN1cGVyKClcclxuICAgIHRoaXMubmV0d29ya0lELndyaXRlVUludDMyQkUobmV0d29ya0lELCAwKVxyXG4gICAgdGhpcy5ibG9ja2NoYWluSUQgPSBibG9ja2NoYWluSURcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRVZNU3RhbmRhcmRVbnNpZ25lZFR4PFxyXG4gIEtQQ2xhc3MgZXh0ZW5kcyBTdGFuZGFyZEtleVBhaXIsXHJcbiAgS0NDbGFzcyBleHRlbmRzIFN0YW5kYXJkS2V5Q2hhaW48S1BDbGFzcz4sXHJcbiAgU0JUeCBleHRlbmRzIEVWTVN0YW5kYXJkQmFzZVR4PEtQQ2xhc3MsIEtDQ2xhc3M+XHJcbj4gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YW5kYXJkVW5zaWduZWRUeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgY29kZWNJRDogc2VyaWFsaXplci5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuY29kZWNJRCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIm51bWJlclwiLFxyXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxyXG4gICAgICAgIDJcclxuICAgICAgKSxcclxuICAgICAgdHJhbnNhY3Rpb246IHRoaXMudHJhbnNhY3Rpb24uc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5jb2RlY0lEID0gc2VyaWFsaXplci5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJjb2RlY0lEXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwibnVtYmVyXCJcclxuICAgIClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBjb2RlY0lEOiBudW1iZXIgPSAwXHJcbiAgcHJvdGVjdGVkIHRyYW5zYWN0aW9uOiBTQlR4XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIENvZGVjSUQgYXMgYSBudW1iZXJcclxuICAgKi9cclxuICBnZXRDb2RlY0lEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5jb2RlY0lEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ29kZWNJRFxyXG4gICAqL1xyXG4gIGdldENvZGVjSURCdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGxldCBjb2RlY0J1ZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXHJcbiAgICBjb2RlY0J1Zi53cml0ZVVJbnQxNkJFKHRoaXMuY29kZWNJRCwgMClcclxuICAgIHJldHVybiBjb2RlY0J1ZlxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaW5wdXRUb3RhbCBhcyBhIEJOXHJcbiAgICovXHJcbiAgZ2V0SW5wdXRUb3RhbChhc3NldElEOiBCdWZmZXIpOiBCTiB7XHJcbiAgICBjb25zdCBpbnM6IFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXHJcbiAgICBjb25zdCBhSURIZXg6IHN0cmluZyA9IGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIilcclxuICAgIGxldCB0b3RhbDogQk4gPSBuZXcgQk4oMClcclxuICAgIGlucy5mb3JFYWNoKChpbnB1dDogU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCkgPT4ge1xyXG4gICAgICAvLyBvbmx5IGNoZWNrIFN0YW5kYXJkQW1vdW50SW5wdXRzXHJcbiAgICAgIGlmIChcclxuICAgICAgICBpbnB1dC5nZXRJbnB1dCgpIGluc3RhbmNlb2YgU3RhbmRhcmRBbW91bnRJbnB1dCAmJlxyXG4gICAgICAgIGFJREhleCA9PT0gaW5wdXQuZ2V0QXNzZXRJRCgpLnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgICAgICkge1xyXG4gICAgICAgIGNvbnN0IGkgPSBpbnB1dC5nZXRJbnB1dCgpIGFzIFN0YW5kYXJkQW1vdW50SW5wdXRcclxuICAgICAgICB0b3RhbCA9IHRvdGFsLmFkZChpLmdldEFtb3VudCgpKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHRvdGFsXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRUb3RhbCBhcyBhIEJOXHJcbiAgICovXHJcbiAgZ2V0T3V0cHV0VG90YWwoYXNzZXRJRDogQnVmZmVyKTogQk4ge1xyXG4gICAgY29uc3Qgb3V0czogU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcbiAgICBjb25zdCBhSURIZXg6IHN0cmluZyA9IGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIilcclxuICAgIGxldCB0b3RhbDogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgICBvdXRzLmZvckVhY2goKG91dDogU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXQpID0+IHtcclxuICAgICAgLy8gb25seSBjaGVjayBTdGFuZGFyZEFtb3VudE91dHB1dFxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgb3V0LmdldE91dHB1dCgpIGluc3RhbmNlb2YgU3RhbmRhcmRBbW91bnRPdXRwdXQgJiZcclxuICAgICAgICBhSURIZXggPT09IG91dC5nZXRBc3NldElEKCkudG9TdHJpbmcoXCJoZXhcIilcclxuICAgICAgKSB7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0OiBTdGFuZGFyZEFtb3VudE91dHB1dCA9XHJcbiAgICAgICAgICBvdXQuZ2V0T3V0cHV0KCkgYXMgU3RhbmRhcmRBbW91bnRPdXRwdXRcclxuICAgICAgICB0b3RhbCA9IHRvdGFsLmFkZChvdXRwdXQuZ2V0QW1vdW50KCkpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gdG90YWxcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBidXJuZWQgdG9rZW5zIGFzIGEgQk5cclxuICAgKi9cclxuICBnZXRCdXJuKGFzc2V0SUQ6IEJ1ZmZlcik6IEJOIHtcclxuICAgIHJldHVybiB0aGlzLmdldElucHV0VG90YWwoYXNzZXRJRCkuc3ViKHRoaXMuZ2V0T3V0cHV0VG90YWwoYXNzZXRJRCkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBUcmFuc2FjdGlvblxyXG4gICAqL1xyXG4gIGFic3RyYWN0IGdldFRyYW5zYWN0aW9uKCk6IFNCVHhcclxuXHJcbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcclxuXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IGNvZGVjSUQ6IEJ1ZmZlciA9IHRoaXMuZ2V0Q29kZWNJREJ1ZmZlcigpXHJcbiAgICBjb25zdCB0eHR5cGU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgdHh0eXBlLndyaXRlVUludDMyQkUodGhpcy50cmFuc2FjdGlvbi5nZXRUeFR5cGUoKSwgMClcclxuICAgIGNvbnN0IGJhc2VidWZmOiBCdWZmZXIgPSB0aGlzLnRyYW5zYWN0aW9uLnRvQnVmZmVyKClcclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFxyXG4gICAgICBbY29kZWNJRCwgdHh0eXBlLCBiYXNlYnVmZl0sXHJcbiAgICAgIGNvZGVjSUQubGVuZ3RoICsgdHh0eXBlLmxlbmd0aCArIGJhc2VidWZmLmxlbmd0aFxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2lnbnMgdGhpcyBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBzaWduZWQgW1tTdGFuZGFyZFR4XV1cclxuICAgKlxyXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHNpZ25lZCBbW1N0YW5kYXJkVHhdXVxyXG4gICAqL1xyXG4gIGFic3RyYWN0IHNpZ24oXHJcbiAgICBrYzogS0NDbGFzc1xyXG4gICk6IEVWTVN0YW5kYXJkVHg8XHJcbiAgICBLUENsYXNzLFxyXG4gICAgS0NDbGFzcyxcclxuICAgIEVWTVN0YW5kYXJkVW5zaWduZWRUeDxLUENsYXNzLCBLQ0NsYXNzLCBTQlR4PlxyXG4gID5cclxuXHJcbiAgY29uc3RydWN0b3IodHJhbnNhY3Rpb246IFNCVHggPSB1bmRlZmluZWQsIGNvZGVjSUQ6IG51bWJlciA9IDApIHtcclxuICAgIHN1cGVyKClcclxuICAgIHRoaXMuY29kZWNJRCA9IGNvZGVjSURcclxuICAgIHRoaXMudHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvblxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNpZ25lZCB0cmFuc2FjdGlvbi5cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBFVk1TdGFuZGFyZFR4PFxyXG4gIEtQQ2xhc3MgZXh0ZW5kcyBTdGFuZGFyZEtleVBhaXIsXHJcbiAgS0NDbGFzcyBleHRlbmRzIFN0YW5kYXJkS2V5Q2hhaW48S1BDbGFzcz4sXHJcbiAgU1VCVHggZXh0ZW5kcyBFVk1TdGFuZGFyZFVuc2lnbmVkVHg8XHJcbiAgICBLUENsYXNzLFxyXG4gICAgS0NDbGFzcyxcclxuICAgIEVWTVN0YW5kYXJkQmFzZVR4PEtQQ2xhc3MsIEtDQ2xhc3M+XHJcbiAgPlxyXG4+IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFR4XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICB1bnNpZ25lZFR4OiB0aGlzLnVuc2lnbmVkVHguc2VyaWFsaXplKGVuY29kaW5nKSxcclxuICAgICAgY3JlZGVudGlhbHM6IHRoaXMuY3JlZGVudGlhbHMubWFwKChjKSA9PiBjLnNlcmlhbGl6ZShlbmNvZGluZykpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgdW5zaWduZWRUeDogU1VCVHggPSB1bmRlZmluZWRcclxuICBwcm90ZWN0ZWQgY3JlZGVudGlhbHM6IENyZWRlbnRpYWxbXSA9IFtdXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFtbU3RhbmRhcmRVbnNpZ25lZFR4XV1cclxuICAgKi9cclxuICBnZXRVbnNpZ25lZFR4KCk6IFNVQlR4IHtcclxuICAgIHJldHVybiB0aGlzLnVuc2lnbmVkVHhcclxuICB9XHJcblxyXG4gIGFic3RyYWN0IGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0PzogbnVtYmVyKTogbnVtYmVyXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZFR4XV0uXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHR4YnVmZjogQnVmZmVyID0gdGhpcy51bnNpZ25lZFR4LnRvQnVmZmVyKClcclxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdHhidWZmLmxlbmd0aFxyXG4gICAgY29uc3QgY3JlZGxlbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBjcmVkbGVuLndyaXRlVUludDMyQkUodGhpcy5jcmVkZW50aWFscy5sZW5ndGgsIDApXHJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0eGJ1ZmYsIGNyZWRsZW5dXHJcbiAgICBic2l6ZSArPSBjcmVkbGVuLmxlbmd0aFxyXG4gICAgdGhpcy5jcmVkZW50aWFscy5mb3JFYWNoKChjcmVkZW50aWFsOiBDcmVkZW50aWFsKSA9PiB7XHJcbiAgICAgIGNvbnN0IGNyZWRpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICAgIGNyZWRpZC53cml0ZVVJbnQzMkJFKGNyZWRlbnRpYWwuZ2V0Q3JlZGVudGlhbElEKCksIDApXHJcbiAgICAgIGJhcnIucHVzaChjcmVkaWQpXHJcbiAgICAgIGJzaXplICs9IGNyZWRpZC5sZW5ndGhcclxuICAgICAgY29uc3QgY3JlZGJ1ZmY6IEJ1ZmZlciA9IGNyZWRlbnRpYWwudG9CdWZmZXIoKVxyXG4gICAgICBic2l6ZSArPSBjcmVkYnVmZi5sZW5ndGhcclxuICAgICAgYmFyci5wdXNoKGNyZWRidWZmKVxyXG4gICAgfSlcclxuICAgIGNvbnN0IGJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgICByZXR1cm4gYnVmZlxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGFuIFtbU3RhbmRhcmRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFR4IGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNlcmlhbGl6ZWQgQSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgcmF3IFtbU3RhbmRhcmRUeF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tTdGFuZGFyZFR4XV1cclxuICAgKlxyXG4gICAqIEByZW1hcmtzXHJcbiAgICogdW5saWtlIG1vc3QgZnJvbVN0cmluZ3MsIGl0IGV4cGVjdHMgdGhlIHN0cmluZyB0byBiZSBzZXJpYWxpemVkIGluIGNiNTggZm9ybWF0XHJcbiAgICovXHJcbiAgZnJvbVN0cmluZyhzZXJpYWxpemVkOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHNlcmlhbGl6ZWQpKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNiNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbU3RhbmRhcmRUeF1dLlxyXG4gICAqXHJcbiAgICogQHJlbWFya3NcclxuICAgKiB1bmxpa2UgbW9zdCB0b1N0cmluZ3MsIHRoaXMgcmV0dXJucyBpbiBjYjU4IHNlcmlhbGl6YXRpb24gZm9ybWF0XHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIHRvU3RyaW5nSGV4KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYDB4JHtiaW50b29scy5hZGRDaGVja3N1bSh0aGlzLnRvQnVmZmVyKCkpLnRvU3RyaW5nKFwiaGV4XCIpfWBcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNpZ25lZCB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1bnNpZ25lZFR4IE9wdGlvbmFsIFtbU3RhbmRhcmRVbnNpZ25lZFR4XV1cclxuICAgKiBAcGFyYW0gc2lnbmF0dXJlcyBPcHRpb25hbCBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHVuc2lnbmVkVHg6IFNVQlR4ID0gdW5kZWZpbmVkLFxyXG4gICAgY3JlZGVudGlhbHM6IENyZWRlbnRpYWxbXSA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgaWYgKHR5cGVvZiB1bnNpZ25lZFR4ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMudW5zaWduZWRUeCA9IHVuc2lnbmVkVHhcclxuICAgICAgaWYgKHR5cGVvZiBjcmVkZW50aWFscyAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBjcmVkZW50aWFsc1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==