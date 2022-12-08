"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportTx = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-ImportTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const inputs_1 = require("./inputs");
const basetx_1 = require("./basetx");
const credentials_1 = require("./credentials");
const credentials_2 = require("../../common/credentials");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const cb58 = "cb58";
const buffer = "Buffer";
/**
 * Class representing an unsigned Import transaction.
 */
class ImportTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Import transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param sourceChain Optional chainid for the source inputs to import. Default platform chainid.
     * @param importIns Array of [[TransferableInput]]s used in the transaction
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, sourceChain = undefined, importIns = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "ImportTx";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.JVMConstants.IMPORTTX : constants_1.JVMConstants.IMPORTTX_CODECONE;
        this.sourceChain = buffer_1.Buffer.alloc(32);
        this.numIns = buffer_1.Buffer.alloc(4);
        this.importIns = [];
        this.sourceChain = sourceChain; // do not correct, if it's wrong it'll bomb on toBuffer
        if (typeof importIns !== "undefined" && Array.isArray(importIns)) {
            for (let i = 0; i < importIns.length; i++) {
                if (!(importIns[`${i}`] instanceof inputs_1.TransferableInput)) {
                    throw new errors_1.TransferableInputError(`Error - ImportTx.constructor: invalid TransferableInput in array parameter ${importIns}`);
                }
            }
            this.importIns = importIns;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sourceChain: serialization.encoder(this.sourceChain, encoding, buffer, cb58), importIns: this.importIns.map((i) => i.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sourceChain = serialization.decoder(fields["sourceChain"], encoding, cb58, buffer, 32);
        this.importIns = fields["importIns"].map((i) => {
            let ii = new inputs_1.TransferableInput();
            ii.deserialize(i, encoding);
            return ii;
        });
        this.numIns = buffer_1.Buffer.alloc(4);
        this.numIns.writeUInt32BE(this.importIns.length, 0);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - ImportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.IMPORTTX
                : constants_1.JVMConstants.IMPORTTX_CODECONE;
    }
    /**
     * Returns the id of the [[ImportTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the source chainid.
     */
    getSourceChain() {
        return this.sourceChain;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ImportTx]], parses it, populates the class, and returns the length of the [[ImportTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ImportTx]]
     *
     * @returns The length of the raw [[ImportTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.sourceChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numIns = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numIns = this.numIns.readUInt32BE(0);
        for (let i = 0; i < numIns; i++) {
            const anIn = new inputs_1.TransferableInput();
            offset = anIn.fromBuffer(bytes, offset);
            this.importIns.push(anIn);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
     */
    toBuffer() {
        if (typeof this.sourceChain === "undefined") {
            throw new errors_1.ChainIdError("ImportTx.toBuffer -- this.sourceChain is undefined");
        }
        this.numIns.writeUInt32BE(this.importIns.length, 0);
        let barr = [super.toBuffer(), this.sourceChain, this.numIns];
        this.importIns = this.importIns.sort(inputs_1.TransferableInput.comparator());
        for (let i = 0; i < this.importIns.length; i++) {
            barr.push(this.importIns[`${i}`].toBuffer());
        }
        return buffer_1.Buffer.concat(barr);
    }
    /**
     * Returns an array of [[TransferableInput]]s in this transaction.
     */
    getImportInputs() {
        return this.importIns;
    }
    clone() {
        let newbase = new ImportTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new ImportTx(...args);
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const creds = super.sign(msg, kc);
        for (let i = 0; i < this.importIns.length; i++) {
            const cred = (0, credentials_1.SelectCredentialClass)(this.importIns[`${i}`].getInput().getCredentialID());
            const sigidxs = this.importIns[`${i}`].getInput().getSigIdxs();
            for (let j = 0; j < sigidxs.length; j++) {
                const keypair = kc.getKey(sigidxs[`${j}`].getSource());
                const signval = keypair.sign(msg);
                const sig = new credentials_2.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }
        return creds;
    }
}
exports.ImportTx = ImportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9qdm0vaW1wb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBMEM7QUFFMUMscUNBQTRDO0FBQzVDLHFDQUFpQztBQUNqQywrQ0FBcUQ7QUFDckQsMERBQXdFO0FBRXhFLHFEQUF3RDtBQUN4RCw2REFJa0M7QUFDbEMsK0NBSTJCO0FBRTNCOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNoRSxNQUFNLElBQUksR0FBbUIsTUFBTSxDQUFBO0FBQ25DLE1BQU0sTUFBTSxHQUFtQixRQUFRLENBQUE7QUFFdkM7O0dBRUc7QUFDSCxNQUFhLFFBQVMsU0FBUSxlQUFNO0lBK0psQzs7Ozs7Ozs7OztPQVVHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsY0FBc0IsU0FBUyxFQUMvQixZQUFpQyxTQUFTO1FBRTFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFsTHZDLGNBQVMsR0FBRyxVQUFVLENBQUE7UUFDdEIsYUFBUSxHQUFHLHdCQUFZLENBQUMsV0FBVyxDQUFBO1FBQ25DLFlBQU8sR0FDZixJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLHdCQUFZLENBQUMsaUJBQWlCLENB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QUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEQsTUFBTSxJQUFJLEdBQWUsSUFBQSxtQ0FBcUIsRUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsZUFBZSxFQUFFLENBQ3BELENBQUE7WUFDRCxNQUFNLE9BQU8sR0FBYSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtZQUN4RSxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7Z0JBQy9ELE1BQU0sT0FBTyxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ3pDLE1BQU0sR0FBRyxHQUFjLElBQUksdUJBQVMsRUFBRSxDQUFBO2dCQUN0QyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ3ZCO1lBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUNqQjtRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztDQW1DRjtBQWhNRCw0QkFnTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLUpWTS1JbXBvcnRUeFxyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHsgSlZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXHJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcclxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcclxuaW1wb3J0IHsgU2VsZWN0Q3JlZGVudGlhbENsYXNzIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBTaWduYXR1cmUsIFNpZ0lkeCwgQ3JlZGVudGlhbCB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcclxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxyXG5pbXBvcnQge1xyXG4gIFNlcmlhbGl6YXRpb24sXHJcbiAgU2VyaWFsaXplZEVuY29kaW5nLFxyXG4gIFNlcmlhbGl6ZWRUeXBlXHJcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5pbXBvcnQge1xyXG4gIENvZGVjSWRFcnJvcixcclxuICBDaGFpbklkRXJyb3IsXHJcbiAgVHJhbnNmZXJhYmxlSW5wdXRFcnJvclxyXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBjYjU4OiBTZXJpYWxpemVkVHlwZSA9IFwiY2I1OFwiXHJcbmNvbnN0IGJ1ZmZlcjogU2VyaWFsaXplZFR5cGUgPSBcIkJ1ZmZlclwiXHJcblxyXG4vKipcclxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEltcG9ydCB0cmFuc2FjdGlvbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBJbXBvcnRUeCBleHRlbmRzIEJhc2VUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiSW1wb3J0VHhcIlxyXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEpWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xyXG4gIHByb3RlY3RlZCBfdHlwZUlEID1cclxuICAgIHRoaXMuX2NvZGVjSUQgPT09IDAgPyBKVk1Db25zdGFudHMuSU1QT1JUVFggOiBKVk1Db25zdGFudHMuSU1QT1JUVFhfQ09ERUNPTkVcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBzb3VyY2VDaGFpbjogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuc291cmNlQ2hhaW4sXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgIGNiNThcclxuICAgICAgKSxcclxuICAgICAgaW1wb3J0SW5zOiB0aGlzLmltcG9ydElucy5tYXAoKGkpID0+IGkuc2VyaWFsaXplKGVuY29kaW5nKSlcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5zb3VyY2VDaGFpbiA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wic291cmNlQ2hhaW5cIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBjYjU4LFxyXG4gICAgICBidWZmZXIsXHJcbiAgICAgIDMyXHJcbiAgICApXHJcbiAgICB0aGlzLmltcG9ydElucyA9IGZpZWxkc1tcImltcG9ydEluc1wiXS5tYXAoKGk6IG9iamVjdCk6IFRyYW5zZmVyYWJsZUlucHV0ID0+IHtcclxuICAgICAgbGV0IGlpOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXHJcbiAgICAgIGlpLmRlc2VyaWFsaXplKGksIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gaWlcclxuICAgIH0pXHJcbiAgICB0aGlzLm51bUlucyA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgdGhpcy5udW1JbnMud3JpdGVVSW50MzJCRSh0aGlzLmltcG9ydElucy5sZW5ndGgsIDApXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc291cmNlQ2hhaW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcclxuICBwcm90ZWN0ZWQgbnVtSW5zOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgaW1wb3J0SW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBjb2RlY0lEXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcclxuICAgKi9cclxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgaWYgKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBJbXBvcnRUeC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXHJcbiAgICB0aGlzLl90eXBlSUQgPVxyXG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXHJcbiAgICAgICAgPyBKVk1Db25zdGFudHMuSU1QT1JUVFhcclxuICAgICAgICA6IEpWTUNvbnN0YW50cy5JTVBPUlRUWF9DT0RFQ09ORVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbSW1wb3J0VHhdXVxyXG4gICAqL1xyXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgc291cmNlIGNoYWluaWQuXHJcbiAgICovXHJcbiAgZ2V0U291cmNlQ2hhaW4oKTogQnVmZmVyIHtcclxuICAgIHJldHVybiB0aGlzLnNvdXJjZUNoYWluXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tJbXBvcnRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbSW1wb3J0VHhdXSBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tJbXBvcnRUeF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tJbXBvcnRUeF1dXHJcbiAgICpcclxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXHJcbiAgICovXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgdGhpcy5zb3VyY2VDaGFpbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICB0aGlzLm51bUlucyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgY29uc3QgbnVtSW5zOiBudW1iZXIgPSB0aGlzLm51bUlucy5yZWFkVUludDMyQkUoMClcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1JbnM7IGkrKykge1xyXG4gICAgICBjb25zdCBhbkluOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXHJcbiAgICAgIG9mZnNldCA9IGFuSW4uZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgICB0aGlzLmltcG9ydElucy5wdXNoKGFuSW4pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbSW1wb3J0VHhdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJJbXBvcnRUeC50b0J1ZmZlciAtLSB0aGlzLnNvdXJjZUNoYWluIGlzIHVuZGVmaW5lZFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHRoaXMubnVtSW5zLndyaXRlVUludDMyQkUodGhpcy5pbXBvcnRJbnMubGVuZ3RoLCAwKVxyXG4gICAgbGV0IGJhcnI6IEJ1ZmZlcltdID0gW3N1cGVyLnRvQnVmZmVyKCksIHRoaXMuc291cmNlQ2hhaW4sIHRoaXMubnVtSW5zXVxyXG4gICAgdGhpcy5pbXBvcnRJbnMgPSB0aGlzLmltcG9ydElucy5zb3J0KFRyYW5zZmVyYWJsZUlucHV0LmNvbXBhcmF0b3IoKSlcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLmltcG9ydElucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBiYXJyLnB1c2godGhpcy5pbXBvcnRJbnNbYCR7aX1gXS50b0J1ZmZlcigpKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycilcclxuICB9XHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIGluIHRoaXMgdHJhbnNhY3Rpb24uXHJcbiAgICovXHJcbiAgZ2V0SW1wb3J0SW5wdXRzKCk6IFRyYW5zZmVyYWJsZUlucHV0W10ge1xyXG4gICAgcmV0dXJuIHRoaXMuaW1wb3J0SW5zXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGxldCBuZXdiYXNlOiBJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeCgpXHJcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IEltcG9ydFR4KC4uLmFyZ3MpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSBtc2cgQSBCdWZmZXIgZm9yIHRoZSBbW1Vuc2lnbmVkVHhdXVxyXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcclxuICAgKi9cclxuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xyXG4gICAgY29uc3QgY3JlZHM6IENyZWRlbnRpYWxbXSA9IHN1cGVyLnNpZ24obXNnLCBrYylcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLmltcG9ydElucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjb25zdCBjcmVkOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKFxyXG4gICAgICAgIHRoaXMuaW1wb3J0SW5zW2Ake2l9YF0uZ2V0SW5wdXQoKS5nZXRDcmVkZW50aWFsSUQoKVxyXG4gICAgICApXHJcbiAgICAgIGNvbnN0IHNpZ2lkeHM6IFNpZ0lkeFtdID0gdGhpcy5pbXBvcnRJbnNbYCR7aX1gXS5nZXRJbnB1dCgpLmdldFNpZ0lkeHMoKVxyXG4gICAgICBmb3IgKGxldCBqOiBudW1iZXIgPSAwOyBqIDwgc2lnaWR4cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkoc2lnaWR4c1tgJHtqfWBdLmdldFNvdXJjZSgpKVxyXG4gICAgICAgIGNvbnN0IHNpZ252YWw6IEJ1ZmZlciA9IGtleXBhaXIuc2lnbihtc2cpXHJcbiAgICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcclxuICAgICAgICBzaWcuZnJvbUJ1ZmZlcihzaWdudmFsKVxyXG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZylcclxuICAgICAgfVxyXG4gICAgICBjcmVkcy5wdXNoKGNyZWQpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gY3JlZHNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBJbXBvcnQgdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIG5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxyXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xyXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcclxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gT3B0aW9uYWwgY2hhaW5pZCBmb3IgdGhlIHNvdXJjZSBpbnB1dHMgdG8gaW1wb3J0LiBEZWZhdWx0IHBsYXRmb3JtIGNoYWluaWQuXHJcbiAgICogQHBhcmFtIGltcG9ydElucyBBcnJheSBvZiBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIHVzZWQgaW4gdGhlIHRyYW5zYWN0aW9uXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXHJcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxyXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgaW1wb3J0SW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxyXG4gICAgdGhpcy5zb3VyY2VDaGFpbiA9IHNvdXJjZUNoYWluIC8vIGRvIG5vdCBjb3JyZWN0LCBpZiBpdCdzIHdyb25nIGl0J2xsIGJvbWIgb24gdG9CdWZmZXJcclxuICAgIGlmICh0eXBlb2YgaW1wb3J0SW5zICE9PSBcInVuZGVmaW5lZFwiICYmIEFycmF5LmlzQXJyYXkoaW1wb3J0SW5zKSkge1xyXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgaW1wb3J0SW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKCEoaW1wb3J0SW5zW2Ake2l9YF0gaW5zdGFuY2VvZiBUcmFuc2ZlcmFibGVJbnB1dCkpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBUcmFuc2ZlcmFibGVJbnB1dEVycm9yKFxyXG4gICAgICAgICAgICBgRXJyb3IgLSBJbXBvcnRUeC5jb25zdHJ1Y3RvcjogaW52YWxpZCBUcmFuc2ZlcmFibGVJbnB1dCBpbiBhcnJheSBwYXJhbWV0ZXIgJHtpbXBvcnRJbnN9YFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLmltcG9ydElucyA9IGltcG9ydEluc1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=