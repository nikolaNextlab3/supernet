"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tx = exports.UnsignedTx = exports.SelectTxClass = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-Transactions
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const credentials_1 = require("./credentials");
const tx_1 = require("../../common/tx");
const create_hash_1 = __importDefault(require("create-hash"));
const basetx_1 = require("./basetx");
const importtx_1 = require("./importtx");
const exporttx_1 = require("./exporttx");
const validationtx_1 = require("./validationtx");
const createsubnettx_1 = require("./createsubnettx");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[BaseTx]] instance.
 *
 * @param txtype The id of the transaction type
 *
 * @returns An instance of an [[BaseTx]]-extended class.
 */
const SelectTxClass = (txtype, ...args) => {
    if (txtype === constants_1.PlatformVMConstants.BASETX) {
        return new basetx_1.BaseTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.IMPORTTX) {
        return new importtx_1.ImportTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.EXPORTTX) {
        return new exporttx_1.ExportTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.ADDDELEGATORTX) {
        return new validationtx_1.AddDelegatorTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.ADDVALIDATORTX) {
        return new validationtx_1.AddValidatorTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.CREATESUBNETTX) {
        return new createsubnettx_1.CreateSubnetTx(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.TransactionError("Error - SelectTxClass: unknown txtype");
};
exports.SelectTxClass = SelectTxClass;
class UnsignedTx extends tx_1.StandardUnsignedTx {
    constructor() {
        super(...arguments);
        this._typeName = "UnsignedTx";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.transaction = (0, exports.SelectTxClass)(fields["transaction"]["_typeID"]);
        this.transaction.deserialize(fields["transaction"], encoding);
    }
    getTransaction() {
        return this.transaction;
    }
    fromBuffer(bytes, offset = 0) {
        this.codecID = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        const txtype = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.transaction = (0, exports.SelectTxClass)(txtype);
        return this.transaction.fromBuffer(bytes, offset);
    }
    /**
     * Signs this [[UnsignedTx]] and returns signed [[StandardTx]]
     *
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns A signed [[StandardTx]]
     */
    sign(kc) {
        const txbuff = this.toBuffer();
        const msg = buffer_1.Buffer.from((0, create_hash_1.default)("sha256").update(txbuff).digest());
        const creds = this.transaction.sign(msg, kc);
        return new Tx(this, creds);
    }
}
exports.UnsignedTx = UnsignedTx;
class Tx extends tx_1.StandardTx {
    constructor() {
        super(...arguments);
        this._typeName = "Tx";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.unsignedTx = new UnsignedTx();
        this.unsignedTx.deserialize(fields["unsignedTx"], encoding);
        this.credentials = [];
        for (let i = 0; i < fields["credentials"].length; i++) {
            const cred = (0, credentials_1.SelectCredentialClass)(fields["credentials"][`${i}`]["_typeID"]);
            cred.deserialize(fields["credentials"][`${i}`], encoding);
            this.credentials.push(cred);
        }
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Tx]]
     * @param offset A number representing the starting point of the bytes to begin parsing
     *
     * @returns The length of the raw [[Tx]]
     */
    fromBuffer(bytes, offset = 0) {
        this.unsignedTx = new UnsignedTx();
        offset = this.unsignedTx.fromBuffer(bytes, offset);
        const numcreds = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.credentials = [];
        for (let i = 0; i < numcreds; i++) {
            const credid = bintools
                .copyFrom(bytes, offset, offset + 4)
                .readUInt32BE(0);
            offset += 4;
            const cred = (0, credentials_1.SelectCredentialClass)(credid);
            offset = cred.fromBuffer(bytes, offset);
            this.credentials.push(cred);
        }
        return offset;
    }
}
exports.Tx = Tx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3R4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQWlEO0FBQ2pELCtDQUFxRDtBQUVyRCx3Q0FBZ0U7QUFFaEUsOERBQW9DO0FBQ3BDLHFDQUFpQztBQUNqQyx5Q0FBcUM7QUFDckMseUNBQXFDO0FBRXJDLGlEQUErRDtBQUMvRCxxREFBaUQ7QUFDakQsK0NBQXFEO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVqRDs7Ozs7O0dBTUc7QUFDSSxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQWMsRUFBRSxHQUFHLElBQVcsRUFBVSxFQUFFO0lBQ3RFLElBQUksTUFBTSxLQUFLLCtCQUFtQixDQUFDLE1BQU0sRUFBRTtRQUN6QyxPQUFPLElBQUksZUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDM0I7U0FBTSxJQUFJLE1BQU0sS0FBSywrQkFBbUIsQ0FBQyxRQUFRLEVBQUU7UUFDbEQsT0FBTyxJQUFJLG1CQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUM3QjtTQUFNLElBQUksTUFBTSxLQUFLLCtCQUFtQixDQUFDLFFBQVEsRUFBRTtRQUNsRCxPQUFPLElBQUksbUJBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQzdCO1NBQU0sSUFBSSxNQUFNLEtBQUssK0JBQW1CLENBQUMsY0FBYyxFQUFFO1FBQ3hELE9BQU8sSUFBSSw2QkFBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDbkM7U0FBTSxJQUFJLE1BQU0sS0FBSywrQkFBbUIsQ0FBQyxjQUFjLEVBQUU7UUFDeEQsT0FBTyxJQUFJLDZCQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNuQztTQUFN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QUFJLEdBQWUsSUFBQSxtQ0FBcUIsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUN0RCxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDdkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDNUI7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7Q0FDRjtBQS9DRCxnQkErQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tVHJhbnNhY3Rpb25zXHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgU2VsZWN0Q3JlZGVudGlhbENsYXNzIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcclxuaW1wb3J0IHsgU3RhbmRhcmRUeCwgU3RhbmRhcmRVbnNpZ25lZFR4IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi90eFwiXHJcbmltcG9ydCB7IENyZWRlbnRpYWwgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IGNyZWF0ZUhhc2ggZnJvbSBcImNyZWF0ZS1oYXNoXCJcclxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcclxuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tIFwiLi9pbXBvcnR0eFwiXHJcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSBcIi4vZXhwb3J0dHhcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcbmltcG9ydCB7IEFkZERlbGVnYXRvclR4LCBBZGRWYWxpZGF0b3JUeCB9IGZyb20gXCIuL3ZhbGlkYXRpb250eFwiXHJcbmltcG9ydCB7IENyZWF0ZVN1Ym5ldFR4IH0gZnJvbSBcIi4vY3JlYXRlc3VibmV0dHhcIlxyXG5pbXBvcnQgeyBUcmFuc2FjdGlvbkVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5cclxuLyoqXHJcbiAqIFRha2VzIGEgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgb3V0cHV0IGFuZCByZXR1cm5zIHRoZSBwcm9wZXIgW1tCYXNlVHhdXSBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIHR4dHlwZSBUaGUgaWQgb2YgdGhlIHRyYW5zYWN0aW9uIHR5cGVcclxuICpcclxuICogQHJldHVybnMgQW4gaW5zdGFuY2Ugb2YgYW4gW1tCYXNlVHhdXS1leHRlbmRlZCBjbGFzcy5cclxuICovXHJcbmV4cG9ydCBjb25zdCBTZWxlY3RUeENsYXNzID0gKHR4dHlwZTogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IEJhc2VUeCA9PiB7XHJcbiAgaWYgKHR4dHlwZSA9PT0gUGxhdGZvcm1WTUNvbnN0YW50cy5CQVNFVFgpIHtcclxuICAgIHJldHVybiBuZXcgQmFzZVR4KC4uLmFyZ3MpXHJcbiAgfSBlbHNlIGlmICh0eHR5cGUgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuSU1QT1JUVFgpIHtcclxuICAgIHJldHVybiBuZXcgSW1wb3J0VHgoLi4uYXJncylcclxuICB9IGVsc2UgaWYgKHR4dHlwZSA9PT0gUGxhdGZvcm1WTUNvbnN0YW50cy5FWFBPUlRUWCkge1xyXG4gICAgcmV0dXJuIG5ldyBFeHBvcnRUeCguLi5hcmdzKVxyXG4gIH0gZWxzZSBpZiAodHh0eXBlID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkFERERFTEVHQVRPUlRYKSB7XHJcbiAgICByZXR1cm4gbmV3IEFkZERlbGVnYXRvclR4KC4uLmFyZ3MpXHJcbiAgfSBlbHNlIGlmICh0eHR5cGUgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuQUREVkFMSURBVE9SVFgpIHtcclxuICAgIHJldHVybiBuZXcgQWRkVmFsaWRhdG9yVHgoLi4uYXJncylcclxuICB9IGVsc2UgaWYgKHR4dHlwZSA9PT0gUGxhdGZvcm1WTUNvbnN0YW50cy5DUkVBVEVTVUJORVRUWCkge1xyXG4gICAgcmV0dXJuIG5ldyBDcmVhdGVTdWJuZXRUeCguLi5hcmdzKVxyXG4gIH1cclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFwiRXJyb3IgLSBTZWxlY3RUeENsYXNzOiB1bmtub3duIHR4dHlwZVwiKVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVW5zaWduZWRUeCBleHRlbmRzIFN0YW5kYXJkVW5zaWduZWRUeDxLZXlQYWlyLCBLZXlDaGFpbiwgQmFzZVR4PiB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVW5zaWduZWRUeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBTZWxlY3RUeENsYXNzKGZpZWxkc1tcInRyYW5zYWN0aW9uXCJdW1wiX3R5cGVJRFwiXSlcclxuICAgIHRoaXMudHJhbnNhY3Rpb24uZGVzZXJpYWxpemUoZmllbGRzW1widHJhbnNhY3Rpb25cIl0sIGVuY29kaW5nKVxyXG4gIH1cclxuXHJcbiAgZ2V0VHJhbnNhY3Rpb24oKTogQmFzZVR4IHtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zYWN0aW9uIGFzIEJhc2VUeFxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5jb2RlY0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMikucmVhZFVJbnQxNkJFKDApXHJcbiAgICBvZmZzZXQgKz0gMlxyXG4gICAgY29uc3QgdHh0eXBlOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBTZWxlY3RUeENsYXNzKHR4dHlwZSlcclxuICAgIHJldHVybiB0aGlzLnRyYW5zYWN0aW9uLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNpZ25zIHRoaXMgW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgc2lnbmVkIFtbU3RhbmRhcmRUeF1dXHJcbiAgICpcclxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBzaWduZWQgW1tTdGFuZGFyZFR4XV1cclxuICAgKi9cclxuICBzaWduKGtjOiBLZXlDaGFpbik6IFR4IHtcclxuICAgIGNvbnN0IHR4YnVmZiA9IHRoaXMudG9CdWZmZXIoKVxyXG4gICAgY29uc3QgbXNnOiBCdWZmZXIgPSBCdWZmZXIuZnJvbShcclxuICAgICAgY3JlYXRlSGFzaChcInNoYTI1NlwiKS51cGRhdGUodHhidWZmKS5kaWdlc3QoKVxyXG4gICAgKVxyXG4gICAgY29uc3QgY3JlZHM6IENyZWRlbnRpYWxbXSA9IHRoaXMudHJhbnNhY3Rpb24uc2lnbihtc2csIGtjKVxyXG4gICAgcmV0dXJuIG5ldyBUeCh0aGlzLCBjcmVkcylcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUeCBleHRlbmRzIFN0YW5kYXJkVHg8S2V5UGFpciwgS2V5Q2hhaW4sIFVuc2lnbmVkVHg+IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMudW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KClcclxuICAgIHRoaXMudW5zaWduZWRUeC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJ1bnNpZ25lZFR4XCJdLCBlbmNvZGluZylcclxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBbXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGZpZWxkc1tcImNyZWRlbnRpYWxzXCJdLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoXHJcbiAgICAgICAgZmllbGRzW1wiY3JlZGVudGlhbHNcIl1bYCR7aX1gXVtcIl90eXBlSURcIl1cclxuICAgICAgKVxyXG4gICAgICBjcmVkLmRlc2VyaWFsaXplKGZpZWxkc1tcImNyZWRlbnRpYWxzXCJdW2Ake2l9YF0sIGVuY29kaW5nKVxyXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzLnB1c2goY3JlZClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW1R4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgVHggaW4gYnl0ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbVHhdXVxyXG4gICAqIEBwYXJhbSBvZmZzZXQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgYnl0ZXMgdG8gYmVnaW4gcGFyc2luZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVHhdXVxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMudW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KClcclxuICAgIG9mZnNldCA9IHRoaXMudW5zaWduZWRUeC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICBjb25zdCBudW1jcmVkczogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gW11cclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1jcmVkczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGNyZWRpZDogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgICAucmVhZFVJbnQzMkJFKDApXHJcbiAgICAgIG9mZnNldCArPSA0XHJcbiAgICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoY3JlZGlkKVxyXG4gICAgICBvZmZzZXQgPSBjcmVkLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgICAgdGhpcy5jcmVkZW50aWFscy5wdXNoKGNyZWQpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG59XHJcbiJdfQ==