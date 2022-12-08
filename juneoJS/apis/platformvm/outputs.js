"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECPOwnerOutput = exports.StakeableLockOut = exports.SECPTransferOutput = exports.AmountOutput = exports.ParseableOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-Outputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
const SelectOutputClass = (outputid, ...args) => {
    if (outputid == constants_1.PlatformVMConstants.SECPXFEROUTPUTID) {
        return new SECPTransferOutput(...args);
    }
    else if (outputid == constants_1.PlatformVMConstants.SECPOWNEROUTPUTID) {
        return new SECPOwnerOutput(...args);
    }
    else if (outputid == constants_1.PlatformVMConstants.STAKEABLELOCKOUTID) {
        return new StakeableLockOut(...args);
    }
    throw new errors_1.OutputIdError("Error - SelectOutputClass: unknown outputid " + outputid);
};
exports.SelectOutputClass = SelectOutputClass;
class TransferableOutput extends output_1.StandardTransferableOutput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableOutput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = (0, exports.SelectOutputClass)(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.PlatformVMConstants.ASSETIDLEN);
        offset += constants_1.PlatformVMConstants.ASSETIDLEN;
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, exports.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
}
exports.TransferableOutput = TransferableOutput;
class ParseableOutput extends output_1.StandardParseableOutput {
    constructor() {
        super(...arguments);
        this._typeName = "ParseableOutput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = (0, exports.SelectOutputClass)(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, exports.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
}
exports.ParseableOutput = ParseableOutput;
class AmountOutput extends output_1.StandardAmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return (0, exports.SelectOutputClass)(id, ...args);
    }
}
exports.AmountOutput = AmountOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPTransferOutput extends AmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferOutput";
        this._typeID = constants_1.PlatformVMConstants.SECPXFEROUTPUTID;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    create(...args) {
        return new SECPTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferOutput = SECPTransferOutput;
/**
 * An [[Output]] class which specifies an input that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
 */
class StakeableLockOut extends AmountOutput {
    /**
     * A [[Output]] class which specifies a [[ParseableOutput]] that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
     * @param transferableOutput A [[ParseableOutput]] which is embedded into this output.
     */
    constructor(amount = undefined, addresses = undefined, locktime = undefined, threshold = undefined, stakeableLocktime = undefined, transferableOutput = undefined) {
        super(amount, addresses, locktime, threshold);
        this._typeName = "StakeableLockOut";
        this._typeID = constants_1.PlatformVMConstants.STAKEABLELOCKOUTID;
        if (typeof stakeableLocktime !== "undefined") {
            this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8);
        }
        if (typeof transferableOutput !== "undefined") {
            this.transferableOutput = transferableOutput;
            this.synchronize();
        }
    }
    //serialize and deserialize both are inherited
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let outobj = Object.assign(Object.assign({}, fields), { stakeableLocktime: serialization.encoder(this.stakeableLocktime, encoding, "Buffer", "decimalString", 8), transferableOutput: this.transferableOutput.serialize(encoding) });
        delete outobj["addresses"];
        delete outobj["locktime"];
        delete outobj["threshold"];
        delete outobj["amount"];
        return outobj;
    }
    deserialize(fields, encoding = "hex") {
        fields["addresses"] = [];
        fields["locktime"] = "0";
        fields["threshold"] = "1";
        fields["amount"] = "99";
        super.deserialize(fields, encoding);
        this.stakeableLocktime = serialization.decoder(fields["stakeableLocktime"], encoding, "decimalString", "Buffer", 8);
        this.transferableOutput = new ParseableOutput();
        this.transferableOutput.deserialize(fields["transferableOutput"], encoding);
        this.synchronize();
    }
    //call this every time you load in data
    synchronize() {
        let output = this.transferableOutput.getOutput();
        this.addresses = output.getAddresses().map((a) => {
            let addr = new output_1.Address();
            addr.fromBuffer(a);
            return addr;
        });
        this.numaddrs = buffer_1.Buffer.alloc(4);
        this.numaddrs.writeUInt32BE(this.addresses.length, 0);
        this.locktime = bintools.fromBNToBuffer(output.getLocktime(), 8);
        this.threshold = buffer_1.Buffer.alloc(4);
        this.threshold.writeUInt32BE(output.getThreshold(), 0);
        this.amount = bintools.fromBNToBuffer(output.getAmount(), 8);
        this.amountValue = output.getAmount();
    }
    getStakeableLocktime() {
        return bintools.fromBufferToBN(this.stakeableLocktime);
    }
    getTransferableOutput() {
        return this.transferableOutput;
    }
    /**
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return (0, exports.SelectOutputClass)(id, ...args);
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StakeableLockOut]] and returns the size of the output.
     */
    fromBuffer(outbuff, offset = 0) {
        this.stakeableLocktime = bintools.copyFrom(outbuff, offset, offset + 8);
        offset += 8;
        this.transferableOutput = new ParseableOutput();
        offset = this.transferableOutput.fromBuffer(outbuff, offset);
        this.synchronize();
        return offset;
    }
    /**
     * Returns the buffer representing the [[StakeableLockOut]] instance.
     */
    toBuffer() {
        let xferoutBuff = this.transferableOutput.toBuffer();
        const bsize = this.stakeableLocktime.length + xferoutBuff.length;
        const barr = [this.stakeableLocktime, xferoutBuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    create(...args) {
        return new StakeableLockOut(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.StakeableLockOut = StakeableLockOut;
/**
 * An [[Output]] class which only specifies an Output ownership and uses secp256k1 signature scheme.
 */
class SECPOwnerOutput extends output_1.Output {
    constructor() {
        super(...arguments);
        this._typeName = "SECPOwnerOutput";
        this._typeID = constants_1.PlatformVMConstants.SECPOWNEROUTPUTID;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    create(...args) {
        return new SECPOwnerOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    select(id, ...args) {
        return (0, exports.SelectOutputClass)(id, ...args);
    }
}
exports.SECPOwnerOutput = SECPOwnerOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vb3V0cHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUFpRDtBQUNqRCxnREFNNEI7QUFDNUIsNkRBQTZFO0FBRTdFLCtDQUFrRDtBQUVsRCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNJLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEdBQUcsSUFBVyxFQUFVLEVBQUU7SUFDNUUsSUFBSSxRQUFRLElBQUksK0JBQW1CLENBQUMsZ0JBQWdCLEVBQUU7UUFDcEQsT0FBTyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDdkM7U0FBTSxJQUFJLFFBQVEsSUFBSSwrQkFBbUIsQ0FBQyxpQkFBaUIsRUFBRTtRQUM1RCxPQUFPLElBQUksZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDcEM7U0FBTSxJQUFJLFFBQVEsSUFBSSwrQkFBbUIsQ0FBQyxrQkFBa0IsRUFBRTtRQUM3RCxPQUFPLElBQUksZ0JBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNyQztJQUNELE1BQU0sSUFBSSxzQkFBYSxDQUNyQiw4Q0FBOEMsR0FBRyxRQUFRLENBQzFELENBQUE7QUFDSCxDQUFDLENBQUE7QUFYWSxRQUFBLGlCQUFpQixxQkFXN0I7QUFFRCxNQUFhLGtCQUFtQixTQUFRLG1DQUEwQjtJQUFsRTs7UUFDWSxjQUFTLEdBQUcsb0JBQW9CLENBQUE7UUFDaEMsWUFBTyxHQUFHLFNBQVMsQ0FBQTtJQXdCL0IsQ0FBQztJQXRCQyx3QkFBd0I7SUFFeEIs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QVEsRUFBRSxDQUFDLENBQUE7UUFDbEMsT0FBTyxNQUFjLENBQUE7SUFDdkIsQ0FBQztJQUVELE1BQU0sQ0FBQyxFQUFVLEVBQUUsR0FBRyxJQUFXO1FBQy9CLE9BQU8sSUFBQSx5QkFBaUIsRUFBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtJQUN2QyxDQUFDO0NBQ0Y7QUFsQ0QsMENBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNLU91dHB1dHNcclxuICovXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQge1xyXG4gIE91dHB1dCxcclxuICBTdGFuZGFyZEFtb3VudE91dHB1dCxcclxuICBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dCxcclxuICBTdGFuZGFyZFBhcnNlYWJsZU91dHB1dCxcclxuICBBZGRyZXNzXHJcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxyXG5pbXBvcnQgeyBPdXRwdXRJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIE91dHB1dCBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIG91dHB1dGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgaW5wdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxyXG4gKlxyXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW091dHB1dF1dLWV4dGVuZGVkIGNsYXNzLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFNlbGVjdE91dHB1dENsYXNzID0gKG91dHB1dGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogT3V0cHV0ID0+IHtcclxuICBpZiAob3V0cHV0aWQgPT0gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEKSB7XHJcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCguLi5hcmdzKVxyXG4gIH0gZWxzZSBpZiAob3V0cHV0aWQgPT0gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQT1dORVJPVVRQVVRJRCkge1xyXG4gICAgcmV0dXJuIG5ldyBTRUNQT3duZXJPdXRwdXQoLi4uYXJncylcclxuICB9IGVsc2UgaWYgKG91dHB1dGlkID09IFBsYXRmb3JtVk1Db25zdGFudHMuU1RBS0VBQkxFTE9DS09VVElEKSB7XHJcbiAgICByZXR1cm4gbmV3IFN0YWtlYWJsZUxvY2tPdXQoLi4uYXJncylcclxuICB9XHJcbiAgdGhyb3cgbmV3IE91dHB1dElkRXJyb3IoXHJcbiAgICBcIkVycm9yIC0gU2VsZWN0T3V0cHV0Q2xhc3M6IHVua25vd24gb3V0cHV0aWQgXCIgKyBvdXRwdXRpZFxyXG4gIClcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRyYW5zZmVyYWJsZU91dHB1dCBleHRlbmRzIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUcmFuc2ZlcmFibGVPdXRwdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pXHJcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oXHJcbiAgICAgIGJ5dGVzLFxyXG4gICAgICBvZmZzZXQsXHJcbiAgICAgIG9mZnNldCArIFBsYXRmb3JtVk1Db25zdGFudHMuQVNTRVRJRExFTlxyXG4gICAgKVxyXG4gICAgb2Zmc2V0ICs9IFBsYXRmb3JtVk1Db25zdGFudHMuQVNTRVRJRExFTlxyXG4gICAgY29uc3Qgb3V0cHV0aWQ6IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICAucmVhZFVJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRwdXRpZClcclxuICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFyc2VhYmxlT3V0cHV0IGV4dGVuZHMgU3RhbmRhcmRQYXJzZWFibGVPdXRwdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlBhcnNlYWJsZU91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoZmllbGRzW1wib3V0cHV0XCJdW1wiX3R5cGVJRFwiXSlcclxuICAgIHRoaXMub3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcIm91dHB1dFwiXSwgZW5jb2RpbmcpXHJcbiAgfVxyXG5cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICBjb25zdCBvdXRwdXRpZDogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKVxyXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBbW91bnRPdXRwdXQgZXh0ZW5kcyBTdGFuZGFyZEFtb3VudE91dHB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQW1vdW50T3V0cHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBhc3NldElEIEFuIGFzc2V0SUQgd2hpY2ggaXMgd3JhcHBlZCBhcm91bmQgdGhlIEJ1ZmZlciBvZiB0aGUgT3V0cHV0XHJcbiAgICovXHJcbiAgbWFrZVRyYW5zZmVyYWJsZShhc3NldElEOiBCdWZmZXIpOiBUcmFuc2ZlcmFibGVPdXRwdXQge1xyXG4gICAgcmV0dXJuIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgdGhpcylcclxuICB9XHJcblxyXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IE91dHB1dCB7XHJcbiAgICByZXR1cm4gU2VsZWN0T3V0cHV0Q2xhc3MoaWQsIC4uLmFyZ3MpXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gT3V0cHV0IHRoYXQgY2FycmllcyBhbiBhbW1vdW50IGZvciBhbiBhc3NldElEIGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFNFQ1BUcmFuc2Zlck91dHB1dCBleHRlbmRzIEFtb3VudE91dHB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUFRyYW5zZmVyT3V0cHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxyXG4gICAqL1xyXG4gIGdldE91dHB1dElEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgbmV3b3V0OiBTRUNQVHJhbnNmZXJPdXRwdXQgPSB0aGlzLmNyZWF0ZSgpXHJcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXHJcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBpbnB1dCB0aGF0IGhhcyBhIGxvY2t0aW1lIHdoaWNoIGNhbiBhbHNvIGVuYWJsZSBzdGFraW5nIG9mIHRoZSB2YWx1ZSBoZWxkLCBwcmV2ZW50aW5nIHRyYW5zZmVycyBidXQgbm90IHZhbGlkYXRpb24uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3Rha2VhYmxlTG9ja091dCBleHRlbmRzIEFtb3VudE91dHB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3Rha2VhYmxlTG9ja091dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNUQUtFQUJMRUxPQ0tPVVRJRFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICBsZXQgb3V0b2JqOiBvYmplY3QgPSB7XHJcbiAgICAgIC4uLmZpZWxkcywgLy9pbmNsdWRlZCBhbnl3YXl5eXkuLi4gbm90IGlkZWFsXHJcbiAgICAgIHN0YWtlYWJsZUxvY2t0aW1lOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5zdGFrZWFibGVMb2NrdGltZSxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxyXG4gICAgICAgIDhcclxuICAgICAgKSxcclxuICAgICAgdHJhbnNmZXJhYmxlT3V0cHV0OiB0aGlzLnRyYW5zZmVyYWJsZU91dHB1dC5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICB9XHJcbiAgICBkZWxldGUgb3V0b2JqW1wiYWRkcmVzc2VzXCJdXHJcbiAgICBkZWxldGUgb3V0b2JqW1wibG9ja3RpbWVcIl1cclxuICAgIGRlbGV0ZSBvdXRvYmpbXCJ0aHJlc2hvbGRcIl1cclxuICAgIGRlbGV0ZSBvdXRvYmpbXCJhbW91bnRcIl1cclxuICAgIHJldHVybiBvdXRvYmpcclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBmaWVsZHNbXCJhZGRyZXNzZXNcIl0gPSBbXVxyXG4gICAgZmllbGRzW1wibG9ja3RpbWVcIl0gPSBcIjBcIlxyXG4gICAgZmllbGRzW1widGhyZXNob2xkXCJdID0gXCIxXCJcclxuICAgIGZpZWxkc1tcImFtb3VudFwiXSA9IFwiOTlcIlxyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcInN0YWtlYWJsZUxvY2t0aW1lXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDhcclxuICAgIClcclxuICAgIHRoaXMudHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFBhcnNlYWJsZU91dHB1dCgpXHJcbiAgICB0aGlzLnRyYW5zZmVyYWJsZU91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJ0cmFuc2ZlcmFibGVPdXRwdXRcIl0sIGVuY29kaW5nKVxyXG4gICAgdGhpcy5zeW5jaHJvbml6ZSgpXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3Rha2VhYmxlTG9ja3RpbWU6IEJ1ZmZlclxyXG4gIHByb3RlY3RlZCB0cmFuc2ZlcmFibGVPdXRwdXQ6IFBhcnNlYWJsZU91dHB1dFxyXG5cclxuICAvL2NhbGwgdGhpcyBldmVyeSB0aW1lIHlvdSBsb2FkIGluIGRhdGFcclxuICBwcml2YXRlIHN5bmNocm9uaXplKCkge1xyXG4gICAgbGV0IG91dHB1dDogQW1vdW50T3V0cHV0ID1cclxuICAgICAgdGhpcy50cmFuc2ZlcmFibGVPdXRwdXQuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0XHJcbiAgICB0aGlzLmFkZHJlc3NlcyA9IG91dHB1dC5nZXRBZGRyZXNzZXMoKS5tYXAoKGEpID0+IHtcclxuICAgICAgbGV0IGFkZHI6IEFkZHJlc3MgPSBuZXcgQWRkcmVzcygpXHJcbiAgICAgIGFkZHIuZnJvbUJ1ZmZlcihhKVxyXG4gICAgICByZXR1cm4gYWRkclxyXG4gICAgfSlcclxuICAgIHRoaXMubnVtYWRkcnMgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIHRoaXMubnVtYWRkcnMud3JpdGVVSW50MzJCRSh0aGlzLmFkZHJlc3Nlcy5sZW5ndGgsIDApXHJcbiAgICB0aGlzLmxvY2t0aW1lID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIob3V0cHV0LmdldExvY2t0aW1lKCksIDgpXHJcbiAgICB0aGlzLnRocmVzaG9sZCA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgdGhpcy50aHJlc2hvbGQud3JpdGVVSW50MzJCRShvdXRwdXQuZ2V0VGhyZXNob2xkKCksIDApXHJcbiAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG91dHB1dC5nZXRBbW91bnQoKSwgOClcclxuICAgIHRoaXMuYW1vdW50VmFsdWUgPSBvdXRwdXQuZ2V0QW1vdW50KClcclxuICB9XHJcblxyXG4gIGdldFN0YWtlYWJsZUxvY2t0aW1lKCk6IEJOIHtcclxuICAgIHJldHVybiBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLnN0YWtlYWJsZUxvY2t0aW1lKVxyXG4gIH1cclxuXHJcbiAgZ2V0VHJhbnNmZXJhYmxlT3V0cHV0KCk6IFBhcnNlYWJsZU91dHB1dCB7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlcmFibGVPdXRwdXRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBhc3NldElEIEFuIGFzc2V0SUQgd2hpY2ggaXMgd3JhcHBlZCBhcm91bmQgdGhlIEJ1ZmZlciBvZiB0aGUgT3V0cHV0XHJcbiAgICovXHJcbiAgbWFrZVRyYW5zZmVyYWJsZShhc3NldElEOiBCdWZmZXIpOiBUcmFuc2ZlcmFibGVPdXRwdXQge1xyXG4gICAgcmV0dXJuIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgdGhpcylcclxuICB9XHJcblxyXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IE91dHB1dCB7XHJcbiAgICByZXR1cm4gU2VsZWN0T3V0cHV0Q2xhc3MoaWQsIC4uLmFyZ3MpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tTdGFrZWFibGVMb2NrT3V0XV0gYW5kIHJldHVybnMgdGhlIHNpemUgb2YgdGhlIG91dHB1dC5cclxuICAgKi9cclxuICBmcm9tQnVmZmVyKG91dGJ1ZmY6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUgPSBiaW50b29scy5jb3B5RnJvbShvdXRidWZmLCBvZmZzZXQsIG9mZnNldCArIDgpXHJcbiAgICBvZmZzZXQgKz0gOFxyXG4gICAgdGhpcy50cmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgUGFyc2VhYmxlT3V0cHV0KClcclxuICAgIG9mZnNldCA9IHRoaXMudHJhbnNmZXJhYmxlT3V0cHV0LmZyb21CdWZmZXIob3V0YnVmZiwgb2Zmc2V0KVxyXG4gICAgdGhpcy5zeW5jaHJvbml6ZSgpXHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW1N0YWtlYWJsZUxvY2tPdXRdXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgbGV0IHhmZXJvdXRCdWZmOiBCdWZmZXIgPSB0aGlzLnRyYW5zZmVyYWJsZU91dHB1dC50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID0gdGhpcy5zdGFrZWFibGVMb2NrdGltZS5sZW5ndGggKyB4ZmVyb3V0QnVmZi5sZW5ndGhcclxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuc3Rha2VhYmxlTG9ja3RpbWUsIHhmZXJvdXRCdWZmXVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRJRCBmb3IgdGhpcyBvdXRwdXRcclxuICAgKi9cclxuICBnZXRPdXRwdXRJRCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IFN0YWtlYWJsZUxvY2tPdXQoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdvdXQ6IFN0YWtlYWJsZUxvY2tPdXQgPSB0aGlzLmNyZWF0ZSgpXHJcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXHJcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYSBbW1BhcnNlYWJsZU91dHB1dF1dIHRoYXQgaGFzIGEgbG9ja3RpbWUgd2hpY2ggY2FuIGFsc28gZW5hYmxlIHN0YWtpbmcgb2YgdGhlIHZhbHVlIGhlbGQsIHByZXZlbnRpbmcgdHJhbnNmZXJzIGJ1dCBub3QgdmFsaWRhdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGFtb3VudCBpbiB0aGUgb3V0cHV0XHJcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgcmVwcmVzZW50aW5nIGFkZHJlc3Nlc1xyXG4gICAqIEBwYXJhbSBsb2NrdGltZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgbG9ja3RpbWVcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgdGhlIHRocmVzaG9sZCBudW1iZXIgb2Ygc2lnbmVycyByZXF1aXJlZCB0byBzaWduIHRoZSB0cmFuc2FjdGlvblxyXG4gICAqIEBwYXJhbSBzdGFrZWFibGVMb2NrdGltZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgc3Rha2VhYmxlIGxvY2t0aW1lXHJcbiAgICogQHBhcmFtIHRyYW5zZmVyYWJsZU91dHB1dCBBIFtbUGFyc2VhYmxlT3V0cHV0XV0gd2hpY2ggaXMgZW1iZWRkZWQgaW50byB0aGlzIG91dHB1dC5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGFtb3VudDogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBhZGRyZXNzZXM6IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxyXG4gICAgbG9ja3RpbWU6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSB1bmRlZmluZWQsXHJcbiAgICBzdGFrZWFibGVMb2NrdGltZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICB0cmFuc2ZlcmFibGVPdXRwdXQ6IFBhcnNlYWJsZU91dHB1dCA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoYW1vdW50LCBhZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpXHJcbiAgICBpZiAodHlwZW9mIHN0YWtlYWJsZUxvY2t0aW1lICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihzdGFrZWFibGVMb2NrdGltZSwgOClcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdHJhbnNmZXJhYmxlT3V0cHV0ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMudHJhbnNmZXJhYmxlT3V0cHV0ID0gdHJhbnNmZXJhYmxlT3V0cHV0XHJcbiAgICAgIHRoaXMuc3luY2hyb25pemUoKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggb25seSBzcGVjaWZpZXMgYW4gT3V0cHV0IG93bmVyc2hpcCBhbmQgdXNlcyBzZWNwMjU2azEgc2lnbmF0dXJlIHNjaGVtZS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTRUNQT3duZXJPdXRwdXQgZXh0ZW5kcyBPdXRwdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BPd25lck91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BPV05FUk9VVFBVVElEXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgb3V0cHV0SUQgZm9yIHRoaXMgb3V0cHV0XHJcbiAgICovXHJcbiAgZ2V0T3V0cHV0SUQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl90eXBlSURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFzc2V0SUQgQW4gYXNzZXRJRCB3aGljaCBpcyB3cmFwcGVkIGFyb3VuZCB0aGUgQnVmZmVyIG9mIHRoZSBPdXRwdXRcclxuICAgKi9cclxuICBtYWtlVHJhbnNmZXJhYmxlKGFzc2V0SUQ6IEJ1ZmZlcik6IFRyYW5zZmVyYWJsZU91dHB1dCB7XHJcbiAgICByZXR1cm4gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCB0aGlzKVxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IFNFQ1BPd25lck91dHB1dCguLi5hcmdzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGNvbnN0IG5ld291dDogU0VDUE93bmVyT3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxyXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBPdXRwdXQge1xyXG4gICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKVxyXG4gIH1cclxufVxyXG4iXX0=