"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTx = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-BaseTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const credentials_1 = require("./credentials");
const tx_1 = require("../../common/tx");
const credentials_2 = require("../../common/credentials");
const constants_2 = require("../../utils/constants");
const tx_2 = require("./tx");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const decimalString = "decimalString";
const buffer = "Buffer";
const display = "display";
/**
 * Class representing a base for all transactions.
 */
class BaseTx extends tx_1.StandardBaseTx {
    /**
     * Class representing a BaseTx which is the foundation for all transactions.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "BaseTx";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.JVMConstants.BASETX : constants_1.JVMConstants.BASETX_CODECONE;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.outs = fields["outs"].map((o) => {
            let newOut = new outputs_1.TransferableOutput();
            newOut.deserialize(o, encoding);
            return newOut;
        });
        this.ins = fields["ins"].map((i) => {
            let newIn = new inputs_1.TransferableInput();
            newIn.deserialize(i, encoding);
            return newIn;
        });
        this.numouts = serialization.decoder(this.outs.length.toString(), display, decimalString, buffer, 4);
        this.numins = serialization.decoder(this.ins.length.toString(), display, decimalString, buffer, 4);
    }
    getOuts() {
        return this.outs;
    }
    getIns() {
        return this.ins;
    }
    getTotalOuts() {
        return this.getOuts();
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - BaseTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0 ? constants_1.JVMConstants.BASETX : constants_1.JVMConstants.BASETX_CODECONE;
    }
    /**
     * Returns the id of the [[BaseTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
     *
     * @returns The length of the raw [[BaseTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        this.networkID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.blockchainID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount = this.numouts.readUInt32BE(0);
        this.outs = [];
        for (let i = 0; i < outcount; i++) {
            const xferout = new outputs_1.TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.outs.push(xferout);
        }
        this.numins = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const incount = this.numins.readUInt32BE(0);
        this.ins = [];
        for (let i = 0; i < incount; i++) {
            const xferin = new inputs_1.TransferableInput();
            offset = xferin.fromBuffer(bytes, offset);
            this.ins.push(xferin);
        }
        let memolen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.memo = bintools.copyFrom(bytes, offset, offset + memolen);
        offset += memolen;
        return offset;
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
        const creds = [];
        for (let i = 0; i < this.ins.length; i++) {
            const cred = (0, credentials_1.SelectCredentialClass)(this.ins[`${i}`].getInput().getCredentialID());
            const sigidxs = this.ins[`${i}`].getInput().getSigIdxs();
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
        let newbase = new BaseTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new BaseTx(...args);
    }
    select(id, ...args) {
        let newbasetx = (0, tx_2.SelectTxClass)(id, ...args);
        return newbasetx;
    }
}
exports.BaseTx = BaseTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZXR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvanZtL2Jhc2V0eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUEwQztBQUMxQyx1Q0FBOEM7QUFDOUMscUNBQTRDO0FBQzVDLCtDQUFxRDtBQUVyRCx3Q0FBZ0Q7QUFDaEQsMERBQXdFO0FBQ3hFLHFEQUF3RDtBQUN4RCw2QkFBb0M7QUFDcEMsNkRBSWtDO0FBQ2xDLCtDQUFpRDtBQUVqRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDaEUsTUFBTSxhQUFhLEdBQW1CLGVBQWUsQ0FBQTtBQUNyRCxNQUFNLE1BQU0sR0FBbUIsUUFBUSxDQUFBO0FBQ3ZDLE1BQU0sT0FBTyxHQUF1QixTQUFTLENBQUE7QUFFN0M7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxtQkFBaUM7SUE0SjNEOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVM7UUFFeEIsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQTNLdkMsY0FBUyxHQUFHLFFBQVEsQ0FBQTtRQUNwQixhQUFRLEdBQUcsd0JBQVksQ0FBQyxXQUFXLENBQUE7UUFDbkMsWUFBTyxHQUNmLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMs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QUE7YUFDdkI7WUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ2pCO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsS0FBSztRQUNILElBQUksT0FBTyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUE7UUFDbEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNuQyxPQUFPLE9BQWUsQ0FBQTtJQUN4QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUE7SUFDcEMsQ0FBQztJQUVELE1BQU0sQ0FBQyxFQUFVLEVBQUUsR0FBRyxJQUFXO1FBQy9CLElBQUksU0FBUyxHQUFXLElBQUEsa0JBQWEsRUFBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtRQUNsRCxPQUFPLFNBQWlCLENBQUE7SUFDMUIsQ0FBQztDQW9CRjtBQTlLRCx3QkE4S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLUpWTS1CYXNlVHhcclxuICovXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IEpWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxyXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXHJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcyB9IGZyb20gXCIuL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IHsgS2V5Q2hhaW4sIEtleVBhaXIgfSBmcm9tIFwiLi9rZXljaGFpblwiXHJcbmltcG9ydCB7IFN0YW5kYXJkQmFzZVR4IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi90eFwiXHJcbmltcG9ydCB7IFNpZ25hdHVyZSwgU2lnSWR4LCBDcmVkZW50aWFsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jcmVkZW50aWFsc1wiXHJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgU2VsZWN0VHhDbGFzcyB9IGZyb20gXCIuL3R4XCJcclxuaW1wb3J0IHtcclxuICBTZXJpYWxpemF0aW9uLFxyXG4gIFNlcmlhbGl6ZWRFbmNvZGluZyxcclxuICBTZXJpYWxpemVkVHlwZVxyXG59IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgQ29kZWNJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcclxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcclxuY29uc3QgZGlzcGxheTogU2VyaWFsaXplZEVuY29kaW5nID0gXCJkaXNwbGF5XCJcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBiYXNlIGZvciBhbGwgdHJhbnNhY3Rpb25zLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEJhc2VUeCBleHRlbmRzIFN0YW5kYXJkQmFzZVR4PEtleVBhaXIsIEtleUNoYWluPiB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQmFzZVR4XCJcclxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBKVk1Db25zdGFudHMuTEFURVNUQ09ERUNcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XHJcbiAgICB0aGlzLl9jb2RlY0lEID09PSAwID8gSlZNQ29uc3RhbnRzLkJBU0VUWCA6IEpWTUNvbnN0YW50cy5CQVNFVFhfQ09ERUNPTkVcclxuXHJcbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMub3V0cyA9IGZpZWxkc1tcIm91dHNcIl0ubWFwKChvOiBUcmFuc2ZlcmFibGVPdXRwdXQpID0+IHtcclxuICAgICAgbGV0IG5ld091dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXHJcbiAgICAgIG5ld091dC5kZXNlcmlhbGl6ZShvLCBlbmNvZGluZylcclxuICAgICAgcmV0dXJuIG5ld091dFxyXG4gICAgfSlcclxuICAgIHRoaXMuaW5zID0gZmllbGRzW1wiaW5zXCJdLm1hcCgoaTogVHJhbnNmZXJhYmxlSW5wdXQpID0+IHtcclxuICAgICAgbGV0IG5ld0luOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXHJcbiAgICAgIG5ld0luLmRlc2VyaWFsaXplKGksIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gbmV3SW5cclxuICAgIH0pXHJcbiAgICB0aGlzLm51bW91dHMgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIHRoaXMub3V0cy5sZW5ndGgudG9TdHJpbmcoKSxcclxuICAgICAgZGlzcGxheSxcclxuICAgICAgZGVjaW1hbFN0cmluZyxcclxuICAgICAgYnVmZmVyLFxyXG4gICAgICA0XHJcbiAgICApXHJcbiAgICB0aGlzLm51bWlucyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgdGhpcy5pbnMubGVuZ3RoLnRvU3RyaW5nKCksXHJcbiAgICAgIGRpc3BsYXksXHJcbiAgICAgIGRlY2ltYWxTdHJpbmcsXHJcbiAgICAgIGJ1ZmZlcixcclxuICAgICAgNFxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgZ2V0T3V0cygpOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5vdXRzIGFzIFRyYW5zZmVyYWJsZU91dHB1dFtdXHJcbiAgfVxyXG5cclxuICBnZXRJbnMoKTogVHJhbnNmZXJhYmxlSW5wdXRbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5pbnMgYXMgVHJhbnNmZXJhYmxlSW5wdXRbXVxyXG4gIH1cclxuXHJcbiAgZ2V0VG90YWxPdXRzKCk6IFRyYW5zZmVyYWJsZU91dHB1dFtdIHtcclxuICAgIHJldHVybiB0aGlzLmdldE91dHMoKSBhcyBUcmFuc2ZlcmFibGVPdXRwdXRbXVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBjb2RlY0lEXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcclxuICAgKi9cclxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgaWYgKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBCYXNlVHguc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxyXG4gICAgdGhpcy5fdHlwZUlEID1cclxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMCA/IEpWTUNvbnN0YW50cy5CQVNFVFggOiBKVk1Db25zdGFudHMuQkFTRVRYX0NPREVDT05FXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tCYXNlVHhdXVxyXG4gICAqL1xyXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbQmFzZVR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgQmFzZVR4IGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0Jhc2VUeF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tCYXNlVHhdXVxyXG4gICAqXHJcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMubmV0d29ya0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICB0aGlzLm51bW91dHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIGNvbnN0IG91dGNvdW50OiBudW1iZXIgPSB0aGlzLm51bW91dHMucmVhZFVJbnQzMkJFKDApXHJcbiAgICB0aGlzLm91dHMgPSBbXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG91dGNvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXHJcbiAgICAgIG9mZnNldCA9IHhmZXJvdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgICB0aGlzLm91dHMucHVzaCh4ZmVyb3V0KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubnVtaW5zID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICBjb25zdCBpbmNvdW50OiBudW1iZXIgPSB0aGlzLm51bWlucy5yZWFkVUludDMyQkUoMClcclxuICAgIHRoaXMuaW5zID0gW11cclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBpbmNvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgeGZlcmluOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXHJcbiAgICAgIG9mZnNldCA9IHhmZXJpbi5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICAgIHRoaXMuaW5zLnB1c2goeGZlcmluKVxyXG4gICAgfVxyXG4gICAgbGV0IG1lbW9sZW46IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICAucmVhZFVJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy5tZW1vID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgbWVtb2xlbilcclxuICAgIG9mZnNldCArPSBtZW1vbGVuXHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyB0aGUgYnl0ZXMgb2YgYW4gW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbXNnIEEgQnVmZmVyIGZvciB0aGUgW1tVbnNpZ25lZFR4XV1cclxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXHJcbiAgICovXHJcbiAgc2lnbihtc2c6IEJ1ZmZlciwga2M6IEtleUNoYWluKTogQ3JlZGVudGlhbFtdIHtcclxuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBbXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuaW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoXHJcbiAgICAgICAgdGhpcy5pbnNbYCR7aX1gXS5nZXRJbnB1dCgpLmdldENyZWRlbnRpYWxJRCgpXHJcbiAgICAgIClcclxuICAgICAgY29uc3Qgc2lnaWR4czogU2lnSWR4W10gPSB0aGlzLmluc1tgJHtpfWBdLmdldElucHV0KCkuZ2V0U2lnSWR4cygpXHJcbiAgICAgIGZvciAobGV0IGo6IG51bWJlciA9IDA7IGogPCBzaWdpZHhzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgY29uc3Qga2V5cGFpcjogS2V5UGFpciA9IGtjLmdldEtleShzaWdpZHhzW2Ake2p9YF0uZ2V0U291cmNlKCkpXHJcbiAgICAgICAgY29uc3Qgc2lnbnZhbDogQnVmZmVyID0ga2V5cGFpci5zaWduKG1zZylcclxuICAgICAgICBjb25zdCBzaWc6IFNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKVxyXG4gICAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpXHJcbiAgICAgICAgY3JlZC5hZGRTaWduYXR1cmUoc2lnKVxyXG4gICAgICB9XHJcbiAgICAgIGNyZWRzLnB1c2goY3JlZClcclxuICAgIH1cclxuICAgIHJldHVybiBjcmVkc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBsZXQgbmV3YmFzZTogQmFzZVR4ID0gbmV3IEJhc2VUeCgpXHJcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IEJhc2VUeCguLi5hcmdzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIGxldCBuZXdiYXNldHg6IEJhc2VUeCA9IFNlbGVjdFR4Q2xhc3MoaWQsIC4uLmFyZ3MpXHJcbiAgICByZXR1cm4gbmV3YmFzZXR4IGFzIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhIEJhc2VUeCB3aGljaCBpcyB0aGUgZm91bmRhdGlvbiBmb3IgYWxsIHRyYW5zYWN0aW9ucy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXHJcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXHJcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxyXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcclxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxyXG4gIH1cclxufVxyXG4iXX0=