"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTTransferOutput = exports.NFTMintOutput = exports.SECPMintOutput = exports.SECPTransferOutput = exports.NFTOutput = exports.AmountOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-Outputs
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
    if (outputid === constants_1.JVMConstants.SECPXFEROUTPUTID ||
        outputid === constants_1.JVMConstants.SECPXFEROUTPUTID_CODECONE) {
        return new SECPTransferOutput(...args);
    }
    else if (outputid === constants_1.JVMConstants.SECPMINTOUTPUTID ||
        outputid === constants_1.JVMConstants.SECPMINTOUTPUTID_CODECONE) {
        return new SECPMintOutput(...args);
    }
    else if (outputid === constants_1.JVMConstants.NFTMINTOUTPUTID ||
        outputid === constants_1.JVMConstants.NFTMINTOUTPUTID_CODECONE) {
        return new NFTMintOutput(...args);
    }
    else if (outputid === constants_1.JVMConstants.NFTXFEROUTPUTID ||
        outputid === constants_1.JVMConstants.NFTXFEROUTPUTID_CODECONE) {
        return new NFTTransferOutput(...args);
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
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.JVMConstants.ASSETIDLEN);
        offset += constants_1.JVMConstants.ASSETIDLEN;
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
class NFTOutput extends output_1.BaseNFTOutput {
    constructor() {
        super(...arguments);
        this._typeName = "NFTOutput";
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
exports.NFTOutput = NFTOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPTransferOutput extends AmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferOutput";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.SECPXFEROUTPUTID
            : constants_1.JVMConstants.SECPXFEROUTPUTID_CODECONE;
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
            throw new errors_1.CodecIdError("Error - SECPTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.SECPXFEROUTPUTID
                : constants_1.JVMConstants.SECPXFEROUTPUTID_CODECONE;
    }
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
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPMintOutput extends output_1.Output {
    constructor() {
        super(...arguments);
        this._typeName = "SECPMintOutput";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.SECPMINTOUTPUTID
            : constants_1.JVMConstants.SECPMINTOUTPUTID_CODECONE;
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
            throw new errors_1.CodecIdError("Error - SECPMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.SECPMINTOUTPUTID
                : constants_1.JVMConstants.SECPMINTOUTPUTID_CODECONE;
    }
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
        return new SECPMintOutput(...args);
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
exports.SECPMintOutput = SECPMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT Mint and uses secp256k1 signature scheme.
 */
class NFTMintOutput extends NFTOutput {
    /**
     * An [[Output]] class which contains an NFT mint for an assetID.
     *
     * @param groupID A number specifies the group this NFT is issued to
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing  addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
  
     */
    constructor(groupID = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTMintOutput";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.NFTMINTOUTPUTID
            : constants_1.JVMConstants.NFTMINTOUTPUTID_CODECONE;
        if (typeof groupID !== "undefined") {
            this.groupID.writeUInt32BE(groupID, 0);
        }
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
            throw new errors_1.CodecIdError("Error - NFTMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.NFTMINTOUTPUTID
                : constants_1.JVMConstants.NFTMINTOUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTMintOutput]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let bsize = this.groupID.length + superbuff.length;
        let barr = [this.groupID, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTMintOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTMintOutput = NFTMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT and uses secp256k1 signature scheme.
 */
class NFTTransferOutput extends NFTOutput {
    /**
       * An [[Output]] class which contains an NFT on an assetID.
       *
       * @param groupID A number representing the amount in the output
       * @param payload A {@link https://github.com/feross/buffer|Buffer} of max length 1024
       * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
       * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
       * @param threshold A number representing the the threshold number of signers required to sign the transaction
  
       */
    constructor(groupID = undefined, payload = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTTransferOutput";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.NFTXFEROUTPUTID
            : constants_1.JVMConstants.NFTXFEROUTPUTID_CODECONE;
        this.sizePayload = buffer_1.Buffer.alloc(4);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with content only.
         */
        this.getPayload = () => bintools.copyFrom(this.payload);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with length of payload prepended.
         */
        this.getPayloadBuffer = () => buffer_1.Buffer.concat([
            bintools.copyFrom(this.sizePayload),
            bintools.copyFrom(this.payload)
        ]);
        if (typeof groupID !== "undefined" && typeof payload !== "undefined") {
            this.groupID.writeUInt32BE(groupID, 0);
            this.sizePayload.writeUInt32BE(payload.length, 0);
            this.payload = bintools.copyFrom(payload, 0, payload.length);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { payload: serialization.encoder(this.payload, encoding, "Buffer", "hex", this.payload.length) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.payload = serialization.decoder(fields["payload"], encoding, "hex", "Buffer");
        this.sizePayload = buffer_1.Buffer.alloc(4);
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.NFTXFEROUTPUTID
                : constants_1.JVMConstants.NFTXFEROUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.sizePayload = bintools.copyFrom(utxobuff, offset, offset + 4);
        let psize = this.sizePayload.readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(utxobuff, offset, offset + psize);
        offset = offset + psize;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTTransferOutput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.groupID.length +
            this.sizePayload.length +
            this.payload.length +
            superbuff.length;
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
        const barr = [
            this.groupID,
            this.sizePayload,
            this.payload,
            superbuff
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTTransferOutput = NFTTransferOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2p2bS9vdXRwdXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUVoQyxvRUFBMkM7QUFDM0MsMkNBQTBDO0FBQzFDLGdEQUs0QjtBQUM1Qiw2REFBNkU7QUFDN0UsK0NBQWdFO0FBRWhFLE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7Ozs7OztHQU1HO0FBQ0ksTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFFBQWdCLEVBQUUsR0FBRyxJQUFXLEVBQVUsRUFBRTtJQUM1RSxJQUNFLFFBQVEsS0FBSyx3QkFBWSxDQUFDLGdCQUFnQjtRQUMxQyxRQUFRLEtBQUssd0JBQVksQ0FBQyx5QkFBeUIsRUFDbkQ7UUFDQSxPQUFPLElBQUksa0JBQWtCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUN2QztTQUFNLElBQ0wsUUFBUSxLQUFLLHdCQUFZLENBQUMsZ0JBQWdCO1FBQzFDLFFBQVEsS0FBSyx3QkFBWSxDQUFDLHlCQUF5QixFQUNuRDtRQUNBLE9BQU8sSUFBSSxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNuQztTQUFNLElBQ0wsUUFBUSxLQUFLLHdCQUFZLENBQUMsZUFBZTtRQUN6QyxRQUFRLEtBQUssd0JBQVksQ0FBQyx3QkFBd0IsRUFDbEQ7UUFDQSxPQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDbEM7U0FBTSxJQUNMLFFBQVEsS0FBSyx3QkFBWSxDQUFDLGVBQWU7UUFDekMsUUFBUSxLQUFLLHdCQUFZLENBQUMsd0JBQXdCLEVBQ2xEO1FBQ0EsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FD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QUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLElBQUksQ0FBUyxDQUFBO0lBQy9DLENBQUM7SUFFRCxLQUFLO1FBQ0gsTUFBTSxNQUFNLEdBQXNCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUMvQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLE9BQU8sTUFBYyxDQUFBO0lBQ3ZCLENBQUM7Q0EwQkY7QUFoSkQsOENBZ0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1KVk0tT3V0cHV0c1xyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IEpWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgT3V0cHV0LFxyXG4gIFN0YW5kYXJkQW1vdW50T3V0cHV0LFxyXG4gIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0LFxyXG4gIEJhc2VORlRPdXRwdXRcclxufSBmcm9tIFwiLi4vLi4vY29tbW9uL291dHB1dFwiXHJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgT3V0cHV0SWRFcnJvciwgQ29kZWNJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIE91dHB1dCBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIG91dHB1dGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgaW5wdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxyXG4gKlxyXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW091dHB1dF1dLWV4dGVuZGVkIGNsYXNzLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFNlbGVjdE91dHB1dENsYXNzID0gKG91dHB1dGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogT3V0cHV0ID0+IHtcclxuICBpZiAoXHJcbiAgICBvdXRwdXRpZCA9PT0gSlZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSUQgfHxcclxuICAgIG91dHB1dGlkID09PSBKVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRF9DT0RFQ09ORVxyXG4gICkge1xyXG4gICAgcmV0dXJuIG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoLi4uYXJncylcclxuICB9IGVsc2UgaWYgKFxyXG4gICAgb3V0cHV0aWQgPT09IEpWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEIHx8XHJcbiAgICBvdXRwdXRpZCA9PT0gSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSURfQ09ERUNPTkVcclxuICApIHtcclxuICAgIHJldHVybiBuZXcgU0VDUE1pbnRPdXRwdXQoLi4uYXJncylcclxuICB9IGVsc2UgaWYgKFxyXG4gICAgb3V0cHV0aWQgPT09IEpWTUNvbnN0YW50cy5ORlRNSU5UT1VUUFVUSUQgfHxcclxuICAgIG91dHB1dGlkID09PSBKVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEX0NPREVDT05FXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gbmV3IE5GVE1pbnRPdXRwdXQoLi4uYXJncylcclxuICB9IGVsc2UgaWYgKFxyXG4gICAgb3V0cHV0aWQgPT09IEpWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSUQgfHxcclxuICAgIG91dHB1dGlkID09PSBKVk1Db25zdGFudHMuTkZUWEZFUk9VVFBVVElEX0NPREVDT05FXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpXHJcbiAgfVxyXG4gIHRocm93IG5ldyBPdXRwdXRJZEVycm9yKFxyXG4gICAgXCJFcnJvciAtIFNlbGVjdE91dHB1dENsYXNzOiB1bmtub3duIG91dHB1dGlkIFwiICsgb3V0cHV0aWRcclxuICApXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUcmFuc2ZlcmFibGVPdXRwdXQgZXh0ZW5kcyBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlT3V0cHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcclxuXHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhmaWVsZHNbXCJvdXRwdXRcIl1bXCJfdHlwZUlEXCJdKVxyXG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZylcclxuICB9XHJcblxyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKFxyXG4gICAgICBieXRlcyxcclxuICAgICAgb2Zmc2V0LFxyXG4gICAgICBvZmZzZXQgKyBKVk1Db25zdGFudHMuQVNTRVRJRExFTlxyXG4gICAgKVxyXG4gICAgb2Zmc2V0ICs9IEpWTUNvbnN0YW50cy5BU1NFVElETEVOXHJcbiAgICBjb25zdCBvdXRwdXRpZDogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKVxyXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBbW91bnRPdXRwdXQgZXh0ZW5kcyBTdGFuZGFyZEFtb3VudE91dHB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQW1vdW50T3V0cHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFzc2V0SUQgQW4gYXNzZXRJRCB3aGljaCBpcyB3cmFwcGVkIGFyb3VuZCB0aGUgQnVmZmVyIG9mIHRoZSBPdXRwdXRcclxuICAgKi9cclxuICBtYWtlVHJhbnNmZXJhYmxlKGFzc2V0SUQ6IEJ1ZmZlcik6IFRyYW5zZmVyYWJsZU91dHB1dCB7XHJcbiAgICByZXR1cm4gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCB0aGlzKVxyXG4gIH1cclxuXHJcbiAgc2VsZWN0KGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogT3V0cHV0IHtcclxuICAgIHJldHVybiBTZWxlY3RPdXRwdXRDbGFzcyhpZCwgLi4uYXJncylcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBORlRPdXRwdXQgZXh0ZW5kcyBCYXNlTkZUT3V0cHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJORlRPdXRwdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBBbiBhc3NldElEIHdoaWNoIGlzIHdyYXBwZWQgYXJvdW5kIHRoZSBCdWZmZXIgb2YgdGhlIE91dHB1dFxyXG4gICAqL1xyXG4gIG1ha2VUcmFuc2ZlcmFibGUoYXNzZXRJRDogQnVmZmVyKTogVHJhbnNmZXJhYmxlT3V0cHV0IHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHRoaXMpXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBPdXRwdXQge1xyXG4gICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE91dHB1dCB0aGF0IGNhcnJpZXMgYW4gYW1tb3VudCBmb3IgYW4gYXNzZXRJRCBhbmQgdXNlcyBzZWNwMjU2azEgc2lnbmF0dXJlIHNjaGVtZS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTRUNQVHJhbnNmZXJPdXRwdXQgZXh0ZW5kcyBBbW91bnRPdXRwdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BUcmFuc2Zlck91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gSlZNQ29uc3RhbnRzLkxBVEVTVENPREVDXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxyXG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICA/IEpWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEXHJcbiAgICAgIDogSlZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSURfQ09ERUNPTkVcclxuXHJcbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGNvZGVjSURcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb2RlY0lEIFRoZSBjb2RlY0lEIHRvIHNldFxyXG4gICAqL1xyXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBpZiAoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBDb2RlY0lkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIFNFQ1BUcmFuc2Zlck91dHB1dC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXHJcbiAgICB0aGlzLl90eXBlSUQgPVxyXG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXHJcbiAgICAgICAgPyBKVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRFxyXG4gICAgICAgIDogSlZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSURfQ09ERUNPTkVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxyXG4gICAqL1xyXG4gIGdldE91dHB1dElEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgbmV3b3V0OiBTRUNQVHJhbnNmZXJPdXRwdXQgPSB0aGlzLmNyZWF0ZSgpXHJcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXHJcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBPdXRwdXQgdGhhdCBjYXJyaWVzIGFuIGFtbW91bnQgZm9yIGFuIGFzc2V0SUQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU0VDUE1pbnRPdXRwdXQgZXh0ZW5kcyBPdXRwdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BNaW50T3V0cHV0XCJcclxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBKVk1Db25zdGFudHMuTEFURVNUQ09ERUNcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XHJcbiAgICB0aGlzLl9jb2RlY0lEID09PSAwXHJcbiAgICAgID8gSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSURcclxuICAgICAgOiBKVk1Db25zdGFudHMuU0VDUE1JTlRPVVRQVVRJRF9DT0RFQ09ORVxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY29kZWNJRFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XHJcbiAgICovXHJcbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IENvZGVjSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gU0VDUE1pbnRPdXRwdXQuc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxyXG4gICAgdGhpcy5fdHlwZUlEID1cclxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICAgID8gSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSURcclxuICAgICAgICA6IEpWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEX0NPREVDT05FXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRJRCBmb3IgdGhpcyBvdXRwdXRcclxuICAgKi9cclxuICBnZXRPdXRwdXRJRCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBBbiBhc3NldElEIHdoaWNoIGlzIHdyYXBwZWQgYXJvdW5kIHRoZSBCdWZmZXIgb2YgdGhlIE91dHB1dFxyXG4gICAqL1xyXG4gIG1ha2VUcmFuc2ZlcmFibGUoYXNzZXRJRDogQnVmZmVyKTogVHJhbnNmZXJhYmxlT3V0cHV0IHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHRoaXMpXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgU0VDUE1pbnRPdXRwdXQoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdvdXQ6IFNFQ1BNaW50T3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxyXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBPdXRwdXQge1xyXG4gICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE91dHB1dCB0aGF0IGNhcnJpZXMgYW4gTkZUIE1pbnQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgTkZUTWludE91dHB1dCBleHRlbmRzIE5GVE91dHB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUTWludE91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gSlZNQ29uc3RhbnRzLkxBVEVTVENPREVDXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxyXG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICA/IEpWTUNvbnN0YW50cy5ORlRNSU5UT1VUUFVUSURcclxuICAgICAgOiBKVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEX0NPREVDT05FXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBjb2RlY0lEXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcclxuICAgKi9cclxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgaWYgKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBORlRNaW50T3V0cHV0LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSURcclxuICAgIHRoaXMuX3R5cGVJRCA9XHJcbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcclxuICAgICAgICA/IEpWTUNvbnN0YW50cy5ORlRNSU5UT1VUUFVUSURcclxuICAgICAgICA6IEpWTUNvbnN0YW50cy5ORlRNSU5UT1VUUFVUSURfQ09ERUNPTkVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxyXG4gICAqL1xyXG4gIGdldE91dHB1dElEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3V0cHV0XV0gYW5kIHJldHVybnMgdGhlIHNpemUgb2YgdGhlIG91dHB1dC5cclxuICAgKi9cclxuICBmcm9tQnVmZmVyKHV0eG9idWZmOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICB0aGlzLmdyb3VwSUQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHJldHVybiBzdXBlci5mcm9tQnVmZmVyKHV0eG9idWZmLCBvZmZzZXQpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPdXRwdXRdXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgbGV0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxyXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPSB0aGlzLmdyb3VwSUQubGVuZ3RoICsgc3VwZXJidWZmLmxlbmd0aFxyXG4gICAgbGV0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuZ3JvdXBJRCwgc3VwZXJidWZmXVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgTkZUTWludE91dHB1dCguLi5hcmdzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGNvbnN0IG5ld291dDogTkZUTWludE91dHB1dCA9IHRoaXMuY3JlYXRlKClcclxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBjb250YWlucyBhbiBORlQgbWludCBmb3IgYW4gYXNzZXRJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBncm91cElEIEEgbnVtYmVyIHNwZWNpZmllcyB0aGUgZ3JvdXAgdGhpcyBORlQgaXMgaXNzdWVkIHRvXHJcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgcmVwcmVzZW50aW5nICBhZGRyZXNzZXNcclxuICAgKiBAcGFyYW0gbG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGxvY2t0aW1lXHJcbiAgICogQHBhcmFtIHRocmVzaG9sZCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHRoZSB0aHJlc2hvbGQgbnVtYmVyIG9mIHNpZ25lcnMgcmVxdWlyZWQgdG8gc2lnbiB0aGUgdHJhbnNhY3Rpb25cclxuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBncm91cElEOiBudW1iZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhZGRyZXNzZXM6IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxyXG4gICAgbG9ja3RpbWU6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKGFkZHJlc3NlcywgbG9ja3RpbWUsIHRocmVzaG9sZClcclxuICAgIGlmICh0eXBlb2YgZ3JvdXBJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLmdyb3VwSUQud3JpdGVVSW50MzJCRShncm91cElELCAwKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE91dHB1dCB0aGF0IGNhcnJpZXMgYW4gTkZUIGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIE5GVFRyYW5zZmVyT3V0cHV0IGV4dGVuZHMgTkZUT3V0cHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJORlRUcmFuc2Zlck91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gSlZNQ29uc3RhbnRzLkxBVEVTVENPREVDXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxyXG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICA/IEpWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURcclxuICAgICAgOiBKVk1Db25zdGFudHMuTkZUWEZFUk9VVFBVVElEX0NPREVDT05FXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIHBheWxvYWQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICB0aGlzLnBheWxvYWQsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImhleFwiLFxyXG4gICAgICAgIHRoaXMucGF5bG9hZC5sZW5ndGhcclxuICAgICAgKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLnBheWxvYWQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcInBheWxvYWRcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImhleFwiLFxyXG4gICAgICBcIkJ1ZmZlclwiXHJcbiAgICApXHJcbiAgICB0aGlzLnNpemVQYXlsb2FkID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICB0aGlzLnNpemVQYXlsb2FkLndyaXRlVUludDMyQkUodGhpcy5wYXlsb2FkLmxlbmd0aCwgMClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBzaXplUGF5bG9hZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgcHJvdGVjdGVkIHBheWxvYWQ6IEJ1ZmZlclxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGNvZGVjSURcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb2RlY0lEIFRoZSBjb2RlY0lEIHRvIHNldFxyXG4gICAqL1xyXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBpZiAoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBDb2RlY0lkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIE5GVFRyYW5zZmVyT3V0cHV0LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSURcclxuICAgIHRoaXMuX3R5cGVJRCA9XHJcbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcclxuICAgICAgICA/IEpWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURcclxuICAgICAgICA6IEpWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURfQ09ERUNPTkVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxyXG4gICAqL1xyXG4gIGdldE91dHB1dElEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBjb250ZW50IG9ubHkuXHJcbiAgICovXHJcbiAgZ2V0UGF5bG9hZCA9ICgpOiBCdWZmZXIgPT4gYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBsZW5ndGggb2YgcGF5bG9hZCBwcmVwZW5kZWQuXHJcbiAgICovXHJcbiAgZ2V0UGF5bG9hZEJ1ZmZlciA9ICgpOiBCdWZmZXIgPT5cclxuICAgIEJ1ZmZlci5jb25jYXQoW1xyXG4gICAgICBiaW50b29scy5jb3B5RnJvbSh0aGlzLnNpemVQYXlsb2FkKSxcclxuICAgICAgYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkKVxyXG4gICAgXSlcclxuXHJcbiAgLyoqXHJcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPdXRwdXRdXSBhbmQgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgb3V0cHV0LlxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIodXR4b2J1ZmY6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMuZ3JvdXBJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKHV0eG9idWZmLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy5zaXplUGF5bG9hZCA9IGJpbnRvb2xzLmNvcHlGcm9tKHV0eG9idWZmLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBsZXQgcHNpemU6IG51bWJlciA9IHRoaXMuc2l6ZVBheWxvYWQucmVhZFVJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY29weUZyb20odXR4b2J1ZmYsIG9mZnNldCwgb2Zmc2V0ICsgcHNpemUpXHJcbiAgICBvZmZzZXQgPSBvZmZzZXQgKyBwc2l6ZVxyXG4gICAgcmV0dXJuIHN1cGVyLmZyb21CdWZmZXIodXR4b2J1ZmYsIG9mZnNldClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPdXRwdXRdXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cclxuICAgICAgdGhpcy5ncm91cElELmxlbmd0aCArXHJcbiAgICAgIHRoaXMuc2l6ZVBheWxvYWQubGVuZ3RoICtcclxuICAgICAgdGhpcy5wYXlsb2FkLmxlbmd0aCArXHJcbiAgICAgIHN1cGVyYnVmZi5sZW5ndGhcclxuICAgIHRoaXMuc2l6ZVBheWxvYWQud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKVxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXHJcbiAgICAgIHRoaXMuZ3JvdXBJRCxcclxuICAgICAgdGhpcy5zaXplUGF5bG9hZCxcclxuICAgICAgdGhpcy5wYXlsb2FkLFxyXG4gICAgICBzdXBlcmJ1ZmZcclxuICAgIF1cclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgbmV3b3V0OiBORlRUcmFuc2Zlck91dHB1dCA9IHRoaXMuY3JlYXRlKClcclxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICAgKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIE5GVCBvbiBhbiBhc3NldElELlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBncm91cElEIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgYW1vdW50IGluIHRoZSBvdXRwdXRcclxuICAgICAqIEBwYXJhbSBwYXlsb2FkIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgbWF4IGxlbmd0aCAxMDI0XHJcbiAgICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9cyByZXByZXNlbnRpbmcgYWRkcmVzc2VzXHJcbiAgICAgKiBAcGFyYW0gbG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGxvY2t0aW1lXHJcbiAgICAgKiBAcGFyYW0gdGhyZXNob2xkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgdGhlIHRocmVzaG9sZCBudW1iZXIgb2Ygc2lnbmVycyByZXF1aXJlZCB0byBzaWduIHRoZSB0cmFuc2FjdGlvblxyXG5cclxuICAgICAqL1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgZ3JvdXBJRDogbnVtYmVyID0gdW5kZWZpbmVkLFxyXG4gICAgcGF5bG9hZDogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGxvY2t0aW1lOiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcihhZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpXHJcbiAgICBpZiAodHlwZW9mIGdyb3VwSUQgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIHBheWxvYWQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy5ncm91cElELndyaXRlVUludDMyQkUoZ3JvdXBJRCwgMClcclxuICAgICAgdGhpcy5zaXplUGF5bG9hZC53cml0ZVVJbnQzMkJFKHBheWxvYWQubGVuZ3RoLCAwKVxyXG4gICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5jb3B5RnJvbShwYXlsb2FkLCAwLCBwYXlsb2FkLmxlbmd0aClcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19