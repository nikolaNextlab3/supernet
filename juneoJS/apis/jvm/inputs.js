"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECPTransferInput = exports.AmountInput = exports.TransferableInput = exports.SelectInputClass = void 0;
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const input_1 = require("../../common/input");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
const SelectInputClass = (inputid, ...args) => {
    if (inputid === constants_1.JVMConstants.SECPINPUTID ||
        inputid === constants_1.JVMConstants.SECPINPUTID_CODECONE) {
        return new SECPTransferInput(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.InputIdError("Error - SelectInputClass: unknown inputid");
};
exports.SelectInputClass = SelectInputClass;
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
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.JVMConstants.ASSETIDLEN);
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
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.SECPINPUTID
            : constants_1.JVMConstants.SECPINPUTID_CODECONE;
    }
    //serialize and deserialize both are inherited
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - SECPTransferInput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.SECPINPUTID
                : constants_1.JVMConstants.SECPINPUTID_CODECONE;
    }
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
    }
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.JVMConstants.SECPCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.JVMConstants.SECPCREDENTIAL_CODECONE;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvanZtL2lucHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFLQSxvRUFBMkM7QUFDM0MsMkNBQTBDO0FBQzFDLDhDQUkyQjtBQUUzQiwrQ0FBK0Q7QUFFL0Q7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWpEOzs7Ozs7R0FNRztBQUNJLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxPQUFlLEVBQUUsR0FBRyxJQUFXLEVBQVMsRUFBRTtJQUN6RSxJQUNFLE9BQU8sS0FBSyx3QkFBWSxDQUFDLFdBQVc7UUFDcEMsT0FBTyxLQUFLLHdCQUFZLENBQUMsb0JBQW9CLEVBQzdDO1FBQ0EsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDdEM7SUFDRCwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQUMsMkNBQTJDLENBQUMsQ0FBQTtBQUNyRSxDQUFDLENBQUE7QUFUWSxRQUFBLGdCQUFnQixvQkFTNUI7QUFFRCxNQUFhLGlCQUFrQixTQUFRLGlDQUF5QjtJQUFoRTs7UUFDWSxjQUFTLEdBQUcsbUJBQW1CLENBQUE7UUFDL0IsWUFBTyxHQUFHLFNBQVMsQ0FBQTtJQW1DL0IsQ0FBQztJQWpDQyx3QkFBd0I7SUFFeEIsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUN6RCxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7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Q0FBUyxDQUFBO0lBQy9DLENBQUM7SUFFRCxLQUFLO1FBQ0gsTUFBTSxNQUFNLEdBQXNCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUMvQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLE9BQU8sTUFBYyxDQUFBO0lBQ3ZCLENBQUM7Q0FDRjtBQXJERCw4Q0FxREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLUpWTS1JbnB1dHNcclxuICovXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IEpWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgSW5wdXQsXHJcbiAgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCxcclxuICBTdGFuZGFyZEFtb3VudElucHV0XHJcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9pbnB1dFwiXHJcbmltcG9ydCB7IFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgSW5wdXRJZEVycm9yLCBDb2RlY0lkRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbi8qKlxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0lucHV0XV0gaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSBpbnB1dGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgaW5wdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxyXG4gKlxyXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW0lucHV0XV0tZXh0ZW5kZWQgY2xhc3MuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgU2VsZWN0SW5wdXRDbGFzcyA9IChpbnB1dGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogSW5wdXQgPT4ge1xyXG4gIGlmIChcclxuICAgIGlucHV0aWQgPT09IEpWTUNvbnN0YW50cy5TRUNQSU5QVVRJRCB8fFxyXG4gICAgaW5wdXRpZCA9PT0gSlZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEX0NPREVDT05FXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KC4uLmFyZ3MpXHJcbiAgfVxyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgdGhyb3cgbmV3IElucHV0SWRFcnJvcihcIkVycm9yIC0gU2VsZWN0SW5wdXRDbGFzczogdW5rbm93biBpbnB1dGlkXCIpXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUcmFuc2ZlcmFibGVJbnB1dCBleHRlbmRzIFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlRyYW5zZmVyYWJsZUlucHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcclxuXHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5pbnB1dCA9IFNlbGVjdElucHV0Q2xhc3MoZmllbGRzW1wiaW5wdXRcIl1bXCJfdHlwZUlEXCJdKVxyXG4gICAgdGhpcy5pbnB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJpbnB1dFwiXSwgZW5jb2RpbmcpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSBbW1RyYW5zZmVyYWJsZUlucHV0XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dIGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW1RyYW5zZmVyYWJsZUlucHV0XV1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW1RyYW5zZmVyYWJsZUlucHV0XV1cclxuICAgKi9cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICB0aGlzLnR4aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcclxuICAgIG9mZnNldCArPSAzMlxyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKFxyXG4gICAgICBieXRlcyxcclxuICAgICAgb2Zmc2V0LFxyXG4gICAgICBvZmZzZXQgKyBKVk1Db25zdGFudHMuQVNTRVRJRExFTlxyXG4gICAgKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICBjb25zdCBpbnB1dGlkOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMuaW5wdXQgPSBTZWxlY3RJbnB1dENsYXNzKGlucHV0aWQpXHJcbiAgICByZXR1cm4gdGhpcy5pbnB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQW1vdW50SW5wdXQgZXh0ZW5kcyBTdGFuZGFyZEFtb3VudElucHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRJbnB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBJbnB1dCB7XHJcbiAgICByZXR1cm4gU2VsZWN0SW5wdXRDbGFzcyhpZCwgLi4uYXJncylcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTRUNQVHJhbnNmZXJJbnB1dCBleHRlbmRzIEFtb3VudElucHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQVHJhbnNmZXJJbnB1dFwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gSlZNQ29uc3RhbnRzLkxBVEVTVENPREVDXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxyXG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICA/IEpWTUNvbnN0YW50cy5TRUNQSU5QVVRJRFxyXG4gICAgICA6IEpWTUNvbnN0YW50cy5TRUNQSU5QVVRJRF9DT0RFQ09ORVxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY29kZWNJRFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XHJcbiAgICovXHJcbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IENvZGVjSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gU0VDUFRyYW5zZmVySW5wdXQuc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxyXG4gICAgdGhpcy5fdHlwZUlEID1cclxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICAgID8gSlZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEXHJcbiAgICAgICAgOiBKVk1Db25zdGFudHMuU0VDUElOUFVUSURfQ09ERUNPTkVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGlucHV0SUQgZm9yIHRoaXMgaW5wdXRcclxuICAgKi9cclxuICBnZXRJbnB1dElEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcclxuICAgIGlmICh0aGlzLl9jb2RlY0lEID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBKVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUxcclxuICAgIH0gZWxzZSBpZiAodGhpcy5fY29kZWNJRCA9PT0gMSkge1xyXG4gICAgICByZXR1cm4gSlZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMX0NPREVDT05FXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVySW5wdXQoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdvdXQ6IFNFQ1BUcmFuc2ZlcklucHV0ID0gdGhpcy5jcmVhdGUoKVxyXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXHJcbiAgfVxyXG59XHJcbiJdfQ==