"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tx = exports.UnsignedTx = exports.SelectTxClass = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-Transactions
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const credentials_1 = require("./credentials");
const tx_1 = require("../../common/tx");
const create_hash_1 = __importDefault(require("create-hash"));
const basetx_1 = require("./basetx");
const createassettx_1 = require("./createassettx");
const operationtx_1 = require("./operationtx");
const importtx_1 = require("./importtx");
const exporttx_1 = require("./exporttx");
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
    if (txtype === constants_1.JVMConstants.BASETX) {
        return new basetx_1.BaseTx(...args);
    }
    else if (txtype === constants_1.JVMConstants.CREATEASSETTX) {
        return new createassettx_1.CreateAssetTx(...args);
    }
    else if (txtype === constants_1.JVMConstants.OPERATIONTX) {
        return new operationtx_1.OperationTx(...args);
    }
    else if (txtype === constants_1.JVMConstants.IMPORTTX) {
        return new importtx_1.ImportTx(...args);
    }
    else if (txtype === constants_1.JVMConstants.EXPORTTX) {
        return new exporttx_1.ExportTx(...args);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9qdm0vdHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBMEM7QUFDMUMsK0NBQXFEO0FBR3JELHdDQUFnRTtBQUNoRSw4REFBb0M7QUFDcEMscUNBQWlDO0FBQ2pDLG1EQUErQztBQUMvQywrQ0FBMkM7QUFDM0MseUNBQXFDO0FBQ3JDLHlDQUFxQztBQUVyQywrQ0FBcUQ7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWpEOzs7Ozs7R0FNRztBQUNJLE1BQU0sYUFBYSxHQUFHLENBQUMsTUFBYyxFQUFFLEdBQUcsSUFBVyxFQUFVLEVBQUU7SUFDdEUsSUFBSSxNQUFNLEtBQUssd0JBQVksQ0FBQyxNQUFNLEVBQUU7UUFDbEMsT0FBTyxJQUFJLGVBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQzNCO1NBQU0sSUFBSSxNQUFNLEtBQUssd0JBQVksQ0FBQyxhQUFhLEVBQUU7UUFDaEQsT0FBTyxJQUFJLDZCQUFhLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNsQztTQUFNLElBQUksTUFBTSxLQUFLLHdCQUFZLENBQUMsV0FBVyxFQUFFO1FBQzlDLE9BQU8sSUFBSSx5QkFBVyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDaEM7U0FBTSxJQUFJLE1BQU0sS0FBSyx3QkFBWSxDQUFDLFFBQVEsRUFBRTtRQUMzQyxPQUFPLElBQUksbUJBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQzdCO1NBQU0sSUFBSSxNQUFNLEtBQUssd0JBQVksQ0FBQyxRQUFRLEVBQUU7UUFDM0MsT0FBTyxJQUFJLG1CQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUM3QjtJQUNELDBCQUEwQjtJQUMx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QUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUM1QjtRQUNELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztDQUNGO0FBL0NELGdCQStDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktSlZNLVRyYW5zYWN0aW9uc1xyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHsgSlZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgU2VsZWN0Q3JlZGVudGlhbENsYXNzIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcclxuaW1wb3J0IHsgQ3JlZGVudGlhbCB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBTdGFuZGFyZFR4LCBTdGFuZGFyZFVuc2lnbmVkVHggfSBmcm9tIFwiLi4vLi4vY29tbW9uL3R4XCJcclxuaW1wb3J0IGNyZWF0ZUhhc2ggZnJvbSBcImNyZWF0ZS1oYXNoXCJcclxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcclxuaW1wb3J0IHsgQ3JlYXRlQXNzZXRUeCB9IGZyb20gXCIuL2NyZWF0ZWFzc2V0dHhcIlxyXG5pbXBvcnQgeyBPcGVyYXRpb25UeCB9IGZyb20gXCIuL29wZXJhdGlvbnR4XCJcclxuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tIFwiLi9pbXBvcnR0eFwiXHJcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSBcIi4vZXhwb3J0dHhcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcbmltcG9ydCB7IFRyYW5zYWN0aW9uRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbi8qKlxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0Jhc2VUeF1dIGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcGFyYW0gdHh0eXBlIFRoZSBpZCBvZiB0aGUgdHJhbnNhY3Rpb24gdHlwZVxyXG4gKlxyXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW0Jhc2VUeF1dLWV4dGVuZGVkIGNsYXNzLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFNlbGVjdFR4Q2xhc3MgPSAodHh0eXBlOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogQmFzZVR4ID0+IHtcclxuICBpZiAodHh0eXBlID09PSBKVk1Db25zdGFudHMuQkFTRVRYKSB7XHJcbiAgICByZXR1cm4gbmV3IEJhc2VUeCguLi5hcmdzKVxyXG4gIH0gZWxzZSBpZiAodHh0eXBlID09PSBKVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWCkge1xyXG4gICAgcmV0dXJuIG5ldyBDcmVhdGVBc3NldFR4KC4uLmFyZ3MpXHJcbiAgfSBlbHNlIGlmICh0eHR5cGUgPT09IEpWTUNvbnN0YW50cy5PUEVSQVRJT05UWCkge1xyXG4gICAgcmV0dXJuIG5ldyBPcGVyYXRpb25UeCguLi5hcmdzKVxyXG4gIH0gZWxzZSBpZiAodHh0eXBlID09PSBKVk1Db25zdGFudHMuSU1QT1JUVFgpIHtcclxuICAgIHJldHVybiBuZXcgSW1wb3J0VHgoLi4uYXJncylcclxuICB9IGVsc2UgaWYgKHR4dHlwZSA9PT0gSlZNQ29uc3RhbnRzLkVYUE9SVFRYKSB7XHJcbiAgICByZXR1cm4gbmV3IEV4cG9ydFR4KC4uLmFyZ3MpXHJcbiAgfVxyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgdGhyb3cgbmV3IFRyYW5zYWN0aW9uRXJyb3IoXCJFcnJvciAtIFNlbGVjdFR4Q2xhc3M6IHVua25vd24gdHh0eXBlXCIpXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBVbnNpZ25lZFR4IGV4dGVuZHMgU3RhbmRhcmRVbnNpZ25lZFR4PEtleVBhaXIsIEtleUNoYWluLCBCYXNlVHg+IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVbnNpZ25lZFR4XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcclxuXHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IFNlbGVjdFR4Q2xhc3MoZmllbGRzW1widHJhbnNhY3Rpb25cIl1bXCJfdHlwZUlEXCJdKVxyXG4gICAgdGhpcy50cmFuc2FjdGlvbi5kZXNlcmlhbGl6ZShmaWVsZHNbXCJ0cmFuc2FjdGlvblwiXSwgZW5jb2RpbmcpXHJcbiAgfVxyXG5cclxuICBnZXRUcmFuc2FjdGlvbigpOiBCYXNlVHgge1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNhY3Rpb24gYXMgQmFzZVR4XHJcbiAgfVxyXG5cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICB0aGlzLmNvZGVjSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKS5yZWFkVUludDE2QkUoMClcclxuICAgIG9mZnNldCArPSAyXHJcbiAgICBjb25zdCB0eHR5cGU6IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICAucmVhZFVJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IFNlbGVjdFR4Q2xhc3ModHh0eXBlKVxyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2lnbnMgdGhpcyBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBzaWduZWQgW1tTdGFuZGFyZFR4XV1cclxuICAgKlxyXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHNpZ25lZCBbW1N0YW5kYXJkVHhdXVxyXG4gICAqL1xyXG4gIHNpZ24oa2M6IEtleUNoYWluKTogVHgge1xyXG4gICAgY29uc3QgdHhidWZmID0gdGhpcy50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBtc2c6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFxyXG4gICAgICBjcmVhdGVIYXNoKFwic2hhMjU2XCIpLnVwZGF0ZSh0eGJ1ZmYpLmRpZ2VzdCgpXHJcbiAgICApXHJcbiAgICBjb25zdCBjcmVkczogQ3JlZGVudGlhbFtdID0gdGhpcy50cmFuc2FjdGlvbi5zaWduKG1zZywga2MpXHJcbiAgICByZXR1cm4gbmV3IFR4KHRoaXMsIGNyZWRzKVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFR4IGV4dGVuZHMgU3RhbmRhcmRUeDxLZXlQYWlyLCBLZXlDaGFpbiwgVW5zaWduZWRUeD4ge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlR4XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcclxuXHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy51bnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoKVxyXG4gICAgdGhpcy51bnNpZ25lZFR4LmRlc2VyaWFsaXplKGZpZWxkc1tcInVuc2lnbmVkVHhcIl0sIGVuY29kaW5nKVxyXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IFtdXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgZmllbGRzW1wiY3JlZGVudGlhbHNcIl0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3QgY3JlZDogQ3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyhcclxuICAgICAgICBmaWVsZHNbXCJjcmVkZW50aWFsc1wiXVtgJHtpfWBdW1wiX3R5cGVJRFwiXVxyXG4gICAgICApXHJcbiAgICAgIGNyZWQuZGVzZXJpYWxpemUoZmllbGRzW1wiY3JlZGVudGlhbHNcIl1bYCR7aX1gXSwgZW5jb2RpbmcpXHJcbiAgICAgIHRoaXMuY3JlZGVudGlhbHMucHVzaChjcmVkKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbVHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBUeCBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tUeF1dXHJcbiAgICogQHBhcmFtIG9mZnNldCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHN0YXJ0aW5nIHBvaW50IG9mIHRoZSBieXRlcyB0byBiZWdpbiBwYXJzaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tUeF1dXHJcbiAgICovXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy51bnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoKVxyXG4gICAgb2Zmc2V0ID0gdGhpcy51bnNpZ25lZFR4LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgIGNvbnN0IG51bWNyZWRzOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBbXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bWNyZWRzOyBpKyspIHtcclxuICAgICAgY29uc3QgY3JlZGlkOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgICAgb2Zmc2V0ICs9IDRcclxuICAgICAgY29uc3QgY3JlZDogQ3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyhjcmVkaWQpXHJcbiAgICAgIG9mZnNldCA9IGNyZWQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzLnB1c2goY3JlZClcclxuICAgIH1cclxuICAgIHJldHVybiBvZmZzZXRcclxuICB9XHJcbn1cclxuIl19