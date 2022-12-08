"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @packageDocumentation
 * @module Utils-BinTools
 */
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const create_hash_1 = __importDefault(require("create-hash"));
const bech32 = __importStar(require("bech32"));
const base58_1 = require("./base58");
const errors_1 = require("../utils/errors");
const ethers_1 = require("ethers");
/**
 * A class containing tools useful in interacting with binary data cross-platform using
 * nodejs & javascript.
 *
 * This class should never be instantiated directly. Instead,
 * invoke the "BinTools.getInstance()" static * function to grab the singleton
 * instance of the tools.
 *
 * Everything in this library uses
 * the {@link https://github.com/feross/buffer|feross's Buffer class}.
 *
 * ```js
 * const bintools: BinTools = BinTools.getInstance();
 * const b58str:  = bintools.bufferToB58(Buffer.from("Wubalubadubdub!"));
 * ```
 */
class BinTools {
    constructor() {
        /**
         * Returns true if meets requirements to parse as an address as Bech32 on X-Chain or P-Chain, otherwise false
         * @param address the string to verify is address
         */
        this.isPrimaryBechAddress = (address) => {
            const parts = address.trim().split("-");
            if (parts.length !== 2) {
                return false;
            }
            try {
                bech32.bech32.fromWords(bech32.bech32.decode(parts[1]).words);
            }
            catch (err) {
                return false;
            }
            return true;
        };
        /**
         * Produces a string from a {@link https://github.com/feross/buffer|Buffer}
         * representing a string. ONLY USED IN TRANSACTION FORMATTING, ASSUMED LENGTH IS PREPENDED.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to a string
         */
        this.bufferToString = (buff) => this.copyFrom(buff, 2).toString("utf8");
        /**
         * Produces a {@link https://github.com/feross/buffer|Buffer} from a string. ONLY USED IN TRANSACTION FORMATTING, LENGTH IS PREPENDED.
         *
         * @param str The string to convert to a {@link https://github.com/feross/buffer|Buffer}
         */
        this.stringToBuffer = (str) => {
            const buff = buffer_1.Buffer.alloc(2 + str.length);
            buff.writeUInt16BE(str.length, 0);
            buff.write(str, 2, str.length, "utf8");
            return buff;
        };
        /**
         * Makes a copy (no reference) of a {@link https://github.com/feross/buffer|Buffer}
         * over provided indecies.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to copy
         * @param start The index to start the copy
         * @param end The index to end the copy
         */
        this.copyFrom = (buff, start = 0, end = undefined) => {
            if (end === undefined) {
                end = buff.length;
            }
            return buffer_1.Buffer.from(Uint8Array.prototype.slice.call(buff.slice(start, end)));
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string of
         * the {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to base-58
         */
        this.bufferToB58 = (buff) => this.b58.encode(buff);
        /**
         * Takes a base-58 string and returns a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param b58str The base-58 string to convert
         * to a {@link https://github.com/feross/buffer|Buffer}
         */
        this.b58ToBuffer = (b58str) => this.b58.decode(b58str);
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and returns an ArrayBuffer.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to
         * convert to an ArrayBuffer
         */
        this.fromBufferToArrayBuffer = (buff) => {
            const ab = new ArrayBuffer(buff.length);
            const view = new Uint8Array(ab);
            for (let i = 0; i < buff.length; ++i) {
                view[`${i}`] = buff[`${i}`];
            }
            return view;
        };
        /**
         * Takes an ArrayBuffer and converts it to a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param ab The ArrayBuffer to convert to a {@link https://github.com/feross/buffer|Buffer}
         */
        this.fromArrayBufferToBuffer = (ab) => {
            const buf = buffer_1.Buffer.alloc(ab.byteLength);
            for (let i = 0; i < ab.byteLength; ++i) {
                buf[`${i}`] = ab[`${i}`];
            }
            return buf;
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and converts it
         * to a {@link https://github.com/indutny/bn.js/|BN}.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert
         * to a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.fromBufferToBN = (buff) => {
            if (typeof buff === "undefined") {
                return undefined;
            }
            return new bn_js_1.default(buff.toString("hex"), 16, "be");
        };
        /**
         * Takes a {@link https://github.com/indutny/bn.js/|BN} and converts it
         * to a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param bn The {@link https://github.com/indutny/bn.js/|BN} to convert
         * to a {@link https://github.com/feross/buffer|Buffer}
         * @param length The zero-padded length of the {@link https://github.com/feross/buffer|Buffer}
         */
        this.fromBNToBuffer = (bn, length) => {
            if (typeof bn === "undefined") {
                return undefined;
            }
            const newarr = bn.toArray("be");
            /**
             * CKC: Still unsure why bn.toArray with a "be" and a length do not work right. Bug?
             */
            if (length) {
                // bn toArray with the length parameter doesn't work correctly, need this.
                const x = length - newarr.length;
                for (let i = 0; i < x; i++) {
                    newarr.unshift(0);
                }
            }
            return buffer_1.Buffer.from(newarr);
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and adds a checksum, returning
         * a {@link https://github.com/feross/buffer|Buffer} with the 4-byte checksum appended.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to append a checksum
         */
        this.addChecksum = (buff) => {
            const hashslice = buffer_1.Buffer.from((0, create_hash_1.default)("sha256").update(buff).digest().slice(28));
            return buffer_1.Buffer.concat([buff, hashslice]);
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} with an appended 4-byte checksum
         * and returns true if the checksum is valid, otherwise false.
         *
         * @param b The {@link https://github.com/feross/buffer|Buffer} to validate the checksum
         */
        this.validateChecksum = (buff) => {
            const checkslice = buff.slice(buff.length - 4);
            const hashslice = buffer_1.Buffer.from((0, create_hash_1.default)("sha256")
                .update(buff.slice(0, buff.length - 4))
                .digest()
                .slice(28));
            return checkslice.toString("hex") === hashslice.toString("hex");
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string with
         * checksum as per the cb58 standard.
         *
         * @param bytes A {@link https://github.com/feross/buffer|Buffer} to serialize
         *
         * @returns A serialized base-58 string of the Buffer.
         */
        this.cb58Encode = (bytes) => {
            const x = this.addChecksum(bytes);
            return this.bufferToB58(x);
        };
        /**
         * Takes a cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
         * and returns a {@link https://github.com/feross/buffer|Buffer} of the original data. Throws on error.
         *
         * @param bytes A cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
         */
        this.cb58Decode = (bytes) => {
            if (typeof bytes === "string") {
                bytes = this.b58ToBuffer(bytes);
            }
            if (this.validateChecksum(bytes)) {
                return this.copyFrom(bytes, 0, bytes.length - 4);
            }
            throw new errors_1.ChecksumError("Error - BinTools.cb58Decode: invalid checksum");
        };
        this.cb58DecodeWithChecksum = (bytes) => {
            if (typeof bytes === "string") {
                bytes = this.b58ToBuffer(bytes);
            }
            if (this.validateChecksum(bytes)) {
                return `0x${this.copyFrom(bytes, 0, bytes.length).toString("hex")}`;
            }
            throw new errors_1.ChecksumError("Error - BinTools.cb58Decode: invalid checksum");
        };
        this.addressToString = (hrp, chainid, bytes) => `${chainid}-${bech32.bech32.encode(hrp, bech32.bech32.toWords(bytes))}`;
        this.stringToAddress = (address, hrp) => {
            if (address.substring(0, 2) === "0x") {
                // ETH-style address
                if (ethers_1.utils.isAddress(address)) {
                    return buffer_1.Buffer.from(address.substring(2), "hex");
                }
                else {
                    throw new errors_1.HexError("Error - Invalid address");
                }
            }
            // Bech32 addresses
            const parts = address.trim().split("-");
            if (parts.length < 2) {
                throw new errors_1.Bech32Error("Error - Valid address should include -");
            }
            if (parts[0].length < 1) {
                throw new errors_1.Bech32Error("Error - Valid address must have prefix before -");
            }
            const split = parts[1].lastIndexOf("1");
            if (split < 0) {
                throw new errors_1.Bech32Error("Error - Valid address must include separator (1)");
            }
            const humanReadablePart = parts[1].slice(0, split);
            if (humanReadablePart.length < 1) {
                throw new errors_1.Bech32Error("Error - HRP should be at least 1 character");
            }
            if (humanReadablePart !== "june" &&
                humanReadablePart != "local" &&
                humanReadablePart != "custom" &&
                humanReadablePart != hrp) {
                throw new errors_1.Bech32Error("Error - Invalid HRP");
            }
            return buffer_1.Buffer.from(bech32.bech32.fromWords(bech32.bech32.decode(parts[1]).words));
        };
        /**
         * Takes an address and returns its {@link https://github.com/feross/buffer|Buffer}
         * representation if valid. A more strict version of stringToAddress.
         *
         * @param addr A string representation of the address
         * @param blockchainID A cb58 encoded string representation of the blockchainID
         * @param alias A chainID alias, if any, that the address can also parse from.
         * @param addrlen VMs can use any addressing scheme that they like, so this is the appropriate number of address bytes. Default 20.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid,
         * undefined if not valid.
         */
        this.parseAddress = (addr, blockchainID, alias = undefined, addrlen = 20) => {
            const abc = addr.split("-");
            if (abc.length === 2 &&
                ((alias && abc[0] === alias) || (blockchainID && abc[0] === blockchainID))) {
                const addrbuff = this.stringToAddress(addr);
                if ((addrlen && addrbuff.length === addrlen) || !addrlen) {
                    return addrbuff;
                }
            }
            return undefined;
        };
        this.b58 = base58_1.Base58.getInstance();
    }
    /**
     * Retrieves the BinTools singleton.
     */
    static getInstance() {
        if (!BinTools.instance) {
            BinTools.instance = new BinTools();
        }
        return BinTools.instance;
    }
    /**
     * Returns true if base64, otherwise false
     * @param str the string to verify is Base64
     */
    isBase64(str) {
        if (str === "" || str.trim() === "") {
            return false;
        }
        try {
            let b64 = buffer_1.Buffer.from(str, "base64");
            return b64.toString("base64") === str;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Returns true if cb58, otherwise false
     * @param cb58 the string to verify is cb58
     */
    isCB58(cb58) {
        return this.isBase58(cb58);
    }
    /**
     * Returns true if base58, otherwise false
     * @param base58 the string to verify is base58
     */
    isBase58(base58) {
        if (base58 === "" || base58.trim() === "") {
            return false;
        }
        try {
            return this.b58.encode(this.b58.decode(base58)) === base58;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Returns true if hexidecimal, otherwise false
     * @param hex the string to verify is hexidecimal
     */
    isHex(hex) {
        if (hex === "" || hex.trim() === "") {
            return false;
        }
        const startsWith0x = hex.startsWith("0x");
        const matchResult = startsWith0x
            ? hex.slice(2).match(/[0-9A-Fa-f]/g)
            : hex.match(/[0-9A-Fa-f]/g);
        if ((startsWith0x && hex.length - 2 == matchResult.length) ||
            hex.length == matchResult.length) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Returns true if decimal, otherwise false
     * @param str the string to verify is hexidecimal
     */
    isDecimal(str) {
        if (str === "" || str.trim() === "") {
            return false;
        }
        try {
            return new bn_js_1.default(str, 10).toString(10) === str.trim();
        }
        catch (err) {
            return false;
        }
    }
}
exports.default = BinTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmludG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvYmludG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7R0FHRztBQUNILGtEQUFzQjtBQUN0QixvQ0FBZ0M7QUFDaEMsOERBQW9DO0FBQ3BDLCtDQUFnQztBQUNoQyxxQ0FBaUM7QUFDakMsNENBQXNFO0FBQ3RFLG1DQUE4QjtBQUU5Qjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFxQixRQUFRO0lBRzNCO1FBNEZBOzs7V0FHRztRQUNILHlCQUFvQixHQUFHLENBQUMsT0FBZSxFQUFXLEVBQUU7WUFDbEQsTUFBTSxLQUFLLEdBQWEsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixPQUFPLEtBQUssQ0FBQTthQUNiO1lBQ0QsSUFBSTtnQkFDRixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUM5RDtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE9BQU8sS0FBSyxDQUFBO2FBQ2I7WUFDRCxPQUFPLElBQUksQ0FBQTtRQUNiLENBQUMsQ0FBQTtRQUVEOzs7OztXQUtHO1FBQ0gsbUJBQWMsR0FBRyxDQUFDLElBQVksRUFBVSxFQUFFLENBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV6Qzs7OztXQUlHO1FBQ0gsbUJBQWMsR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSxHQUFXLGVBQU0sQ0FBQyxL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QUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO1NBQ25EO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLEtBQUssQ0FBQTtTQUNiO0lBQ0gsQ0FBQztDQWdTRjtBQTdYRCwyQkE2WEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgVXRpbHMtQmluVG9vbHNcclxuICovXHJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBjcmVhdGVIYXNoIGZyb20gXCJjcmVhdGUtaGFzaFwiXHJcbmltcG9ydCAqIGFzIGJlY2gzMiBmcm9tIFwiYmVjaDMyXCJcclxuaW1wb3J0IHsgQmFzZTU4IH0gZnJvbSBcIi4vYmFzZTU4XCJcclxuaW1wb3J0IHsgQmVjaDMyRXJyb3IsIENoZWNrc3VtRXJyb3IsIEhleEVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXHJcbmltcG9ydCB7IHV0aWxzIH0gZnJvbSBcImV0aGVyc1wiXHJcblxyXG4vKipcclxuICogQSBjbGFzcyBjb250YWluaW5nIHRvb2xzIHVzZWZ1bCBpbiBpbnRlcmFjdGluZyB3aXRoIGJpbmFyeSBkYXRhIGNyb3NzLXBsYXRmb3JtIHVzaW5nXHJcbiAqIG5vZGVqcyAmIGphdmFzY3JpcHQuXHJcbiAqXHJcbiAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5ldmVyIGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCxcclxuICogaW52b2tlIHRoZSBcIkJpblRvb2xzLmdldEluc3RhbmNlKClcIiBzdGF0aWMgKiBmdW5jdGlvbiB0byBncmFiIHRoZSBzaW5nbGV0b25cclxuICogaW5zdGFuY2Ugb2YgdGhlIHRvb2xzLlxyXG4gKlxyXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbGlicmFyeSB1c2VzXHJcbiAqIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8ZmVyb3NzJ3MgQnVmZmVyIGNsYXNzfS5cclxuICpcclxuICogYGBganNcclxuICogY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcclxuICogY29uc3QgYjU4c3RyOiAgPSBiaW50b29scy5idWZmZXJUb0I1OChCdWZmZXIuZnJvbShcIld1YmFsdWJhZHViZHViIVwiKSk7XHJcbiAqIGBgYFxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmluVG9vbHMge1xyXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBCaW5Ub29sc1xyXG5cclxuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5iNTggPSBCYXNlNTguZ2V0SW5zdGFuY2UoKVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBiNTg6IEJhc2U1OFxyXG5cclxuICAvKipcclxuICAgKiBSZXRyaWV2ZXMgdGhlIEJpblRvb2xzIHNpbmdsZXRvbi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogQmluVG9vbHMge1xyXG4gICAgaWYgKCFCaW5Ub29scy5pbnN0YW5jZSkge1xyXG4gICAgICBCaW5Ub29scy5pbnN0YW5jZSA9IG5ldyBCaW5Ub29scygpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gQmluVG9vbHMuaW5zdGFuY2VcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBiYXNlNjQsIG90aGVyd2lzZSBmYWxzZVxyXG4gICAqIEBwYXJhbSBzdHIgdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgQmFzZTY0XHJcbiAgICovXHJcbiAgaXNCYXNlNjQoc3RyOiBzdHJpbmcpIHtcclxuICAgIGlmIChzdHIgPT09IFwiXCIgfHwgc3RyLnRyaW0oKSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGxldCBiNjQ6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHN0ciwgXCJiYXNlNjRcIilcclxuICAgICAgcmV0dXJuIGI2NC50b1N0cmluZyhcImJhc2U2NFwiKSA9PT0gc3RyXHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgY2I1OCwgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgICogQHBhcmFtIGNiNTggdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgY2I1OFxyXG4gICAqL1xyXG4gIGlzQ0I1OChjYjU4OiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzQmFzZTU4KGNiNTgpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgYmFzZTU4LCBvdGhlcndpc2UgZmFsc2VcclxuICAgKiBAcGFyYW0gYmFzZTU4IHRoZSBzdHJpbmcgdG8gdmVyaWZ5IGlzIGJhc2U1OFxyXG4gICAqL1xyXG4gIGlzQmFzZTU4KGJhc2U1ODogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoYmFzZTU4ID09PSBcIlwiIHx8IGJhc2U1OC50cmltKCkgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICByZXR1cm4gdGhpcy5iNTguZW5jb2RlKHRoaXMuYjU4LmRlY29kZShiYXNlNTgpKSA9PT0gYmFzZTU4XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgaGV4aWRlY2ltYWwsIG90aGVyd2lzZSBmYWxzZVxyXG4gICAqIEBwYXJhbSBoZXggdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgaGV4aWRlY2ltYWxcclxuICAgKi9cclxuICBpc0hleChoZXg6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKGhleCA9PT0gXCJcIiB8fCBoZXgudHJpbSgpID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG4gICAgY29uc3Qgc3RhcnRzV2l0aDB4ID0gaGV4LnN0YXJ0c1dpdGgoXCIweFwiKVxyXG4gICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBzdGFydHNXaXRoMHhcclxuICAgICAgPyBoZXguc2xpY2UoMikubWF0Y2goL1swLTlBLUZhLWZdL2cpXHJcbiAgICAgIDogaGV4Lm1hdGNoKC9bMC05QS1GYS1mXS9nKVxyXG4gICAgaWYgKFxyXG4gICAgICAoc3RhcnRzV2l0aDB4ICYmIGhleC5sZW5ndGggLSAyID09IG1hdGNoUmVzdWx0Lmxlbmd0aCkgfHxcclxuICAgICAgaGV4Lmxlbmd0aCA9PSBtYXRjaFJlc3VsdC5sZW5ndGhcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgZGVjaW1hbCwgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgICogQHBhcmFtIHN0ciB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBoZXhpZGVjaW1hbFxyXG4gICAqL1xyXG4gIGlzRGVjaW1hbChzdHI6IHN0cmluZykge1xyXG4gICAgaWYgKHN0ciA9PT0gXCJcIiB8fCBzdHIudHJpbSgpID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgcmV0dXJuIG5ldyBCTihzdHIsIDEwKS50b1N0cmluZygxMCkgPT09IHN0ci50cmltKClcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBtZWV0cyByZXF1aXJlbWVudHMgdG8gcGFyc2UgYXMgYW4gYWRkcmVzcyBhcyBCZWNoMzIgb24gWC1DaGFpbiBvciBQLUNoYWluLCBvdGhlcndpc2UgZmFsc2VcclxuICAgKiBAcGFyYW0gYWRkcmVzcyB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBhZGRyZXNzXHJcbiAgICovXHJcbiAgaXNQcmltYXJ5QmVjaEFkZHJlc3MgPSAoYWRkcmVzczogc3RyaW5nKTogYm9vbGVhbiA9PiB7XHJcbiAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBhZGRyZXNzLnRyaW0oKS5zcGxpdChcIi1cIilcclxuICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBiZWNoMzIuYmVjaDMyLmZyb21Xb3JkcyhiZWNoMzIuYmVjaDMyLmRlY29kZShwYXJ0c1sxXSkud29yZHMpXHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHJvZHVjZXMgYSBzdHJpbmcgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICogcmVwcmVzZW50aW5nIGEgc3RyaW5nLiBPTkxZIFVTRUQgSU4gVFJBTlNBQ1RJT04gRk9STUFUVElORywgQVNTVU1FRCBMRU5HVEggSVMgUFJFUEVOREVELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ1ZmYgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIGNvbnZlcnQgdG8gYSBzdHJpbmdcclxuICAgKi9cclxuICBidWZmZXJUb1N0cmluZyA9IChidWZmOiBCdWZmZXIpOiBzdHJpbmcgPT5cclxuICAgIHRoaXMuY29weUZyb20oYnVmZiwgMikudG9TdHJpbmcoXCJ1dGY4XCIpXHJcblxyXG4gIC8qKlxyXG4gICAqIFByb2R1Y2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZnJvbSBhIHN0cmluZy4gT05MWSBVU0VEIElOIFRSQU5TQUNUSU9OIEZPUk1BVFRJTkcsIExFTkdUSCBJUyBQUkVQRU5ERUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgdG8gY29udmVydCB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgc3RyaW5nVG9CdWZmZXIgPSAoc3RyOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xyXG4gICAgY29uc3QgYnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIgKyBzdHIubGVuZ3RoKVxyXG4gICAgYnVmZi53cml0ZVVJbnQxNkJFKHN0ci5sZW5ndGgsIDApXHJcbiAgICBidWZmLndyaXRlKHN0ciwgMiwgc3RyLmxlbmd0aCwgXCJ1dGY4XCIpXHJcbiAgICByZXR1cm4gYnVmZlxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZXMgYSBjb3B5IChubyByZWZlcmVuY2UpIG9mIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBvdmVyIHByb3ZpZGVkIGluZGVjaWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ1ZmYgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIGNvcHlcclxuICAgKiBAcGFyYW0gc3RhcnQgVGhlIGluZGV4IHRvIHN0YXJ0IHRoZSBjb3B5XHJcbiAgICogQHBhcmFtIGVuZCBUaGUgaW5kZXggdG8gZW5kIHRoZSBjb3B5XHJcbiAgICovXHJcbiAgY29weUZyb20gPSAoXHJcbiAgICBidWZmOiBCdWZmZXIsXHJcbiAgICBzdGFydDogbnVtYmVyID0gMCxcclxuICAgIGVuZDogbnVtYmVyID0gdW5kZWZpbmVkXHJcbiAgKTogQnVmZmVyID0+IHtcclxuICAgIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBlbmQgPSBidWZmLmxlbmd0aFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFVpbnQ4QXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYnVmZi5zbGljZShzdGFydCwgZW5kKSkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgb2ZcclxuICAgKiB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29udmVydCB0byBiYXNlLTU4XHJcbiAgICovXHJcbiAgYnVmZmVyVG9CNTggPSAoYnVmZjogQnVmZmVyKTogc3RyaW5nID0+IHRoaXMuYjU4LmVuY29kZShidWZmKVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGFuZCByZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYjU4c3RyIFRoZSBiYXNlLTU4IHN0cmluZyB0byBjb252ZXJ0XHJcbiAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxyXG4gICAqL1xyXG4gIGI1OFRvQnVmZmVyID0gKGI1OHN0cjogc3RyaW5nKTogQnVmZmVyID0+IHRoaXMuYjU4LmRlY29kZShiNThzdHIpXHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIHJldHVybnMgYW4gQXJyYXlCdWZmZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG9cclxuICAgKiBjb252ZXJ0IHRvIGFuIEFycmF5QnVmZmVyXHJcbiAgICovXHJcbiAgZnJvbUJ1ZmZlclRvQXJyYXlCdWZmZXIgPSAoYnVmZjogQnVmZmVyKTogQXJyYXlCdWZmZXIgPT4ge1xyXG4gICAgY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoYnVmZi5sZW5ndGgpXHJcbiAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYWIpXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYnVmZi5sZW5ndGg7ICsraSkge1xyXG4gICAgICB2aWV3W2Ake2l9YF0gPSBidWZmW2Ake2l9YF1cclxuICAgIH1cclxuICAgIHJldHVybiB2aWV3XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhbiBBcnJheUJ1ZmZlciBhbmQgY29udmVydHMgaXQgdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhYiBUaGUgQXJyYXlCdWZmZXIgdG8gY29udmVydCB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgZnJvbUFycmF5QnVmZmVyVG9CdWZmZXIgPSAoYWI6IEFycmF5QnVmZmVyKTogQnVmZmVyID0+IHtcclxuICAgIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5hbGxvYyhhYi5ieXRlTGVuZ3RoKVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGFiLmJ5dGVMZW5ndGg7ICsraSkge1xyXG4gICAgICBidWZbYCR7aX1gXSA9IGFiW2Ake2l9YF1cclxuICAgIH1cclxuICAgIHJldHVybiBidWZcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIGNvbnZlcnRzIGl0XHJcbiAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBidWZmIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB0byBjb252ZXJ0XHJcbiAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXJUb0JOID0gKGJ1ZmY6IEJ1ZmZlcik6IEJOID0+IHtcclxuICAgIGlmICh0eXBlb2YgYnVmZiA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IEJOKGJ1ZmYudG9TdHJpbmcoXCJoZXhcIiksIDE2LCBcImJlXCIpXHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gYW5kIGNvbnZlcnRzIGl0XHJcbiAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBibiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gY29udmVydFxyXG4gICAqIHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBAcGFyYW0gbGVuZ3RoIFRoZSB6ZXJvLXBhZGRlZCBsZW5ndGggb2YgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgZnJvbUJOVG9CdWZmZXIgPSAoYm46IEJOLCBsZW5ndGg/OiBudW1iZXIpOiBCdWZmZXIgPT4ge1xyXG4gICAgaWYgKHR5cGVvZiBibiA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgICB9XHJcbiAgICBjb25zdCBuZXdhcnIgPSBibi50b0FycmF5KFwiYmVcIilcclxuICAgIC8qKlxyXG4gICAgICogQ0tDOiBTdGlsbCB1bnN1cmUgd2h5IGJuLnRvQXJyYXkgd2l0aCBhIFwiYmVcIiBhbmQgYSBsZW5ndGggZG8gbm90IHdvcmsgcmlnaHQuIEJ1Zz9cclxuICAgICAqL1xyXG4gICAgaWYgKGxlbmd0aCkge1xyXG4gICAgICAvLyBibiB0b0FycmF5IHdpdGggdGhlIGxlbmd0aCBwYXJhbWV0ZXIgZG9lc24ndCB3b3JrIGNvcnJlY3RseSwgbmVlZCB0aGlzLlxyXG4gICAgICBjb25zdCB4ID0gbGVuZ3RoIC0gbmV3YXJyLmxlbmd0aFxyXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgeDsgaSsrKSB7XHJcbiAgICAgICAgbmV3YXJyLnVuc2hpZnQoMClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKG5ld2FycilcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIGFkZHMgYSBjaGVja3N1bSwgcmV0dXJuaW5nXHJcbiAgICogYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aXRoIHRoZSA0LWJ5dGUgY2hlY2tzdW0gYXBwZW5kZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gYXBwZW5kIGEgY2hlY2tzdW1cclxuICAgKi9cclxuICBhZGRDaGVja3N1bSA9IChidWZmOiBCdWZmZXIpOiBCdWZmZXIgPT4ge1xyXG4gICAgY29uc3QgaGFzaHNsaWNlOiBCdWZmZXIgPSBCdWZmZXIuZnJvbShcclxuICAgICAgY3JlYXRlSGFzaChcInNoYTI1NlwiKS51cGRhdGUoYnVmZikuZGlnZXN0KCkuc2xpY2UoMjgpXHJcbiAgICApXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbYnVmZiwgaGFzaHNsaWNlXSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBhbiBhcHBlbmRlZCA0LWJ5dGUgY2hlY2tzdW1cclxuICAgKiBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBjaGVja3N1bSBpcyB2YWxpZCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGIgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIHZhbGlkYXRlIHRoZSBjaGVja3N1bVxyXG4gICAqL1xyXG4gIHZhbGlkYXRlQ2hlY2tzdW0gPSAoYnVmZjogQnVmZmVyKTogYm9vbGVhbiA9PiB7XHJcbiAgICBjb25zdCBjaGVja3NsaWNlOiBCdWZmZXIgPSBidWZmLnNsaWNlKGJ1ZmYubGVuZ3RoIC0gNClcclxuICAgIGNvbnN0IGhhc2hzbGljZTogQnVmZmVyID0gQnVmZmVyLmZyb20oXHJcbiAgICAgIGNyZWF0ZUhhc2goXCJzaGEyNTZcIilcclxuICAgICAgICAudXBkYXRlKGJ1ZmYuc2xpY2UoMCwgYnVmZi5sZW5ndGggLSA0KSlcclxuICAgICAgICAuZGlnZXN0KClcclxuICAgICAgICAuc2xpY2UoMjgpXHJcbiAgICApXHJcbiAgICByZXR1cm4gY2hlY2tzbGljZS50b1N0cmluZyhcImhleFwiKSA9PT0gaGFzaHNsaWNlLnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgd2l0aFxyXG4gICAqIGNoZWNrc3VtIGFzIHBlciB0aGUgY2I1OCBzdGFuZGFyZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIHNlcmlhbGl6ZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBzZXJpYWxpemVkIGJhc2UtNTggc3RyaW5nIG9mIHRoZSBCdWZmZXIuXHJcbiAgICovXHJcbiAgY2I1OEVuY29kZSA9IChieXRlczogQnVmZmVyKTogc3RyaW5nID0+IHtcclxuICAgIGNvbnN0IHg6IEJ1ZmZlciA9IHRoaXMuYWRkQ2hlY2tzdW0oYnl0ZXMpXHJcbiAgICByZXR1cm4gdGhpcy5idWZmZXJUb0I1OCh4KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSBjYjU4IHNlcmlhbGl6ZWQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYmFzZS01OCBzdHJpbmdcclxuICAgKiBhbmQgcmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBvcmlnaW5hbCBkYXRhLiBUaHJvd3Mgb24gZXJyb3IuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnl0ZXMgQSBjYjU4IHNlcmlhbGl6ZWQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYmFzZS01OCBzdHJpbmdcclxuICAgKi9cclxuICBjYjU4RGVjb2RlID0gKGJ5dGVzOiBCdWZmZXIgfCBzdHJpbmcpOiBCdWZmZXIgPT4ge1xyXG4gICAgaWYgKHR5cGVvZiBieXRlcyA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBieXRlcyA9IHRoaXMuYjU4VG9CdWZmZXIoYnl0ZXMpXHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy52YWxpZGF0ZUNoZWNrc3VtKGJ5dGVzKSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb3B5RnJvbShieXRlcywgMCwgYnl0ZXMubGVuZ3RoIC0gNClcclxuICAgIH1cclxuICAgIHRocm93IG5ldyBDaGVja3N1bUVycm9yKFwiRXJyb3IgLSBCaW5Ub29scy5jYjU4RGVjb2RlOiBpbnZhbGlkIGNoZWNrc3VtXCIpXHJcbiAgfVxyXG5cclxuICBjYjU4RGVjb2RlV2l0aENoZWNrc3VtID0gKGJ5dGVzOiBCdWZmZXIgfCBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG4gICAgaWYgKHR5cGVvZiBieXRlcyA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBieXRlcyA9IHRoaXMuYjU4VG9CdWZmZXIoYnl0ZXMpXHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy52YWxpZGF0ZUNoZWNrc3VtKGJ5dGVzKSkge1xyXG4gICAgICByZXR1cm4gYDB4JHt0aGlzLmNvcHlGcm9tKGJ5dGVzLCAwLCBieXRlcy5sZW5ndGgpLnRvU3RyaW5nKFwiaGV4XCIpfWBcclxuICAgIH1cclxuICAgIHRocm93IG5ldyBDaGVja3N1bUVycm9yKFwiRXJyb3IgLSBCaW5Ub29scy5jYjU4RGVjb2RlOiBpbnZhbGlkIGNoZWNrc3VtXCIpXHJcbiAgfVxyXG5cclxuICBhZGRyZXNzVG9TdHJpbmcgPSAoaHJwOiBzdHJpbmcsIGNoYWluaWQ6IHN0cmluZywgYnl0ZXM6IEJ1ZmZlcik6IHN0cmluZyA9PlxyXG4gICAgYCR7Y2hhaW5pZH0tJHtiZWNoMzIuYmVjaDMyLmVuY29kZShocnAsIGJlY2gzMi5iZWNoMzIudG9Xb3JkcyhieXRlcykpfWBcclxuXHJcbiAgc3RyaW5nVG9BZGRyZXNzID0gKGFkZHJlc3M6IHN0cmluZywgaHJwPzogc3RyaW5nKTogQnVmZmVyID0+IHtcclxuICAgIGlmIChhZGRyZXNzLnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKSB7XHJcbiAgICAgIC8vIEVUSC1zdHlsZSBhZGRyZXNzXHJcbiAgICAgIGlmICh1dGlscy5pc0FkZHJlc3MoYWRkcmVzcykpIHtcclxuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oYWRkcmVzcy5zdWJzdHJpbmcoMiksIFwiaGV4XCIpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEhleEVycm9yKFwiRXJyb3IgLSBJbnZhbGlkIGFkZHJlc3NcIilcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQmVjaDMyIGFkZHJlc3Nlc1xyXG4gICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gYWRkcmVzcy50cmltKCkuc3BsaXQoXCItXCIpXHJcblxyXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcclxuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBWYWxpZCBhZGRyZXNzIHNob3VsZCBpbmNsdWRlIC1cIilcclxuICAgIH1cclxuXHJcbiAgICBpZiAocGFydHNbMF0ubGVuZ3RoIDwgMSkge1xyXG4gICAgICB0aHJvdyBuZXcgQmVjaDMyRXJyb3IoXCJFcnJvciAtIFZhbGlkIGFkZHJlc3MgbXVzdCBoYXZlIHByZWZpeCBiZWZvcmUgLVwiKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNwbGl0OiBudW1iZXIgPSBwYXJ0c1sxXS5sYXN0SW5kZXhPZihcIjFcIilcclxuICAgIGlmIChzcGxpdCA8IDApIHtcclxuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBWYWxpZCBhZGRyZXNzIG11c3QgaW5jbHVkZSBzZXBhcmF0b3IgKDEpXCIpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaHVtYW5SZWFkYWJsZVBhcnQ6IHN0cmluZyA9IHBhcnRzWzFdLnNsaWNlKDAsIHNwbGl0KVxyXG4gICAgaWYgKGh1bWFuUmVhZGFibGVQYXJ0Lmxlbmd0aCA8IDEpIHtcclxuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBIUlAgc2hvdWxkIGJlIGF0IGxlYXN0IDEgY2hhcmFjdGVyXCIpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBodW1hblJlYWRhYmxlUGFydCAhPT0gXCJqdW5lXCIgJiZcclxuICAgICAgaHVtYW5SZWFkYWJsZVBhcnQgIT0gXCJsb2NhbFwiICYmXHJcbiAgICAgIGh1bWFuUmVhZGFibGVQYXJ0ICE9IFwiY3VzdG9tXCIgJiZcclxuICAgICAgaHVtYW5SZWFkYWJsZVBhcnQgIT0gaHJwXHJcbiAgICApIHtcclxuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBJbnZhbGlkIEhSUFwiKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBCdWZmZXIuZnJvbShcclxuICAgICAgYmVjaDMyLmJlY2gzMi5mcm9tV29yZHMoYmVjaDMyLmJlY2gzMi5kZWNvZGUocGFydHNbMV0pLndvcmRzKVxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYW4gYWRkcmVzcyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiByZXByZXNlbnRhdGlvbiBpZiB2YWxpZC4gQSBtb3JlIHN0cmljdCB2ZXJzaW9uIG9mIHN0cmluZ1RvQWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhZGRyZXNzXHJcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBBIGNiNTggZW5jb2RlZCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGJsb2NrY2hhaW5JRFxyXG4gICAqIEBwYXJhbSBhbGlhcyBBIGNoYWluSUQgYWxpYXMsIGlmIGFueSwgdGhhdCB0aGUgYWRkcmVzcyBjYW4gYWxzbyBwYXJzZSBmcm9tLlxyXG4gICAqIEBwYXJhbSBhZGRybGVuIFZNcyBjYW4gdXNlIGFueSBhZGRyZXNzaW5nIHNjaGVtZSB0aGF0IHRoZXkgbGlrZSwgc28gdGhpcyBpcyB0aGUgYXBwcm9wcmlhdGUgbnVtYmVyIG9mIGFkZHJlc3MgYnl0ZXMuIERlZmF1bHQgMjAuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCxcclxuICAgKiB1bmRlZmluZWQgaWYgbm90IHZhbGlkLlxyXG4gICAqL1xyXG4gIHBhcnNlQWRkcmVzcyA9IChcclxuICAgIGFkZHI6IHN0cmluZyxcclxuICAgIGJsb2NrY2hhaW5JRDogc3RyaW5nLFxyXG4gICAgYWxpYXM6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIGFkZHJsZW46IG51bWJlciA9IDIwXHJcbiAgKTogQnVmZmVyID0+IHtcclxuICAgIGNvbnN0IGFiYzogc3RyaW5nW10gPSBhZGRyLnNwbGl0KFwiLVwiKVxyXG4gICAgaWYgKFxyXG4gICAgICBhYmMubGVuZ3RoID09PSAyICYmXHJcbiAgICAgICgoYWxpYXMgJiYgYWJjWzBdID09PSBhbGlhcykgfHwgKGJsb2NrY2hhaW5JRCAmJiBhYmNbMF0gPT09IGJsb2NrY2hhaW5JRCkpXHJcbiAgICApIHtcclxuICAgICAgY29uc3QgYWRkcmJ1ZmYgPSB0aGlzLnN0cmluZ1RvQWRkcmVzcyhhZGRyKVxyXG4gICAgICBpZiAoKGFkZHJsZW4gJiYgYWRkcmJ1ZmYubGVuZ3RoID09PSBhZGRybGVuKSB8fCAhYWRkcmxlbikge1xyXG4gICAgICAgIHJldHVybiBhZGRyYnVmZlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgfVxyXG59XHJcbiJdfQ==