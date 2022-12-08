"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMOutput = exports.SECPTransferOutput = exports.AmountOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-EVM-Outputs
 */
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const output_1 = require("../../common/output");
const errors_1 = require("../../utils/errors");
const bintools = bintools_1.default.getInstance();
/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputID A number representing the outputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
const SelectOutputClass = (outputID, ...args) => {
    if (outputID == constants_1.EVMConstants.SECPXFEROUTPUTID) {
        return new SECPTransferOutput(...args);
    }
    throw new errors_1.OutputIdError("Error - SelectOutputClass: unknown outputID");
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
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.EVMConstants.ASSETIDLEN);
        offset += constants_1.EVMConstants.ASSETIDLEN;
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, exports.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
}
exports.TransferableOutput = TransferableOutput;
class AmountOutput extends output_1.StandardAmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     *
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
        this._typeID = constants_1.EVMConstants.SECPXFEROUTPUTID;
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
class EVMOutput {
    /**
     * An [[EVMOutput]] class which contains address, amount, and assetID.
     *
     * @param address The address recieving the asset as a {@link https://github.com/feross/buffer|Buffer} or a string.
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} or number representing the amount.
     * @param assetID The assetID which is being sent as a {@link https://github.com/feross/buffer|Buffer} or a string.
     */
    constructor(address = undefined, amount = undefined, assetID = undefined) {
        this.address = buffer_1.Buffer.alloc(20);
        this.amount = buffer_1.Buffer.alloc(8);
        this.amountValue = new bn_js_1.default(0);
        this.assetID = buffer_1.Buffer.alloc(32);
        /**
         * Returns the address of the input as {@link https://github.com/feross/buffer|Buffer}
         */
        this.getAddress = () => this.address;
        /**
         * Returns the address as a bech32 encoded string.
         */
        this.getAddressString = () => this.address.toString("hex");
        /**
         * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getAmount = () => this.amountValue.clone();
        /**
         * Returns the assetID of the input as {@link https://github.com/feross/buffer|Buffer}
         */
        this.getAssetID = () => this.assetID;
        if (typeof address !== "undefined" &&
            typeof amount !== "undefined" &&
            typeof assetID !== "undefined") {
            if (typeof address === "string") {
                // if present then remove `0x` prefix
                const prefix = address.substring(0, 2);
                if (prefix === "0x") {
                    address = address.split("x")[1];
                }
                address = buffer_1.Buffer.from(address, "hex");
            }
            // convert number amount to BN
            let amnt;
            if (typeof amount === "number") {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            // convert string assetID to Buffer
            if (!(assetID instanceof buffer_1.Buffer)) {
                assetID = bintools.cb58Decode(assetID);
            }
            this.address = address;
            this.amountValue = amnt.clone();
            this.amount = bintools.fromBNToBuffer(amnt, 8);
            this.assetID = assetID;
        }
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[EVMOutput]].
     */
    toBuffer() {
        const bsize = this.address.length + this.amount.length + this.assetID.length;
        const barr = [this.address, this.amount, this.assetID];
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Decodes the [[EVMOutput]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
     */
    fromBuffer(bytes, offset = 0) {
        this.address = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        return offset;
    }
    /**
     * Returns a base-58 representation of the [[EVMOutput]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
    create(...args) {
        return new EVMOutput(...args);
    }
    clone() {
        const newEVMOutput = this.create();
        newEVMOutput.fromBuffer(this.toBuffer());
        return newEVMOutput;
    }
}
exports.EVMOutput = EVMOutput;
/**
 * Returns a function used to sort an array of [[EVMOutput]]s
 */
EVMOutput.comparator = () => (a, b) => {
    // primarily sort by address
    let sorta = a.getAddress();
    let sortb = b.getAddress();
    // secondarily sort by assetID
    if (sorta.equals(sortb)) {
        sorta = a.getAssetID();
        sortb = b.getAssetID();
    }
    return buffer_1.Buffer.compare(sorta, sortb);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2V2bS9vdXRwdXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxrREFBc0I7QUFDdEIsb0VBQTJDO0FBQzNDLDJDQUEwQztBQUMxQyxnREFJNEI7QUFHNUIsK0NBQWtEO0FBRWxELE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFakQ7Ozs7OztHQU1HO0FBQ0ksTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFFBQWdCLEVBQUUsR0FBRyxJQUFXLEVBQVUsRUFBRTtJQUM1RSxJQUFJLFFBQVEsSUFBSSx3QkFBWSxDQUFDLGdCQUFnQixFQUFFO1FBQzdDLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ3ZDO0lBQ0QsTUFBTSxJQUFJLHNCQUFhLENBQUMsNkNBQTZDLENBQUMsQ0FBQTtBQUN4RSxDQUFDLENBQUE7QUFMWSxRQUFBLGlCQUFpQixxQkFLN0I7QUFFRCxNQUFhLGtCQUFtQixTQUFRLG1DQUEwQjtJQUFsRTs7UUFDWSxjQUFTLEdBQUcsb0JBQW9CLENBQUE7UUFDaEMsWUFBTyxHQUFHLFNBQVMsQ0FBQTtJQXdCL0IsQ0FBQztJQXRCQyx3QkFBd0I7SUFFeEIsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUM1RCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDckQsQ0FBQztJQUVE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QUVELEtBQUs7UUFDSCxNQUFNLFlBQVksR0FBYyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDN0MsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUN4QyxPQUFPLFlBQW9CLENBQUE7SUFDN0IsQ0FBQzs7QUFsRkgsOEJBaUlDO0FBM0hDOztHQUVHO0FBQ0ksb0JBQVUsR0FDZixHQUF1RSxFQUFFLENBQ3pFLENBQUMsQ0FBdUIsRUFBRSxDQUF1QixFQUFjLEVBQUU7SUFDL0QsNEJBQTRCO0lBQzVCLElBQUksS0FBSyxHQUFXLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUNsQyxJQUFJLEtBQUssR0FBVyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDbEMsOEJBQThCO0lBQzlCLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN2QixLQUFLLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ3RCLEtBQUssR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUE7S0FDdkI7SUFDRCxPQUFPLGVBQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBZSxDQUFBO0FBQ25ELENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktRVZNLU91dHB1dHNcclxuICovXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBFVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQge1xyXG4gIE91dHB1dCxcclxuICBTdGFuZGFyZEFtb3VudE91dHB1dCxcclxuICBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFxyXG59IGZyb20gXCIuLi8uLi9jb21tb24vb3V0cHV0XCJcclxuaW1wb3J0IHsgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5pbXBvcnQgeyBFVk1JbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXHJcbmltcG9ydCB7IE91dHB1dElkRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIE91dHB1dCBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIG91dHB1dElEIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgb3V0cHV0SUQgcGFyc2VkIHByaW9yIHRvIHRoZSBieXRlcyBwYXNzZWQgaW5cclxuICpcclxuICogQHJldHVybnMgQW4gaW5zdGFuY2Ugb2YgYW4gW1tPdXRwdXRdXS1leHRlbmRlZCBjbGFzcy5cclxuICovXHJcbmV4cG9ydCBjb25zdCBTZWxlY3RPdXRwdXRDbGFzcyA9IChvdXRwdXRJRDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IE91dHB1dCA9PiB7XHJcbiAgaWYgKG91dHB1dElEID09IEVWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEKSB7XHJcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCguLi5hcmdzKVxyXG4gIH1cclxuICB0aHJvdyBuZXcgT3V0cHV0SWRFcnJvcihcIkVycm9yIC0gU2VsZWN0T3V0cHV0Q2xhc3M6IHVua25vd24gb3V0cHV0SURcIilcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRyYW5zZmVyYWJsZU91dHB1dCBleHRlbmRzIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUcmFuc2ZlcmFibGVPdXRwdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pXHJcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oXHJcbiAgICAgIGJ5dGVzLFxyXG4gICAgICBvZmZzZXQsXHJcbiAgICAgIG9mZnNldCArIEVWTUNvbnN0YW50cy5BU1NFVElETEVOXHJcbiAgICApXHJcbiAgICBvZmZzZXQgKz0gRVZNQ29uc3RhbnRzLkFTU0VUSURMRU5cclxuICAgIGNvbnN0IG91dHB1dGlkOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0aWQpXHJcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFtb3VudE91dHB1dCBleHRlbmRzIFN0YW5kYXJkQW1vdW50T3V0cHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRPdXRwdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBBbiBhc3NldElEIHdoaWNoIGlzIHdyYXBwZWQgYXJvdW5kIHRoZSBCdWZmZXIgb2YgdGhlIE91dHB1dFxyXG4gICAqL1xyXG4gIG1ha2VUcmFuc2ZlcmFibGUoYXNzZXRJRDogQnVmZmVyKTogVHJhbnNmZXJhYmxlT3V0cHV0IHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHRoaXMpXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBPdXRwdXQge1xyXG4gICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE91dHB1dCB0aGF0IGNhcnJpZXMgYW4gYW1tb3VudCBmb3IgYW4gYXNzZXRJRCBhbmQgdXNlcyBzZWNwMjU2azEgc2lnbmF0dXJlIHNjaGVtZS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTRUNQVHJhbnNmZXJPdXRwdXQgZXh0ZW5kcyBBbW91bnRPdXRwdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BUcmFuc2Zlck91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBFVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxyXG4gICAqL1xyXG4gIGdldE91dHB1dElEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgbmV3b3V0OiBTRUNQVHJhbnNmZXJPdXRwdXQgPSB0aGlzLmNyZWF0ZSgpXHJcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXHJcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBFVk1PdXRwdXQge1xyXG4gIHByb3RlY3RlZCBhZGRyZXNzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMjApXHJcbiAgcHJvdGVjdGVkIGFtb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXHJcbiAgcHJvdGVjdGVkIGFtb3VudFZhbHVlOiBCTiA9IG5ldyBCTigwKVxyXG4gIHByb3RlY3RlZCBhc3NldElEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB1c2VkIHRvIHNvcnQgYW4gYXJyYXkgb2YgW1tFVk1PdXRwdXRdXXNcclxuICAgKi9cclxuICBzdGF0aWMgY29tcGFyYXRvciA9XHJcbiAgICAoKTogKChhOiBFVk1PdXRwdXQgfCBFVk1JbnB1dCwgYjogRVZNT3V0cHV0IHwgRVZNSW5wdXQpID0+IDEgfCAtMSB8IDApID0+XHJcbiAgICAoYTogRVZNT3V0cHV0IHwgRVZNSW5wdXQsIGI6IEVWTU91dHB1dCB8IEVWTUlucHV0KTogMSB8IC0xIHwgMCA9PiB7XHJcbiAgICAgIC8vIHByaW1hcmlseSBzb3J0IGJ5IGFkZHJlc3NcclxuICAgICAgbGV0IHNvcnRhOiBCdWZmZXIgPSBhLmdldEFkZHJlc3MoKVxyXG4gICAgICBsZXQgc29ydGI6IEJ1ZmZlciA9IGIuZ2V0QWRkcmVzcygpXHJcbiAgICAgIC8vIHNlY29uZGFyaWx5IHNvcnQgYnkgYXNzZXRJRFxyXG4gICAgICBpZiAoc29ydGEuZXF1YWxzKHNvcnRiKSkge1xyXG4gICAgICAgIHNvcnRhID0gYS5nZXRBc3NldElEKClcclxuICAgICAgICBzb3J0YiA9IGIuZ2V0QXNzZXRJRCgpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHNvcnRhLCBzb3J0YikgYXMgMSB8IC0xIHwgMFxyXG4gICAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzIG9mIHRoZSBpbnB1dCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxyXG4gICAqL1xyXG4gIGdldEFkZHJlc3MgPSAoKTogQnVmZmVyID0+IHRoaXMuYWRkcmVzc1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzIGFzIGEgYmVjaDMyIGVuY29kZWQgc3RyaW5nLlxyXG4gICAqL1xyXG4gIGdldEFkZHJlc3NTdHJpbmcgPSAoKTogc3RyaW5nID0+IHRoaXMuYWRkcmVzcy50b1N0cmluZyhcImhleFwiKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhbW91bnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cclxuICAgKi9cclxuICBnZXRBbW91bnQgPSAoKTogQk4gPT4gdGhpcy5hbW91bnRWYWx1ZS5jbG9uZSgpXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFzc2V0SUQgb2YgdGhlIGlucHV0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgZ2V0QXNzZXRJRCA9ICgpOiBCdWZmZXIgPT4gdGhpcy5hc3NldElEXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFVk1PdXRwdXRdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9XHJcbiAgICAgIHRoaXMuYWRkcmVzcy5sZW5ndGggKyB0aGlzLmFtb3VudC5sZW5ndGggKyB0aGlzLmFzc2V0SUQubGVuZ3RoXHJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0aGlzLmFkZHJlc3MsIHRoaXMuYW1vdW50LCB0aGlzLmFzc2V0SURdXHJcbiAgICBjb25zdCBidWZmOiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gICAgcmV0dXJuIGJ1ZmZcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlY29kZXMgdGhlIFtbRVZNT3V0cHV0XV0gYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBhbmQgcmV0dXJucyB0aGUgc2l6ZS5cclxuICAgKi9cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICB0aGlzLmFkZHJlc3MgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyMClcclxuICAgIG9mZnNldCArPSAyMFxyXG4gICAgdGhpcy5hbW91bnQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxyXG4gICAgb2Zmc2V0ICs9IDhcclxuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFVk1PdXRwdXRdXS5cclxuICAgKi9cclxuICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIG5ldyBFVk1PdXRwdXQoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdFVk1PdXRwdXQ6IEVWTU91dHB1dCA9IHRoaXMuY3JlYXRlKClcclxuICAgIG5ld0VWTU91dHB1dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdFVk1PdXRwdXQgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gW1tFVk1PdXRwdXRdXSBjbGFzcyB3aGljaCBjb250YWlucyBhZGRyZXNzLCBhbW91bnQsIGFuZCBhc3NldElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgcmVjaWV2aW5nIHRoZSBhc3NldCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSBhbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBvciBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBhbW91bnQuXHJcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0SUQgd2hpY2ggaXMgYmVpbmcgc2VudCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgc3RyaW5nLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgYWRkcmVzczogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgYW1vdW50OiBCTiB8IG51bWJlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgaWYgKFxyXG4gICAgICB0eXBlb2YgYWRkcmVzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICB0eXBlb2YgYW1vdW50ICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgIHR5cGVvZiBhc3NldElEICE9PSBcInVuZGVmaW5lZFwiXHJcbiAgICApIHtcclxuICAgICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgLy8gaWYgcHJlc2VudCB0aGVuIHJlbW92ZSBgMHhgIHByZWZpeFxyXG4gICAgICAgIGNvbnN0IHByZWZpeDogc3RyaW5nID0gYWRkcmVzcy5zdWJzdHJpbmcoMCwgMilcclxuICAgICAgICBpZiAocHJlZml4ID09PSBcIjB4XCIpIHtcclxuICAgICAgICAgIGFkZHJlc3MgPSBhZGRyZXNzLnNwbGl0KFwieFwiKVsxXVxyXG4gICAgICAgIH1cclxuICAgICAgICBhZGRyZXNzID0gQnVmZmVyLmZyb20oYWRkcmVzcywgXCJoZXhcIilcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gY29udmVydCBudW1iZXIgYW1vdW50IHRvIEJOXHJcbiAgICAgIGxldCBhbW50OiBCTlxyXG4gICAgICBpZiAodHlwZW9mIGFtb3VudCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgIGFtbnQgPSBuZXcgQk4oYW1vdW50KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFtbnQgPSBhbW91bnRcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gY29udmVydCBzdHJpbmcgYXNzZXRJRCB0byBCdWZmZXJcclxuICAgICAgaWYgKCEoYXNzZXRJRCBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcclxuICAgICAgICBhc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKVxyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmFkZHJlc3MgPSBhZGRyZXNzXHJcbiAgICAgIHRoaXMuYW1vdW50VmFsdWUgPSBhbW50LmNsb25lKClcclxuICAgICAgdGhpcy5hbW91bnQgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihhbW50LCA4KVxyXG4gICAgICB0aGlzLmFzc2V0SUQgPSBhc3NldElEXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==