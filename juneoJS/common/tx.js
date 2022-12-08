"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardTx = exports.StandardUnsignedTx = exports.StandardBaseTx = void 0;
/**
 * @packageDocumentation
 * @module Common-Transactions
 */
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
const serialization = serialization_1.Serialization.getInstance();
const cb58 = "cb58";
const hex = "hex";
const decimalString = "decimalString";
const buffer = "Buffer";
/**
 * Class representing a base for all transactions.
 */
class StandardBaseTx extends serialization_1.Serializable {
    /**
     * Class representing a StandardBaseTx which is the foundation for all transactions.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(networkID = constants_1.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined) {
        super();
        this._typeName = "StandardBaseTx";
        this._typeID = undefined;
        this.networkID = buffer_1.Buffer.alloc(4);
        this.blockchainID = buffer_1.Buffer.alloc(32);
        this.numouts = buffer_1.Buffer.alloc(4);
        this.numins = buffer_1.Buffer.alloc(4);
        this.memo = buffer_1.Buffer.alloc(0);
        this.networkID.writeUInt32BE(networkID, 0);
        this.blockchainID = blockchainID;
        if (typeof memo != "undefined") {
            this.memo = memo;
        }
        if (typeof ins !== "undefined" && typeof outs !== "undefined") {
            this.numouts.writeUInt32BE(outs.length, 0);
            this.outs = outs.sort(output_1.StandardTransferableOutput.comparator());
            this.numins.writeUInt32BE(ins.length, 0);
            this.ins = ins.sort(input_1.StandardTransferableInput.comparator());
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { networkID: serialization.encoder(this.networkID, encoding, buffer, decimalString), blockchainID: serialization.encoder(this.blockchainID, encoding, buffer, cb58), outs: this.outs.map((o) => o.serialize(encoding)), ins: this.ins.map((i) => i.serialize(encoding)), memo: serialization.encoder(this.memo, encoding, buffer, hex) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.networkID = serialization.decoder(fields["networkID"], encoding, decimalString, buffer, 4);
        this.blockchainID = serialization.decoder(fields["blockchainID"], encoding, cb58, buffer, 32);
        this.memo = serialization.decoder(fields["memo"], encoding, hex, buffer);
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
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the memo
     */
    getMemo() {
        return this.memo;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardBaseTx]].
     */
    toBuffer() {
        this.outs.sort(output_1.StandardTransferableOutput.comparator());
        this.ins.sort(input_1.StandardTransferableInput.comparator());
        this.numouts.writeUInt32BE(this.outs.length, 0);
        this.numins.writeUInt32BE(this.ins.length, 0);
        let bsize = this.networkID.length + this.blockchainID.length + this.numouts.length;
        const barr = [this.networkID, this.blockchainID, this.numouts];
        for (let i = 0; i < this.outs.length; i++) {
            const b = this.outs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        barr.push(this.numins);
        bsize += this.numins.length;
        for (let i = 0; i < this.ins.length; i++) {
            const b = this.ins[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        let memolen = buffer_1.Buffer.alloc(4);
        memolen.writeUInt32BE(this.memo.length, 0);
        barr.push(memolen);
        bsize += 4;
        barr.push(this.memo);
        bsize += this.memo.length;
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Returns a base-58 representation of the [[StandardBaseTx]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
    toStringHex() {
        return `0x${bintools.addChecksum(this.toBuffer()).toString("hex")}`;
    }
}
exports.StandardBaseTx = StandardBaseTx;
/**
 * Class representing an unsigned transaction.
 */
class StandardUnsignedTx extends serialization_1.Serializable {
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
        return Object.assign(Object.assign({}, fields), { codecID: serialization.encoder(this.codecID, encoding, "number", "decimalString", 2), transaction: this.transaction.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.codecID = serialization.decoder(fields["codecID"], encoding, "decimalString", "number");
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
        const ins = this.getTransaction().getIns();
        const aIDHex = assetID.toString("hex");
        let total = new bn_js_1.default(0);
        for (let i = 0; i < ins.length; i++) {
            // only check StandardAmountInputs
            if (ins[`${i}`].getInput() instanceof input_1.StandardAmountInput &&
                aIDHex === ins[`${i}`].getAssetID().toString("hex")) {
                const input = ins[`${i}`].getInput();
                total = total.add(input.getAmount());
            }
        }
        return total;
    }
    /**
     * Returns the outputTotal as a BN
     */
    getOutputTotal(assetID) {
        const outs = this.getTransaction().getTotalOuts();
        const aIDHex = assetID.toString("hex");
        let total = new bn_js_1.default(0);
        for (let i = 0; i < outs.length; i++) {
            // only check StandardAmountOutput
            if (outs[`${i}`].getOutput() instanceof output_1.StandardAmountOutput &&
                aIDHex === outs[`${i}`].getAssetID().toString("hex")) {
                const output = outs[`${i}`].getOutput();
                total = total.add(output.getAmount());
            }
        }
        return total;
    }
    /**
     * Returns the number of burned tokens as a BN
     */
    getBurn(assetID) {
        return this.getInputTotal(assetID).sub(this.getOutputTotal(assetID));
    }
    toBuffer() {
        const codecBuf = buffer_1.Buffer.alloc(2);
        codecBuf.writeUInt16BE(this.transaction.getCodecID(), 0);
        const txtype = buffer_1.Buffer.alloc(4);
        txtype.writeUInt32BE(this.transaction.getTxType(), 0);
        const basebuff = this.transaction.toBuffer();
        return buffer_1.Buffer.concat([codecBuf, txtype, basebuff], codecBuf.length + txtype.length + basebuff.length);
    }
}
exports.StandardUnsignedTx = StandardUnsignedTx;
/**
 * Class representing a signed transaction.
 */
class StandardTx extends serialization_1.Serializable {
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
     * Returns the [[Credential[]]]
     */
    getCredentials() {
        return this.credentials;
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
        const tx = this.unsignedTx.getTransaction();
        const codecID = tx.getCodecID();
        const txbuff = this.unsignedTx.toBuffer();
        let bsize = txbuff.length;
        const credlen = buffer_1.Buffer.alloc(4);
        credlen.writeUInt32BE(this.credentials.length, 0);
        const barr = [txbuff, credlen];
        bsize += credlen.length;
        for (let i = 0; i < this.credentials.length; i++) {
            this.credentials[`${i}`].setCodecID(codecID);
            const credID = buffer_1.Buffer.alloc(4);
            credID.writeUInt32BE(this.credentials[`${i}`].getCredentialID(), 0);
            barr.push(credID);
            bsize += credID.length;
            const credbuff = this.credentials[`${i}`].toBuffer();
            bsize += credbuff.length;
            barr.push(credbuff);
        }
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
exports.StandardTx = StandardTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL3R4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFFeEMsa0RBQXNCO0FBRXRCLG1DQUF3RTtBQUN4RSxxQ0FBMkU7QUFDM0Usa0RBQXFEO0FBQ3JELDBEQUsrQjtBQUUvQjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDaEUsTUFBTSxJQUFJLEdBQW1CLE1BQU0sQ0FBQTtBQUNuQyxNQUFNLEdBQUcsR0FBbUIsS0FBSyxDQUFBO0FBQ2pDLE1BQU0sYUFBYSxHQUFtQixlQUFlLENBQUE7QUFDckQsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUV2Qzs7R0FFRztBQUNILE1BQXNCLGNBR3BCLFNBQVEsNEJBQVk7SUEwSnBCOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQXFDLFNBQVMsRUFDOUMsTUFBbUMsU0FBUyxFQUM1QyxPQUFlLFNBQVM7UUFFeEIsS0FBSyxFQUFFLENBQUE7UUF6S0MsY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUEyQ25CLGNBQVMsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ25DLGlCQUFZLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN2QyxZQUFPLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVqQyxXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxD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QUFRLEdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDNUQsS0FBSyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUE7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtTQUNwQjtRQUNELE1BQU0sSUFBSSxHQUFXLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQy9DLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILFVBQVUsQ0FBQyxVQUFrQjtRQUMzQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0lBQ3pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFFBQVE7UUFDTixPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUVELFdBQVc7UUFDVCxPQUFPLEtBQUssUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQTtJQUNyRSxDQUFDO0NBb0JGO0FBakhELGdDQWlIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBDb21tb24tVHJhbnNhY3Rpb25zXHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBDcmVkZW50aWFsIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHsgU3RhbmRhcmRLZXlDaGFpbiwgU3RhbmRhcmRLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxyXG5pbXBvcnQgeyBTdGFuZGFyZEFtb3VudElucHV0LCBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRcIlxyXG5pbXBvcnQgeyBTdGFuZGFyZEFtb3VudE91dHB1dCwgU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRcIlxyXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgU2VyaWFsaXphYmxlLFxyXG4gIFNlcmlhbGl6YXRpb24sXHJcbiAgU2VyaWFsaXplZEVuY29kaW5nLFxyXG4gIFNlcmlhbGl6ZWRUeXBlXHJcbn0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBjYjU4OiBTZXJpYWxpemVkVHlwZSA9IFwiY2I1OFwiXHJcbmNvbnN0IGhleDogU2VyaWFsaXplZFR5cGUgPSBcImhleFwiXHJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcclxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBiYXNlIGZvciBhbGwgdHJhbnNhY3Rpb25zLlxyXG4gKi9cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkQmFzZVR4PFxyXG4gIEtQQ2xhc3MgZXh0ZW5kcyBTdGFuZGFyZEtleVBhaXIsXHJcbiAgS0NDbGFzcyBleHRlbmRzIFN0YW5kYXJkS2V5Q2hhaW48S1BDbGFzcz5cclxuPiBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRCYXNlVHhcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBjb25zdCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgbmV0d29ya0lEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5uZXR3b3JrSUQsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgIGRlY2ltYWxTdHJpbmdcclxuICAgICAgKSxcclxuICAgICAgYmxvY2tjaGFpbklEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5ibG9ja2NoYWluSUQsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgIGNiNThcclxuICAgICAgKSxcclxuICAgICAgb3V0czogdGhpcy5vdXRzLm1hcCgobykgPT4gby5zZXJpYWxpemUoZW5jb2RpbmcpKSxcclxuICAgICAgaW5zOiB0aGlzLmlucy5tYXAoKGkpID0+IGkuc2VyaWFsaXplKGVuY29kaW5nKSksXHJcbiAgICAgIG1lbW86IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLm1lbW8sIGVuY29kaW5nLCBidWZmZXIsIGhleClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMubmV0d29ya0lEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJuZXR3b3JrSURcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBkZWNpbWFsU3RyaW5nLFxyXG4gICAgICBidWZmZXIsXHJcbiAgICAgIDRcclxuICAgIClcclxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJibG9ja2NoYWluSURcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBjYjU4LFxyXG4gICAgICBidWZmZXIsXHJcbiAgICAgIDMyXHJcbiAgICApXHJcbiAgICB0aGlzLm1lbW8gPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoZmllbGRzW1wibWVtb1wiXSwgZW5jb2RpbmcsIGhleCwgYnVmZmVyKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIG5ldHdvcmtJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxyXG4gIHByb3RlY3RlZCBudW1vdXRzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgb3V0czogU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRbXVxyXG4gIHByb3RlY3RlZCBudW1pbnM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gIHByb3RlY3RlZCBpbnM6IFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRbXVxyXG4gIHByb3RlY3RlZCBtZW1vOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMClcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbU3RhbmRhcmRCYXNlVHhdXVxyXG4gICAqL1xyXG4gIGFic3RyYWN0IGdldFR4VHlwZSgpOiBudW1iZXJcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgTmV0d29ya0lEIGFzIGEgbnVtYmVyXHJcbiAgICovXHJcbiAgZ2V0TmV0d29ya0lEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5uZXR3b3JrSUQucmVhZFVJbnQzMkJFKDApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBCdWZmZXIgcmVwcmVzZW50YXRpb24gb2YgdGhlIEJsb2NrY2hhaW5JRFxyXG4gICAqL1xyXG4gIGdldEJsb2NrY2hhaW5JRCgpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbklEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRdXXNcclxuICAgKi9cclxuICBhYnN0cmFjdCBnZXRJbnMoKTogU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dFtdXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFycmF5IG9mIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRdXXNcclxuICAgKi9cclxuICBhYnN0cmFjdCBnZXRPdXRzKCk6IFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0W11cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgY29tYmluZWQgdG90YWwgW1tTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dF1dc1xyXG4gICAqL1xyXG4gIGFic3RyYWN0IGdldFRvdGFsT3V0cygpOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFtdXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtZW1vXHJcbiAgICovXHJcbiAgZ2V0TWVtbygpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHRoaXMubWVtb1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1N0YW5kYXJkQmFzZVR4XV0uXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIHRoaXMub3V0cy5zb3J0KFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0LmNvbXBhcmF0b3IoKSlcclxuICAgIHRoaXMuaW5zLnNvcnQoU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dC5jb21wYXJhdG9yKCkpXHJcbiAgICB0aGlzLm51bW91dHMud3JpdGVVSW50MzJCRSh0aGlzLm91dHMubGVuZ3RoLCAwKVxyXG4gICAgdGhpcy5udW1pbnMud3JpdGVVSW50MzJCRSh0aGlzLmlucy5sZW5ndGgsIDApXHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9XHJcbiAgICAgIHRoaXMubmV0d29ya0lELmxlbmd0aCArIHRoaXMuYmxvY2tjaGFpbklELmxlbmd0aCArIHRoaXMubnVtb3V0cy5sZW5ndGhcclxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMubmV0d29ya0lELCB0aGlzLmJsb2NrY2hhaW5JRCwgdGhpcy5udW1vdXRzXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMub3V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSB0aGlzLm91dHNbYCR7aX1gXS50b0J1ZmZlcigpXHJcbiAgICAgIGJhcnIucHVzaChiKVxyXG4gICAgICBic2l6ZSArPSBiLmxlbmd0aFxyXG4gICAgfVxyXG4gICAgYmFyci5wdXNoKHRoaXMubnVtaW5zKVxyXG4gICAgYnNpemUgKz0gdGhpcy5udW1pbnMubGVuZ3RoXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5pbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3QgYjogQnVmZmVyID0gdGhpcy5pbnNbYCR7aX1gXS50b0J1ZmZlcigpXHJcbiAgICAgIGJhcnIucHVzaChiKVxyXG4gICAgICBic2l6ZSArPSBiLmxlbmd0aFxyXG4gICAgfVxyXG4gICAgbGV0IG1lbW9sZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgbWVtb2xlbi53cml0ZVVJbnQzMkJFKHRoaXMubWVtby5sZW5ndGgsIDApXHJcbiAgICBiYXJyLnB1c2gobWVtb2xlbilcclxuICAgIGJzaXplICs9IDRcclxuICAgIGJhcnIucHVzaCh0aGlzLm1lbW8pXHJcbiAgICBic2l6ZSArPSB0aGlzLm1lbW8ubGVuZ3RoXHJcbiAgICBjb25zdCBidWZmOiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gICAgcmV0dXJuIGJ1ZmZcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1N0YW5kYXJkQmFzZVR4XV0uXHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXHJcbiAgfVxyXG5cclxuICB0b1N0cmluZ0hleCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGAweCR7YmludG9vbHMuYWRkQ2hlY2tzdW0odGhpcy50b0J1ZmZlcigpKS50b1N0cmluZyhcImhleFwiKX1gXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyB0aGUgYnl0ZXMgb2YgYW4gW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbXNnIEEgQnVmZmVyIGZvciB0aGUgW1tVbnNpZ25lZFR4XV1cclxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXHJcbiAgICovXHJcbiAgYWJzdHJhY3Qgc2lnbihtc2c6IEJ1ZmZlciwga2M6IFN0YW5kYXJkS2V5Q2hhaW48S1BDbGFzcz4pOiBDcmVkZW50aWFsW11cclxuXHJcbiAgYWJzdHJhY3QgY2xvbmUoKTogdGhpc1xyXG5cclxuICBhYnN0cmFjdCBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzXHJcblxyXG4gIGFic3RyYWN0IHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IHRoaXNcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgU3RhbmRhcmRCYXNlVHggd2hpY2ggaXMgdGhlIGZvdW5kYXRpb24gZm9yIGFsbCB0cmFuc2FjdGlvbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIG5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxyXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xyXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXHJcbiAgICBvdXRzOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgaW5zOiBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKClcclxuICAgIHRoaXMubmV0d29ya0lELndyaXRlVUludDMyQkUobmV0d29ya0lELCAwKVxyXG4gICAgdGhpcy5ibG9ja2NoYWluSUQgPSBibG9ja2NoYWluSURcclxuICAgIGlmICh0eXBlb2YgbWVtbyAhPSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMubWVtbyA9IG1lbW9cclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGlucyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2Ygb3V0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLm51bW91dHMud3JpdGVVSW50MzJCRShvdXRzLmxlbmd0aCwgMClcclxuICAgICAgdGhpcy5vdXRzID0gb3V0cy5zb3J0KFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0LmNvbXBhcmF0b3IoKSlcclxuICAgICAgdGhpcy5udW1pbnMud3JpdGVVSW50MzJCRShpbnMubGVuZ3RoLCAwKVxyXG4gICAgICB0aGlzLmlucyA9IGlucy5zb3J0KFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXQuY29tcGFyYXRvcigpKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi5cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFVuc2lnbmVkVHg8XHJcbiAgS1BDbGFzcyBleHRlbmRzIFN0YW5kYXJkS2V5UGFpcixcclxuICBLQ0NsYXNzIGV4dGVuZHMgU3RhbmRhcmRLZXlDaGFpbjxLUENsYXNzPixcclxuICBTQlR4IGV4dGVuZHMgU3RhbmRhcmRCYXNlVHg8S1BDbGFzcywgS0NDbGFzcz5cclxuPiBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRVbnNpZ25lZFR4XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBjb2RlY0lEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5jb2RlY0lELFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIFwibnVtYmVyXCIsXHJcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgICAgMlxyXG4gICAgICApLFxyXG4gICAgICB0cmFuc2FjdGlvbjogdGhpcy50cmFuc2FjdGlvbi5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLmNvZGVjSUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImNvZGVjSURcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgXCJudW1iZXJcIlxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGNvZGVjSUQ6IG51bWJlciA9IDBcclxuICBwcm90ZWN0ZWQgdHJhbnNhY3Rpb246IFNCVHhcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgQ29kZWNJRCBhcyBhIG51bWJlclxyXG4gICAqL1xyXG4gIGdldENvZGVjSUQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmNvZGVjSURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDb2RlY0lEXHJcbiAgICovXHJcbiAgZ2V0Q29kZWNJREJ1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgbGV0IGNvZGVjQnVmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMilcclxuICAgIGNvZGVjQnVmLndyaXRlVUludDE2QkUodGhpcy5jb2RlY0lELCAwKVxyXG4gICAgcmV0dXJuIGNvZGVjQnVmXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpbnB1dFRvdGFsIGFzIGEgQk5cclxuICAgKi9cclxuICBnZXRJbnB1dFRvdGFsKGFzc2V0SUQ6IEJ1ZmZlcik6IEJOIHtcclxuICAgIGNvbnN0IGluczogU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dFtdID0gdGhpcy5nZXRUcmFuc2FjdGlvbigpLmdldElucygpXHJcbiAgICBjb25zdCBhSURIZXg6IHN0cmluZyA9IGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIilcclxuICAgIGxldCB0b3RhbDogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgaW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIC8vIG9ubHkgY2hlY2sgU3RhbmRhcmRBbW91bnRJbnB1dHNcclxuICAgICAgaWYgKFxyXG4gICAgICAgIGluc1tgJHtpfWBdLmdldElucHV0KCkgaW5zdGFuY2VvZiBTdGFuZGFyZEFtb3VudElucHV0ICYmXHJcbiAgICAgICAgYUlESGV4ID09PSBpbnNbYCR7aX1gXS5nZXRBc3NldElEKCkudG9TdHJpbmcoXCJoZXhcIilcclxuICAgICAgKSB7XHJcbiAgICAgICAgY29uc3QgaW5wdXQ6IFN0YW5kYXJkQW1vdW50SW5wdXQgPSBpbnNbXHJcbiAgICAgICAgICBgJHtpfWBcclxuICAgICAgICBdLmdldElucHV0KCkgYXMgU3RhbmRhcmRBbW91bnRJbnB1dFxyXG4gICAgICAgIHRvdGFsID0gdG90YWwuYWRkKGlucHV0LmdldEFtb3VudCgpKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG90YWxcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHB1dFRvdGFsIGFzIGEgQk5cclxuICAgKi9cclxuICBnZXRPdXRwdXRUb3RhbChhc3NldElEOiBCdWZmZXIpOiBCTiB7XHJcbiAgICBjb25zdCBvdXRzOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFtdID1cclxuICAgICAgdGhpcy5nZXRUcmFuc2FjdGlvbigpLmdldFRvdGFsT3V0cygpXHJcbiAgICBjb25zdCBhSURIZXg6IHN0cmluZyA9IGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIilcclxuICAgIGxldCB0b3RhbDogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgb3V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAvLyBvbmx5IGNoZWNrIFN0YW5kYXJkQW1vdW50T3V0cHV0XHJcbiAgICAgIGlmIChcclxuICAgICAgICBvdXRzW2Ake2l9YF0uZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBTdGFuZGFyZEFtb3VudE91dHB1dCAmJlxyXG4gICAgICAgIGFJREhleCA9PT0gb3V0c1tgJHtpfWBdLmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKVxyXG4gICAgICApIHtcclxuICAgICAgICBjb25zdCBvdXRwdXQ6IFN0YW5kYXJkQW1vdW50T3V0cHV0ID0gb3V0c1tcclxuICAgICAgICAgIGAke2l9YFxyXG4gICAgICAgIF0uZ2V0T3V0cHV0KCkgYXMgU3RhbmRhcmRBbW91bnRPdXRwdXRcclxuICAgICAgICB0b3RhbCA9IHRvdGFsLmFkZChvdXRwdXQuZ2V0QW1vdW50KCkpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0b3RhbFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ1cm5lZCB0b2tlbnMgYXMgYSBCTlxyXG4gICAqL1xyXG4gIGdldEJ1cm4oYXNzZXRJRDogQnVmZmVyKTogQk4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0SW5wdXRUb3RhbChhc3NldElEKS5zdWIodGhpcy5nZXRPdXRwdXRUb3RhbChhc3NldElEKSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFRyYW5zYWN0aW9uXHJcbiAgICovXHJcbiAgYWJzdHJhY3QgZ2V0VHJhbnNhY3Rpb24oKTogU0JUeFxyXG5cclxuICBhYnN0cmFjdCBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldD86IG51bWJlcik6IG51bWJlclxyXG5cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgY29kZWNCdWY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxyXG4gICAgY29kZWNCdWYud3JpdGVVSW50MTZCRSh0aGlzLnRyYW5zYWN0aW9uLmdldENvZGVjSUQoKSwgMClcclxuICAgIGNvbnN0IHR4dHlwZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICB0eHR5cGUud3JpdGVVSW50MzJCRSh0aGlzLnRyYW5zYWN0aW9uLmdldFR4VHlwZSgpLCAwKVxyXG4gICAgY29uc3QgYmFzZWJ1ZmYgPSB0aGlzLnRyYW5zYWN0aW9uLnRvQnVmZmVyKClcclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFxyXG4gICAgICBbY29kZWNCdWYsIHR4dHlwZSwgYmFzZWJ1ZmZdLFxyXG4gICAgICBjb2RlY0J1Zi5sZW5ndGggKyB0eHR5cGUubGVuZ3RoICsgYmFzZWJ1ZmYubGVuZ3RoXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaWducyB0aGlzIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIHNpZ25lZCBbW1N0YW5kYXJkVHhdXVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgc2lnbmVkIFtbU3RhbmRhcmRUeF1dXHJcbiAgICovXHJcbiAgYWJzdHJhY3Qgc2lnbihcclxuICAgIGtjOiBLQ0NsYXNzXHJcbiAgKTogU3RhbmRhcmRUeDxLUENsYXNzLCBLQ0NsYXNzLCBTdGFuZGFyZFVuc2lnbmVkVHg8S1BDbGFzcywgS0NDbGFzcywgU0JUeD4+XHJcblxyXG4gIGNvbnN0cnVjdG9yKHRyYW5zYWN0aW9uOiBTQlR4ID0gdW5kZWZpbmVkLCBjb2RlY0lEOiBudW1iZXIgPSAwKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICB0aGlzLmNvZGVjSUQgPSBjb2RlY0lEXHJcbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gdHJhbnNhY3Rpb25cclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBzaWduZWQgdHJhbnNhY3Rpb24uXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRUeDxcclxuICBLUENsYXNzIGV4dGVuZHMgU3RhbmRhcmRLZXlQYWlyLFxyXG4gIEtDQ2xhc3MgZXh0ZW5kcyBTdGFuZGFyZEtleUNoYWluPEtQQ2xhc3M+LFxyXG4gIFNVQlR4IGV4dGVuZHMgU3RhbmRhcmRVbnNpZ25lZFR4PFxyXG4gICAgS1BDbGFzcyxcclxuICAgIEtDQ2xhc3MsXHJcbiAgICBTdGFuZGFyZEJhc2VUeDxLUENsYXNzLCBLQ0NsYXNzPlxyXG4gID5cclxuPiBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRUeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgdW5zaWduZWRUeDogdGhpcy51bnNpZ25lZFR4LnNlcmlhbGl6ZShlbmNvZGluZyksXHJcbiAgICAgIGNyZWRlbnRpYWxzOiB0aGlzLmNyZWRlbnRpYWxzLm1hcCgoYykgPT4gYy5zZXJpYWxpemUoZW5jb2RpbmcpKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHVuc2lnbmVkVHg6IFNVQlR4ID0gdW5kZWZpbmVkXHJcbiAgcHJvdGVjdGVkIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFsW10gPSBbXVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBbW0NyZWRlbnRpYWxbXV1dXHJcbiAgICovXHJcbiAgZ2V0Q3JlZGVudGlhbHMoKTogQ3JlZGVudGlhbFtdIHtcclxuICAgIHJldHVybiB0aGlzLmNyZWRlbnRpYWxzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBbW1N0YW5kYXJkVW5zaWduZWRUeF1dXHJcbiAgICovXHJcbiAgZ2V0VW5zaWduZWRUeCgpOiBTVUJUeCB7XHJcbiAgICByZXR1cm4gdGhpcy51bnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICBhYnN0cmFjdCBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldD86IG51bWJlcik6IG51bWJlclxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbU3RhbmRhcmRUeF1dLlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCB0eDogU3RhbmRhcmRCYXNlVHg8S1BDbGFzcywgS0NDbGFzcz4gPVxyXG4gICAgICB0aGlzLnVuc2lnbmVkVHguZ2V0VHJhbnNhY3Rpb24oKVxyXG4gICAgY29uc3QgY29kZWNJRDogbnVtYmVyID0gdHguZ2V0Q29kZWNJRCgpXHJcbiAgICBjb25zdCB0eGJ1ZmY6IEJ1ZmZlciA9IHRoaXMudW5zaWduZWRUeC50b0J1ZmZlcigpXHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHR4YnVmZi5sZW5ndGhcclxuICAgIGNvbnN0IGNyZWRsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgY3JlZGxlbi53cml0ZVVJbnQzMkJFKHRoaXMuY3JlZGVudGlhbHMubGVuZ3RoLCAwKVxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdHhidWZmLCBjcmVkbGVuXVxyXG4gICAgYnNpemUgKz0gY3JlZGxlbi5sZW5ndGhcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLmNyZWRlbnRpYWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHRoaXMuY3JlZGVudGlhbHNbYCR7aX1gXS5zZXRDb2RlY0lEKGNvZGVjSUQpXHJcbiAgICAgIGNvbnN0IGNyZWRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICAgIGNyZWRJRC53cml0ZVVJbnQzMkJFKHRoaXMuY3JlZGVudGlhbHNbYCR7aX1gXS5nZXRDcmVkZW50aWFsSUQoKSwgMClcclxuICAgICAgYmFyci5wdXNoKGNyZWRJRClcclxuICAgICAgYnNpemUgKz0gY3JlZElELmxlbmd0aFxyXG4gICAgICBjb25zdCBjcmVkYnVmZjogQnVmZmVyID0gdGhpcy5jcmVkZW50aWFsc1tgJHtpfWBdLnRvQnVmZmVyKClcclxuICAgICAgYnNpemUgKz0gY3JlZGJ1ZmYubGVuZ3RoXHJcbiAgICAgIGJhcnIucHVzaChjcmVkYnVmZilcclxuICAgIH1cclxuICAgIGNvbnN0IGJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgICByZXR1cm4gYnVmZlxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGFuIFtbU3RhbmRhcmRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFR4IGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNlcmlhbGl6ZWQgQSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgcmF3IFtbU3RhbmRhcmRUeF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tTdGFuZGFyZFR4XV1cclxuICAgKlxyXG4gICAqIEByZW1hcmtzXHJcbiAgICogdW5saWtlIG1vc3QgZnJvbVN0cmluZ3MsIGl0IGV4cGVjdHMgdGhlIHN0cmluZyB0byBiZSBzZXJpYWxpemVkIGluIGNiNTggZm9ybWF0XHJcbiAgICovXHJcbiAgZnJvbVN0cmluZyhzZXJpYWxpemVkOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHNlcmlhbGl6ZWQpKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNiNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbU3RhbmRhcmRUeF1dLlxyXG4gICAqXHJcbiAgICogQHJlbWFya3NcclxuICAgKiB1bmxpa2UgbW9zdCB0b1N0cmluZ3MsIHRoaXMgcmV0dXJucyBpbiBjYjU4IHNlcmlhbGl6YXRpb24gZm9ybWF0XHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIHRvU3RyaW5nSGV4KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYDB4JHtiaW50b29scy5hZGRDaGVja3N1bSh0aGlzLnRvQnVmZmVyKCkpLnRvU3RyaW5nKFwiaGV4XCIpfWBcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNpZ25lZCB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1bnNpZ25lZFR4IE9wdGlvbmFsIFtbU3RhbmRhcmRVbnNpZ25lZFR4XV1cclxuICAgKiBAcGFyYW0gc2lnbmF0dXJlcyBPcHRpb25hbCBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHVuc2lnbmVkVHg6IFNVQlR4ID0gdW5kZWZpbmVkLFxyXG4gICAgY3JlZGVudGlhbHM6IENyZWRlbnRpYWxbXSA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgaWYgKHR5cGVvZiB1bnNpZ25lZFR4ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMudW5zaWduZWRUeCA9IHVuc2lnbmVkVHhcclxuICAgICAgaWYgKHR5cGVvZiBjcmVkZW50aWFscyAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBjcmVkZW50aWFsc1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==