"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOID = exports.NFTTransferOperation = exports.NFTMintOperation = exports.SECPMintOperation = exports.TransferableOperation = exports.Operation = exports.SelectOperationClass = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-Operations
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const nbytes_1 = require("../../common/nbytes");
const credentials_1 = require("../../common/credentials");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const cb58 = "cb58";
const buffer = "Buffer";
const hex = "hex";
const decimalString = "decimalString";
/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
const SelectOperationClass = (opid, ...args) => {
    if (opid === constants_1.JVMConstants.SECPMINTOPID ||
        opid === constants_1.JVMConstants.SECPMINTOPID_CODECONE) {
        return new SECPMintOperation(...args);
    }
    else if (opid === constants_1.JVMConstants.NFTMINTOPID ||
        opid === constants_1.JVMConstants.NFTMINTOPID_CODECONE) {
        return new NFTMintOperation(...args);
    }
    else if (opid === constants_1.JVMConstants.NFTXFEROPID ||
        opid === constants_1.JVMConstants.NFTXFEROPID_CODECONE) {
        return new NFTTransferOperation(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.InvalidOperationIdError(`Error - SelectOperationClass: unknown opid ${opid}`);
};
exports.SelectOperationClass = SelectOperationClass;
/**
 * A class representing an operation. All operation types must extend on this class.
 */
class Operation extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "Operation";
        this._typeID = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of signers from utxo
        /**
         * Returns the array of [[SigIdx]] for this [[Operation]]
         */
        this.getSigIdxs = () => this.sigIdxs;
        /**
         * Creates and adds a [[SigIdx]] to the [[Operation]].
         *
         * @param addressIdx The index of the address to reference in the signatures
         * @param address The address of the source of the signature
         */
        this.addSignatureIdx = (addressIdx, address) => {
            const sigidx = new credentials_1.SigIdx();
            const b = buffer_1.Buffer.alloc(4);
            b.writeUInt32BE(addressIdx, 0);
            sigidx.fromBuffer(b);
            sigidx.setSource(address);
            this.sigIdxs.push(sigidx);
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sigIdxs: this.sigIdxs.map((s) => s.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigIdxs = fields["sigIdxs"].map((s) => {
            let sidx = new credentials_1.SigIdx();
            sidx.deserialize(s, encoding);
            return sidx;
        });
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    fromBuffer(bytes, offset = 0) {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const sigCount = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for (let i = 0; i < sigCount; i++) {
            const sigidx = new credentials_1.SigIdx();
            const sigbuff = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }
    toBuffer() {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize = this.sigCount.length;
        const barr = [this.sigCount];
        for (let i = 0; i < this.sigIdxs.length; i++) {
            const b = this.sigIdxs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.Operation = Operation;
Operation.comparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOperationID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOperationID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
/**
 * A class which contains an [[Operation]] for transfers.
 *
 */
class TransferableOperation extends serialization_1.Serializable {
    constructor(assetID = undefined, utxoids = undefined, operation = undefined) {
        super();
        this._typeName = "TransferableOperation";
        this._typeID = undefined;
        this.assetID = buffer_1.Buffer.alloc(32);
        this.utxoIDs = [];
        /**
         * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAssetID = () => this.assetID;
        /**
         * Returns an array of UTXOIDs in this operation.
         */
        this.getUTXOIDs = () => this.utxoIDs;
        /**
         * Returns the operation
         */
        this.getOperation = () => this.operation;
        if (typeof assetID !== "undefined" &&
            assetID.length === constants_1.JVMConstants.ASSETIDLEN &&
            operation instanceof Operation &&
            typeof utxoids !== "undefined" &&
            Array.isArray(utxoids)) {
            this.assetID = assetID;
            this.operation = operation;
            for (let i = 0; i < utxoids.length; i++) {
                const utxoid = new UTXOID();
                if (typeof utxoids[`${i}`] === "string") {
                    utxoid.fromString(utxoids[`${i}`]);
                }
                else if (utxoids[`${i}`] instanceof buffer_1.Buffer) {
                    utxoid.fromBuffer(utxoids[`${i}`]);
                }
                else if (utxoids[`${i}`] instanceof UTXOID) {
                    utxoid.fromString(utxoids[`${i}`].toString()); // clone
                }
                this.utxoIDs.push(utxoid);
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { assetID: serialization.encoder(this.assetID, encoding, buffer, cb58, 32), utxoIDs: this.utxoIDs.map((u) => u.serialize(encoding)), operation: this.operation.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.assetID = serialization.decoder(fields["assetID"], encoding, cb58, buffer, 32);
        this.utxoIDs = fields["utxoIDs"].map((u) => {
            let utxoid = new UTXOID();
            utxoid.deserialize(u, encoding);
            return utxoid;
        });
        this.operation = (0, exports.SelectOperationClass)(fields["operation"]["_typeID"]);
        this.operation.deserialize(fields["operation"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const numutxoIDs = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.utxoIDs = [];
        for (let i = 0; i < numutxoIDs; i++) {
            const utxoid = new UTXOID();
            offset = utxoid.fromBuffer(bytes, offset);
            this.utxoIDs.push(utxoid);
        }
        const opid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.operation = (0, exports.SelectOperationClass)(opid);
        return this.operation.fromBuffer(bytes, offset);
    }
    toBuffer() {
        const numutxoIDs = buffer_1.Buffer.alloc(4);
        numutxoIDs.writeUInt32BE(this.utxoIDs.length, 0);
        let bsize = this.assetID.length + numutxoIDs.length;
        const barr = [this.assetID, numutxoIDs];
        this.utxoIDs = this.utxoIDs.sort(UTXOID.comparator());
        for (let i = 0; i < this.utxoIDs.length; i++) {
            const b = this.utxoIDs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        const opid = buffer_1.Buffer.alloc(4);
        opid.writeUInt32BE(this.operation.getOperationID(), 0);
        barr.push(opid);
        bsize += opid.length;
        const b = this.operation.toBuffer();
        bsize += b.length;
        barr.push(b);
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.TransferableOperation = TransferableOperation;
/**
 * Returns a function used to sort an array of [[TransferableOperation]]s
 */
TransferableOperation.comparator = () => {
    return function (a, b) {
        return buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
    };
};
/**
 * An [[Operation]] class which specifies a SECP256k1 Mint Op.
 */
class SECPMintOperation extends Operation {
    /**
     * An [[Operation]] class which mints new tokens on an assetID.
     *
     * @param mintOutput The [[SECPMintOutput]] that will be produced by this transaction.
     * @param transferOutput A [[SECPTransferOutput]] that will be produced from this minting operation.
     */
    constructor(mintOutput = undefined, transferOutput = undefined) {
        super();
        this._typeName = "SECPMintOperation";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.SECPMINTOPID
            : constants_1.JVMConstants.SECPMINTOPID_CODECONE;
        this.mintOutput = undefined;
        this.transferOutput = undefined;
        if (typeof mintOutput !== "undefined") {
            this.mintOutput = mintOutput;
        }
        if (typeof transferOutput !== "undefined") {
            this.transferOutput = transferOutput;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { mintOutput: this.mintOutput.serialize(encoding), transferOutputs: this.transferOutput.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.mintOutput = new outputs_1.SECPMintOutput();
        this.mintOutput.deserialize(fields["mintOutput"], encoding);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        this.transferOutput.deserialize(fields["transferOutputs"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - SECPMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.SECPMINTOPID
                : constants_1.JVMConstants.SECPMINTOPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.JVMConstants.SECPCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.JVMConstants.SECPCREDENTIAL_CODECONE;
        }
    }
    /**
     * Returns the [[SECPMintOutput]] to be produced by this operation.
     */
    getMintOutput() {
        return this.mintOutput;
    }
    /**
     * Returns [[SECPTransferOutput]] to be produced by this operation.
     */
    getTransferOutput() {
        return this.transferOutput;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SECPMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.mintOutput = new outputs_1.SECPMintOutput();
        offset = this.mintOutput.fromBuffer(bytes, offset);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        offset = this.transferOutput.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns the buffer representing the [[SECPMintOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const mintoutBuff = this.mintOutput.toBuffer();
        const transferOutBuff = this.transferOutput.toBuffer();
        const bsize = superbuff.length + mintoutBuff.length + transferOutBuff.length;
        const barr = [superbuff, mintoutBuff, transferOutBuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.SECPMintOperation = SECPMintOperation;
/**
 * An [[Operation]] class which specifies a NFT Mint Op.
 */
class NFTMintOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param groupID The group to which to issue the NFT Output
     * @param payload A {@link https://github.com/feross/buffer|Buffer} of the NFT payload
     * @param outputOwners An array of outputOwners
     */
    constructor(groupID = undefined, payload = undefined, outputOwners = undefined) {
        super();
        this._typeName = "NFTMintOperation";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.NFTMINTOPID
            : constants_1.JVMConstants.NFTMINTOPID_CODECONE;
        this.groupID = buffer_1.Buffer.alloc(4);
        this.outputOwners = [];
        /**
         * Returns the credential ID.
         */
        this.getCredentialID = () => {
            if (this._codecID === 0) {
                return constants_1.JVMConstants.NFTCREDENTIAL;
            }
            else if (this._codecID === 1) {
                return constants_1.JVMConstants.NFTCREDENTIAL_CODECONE;
            }
        };
        /**
         * Returns the payload.
         */
        this.getGroupID = () => {
            return bintools.copyFrom(this.groupID, 0);
        };
        /**
         * Returns the payload.
         */
        this.getPayload = () => {
            return bintools.copyFrom(this.payload, 0);
        };
        /**
         * Returns the payload's raw {@link https://github.com/feross/buffer|Buffer} with length prepended, for use with [[PayloadBase]]'s fromBuffer
         */
        this.getPayloadBuffer = () => {
            let payloadlen = buffer_1.Buffer.alloc(4);
            payloadlen.writeUInt32BE(this.payload.length, 0);
            return buffer_1.Buffer.concat([payloadlen, bintools.copyFrom(this.payload, 0)]);
        };
        /**
         * Returns the outputOwners.
         */
        this.getOutputOwners = () => {
            return this.outputOwners;
        };
        if (typeof groupID !== "undefined" &&
            typeof payload !== "undefined" &&
            outputOwners.length) {
            this.groupID.writeUInt32BE(groupID ? groupID : 0, 0);
            this.payload = payload;
            this.outputOwners = outputOwners;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { groupID: serialization.encoder(this.groupID, encoding, buffer, decimalString, 4), payload: serialization.encoder(this.payload, encoding, buffer, hex), outputOwners: this.outputOwners.map((o) => o.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.groupID = serialization.decoder(fields["groupID"], encoding, decimalString, buffer, 4);
        this.payload = serialization.decoder(fields["payload"], encoding, hex, buffer);
        // this.outputOwners = fields["outputOwners"].map((o: NFTMintOutput) => {
        //   let oo: NFTMintOutput = new NFTMintOutput()
        //   oo.deserialize(o, encoding)
        //   return oo
        // })
        this.outputOwners = fields["outputOwners"].map((o) => {
            let oo = new output_1.OutputOwners();
            oo.deserialize(o, encoding);
            return oo;
        });
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.NFTMINTOPID
                : constants_1.JVMConstants.NFTMINTOPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.groupID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let payloadLen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(bytes, offset, offset + payloadLen);
        offset += payloadLen;
        let numoutputs = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.outputOwners = [];
        for (let i = 0; i < numoutputs; i++) {
            let outputOwner = new output_1.OutputOwners();
            offset = outputOwner.fromBuffer(bytes, offset);
            this.outputOwners.push(outputOwner);
        }
        return offset;
    }
    /**
     * Returns the buffer representing the [[NFTMintOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const payloadlen = buffer_1.Buffer.alloc(4);
        payloadlen.writeUInt32BE(this.payload.length, 0);
        const outputownerslen = buffer_1.Buffer.alloc(4);
        outputownerslen.writeUInt32BE(this.outputOwners.length, 0);
        let bsize = superbuff.length +
            this.groupID.length +
            payloadlen.length +
            this.payload.length +
            outputownerslen.length;
        const barr = [
            superbuff,
            this.groupID,
            payloadlen,
            this.payload,
            outputownerslen
        ];
        for (let i = 0; i < this.outputOwners.length; i++) {
            let b = this.outputOwners[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTMintOperation = NFTMintOperation;
/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
class NFTTransferOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param output An [[NFTTransferOutput]]
     */
    constructor(output = undefined) {
        super();
        this._typeName = "NFTTransferOperation";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.NFTXFEROPID
            : constants_1.JVMConstants.NFTXFEROPID_CODECONE;
        this.getOutput = () => this.output;
        if (typeof output !== "undefined") {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { output: this.output.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = new outputs_1.NFTTransferOutput();
        this.output.deserialize(fields["output"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTTransferOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.NFTXFEROPID
                : constants_1.JVMConstants.NFTXFEROPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.JVMConstants.NFTCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.JVMConstants.NFTCREDENTIAL_CODECONE;
        }
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.output = new outputs_1.NFTTransferOutput();
        return this.output.fromBuffer(bytes, offset);
    }
    /**
     * Returns the buffer representing the [[NFTTransferOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const outbuff = this.output.toBuffer();
        const bsize = superbuff.length + outbuff.length;
        const barr = [superbuff, outbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTTransferOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTTransferOperation = NFTTransferOperation;
/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
class UTXOID extends nbytes_1.NBytes {
    /**
     * Class for representing a UTXOID used in [[TransferableOp]] types
     */
    constructor() {
        super();
        this._typeName = "UTXOID";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(36);
        this.bsize = 36;
    }
    /**
     * Returns a base-58 representation of the [[UTXOID]].
     */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    /**
     * Takes a base-58 string containing an [[UTXOID]], parses it, populates the class, and returns the length of the UTXOID in bytes.
     *
     * @param bytes A base-58 string containing a raw [[UTXOID]]
     *
     * @returns The length of the raw [[UTXOID]]
     */
    fromString(utxoid) {
        const utxoidbuff = bintools.b58ToBuffer(utxoid);
        if (utxoidbuff.length === 40 && bintools.validateChecksum(utxoidbuff)) {
            const newbuff = bintools.copyFrom(utxoidbuff, 0, utxoidbuff.length - 4);
            if (newbuff.length === 36) {
                this.bytes = newbuff;
            }
        }
        else if (utxoidbuff.length === 40) {
            throw new errors_1.ChecksumError("Error - UTXOID.fromString: invalid checksum on address");
        }
        else if (utxoidbuff.length === 36) {
            this.bytes = utxoidbuff;
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.AddressError("Error - UTXOID.fromString: invalid address");
        }
        return this.getSize();
    }
    clone() {
        const newbase = new UTXOID();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new UTXOID();
    }
}
exports.UTXOID = UTXOID;
/**
 * Returns a function used to sort an array of [[UTXOID]]s
 */
UTXOID.comparator = () => (a, b) => buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvanZtL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUEwQztBQUMxQyx1Q0FJa0I7QUFDbEIsZ0RBQTRDO0FBQzVDLDBEQUFpRDtBQUNqRCxnREFBa0Q7QUFDbEQsNkRBS2tDO0FBQ2xDLCtDQUsyQjtBQUUzQixNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2hFLE1BQU0sSUFBSSxHQUFtQixNQUFNLENBQUE7QUFDbkMsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUN2QyxNQUFNLEdBQUcsR0FBbUIsS0FBSyxDQUFBO0FBQ2pDLE1BQU0sYUFBYSxHQUFtQixlQUFlLENBQUE7QUFFckQ7Ozs7OztHQU1HO0FBQ0ksTUFBTSxvQkFBb0IsR0FBRyxDQUNsQyxJQUFZLEVBQ1osR0FBRyxJQUFXLEVBQ0gsRUFBRTtJQUNiLElBQ0UsSUFBSSxLQUFLLHdCQUFZLENBQUMsWUFBWTtRQUNsQyxJQUFJLEtBQUssd0JBQVksQ0FBQyxxQkFBcUIsRUFDM0M7UUFDQSxPQUFPLElBQUksaUJBQWlCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUN0QztTQUFNLElBQ0wsSUFBSSxLQUFLLHdCQUFZLENBQUMsV0FBVztRQUNqQyxJQUFJLEtBQUssd0JBQVksQ0FBQyxvQkFBb0IsRUFDMUM7UUFDQSxPQUFPLElBQUksZ0JBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNyQztTQUFNLElBQ0wsSUFBSSxLQUFLLHdCQUFZLENBQUMsV0FBVztRQUNqQyxJQUFJLEtBQUssd0JBQVksQ0FBQyxvQkFBb0IsRUFDMUM7UUFDQSxPQUFPLElBQUksb0JBQW9C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QUUsQ0FBQTtJQUN2QixDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sT0FBTyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUE7UUFDcEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNuQyxPQUFPLE9BQWUsQ0FBQTtJQUN4QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksTUFBTSxFQUFVLENBQUE7SUFDN0IsQ0FBQzs7QUEvREgsd0JBdUVDO0FBOURDOztHQUVHO0FBQ0ksaUJBQVUsR0FDZixHQUEyQyxFQUFFLENBQzdDLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBYyxFQUFFLENBQ25DLGVBQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBZSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1KVk0tT3BlcmF0aW9uc1xyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHsgSlZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcclxuaW1wb3J0IHtcclxuICBORlRUcmFuc2Zlck91dHB1dCxcclxuICBTRUNQTWludE91dHB1dCxcclxuICBTRUNQVHJhbnNmZXJPdXRwdXRcclxufSBmcm9tIFwiLi9vdXRwdXRzXCJcclxuaW1wb3J0IHsgTkJ5dGVzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9uYnl0ZXNcIlxyXG5pbXBvcnQgeyBTaWdJZHggfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IHsgT3V0cHV0T3duZXJzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxyXG5pbXBvcnQge1xyXG4gIFNlcmlhbGl6YWJsZSxcclxuICBTZXJpYWxpemF0aW9uLFxyXG4gIFNlcmlhbGl6ZWRFbmNvZGluZyxcclxuICBTZXJpYWxpemVkVHlwZVxyXG59IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHtcclxuICBJbnZhbGlkT3BlcmF0aW9uSWRFcnJvcixcclxuICBDb2RlY0lkRXJyb3IsXHJcbiAgQ2hlY2tzdW1FcnJvcixcclxuICBBZGRyZXNzRXJyb3JcclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBjYjU4OiBTZXJpYWxpemVkVHlwZSA9IFwiY2I1OFwiXHJcbmNvbnN0IGJ1ZmZlcjogU2VyaWFsaXplZFR5cGUgPSBcIkJ1ZmZlclwiXHJcbmNvbnN0IGhleDogU2VyaWFsaXplZFR5cGUgPSBcImhleFwiXHJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIFtbT3BlcmF0aW9uXV0gaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSBvcGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgb3BlcmF0aW9uIElEIHBhcnNlZCBwcmlvciB0byB0aGUgYnl0ZXMgcGFzc2VkIGluXHJcbiAqXHJcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbT3BlcmF0aW9uXV0tZXh0ZW5kZWQgY2xhc3MuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgU2VsZWN0T3BlcmF0aW9uQ2xhc3MgPSAoXHJcbiAgb3BpZDogbnVtYmVyLFxyXG4gIC4uLmFyZ3M6IGFueVtdXHJcbik6IE9wZXJhdGlvbiA9PiB7XHJcbiAgaWYgKFxyXG4gICAgb3BpZCA9PT0gSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRCB8fFxyXG4gICAgb3BpZCA9PT0gSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRF9DT0RFQ09ORVxyXG4gICkge1xyXG4gICAgcmV0dXJuIG5ldyBTRUNQTWludE9wZXJhdGlvbiguLi5hcmdzKVxyXG4gIH0gZWxzZSBpZiAoXHJcbiAgICBvcGlkID09PSBKVk1Db25zdGFudHMuTkZUTUlOVE9QSUQgfHxcclxuICAgIG9waWQgPT09IEpWTUNvbnN0YW50cy5ORlRNSU5UT1BJRF9DT0RFQ09ORVxyXG4gICkge1xyXG4gICAgcmV0dXJuIG5ldyBORlRNaW50T3BlcmF0aW9uKC4uLmFyZ3MpXHJcbiAgfSBlbHNlIGlmIChcclxuICAgIG9waWQgPT09IEpWTUNvbnN0YW50cy5ORlRYRkVST1BJRCB8fFxyXG4gICAgb3BpZCA9PT0gSlZNQ29uc3RhbnRzLk5GVFhGRVJPUElEX0NPREVDT05FXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gbmV3IE5GVFRyYW5zZmVyT3BlcmF0aW9uKC4uLmFyZ3MpXHJcbiAgfVxyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgdGhyb3cgbmV3IEludmFsaWRPcGVyYXRpb25JZEVycm9yKFxyXG4gICAgYEVycm9yIC0gU2VsZWN0T3BlcmF0aW9uQ2xhc3M6IHVua25vd24gb3BpZCAke29waWR9YFxyXG4gIClcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgY2xhc3MgcmVwcmVzZW50aW5nIGFuIG9wZXJhdGlvbi4gQWxsIG9wZXJhdGlvbiB0eXBlcyBtdXN0IGV4dGVuZCBvbiB0aGlzIGNsYXNzLlxyXG4gKi9cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE9wZXJhdGlvbiBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiT3BlcmF0aW9uXCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBzaWdJZHhzOiB0aGlzLnNpZ0lkeHMubWFwKChzOiBTaWdJZHgpOiBvYmplY3QgPT4gcy5zZXJpYWxpemUoZW5jb2RpbmcpKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLnNpZ0lkeHMgPSBmaWVsZHNbXCJzaWdJZHhzXCJdLm1hcCgoczogb2JqZWN0KTogU2lnSWR4ID0+IHtcclxuICAgICAgbGV0IHNpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxyXG4gICAgICBzaWR4LmRlc2VyaWFsaXplKHMsIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gc2lkeFxyXG4gICAgfSlcclxuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHNpZ0NvdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgc2lnSWR4czogU2lnSWR4W10gPSBbXSAvLyBpZHhzIG9mIHNpZ25lcnMgZnJvbSB1dHhvXHJcblxyXG4gIHN0YXRpYyBjb21wYXJhdG9yID1cclxuICAgICgpOiAoKGE6IE9wZXJhdGlvbiwgYjogT3BlcmF0aW9uKSA9PiAxIHwgLTEgfCAwKSA9PlxyXG4gICAgKGE6IE9wZXJhdGlvbiwgYjogT3BlcmF0aW9uKTogMSB8IC0xIHwgMCA9PiB7XHJcbiAgICAgIGNvbnN0IGFvdXRpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICAgIGFvdXRpZC53cml0ZVVJbnQzMkJFKGEuZ2V0T3BlcmF0aW9uSUQoKSwgMClcclxuICAgICAgY29uc3QgYWJ1ZmY6IEJ1ZmZlciA9IGEudG9CdWZmZXIoKVxyXG5cclxuICAgICAgY29uc3QgYm91dGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgICAgYm91dGlkLndyaXRlVUludDMyQkUoYi5nZXRPcGVyYXRpb25JRCgpLCAwKVxyXG4gICAgICBjb25zdCBiYnVmZjogQnVmZmVyID0gYi50b0J1ZmZlcigpXHJcblxyXG4gICAgICBjb25zdCBhc29ydDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChcclxuICAgICAgICBbYW91dGlkLCBhYnVmZl0sXHJcbiAgICAgICAgYW91dGlkLmxlbmd0aCArIGFidWZmLmxlbmd0aFxyXG4gICAgICApXHJcbiAgICAgIGNvbnN0IGJzb3J0OiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KFxyXG4gICAgICAgIFtib3V0aWQsIGJidWZmXSxcclxuICAgICAgICBib3V0aWQubGVuZ3RoICsgYmJ1ZmYubGVuZ3RoXHJcbiAgICAgIClcclxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGFzb3J0LCBic29ydCkgYXMgMSB8IC0xIHwgMFxyXG4gICAgfVxyXG5cclxuICBhYnN0cmFjdCBnZXRPcGVyYXRpb25JRCgpOiBudW1iZXJcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW09wZXJhdGlvbl1dXHJcbiAgICovXHJcbiAgZ2V0U2lnSWR4cyA9ICgpOiBTaWdJZHhbXSA9PiB0aGlzLnNpZ0lkeHNcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3JlZGVudGlhbCBJRC5cclxuICAgKi9cclxuICBhYnN0cmFjdCBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBbW1NpZ0lkeF1dIHRvIHRoZSBbW09wZXJhdGlvbl1dLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFkZHJlc3NJZHggVGhlIGluZGV4IG9mIHRoZSBhZGRyZXNzIHRvIHJlZmVyZW5jZSBpbiB0aGUgc2lnbmF0dXJlc1xyXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBzb3VyY2Ugb2YgdGhlIHNpZ25hdHVyZVxyXG4gICAqL1xyXG4gIGFkZFNpZ25hdHVyZUlkeCA9IChhZGRyZXNzSWR4OiBudW1iZXIsIGFkZHJlc3M6IEJ1ZmZlcikgPT4ge1xyXG4gICAgY29uc3Qgc2lnaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcclxuICAgIGNvbnN0IGI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgYi53cml0ZVVJbnQzMkJFKGFkZHJlc3NJZHgsIDApXHJcbiAgICBzaWdpZHguZnJvbUJ1ZmZlcihiKVxyXG4gICAgc2lnaWR4LnNldFNvdXJjZShhZGRyZXNzKVxyXG4gICAgdGhpcy5zaWdJZHhzLnB1c2goc2lnaWR4KVxyXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXHJcbiAgfVxyXG5cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICB0aGlzLnNpZ0NvdW50ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICBjb25zdCBzaWdDb3VudDogbnVtYmVyID0gdGhpcy5zaWdDb3VudC5yZWFkVUludDMyQkUoMClcclxuICAgIHRoaXMuc2lnSWR4cyA9IFtdXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2lnQ291bnQ7IGkrKykge1xyXG4gICAgICBjb25zdCBzaWdpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxyXG4gICAgICBjb25zdCBzaWdidWZmOiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICBzaWdpZHguZnJvbUJ1ZmZlcihzaWdidWZmKVxyXG4gICAgICBvZmZzZXQgKz0gNFxyXG4gICAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHRoaXMuc2lnQ291bnQubGVuZ3RoXHJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0aGlzLnNpZ0NvdW50XVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuc2lnSWR4cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSB0aGlzLnNpZ0lkeHNbYCR7aX1gXS50b0J1ZmZlcigpXHJcbiAgICAgIGJhcnIucHVzaChiKVxyXG4gICAgICBic2l6ZSArPSBiLmxlbmd0aFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXS5cclxuICAgKi9cclxuICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIFtbT3BlcmF0aW9uXV0gZm9yIHRyYW5zZmVycy5cclxuICpcclxuICovXHJcbmV4cG9ydCBjbGFzcyBUcmFuc2ZlcmFibGVPcGVyYXRpb24gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlRyYW5zZmVyYWJsZU9wZXJhdGlvblwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgYXNzZXRJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRJRCwgZW5jb2RpbmcsIGJ1ZmZlciwgY2I1OCwgMzIpLFxyXG4gICAgICB1dHhvSURzOiB0aGlzLnV0eG9JRHMubWFwKCh1KSA9PiB1LnNlcmlhbGl6ZShlbmNvZGluZykpLFxyXG4gICAgICBvcGVyYXRpb246IHRoaXMub3BlcmF0aW9uLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5hc3NldElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJhc3NldElEXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgY2I1OCxcclxuICAgICAgYnVmZmVyLFxyXG4gICAgICAzMlxyXG4gICAgKVxyXG4gICAgdGhpcy51dHhvSURzID0gZmllbGRzW1widXR4b0lEc1wiXS5tYXAoKHU6IG9iamVjdCkgPT4ge1xyXG4gICAgICBsZXQgdXR4b2lkOiBVVFhPSUQgPSBuZXcgVVRYT0lEKClcclxuICAgICAgdXR4b2lkLmRlc2VyaWFsaXplKHUsIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gdXR4b2lkXHJcbiAgICB9KVxyXG4gICAgdGhpcy5vcGVyYXRpb24gPSBTZWxlY3RPcGVyYXRpb25DbGFzcyhmaWVsZHNbXCJvcGVyYXRpb25cIl1bXCJfdHlwZUlEXCJdKVxyXG4gICAgdGhpcy5vcGVyYXRpb24uZGVzZXJpYWxpemUoZmllbGRzW1wib3BlcmF0aW9uXCJdLCBlbmNvZGluZylcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhc3NldElEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXHJcbiAgcHJvdGVjdGVkIHV0eG9JRHM6IFVUWE9JRFtdID0gW11cclxuICBwcm90ZWN0ZWQgb3BlcmF0aW9uOiBPcGVyYXRpb25cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZU9wZXJhdGlvbl1dc1xyXG4gICAqL1xyXG4gIHN0YXRpYyBjb21wYXJhdG9yID0gKCk6ICgoXHJcbiAgICBhOiBUcmFuc2ZlcmFibGVPcGVyYXRpb24sXHJcbiAgICBiOiBUcmFuc2ZlcmFibGVPcGVyYXRpb25cclxuICApID0+IDEgfCAtMSB8IDApID0+IHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoXHJcbiAgICAgIGE6IFRyYW5zZmVyYWJsZU9wZXJhdGlvbixcclxuICAgICAgYjogVHJhbnNmZXJhYmxlT3BlcmF0aW9uXHJcbiAgICApOiAxIHwgLTEgfCAwIHtcclxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGEudG9CdWZmZXIoKSwgYi50b0J1ZmZlcigpKSBhcyAxIHwgLTEgfCAwXHJcbiAgICB9XHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFzc2V0SUQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cclxuICAgKi9cclxuICBnZXRBc3NldElEID0gKCk6IEJ1ZmZlciA9PiB0aGlzLmFzc2V0SURcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBVVFhPSURzIGluIHRoaXMgb3BlcmF0aW9uLlxyXG4gICAqL1xyXG4gIGdldFVUWE9JRHMgPSAoKTogVVRYT0lEW10gPT4gdGhpcy51dHhvSURzXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvblxyXG4gICAqL1xyXG4gIGdldE9wZXJhdGlvbiA9ICgpOiBPcGVyYXRpb24gPT4gdGhpcy5vcGVyYXRpb25cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXHJcbiAgICBvZmZzZXQgKz0gMzJcclxuICAgIGNvbnN0IG51bXV0eG9JRHM6IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICAucmVhZFVJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy51dHhvSURzID0gW11cclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW11dHhvSURzOyBpKyspIHtcclxuICAgICAgY29uc3QgdXR4b2lkOiBVVFhPSUQgPSBuZXcgVVRYT0lEKClcclxuICAgICAgb2Zmc2V0ID0gdXR4b2lkLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgICAgdGhpcy51dHhvSURzLnB1c2godXR4b2lkKVxyXG4gICAgfVxyXG4gICAgY29uc3Qgb3BpZDogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLm9wZXJhdGlvbiA9IFNlbGVjdE9wZXJhdGlvbkNsYXNzKG9waWQpXHJcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRpb24uZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gIH1cclxuXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IG51bXV0eG9JRHMgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIG51bXV0eG9JRHMud3JpdGVVSW50MzJCRSh0aGlzLnV0eG9JRHMubGVuZ3RoLCAwKVxyXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPSB0aGlzLmFzc2V0SUQubGVuZ3RoICsgbnVtdXR4b0lEcy5sZW5ndGhcclxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuYXNzZXRJRCwgbnVtdXR4b0lEc11cclxuICAgIHRoaXMudXR4b0lEcyA9IHRoaXMudXR4b0lEcy5zb3J0KFVUWE9JRC5jb21wYXJhdG9yKCkpXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy51dHhvSURzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMudXR4b0lEc1tgJHtpfWBdLnRvQnVmZmVyKClcclxuICAgICAgYmFyci5wdXNoKGIpXHJcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXHJcbiAgICB9XHJcbiAgICBjb25zdCBvcGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIG9waWQud3JpdGVVSW50MzJCRSh0aGlzLm9wZXJhdGlvbi5nZXRPcGVyYXRpb25JRCgpLCAwKVxyXG4gICAgYmFyci5wdXNoKG9waWQpXHJcbiAgICBic2l6ZSArPSBvcGlkLmxlbmd0aFxyXG4gICAgY29uc3QgYjogQnVmZmVyID0gdGhpcy5vcGVyYXRpb24udG9CdWZmZXIoKVxyXG4gICAgYnNpemUgKz0gYi5sZW5ndGhcclxuICAgIGJhcnIucHVzaChiKVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIHV0eG9pZHM6IFVUWE9JRFtdIHwgc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIG9wZXJhdGlvbjogT3BlcmF0aW9uID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICBpZiAoXHJcbiAgICAgIHR5cGVvZiBhc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgIGFzc2V0SUQubGVuZ3RoID09PSBKVk1Db25zdGFudHMuQVNTRVRJRExFTiAmJlxyXG4gICAgICBvcGVyYXRpb24gaW5zdGFuY2VvZiBPcGVyYXRpb24gJiZcclxuICAgICAgdHlwZW9mIHV0eG9pZHMgIT09IFwidW5kZWZpbmVkXCIgJiZcclxuICAgICAgQXJyYXkuaXNBcnJheSh1dHhvaWRzKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuYXNzZXRJRCA9IGFzc2V0SURcclxuICAgICAgdGhpcy5vcGVyYXRpb24gPSBvcGVyYXRpb25cclxuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9pZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB1dHhvaWQ6IFVUWE9JRCA9IG5ldyBVVFhPSUQoKVxyXG4gICAgICAgIGlmICh0eXBlb2YgdXR4b2lkc1tgJHtpfWBdID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICB1dHhvaWQuZnJvbVN0cmluZyh1dHhvaWRzW2Ake2l9YF0gYXMgc3RyaW5nKVxyXG4gICAgICAgIH0gZWxzZSBpZiAodXR4b2lkc1tgJHtpfWBdIGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICAgICAgICB1dHhvaWQuZnJvbUJ1ZmZlcih1dHhvaWRzW2Ake2l9YF0gYXMgQnVmZmVyKVxyXG4gICAgICAgIH0gZWxzZSBpZiAodXR4b2lkc1tgJHtpfWBdIGluc3RhbmNlb2YgVVRYT0lEKSB7XHJcbiAgICAgICAgICB1dHhvaWQuZnJvbVN0cmluZyh1dHhvaWRzW2Ake2l9YF0udG9TdHJpbmcoKSkgLy8gY2xvbmVcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51dHhvSURzLnB1c2godXR4b2lkKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQW4gW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYSBTRUNQMjU2azEgTWludCBPcC5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTRUNQTWludE9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUE1pbnRPcGVyYXRpb25cIlxyXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEpWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xyXG4gIHByb3RlY3RlZCBfdHlwZUlEID1cclxuICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcclxuICAgICAgPyBKVk1Db25zdGFudHMuU0VDUE1JTlRPUElEXHJcbiAgICAgIDogSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRF9DT0RFQ09ORVxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBtaW50T3V0cHV0OiB0aGlzLm1pbnRPdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKSxcclxuICAgICAgdHJhbnNmZXJPdXRwdXRzOiB0aGlzLnRyYW5zZmVyT3V0cHV0LnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5taW50T3V0cHV0ID0gbmV3IFNFQ1BNaW50T3V0cHV0KClcclxuICAgIHRoaXMubWludE91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJtaW50T3V0cHV0XCJdLCBlbmNvZGluZylcclxuICAgIHRoaXMudHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KClcclxuICAgIHRoaXMudHJhbnNmZXJPdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1widHJhbnNmZXJPdXRwdXRzXCJdLCBlbmNvZGluZylcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBtaW50T3V0cHV0OiBTRUNQTWludE91dHB1dCA9IHVuZGVmaW5lZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zlck91dHB1dDogU0VDUFRyYW5zZmVyT3V0cHV0ID0gdW5kZWZpbmVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY29kZWNJRFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XHJcbiAgICovXHJcbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IENvZGVjSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gU0VDUE1pbnRPcGVyYXRpb24uc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxyXG4gICAgdGhpcy5fdHlwZUlEID1cclxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICAgID8gSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRFxyXG4gICAgICAgIDogSlZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRF9DT0RFQ09ORVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgb3BlcmF0aW9uIElELlxyXG4gICAqL1xyXG4gIGdldE9wZXJhdGlvbklEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxyXG4gICAqL1xyXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xyXG4gICAgaWYgKHRoaXMuX2NvZGVjSUQgPT09IDApIHtcclxuICAgICAgcmV0dXJuIEpWTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxyXG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb2RlY0lEID09PSAxKSB7XHJcbiAgICAgIHJldHVybiBKVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUxfQ09ERUNPTkVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFtbU0VDUE1pbnRPdXRwdXRdXSB0byBiZSBwcm9kdWNlZCBieSB0aGlzIG9wZXJhdGlvbi5cclxuICAgKi9cclxuICBnZXRNaW50T3V0cHV0KCk6IFNFQ1BNaW50T3V0cHV0IHtcclxuICAgIHJldHVybiB0aGlzLm1pbnRPdXRwdXRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgW1tTRUNQVHJhbnNmZXJPdXRwdXRdXSB0byBiZSBwcm9kdWNlZCBieSB0aGlzIG9wZXJhdGlvbi5cclxuICAgKi9cclxuICBnZXRUcmFuc2Zlck91dHB1dCgpOiBTRUNQVHJhbnNmZXJPdXRwdXQge1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJPdXRwdXRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvcHVhdGVzIHRoZSBpbnN0YW5jZSBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBbW1NFQ1BNaW50T3BlcmF0aW9uXV0gYW5kIHJldHVybnMgdGhlIHVwZGF0ZWQgb2Zmc2V0LlxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgIHRoaXMubWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dCgpXHJcbiAgICBvZmZzZXQgPSB0aGlzLm1pbnRPdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgdGhpcy50cmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoKVxyXG4gICAgb2Zmc2V0ID0gdGhpcy50cmFuc2Zlck91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW1NFQ1BNaW50T3BlcmF0aW9uXV0gaW5zdGFuY2UuXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxyXG4gICAgY29uc3QgbWludG91dEJ1ZmY6IEJ1ZmZlciA9IHRoaXMubWludE91dHB1dC50b0J1ZmZlcigpXHJcbiAgICBjb25zdCB0cmFuc2Zlck91dEJ1ZmY6IEJ1ZmZlciA9IHRoaXMudHJhbnNmZXJPdXRwdXQudG9CdWZmZXIoKVxyXG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9XHJcbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggKyBtaW50b3V0QnVmZi5sZW5ndGggKyB0cmFuc2Zlck91dEJ1ZmYubGVuZ3RoXHJcblxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbc3VwZXJidWZmLCBtaW50b3V0QnVmZiwgdHJhbnNmZXJPdXRCdWZmXVxyXG5cclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBtaW50cyBuZXcgdG9rZW5zIG9uIGFuIGFzc2V0SUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbWludE91dHB1dCBUaGUgW1tTRUNQTWludE91dHB1dF1dIHRoYXQgd2lsbCBiZSBwcm9kdWNlZCBieSB0aGlzIHRyYW5zYWN0aW9uLlxyXG4gICAqIEBwYXJhbSB0cmFuc2Zlck91dHB1dCBBIFtbU0VDUFRyYW5zZmVyT3V0cHV0XV0gdGhhdCB3aWxsIGJlIHByb2R1Y2VkIGZyb20gdGhpcyBtaW50aW5nIG9wZXJhdGlvbi5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG1pbnRPdXRwdXQ6IFNFQ1BNaW50T3V0cHV0ID0gdW5kZWZpbmVkLFxyXG4gICAgdHJhbnNmZXJPdXRwdXQ6IFNFQ1BUcmFuc2Zlck91dHB1dCA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgaWYgKHR5cGVvZiBtaW50T3V0cHV0ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMubWludE91dHB1dCA9IG1pbnRPdXRwdXRcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdHJhbnNmZXJPdXRwdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy50cmFuc2Zlck91dHB1dCA9IHRyYW5zZmVyT3V0cHV0XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQW4gW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYSBORlQgTWludCBPcC5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBORlRNaW50T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJORlRNaW50T3BlcmF0aW9uXCJcclxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBKVk1Db25zdGFudHMuTEFURVNUQ09ERUNcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XHJcbiAgICB0aGlzLl9jb2RlY0lEID09PSAwXHJcbiAgICAgID8gSlZNQ29uc3RhbnRzLk5GVE1JTlRPUElEXHJcbiAgICAgIDogSlZNQ29uc3RhbnRzLk5GVE1JTlRPUElEX0NPREVDT05FXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBjb25zdCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgZ3JvdXBJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuZ3JvdXBJRCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBidWZmZXIsXHJcbiAgICAgICAgZGVjaW1hbFN0cmluZyxcclxuICAgICAgICA0XHJcbiAgICAgICksXHJcbiAgICAgIHBheWxvYWQ6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLnBheWxvYWQsIGVuY29kaW5nLCBidWZmZXIsIGhleCksXHJcbiAgICAgIG91dHB1dE93bmVyczogdGhpcy5vdXRwdXRPd25lcnMubWFwKChvKSA9PiBvLnNlcmlhbGl6ZShlbmNvZGluZykpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuZ3JvdXBJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wiZ3JvdXBJRFwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIGRlY2ltYWxTdHJpbmcsXHJcbiAgICAgIGJ1ZmZlcixcclxuICAgICAgNFxyXG4gICAgKVxyXG4gICAgdGhpcy5wYXlsb2FkID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJwYXlsb2FkXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgaGV4LFxyXG4gICAgICBidWZmZXJcclxuICAgIClcclxuICAgIC8vIHRoaXMub3V0cHV0T3duZXJzID0gZmllbGRzW1wib3V0cHV0T3duZXJzXCJdLm1hcCgobzogTkZUTWludE91dHB1dCkgPT4ge1xyXG4gICAgLy8gICBsZXQgb286IE5GVE1pbnRPdXRwdXQgPSBuZXcgTkZUTWludE91dHB1dCgpXHJcbiAgICAvLyAgIG9vLmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKVxyXG4gICAgLy8gICByZXR1cm4gb29cclxuICAgIC8vIH0pXHJcbiAgICB0aGlzLm91dHB1dE93bmVycyA9IGZpZWxkc1tcIm91dHB1dE93bmVyc1wiXS5tYXAoXHJcbiAgICAgIChvOiBvYmplY3QpOiBPdXRwdXRPd25lcnMgPT4ge1xyXG4gICAgICAgIGxldCBvbzogT3V0cHV0T3duZXJzID0gbmV3IE91dHB1dE93bmVycygpXHJcbiAgICAgICAgb28uZGVzZXJpYWxpemUobywgZW5jb2RpbmcpXHJcbiAgICAgICAgcmV0dXJuIG9vXHJcbiAgICAgIH1cclxuICAgIClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBncm91cElEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgcGF5bG9hZDogQnVmZmVyXHJcbiAgcHJvdGVjdGVkIG91dHB1dE93bmVyczogT3V0cHV0T3duZXJzW10gPSBbXVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGNvZGVjSURcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb2RlY0lEIFRoZSBjb2RlY0lEIHRvIHNldFxyXG4gICAqL1xyXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBpZiAoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBDb2RlY0lkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIE5GVE1pbnRPcGVyYXRpb24uc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxyXG4gICAgdGhpcy5fdHlwZUlEID1cclxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICAgID8gSlZNQ29uc3RhbnRzLk5GVE1JTlRPUElEXHJcbiAgICAgICAgOiBKVk1Db25zdGFudHMuTkZUTUlOVE9QSURfQ09ERUNPTkVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvbiBJRC5cclxuICAgKi9cclxuICBnZXRPcGVyYXRpb25JRCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3JlZGVudGlhbCBJRC5cclxuICAgKi9cclxuICBnZXRDcmVkZW50aWFsSUQgPSAoKTogbnVtYmVyID0+IHtcclxuICAgIGlmICh0aGlzLl9jb2RlY0lEID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBKVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTFxyXG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb2RlY0lEID09PSAxKSB7XHJcbiAgICAgIHJldHVybiBKVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTF9DT0RFQ09ORVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZC5cclxuICAgKi9cclxuICBnZXRHcm91cElEID0gKCk6IEJ1ZmZlciA9PiB7XHJcbiAgICByZXR1cm4gYmludG9vbHMuY29weUZyb20odGhpcy5ncm91cElELCAwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZC5cclxuICAgKi9cclxuICBnZXRQYXlsb2FkID0gKCk6IEJ1ZmZlciA9PiB7XHJcbiAgICByZXR1cm4gYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkLCAwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZCdzIHJhdyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aXRoIGxlbmd0aCBwcmVwZW5kZWQsIGZvciB1c2Ugd2l0aCBbW1BheWxvYWRCYXNlXV0ncyBmcm9tQnVmZmVyXHJcbiAgICovXHJcbiAgZ2V0UGF5bG9hZEJ1ZmZlciA9ICgpOiBCdWZmZXIgPT4ge1xyXG4gICAgbGV0IHBheWxvYWRsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgcGF5bG9hZGxlbi53cml0ZVVJbnQzMkJFKHRoaXMucGF5bG9hZC5sZW5ndGgsIDApXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbcGF5bG9hZGxlbiwgYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkLCAwKV0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRPd25lcnMuXHJcbiAgICovXHJcbiAgZ2V0T3V0cHV0T3duZXJzID0gKCk6IE91dHB1dE93bmVyc1tdID0+IHtcclxuICAgIHJldHVybiB0aGlzLm91dHB1dE93bmVyc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE9wZXJhdGlvbl1dIGFuZCByZXR1cm5zIHRoZSB1cGRhdGVkIG9mZnNldC5cclxuICAgKi9cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICB0aGlzLmdyb3VwSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIGxldCBwYXlsb2FkTGVuOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMucGF5bG9hZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIHBheWxvYWRMZW4pXHJcbiAgICBvZmZzZXQgKz0gcGF5bG9hZExlblxyXG4gICAgbGV0IG51bW91dHB1dHM6IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICAucmVhZFVJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgdGhpcy5vdXRwdXRPd25lcnMgPSBbXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bW91dHB1dHM7IGkrKykge1xyXG4gICAgICBsZXQgb3V0cHV0T3duZXI6IE91dHB1dE93bmVycyA9IG5ldyBPdXRwdXRPd25lcnMoKVxyXG4gICAgICBvZmZzZXQgPSBvdXRwdXRPd25lci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICAgIHRoaXMub3V0cHV0T3duZXJzLnB1c2gob3V0cHV0T3duZXIpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBwYXlsb2FkbGVuOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIHBheWxvYWRsZW4ud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKVxyXG5cclxuICAgIGNvbnN0IG91dHB1dG93bmVyc2xlbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBvdXRwdXRvd25lcnNsZW4ud3JpdGVVSW50MzJCRSh0aGlzLm91dHB1dE93bmVycy5sZW5ndGgsIDApXHJcblxyXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPVxyXG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICtcclxuICAgICAgdGhpcy5ncm91cElELmxlbmd0aCArXHJcbiAgICAgIHBheWxvYWRsZW4ubGVuZ3RoICtcclxuICAgICAgdGhpcy5wYXlsb2FkLmxlbmd0aCArXHJcbiAgICAgIG91dHB1dG93bmVyc2xlbi5sZW5ndGhcclxuXHJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtcclxuICAgICAgc3VwZXJidWZmLFxyXG4gICAgICB0aGlzLmdyb3VwSUQsXHJcbiAgICAgIHBheWxvYWRsZW4sXHJcbiAgICAgIHRoaXMucGF5bG9hZCxcclxuICAgICAgb3V0cHV0b3duZXJzbGVuXHJcbiAgICBdXHJcblxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMub3V0cHV0T3duZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGxldCBiOiBCdWZmZXIgPSB0aGlzLm91dHB1dE93bmVyc1tgJHtpfWBdLnRvQnVmZmVyKClcclxuICAgICAgYmFyci5wdXNoKGIpXHJcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXS5cclxuICAgKi9cclxuICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG9uIGFuIGFzc2V0SUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZ3JvdXBJRCBUaGUgZ3JvdXAgdG8gd2hpY2ggdG8gaXNzdWUgdGhlIE5GVCBPdXRwdXRcclxuICAgKiBAcGFyYW0gcGF5bG9hZCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBORlQgcGF5bG9hZFxyXG4gICAqIEBwYXJhbSBvdXRwdXRPd25lcnMgQW4gYXJyYXkgb2Ygb3V0cHV0T3duZXJzXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBncm91cElEOiBudW1iZXIgPSB1bmRlZmluZWQsXHJcbiAgICBwYXlsb2FkOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBvdXRwdXRPd25lcnM6IE91dHB1dE93bmVyc1tdID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICBpZiAoXHJcbiAgICAgIHR5cGVvZiBncm91cElEICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgIHR5cGVvZiBwYXlsb2FkICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgIG91dHB1dE93bmVycy5sZW5ndGhcclxuICAgICkge1xyXG4gICAgICB0aGlzLmdyb3VwSUQud3JpdGVVSW50MzJCRShncm91cElEID8gZ3JvdXBJRCA6IDAsIDApXHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcclxuICAgICAgdGhpcy5vdXRwdXRPd25lcnMgPSBvdXRwdXRPd25lcnNcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgTkZUIFRyYW5zZmVyIE9wLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIE5GVFRyYW5zZmVyT3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJORlRUcmFuc2Zlck9wZXJhdGlvblwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gSlZNQ29uc3RhbnRzLkxBVEVTVENPREVDXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxyXG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxyXG4gICAgICA/IEpWTUNvbnN0YW50cy5ORlRYRkVST1BJRFxyXG4gICAgICA6IEpWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ09ORVxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgY29uc3QgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIG91dHB1dDogdGhpcy5vdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLm91dHB1dCA9IG5ldyBORlRUcmFuc2Zlck91dHB1dCgpXHJcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIG91dHB1dDogTkZUVHJhbnNmZXJPdXRwdXRcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBjb2RlY0lEXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcclxuICAgKi9cclxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgaWYgKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBORlRUcmFuc2Zlck9wZXJhdGlvbi5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXHJcbiAgICB0aGlzLl90eXBlSUQgPVxyXG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXHJcbiAgICAgICAgPyBKVk1Db25zdGFudHMuTkZUWEZFUk9QSURcclxuICAgICAgICA6IEpWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ09ORVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgb3BlcmF0aW9uIElELlxyXG4gICAqL1xyXG4gIGdldE9wZXJhdGlvbklEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxyXG4gICAqL1xyXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xyXG4gICAgaWYgKHRoaXMuX2NvZGVjSUQgPT09IDApIHtcclxuICAgICAgcmV0dXJuIEpWTUNvbnN0YW50cy5ORlRDUkVERU5USUFMXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvZGVjSUQgPT09IDEpIHtcclxuICAgICAgcmV0dXJuIEpWTUNvbnN0YW50cy5ORlRDUkVERU5USUFMX0NPREVDT05FXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXRPdXRwdXQgPSAoKTogTkZUVHJhbnNmZXJPdXRwdXQgPT4gdGhpcy5vdXRwdXRcclxuXHJcbiAgLyoqXHJcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPcGVyYXRpb25dXSBhbmQgcmV0dXJucyB0aGUgdXBkYXRlZCBvZmZzZXQuXHJcbiAgICovXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgdGhpcy5vdXRwdXQgPSBuZXcgTkZUVHJhbnNmZXJPdXRwdXQoKVxyXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPcGVyYXRpb25dXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBvdXRidWZmOiBCdWZmZXIgPSB0aGlzLm91dHB1dC50b0J1ZmZlcigpXHJcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID0gc3VwZXJidWZmLmxlbmd0aCArIG91dGJ1ZmYubGVuZ3RoXHJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlcmJ1ZmYsIG91dGJ1ZmZdXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPcGVyYXRpb25dXS5cclxuICAgKi9cclxuICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG9uIGFuIGFzc2V0SUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gb3V0cHV0IEFuIFtbTkZUVHJhbnNmZXJPdXRwdXRdXVxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKG91dHB1dDogTkZUVHJhbnNmZXJPdXRwdXQgPSB1bmRlZmluZWQpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmICh0eXBlb2Ygb3V0cHV0ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIFVUWE9JRCB1c2VkIGluIFtbVHJhbnNmZXJhYmxlT3BdXSB0eXBlc1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFVUWE9JRCBleHRlbmRzIE5CeXRlcyB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT0lEXCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIHByb3RlY3RlZCBieXRlcyA9IEJ1ZmZlci5hbGxvYygzNilcclxuICBwcm90ZWN0ZWQgYnNpemUgPSAzNlxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdXNlZCB0byBzb3J0IGFuIGFycmF5IG9mIFtbVVRYT0lEXV1zXHJcbiAgICovXHJcbiAgc3RhdGljIGNvbXBhcmF0b3IgPVxyXG4gICAgKCk6ICgoYTogVVRYT0lELCBiOiBVVFhPSUQpID0+IDEgfCAtMSB8IDApID0+XHJcbiAgICAoYTogVVRYT0lELCBiOiBVVFhPSUQpOiAxIHwgLTEgfCAwID0+XHJcbiAgICAgIEJ1ZmZlci5jb21wYXJlKGEudG9CdWZmZXIoKSwgYi50b0J1ZmZlcigpKSBhcyAxIHwgLTEgfCAwXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1VUWE9JRF1dLlxyXG4gICAqL1xyXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnRvQnVmZmVyKCkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYW4gW1tVVFhPSURdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBVVFhPSUQgaW4gYnl0ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnl0ZXMgQSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgcmF3IFtbVVRYT0lEXV1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW1VUWE9JRF1dXHJcbiAgICovXHJcbiAgZnJvbVN0cmluZyh1dHhvaWQ6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICBjb25zdCB1dHhvaWRidWZmOiBCdWZmZXIgPSBiaW50b29scy5iNThUb0J1ZmZlcih1dHhvaWQpXHJcbiAgICBpZiAodXR4b2lkYnVmZi5sZW5ndGggPT09IDQwICYmIGJpbnRvb2xzLnZhbGlkYXRlQ2hlY2tzdW0odXR4b2lkYnVmZikpIHtcclxuICAgICAgY29uc3QgbmV3YnVmZjogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oXHJcbiAgICAgICAgdXR4b2lkYnVmZixcclxuICAgICAgICAwLFxyXG4gICAgICAgIHV0eG9pZGJ1ZmYubGVuZ3RoIC0gNFxyXG4gICAgICApXHJcbiAgICAgIGlmIChuZXdidWZmLmxlbmd0aCA9PT0gMzYpIHtcclxuICAgICAgICB0aGlzLmJ5dGVzID0gbmV3YnVmZlxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKHV0eG9pZGJ1ZmYubGVuZ3RoID09PSA0MCkge1xyXG4gICAgICB0aHJvdyBuZXcgQ2hlY2tzdW1FcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gVVRYT0lELmZyb21TdHJpbmc6IGludmFsaWQgY2hlY2tzdW0gb24gYWRkcmVzc1wiXHJcbiAgICAgIClcclxuICAgIH0gZWxzZSBpZiAodXR4b2lkYnVmZi5sZW5ndGggPT09IDM2KSB7XHJcbiAgICAgIHRoaXMuYnl0ZXMgPSB1dHhvaWRidWZmXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBVVFhPSUQuZnJvbVN0cmluZzogaW52YWxpZCBhZGRyZXNzXCIpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5nZXRTaXplKClcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgbmV3YmFzZTogVVRYT0lEID0gbmV3IFVUWE9JRCgpXHJcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IFVUWE9JRCgpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBVVFhPSUQgdXNlZCBpbiBbW1RyYW5zZmVyYWJsZU9wXV0gdHlwZXNcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKClcclxuICB9XHJcbn1cclxuIl19