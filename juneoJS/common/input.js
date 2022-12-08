"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardAmountInput = exports.StandardTransferableInput = exports.StandardParseableInput = exports.Input = void 0;
/**
 * @packageDocumentation
 * @module Common-Inputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const credentials_1 = require("./credentials");
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
class Input extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "Input";
        this._typeID = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of signers from utxo
        /**
         * Returns the array of [[SigIdx]] for this [[Input]]
         */
        this.getSigIdxs = () => this.sigIdxs;
        /**
         * Creates and adds a [[SigIdx]] to the [[Input]].
         *
         * @param addressIdx The index of the address to reference in the signatures
         * @param address The address of the source of the signature
         */
        this.addSignatureIdx = (addressIdx, address) => {
            const sigidx = new credentials_1.SigIdx();
            const b = buffer_1.Buffer.alloc(4);
            b.writeUInt32BE(addressIdx, 0);
            sigidx.fromBuffer(b);
            sigidx.setSource(address);
            this.sigIdxs.push(sigidx);
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sigIdxs: this.sigIdxs.map((s) => s.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigIdxs = fields["sigIdxs"].map((s) => {
            let sidx = new credentials_1.SigIdx();
            sidx.deserialize(s, encoding);
            return sidx;
        });
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    fromBuffer(bytes, offset = 0) {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const sigCount = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for (let i = 0; i < sigCount; i++) {
            const sigidx = new credentials_1.SigIdx();
            const sigbuff = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }
    toBuffer() {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize = this.sigCount.length;
        const barr = [this.sigCount];
        for (let i = 0; i < this.sigIdxs.length; i++) {
            const b = this.sigIdxs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 representation of the [[Input]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.Input = Input;
Input.comparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getInputID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getInputID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
class StandardParseableInput extends serialization_1.Serializable {
    /**
     * Class representing an [[StandardParseableInput]] for a transaction.
     *
     * @param input A number representing the InputID of the [[StandardParseableInput]]
     */
    constructor(input = undefined) {
        super();
        this._typeName = "StandardParseableInput";
        this._typeID = undefined;
        this.getInput = () => this.input;
        if (input instanceof Input) {
            this.input = input;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { input: this.input.serialize(encoding) });
    }
    toBuffer() {
        const inbuff = this.input.toBuffer();
        const inid = buffer_1.Buffer.alloc(4);
        inid.writeUInt32BE(this.input.getInputID(), 0);
        const barr = [inid, inbuff];
        return buffer_1.Buffer.concat(barr, inid.length + inbuff.length);
    }
}
exports.StandardParseableInput = StandardParseableInput;
/**
 * Returns a function used to sort an array of [[StandardParseableInput]]s
 */
StandardParseableInput.comparator = () => (a, b) => {
    const sorta = a.toBuffer();
    const sortb = b.toBuffer();
    return buffer_1.Buffer.compare(sorta, sortb);
};
class StandardTransferableInput extends StandardParseableInput {
    /**
     * Class representing an [[StandardTransferableInput]] for a transaction.
     *
     * @param txid A {@link https://github.com/feross/buffer|Buffer} containing the transaction ID of the referenced UTXO
     * @param outputidx A {@link https://github.com/feross/buffer|Buffer} containing the index of the output in the transaction consumed in the [[StandardTransferableInput]]
     * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Input]]
     * @param input An [[Input]] to be made transferable
     */
    constructor(txid = undefined, outputidx = undefined, assetID = undefined, input = undefined) {
        super();
        this._typeName = "StandardTransferableInput";
        this._typeID = undefined;
        this.txid = buffer_1.Buffer.alloc(32);
        this.outputidx = buffer_1.Buffer.alloc(4);
        this.assetID = buffer_1.Buffer.alloc(32);
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
         */
        this.getTxID = () => this.txid;
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
         */
        this.getOutputIdx = () => this.outputidx;
        /**
         * Returns a base-58 string representation of the UTXOID this [[StandardTransferableInput]] references.
         */
        this.getUTXOID = () => bintools.bufferToB58(buffer_1.Buffer.concat([this.txid, this.outputidx]));
        /**
         * Returns the input.
         */
        this.getInput = () => this.input;
        /**
         * Returns the assetID of the input.
         */
        this.getAssetID = () => this.assetID;
        if (typeof txid !== "undefined" &&
            typeof outputidx !== "undefined" &&
            typeof assetID !== "undefined" &&
            input instanceof Input) {
            this.input = input;
            this.txid = txid;
            this.outputidx = outputidx;
            this.assetID = assetID;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { txid: serialization.encoder(this.txid, encoding, "Buffer", "cb58"), outputidx: serialization.encoder(this.outputidx, encoding, "Buffer", "decimalString"), assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.txid = serialization.decoder(fields["txid"], encoding, "cb58", "Buffer", 32);
        this.outputidx = serialization.decoder(fields["outputidx"], encoding, "decimalString", "Buffer", 4);
        this.assetID = serialization.decoder(fields["assetID"], encoding, "cb58", "Buffer", 32);
        //input deserialization must be implmented in child classes
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTransferableInput]].
     */
    toBuffer() {
        const parseableBuff = super.toBuffer();
        const bsize = this.txid.length +
            this.outputidx.length +
            this.assetID.length +
            parseableBuff.length;
        const barr = [
            this.txid,
            this.outputidx,
            this.assetID,
            parseableBuff
        ];
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Returns a base-58 representation of the [[StandardTransferableInput]].
     */
    toString() {
        /* istanbul ignore next */
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.StandardTransferableInput = StandardTransferableInput;
/**
 * An [[Input]] class which specifies a token amount .
 */
class StandardAmountInput extends Input {
    /**
     * An [[AmountInput]] class which issues a payment on an assetID.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
     */
    constructor(amount = undefined) {
        super();
        this._typeName = "StandardAmountInput";
        this._typeID = undefined;
        this.amount = buffer_1.Buffer.alloc(8);
        this.amountValue = new bn_js_1.default(0);
        /**
         * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getAmount = () => this.amountValue.clone();
        if (amount) {
            this.amountValue = amount.clone();
            this.amount = bintools.fromBNToBuffer(amount, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { amount: serialization.encoder(this.amount, encoding, "Buffer", "decimalString", 8) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.amount = serialization.decoder(fields["amount"], encoding, "decimalString", "Buffer", 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[AmountInput]] and returns the size of the input.
     */
    fromBuffer(bytes, offset = 0) {
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
        offset += 8;
        return super.fromBuffer(bytes, offset);
    }
    /**
     * Returns the buffer representing the [[AmountInput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.amount.length + superbuff.length;
        const barr = [this.amount, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.StandardAmountInput = StandardAmountInput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2lucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFDeEMsa0RBQXNCO0FBQ3RCLCtDQUFzQztBQUN0QywwREFJK0I7QUFFL0I7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFLE1BQXNCLEtBQU0sU0FBUSw0QkFBWTtJQUFoRDs7UUFDWSxjQUFTLEdBQUcsT0FBTyxDQUFBO1FBQ25CLFlBQU8sR0FBRyxTQUFTLENBQUE7UUFtQm5CLGFBQVEsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2xDLFlBQU8sR0FBYSxFQUFFLENBQUEsQ0FBQyw0QkFBNEI7UUEwQjdEOztXQUVHO1FBQ0gsZUFBVSxHQUFHLEdBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUE7UUFJekM7Ozs7O1dBS0c7UUFDSCxvQkFBZSxHQUFHLENBQUMsVUFBa0IsRUFBRSxPQUFlLEVBQUUsRUFBRTtZQUN4RCxNQUFNLE1BQU0sR0FBVyxJQUFJLG9CQUFNLEVBQUUsQ0FBQTtZQUNuQyxNQUFNLENBQUMsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2pDLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzlCLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDcEIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUN6QixJQUFJLENBQUMs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UUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdkQsTUFBTSxJQUFJLENBQUMsQ0FBQTtRQUNYLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDeEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE1BQU0sU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUMxQyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO1FBQzNELE1BQU0sSUFBSSxHQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUMvQyxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25DLENBQUM7Q0FjRjtBQXJFRCxrREFxRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQ29tbW9uLUlucHV0c1xyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXHJcbmltcG9ydCB7IFNpZ0lkeCB9IGZyb20gXCIuL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IHtcclxuICBTZXJpYWxpemFibGUsXHJcbiAgU2VyaWFsaXphdGlvbixcclxuICBTZXJpYWxpemVkRW5jb2RpbmdcclxufSBmcm9tIFwiLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5wdXQgZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIklucHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBzaWdJZHhzOiB0aGlzLnNpZ0lkeHMubWFwKChzKSA9PiBzLnNlcmlhbGl6ZShlbmNvZGluZykpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuc2lnSWR4cyA9IGZpZWxkc1tcInNpZ0lkeHNcIl0ubWFwKChzOiBvYmplY3QpID0+IHtcclxuICAgICAgbGV0IHNpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxyXG4gICAgICBzaWR4LmRlc2VyaWFsaXplKHMsIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gc2lkeFxyXG4gICAgfSlcclxuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHNpZ0NvdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgc2lnSWR4czogU2lnSWR4W10gPSBbXSAvLyBpZHhzIG9mIHNpZ25lcnMgZnJvbSB1dHhvXHJcblxyXG4gIHN0YXRpYyBjb21wYXJhdG9yID1cclxuICAgICgpOiAoKGE6IElucHV0LCBiOiBJbnB1dCkgPT4gMSB8IC0xIHwgMCkgPT5cclxuICAgIChhOiBJbnB1dCwgYjogSW5wdXQpOiAxIHwgLTEgfCAwID0+IHtcclxuICAgICAgY29uc3QgYW91dGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgICAgYW91dGlkLndyaXRlVUludDMyQkUoYS5nZXRJbnB1dElEKCksIDApXHJcbiAgICAgIGNvbnN0IGFidWZmOiBCdWZmZXIgPSBhLnRvQnVmZmVyKClcclxuXHJcbiAgICAgIGNvbnN0IGJvdXRpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICAgIGJvdXRpZC53cml0ZVVJbnQzMkJFKGIuZ2V0SW5wdXRJRCgpLCAwKVxyXG4gICAgICBjb25zdCBiYnVmZjogQnVmZmVyID0gYi50b0J1ZmZlcigpXHJcblxyXG4gICAgICBjb25zdCBhc29ydDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChcclxuICAgICAgICBbYW91dGlkLCBhYnVmZl0sXHJcbiAgICAgICAgYW91dGlkLmxlbmd0aCArIGFidWZmLmxlbmd0aFxyXG4gICAgICApXHJcbiAgICAgIGNvbnN0IGJzb3J0OiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KFxyXG4gICAgICAgIFtib3V0aWQsIGJidWZmXSxcclxuICAgICAgICBib3V0aWQubGVuZ3RoICsgYmJ1ZmYubGVuZ3RoXHJcbiAgICAgIClcclxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGFzb3J0LCBic29ydCkgYXMgMSB8IC0xIHwgMFxyXG4gICAgfVxyXG5cclxuICBhYnN0cmFjdCBnZXRJbnB1dElEKCk6IG51bWJlclxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1NpZ0lkeF1dIGZvciB0aGlzIFtbSW5wdXRdXVxyXG4gICAqL1xyXG4gIGdldFNpZ0lkeHMgPSAoKTogU2lnSWR4W10gPT4gdGhpcy5zaWdJZHhzXHJcblxyXG4gIGFic3RyYWN0IGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXJcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbmQgYWRkcyBhIFtbU2lnSWR4XV0gdG8gdGhlIFtbSW5wdXRdXS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcclxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBvZiB0aGUgc291cmNlIG9mIHRoZSBzaWduYXR1cmVcclxuICAgKi9cclxuICBhZGRTaWduYXR1cmVJZHggPSAoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpID0+IHtcclxuICAgIGNvbnN0IHNpZ2lkeDogU2lnSWR4ID0gbmV3IFNpZ0lkeCgpXHJcbiAgICBjb25zdCBiOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIGIud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxyXG4gICAgc2lnaWR4LmZyb21CdWZmZXIoYilcclxuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcylcclxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcclxuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5zaWdDb3VudCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgY29uc3Qgc2lnQ291bnQ6IG51bWJlciA9IHRoaXMuc2lnQ291bnQucmVhZFVJbnQzMkJFKDApXHJcbiAgICB0aGlzLnNpZ0lkeHMgPSBbXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNpZ0NvdW50OyBpKyspIHtcclxuICAgICAgY29uc3Qgc2lnaWR4ID0gbmV3IFNpZ0lkeCgpXHJcbiAgICAgIGNvbnN0IHNpZ2J1ZmY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIHNpZ2lkeC5mcm9tQnVmZmVyKHNpZ2J1ZmYpXHJcbiAgICAgIG9mZnNldCArPSA0XHJcbiAgICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcclxuICAgIH1cclxuICAgIHJldHVybiBvZmZzZXRcclxuICB9XHJcblxyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcclxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdGhpcy5zaWdDb3VudC5sZW5ndGhcclxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuc2lnQ291bnRdXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5zaWdJZHhzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMuc2lnSWR4c1tgJHtpfWBdLnRvQnVmZmVyKClcclxuICAgICAgYmFyci5wdXNoKGIpXHJcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXHJcbiAgICB9XHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0lucHV0XV0uXHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXHJcbiAgfVxyXG5cclxuICBhYnN0cmFjdCBjbG9uZSgpOiB0aGlzXHJcblxyXG4gIGFic3RyYWN0IGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXNcclxuXHJcbiAgYWJzdHJhY3Qgc2VsZWN0KGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogSW5wdXRcclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkUGFyc2VhYmxlSW5wdXQgZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YW5kYXJkUGFyc2VhYmxlSW5wdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIGlucHV0OiB0aGlzLmlucHV0LnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBpbnB1dDogSW5wdXRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1N0YW5kYXJkUGFyc2VhYmxlSW5wdXRdXXNcclxuICAgKi9cclxuICBzdGF0aWMgY29tcGFyYXRvciA9XHJcbiAgICAoKTogKChcclxuICAgICAgYTogU3RhbmRhcmRQYXJzZWFibGVJbnB1dCxcclxuICAgICAgYjogU3RhbmRhcmRQYXJzZWFibGVJbnB1dFxyXG4gICAgKSA9PiAxIHwgLTEgfCAwKSA9PlxyXG4gICAgKGE6IFN0YW5kYXJkUGFyc2VhYmxlSW5wdXQsIGI6IFN0YW5kYXJkUGFyc2VhYmxlSW5wdXQpOiAxIHwgLTEgfCAwID0+IHtcclxuICAgICAgY29uc3Qgc29ydGEgPSBhLnRvQnVmZmVyKClcclxuICAgICAgY29uc3Qgc29ydGIgPSBiLnRvQnVmZmVyKClcclxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHNvcnRhLCBzb3J0YikgYXMgMSB8IC0xIHwgMFxyXG4gICAgfVxyXG5cclxuICBnZXRJbnB1dCA9ICgpOiBJbnB1dCA9PiB0aGlzLmlucHV0XHJcblxyXG4gIC8vIG11c3QgYmUgaW1wbGVtZW50ZWQgdG8gc2VsZWN0IGlucHV0IHR5cGVzIGZvciB0aGUgVk0gaW4gcXVlc3Rpb25cclxuICBhYnN0cmFjdCBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldD86IG51bWJlcik6IG51bWJlclxyXG5cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgaW5idWZmOiBCdWZmZXIgPSB0aGlzLmlucHV0LnRvQnVmZmVyKClcclxuICAgIGNvbnN0IGluaWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgaW5pZC53cml0ZVVJbnQzMkJFKHRoaXMuaW5wdXQuZ2V0SW5wdXRJRCgpLCAwKVxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbaW5pZCwgaW5idWZmXVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgaW5pZC5sZW5ndGggKyBpbmJ1ZmYubGVuZ3RoKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIFtbU3RhbmRhcmRQYXJzZWFibGVJbnB1dF1dIGZvciBhIHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGlucHV0IEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgSW5wdXRJRCBvZiB0aGUgW1tTdGFuZGFyZFBhcnNlYWJsZUlucHV0XV1cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihpbnB1dDogSW5wdXQgPSB1bmRlZmluZWQpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIElucHV0KSB7XHJcbiAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dFxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXQgZXh0ZW5kcyBTdGFuZGFyZFBhcnNlYWJsZUlucHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICB0eGlkOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy50eGlkLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJjYjU4XCIpLFxyXG4gICAgICBvdXRwdXRpZHg6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICB0aGlzLm91dHB1dGlkeCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXHJcbiAgICAgICksXHJcbiAgICAgIGFzc2V0SUQ6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLmFzc2V0SUQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIilcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy50eGlkID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJ0eGlkXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJjYjU4XCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDMyXHJcbiAgICApXHJcbiAgICB0aGlzLm91dHB1dGlkeCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wib3V0cHV0aWR4XCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDRcclxuICAgIClcclxuICAgIHRoaXMuYXNzZXRJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wiYXNzZXRJRFwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIFwiY2I1OFwiLFxyXG4gICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAzMlxyXG4gICAgKVxyXG4gICAgLy9pbnB1dCBkZXNlcmlhbGl6YXRpb24gbXVzdCBiZSBpbXBsbWVudGVkIGluIGNoaWxkIGNsYXNzZXNcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCB0eGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXHJcbiAgcHJvdGVjdGVkIG91dHB1dGlkeDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgcHJvdGVjdGVkIGFzc2V0SUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBUeElELlxyXG4gICAqL1xyXG4gIGdldFR4SUQgPSAoKTogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gQnVmZmVyID0+IHRoaXMudHhpZFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gIG9mIHRoZSBPdXRwdXRJZHguXHJcbiAgICovXHJcbiAgZ2V0T3V0cHV0SWR4ID0gKCk6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIEJ1ZmZlciA9PiB0aGlzLm91dHB1dGlkeFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIFVUWE9JRCB0aGlzIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dF1dIHJlZmVyZW5jZXMuXHJcbiAgICovXHJcbiAgZ2V0VVRYT0lEID0gKCk6IHN0cmluZyA9PlxyXG4gICAgYmludG9vbHMuYnVmZmVyVG9CNTgoQnVmZmVyLmNvbmNhdChbdGhpcy50eGlkLCB0aGlzLm91dHB1dGlkeF0pKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpbnB1dC5cclxuICAgKi9cclxuICBnZXRJbnB1dCA9ICgpOiBJbnB1dCA9PiB0aGlzLmlucHV0XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFzc2V0SUQgb2YgdGhlIGlucHV0LlxyXG4gICAqL1xyXG4gIGdldEFzc2V0SUQgPSAoKTogQnVmZmVyID0+IHRoaXMuYXNzZXRJRFxyXG5cclxuICBhYnN0cmFjdCBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldD86IG51bWJlcik6IG51bWJlclxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dF1dLlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBwYXJzZWFibGVCdWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cclxuICAgICAgdGhpcy50eGlkLmxlbmd0aCArXHJcbiAgICAgIHRoaXMub3V0cHV0aWR4Lmxlbmd0aCArXHJcbiAgICAgIHRoaXMuYXNzZXRJRC5sZW5ndGggK1xyXG4gICAgICBwYXJzZWFibGVCdWZmLmxlbmd0aFxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXHJcbiAgICAgIHRoaXMudHhpZCxcclxuICAgICAgdGhpcy5vdXRwdXRpZHgsXHJcbiAgICAgIHRoaXMuYXNzZXRJRCxcclxuICAgICAgcGFyc2VhYmxlQnVmZlxyXG4gICAgXVxyXG4gICAgY29uc3QgYnVmZjogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcclxuICAgIHJldHVybiBidWZmXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0XV0uXHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dF1dIGZvciBhIHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHR4aWQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIHRoZSB0cmFuc2FjdGlvbiBJRCBvZiB0aGUgcmVmZXJlbmNlZCBVVFhPXHJcbiAgICogQHBhcmFtIG91dHB1dGlkeCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIGluZGV4IG9mIHRoZSBvdXRwdXQgaW4gdGhlIHRyYW5zYWN0aW9uIGNvbnN1bWVkIGluIHRoZSBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRdXVxyXG4gICAqIEBwYXJhbSBhc3NldElEIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBhc3NldElEIG9mIHRoZSBbW0lucHV0XV1cclxuICAgKiBAcGFyYW0gaW5wdXQgQW4gW1tJbnB1dF1dIHRvIGJlIG1hZGUgdHJhbnNmZXJhYmxlXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICB0eGlkOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBvdXRwdXRpZHg6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGlucHV0OiBJbnB1dCA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgaWYgKFxyXG4gICAgICB0eXBlb2YgdHhpZCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICB0eXBlb2Ygb3V0cHV0aWR4ICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgIHR5cGVvZiBhc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgIGlucHV0IGluc3RhbmNlb2YgSW5wdXRcclxuICAgICkge1xyXG4gICAgICB0aGlzLmlucHV0ID0gaW5wdXRcclxuICAgICAgdGhpcy50eGlkID0gdHhpZFxyXG4gICAgICB0aGlzLm91dHB1dGlkeCA9IG91dHB1dGlkeFxyXG4gICAgICB0aGlzLmFzc2V0SUQgPSBhc3NldElEXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQW4gW1tJbnB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhIHRva2VuIGFtb3VudCAuXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRBbW91bnRJbnB1dCBleHRlbmRzIElucHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZEFtb3VudElucHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBhbW91bnQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICB0aGlzLmFtb3VudCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxyXG4gICAgICAgIDhcclxuICAgICAgKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLmFtb3VudCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wiYW1vdW50XCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDhcclxuICAgIClcclxuICAgIHRoaXMuYW1vdW50VmFsdWUgPSBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLmFtb3VudClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhbW91bnQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg4KVxyXG4gIHByb3RlY3RlZCBhbW91bnRWYWx1ZTogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYW1vdW50IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXHJcbiAgICovXHJcbiAgZ2V0QW1vdW50ID0gKCk6IEJOID0+IHRoaXMuYW1vdW50VmFsdWUuY2xvbmUoKVxyXG5cclxuICAvKipcclxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tBbW91bnRJbnB1dF1dIGFuZCByZXR1cm5zIHRoZSBzaXplIG9mIHRoZSBpbnB1dC5cclxuICAgKi9cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXHJcbiAgICB0aGlzLmFtb3VudFZhbHVlID0gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5hbW91bnQpXHJcbiAgICBvZmZzZXQgKz0gOFxyXG4gICAgcmV0dXJuIHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbQW1vdW50SW5wdXRdXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID0gdGhpcy5hbW91bnQubGVuZ3RoICsgc3VwZXJidWZmLmxlbmd0aFxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5hbW91bnQsIHN1cGVyYnVmZl1cclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gW1tBbW91bnRJbnB1dF1dIGNsYXNzIHdoaWNoIGlzc3VlcyBhIHBheW1lbnQgb24gYW4gYXNzZXRJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGFtb3VudCBpbiB0aGUgaW5wdXRcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihhbW91bnQ6IEJOID0gdW5kZWZpbmVkKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICBpZiAoYW1vdW50KSB7XHJcbiAgICAgIHRoaXMuYW1vdW50VmFsdWUgPSBhbW91bnQuY2xvbmUoKVxyXG4gICAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGFtb3VudCwgOClcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19