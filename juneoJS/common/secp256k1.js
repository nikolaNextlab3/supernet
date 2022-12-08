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
exports.SECP256k1KeyChain = exports.SECP256k1KeyPair = void 0;
/**
 * @packageDocumentation
 * @module Common-SECP256k1KeyChain
 */
const buffer_1 = require("buffer/");
const elliptic = __importStar(require("elliptic"));
const create_hash_1 = __importDefault(require("create-hash"));
const bintools_1 = __importDefault(require("../utils/bintools"));
const keychain_1 = require("./keychain");
const errors_1 = require("../utils/errors");
const utils_1 = require("../utils");
/**
 * @ignore
 */
const EC = elliptic.ec;
/**
 * @ignore
 */
const ec = new EC("secp256k1");
/**
 * @ignore
 */
const ecparams = ec.curve;
/**
 * @ignore
 */
const BN = ecparams.n.constructor;
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for representing a private and public keypair on the Platform Chain.
 */
class SECP256k1KeyPair extends keychain_1.StandardKeyPair {
    constructor(hrp, chainID) {
        super();
        this.chainID = "";
        this.hrp = "";
        this.chainID = chainID;
        this.hrp = hrp;
        this.generateKey();
    }
    /**
     * @ignore
     */
    _sigFromSigBuffer(sig) {
        const r = new BN(bintools.copyFrom(sig, 0, 32));
        const s = new BN(bintools.copyFrom(sig, 32, 64));
        const recoveryParam = bintools
            .copyFrom(sig, 64, 65)
            .readUIntBE(0, 1);
        const sigOpt = {
            r: r,
            s: s,
            recoveryParam: recoveryParam
        };
        return sigOpt;
    }
    /**
     * Generates a new keypair.
     */
    generateKey() {
        this.keypair = ec.genKeyPair();
        // doing hex translation to get Buffer class
        this.privk = buffer_1.Buffer.from(this.keypair.getPrivate("hex").padStart(64, "0"), "hex");
        this.pubk = buffer_1.Buffer.from(this.keypair.getPublic(true, "hex").padStart(66, "0"), "hex");
    }
    /**
     * Imports a private key and generates the appropriate public key.
     *
     * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key
     *
     * @returns true on success, false on failure
     */
    importKey(privk) {
        this.keypair = ec.keyFromPrivate(privk.toString("hex"), "hex");
        // doing hex translation to get Buffer class
        try {
            this.privk = buffer_1.Buffer.from(this.keypair.getPrivate("hex").padStart(64, "0"), "hex");
            this.pubk = buffer_1.Buffer.from(this.keypair.getPublic(true, "hex").padStart(66, "0"), "hex");
            return true; // silly I know, but the interface requires so it returns true on success, so if Buffer fails validation...
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Returns the address as a {@link https://github.com/feross/buffer|Buffer}.
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} representation of the address
     */
    getAddress() {
        return SECP256k1KeyPair.addressFromPublicKey(this.pubk);
    }
    /**
     * Returns the address's string representation.
     *
     * @returns A string representation of the address
     */
    getAddressString() {
        const addr = SECP256k1KeyPair.addressFromPublicKey(this.pubk);
        const type = "bech32";
        return serialization.bufferToType(addr, type, this.hrp, this.chainID);
    }
    /**
     * Returns an address given a public key.
     *
     * @param pubk A {@link https://github.com/feross/buffer|Buffer} representing the public key
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} for the address of the public key.
     */
    static addressFromPublicKey(pubk) {
        if (pubk.length === 65) {
            /* istanbul ignore next */
            pubk = buffer_1.Buffer.from(ec.keyFromPublic(pubk).getPublic(true, "hex").padStart(66, "0"), "hex"); // make compact, stick back into buffer
        }
        if (pubk.length === 33) {
            const sha256 = buffer_1.Buffer.from((0, create_hash_1.default)("sha256").update(pubk).digest());
            const ripesha = buffer_1.Buffer.from((0, create_hash_1.default)("ripemd160").update(sha256).digest());
            return ripesha;
        }
        /* istanbul ignore next */
        throw new errors_1.PublicKeyError("Unable to make address.");
    }
    /**
     * Returns a string representation of the private key.
     *
     * @returns A cb58 serialized string representation of the private key
     */
    getPrivateKeyString() {
        return `PrivateKey-${bintools.cb58Encode(this.privk)}`;
    }
    /**
     * Returns the public key.
     *
     * @returns A cb58 serialized string representation of the public key
     */
    getPublicKeyString() {
        return bintools.cb58Encode(this.pubk);
    }
    /**
     * Takes a message, signs it, and returns the signature.
     *
     * @param msg The message to sign, be sure to hash first if expected
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the signature
     */
    sign(msg) {
        const sigObj = this.keypair.sign(msg, undefined, {
            canonical: true
        });
        const recovery = buffer_1.Buffer.alloc(1);
        recovery.writeUInt8(sigObj.recoveryParam, 0);
        const r = buffer_1.Buffer.from(sigObj.r.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
        const s = buffer_1.Buffer.from(sigObj.s.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
        const result = buffer_1.Buffer.concat([r, s, recovery], 65);
        return result;
    }
    /**
     * Verifies that the private key associated with the provided public key produces the signature associated with the given message.
     *
     * @param msg The message associated with the signature
     * @param sig The signature of the signed message
     *
     * @returns True on success, false on failure
     */
    verify(msg, sig) {
        const sigObj = this._sigFromSigBuffer(sig);
        return ec.verify(msg, sigObj, this.keypair);
    }
    /**
     * Recovers the public key of a message signer from a message and its associated signature.
     *
     * @param msg The message that's signed
     * @param sig The signature that's signed on the message
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key of the signer
     */
    recover(msg, sig) {
        const sigObj = this._sigFromSigBuffer(sig);
        const pubk = ec.recoverPubKey(msg, sigObj, sigObj.recoveryParam);
        return buffer_1.Buffer.from(pubk.encodeCompressed());
    }
    /**
     * Returns the chainID associated with this key.
     *
     * @returns The [[KeyPair]]'s chainID
     */
    getChainID() {
        return this.chainID;
    }
    /**
     * Sets the the chainID associated with this key.
     *
     * @param chainID String for the chainID
     */
    setChainID(chainID) {
        this.chainID = chainID;
    }
    /**
     * Returns the Human-Readable-Part of the network associated with this key.
     *
     * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
     */
    getHRP() {
        return this.hrp;
    }
    /**
     * Sets the the Human-Readable-Part of the network associated with this key.
     *
     * @param hrp String for the Human-Readable-Part of Bech32 addresses
     */
    setHRP(hrp) {
        this.hrp = hrp;
    }
}
exports.SECP256k1KeyPair = SECP256k1KeyPair;
/**
 * Class for representing a key chain in Juneo.
 *
 * @typeparam SECP256k1KeyPair Class extending [[StandardKeyPair]] which is used as the key in [[SECP256k1KeyChain]]
 */
class SECP256k1KeyChain extends keychain_1.StandardKeyChain {
    addKey(newKey) {
        super.addKey(newKey);
    }
}
exports.SECP256k1KeyChain = SECP256k1KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcDI1NmsxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9zZWNwMjU2azEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsbURBQW9DO0FBQ3BDLDhEQUFvQztBQUNwQyxpRUFBd0M7QUFDeEMseUNBQThEO0FBQzlELDRDQUFnRDtBQUVoRCxvQ0FBd0Q7QUFFeEQ7O0dBRUc7QUFDSCxNQUFNLEVBQUUsR0FBdUIsUUFBUSxDQUFDLEVBQUUsQ0FBQTtBQUUxQzs7R0FFRztBQUNILE1BQU0sRUFBRSxHQUFnQixJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUUzQzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUE7QUFFOUI7O0dBRUc7QUFDSCxNQUFNLEVBQUUsR0FBUSxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQTtBQUV0Qzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLHFCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFzQixnQkFBaUIsU0FBUSwwQkFBZTtJQW9ONUQsWUFBWSxHQUFXLEVBQUUsT0FBZTtRQUN0QyxLQUFLLEVBQUUsQ0FBQTtRQW5OQyxZQUFPLEdBQVcsRUFBRSxDQUFBO1FBQ3BCLFFBQUcsR0FBVyxFQUFFLENBQUE7UUFtTnhCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQ3RCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO1FBQ2QsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQ3BCLENBQUM7SUFwTkQ7O09BRUc7SUFDTyxpQkFBaUIsQ0FBQyxHQUFXO1FBQ3JDLE1BQU0sQ0FBQyxHQUFZLElB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QU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO0lBQ3hCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTTtRQUNKLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQTtJQUNqQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxHQUFXO1FBQ2hCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO0lBQ2hCLENBQUM7Q0FRRjtBQTFORCw0Q0EwTkM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBc0IsaUJBRXBCLFNBQVEsMkJBQTZCO0lBUXJDLE1BQU0sQ0FBQyxNQUFtQjtRQUN4QixLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ3RCLENBQUM7Q0FVRjtBQXRCRCw4Q0FzQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQ29tbW9uLVNFQ1AyNTZrMUtleUNoYWluXHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCAqIGFzIGVsbGlwdGljIGZyb20gXCJlbGxpcHRpY1wiXHJcbmltcG9ydCBjcmVhdGVIYXNoIGZyb20gXCJjcmVhdGUtaGFzaFwiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBTdGFuZGFyZEtleVBhaXIsIFN0YW5kYXJkS2V5Q2hhaW4gfSBmcm9tIFwiLi9rZXljaGFpblwiXHJcbmltcG9ydCB7IFB1YmxpY0tleUVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXHJcbmltcG9ydCB7IEJOSW5wdXQgfSBmcm9tIFwiZWxsaXB0aWNcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi91dGlsc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgRUM6IHR5cGVvZiBlbGxpcHRpYy5lYyA9IGVsbGlwdGljLmVjXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgZWM6IGVsbGlwdGljLmVjID0gbmV3IEVDKFwic2VjcDI1NmsxXCIpXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgZWNwYXJhbXM6IGFueSA9IGVjLmN1cnZlXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgQk46IGFueSA9IGVjcGFyYW1zLm4uY29uc3RydWN0b3JcclxuXHJcbi8qKlxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgcHJpdmF0ZSBhbmQgcHVibGljIGtleXBhaXIgb24gdGhlIFBsYXRmb3JtIENoYWluLlxyXG4gKi9cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNFQ1AyNTZrMUtleVBhaXIgZXh0ZW5kcyBTdGFuZGFyZEtleVBhaXIge1xyXG4gIHByb3RlY3RlZCBrZXlwYWlyOiBlbGxpcHRpYy5lYy5LZXlQYWlyXHJcbiAgcHJvdGVjdGVkIGNoYWluSUQ6IHN0cmluZyA9IFwiXCJcclxuICBwcm90ZWN0ZWQgaHJwOiBzdHJpbmcgPSBcIlwiXHJcblxyXG4gIC8qKlxyXG4gICAqIEBpZ25vcmVcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgX3NpZ0Zyb21TaWdCdWZmZXIoc2lnOiBCdWZmZXIpOiBlbGxpcHRpYy5lYy5TaWduYXR1cmVPcHRpb25zIHtcclxuICAgIGNvbnN0IHI6IEJOSW5wdXQgPSBuZXcgQk4oYmludG9vbHMuY29weUZyb20oc2lnLCAwLCAzMikpXHJcbiAgICBjb25zdCBzOiBCTklucHV0ID0gbmV3IEJOKGJpbnRvb2xzLmNvcHlGcm9tKHNpZywgMzIsIDY0KSlcclxuICAgIGNvbnN0IHJlY292ZXJ5UGFyYW06IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShzaWcsIDY0LCA2NSlcclxuICAgICAgLnJlYWRVSW50QkUoMCwgMSlcclxuICAgIGNvbnN0IHNpZ09wdCA9IHtcclxuICAgICAgcjogcixcclxuICAgICAgczogcyxcclxuICAgICAgcmVjb3ZlcnlQYXJhbTogcmVjb3ZlcnlQYXJhbVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNpZ09wdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2VuZXJhdGVzIGEgbmV3IGtleXBhaXIuXHJcbiAgICovXHJcbiAgZ2VuZXJhdGVLZXkoKSB7XHJcbiAgICB0aGlzLmtleXBhaXIgPSBlYy5nZW5LZXlQYWlyKClcclxuXHJcbiAgICAvLyBkb2luZyBoZXggdHJhbnNsYXRpb24gdG8gZ2V0IEJ1ZmZlciBjbGFzc1xyXG4gICAgdGhpcy5wcml2ayA9IEJ1ZmZlci5mcm9tKFxyXG4gICAgICB0aGlzLmtleXBhaXIuZ2V0UHJpdmF0ZShcImhleFwiKS5wYWRTdGFydCg2NCwgXCIwXCIpLFxyXG4gICAgICBcImhleFwiXHJcbiAgICApXHJcbiAgICB0aGlzLnB1YmsgPSBCdWZmZXIuZnJvbShcclxuICAgICAgdGhpcy5rZXlwYWlyLmdldFB1YmxpYyh0cnVlLCBcImhleFwiKS5wYWRTdGFydCg2NiwgXCIwXCIpLFxyXG4gICAgICBcImhleFwiXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbXBvcnRzIGEgcHJpdmF0ZSBrZXkgYW5kIGdlbmVyYXRlcyB0aGUgYXBwcm9wcmlhdGUgcHVibGljIGtleS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwcml2ayBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHRydWUgb24gc3VjY2VzcywgZmFsc2Ugb24gZmFpbHVyZVxyXG4gICAqL1xyXG4gIGltcG9ydEtleShwcml2azogQnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgICB0aGlzLmtleXBhaXIgPSBlYy5rZXlGcm9tUHJpdmF0ZShwcml2ay50b1N0cmluZyhcImhleFwiKSwgXCJoZXhcIilcclxuICAgIC8vIGRvaW5nIGhleCB0cmFuc2xhdGlvbiB0byBnZXQgQnVmZmVyIGNsYXNzXHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnByaXZrID0gQnVmZmVyLmZyb20oXHJcbiAgICAgICAgdGhpcy5rZXlwYWlyLmdldFByaXZhdGUoXCJoZXhcIikucGFkU3RhcnQoNjQsIFwiMFwiKSxcclxuICAgICAgICBcImhleFwiXHJcbiAgICAgIClcclxuICAgICAgdGhpcy5wdWJrID0gQnVmZmVyLmZyb20oXHJcbiAgICAgICAgdGhpcy5rZXlwYWlyLmdldFB1YmxpYyh0cnVlLCBcImhleFwiKS5wYWRTdGFydCg2NiwgXCIwXCIpLFxyXG4gICAgICAgIFwiaGV4XCJcclxuICAgICAgKVxyXG4gICAgICByZXR1cm4gdHJ1ZSAvLyBzaWxseSBJIGtub3csIGJ1dCB0aGUgaW50ZXJmYWNlIHJlcXVpcmVzIHNvIGl0IHJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzLCBzbyBpZiBCdWZmZXIgZmFpbHMgdmFsaWRhdGlvbi4uLlxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhZGRyZXNzXHJcbiAgICovXHJcbiAgZ2V0QWRkcmVzcygpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIFNFQ1AyNTZrMUtleVBhaXIuYWRkcmVzc0Zyb21QdWJsaWNLZXkodGhpcy5wdWJrKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYWRkcmVzcydzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhZGRyZXNzXHJcbiAgICovXHJcbiAgZ2V0QWRkcmVzc1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgYWRkcjogQnVmZmVyID0gU0VDUDI1NmsxS2V5UGFpci5hZGRyZXNzRnJvbVB1YmxpY0tleSh0aGlzLnB1YmspXHJcbiAgICBjb25zdCB0eXBlOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcclxuICAgIHJldHVybiBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShhZGRyLCB0eXBlLCB0aGlzLmhycCwgdGhpcy5jaGFpbklEKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhZGRyZXNzIGdpdmVuIGEgcHVibGljIGtleS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwdWJrIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBwdWJsaWMga2V5XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBvZiB0aGUgcHVibGljIGtleS5cclxuICAgKi9cclxuICBzdGF0aWMgYWRkcmVzc0Zyb21QdWJsaWNLZXkocHViazogQnVmZmVyKTogQnVmZmVyIHtcclxuICAgIGlmIChwdWJrLmxlbmd0aCA9PT0gNjUpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgcHViayA9IEJ1ZmZlci5mcm9tKFxyXG4gICAgICAgIGVjLmtleUZyb21QdWJsaWMocHViaykuZ2V0UHVibGljKHRydWUsIFwiaGV4XCIpLnBhZFN0YXJ0KDY2LCBcIjBcIiksXHJcbiAgICAgICAgXCJoZXhcIlxyXG4gICAgICApIC8vIG1ha2UgY29tcGFjdCwgc3RpY2sgYmFjayBpbnRvIGJ1ZmZlclxyXG4gICAgfVxyXG4gICAgaWYgKHB1YmsubGVuZ3RoID09PSAzMykge1xyXG4gICAgICBjb25zdCBzaGEyNTY6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFxyXG4gICAgICAgIGNyZWF0ZUhhc2goXCJzaGEyNTZcIikudXBkYXRlKHB1YmspLmRpZ2VzdCgpXHJcbiAgICAgIClcclxuICAgICAgY29uc3QgcmlwZXNoYTogQnVmZmVyID0gQnVmZmVyLmZyb20oXHJcbiAgICAgICAgY3JlYXRlSGFzaChcInJpcGVtZDE2MFwiKS51cGRhdGUoc2hhMjU2KS5kaWdlc3QoKVxyXG4gICAgICApXHJcbiAgICAgIHJldHVybiByaXBlc2hhXHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgdGhyb3cgbmV3IFB1YmxpY0tleUVycm9yKFwiVW5hYmxlIHRvIG1ha2UgYWRkcmVzcy5cIilcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHByaXZhdGUga2V5LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBwcml2YXRlIGtleVxyXG4gICAqL1xyXG4gIGdldFByaXZhdGVLZXlTdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgUHJpdmF0ZUtleS0ke2JpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5wcml2ayl9YFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcHVibGljIGtleS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgcHVibGljIGtleVxyXG4gICAqL1xyXG4gIGdldFB1YmxpY0tleVN0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5wdWJrKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSBtZXNzYWdlLCBzaWducyBpdCwgYW5kIHJldHVybnMgdGhlIHNpZ25hdHVyZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdG8gc2lnbiwgYmUgc3VyZSB0byBoYXNoIGZpcnN0IGlmIGV4cGVjdGVkXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHNpZ25hdHVyZVxyXG4gICAqL1xyXG4gIHNpZ24obXNnOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgc2lnT2JqOiBlbGxpcHRpYy5lYy5TaWduYXR1cmUgPSB0aGlzLmtleXBhaXIuc2lnbihtc2csIHVuZGVmaW5lZCwge1xyXG4gICAgICBjYW5vbmljYWw6IHRydWVcclxuICAgIH0pXHJcbiAgICBjb25zdCByZWNvdmVyeTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDEpXHJcbiAgICByZWNvdmVyeS53cml0ZVVJbnQ4KHNpZ09iai5yZWNvdmVyeVBhcmFtLCAwKVxyXG4gICAgY29uc3QgcjogQnVmZmVyID0gQnVmZmVyLmZyb20oc2lnT2JqLnIudG9BcnJheShcImJlXCIsIDMyKSkgLy93ZSBoYXZlIHRvIHNraXAgbmF0aXZlIEJ1ZmZlciBjbGFzcywgc28gdGhpcyBpcyB0aGUgd2F5XHJcbiAgICBjb25zdCBzOiBCdWZmZXIgPSBCdWZmZXIuZnJvbShzaWdPYmoucy50b0FycmF5KFwiYmVcIiwgMzIpKSAvL3dlIGhhdmUgdG8gc2tpcCBuYXRpdmUgQnVmZmVyIGNsYXNzLCBzbyB0aGlzIGlzIHRoZSB3YXlcclxuICAgIGNvbnN0IHJlc3VsdDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChbciwgcywgcmVjb3ZlcnldLCA2NSlcclxuICAgIHJldHVybiByZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFZlcmlmaWVzIHRoYXQgdGhlIHByaXZhdGUga2V5IGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvdmlkZWQgcHVibGljIGtleSBwcm9kdWNlcyB0aGUgc2lnbmF0dXJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gbWVzc2FnZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoZSBzaWduYXR1cmVcclxuICAgKiBAcGFyYW0gc2lnIFRoZSBzaWduYXR1cmUgb2YgdGhlIHNpZ25lZCBtZXNzYWdlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9uIGZhaWx1cmVcclxuICAgKi9cclxuICB2ZXJpZnkobXNnOiBCdWZmZXIsIHNpZzogQnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBzaWdPYmo6IGVsbGlwdGljLmVjLlNpZ25hdHVyZU9wdGlvbnMgPSB0aGlzLl9zaWdGcm9tU2lnQnVmZmVyKHNpZylcclxuICAgIHJldHVybiBlYy52ZXJpZnkobXNnLCBzaWdPYmosIHRoaXMua2V5cGFpcilcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlY292ZXJzIHRoZSBwdWJsaWMga2V5IG9mIGEgbWVzc2FnZSBzaWduZXIgZnJvbSBhIG1lc3NhZ2UgYW5kIGl0cyBhc3NvY2lhdGVkIHNpZ25hdHVyZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdGhhdCdzIHNpZ25lZFxyXG4gICAqIEBwYXJhbSBzaWcgVGhlIHNpZ25hdHVyZSB0aGF0J3Mgc2lnbmVkIG9uIHRoZSBtZXNzYWdlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHB1YmxpYyBrZXkgb2YgdGhlIHNpZ25lclxyXG4gICAqL1xyXG4gIHJlY292ZXIobXNnOiBCdWZmZXIsIHNpZzogQnVmZmVyKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHNpZ09iajogZWxsaXB0aWMuZWMuU2lnbmF0dXJlT3B0aW9ucyA9IHRoaXMuX3NpZ0Zyb21TaWdCdWZmZXIoc2lnKVxyXG4gICAgY29uc3QgcHViayA9IGVjLnJlY292ZXJQdWJLZXkobXNnLCBzaWdPYmosIHNpZ09iai5yZWNvdmVyeVBhcmFtKVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHB1YmsuZW5jb2RlQ29tcHJlc3NlZCgpKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2hhaW5JRCBhc3NvY2lhdGVkIHdpdGggdGhpcyBrZXkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgW1tLZXlQYWlyXV0ncyBjaGFpbklEXHJcbiAgICovXHJcbiAgZ2V0Q2hhaW5JRCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuY2hhaW5JRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdGhlIGNoYWluSUQgYXNzb2NpYXRlZCB3aXRoIHRoaXMga2V5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNoYWluSUQgU3RyaW5nIGZvciB0aGUgY2hhaW5JRFxyXG4gICAqL1xyXG4gIHNldENoYWluSUQoY2hhaW5JRDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB0aGlzLmNoYWluSUQgPSBjaGFpbklEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBbW0tleVBhaXJdXSdzIEh1bWFuLVJlYWRhYmxlLVBhcnQgb2YgdGhlIG5ldHdvcmsncyBCZWNoMzIgYWRkcmVzc2luZyBzY2hlbWVcclxuICAgKi9cclxuICBnZXRIUlAoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLmhycFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdGhlIEh1bWFuLVJlYWRhYmxlLVBhcnQgb2YgdGhlIG5ldHdvcmsgYXNzb2NpYXRlZCB3aXRoIHRoaXMga2V5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGhycCBTdHJpbmcgZm9yIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIEJlY2gzMiBhZGRyZXNzZXNcclxuICAgKi9cclxuICBzZXRIUlAoaHJwOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIHRoaXMuaHJwID0gaHJwXHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvcihocnA6IHN0cmluZywgY2hhaW5JRDogc3RyaW5nKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICB0aGlzLmNoYWluSUQgPSBjaGFpbklEXHJcbiAgICB0aGlzLmhycCA9IGhycFxyXG4gICAgdGhpcy5nZW5lcmF0ZUtleSgpXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIGtleSBjaGFpbiBpbiBKdW5lby5cclxuICpcclxuICogQHR5cGVwYXJhbSBTRUNQMjU2azFLZXlQYWlyIENsYXNzIGV4dGVuZGluZyBbW1N0YW5kYXJkS2V5UGFpcl1dIHdoaWNoIGlzIHVzZWQgYXMgdGhlIGtleSBpbiBbW1NFQ1AyNTZrMUtleUNoYWluXV1cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTRUNQMjU2azFLZXlDaGFpbjxcclxuICBTRUNQS1BDbGFzcyBleHRlbmRzIFNFQ1AyNTZrMUtleVBhaXJcclxuPiBleHRlbmRzIFN0YW5kYXJkS2V5Q2hhaW48U0VDUEtQQ2xhc3M+IHtcclxuICAvKipcclxuICAgKiBNYWtlcyBhIG5ldyBrZXkgcGFpciwgcmV0dXJucyB0aGUgYWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFkZHJlc3Mgb2YgdGhlIG5ldyBrZXkgcGFpclxyXG4gICAqL1xyXG4gIG1ha2VLZXk6ICgpID0+IFNFQ1BLUENsYXNzXHJcblxyXG4gIGFkZEtleShuZXdLZXk6IFNFQ1BLUENsYXNzKTogdm9pZCB7XHJcbiAgICBzdXBlci5hZGRLZXkobmV3S2V5KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSBwcml2YXRlIGtleSwgbWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcHJpdmsgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFkZHJlc3Mgb2YgdGhlIG5ldyBrZXkgcGFpclxyXG4gICAqL1xyXG4gIGltcG9ydEtleTogKHByaXZrOiBCdWZmZXIgfCBzdHJpbmcpID0+IFNFQ1BLUENsYXNzXHJcbn1cclxuIl19