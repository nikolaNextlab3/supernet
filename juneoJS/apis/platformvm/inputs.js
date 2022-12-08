"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakeableLockIn = exports.SECPTransferInput = exports.AmountInput = exports.TransferableInput = exports.ParseableInput = exports.SelectInputClass = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-Inputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const input_1 = require("../../common/input");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
const SelectInputClass = (inputid, ...args) => {
    if (inputid === constants_1.PlatformVMConstants.SECPINPUTID) {
        return new SECPTransferInput(...args);
    }
    else if (inputid === constants_1.PlatformVMConstants.STAKEABLELOCKINID) {
        return new StakeableLockIn(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.InputIdError("Error - SelectInputClass: unknown inputid");
};
exports.SelectInputClass = SelectInputClass;
class ParseableInput extends input_1.StandardParseableInput {
    constructor() {
        super(...arguments);
        this._typeName = "ParseableInput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.input = (0, exports.SelectInputClass)(fields["input"]["_typeID"]);
        this.input.deserialize(fields["input"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        const inputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.input = (0, exports.SelectInputClass)(inputid);
        return this.input.fromBuffer(bytes, offset);
    }
}
exports.ParseableInput = ParseableInput;
class TransferableInput extends input_1.StandardTransferableInput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableInput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.input = (0, exports.SelectInputClass)(fields["input"]["_typeID"]);
        this.input.deserialize(fields["input"], encoding);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[TransferableInput]], parses it, populates the class, and returns the length of the [[TransferableInput]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TransferableInput]]
     *
     * @returns The length of the raw [[TransferableInput]]
     */
    fromBuffer(bytes, offset = 0) {
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.PlatformVMConstants.ASSETIDLEN);
        offset += 32;
        const inputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.input = (0, exports.SelectInputClass)(inputid);
        return this.input.fromBuffer(bytes, offset);
    }
}
exports.TransferableInput = TransferableInput;
class AmountInput extends input_1.StandardAmountInput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountInput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    select(id, ...args) {
        return (0, exports.SelectInputClass)(id, ...args);
    }
}
exports.AmountInput = AmountInput;
class SECPTransferInput extends AmountInput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferInput";
        this._typeID = constants_1.PlatformVMConstants.SECPINPUTID;
        this.getCredentialID = () => constants_1.PlatformVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
    }
    create(...args) {
        return new SECPTransferInput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferInput = SECPTransferInput;
/**
 * An [[Input]] class which specifies an input that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
 */
class StakeableLockIn extends AmountInput {
    /**
     * A [[Output]] class which specifies an [[Input]] that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
     * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
     * @param transferableInput A [[ParseableInput]] which is embedded into this input.
     */
    constructor(amount = undefined, stakeableLocktime = undefined, transferableInput = undefined) {
        super(amount);
        this._typeName = "StakeableLockIn";
        this._typeID = constants_1.PlatformVMConstants.STAKEABLELOCKINID;
        this.getCredentialID = () => constants_1.PlatformVMConstants.SECPCREDENTIAL;
        if (typeof stakeableLocktime !== "undefined") {
            this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8);
        }
        if (typeof transferableInput !== "undefined") {
            this.transferableInput = transferableInput;
            this.synchronize();
        }
    }
    //serialize and deserialize both are inherited
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let outobj = Object.assign(Object.assign({}, fields), { stakeableLocktime: serialization.encoder(this.stakeableLocktime, encoding, "Buffer", "decimalString", 8), transferableInput: this.transferableInput.serialize(encoding) });
        delete outobj["sigIdxs"];
        delete outobj["sigCount"];
        delete outobj["amount"];
        return outobj;
    }
    deserialize(fields, encoding = "hex") {
        fields["sigIdxs"] = [];
        fields["sigCount"] = "0";
        fields["amount"] = "98";
        super.deserialize(fields, encoding);
        this.stakeableLocktime = serialization.decoder(fields["stakeableLocktime"], encoding, "decimalString", "Buffer", 8);
        this.transferableInput = new ParseableInput();
        this.transferableInput.deserialize(fields["transferableInput"], encoding);
        this.synchronize();
    }
    synchronize() {
        let input = this.transferableInput.getInput();
        this.sigIdxs = input.getSigIdxs();
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        this.amount = bintools.fromBNToBuffer(input.getAmount(), 8);
        this.amountValue = input.getAmount();
    }
    getStakeableLocktime() {
        return bintools.fromBufferToBN(this.stakeableLocktime);
    }
    getTransferablInput() {
        return this.transferableInput;
    }
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StakeableLockIn]] and returns the size of the output.
     */
    fromBuffer(bytes, offset = 0) {
        this.stakeableLocktime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.transferableInput = new ParseableInput();
        offset = this.transferableInput.fromBuffer(bytes, offset);
        this.synchronize();
        return offset;
    }
    /**
     * Returns the buffer representing the [[StakeableLockIn]] instance.
     */
    toBuffer() {
        const xferinBuff = this.transferableInput.toBuffer();
        const bsize = this.stakeableLocktime.length + xferinBuff.length;
        const barr = [this.stakeableLocktime, xferinBuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new StakeableLockIn(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    select(id, ...args) {
        return (0, exports.SelectInputClass)(id, ...args);
    }
}
exports.StakeableLockIn = StakeableLockIn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9pbnB1dHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBaUQ7QUFDakQsOENBSzJCO0FBQzNCLDZEQUE2RTtBQUU3RSwrQ0FBaUQ7QUFFakQ7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNJLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxPQUFlLEVBQUUsR0FBRyxJQUFXLEVBQVMsRUFBRTtJQUN6RSxJQUFJLE9BQU8sS0FBSywrQkFBbUIsQ0FBQyxXQUFXLEVBQUU7UUFDL0MsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDdEM7U0FBTSxJQUFJLE9BQU8sS0FBSywrQkFBbUIsQ0FBQyxpQkFBaUIsRUFBRTtRQUM1RCxPQUFPLElBQUksZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDcEM7SUFDRCwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQUMsMkNBQTJDLENBQUMsQ0FBQTtBQUNyRSxDQUFDLENBQUE7QUFSWSxRQUFBLGdCQUFnQixvQkFRNUI7QUFFRCxNQUFhLGNBQWUsU0FBUSw4QkFBc0I7SUFBMUQ7O1FBQ1ksY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRyxTQUFTLENBQUE7SUFrQi9CLENBQUM7SUFoQkMsd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJ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Q0FBQTtRQUNYLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFBO1FBQzdDLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUN6RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDbEIsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQzVELE1BQU0sS0FBSyxHQUFXLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQTtRQUN2RSxNQUFNLElBQUksR0FBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLENBQUMsQ0FBQTtRQUMzRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25DLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxlQUFlLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQTtJQUM3QyxDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sTUFBTSxHQUFvQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDN0MsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNsQyxPQUFPLE1BQWMsQ0FBQTtJQUN2QixDQUFDO0lBRUQsTUFBTSxDQUFDLEVBQVUsRUFBRSxHQUFHLElBQVc7UUFDL0IsT0FBTyxJQUFBLHdCQUFnQixFQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQ3RDLENBQUM7Q0F1QkY7QUE5SEQsMENBOEhDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNLUlucHV0c1xyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgSW5wdXQsXHJcbiAgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCxcclxuICBTdGFuZGFyZEFtb3VudElucHV0LFxyXG4gIFN0YW5kYXJkUGFyc2VhYmxlSW5wdXRcclxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2lucHV0XCJcclxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHsgSW5wdXRJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0lucHV0XV0gaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSBpbnB1dGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgaW5wdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxyXG4gKlxyXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW0lucHV0XV0tZXh0ZW5kZWQgY2xhc3MuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgU2VsZWN0SW5wdXRDbGFzcyA9IChpbnB1dGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogSW5wdXQgPT4ge1xyXG4gIGlmIChpbnB1dGlkID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEKSB7XHJcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KC4uLmFyZ3MpXHJcbiAgfSBlbHNlIGlmIChpbnB1dGlkID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNUQUtFQUJMRUxPQ0tJTklEKSB7XHJcbiAgICByZXR1cm4gbmV3IFN0YWtlYWJsZUxvY2tJbiguLi5hcmdzKVxyXG4gIH1cclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIHRocm93IG5ldyBJbnB1dElkRXJyb3IoXCJFcnJvciAtIFNlbGVjdElucHV0Q2xhc3M6IHVua25vd24gaW5wdXRpZFwiKVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFyc2VhYmxlSW5wdXQgZXh0ZW5kcyBTdGFuZGFyZFBhcnNlYWJsZUlucHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJQYXJzZWFibGVJbnB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuaW5wdXQgPSBTZWxlY3RJbnB1dENsYXNzKGZpZWxkc1tcImlucHV0XCJdW1wiX3R5cGVJRFwiXSlcclxuICAgIHRoaXMuaW5wdXQuZGVzZXJpYWxpemUoZmllbGRzW1wiaW5wdXRcIl0sIGVuY29kaW5nKVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgY29uc3QgaW5wdXRpZDogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLmlucHV0ID0gU2VsZWN0SW5wdXRDbGFzcyhpbnB1dGlkKVxyXG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRyYW5zZmVyYWJsZUlucHV0IGV4dGVuZHMgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlSW5wdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLmlucHV0ID0gU2VsZWN0SW5wdXRDbGFzcyhmaWVsZHNbXCJpbnB1dFwiXVtcIl90eXBlSURcIl0pXHJcbiAgICB0aGlzLmlucHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcImlucHV0XCJdLCBlbmNvZGluZylcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIFtbVHJhbnNmZXJhYmxlSW5wdXRdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV0gaW4gYnl0ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbVHJhbnNmZXJhYmxlSW5wdXRdXVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVHJhbnNmZXJhYmxlSW5wdXRdXVxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMudHhpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICB0aGlzLm91dHB1dGlkeCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oXHJcbiAgICAgIGJ5dGVzLFxyXG4gICAgICBvZmZzZXQsXHJcbiAgICAgIG9mZnNldCArIFBsYXRmb3JtVk1Db25zdGFudHMuQVNTRVRJRExFTlxyXG4gICAgKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICBjb25zdCBpbnB1dGlkOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMuaW5wdXQgPSBTZWxlY3RJbnB1dENsYXNzKGlucHV0aWQpXHJcbiAgICByZXR1cm4gdGhpcy5pbnB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQW1vdW50SW5wdXQgZXh0ZW5kcyBTdGFuZGFyZEFtb3VudElucHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRJbnB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBJbnB1dCB7XHJcbiAgICByZXR1cm4gU2VsZWN0SW5wdXRDbGFzcyhpZCwgLi4uYXJncylcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTRUNQVHJhbnNmZXJJbnB1dCBleHRlbmRzIEFtb3VudElucHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQVHJhbnNmZXJJbnB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaW5wdXRJRCBmb3IgdGhpcyBpbnB1dFxyXG4gICAqL1xyXG4gIGdldElucHV0SUQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl90eXBlSURcclxuICB9XHJcblxyXG4gIGdldENyZWRlbnRpYWxJRCA9ICgpOiBudW1iZXIgPT4gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVySW5wdXQoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdvdXQ6IFNFQ1BUcmFuc2ZlcklucHV0ID0gdGhpcy5jcmVhdGUoKVxyXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQW4gW1tJbnB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBpbnB1dCB0aGF0IGhhcyBhIGxvY2t0aW1lIHdoaWNoIGNhbiBhbHNvIGVuYWJsZSBzdGFraW5nIG9mIHRoZSB2YWx1ZSBoZWxkLCBwcmV2ZW50aW5nIHRyYW5zZmVycyBidXQgbm90IHZhbGlkYXRpb24uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3Rha2VhYmxlTG9ja0luIGV4dGVuZHMgQW1vdW50SW5wdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YWtlYWJsZUxvY2tJblwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNUQUtFQUJMRUxPQ0tJTklEXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIGxldCBvdXRvYmo6IG9iamVjdCA9IHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBzdGFrZWFibGVMb2NrdGltZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgICA4XHJcbiAgICAgICksXHJcbiAgICAgIHRyYW5zZmVyYWJsZUlucHV0OiB0aGlzLnRyYW5zZmVyYWJsZUlucHV0LnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIH1cclxuICAgIGRlbGV0ZSBvdXRvYmpbXCJzaWdJZHhzXCJdXHJcbiAgICBkZWxldGUgb3V0b2JqW1wic2lnQ291bnRcIl1cclxuICAgIGRlbGV0ZSBvdXRvYmpbXCJhbW91bnRcIl1cclxuICAgIHJldHVybiBvdXRvYmpcclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBmaWVsZHNbXCJzaWdJZHhzXCJdID0gW11cclxuICAgIGZpZWxkc1tcInNpZ0NvdW50XCJdID0gXCIwXCJcclxuICAgIGZpZWxkc1tcImFtb3VudFwiXSA9IFwiOThcIlxyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcInN0YWtlYWJsZUxvY2t0aW1lXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDhcclxuICAgIClcclxuICAgIHRoaXMudHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgUGFyc2VhYmxlSW5wdXQoKVxyXG4gICAgdGhpcy50cmFuc2ZlcmFibGVJbnB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJ0cmFuc2ZlcmFibGVJbnB1dFwiXSwgZW5jb2RpbmcpXHJcbiAgICB0aGlzLnN5bmNocm9uaXplKClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBzdGFrZWFibGVMb2NrdGltZTogQnVmZmVyXHJcbiAgcHJvdGVjdGVkIHRyYW5zZmVyYWJsZUlucHV0OiBQYXJzZWFibGVJbnB1dFxyXG5cclxuICBwcml2YXRlIHN5bmNocm9uaXplKCkge1xyXG4gICAgbGV0IGlucHV0OiBBbW91bnRJbnB1dCA9IHRoaXMudHJhbnNmZXJhYmxlSW5wdXQuZ2V0SW5wdXQoKSBhcyBBbW91bnRJbnB1dFxyXG4gICAgdGhpcy5zaWdJZHhzID0gaW5wdXQuZ2V0U2lnSWR4cygpXHJcbiAgICB0aGlzLnNpZ0NvdW50ID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcclxuICAgIHRoaXMuYW1vdW50ID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIoaW5wdXQuZ2V0QW1vdW50KCksIDgpXHJcbiAgICB0aGlzLmFtb3VudFZhbHVlID0gaW5wdXQuZ2V0QW1vdW50KClcclxuICB9XHJcblxyXG4gIGdldFN0YWtlYWJsZUxvY2t0aW1lKCk6IEJOIHtcclxuICAgIHJldHVybiBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLnN0YWtlYWJsZUxvY2t0aW1lKVxyXG4gIH1cclxuXHJcbiAgZ2V0VHJhbnNmZXJhYmxJbnB1dCgpOiBQYXJzZWFibGVJbnB1dCB7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlcmFibGVJbnB1dFxyXG4gIH1cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpbnB1dElEIGZvciB0aGlzIGlucHV0XHJcbiAgICovXHJcbiAgZ2V0SW5wdXRJRCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgZ2V0Q3JlZGVudGlhbElEID0gKCk6IG51bWJlciA9PiBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMXHJcblxyXG4gIC8qKlxyXG4gICAqIFBvcHVhdGVzIHRoZSBpbnN0YW5jZSBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBbW1N0YWtlYWJsZUxvY2tJbl1dIGFuZCByZXR1cm5zIHRoZSBzaXplIG9mIHRoZSBvdXRwdXQuXHJcbiAgICovXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5zdGFrZWFibGVMb2NrdGltZSA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXHJcbiAgICBvZmZzZXQgKz0gOFxyXG4gICAgdGhpcy50cmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBQYXJzZWFibGVJbnB1dCgpXHJcbiAgICBvZmZzZXQgPSB0aGlzLnRyYW5zZmVyYWJsZUlucHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgIHRoaXMuc3luY2hyb25pemUoKVxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tTdGFrZWFibGVMb2NrSW5dXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgeGZlcmluQnVmZjogQnVmZmVyID0gdGhpcy50cmFuc2ZlcmFibGVJbnB1dC50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID0gdGhpcy5zdGFrZWFibGVMb2NrdGltZS5sZW5ndGggKyB4ZmVyaW5CdWZmLmxlbmd0aFxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5zdGFrZWFibGVMb2NrdGltZSwgeGZlcmluQnVmZl1cclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IFN0YWtlYWJsZUxvY2tJbiguLi5hcmdzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGNvbnN0IG5ld291dDogU3Rha2VhYmxlTG9ja0luID0gdGhpcy5jcmVhdGUoKVxyXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBJbnB1dCB7XHJcbiAgICByZXR1cm4gU2VsZWN0SW5wdXRDbGFzcyhpZCwgLi4uYXJncylcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gW1tJbnB1dF1dIHRoYXQgaGFzIGEgbG9ja3RpbWUgd2hpY2ggY2FuIGFsc28gZW5hYmxlIHN0YWtpbmcgb2YgdGhlIHZhbHVlIGhlbGQsIHByZXZlbnRpbmcgdHJhbnNmZXJzIGJ1dCBub3QgdmFsaWRhdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGFtb3VudCBpbiB0aGUgaW5wdXRcclxuICAgKiBAcGFyYW0gc3Rha2VhYmxlTG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIHN0YWtlYWJsZSBsb2NrdGltZVxyXG4gICAqIEBwYXJhbSB0cmFuc2ZlcmFibGVJbnB1dCBBIFtbUGFyc2VhYmxlSW5wdXRdXSB3aGljaCBpcyBlbWJlZGRlZCBpbnRvIHRoaXMgaW5wdXQuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBhbW91bnQ6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgc3Rha2VhYmxlTG9ja3RpbWU6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgdHJhbnNmZXJhYmxlSW5wdXQ6IFBhcnNlYWJsZUlucHV0ID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcihhbW91bnQpXHJcbiAgICBpZiAodHlwZW9mIHN0YWtlYWJsZUxvY2t0aW1lICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihzdGFrZWFibGVMb2NrdGltZSwgOClcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdHJhbnNmZXJhYmxlSW5wdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy50cmFuc2ZlcmFibGVJbnB1dCA9IHRyYW5zZmVyYWJsZUlucHV0XHJcbiAgICAgIHRoaXMuc3luY2hyb25pemUoKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=