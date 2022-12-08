"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationTx = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-OperationTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const ops_1 = require("./ops");
const credentials_1 = require("./credentials");
const credentials_2 = require("../../common/credentials");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class representing an unsigned Operation transaction.
 */
class OperationTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Operation transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param ops Array of [[Operation]]s used in the transaction
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, ops = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "OperationTx";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.OPERATIONTX
            : constants_1.JVMConstants.OPERATIONTX_CODECONE;
        this.numOps = buffer_1.Buffer.alloc(4);
        this.ops = [];
        if (typeof ops !== "undefined" && Array.isArray(ops)) {
            for (let i = 0; i < ops.length; i++) {
                if (!(ops[`${i}`] instanceof ops_1.TransferableOperation)) {
                    throw new errors_1.OperationError(`Error - OperationTx.constructor: invalid op in array parameter ${ops}`);
                }
            }
            this.ops = ops;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { ops: this.ops.map((o) => o.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.ops = fields["ops"].map((o) => {
            let op = new ops_1.TransferableOperation();
            op.deserialize(o, encoding);
            return op;
        });
        this.numOps = buffer_1.Buffer.alloc(4);
        this.numOps.writeUInt32BE(this.ops.length, 0);
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - OperationTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.OPERATIONTX
                : constants_1.JVMConstants.OPERATIONTX_CODECONE;
    }
    /**
     * Returns the id of the [[OperationTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[OperationTx]], parses it, populates the class, and returns the length of the [[OperationTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[OperationTx]]
     *
     * @returns The length of the raw [[OperationTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.numOps = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numOps = this.numOps.readUInt32BE(0);
        for (let i = 0; i < numOps; i++) {
            const op = new ops_1.TransferableOperation();
            offset = op.fromBuffer(bytes, offset);
            this.ops.push(op);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[OperationTx]].
     */
    toBuffer() {
        this.numOps.writeUInt32BE(this.ops.length, 0);
        let barr = [super.toBuffer(), this.numOps];
        this.ops = this.ops.sort(ops_1.TransferableOperation.comparator());
        for (let i = 0; i < this.ops.length; i++) {
            barr.push(this.ops[`${i}`].toBuffer());
        }
        return buffer_1.Buffer.concat(barr);
    }
    /**
     * Returns an array of [[TransferableOperation]]s in this transaction.
     */
    getOperations() {
        return this.ops;
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
        for (let i = 0; i < this.ops.length; i++) {
            const cred = (0, credentials_1.SelectCredentialClass)(this.ops[`${i}`].getOperation().getCredentialID());
            const sigidxs = this.ops[`${i}`].getOperation().getSigIdxs();
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
    clone() {
        const newbase = new OperationTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new OperationTx(...args);
    }
}
exports.OperationTx = OperationTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9udHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9qdm0vb3BlcmF0aW9udHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBMEM7QUFHMUMsK0JBQTZDO0FBQzdDLCtDQUFxRDtBQUVyRCwwREFBd0U7QUFDeEUscUNBQWlDO0FBQ2pDLHFEQUF3RDtBQUV4RCwrQ0FBaUU7QUFFakU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWpEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsZUFBTTtJQWlJckM7Ozs7Ozs7OztPQVNHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsTUFBK0IsU0FBUztRQUV4QyxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBbEp2QyxjQUFTLEdBQUcsYUFBYSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyx3QkFBWSxDQUFDLFdBQVcsQ0FBQTtRQUNuQyxZQUFPLEdBQ2YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyx3QkFBWSxDQUFDLFdBQVc7WUFDMUIsQ0FBQyxDQUFDLHdCQUFZLENBQUMsb0JBQW9CLENBQUE7UUFvQjdCLFdBQU0sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2hDLFFBQUcsR0FBNEIsRUFBRSxDQUFBO1FBeUh6QyxJQUFJLE9BQU8sR0FBRyxLQUFLLFdBQVcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3BELEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMzQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLDJCQUFxQixDQUFDLEVBQUU7b0JBQ25ELE1BQU0sSUFBSSx1QkFBYyxDQUN0QixrRUFBa0UsR0FBRyxFQUFFLENBQ3hFLENBQUE7aUJBQ0Y7YUFDRjtZQUNELElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO1NBQ2Y7SUFDSCxDQUFDO0lBdEpELFNBQVMsQ0FBQyxXQUErQixLQUFLO1FBQzVDLE1BQU0sTUFBTSxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDaEQsdUNBQ0ssTUFBTSxLQUNULEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUNoRDtJQUNILENBQUM7SUFDRCxXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUU7WUFDekMsSUFBSSxFQUFFLEdBQTBCLElBQUksMkJBQXFCLEVBQUUsQ0FBQTtZQUMzRCxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUMzQixPQUFPLEVBQUUsQ0FBQTtRQUNYLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLE1BQU0sR0FBRyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQy9DLENBQUM7SUFLRCxVQUFVLENBQUMsT0FBZTtRQUN4QixJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksT0FBTyxLQUFLLENBQUMsRUFBRTtZQUNsQywwQkFBMEI7WUFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQ3BCLDhFQUE4RSxDQUMvRSxDQUFBO1NBQ0Y7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtRQUN2QixJQUFJLENBQUMsT0FBTztZQUNWLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQztnQkFDakIsQ0FBQyxDQUFDLHdCQUFZLENBQUMsV0FBVztnQkFDMUIsQ0FBQyxDQUFDLHdCQUFZLENBQUMsb0JBQW9CLENBQUE7SUFDekMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxVQUFVLENBQUMsS0FBYSxFQUFFLFNBQWlCLENBQUM7UUFDMUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3hDLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUMxRCxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsTUFBTSxNQUFNLEdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbEQsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN2QyxNQUFNLEVBQUUsR0FBMEIsSUFBSSwyQkFBcUIsRUFBRSxDQUFBO1lBQzdELE1BQU0sR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtTQUNsQjtRQUNELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzdDLElBQUksSUFBSSxHQUFhLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNwRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLDJCQUFxQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUE7UUFDNUQsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtTQUN2QztRQUNELE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhO1FBQ1gsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFBO0lBQ2pCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsSUFBSSxDQUFDLEdBQVcsRUFBRSxFQUFZO1FBQzVCLE1BQU0sS0FBSyxHQUFpQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUMvQyxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDaEQsTUFBTSxJQUFJLEdBQWUsSUFBQSxtQ0FBcUIsRUFDNUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUMsZUFBZSxFQUFFLENBQ2xELENBQUE7WUFDRCxNQUFNLE9BQU8sR0FBYSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtZQUN0RSxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7Z0JBQy9ELE1BQU0sT0FBTyxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ3pDLE1BQU0sR0FBRyxHQUFjLElBQUksdUJBQVMsRUFBRSxDQUFBO2dCQUN0QyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ3ZCO1lBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUNqQjtRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLE9BQU8sR0FBZ0IsSUFBSSxXQUFXLEVBQUUsQ0FBQTtRQUM5QyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLE9BQU8sT0FBZSxDQUFBO0lBQ3hCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxXQUFXLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQTtJQUN6QyxDQUFDO0NBZ0NGO0FBL0pELGtDQStKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktSlZNLU9wZXJhdGlvblR4XHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBKVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcclxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxyXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPcGVyYXRpb24gfSBmcm9tIFwiLi9vcHNcIlxyXG5pbXBvcnQgeyBTZWxlY3RDcmVkZW50aWFsQ2xhc3MgfSBmcm9tIFwiLi9jcmVkZW50aWFsc1wiXHJcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxyXG5pbXBvcnQgeyBTaWduYXR1cmUsIFNpZ0lkeCwgQ3JlZGVudGlhbCB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxyXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgQ29kZWNJZEVycm9yLCBPcGVyYXRpb25FcnJvciB9IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgT3BlcmF0aW9uIHRyYW5zYWN0aW9uLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIE9wZXJhdGlvblR4IGV4dGVuZHMgQmFzZVR4IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJPcGVyYXRpb25UeFwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gSlZNQ29uc3RhbnRzLkxBVEVTVENPREVDXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxyXG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICA/IEpWTUNvbnN0YW50cy5PUEVSQVRJT05UWFxyXG4gICAgICA6IEpWTUNvbnN0YW50cy5PUEVSQVRJT05UWF9DT0RFQ09ORVxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgY29uc3QgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIG9wczogdGhpcy5vcHMubWFwKChvKSA9PiBvLnNlcmlhbGl6ZShlbmNvZGluZykpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMub3BzID0gZmllbGRzW1wib3BzXCJdLm1hcCgobzogb2JqZWN0KSA9PiB7XHJcbiAgICAgIGxldCBvcDogVHJhbnNmZXJhYmxlT3BlcmF0aW9uID0gbmV3IFRyYW5zZmVyYWJsZU9wZXJhdGlvbigpXHJcbiAgICAgIG9wLmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gb3BcclxuICAgIH0pXHJcbiAgICB0aGlzLm51bU9wcyA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgdGhpcy5udW1PcHMud3JpdGVVSW50MzJCRSh0aGlzLm9wcy5sZW5ndGgsIDApXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgbnVtT3BzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgb3BzOiBUcmFuc2ZlcmFibGVPcGVyYXRpb25bXSA9IFtdXHJcblxyXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBpZiAoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBDb2RlY0lkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIE9wZXJhdGlvblR4LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSURcclxuICAgIHRoaXMuX3R5cGVJRCA9XHJcbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcclxuICAgICAgICA/IEpWTUNvbnN0YW50cy5PUEVSQVRJT05UWFxyXG4gICAgICAgIDogSlZNQ29uc3RhbnRzLk9QRVJBVElPTlRYX0NPREVDT05FXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tPcGVyYXRpb25UeF1dXHJcbiAgICovXHJcbiAgZ2V0VHhUeXBlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tPcGVyYXRpb25UeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbT3BlcmF0aW9uVHhdXSBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tPcGVyYXRpb25UeF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tPcGVyYXRpb25UeF1dXHJcbiAgICpcclxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXHJcbiAgICovXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgdGhpcy5udW1PcHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIGNvbnN0IG51bU9wczogbnVtYmVyID0gdGhpcy5udW1PcHMucmVhZFVJbnQzMkJFKDApXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgbnVtT3BzOyBpKyspIHtcclxuICAgICAgY29uc3Qgb3A6IFRyYW5zZmVyYWJsZU9wZXJhdGlvbiA9IG5ldyBUcmFuc2ZlcmFibGVPcGVyYXRpb24oKVxyXG4gICAgICBvZmZzZXQgPSBvcC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICAgIHRoaXMub3BzLnB1c2gob3ApXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbT3BlcmF0aW9uVHhdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgdGhpcy5udW1PcHMud3JpdGVVSW50MzJCRSh0aGlzLm9wcy5sZW5ndGgsIDApXHJcbiAgICBsZXQgYmFycjogQnVmZmVyW10gPSBbc3VwZXIudG9CdWZmZXIoKSwgdGhpcy5udW1PcHNdXHJcbiAgICB0aGlzLm9wcyA9IHRoaXMub3BzLnNvcnQoVHJhbnNmZXJhYmxlT3BlcmF0aW9uLmNvbXBhcmF0b3IoKSlcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLm9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBiYXJyLnB1c2godGhpcy5vcHNbYCR7aX1gXS50b0J1ZmZlcigpKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycilcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVPcGVyYXRpb25dXXMgaW4gdGhpcyB0cmFuc2FjdGlvbi5cclxuICAgKi9cclxuICBnZXRPcGVyYXRpb25zKCk6IFRyYW5zZmVyYWJsZU9wZXJhdGlvbltdIHtcclxuICAgIHJldHVybiB0aGlzLm9wc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgdGhlIGJ5dGVzIG9mIGFuIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXHJcbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xyXG4gICAqL1xyXG4gIHNpZ24obXNnOiBCdWZmZXIsIGtjOiBLZXlDaGFpbik6IENyZWRlbnRpYWxbXSB7XHJcbiAgICBjb25zdCBjcmVkczogQ3JlZGVudGlhbFtdID0gc3VwZXIuc2lnbihtc2csIGtjKVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMub3BzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoXHJcbiAgICAgICAgdGhpcy5vcHNbYCR7aX1gXS5nZXRPcGVyYXRpb24oKS5nZXRDcmVkZW50aWFsSUQoKVxyXG4gICAgICApXHJcbiAgICAgIGNvbnN0IHNpZ2lkeHM6IFNpZ0lkeFtdID0gdGhpcy5vcHNbYCR7aX1gXS5nZXRPcGVyYXRpb24oKS5nZXRTaWdJZHhzKClcclxuICAgICAgZm9yIChsZXQgajogbnVtYmVyID0gMDsgaiA8IHNpZ2lkeHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICBjb25zdCBrZXlwYWlyOiBLZXlQYWlyID0ga2MuZ2V0S2V5KHNpZ2lkeHNbYCR7an1gXS5nZXRTb3VyY2UoKSlcclxuICAgICAgICBjb25zdCBzaWdudmFsOiBCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKVxyXG4gICAgICAgIGNvbnN0IHNpZzogU2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpXHJcbiAgICAgICAgc2lnLmZyb21CdWZmZXIoc2lnbnZhbClcclxuICAgICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpXHJcbiAgICAgIH1cclxuICAgICAgY3JlZHMucHVzaChjcmVkKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNyZWRzXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGNvbnN0IG5ld2Jhc2U6IE9wZXJhdGlvblR4ID0gbmV3IE9wZXJhdGlvblR4KClcclxuICAgIG5ld2Jhc2UuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXHJcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgT3BlcmF0aW9uVHgoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIE9wZXJhdGlvbiB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXHJcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXHJcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxyXG4gICAqIEBwYXJhbSBvcHMgQXJyYXkgb2YgW1tPcGVyYXRpb25dXXMgdXNlZCBpbiB0aGUgdHJhbnNhY3Rpb25cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXHJcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG9wczogVHJhbnNmZXJhYmxlT3BlcmF0aW9uW10gPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXHJcbiAgICBpZiAodHlwZW9mIG9wcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBBcnJheS5pc0FycmF5KG9wcykpIHtcclxuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICghKG9wc1tgJHtpfWBdIGluc3RhbmNlb2YgVHJhbnNmZXJhYmxlT3BlcmF0aW9uKSkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IE9wZXJhdGlvbkVycm9yKFxyXG4gICAgICAgICAgICBgRXJyb3IgLSBPcGVyYXRpb25UeC5jb25zdHJ1Y3RvcjogaW52YWxpZCBvcCBpbiBhcnJheSBwYXJhbWV0ZXIgJHtvcHN9YFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLm9wcyA9IG9wc1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=