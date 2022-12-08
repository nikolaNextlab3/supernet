"use strict";
/**
 * @packageDocumentation
 * @module Utils-Payload
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAGNETPayload = exports.ONIONPayload = exports.IPFSPayload = exports.URLPayload = exports.EMAILPayload = exports.YAMLPayload = exports.JSONPayload = exports.CSVPayload = exports.SVGPayload = exports.ICOPayload = exports.BMPPayload = exports.PNGPayload = exports.JPEGPayload = exports.SECPENCPayload = exports.SECPSIGPayload = exports.NODEIDPayload = exports.CHAINIDPayload = exports.SUBNETIDPayload = exports.NFTIDPayload = exports.UTXOIDPayload = exports.ASSETIDPayload = exports.TXIDPayload = exports.cb58EncodedPayload = exports.CCHAINADDRPayload = exports.PCHAINADDRPayload = exports.XCHAINADDRPayload = exports.ChainAddressPayload = exports.BIGNUMPayload = exports.B64STRPayload = exports.B58STRPayload = exports.HEXSTRPayload = exports.UTF8Payload = exports.BINPayload = exports.PayloadBase = exports.PayloadTypes = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("./bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const errors_1 = require("../utils/errors");
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class for determining payload types and managing the lookup table.
 */
class PayloadTypes {
    constructor() {
        this.types = [];
        this.types = [
            "BIN",
            "UTF8",
            "HEXSTR",
            "B58STR",
            "B64STR",
            "BIGNUM",
            "XCHAINADDR",
            "PCHAINADDR",
            "CCHAINADDR",
            "TXID",
            "ASSETID",
            "UTXOID",
            "NFTID",
            "SUBNETID",
            "CHAINID",
            "NODEID",
            "SECPSIG",
            "SECPENC",
            "JPEG",
            "PNG",
            "BMP",
            "ICO",
            "SVG",
            "CSV",
            "JSON",
            "YAML",
            "EMAIL",
            "URL",
            "IPFS",
            "ONION",
            "MAGNET"
        ];
    }
    /**
     * Given an encoded payload buffer returns the payload content (minus typeID).
     */
    getContent(payload) {
        const pl = bintools.copyFrom(payload, 5);
        return pl;
    }
    /**
     * Given an encoded payload buffer returns the payload (with typeID).
     */
    getPayload(payload) {
        const pl = bintools.copyFrom(payload, 4);
        return pl;
    }
    /**
     * Given a payload buffer returns the proper TypeID.
     */
    getTypeID(payload) {
        const offset = 4;
        const typeID = bintools
            .copyFrom(payload, offset, offset + 1)
            .readUInt8(0);
        return typeID;
    }
    /**
     * Given a type string returns the proper TypeID.
     */
    lookupID(typestr) {
        return this.types.indexOf(typestr);
    }
    /**
     * Given a TypeID returns a string describing the payload type.
     */
    lookupType(value) {
        return this.types[`${value}`];
    }
    /**
     * Given a TypeID returns the proper [[PayloadBase]].
     */
    select(typeID, ...args) {
        switch (typeID) {
            case 0:
                return new BINPayload(...args);
            case 1:
                return new UTF8Payload(...args);
            case 2:
                return new HEXSTRPayload(...args);
            case 3:
                return new B58STRPayload(...args);
            case 4:
                return new B64STRPayload(...args);
            case 5:
                return new BIGNUMPayload(...args);
            case 6:
                return new XCHAINADDRPayload(...args);
            case 7:
                return new PCHAINADDRPayload(...args);
            case 8:
                return new CCHAINADDRPayload(...args);
            case 9:
                return new TXIDPayload(...args);
            case 10:
                return new ASSETIDPayload(...args);
            case 11:
                return new UTXOIDPayload(...args);
            case 12:
                return new NFTIDPayload(...args);
            case 13:
                return new SUBNETIDPayload(...args);
            case 14:
                return new CHAINIDPayload(...args);
            case 15:
                return new NODEIDPayload(...args);
            case 16:
                return new SECPSIGPayload(...args);
            case 17:
                return new SECPENCPayload(...args);
            case 18:
                return new JPEGPayload(...args);
            case 19:
                return new PNGPayload(...args);
            case 20:
                return new BMPPayload(...args);
            case 21:
                return new ICOPayload(...args);
            case 22:
                return new SVGPayload(...args);
            case 23:
                return new CSVPayload(...args);
            case 24:
                return new JSONPayload(...args);
            case 25:
                return new YAMLPayload(...args);
            case 26:
                return new EMAILPayload(...args);
            case 27:
                return new URLPayload(...args);
            case 28:
                return new IPFSPayload(...args);
            case 29:
                return new ONIONPayload(...args);
            case 30:
                return new MAGNETPayload(...args);
        }
        throw new errors_1.TypeIdError(`Error - PayloadTypes.select: unknown typeid ${typeID}`);
    }
    /**
     * Given a [[PayloadBase]] which may not be cast properly, returns a properly cast [[PayloadBase]].
     */
    recast(unknowPayload) {
        return this.select(unknowPayload.typeID(), unknowPayload.returnType());
    }
    /**
     * Returns the [[PayloadTypes]] singleton.
     */
    static getInstance() {
        if (!PayloadTypes.instance) {
            PayloadTypes.instance = new PayloadTypes();
        }
        return PayloadTypes.instance;
    }
}
exports.PayloadTypes = PayloadTypes;
/**
 * Base class for payloads.
 */
class PayloadBase {
    constructor() {
        this.payload = buffer_1.Buffer.alloc(0);
        this.typeid = undefined;
    }
    /**
     * Returns the TypeID for the payload.
     */
    typeID() {
        return this.typeid;
    }
    /**
     * Returns the string name for the payload's type.
     */
    typeName() {
        return PayloadTypes.getInstance().lookupType(this.typeid);
    }
    /**
     * Returns the payload content (minus typeID).
     */
    getContent() {
        const pl = bintools.copyFrom(this.payload);
        return pl;
    }
    /**
     * Returns the payload (with typeID).
     */
    getPayload() {
        const typeID = buffer_1.Buffer.alloc(1);
        typeID.writeUInt8(this.typeid, 0);
        const pl = buffer_1.Buffer.concat([typeID, bintools.copyFrom(this.payload)]);
        return pl;
    }
    /**
     * Decodes the payload as a {@link https://github.com/feross/buffer|Buffer} including 4 bytes for the length and TypeID.
     */
    fromBuffer(bytes, offset = 0) {
        const size = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.typeid = bintools.copyFrom(bytes, offset, offset + 1).readUInt8(0);
        offset += 1;
        this.payload = bintools.copyFrom(bytes, offset, offset + size - 1);
        offset += size - 1;
        return offset;
    }
    /**
     * Encodes the payload as a {@link https://github.com/feross/buffer|Buffer} including 4 bytes for the length and TypeID.
     */
    toBuffer() {
        const sizebuff = buffer_1.Buffer.alloc(4);
        sizebuff.writeUInt32BE(this.payload.length + 1, 0);
        const typebuff = buffer_1.Buffer.alloc(1);
        typebuff.writeUInt8(this.typeid, 0);
        return buffer_1.Buffer.concat([sizebuff, typebuff, this.payload]);
    }
}
exports.PayloadBase = PayloadBase;
/**
 * Class for payloads representing simple binary blobs.
 */
class BINPayload extends PayloadBase {
    /**
     * @param payload Buffer only
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 0;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = bintools.b58ToBuffer(payload);
        }
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the payload.
     */
    returnType() {
        return this.payload;
    }
}
exports.BINPayload = BINPayload;
/**
 * Class for payloads representing UTF8 encoding.
 */
class UTF8Payload extends PayloadBase {
    /**
     * @param payload Buffer utf8 string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 1;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "utf8");
        }
    }
    /**
     * Returns a string for the payload.
     */
    returnType() {
        return this.payload.toString("utf8");
    }
}
exports.UTF8Payload = UTF8Payload;
/**
 * Class for payloads representing Hexadecimal encoding.
 */
class HEXSTRPayload extends PayloadBase {
    /**
     * @param payload Buffer or hex string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 2;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            if (payload.startsWith("0x") || !payload.match(/^[0-9A-Fa-f]+$/)) {
                throw new errors_1.HexError("HEXSTRPayload.constructor -- hex string may not start with 0x and must be in /^[0-9A-Fa-f]+$/: " +
                    payload);
            }
            this.payload = buffer_1.Buffer.from(payload, "hex");
        }
    }
    /**
     * Returns a hex string for the payload.
     */
    returnType() {
        return this.payload.toString("hex");
    }
}
exports.HEXSTRPayload = HEXSTRPayload;
/**
 * Class for payloads representing Base58 encoding.
 */
class B58STRPayload extends PayloadBase {
    /**
     * @param payload Buffer or cb58 encoded string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 3;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = bintools.b58ToBuffer(payload);
        }
    }
    /**
     * Returns a base58 string for the payload.
     */
    returnType() {
        return bintools.bufferToB58(this.payload);
    }
}
exports.B58STRPayload = B58STRPayload;
/**
 * Class for payloads representing Base64 encoding.
 */
class B64STRPayload extends PayloadBase {
    /**
     * @param payload Buffer of base64 string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 4;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "base64");
        }
    }
    /**
     * Returns a base64 string for the payload.
     */
    returnType() {
        return this.payload.toString("base64");
    }
}
exports.B64STRPayload = B64STRPayload;
/**
 * Class for payloads representing Big Numbers.
 *
 * @param payload Accepts a Buffer, BN, or base64 string
 */
class BIGNUMPayload extends PayloadBase {
    /**
     * @param payload Buffer, BN, or base64 string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 5;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (payload instanceof bn_js_1.default) {
            this.payload = bintools.fromBNToBuffer(payload);
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "hex");
        }
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the payload.
     */
    returnType() {
        return bintools.fromBufferToBN(this.payload);
    }
}
exports.BIGNUMPayload = BIGNUMPayload;
/**
 * Class for payloads representing chain addresses.
 *
 */
class ChainAddressPayload extends PayloadBase {
    /**
     * @param payload Buffer or address string
     */
    constructor(payload = undefined, hrp) {
        super();
        this.typeid = 6;
        this.chainid = "";
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            if (hrp != undefined) {
                this.payload = bintools.stringToAddress(payload, hrp);
            }
            else {
                this.payload = bintools.stringToAddress(payload);
            }
        }
    }
    /**
     * Returns the chainid.
     */
    returnChainID() {
        return this.chainid;
    }
    /**
     * Returns an address string for the payload.
     */
    returnType(hrp) {
        const type = "bech32";
        return serialization.bufferToType(this.payload, type, hrp, this.chainid);
    }
}
exports.ChainAddressPayload = ChainAddressPayload;
/**
 * Class for payloads representing X-Chin addresses.
 */
class XCHAINADDRPayload extends ChainAddressPayload {
    constructor() {
        super(...arguments);
        this.typeid = 6;
        this.chainid = "X";
    }
}
exports.XCHAINADDRPayload = XCHAINADDRPayload;
/**
 * Class for payloads representing P-Chain addresses.
 */
class PCHAINADDRPayload extends ChainAddressPayload {
    constructor() {
        super(...arguments);
        this.typeid = 7;
        this.chainid = "P";
    }
}
exports.PCHAINADDRPayload = PCHAINADDRPayload;
/**
 * Class for payloads representing C-Chain addresses.
 */
class CCHAINADDRPayload extends ChainAddressPayload {
    constructor() {
        super(...arguments);
        this.typeid = 8;
        this.chainid = "C";
    }
}
exports.CCHAINADDRPayload = CCHAINADDRPayload;
/**
 * Class for payloads representing data serialized by bintools.cb58Encode().
 */
class cb58EncodedPayload extends PayloadBase {
    /**
     * Returns a bintools.cb58Encoded string for the payload.
     */
    returnType() {
        return bintools.cb58Encode(this.payload);
    }
    /**
     * @param payload Buffer or cb58 encoded string
     */
    constructor(payload = undefined) {
        super();
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = bintools.cb58Decode(payload);
        }
    }
}
exports.cb58EncodedPayload = cb58EncodedPayload;
/**
 * Class for payloads representing TxIDs.
 */
class TXIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 9;
    }
}
exports.TXIDPayload = TXIDPayload;
/**
 * Class for payloads representing AssetIDs.
 */
class ASSETIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 10;
    }
}
exports.ASSETIDPayload = ASSETIDPayload;
/**
 * Class for payloads representing NODEIDs.
 */
class UTXOIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 11;
    }
}
exports.UTXOIDPayload = UTXOIDPayload;
/**
 * Class for payloads representing NFTIDs (UTXOIDs in an NFT context).
 */
class NFTIDPayload extends UTXOIDPayload {
    constructor() {
        super(...arguments);
        this.typeid = 12;
    }
}
exports.NFTIDPayload = NFTIDPayload;
/**
 * Class for payloads representing SubnetIDs.
 */
class SUBNETIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 13;
    }
}
exports.SUBNETIDPayload = SUBNETIDPayload;
/**
 * Class for payloads representing ChainIDs.
 */
class CHAINIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 14;
    }
}
exports.CHAINIDPayload = CHAINIDPayload;
/**
 * Class for payloads representing NodeIDs.
 */
class NODEIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 15;
    }
}
exports.NODEIDPayload = NODEIDPayload;
/**
 * Class for payloads representing secp256k1 signatures.
 * convention: secp256k1 signature (130 bytes)
 */
class SECPSIGPayload extends B58STRPayload {
    constructor() {
        super(...arguments);
        this.typeid = 16;
    }
}
exports.SECPSIGPayload = SECPSIGPayload;
/**
 * Class for payloads representing secp256k1 encrypted messages.
 * convention: public key (65 bytes) + secp256k1 encrypted message for that public key
 */
class SECPENCPayload extends B58STRPayload {
    constructor() {
        super(...arguments);
        this.typeid = 17;
    }
}
exports.SECPENCPayload = SECPENCPayload;
/**
 * Class for payloads representing JPEG images.
 */
class JPEGPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 18;
    }
}
exports.JPEGPayload = JPEGPayload;
class PNGPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 19;
    }
}
exports.PNGPayload = PNGPayload;
/**
 * Class for payloads representing BMP images.
 */
class BMPPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 20;
    }
}
exports.BMPPayload = BMPPayload;
/**
 * Class for payloads representing ICO images.
 */
class ICOPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 21;
    }
}
exports.ICOPayload = ICOPayload;
/**
 * Class for payloads representing SVG images.
 */
class SVGPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 22;
    }
}
exports.SVGPayload = SVGPayload;
/**
 * Class for payloads representing CSV files.
 */
class CSVPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 23;
    }
}
exports.CSVPayload = CSVPayload;
/**
 * Class for payloads representing JSON strings.
 */
class JSONPayload extends PayloadBase {
    constructor(payload = undefined) {
        super();
        this.typeid = 24;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "utf8");
        }
        else if (payload) {
            let jsonstr = JSON.stringify(payload);
            this.payload = buffer_1.Buffer.from(jsonstr, "utf8");
        }
    }
    /**
     * Returns a JSON-decoded object for the payload.
     */
    returnType() {
        return JSON.parse(this.payload.toString("utf8"));
    }
}
exports.JSONPayload = JSONPayload;
/**
 * Class for payloads representing YAML definitions.
 */
class YAMLPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 25;
    }
}
exports.YAMLPayload = YAMLPayload;
/**
 * Class for payloads representing email addresses.
 */
class EMAILPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 26;
    }
}
exports.EMAILPayload = EMAILPayload;
/**
 * Class for payloads representing URL strings.
 */
class URLPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 27;
    }
}
exports.URLPayload = URLPayload;
/**
 * Class for payloads representing IPFS addresses.
 */
class IPFSPayload extends B58STRPayload {
    constructor() {
        super(...arguments);
        this.typeid = 28;
    }
}
exports.IPFSPayload = IPFSPayload;
/**
 * Class for payloads representing onion URLs.
 */
class ONIONPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 29;
    }
}
exports.ONIONPayload = ONIONPayload;
/**
 * Class for payloads representing torrent magnet links.
 */
class MAGNETPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 30;
    }
}
exports.MAGNETPayload = MAGNETPayload;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF5bG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9wYXlsb2FkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7OztBQUVILG9DQUFnQztBQUNoQywwREFBaUM7QUFDakMsa0RBQXNCO0FBQ3RCLDRDQUF1RDtBQUN2RCwwREFBc0U7QUFFdEU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxZQUFZO0lBd0l2QjtRQXRJVSxVQUFLLEdBQWEsRUFBRSxDQUFBO1FBdUk1QixJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1gsS0FBSztZQUNMLE1BQU07WUFDTixRQUFRO1lBQ1IsUUFBUTtZQUNSLFFBQVE7WUFDUixRQUFRO1lBQ1IsWUFBWTtZQUNaLFlBQVk7WUFDWixZQUFZO1lBQ1osTUFBTTtZQUNOLFNBQVM7WUFDVCxRQUFRO1lBQ1IsT0FBTztZQUNQLFVBQVU7WUFDVixTQUFTO1lBQ1QsUUFBUTtZQUNSLFNBQVM7WUFDVCxTQUFTO1lBQ1QsTUFBTTtZQUNOLEtBQUs7WUFDTCxLQUFLO1lBQ0wsS0FBSztZQUNMLEtBQUs7WUFDTCxLQUFLO1lBQ0wsTUFBTTtZQUNOLE1BQU07WUFDTixPQUFPO1lBQ1AsS0FBSztZQUNMLE1BQU07WUFDTixPQUFPO1lBQ1AsUUFBUTtTQUNULENBQUE7SUFDSCxDQUFDO0lBdEtEOztPQUVHO0lBQ0gsVUFBVSxDQUFDLE9BQWU7UUFDeEIsTUFBTSxFQUFFLEdBQVcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDaEQsT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxVQUFVLENBQUMsT0FBZTtRQUN4QixNQUFNLEVBQUUsR0FB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QWEsVUFBVyxTQUFRLFdBQVc7SUFBM0M7O1FBQ1ksV0FBTSxHQUFHLEVBQUUsQ0FBQTtJQUN2QixDQUFDO0NBQUE7QUFGRCxnQ0FFQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsYUFBYTtJQUE5Qzs7UUFDWSxXQUFNLEdBQUcsRUFBRSxDQUFBO0lBQ3ZCLENBQUM7Q0FBQTtBQUZELGtDQUVDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLFlBQWEsU0FBUSxXQUFXO0lBQTdDOztRQUNZLFdBQU0sR0FBRyxFQUFFLENBQUE7SUFDdkIsQ0FBQztDQUFBO0FBRkQsb0NBRUM7QUFFRDs7R0FFRztBQUNILE1BQWEsYUFBYyxTQUFRLFdBQVc7SUFBOUM7O1FBQ1ksV0FBTSxHQUFHLEVBQUUsQ0FBQTtJQUN2QixDQUFDO0NBQUE7QUFGRCxzQ0FFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBVdGlscy1QYXlsb2FkXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4vYmludG9vbHNcIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHsgVHlwZUlkRXJyb3IsIEhleEVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXHJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRUeXBlIH0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBkZXRlcm1pbmluZyBwYXlsb2FkIHR5cGVzIGFuZCBtYW5hZ2luZyB0aGUgbG9va3VwIHRhYmxlLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFBheWxvYWRUeXBlcyB7XHJcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IFBheWxvYWRUeXBlc1xyXG4gIHByb3RlY3RlZCB0eXBlczogc3RyaW5nW10gPSBbXVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhbiBlbmNvZGVkIHBheWxvYWQgYnVmZmVyIHJldHVybnMgdGhlIHBheWxvYWQgY29udGVudCAobWludXMgdHlwZUlEKS5cclxuICAgKi9cclxuICBnZXRDb250ZW50KHBheWxvYWQ6IEJ1ZmZlcik6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBwbDogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20ocGF5bG9hZCwgNSlcclxuICAgIHJldHVybiBwbFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYW4gZW5jb2RlZCBwYXlsb2FkIGJ1ZmZlciByZXR1cm5zIHRoZSBwYXlsb2FkICh3aXRoIHR5cGVJRCkuXHJcbiAgICovXHJcbiAgZ2V0UGF5bG9hZChwYXlsb2FkOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgcGw6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKHBheWxvYWQsIDQpXHJcbiAgICByZXR1cm4gcGxcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgcGF5bG9hZCBidWZmZXIgcmV0dXJucyB0aGUgcHJvcGVyIFR5cGVJRC5cclxuICAgKi9cclxuICBnZXRUeXBlSUQocGF5bG9hZDogQnVmZmVyKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IG9mZnNldDogbnVtYmVyID0gNFxyXG4gICAgY29uc3QgdHlwZUlEOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20ocGF5bG9hZCwgb2Zmc2V0LCBvZmZzZXQgKyAxKVxyXG4gICAgICAucmVhZFVJbnQ4KDApXHJcbiAgICByZXR1cm4gdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIHR5cGUgc3RyaW5nIHJldHVybnMgdGhlIHByb3BlciBUeXBlSUQuXHJcbiAgICovXHJcbiAgbG9va3VwSUQodHlwZXN0cjogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnR5cGVzLmluZGV4T2YodHlwZXN0cilcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgVHlwZUlEIHJldHVybnMgYSBzdHJpbmcgZGVzY3JpYmluZyB0aGUgcGF5bG9hZCB0eXBlLlxyXG4gICAqL1xyXG4gIGxvb2t1cFR5cGUodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy50eXBlc1tgJHt2YWx1ZX1gXVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSBUeXBlSUQgcmV0dXJucyB0aGUgcHJvcGVyIFtbUGF5bG9hZEJhc2VdXS5cclxuICAgKi9cclxuICBzZWxlY3QodHlwZUlEOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogUGF5bG9hZEJhc2Uge1xyXG4gICAgc3dpdGNoICh0eXBlSUQpIHtcclxuICAgICAgY2FzZSAwOlxyXG4gICAgICAgIHJldHVybiBuZXcgQklOUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDE6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBVVEY4UGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDI6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBIRVhTVFJQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMzpcclxuICAgICAgICByZXR1cm4gbmV3IEI1OFNUUlBheWxvYWQoLi4uYXJncylcclxuICAgICAgY2FzZSA0OlxyXG4gICAgICAgIHJldHVybiBuZXcgQjY0U1RSUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDU6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCSUdOVU1QYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgNjpcclxuICAgICAgICByZXR1cm4gbmV3IFhDSEFJTkFERFJQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgNzpcclxuICAgICAgICByZXR1cm4gbmV3IFBDSEFJTkFERFJQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgODpcclxuICAgICAgICByZXR1cm4gbmV3IENDSEFJTkFERFJQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgOTpcclxuICAgICAgICByZXR1cm4gbmV3IFRYSURQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMTA6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBBU1NFVElEUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDExOlxyXG4gICAgICAgIHJldHVybiBuZXcgVVRYT0lEUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDEyOlxyXG4gICAgICAgIHJldHVybiBuZXcgTkZUSURQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMTM6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTVUJORVRJRFBheWxvYWQoLi4uYXJncylcclxuICAgICAgY2FzZSAxNDpcclxuICAgICAgICByZXR1cm4gbmV3IENIQUlOSURQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMTU6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOT0RFSURQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMTY6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTRUNQU0lHUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDE3OlxyXG4gICAgICAgIHJldHVybiBuZXcgU0VDUEVOQ1BheWxvYWQoLi4uYXJncylcclxuICAgICAgY2FzZSAxODpcclxuICAgICAgICByZXR1cm4gbmV3IEpQRUdQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMTk6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQTkdQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMjA6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCTVBQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMjE6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBJQ09QYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMjI6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTVkdQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMjM6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDU1ZQYXlsb2FkKC4uLmFyZ3MpXHJcbiAgICAgIGNhc2UgMjQ6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBKU09OUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDI1OlxyXG4gICAgICAgIHJldHVybiBuZXcgWUFNTFBheWxvYWQoLi4uYXJncylcclxuICAgICAgY2FzZSAyNjpcclxuICAgICAgICByZXR1cm4gbmV3IEVNQUlMUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDI3OlxyXG4gICAgICAgIHJldHVybiBuZXcgVVJMUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDI4OlxyXG4gICAgICAgIHJldHVybiBuZXcgSVBGU1BheWxvYWQoLi4uYXJncylcclxuICAgICAgY2FzZSAyOTpcclxuICAgICAgICByZXR1cm4gbmV3IE9OSU9OUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgICBjYXNlIDMwOlxyXG4gICAgICAgIHJldHVybiBuZXcgTUFHTkVUUGF5bG9hZCguLi5hcmdzKVxyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IFR5cGVJZEVycm9yKFxyXG4gICAgICBgRXJyb3IgLSBQYXlsb2FkVHlwZXMuc2VsZWN0OiB1bmtub3duIHR5cGVpZCAke3R5cGVJRH1gXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIFtbUGF5bG9hZEJhc2VdXSB3aGljaCBtYXkgbm90IGJlIGNhc3QgcHJvcGVybHksIHJldHVybnMgYSBwcm9wZXJseSBjYXN0IFtbUGF5bG9hZEJhc2VdXS5cclxuICAgKi9cclxuICByZWNhc3QodW5rbm93UGF5bG9hZDogUGF5bG9hZEJhc2UpOiBQYXlsb2FkQmFzZSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZWxlY3QodW5rbm93UGF5bG9hZC50eXBlSUQoKSwgdW5rbm93UGF5bG9hZC5yZXR1cm5UeXBlKCkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBbW1BheWxvYWRUeXBlc11dIHNpbmdsZXRvbi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogUGF5bG9hZFR5cGVzIHtcclxuICAgIGlmICghUGF5bG9hZFR5cGVzLmluc3RhbmNlKSB7XHJcbiAgICAgIFBheWxvYWRUeXBlcy5pbnN0YW5jZSA9IG5ldyBQYXlsb2FkVHlwZXMoKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQYXlsb2FkVHlwZXMuaW5zdGFuY2VcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnR5cGVzID0gW1xyXG4gICAgICBcIkJJTlwiLFxyXG4gICAgICBcIlVURjhcIixcclxuICAgICAgXCJIRVhTVFJcIixcclxuICAgICAgXCJCNThTVFJcIixcclxuICAgICAgXCJCNjRTVFJcIixcclxuICAgICAgXCJCSUdOVU1cIixcclxuICAgICAgXCJYQ0hBSU5BRERSXCIsXHJcbiAgICAgIFwiUENIQUlOQUREUlwiLFxyXG4gICAgICBcIkNDSEFJTkFERFJcIixcclxuICAgICAgXCJUWElEXCIsXHJcbiAgICAgIFwiQVNTRVRJRFwiLFxyXG4gICAgICBcIlVUWE9JRFwiLFxyXG4gICAgICBcIk5GVElEXCIsXHJcbiAgICAgIFwiU1VCTkVUSURcIixcclxuICAgICAgXCJDSEFJTklEXCIsXHJcbiAgICAgIFwiTk9ERUlEXCIsXHJcbiAgICAgIFwiU0VDUFNJR1wiLFxyXG4gICAgICBcIlNFQ1BFTkNcIixcclxuICAgICAgXCJKUEVHXCIsXHJcbiAgICAgIFwiUE5HXCIsXHJcbiAgICAgIFwiQk1QXCIsXHJcbiAgICAgIFwiSUNPXCIsXHJcbiAgICAgIFwiU1ZHXCIsXHJcbiAgICAgIFwiQ1NWXCIsXHJcbiAgICAgIFwiSlNPTlwiLFxyXG4gICAgICBcIllBTUxcIixcclxuICAgICAgXCJFTUFJTFwiLFxyXG4gICAgICBcIlVSTFwiLFxyXG4gICAgICBcIklQRlNcIixcclxuICAgICAgXCJPTklPTlwiLFxyXG4gICAgICBcIk1BR05FVFwiXHJcbiAgICBdXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQmFzZSBjbGFzcyBmb3IgcGF5bG9hZHMuXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUGF5bG9hZEJhc2Uge1xyXG4gIHByb3RlY3RlZCBwYXlsb2FkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMClcclxuICBwcm90ZWN0ZWQgdHlwZWlkOiBudW1iZXIgPSB1bmRlZmluZWRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgVHlwZUlEIGZvciB0aGUgcGF5bG9hZC5cclxuICAgKi9cclxuICB0eXBlSUQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnR5cGVpZFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIG5hbWUgZm9yIHRoZSBwYXlsb2FkJ3MgdHlwZS5cclxuICAgKi9cclxuICB0eXBlTmFtZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIFBheWxvYWRUeXBlcy5nZXRJbnN0YW5jZSgpLmxvb2t1cFR5cGUodGhpcy50eXBlaWQpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIGNvbnRlbnQgKG1pbnVzIHR5cGVJRCkuXHJcbiAgICovXHJcbiAgZ2V0Q29udGVudCgpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgcGw6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMucGF5bG9hZClcclxuICAgIHJldHVybiBwbFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZCAod2l0aCB0eXBlSUQpLlxyXG4gICAqL1xyXG4gIGdldFBheWxvYWQoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHR5cGVJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDEpXHJcbiAgICB0eXBlSUQud3JpdGVVSW50OCh0aGlzLnR5cGVpZCwgMClcclxuICAgIGNvbnN0IHBsOiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KFt0eXBlSUQsIGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMucGF5bG9hZCldKVxyXG4gICAgcmV0dXJuIHBsXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWNvZGVzIHRoZSBwYXlsb2FkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gaW5jbHVkaW5nIDQgYnl0ZXMgZm9yIHRoZSBsZW5ndGggYW5kIFR5cGVJRC5cclxuICAgKi9cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICBjb25zdCBzaXplOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMudHlwZWlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMSkucmVhZFVJbnQ4KDApXHJcbiAgICBvZmZzZXQgKz0gMVxyXG4gICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgc2l6ZSAtIDEpXHJcbiAgICBvZmZzZXQgKz0gc2l6ZSAtIDFcclxuICAgIHJldHVybiBvZmZzZXRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuY29kZXMgdGhlIHBheWxvYWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBpbmNsdWRpbmcgNCBieXRlcyBmb3IgdGhlIGxlbmd0aCBhbmQgVHlwZUlELlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBzaXplYnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBzaXplYnVmZi53cml0ZVVJbnQzMkJFKHRoaXMucGF5bG9hZC5sZW5ndGggKyAxLCAwKVxyXG4gICAgY29uc3QgdHlwZWJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxKVxyXG4gICAgdHlwZWJ1ZmYud3JpdGVVSW50OCh0aGlzLnR5cGVpZCwgMClcclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFtzaXplYnVmZiwgdHlwZWJ1ZmYsIHRoaXMucGF5bG9hZF0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBleHBlY3RlZCB0eXBlIGZvciB0aGUgcGF5bG9hZC5cclxuICAgKi9cclxuICBhYnN0cmFjdCByZXR1cm5UeXBlKC4uLmFyZ3M6IGFueSk6IGFueVxyXG5cclxuICBjb25zdHJ1Y3RvcigpIHt9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIHNpbXBsZSBiaW5hcnkgYmxvYnMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQklOUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBwYXlsb2FkLlxyXG4gICAqL1xyXG4gIHJldHVyblR5cGUoKTogQnVmZmVyIHtcclxuICAgIHJldHVybiB0aGlzLnBheWxvYWRcclxuICB9XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHBheWxvYWQgQnVmZmVyIG9ubHlcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihwYXlsb2FkOiBhbnkgPSB1bmRlZmluZWQpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuYjU4VG9CdWZmZXIocGF5bG9hZClcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIFVURjggZW5jb2RpbmcuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgVVRGOFBheWxvYWQgZXh0ZW5kcyBQYXlsb2FkQmFzZSB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDFcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyBmb3IgdGhlIHBheWxvYWQuXHJcbiAgICovXHJcbiAgcmV0dXJuVHlwZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMucGF5bG9hZC50b1N0cmluZyhcInV0ZjhcIilcclxuICB9XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHBheWxvYWQgQnVmZmVyIHV0Zjggc3RyaW5nXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IocGF5bG9hZDogYW55ID0gdW5kZWZpbmVkKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xyXG4gICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHBheWxvYWQsIFwidXRmOFwiKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgSGV4YWRlY2ltYWwgZW5jb2RpbmcuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgSEVYU1RSUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMlxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgaGV4IHN0cmluZyBmb3IgdGhlIHBheWxvYWQuXHJcbiAgICovXHJcbiAgcmV0dXJuVHlwZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMucGF5bG9hZC50b1N0cmluZyhcImhleFwiKVxyXG4gIH1cclxuICAvKipcclxuICAgKiBAcGFyYW0gcGF5bG9hZCBCdWZmZXIgb3IgaGV4IHN0cmluZ1xyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHBheWxvYWQ6IGFueSA9IHVuZGVmaW5lZCkge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgaWYgKHBheWxvYWQgaW5zdGFuY2VvZiBCdWZmZXIpIHtcclxuICAgICAgdGhpcy5wYXlsb2FkID0gcGF5bG9hZFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBpZiAocGF5bG9hZC5zdGFydHNXaXRoKFwiMHhcIikgfHwgIXBheWxvYWQubWF0Y2goL15bMC05QS1GYS1mXSskLykpIHtcclxuICAgICAgICB0aHJvdyBuZXcgSGV4RXJyb3IoXHJcbiAgICAgICAgICBcIkhFWFNUUlBheWxvYWQuY29uc3RydWN0b3IgLS0gaGV4IHN0cmluZyBtYXkgbm90IHN0YXJ0IHdpdGggMHggYW5kIG11c3QgYmUgaW4gL15bMC05QS1GYS1mXSskLzogXCIgK1xyXG4gICAgICAgICAgICBwYXlsb2FkXHJcbiAgICAgICAgKVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHBheWxvYWQsIFwiaGV4XCIpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBCYXNlNTggZW5jb2RpbmcuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQjU4U1RSUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gM1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZTU4IHN0cmluZyBmb3IgdGhlIHBheWxvYWQuXHJcbiAgICovXHJcbiAgcmV0dXJuVHlwZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMucGF5bG9hZClcclxuICB9XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHBheWxvYWQgQnVmZmVyIG9yIGNiNTggZW5jb2RlZCBzdHJpbmdcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihwYXlsb2FkOiBhbnkgPSB1bmRlZmluZWQpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuYjU4VG9CdWZmZXIocGF5bG9hZClcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIEJhc2U2NCBlbmNvZGluZy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBCNjRTVFJQYXlsb2FkIGV4dGVuZHMgUGF5bG9hZEJhc2Uge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSA0XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiYXNlNjQgc3RyaW5nIGZvciB0aGUgcGF5bG9hZC5cclxuICAgKi9cclxuICByZXR1cm5UeXBlKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXlsb2FkLnRvU3RyaW5nKFwiYmFzZTY0XCIpXHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBwYXlsb2FkIEJ1ZmZlciBvZiBiYXNlNjQgc3RyaW5nXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IocGF5bG9hZDogYW55ID0gdW5kZWZpbmVkKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xyXG4gICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHBheWxvYWQsIFwiYmFzZTY0XCIpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBCaWcgTnVtYmVycy5cclxuICpcclxuICogQHBhcmFtIHBheWxvYWQgQWNjZXB0cyBhIEJ1ZmZlciwgQk4sIG9yIGJhc2U2NCBzdHJpbmdcclxuICovXHJcbmV4cG9ydCBjbGFzcyBCSUdOVU1QYXlsb2FkIGV4dGVuZHMgUGF5bG9hZEJhc2Uge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSA1XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHBheWxvYWQuXHJcbiAgICovXHJcbiAgcmV0dXJuVHlwZSgpOiBCTiB7XHJcbiAgICByZXR1cm4gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5wYXlsb2FkKVxyXG4gIH1cclxuICAvKipcclxuICAgKiBAcGFyYW0gcGF5bG9hZCBCdWZmZXIsIEJOLCBvciBiYXNlNjQgc3RyaW5nXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IocGF5bG9hZDogYW55ID0gdW5kZWZpbmVkKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xyXG4gICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkXHJcbiAgICB9IGVsc2UgaWYgKHBheWxvYWQgaW5zdGFuY2VvZiBCTikge1xyXG4gICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihwYXlsb2FkKVxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB0aGlzLnBheWxvYWQgPSBCdWZmZXIuZnJvbShwYXlsb2FkLCBcImhleFwiKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgY2hhaW4gYWRkcmVzc2VzLlxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENoYWluQWRkcmVzc1BheWxvYWQgZXh0ZW5kcyBQYXlsb2FkQmFzZSB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDZcclxuICBwcm90ZWN0ZWQgY2hhaW5pZDogc3RyaW5nID0gXCJcIlxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjaGFpbmlkLlxyXG4gICAqL1xyXG4gIHJldHVybkNoYWluSUQoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLmNoYWluaWRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYWRkcmVzcyBzdHJpbmcgZm9yIHRoZSBwYXlsb2FkLlxyXG4gICAqL1xyXG4gIHJldHVyblR5cGUoaHJwOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgdHlwZTogU2VyaWFsaXplZFR5cGUgPSBcImJlY2gzMlwiXHJcbiAgICByZXR1cm4gc2VyaWFsaXphdGlvbi5idWZmZXJUb1R5cGUodGhpcy5wYXlsb2FkLCB0eXBlLCBocnAsIHRoaXMuY2hhaW5pZClcclxuICB9XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHBheWxvYWQgQnVmZmVyIG9yIGFkZHJlc3Mgc3RyaW5nXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IocGF5bG9hZDogYW55ID0gdW5kZWZpbmVkLCBocnA/OiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgaWYgKGhycCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MocGF5bG9hZCwgaHJwKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucGF5bG9hZCA9IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhwYXlsb2FkKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBYLUNoaW4gYWRkcmVzc2VzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFhDSEFJTkFERFJQYXlsb2FkIGV4dGVuZHMgQ2hhaW5BZGRyZXNzUGF5bG9hZCB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDZcclxuICBwcm90ZWN0ZWQgY2hhaW5pZCA9IFwiWFwiXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIFAtQ2hhaW4gYWRkcmVzc2VzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFBDSEFJTkFERFJQYXlsb2FkIGV4dGVuZHMgQ2hhaW5BZGRyZXNzUGF5bG9hZCB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDdcclxuICBwcm90ZWN0ZWQgY2hhaW5pZCA9IFwiUFwiXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIEMtQ2hhaW4gYWRkcmVzc2VzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIENDSEFJTkFERFJQYXlsb2FkIGV4dGVuZHMgQ2hhaW5BZGRyZXNzUGF5bG9hZCB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDhcclxuICBwcm90ZWN0ZWQgY2hhaW5pZCA9IFwiQ1wiXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIGRhdGEgc2VyaWFsaXplZCBieSBiaW50b29scy5jYjU4RW5jb2RlKCkuXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgY2I1OEVuY29kZWRQYXlsb2FkIGV4dGVuZHMgUGF5bG9hZEJhc2Uge1xyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiaW50b29scy5jYjU4RW5jb2RlZCBzdHJpbmcgZm9yIHRoZSBwYXlsb2FkLlxyXG4gICAqL1xyXG4gIHJldHVyblR5cGUoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMucGF5bG9hZClcclxuICB9XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHBheWxvYWQgQnVmZmVyIG9yIGNiNTggZW5jb2RlZCBzdHJpbmdcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihwYXlsb2FkOiBhbnkgPSB1bmRlZmluZWQpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY2I1OERlY29kZShwYXlsb2FkKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgVHhJRHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgVFhJRFBheWxvYWQgZXh0ZW5kcyBjYjU4RW5jb2RlZFBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSA5XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIEFzc2V0SURzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEFTU0VUSURQYXlsb2FkIGV4dGVuZHMgY2I1OEVuY29kZWRQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMTBcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgTk9ERUlEcy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBVVFhPSURQYXlsb2FkIGV4dGVuZHMgY2I1OEVuY29kZWRQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMTFcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgTkZUSURzIChVVFhPSURzIGluIGFuIE5GVCBjb250ZXh0KS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBORlRJRFBheWxvYWQgZXh0ZW5kcyBVVFhPSURQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMTJcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgU3VibmV0SURzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFNVQk5FVElEUGF5bG9hZCBleHRlbmRzIGNiNThFbmNvZGVkUGF5bG9hZCB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDEzXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIENoYWluSURzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIENIQUlOSURQYXlsb2FkIGV4dGVuZHMgY2I1OEVuY29kZWRQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMTRcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgTm9kZUlEcy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBOT0RFSURQYXlsb2FkIGV4dGVuZHMgY2I1OEVuY29kZWRQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMTVcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgc2VjcDI1NmsxIHNpZ25hdHVyZXMuXHJcbiAqIGNvbnZlbnRpb246IHNlY3AyNTZrMSBzaWduYXR1cmUgKDEzMCBieXRlcylcclxuICovXHJcbmV4cG9ydCBjbGFzcyBTRUNQU0lHUGF5bG9hZCBleHRlbmRzIEI1OFNUUlBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAxNlxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBzZWNwMjU2azEgZW5jcnlwdGVkIG1lc3NhZ2VzLlxyXG4gKiBjb252ZW50aW9uOiBwdWJsaWMga2V5ICg2NSBieXRlcykgKyBzZWNwMjU2azEgZW5jcnlwdGVkIG1lc3NhZ2UgZm9yIHRoYXQgcHVibGljIGtleVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFNFQ1BFTkNQYXlsb2FkIGV4dGVuZHMgQjU4U1RSUGF5bG9hZCB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDE3XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIEpQRUcgaW1hZ2VzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEpQRUdQYXlsb2FkIGV4dGVuZHMgQklOUGF5bG9hZCB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDE4XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQTkdQYXlsb2FkIGV4dGVuZHMgQklOUGF5bG9hZCB7XHJcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDE5XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIEJNUCBpbWFnZXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQk1QUGF5bG9hZCBleHRlbmRzIEJJTlBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyMFxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBJQ08gaW1hZ2VzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIElDT1BheWxvYWQgZXh0ZW5kcyBCSU5QYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMjFcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgU1ZHIGltYWdlcy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTVkdQYXlsb2FkIGV4dGVuZHMgVVRGOFBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyMlxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBDU1YgZmlsZXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQ1NWUGF5bG9hZCBleHRlbmRzIFVURjhQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMjNcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgSlNPTiBzdHJpbmdzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEpTT05QYXlsb2FkIGV4dGVuZHMgUGF5bG9hZEJhc2Uge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyNFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgSlNPTi1kZWNvZGVkIG9iamVjdCBmb3IgdGhlIHBheWxvYWQuXHJcbiAgICovXHJcbiAgcmV0dXJuVHlwZSgpOiBhbnkge1xyXG4gICAgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5wYXlsb2FkLnRvU3RyaW5nKFwidXRmOFwiKSlcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKHBheWxvYWQ6IGFueSA9IHVuZGVmaW5lZCkge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgaWYgKHBheWxvYWQgaW5zdGFuY2VvZiBCdWZmZXIpIHtcclxuICAgICAgdGhpcy5wYXlsb2FkID0gcGF5bG9hZFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB0aGlzLnBheWxvYWQgPSBCdWZmZXIuZnJvbShwYXlsb2FkLCBcInV0ZjhcIilcclxuICAgIH0gZWxzZSBpZiAocGF5bG9hZCkge1xyXG4gICAgICBsZXQganNvbnN0cjogc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgdGhpcy5wYXlsb2FkID0gQnVmZmVyLmZyb20oanNvbnN0ciwgXCJ1dGY4XCIpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBZQU1MIGRlZmluaXRpb25zLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFlBTUxQYXlsb2FkIGV4dGVuZHMgVVRGOFBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyNVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBlbWFpbCBhZGRyZXNzZXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRU1BSUxQYXlsb2FkIGV4dGVuZHMgVVRGOFBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyNlxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBVUkwgc3RyaW5ncy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBVUkxQYXlsb2FkIGV4dGVuZHMgVVRGOFBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyN1xyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBJUEZTIGFkZHJlc3Nlcy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBJUEZTUGF5bG9hZCBleHRlbmRzIEI1OFNUUlBheWxvYWQge1xyXG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyOFxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBvbmlvbiBVUkxzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIE9OSU9OUGF5bG9hZCBleHRlbmRzIFVURjhQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMjlcclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgdG9ycmVudCBtYWduZXQgbGlua3MuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgTUFHTkVUUGF5bG9hZCBleHRlbmRzIFVURjhQYXlsb2FkIHtcclxuICBwcm90ZWN0ZWQgdHlwZWlkID0gMzBcclxufVxyXG4iXX0=