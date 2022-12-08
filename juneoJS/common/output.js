"use strict";
/**
 * @packageDocumentation
 * @module Common-Output
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNFTOutput = exports.StandardAmountOutput = exports.StandardTransferableOutput = exports.StandardParseableOutput = exports.Output = exports.OutputOwners = exports.Address = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../utils/bintools"));
const nbytes_1 = require("./nbytes");
const helperfunctions_1 = require("../utils/helperfunctions");
const serialization_1 = require("../utils/serialization");
const errors_1 = require("../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class for representing an address used in [[Output]] types
 */
class Address extends nbytes_1.NBytes {
    /**
     * Class for representing an address used in [[Output]] types
     */
    constructor() {
        super();
        this._typeName = "Address";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(20);
        this.bsize = 20;
    }
    /**
     * Returns a base-58 representation of the [[Address]].
     */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    /**
     * Takes a base-58 string containing an [[Address]], parses it, populates the class, and returns the length of the Address in bytes.
     *
     * @param bytes A base-58 string containing a raw [[Address]]
     *
     * @returns The length of the raw [[Address]]
     */
    fromString(addr) {
        const addrbuff = bintools.b58ToBuffer(addr);
        if (addrbuff.length === 24 && bintools.validateChecksum(addrbuff)) {
            const newbuff = bintools.copyFrom(addrbuff, 0, addrbuff.length - 4);
            if (newbuff.length === 20) {
                this.bytes = newbuff;
            }
        }
        else if (addrbuff.length === 24) {
            throw new errors_1.ChecksumError("Error - Address.fromString: invalid checksum on address");
        }
        else if (addrbuff.length === 20) {
            this.bytes = addrbuff;
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.AddressError("Error - Address.fromString: invalid address");
        }
        return this.getSize();
    }
    clone() {
        let newbase = new Address();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new Address();
    }
}
exports.Address = Address;
/**
 * Returns a function used to sort an array of [[Address]]es
 */
Address.comparator = () => (a, b) => buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
/**
 * Defines the most basic values for output ownership. Mostly inherited from, but can be used in population of NFT Owner data.
 */
class OutputOwners extends serialization_1.Serializable {
    /**
     * An [[Output]] class which contains addresses, locktimes, and thresholds.
     *
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing output owner's addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     */
    constructor(addresses = undefined, locktime = undefined, threshold = undefined) {
        super();
        this._typeName = "OutputOwners";
        this._typeID = undefined;
        this.locktime = buffer_1.Buffer.alloc(8);
        this.threshold = buffer_1.Buffer.alloc(4);
        this.numaddrs = buffer_1.Buffer.alloc(4);
        this.addresses = [];
        /**
         * Returns the threshold of signers required to spend this output.
         */
        this.getThreshold = () => this.threshold.readUInt32BE(0);
        /**
         * Returns the a {@link https://github.com/indutny/bn.js/|BN} repersenting the UNIX Timestamp when the lock is made available.
         */
        this.getLocktime = () => bintools.fromBufferToBN(this.locktime);
        /**
         * Returns an array of {@link https://github.com/feross/buffer|Buffer}s for the addresses.
         */
        this.getAddresses = () => {
            const result = [];
            for (let i = 0; i < this.addresses.length; i++) {
                result.push(this.addresses[`${i}`].toBuffer());
            }
            return result;
        };
        /**
         * Returns the index of the address.
         *
         * @param address A {@link https://github.com/feross/buffer|Buffer} of the address to look up to return its index.
         *
         * @returns The index of the address.
         */
        this.getAddressIdx = (address) => {
            for (let i = 0; i < this.addresses.length; i++) {
                if (this.addresses[`${i}`].toBuffer().toString("hex") ===
                    address.toString("hex")) {
                    return i;
                }
            }
            /* istanbul ignore next */
            return -1;
        };
        /**
         * Returns the address from the index provided.
         *
         * @param idx The index of the address.
         *
         * @returns Returns the string representing the address.
         */
        this.getAddress = (idx) => {
            if (idx < this.addresses.length) {
                return this.addresses[`${idx}`].toBuffer();
            }
            throw new errors_1.AddressIndexError("Error - Output.getAddress: idx out of range");
        };
        /**
         * Given an array of address {@link https://github.com/feross/buffer|Buffer}s and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
         */
        this.meetsThreshold = (addresses, asOf = undefined) => {
            let now;
            if (typeof asOf === "undefined") {
                now = (0, helperfunctions_1.UnixNow)();
            }
            else {
                now = asOf;
            }
            const qualified = this.getSpenders(addresses, now);
            const threshold = this.threshold.readUInt32BE(0);
            if (qualified.length >= threshold) {
                return true;
            }
            return false;
        };
        /**
         * Given an array of addresses and an optional timestamp, select an array of address {@link https://github.com/feross/buffer|Buffer}s of qualified spenders for the output.
         */
        this.getSpenders = (addresses, asOf = undefined) => {
            const qualified = [];
            let now;
            if (typeof asOf === "undefined") {
                now = (0, helperfunctions_1.UnixNow)();
            }
            else {
                now = asOf;
            }
            const locktime = bintools.fromBufferToBN(this.locktime);
            if (now.lte(locktime)) {
                // not unlocked, not spendable
                return qualified;
            }
            const threshold = this.threshold.readUInt32BE(0);
            for (let i = 0; i < this.addresses.length && qualified.length < threshold; i++) {
                for (let j = 0; j < addresses.length && qualified.length < threshold; j++) {
                    if (addresses[`${j}`].toString("hex") ===
                        this.addresses[`${i}`].toBuffer().toString("hex")) {
                        qualified.push(addresses[`${j}`]);
                    }
                }
            }
            return qualified;
        };
        if (typeof addresses !== "undefined" && addresses.length) {
            const addrs = [];
            for (let i = 0; i < addresses.length; i++) {
                addrs[`${i}`] = new Address();
                addrs[`${i}`].fromBuffer(addresses[`${i}`]);
            }
            this.addresses = addrs;
            this.addresses.sort(Address.comparator());
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
        }
        if (typeof threshold !== undefined) {
            this.threshold.writeUInt32BE(threshold || 1, 0);
        }
        if (typeof locktime !== "undefined") {
            this.locktime = bintools.fromBNToBuffer(locktime, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { locktime: serialization.encoder(this.locktime, encoding, "Buffer", "decimalString", 8), threshold: serialization.encoder(this.threshold, encoding, "Buffer", "decimalString", 4), addresses: this.addresses.map((a) => a.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.locktime = serialization.decoder(fields["locktime"], encoding, "decimalString", "Buffer", 8);
        this.threshold = serialization.decoder(fields["threshold"], encoding, "decimalString", "Buffer", 4);
        this.addresses = fields["addresses"].map((a) => {
            let addr = new Address();
            addr.deserialize(a, encoding);
            return addr;
        });
        this.numaddrs = buffer_1.Buffer.alloc(4);
        this.numaddrs.writeUInt32BE(this.addresses.length, 0);
    }
    /**
     * Returns a base-58 string representing the [[Output]].
     */
    fromBuffer(bytes, offset = 0) {
        this.locktime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.threshold = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.numaddrs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numaddrs = this.numaddrs.readUInt32BE(0);
        this.addresses = [];
        for (let i = 0; i < numaddrs; i++) {
            const addr = new Address();
            offset = addr.fromBuffer(bytes, offset);
            this.addresses.push(addr);
        }
        this.addresses.sort(Address.comparator());
        return offset;
    }
    /**
     * Returns the buffer representing the [[Output]] instance.
     */
    toBuffer() {
        this.addresses.sort(Address.comparator());
        this.numaddrs.writeUInt32BE(this.addresses.length, 0);
        let bsize = this.locktime.length + this.threshold.length + this.numaddrs.length;
        const barr = [this.locktime, this.threshold, this.numaddrs];
        for (let i = 0; i < this.addresses.length; i++) {
            const b = this.addresses[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[Output]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.OutputOwners = OutputOwners;
OutputOwners.comparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOutputID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOutputID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
class Output extends OutputOwners {
    constructor() {
        super(...arguments);
        this._typeName = "Output";
        this._typeID = undefined;
    }
}
exports.Output = Output;
class StandardParseableOutput extends serialization_1.Serializable {
    /**
     * Class representing an [[ParseableOutput]] for a transaction.
     *
     * @param output A number representing the InputID of the [[ParseableOutput]]
     */
    constructor(output = undefined) {
        super();
        this._typeName = "StandardParseableOutput";
        this._typeID = undefined;
        this.getOutput = () => this.output;
        if (output instanceof Output) {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { output: this.output.serialize(encoding) });
    }
    toBuffer() {
        const outbuff = this.output.toBuffer();
        const outid = buffer_1.Buffer.alloc(4);
        outid.writeUInt32BE(this.output.getOutputID(), 0);
        const barr = [outid, outbuff];
        return buffer_1.Buffer.concat(barr, outid.length + outbuff.length);
    }
}
exports.StandardParseableOutput = StandardParseableOutput;
/**
 * Returns a function used to sort an array of [[ParseableOutput]]s
 */
StandardParseableOutput.comparator = () => (a, b) => {
    const sorta = a.toBuffer();
    const sortb = b.toBuffer();
    return buffer_1.Buffer.compare(sorta, sortb);
};
class StandardTransferableOutput extends StandardParseableOutput {
    /**
     * Class representing an [[StandardTransferableOutput]] for a transaction.
     *
     * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Output]]
     * @param output A number representing the InputID of the [[StandardTransferableOutput]]
     */
    constructor(assetID = undefined, output = undefined) {
        super(output);
        this._typeName = "StandardTransferableOutput";
        this._typeID = undefined;
        this.assetID = undefined;
        this.getAssetID = () => this.assetID;
        if (typeof assetID !== "undefined") {
            this.assetID = assetID;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.assetID = serialization.decoder(fields["assetID"], encoding, "cb58", "Buffer", 32);
    }
    toBuffer() {
        const parseableBuff = super.toBuffer();
        const barr = [this.assetID, parseableBuff];
        return buffer_1.Buffer.concat(barr, this.assetID.length + parseableBuff.length);
    }
}
exports.StandardTransferableOutput = StandardTransferableOutput;
/**
 * An [[Output]] class which specifies a token amount .
 */
class StandardAmountOutput extends Output {
    /**
     * A [[StandardAmountOutput]] class which issues a payment on an assetID.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     */
    constructor(amount = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "StandardAmountOutput";
        this._typeID = undefined;
        this.amount = buffer_1.Buffer.alloc(8);
        this.amountValue = new bn_js_1.default(0);
        if (typeof amount !== "undefined") {
            this.amountValue = amount.clone();
            this.amount = bintools.fromBNToBuffer(amount, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { amount: serialization.encoder(this.amount, encoding, "Buffer", "decimalString", 8) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.amount = serialization.decoder(fields["amount"], encoding, "decimalString", "Buffer", 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
    }
    /**
     * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAmount() {
        return this.amountValue.clone();
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StandardAmountOutput]] and returns the size of the output.
     */
    fromBuffer(outbuff, offset = 0) {
        this.amount = bintools.copyFrom(outbuff, offset, offset + 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
        offset += 8;
        return super.fromBuffer(outbuff, offset);
    }
    /**
     * Returns the buffer representing the [[StandardAmountOutput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.amount.length + superbuff.length;
        this.numaddrs.writeUInt32BE(this.addresses.length, 0);
        const barr = [this.amount, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.StandardAmountOutput = StandardAmountOutput;
/**
 * An [[Output]] class which specifies an NFT.
 */
class BaseNFTOutput extends Output {
    constructor() {
        super(...arguments);
        this._typeName = "BaseNFTOutput";
        this._typeID = undefined;
        this.groupID = buffer_1.Buffer.alloc(4);
        /**
         * Returns the groupID as a number.
         */
        this.getGroupID = () => {
            return this.groupID.readUInt32BE(0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { groupID: serialization.encoder(this.groupID, encoding, "Buffer", "decimalString", 4) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.groupID = serialization.decoder(fields["groupID"], encoding, "decimalString", "Buffer", 4);
    }
}
exports.BaseNFTOutput = BaseNFTOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9vdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUN0QixpRUFBd0M7QUFDeEMscUNBQWlDO0FBQ2pDLDhEQUFrRDtBQUNsRCwwREFJK0I7QUFDL0IsNENBQWdGO0FBRWhGOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsT0FBUSxTQUFRLGVBQU07SUFpRWpDOztPQUVHO0lBQ0g7UUFDRSxLQUFLLEVBQUUsQ0FBQTtRQXBFQyxjQUFTLEdBQUcsU0FBUyxDQUFBO1FBQ3JCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUFFN0IsOENBQThDO1FBRXBDLFVBQUssR0FBRyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3hCLFVBQUssR0FBRyxFQUFFLENBQUE7SUErRHBCLENBQUM7SUFyREQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sT0FBTyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBQzdDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxVQUFVLENBQUMsSUFBWTtRQUNyQixNQUFNLFFBQVEsR0FBVyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ25ELElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxFQUFFLElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2pFLE1BQU0sT0FBTyxHQUFXLFFBQVEsQ0FBQyxRQUFRLENBQ3ZDLFFBQVEsRUFDUixDQUFDLEVBQ0QsUUFBUSxDQUFDLE1BQU0sR0FB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QUFjLFNBQVEsTUFBTTtJQUFsRDs7UUFDWSxjQUFTLEdBQUcsZUFBZSxDQUFBO1FBQzNCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUEwQm5CLFlBQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRTNDOztXQUVHO1FBQ0gsZUFBVSxHQUFHLEdBQVcsRUFBRTtZQUN4QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3JDLENBQUMsQ0FBQTtJQUNILENBQUM7SUFoQ0MsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsSUFBSSxNQUFNLEdBQVcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM5Qyx1Q0FDSyxNQUFNLEtBQ1QsT0FBTyxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQzVCLElBQUksQ0FBQyxPQUFPLEVBQ1osUUFBUSxFQUNSLFFBQVEsRUFDUixlQUFlLEVBQ2YsQ0FBQyxDQUNGLElBQ0Y7SUFDSCxDQUFDO0lBQ0QsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDbEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUNqQixRQUFRLEVBQ1IsZUFBZSxFQUNmLFFBQVEsRUFDUixDQUFDLENBQ0YsQ0FBQTtJQUNILENBQUM7Q0FVRjtBQXBDRCxzQ0FvQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQ29tbW9uLU91dHB1dFxyXG4gKi9cclxuXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBOQnl0ZXMgfSBmcm9tIFwiLi9uYnl0ZXNcIlxyXG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXHJcbmltcG9ydCB7XHJcbiAgU2VyaWFsaXphYmxlLFxyXG4gIFNlcmlhbGl6YXRpb24sXHJcbiAgU2VyaWFsaXplZEVuY29kaW5nXHJcbn0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5pbXBvcnQgeyBDaGVja3N1bUVycm9yLCBBZGRyZXNzRXJyb3IsIEFkZHJlc3NJbmRleEVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhbiBhZGRyZXNzIHVzZWQgaW4gW1tPdXRwdXRdXSB0eXBlc1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEFkZHJlc3MgZXh0ZW5kcyBOQnl0ZXMge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkFkZHJlc3NcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgcHJvdGVjdGVkIGJ5dGVzID0gQnVmZmVyLmFsbG9jKDIwKVxyXG4gIHByb3RlY3RlZCBic2l6ZSA9IDIwXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB1c2VkIHRvIHNvcnQgYW4gYXJyYXkgb2YgW1tBZGRyZXNzXV1lc1xyXG4gICAqL1xyXG4gIHN0YXRpYyBjb21wYXJhdG9yID1cclxuICAgICgpOiAoKGE6IEFkZHJlc3MsIGI6IEFkZHJlc3MpID0+IDEgfCAtMSB8IDApID0+XHJcbiAgICAoYTogQWRkcmVzcywgYjogQWRkcmVzcyk6IDEgfCAtMSB8IDAgPT5cclxuICAgICAgQnVmZmVyLmNvbXBhcmUoYS50b0J1ZmZlcigpLCBiLnRvQnVmZmVyKCkpIGFzIDEgfCAtMSB8IDBcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbQWRkcmVzc11dLlxyXG4gICAqL1xyXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnRvQnVmZmVyKCkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYW4gW1tBZGRyZXNzXV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgQWRkcmVzcyBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBieXRlcyBBIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSByYXcgW1tBZGRyZXNzXV1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0FkZHJlc3NdXVxyXG4gICAqL1xyXG4gIGZyb21TdHJpbmcoYWRkcjogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IGFkZHJidWZmOiBCdWZmZXIgPSBiaW50b29scy5iNThUb0J1ZmZlcihhZGRyKVxyXG4gICAgaWYgKGFkZHJidWZmLmxlbmd0aCA9PT0gMjQgJiYgYmludG9vbHMudmFsaWRhdGVDaGVja3N1bShhZGRyYnVmZikpIHtcclxuICAgICAgY29uc3QgbmV3YnVmZjogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oXHJcbiAgICAgICAgYWRkcmJ1ZmYsXHJcbiAgICAgICAgMCxcclxuICAgICAgICBhZGRyYnVmZi5sZW5ndGggLSA0XHJcbiAgICAgIClcclxuICAgICAgaWYgKG5ld2J1ZmYubGVuZ3RoID09PSAyMCkge1xyXG4gICAgICAgIHRoaXMuYnl0ZXMgPSBuZXdidWZmXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoYWRkcmJ1ZmYubGVuZ3RoID09PSAyNCkge1xyXG4gICAgICB0aHJvdyBuZXcgQ2hlY2tzdW1FcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gQWRkcmVzcy5mcm9tU3RyaW5nOiBpbnZhbGlkIGNoZWNrc3VtIG9uIGFkZHJlc3NcIlxyXG4gICAgICApXHJcbiAgICB9IGVsc2UgaWYgKGFkZHJidWZmLmxlbmd0aCA9PT0gMjApIHtcclxuICAgICAgdGhpcy5ieXRlcyA9IGFkZHJidWZmXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBZGRyZXNzLmZyb21TdHJpbmc6IGludmFsaWQgYWRkcmVzc1wiKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0U2l6ZSgpXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGxldCBuZXdiYXNlOiBBZGRyZXNzID0gbmV3IEFkZHJlc3MoKVxyXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIG5ldyBBZGRyZXNzKCkgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhbiBhZGRyZXNzIHVzZWQgaW4gW1tPdXRwdXRdXSB0eXBlc1xyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoKVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgdGhlIG1vc3QgYmFzaWMgdmFsdWVzIGZvciBvdXRwdXQgb3duZXJzaGlwLiBNb3N0bHkgaW5oZXJpdGVkIGZyb20sIGJ1dCBjYW4gYmUgdXNlZCBpbiBwb3B1bGF0aW9uIG9mIE5GVCBPd25lciBkYXRhLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIE91dHB1dE93bmVycyBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiT3V0cHV0T3duZXJzXCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBsb2NrdGltZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMubG9ja3RpbWUsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgICA4XHJcbiAgICAgICksXHJcbiAgICAgIHRocmVzaG9sZDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMudGhyZXNob2xkLFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgICAgNFxyXG4gICAgICApLFxyXG4gICAgICBhZGRyZXNzZXM6IHRoaXMuYWRkcmVzc2VzLm1hcCgoYTogQWRkcmVzcyk6IG9iamVjdCA9PlxyXG4gICAgICAgIGEuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMubG9ja3RpbWUgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImxvY2t0aW1lXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDhcclxuICAgIClcclxuICAgIHRoaXMudGhyZXNob2xkID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJ0aHJlc2hvbGRcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgNFxyXG4gICAgKVxyXG4gICAgdGhpcy5hZGRyZXNzZXMgPSBmaWVsZHNbXCJhZGRyZXNzZXNcIl0ubWFwKChhOiBvYmplY3QpID0+IHtcclxuICAgICAgbGV0IGFkZHI6IEFkZHJlc3MgPSBuZXcgQWRkcmVzcygpXHJcbiAgICAgIGFkZHIuZGVzZXJpYWxpemUoYSwgZW5jb2RpbmcpXHJcbiAgICAgIHJldHVybiBhZGRyXHJcbiAgICB9KVxyXG4gICAgdGhpcy5udW1hZGRycyA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgdGhpcy5udW1hZGRycy53cml0ZVVJbnQzMkJFKHRoaXMuYWRkcmVzc2VzLmxlbmd0aCwgMClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBsb2NrdGltZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXHJcbiAgcHJvdGVjdGVkIHRocmVzaG9sZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgcHJvdGVjdGVkIG51bWFkZHJzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgYWRkcmVzc2VzOiBBZGRyZXNzW10gPSBbXVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB0aHJlc2hvbGQgb2Ygc2lnbmVycyByZXF1aXJlZCB0byBzcGVuZCB0aGlzIG91dHB1dC5cclxuICAgKi9cclxuICBnZXRUaHJlc2hvbGQgPSAoKTogbnVtYmVyID0+IHRoaXMudGhyZXNob2xkLnJlYWRVSW50MzJCRSgwKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcGVyc2VudGluZyB0aGUgVU5JWCBUaW1lc3RhbXAgd2hlbiB0aGUgbG9jayBpcyBtYWRlIGF2YWlsYWJsZS5cclxuICAgKi9cclxuICBnZXRMb2NrdGltZSA9ICgpOiBCTiA9PiBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLmxvY2t0aW1lKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9cyBmb3IgdGhlIGFkZHJlc3Nlcy5cclxuICAgKi9cclxuICBnZXRBZGRyZXNzZXMgPSAoKTogQnVmZmVyW10gPT4ge1xyXG4gICAgY29uc3QgcmVzdWx0OiBCdWZmZXJbXSA9IFtdXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgcmVzdWx0LnB1c2godGhpcy5hZGRyZXNzZXNbYCR7aX1gXS50b0J1ZmZlcigpKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYWRkcmVzcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhZGRyZXNzIHRvIGxvb2sgdXAgdG8gcmV0dXJuIGl0cyBpbmRleC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcy5cclxuICAgKi9cclxuICBnZXRBZGRyZXNzSWR4ID0gKGFkZHJlc3M6IEJ1ZmZlcik6IG51bWJlciA9PiB7XHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIHRoaXMuYWRkcmVzc2VzW2Ake2l9YF0udG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSA9PT1cclxuICAgICAgICBhZGRyZXNzLnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgICAgICkge1xyXG4gICAgICAgIHJldHVybiBpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm4gLTFcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFkZHJlc3MgZnJvbSB0aGUgaW5kZXggcHJvdmlkZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgdGhlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGFkZHJlc3MuXHJcbiAgICovXHJcbiAgZ2V0QWRkcmVzcyA9IChpZHg6IG51bWJlcik6IEJ1ZmZlciA9PiB7XHJcbiAgICBpZiAoaWR4IDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3Nlc1tgJHtpZHh9YF0udG9CdWZmZXIoKVxyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEFkZHJlc3NJbmRleEVycm9yKFwiRXJyb3IgLSBPdXRwdXQuZ2V0QWRkcmVzczogaWR4IG91dCBvZiByYW5nZVwiKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYW4gYXJyYXkgb2YgYWRkcmVzcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgYW5kIGFuIG9wdGlvbmFsIHRpbWVzdGFtcCwgcmV0dXJucyB0cnVlIGlmIHRoZSBhZGRyZXNzZXMgbWVldCB0aGUgdGhyZXNob2xkIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBvdXRwdXQuXHJcbiAgICovXHJcbiAgbWVldHNUaHJlc2hvbGQgPSAoYWRkcmVzc2VzOiBCdWZmZXJbXSwgYXNPZjogQk4gPSB1bmRlZmluZWQpOiBib29sZWFuID0+IHtcclxuICAgIGxldCBub3c6IEJOXHJcbiAgICBpZiAodHlwZW9mIGFzT2YgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgbm93ID0gVW5peE5vdygpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBub3cgPSBhc09mXHJcbiAgICB9XHJcbiAgICBjb25zdCBxdWFsaWZpZWQ6IEJ1ZmZlcltdID0gdGhpcy5nZXRTcGVuZGVycyhhZGRyZXNzZXMsIG5vdylcclxuICAgIGNvbnN0IHRocmVzaG9sZDogbnVtYmVyID0gdGhpcy50aHJlc2hvbGQucmVhZFVJbnQzMkJFKDApXHJcbiAgICBpZiAocXVhbGlmaWVkLmxlbmd0aCA+PSB0aHJlc2hvbGQpIHtcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGFuIGFycmF5IG9mIGFkZHJlc3NlcyBhbmQgYW4gb3B0aW9uYWwgdGltZXN0YW1wLCBzZWxlY3QgYW4gYXJyYXkgb2YgYWRkcmVzcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgb2YgcXVhbGlmaWVkIHNwZW5kZXJzIGZvciB0aGUgb3V0cHV0LlxyXG4gICAqL1xyXG4gIGdldFNwZW5kZXJzID0gKGFkZHJlc3NlczogQnVmZmVyW10sIGFzT2Y6IEJOID0gdW5kZWZpbmVkKTogQnVmZmVyW10gPT4ge1xyXG4gICAgY29uc3QgcXVhbGlmaWVkOiBCdWZmZXJbXSA9IFtdXHJcbiAgICBsZXQgbm93OiBCTlxyXG4gICAgaWYgKHR5cGVvZiBhc09mID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIG5vdyA9IFVuaXhOb3coKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbm93ID0gYXNPZlxyXG4gICAgfVxyXG4gICAgY29uc3QgbG9ja3RpbWU6IEJOID0gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5sb2NrdGltZSlcclxuICAgIGlmIChub3cubHRlKGxvY2t0aW1lKSkge1xyXG4gICAgICAvLyBub3QgdW5sb2NrZWQsIG5vdCBzcGVuZGFibGVcclxuICAgICAgcmV0dXJuIHF1YWxpZmllZFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRocmVzaG9sZDogbnVtYmVyID0gdGhpcy50aHJlc2hvbGQucmVhZFVJbnQzMkJFKDApXHJcbiAgICBmb3IgKFxyXG4gICAgICBsZXQgaTogbnVtYmVyID0gMDtcclxuICAgICAgaSA8IHRoaXMuYWRkcmVzc2VzLmxlbmd0aCAmJiBxdWFsaWZpZWQubGVuZ3RoIDwgdGhyZXNob2xkO1xyXG4gICAgICBpKytcclxuICAgICkge1xyXG4gICAgICBmb3IgKFxyXG4gICAgICAgIGxldCBqOiBudW1iZXIgPSAwO1xyXG4gICAgICAgIGogPCBhZGRyZXNzZXMubGVuZ3RoICYmIHF1YWxpZmllZC5sZW5ndGggPCB0aHJlc2hvbGQ7XHJcbiAgICAgICAgaisrXHJcbiAgICAgICkge1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIGFkZHJlc3Nlc1tgJHtqfWBdLnRvU3RyaW5nKFwiaGV4XCIpID09PVxyXG4gICAgICAgICAgdGhpcy5hZGRyZXNzZXNbYCR7aX1gXS50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBxdWFsaWZpZWQucHVzaChhZGRyZXNzZXNbYCR7an1gXSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcXVhbGlmaWVkXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBbW091dHB1dF1dLlxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMubG9ja3RpbWUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxyXG4gICAgb2Zmc2V0ICs9IDhcclxuICAgIHRoaXMudGhyZXNob2xkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLm51bWFkZHJzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICBjb25zdCBudW1hZGRyczogbnVtYmVyID0gdGhpcy5udW1hZGRycy5yZWFkVUludDMyQkUoMClcclxuICAgIHRoaXMuYWRkcmVzc2VzID0gW11cclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1hZGRyczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGFkZHI6IEFkZHJlc3MgPSBuZXcgQWRkcmVzcygpXHJcbiAgICAgIG9mZnNldCA9IGFkZHIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgICB0aGlzLmFkZHJlc3Nlcy5wdXNoKGFkZHIpXHJcbiAgICB9XHJcbiAgICB0aGlzLmFkZHJlc3Nlcy5zb3J0KEFkZHJlc3MuY29tcGFyYXRvcigpKVxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tPdXRwdXRdXSBpbnN0YW5jZS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgdGhpcy5hZGRyZXNzZXMuc29ydChBZGRyZXNzLmNvbXBhcmF0b3IoKSlcclxuICAgIHRoaXMubnVtYWRkcnMud3JpdGVVSW50MzJCRSh0aGlzLmFkZHJlc3Nlcy5sZW5ndGgsIDApXHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9XHJcbiAgICAgIHRoaXMubG9ja3RpbWUubGVuZ3RoICsgdGhpcy50aHJlc2hvbGQubGVuZ3RoICsgdGhpcy5udW1hZGRycy5sZW5ndGhcclxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMubG9ja3RpbWUsIHRoaXMudGhyZXNob2xkLCB0aGlzLm51bWFkZHJzXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMuYWRkcmVzc2VzW2Ake2l9YF0udG9CdWZmZXIoKVxyXG4gICAgICBiYXJyLnB1c2goYilcclxuICAgICAgYnNpemUgKz0gYi5sZW5ndGhcclxuICAgIH1cclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgW1tPdXRwdXRdXS5cclxuICAgKi9cclxuICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIHN0YXRpYyBjb21wYXJhdG9yID1cclxuICAgICgpOiAoKGE6IE91dHB1dCwgYjogT3V0cHV0KSA9PiAxIHwgLTEgfCAwKSA9PlxyXG4gICAgKGE6IE91dHB1dCwgYjogT3V0cHV0KTogMSB8IC0xIHwgMCA9PiB7XHJcbiAgICAgIGNvbnN0IGFvdXRpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICAgIGFvdXRpZC53cml0ZVVJbnQzMkJFKGEuZ2V0T3V0cHV0SUQoKSwgMClcclxuICAgICAgY29uc3QgYWJ1ZmY6IEJ1ZmZlciA9IGEudG9CdWZmZXIoKVxyXG5cclxuICAgICAgY29uc3QgYm91dGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgICAgYm91dGlkLndyaXRlVUludDMyQkUoYi5nZXRPdXRwdXRJRCgpLCAwKVxyXG4gICAgICBjb25zdCBiYnVmZjogQnVmZmVyID0gYi50b0J1ZmZlcigpXHJcblxyXG4gICAgICBjb25zdCBhc29ydDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChcclxuICAgICAgICBbYW91dGlkLCBhYnVmZl0sXHJcbiAgICAgICAgYW91dGlkLmxlbmd0aCArIGFidWZmLmxlbmd0aFxyXG4gICAgICApXHJcbiAgICAgIGNvbnN0IGJzb3J0OiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KFxyXG4gICAgICAgIFtib3V0aWQsIGJidWZmXSxcclxuICAgICAgICBib3V0aWQubGVuZ3RoICsgYmJ1ZmYubGVuZ3RoXHJcbiAgICAgIClcclxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGFzb3J0LCBic29ydCkgYXMgMSB8IC0xIHwgMFxyXG4gICAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFkZHJlc3NlcywgbG9ja3RpbWVzLCBhbmQgdGhyZXNob2xkcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zIHJlcHJlc2VudGluZyBvdXRwdXQgb3duZXIncyBhZGRyZXNzZXNcclxuICAgKiBAcGFyYW0gbG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGxvY2t0aW1lXHJcbiAgICogQHBhcmFtIHRocmVzaG9sZCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHRoZSB0aHJlc2hvbGQgbnVtYmVyIG9mIHNpZ25lcnMgcmVxdWlyZWQgdG8gc2lnbiB0aGUgdHJhbnNhY3Rpb25cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQsXHJcbiAgICBsb2NrdGltZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgIT09IFwidW5kZWZpbmVkXCIgJiYgYWRkcmVzc2VzLmxlbmd0aCkge1xyXG4gICAgICBjb25zdCBhZGRyczogQWRkcmVzc1tdID0gW11cclxuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGFkZHJzW2Ake2l9YF0gPSBuZXcgQWRkcmVzcygpXHJcbiAgICAgICAgYWRkcnNbYCR7aX1gXS5mcm9tQnVmZmVyKGFkZHJlc3Nlc1tgJHtpfWBdKVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuYWRkcmVzc2VzID0gYWRkcnNcclxuICAgICAgdGhpcy5hZGRyZXNzZXMuc29ydChBZGRyZXNzLmNvbXBhcmF0b3IoKSlcclxuICAgICAgdGhpcy5udW1hZGRycy53cml0ZVVJbnQzMkJFKHRoaXMuYWRkcmVzc2VzLmxlbmd0aCwgMClcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdGhyZXNob2xkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy50aHJlc2hvbGQud3JpdGVVSW50MzJCRSh0aHJlc2hvbGQgfHwgMSwgMClcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgbG9ja3RpbWUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy5sb2NrdGltZSA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGxvY2t0aW1lLCA4KVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE91dHB1dCBleHRlbmRzIE91dHB1dE93bmVycyB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiT3V0cHV0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGUgb3V0cHV0IHdoaWNoIHRlbGxzIHBhcnNlcnMgd2hhdCB0eXBlIGl0IGlzXHJcbiAgICovXHJcbiAgYWJzdHJhY3QgZ2V0T3V0cHV0SUQoKTogbnVtYmVyXHJcblxyXG4gIGFic3RyYWN0IGNsb25lKCk6IHRoaXNcclxuXHJcbiAgYWJzdHJhY3QgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xyXG5cclxuICBhYnN0cmFjdCBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBPdXRwdXRcclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBBbiBhc3NldElEIHdoaWNoIGlzIHdyYXBwZWQgYXJvdW5kIHRoZSBCdWZmZXIgb2YgdGhlIE91dHB1dFxyXG4gICAqXHJcbiAgICogTXVzdCBiZSBpbXBsZW1lbnRlZCB0byB1c2UgdGhlIGFwcHJvcHJpYXRlIFRyYW5zZmVyYWJsZU91dHB1dCBmb3IgdGhlIFZNLlxyXG4gICAqL1xyXG4gIGFic3RyYWN0IG1ha2VUcmFuc2ZlcmFibGUoYXNzZXRJRDogQnVmZmVyKTogU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRcclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkUGFyc2VhYmxlT3V0cHV0IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFBhcnNlYWJsZU91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgb3V0cHV0OiB0aGlzLm91dHB1dC5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgb3V0cHV0OiBPdXRwdXRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1BhcnNlYWJsZU91dHB1dF1dc1xyXG4gICAqL1xyXG4gIHN0YXRpYyBjb21wYXJhdG9yID1cclxuICAgICgpOiAoKFxyXG4gICAgICBhOiBTdGFuZGFyZFBhcnNlYWJsZU91dHB1dCxcclxuICAgICAgYjogU3RhbmRhcmRQYXJzZWFibGVPdXRwdXRcclxuICAgICkgPT4gMSB8IC0xIHwgMCkgPT5cclxuICAgIChhOiBTdGFuZGFyZFBhcnNlYWJsZU91dHB1dCwgYjogU3RhbmRhcmRQYXJzZWFibGVPdXRwdXQpOiAxIHwgLTEgfCAwID0+IHtcclxuICAgICAgY29uc3Qgc29ydGEgPSBhLnRvQnVmZmVyKClcclxuICAgICAgY29uc3Qgc29ydGIgPSBiLnRvQnVmZmVyKClcclxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHNvcnRhLCBzb3J0YikgYXMgMSB8IC0xIHwgMFxyXG4gICAgfVxyXG5cclxuICBnZXRPdXRwdXQgPSAoKTogT3V0cHV0ID0+IHRoaXMub3V0cHV0XHJcblxyXG4gIC8vIG11c3QgYmUgaW1wbGVtZW50ZWQgdG8gc2VsZWN0IG91dHB1dCB0eXBlcyBmb3IgdGhlIFZNIGluIHF1ZXN0aW9uXHJcbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcclxuXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IG91dGJ1ZmY6IEJ1ZmZlciA9IHRoaXMub3V0cHV0LnRvQnVmZmVyKClcclxuICAgIGNvbnN0IG91dGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIG91dGlkLndyaXRlVUludDMyQkUodGhpcy5vdXRwdXQuZ2V0T3V0cHV0SUQoKSwgMClcclxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW291dGlkLCBvdXRidWZmXVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgb3V0aWQubGVuZ3RoICsgb3V0YnVmZi5sZW5ndGgpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gW1tQYXJzZWFibGVPdXRwdXRdXSBmb3IgYSB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBvdXRwdXQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBJbnB1dElEIG9mIHRoZSBbW1BhcnNlYWJsZU91dHB1dF1dXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3Iob3V0cHV0OiBPdXRwdXQgPSB1bmRlZmluZWQpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmIChvdXRwdXQgaW5zdGFuY2VvZiBPdXRwdXQpIHtcclxuICAgICAgdGhpcy5vdXRwdXQgPSBvdXRwdXRcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dCBleHRlbmRzIFN0YW5kYXJkUGFyc2VhYmxlT3V0cHV0IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgYXNzZXRJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRJRCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLmFzc2V0SUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImFzc2V0SURcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImNiNThcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgMzJcclxuICAgIClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWRcclxuXHJcbiAgZ2V0QXNzZXRJRCA9ICgpOiBCdWZmZXIgPT4gdGhpcy5hc3NldElEXHJcblxyXG4gIC8vIG11c3QgYmUgaW1wbGVtZW50ZWQgdG8gc2VsZWN0IG91dHB1dCB0eXBlcyBmb3IgdGhlIFZNIGluIHF1ZXN0aW9uXHJcbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcclxuXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHBhcnNlYWJsZUJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcclxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuYXNzZXRJRCwgcGFyc2VhYmxlQnVmZl1cclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIHRoaXMuYXNzZXRJRC5sZW5ndGggKyBwYXJzZWFibGVCdWZmLmxlbmd0aClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0XV0gZm9yIGEgdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgYXNzZXRJRCBvZiB0aGUgW1tPdXRwdXRdXVxyXG4gICAqIEBwYXJhbSBvdXRwdXQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBJbnB1dElEIG9mIHRoZSBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0XV1cclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcihhc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsIG91dHB1dDogT3V0cHV0ID0gdW5kZWZpbmVkKSB7XHJcbiAgICBzdXBlcihvdXRwdXQpXHJcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy5hc3NldElEID0gYXNzZXRJRFxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgdG9rZW4gYW1vdW50IC5cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZEFtb3VudE91dHB1dCBleHRlbmRzIE91dHB1dCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRBbW91bnRPdXRwdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIGFtb3VudDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuYW1vdW50LFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgICAgOFxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuYW1vdW50ID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJhbW91bnRcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgOFxyXG4gICAgKVxyXG4gICAgdGhpcy5hbW91bnRWYWx1ZSA9IGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMuYW1vdW50KVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGFtb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXHJcbiAgcHJvdGVjdGVkIGFtb3VudFZhbHVlOiBCTiA9IG5ldyBCTigwKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhbW91bnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cclxuICAgKi9cclxuICBnZXRBbW91bnQoKTogQk4ge1xyXG4gICAgcmV0dXJuIHRoaXMuYW1vdW50VmFsdWUuY2xvbmUoKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbU3RhbmRhcmRBbW91bnRPdXRwdXRdXSBhbmQgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgb3V0cHV0LlxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIob3V0YnVmZjogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5hbW91bnQgPSBiaW50b29scy5jb3B5RnJvbShvdXRidWZmLCBvZmZzZXQsIG9mZnNldCArIDgpXHJcbiAgICB0aGlzLmFtb3VudFZhbHVlID0gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5hbW91bnQpXHJcbiAgICBvZmZzZXQgKz0gOFxyXG4gICAgcmV0dXJuIHN1cGVyLmZyb21CdWZmZXIob3V0YnVmZiwgb2Zmc2V0KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tTdGFuZGFyZEFtb3VudE91dHB1dF1dIGluc3RhbmNlLlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcclxuICAgIGNvbnN0IGJzaXplOiBudW1iZXIgPSB0aGlzLmFtb3VudC5sZW5ndGggKyBzdXBlcmJ1ZmYubGVuZ3RoXHJcbiAgICB0aGlzLm51bWFkZHJzLndyaXRlVUludDMyQkUodGhpcy5hZGRyZXNzZXMubGVuZ3RoLCAwKVxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5hbW91bnQsIHN1cGVyYnVmZl1cclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBbW1N0YW5kYXJkQW1vdW50T3V0cHV0XV0gY2xhc3Mgd2hpY2ggaXNzdWVzIGEgcGF5bWVudCBvbiBhbiBhc3NldElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFtb3VudCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgYW1vdW50IGluIHRoZSBvdXRwdXRcclxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9cyByZXByZXNlbnRpbmcgYWRkcmVzc2VzXHJcbiAgICogQHBhcmFtIGxvY2t0aW1lIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwcmVzZW50aW5nIHRoZSBsb2NrdGltZVxyXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSB0aGUgdGhyZXNob2xkIG51bWJlciBvZiBzaWduZXJzIHJlcXVpcmVkIHRvIHNpZ24gdGhlIHRyYW5zYWN0aW9uXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBhbW91bnQ6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgYWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGxvY2t0aW1lOiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcihhZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpXHJcbiAgICBpZiAodHlwZW9mIGFtb3VudCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLmFtb3VudFZhbHVlID0gYW1vdW50LmNsb25lKClcclxuICAgICAgdGhpcy5hbW91bnQgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihhbW91bnQsIDgpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gTkZULlxyXG4gKi9cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VORlRPdXRwdXQgZXh0ZW5kcyBPdXRwdXQge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkJhc2VORlRPdXRwdXRcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIGdyb3VwSUQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICB0aGlzLmdyb3VwSUQsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgICA0XHJcbiAgICAgIClcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5ncm91cElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJncm91cElEXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDRcclxuICAgIClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBncm91cElEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZ3JvdXBJRCBhcyBhIG51bWJlci5cclxuICAgKi9cclxuICBnZXRHcm91cElEID0gKCk6IG51bWJlciA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5ncm91cElELnJlYWRVSW50MzJCRSgwKVxyXG4gIH1cclxufVxyXG4iXX0=