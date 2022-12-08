"use strict";
/**
 * @packageDocumentation
 * @module Utils-HDNode
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer/");
const hdkey_1 = __importDefault(require("hdkey"));
const bintools_1 = __importDefault(require("./bintools"));
const bintools = bintools_1.default.getInstance();
/**
 * BIP32 hierarchical deterministic keys.
 */
class HDNode {
    /**
     * Creates an HDNode from a master seed or an extended public/private key
     * @param from seed or key to create HDNode from
     */
    constructor(from) {
        if (typeof from === "string" && from.substring(0, 2) === "xp") {
            this.hdkey = hdkey_1.default.fromExtendedKey(from);
        }
        else if (buffer_1.Buffer.isBuffer(from)) {
            this.hdkey = hdkey_1.default.fromMasterSeed(from);
        }
        else {
            this.hdkey = hdkey_1.default.fromMasterSeed(buffer_1.Buffer.from(from));
        }
        this.publicKey = this.hdkey.publicKey;
        this.privateKey = this.hdkey.privateKey;
        if (this.privateKey) {
            this.privateKeyCB58 = `PrivateKey-${bintools.cb58Encode(this.privateKey)}`;
        }
        else {
            this.privateExtendedKey = null;
        }
        this.chainCode = this.hdkey.chainCode;
        this.privateExtendedKey = this.hdkey.privateExtendedKey;
        this.publicExtendedKey = this.hdkey.publicExtendedKey;
    }
    /**
     * Derives the HDNode at path from the current HDNode.
     * @param path
     * @returns derived child HDNode
     */
    derive(path) {
        const hdKey = this.hdkey.derive(path);
        let hdNode;
        if (hdKey.privateExtendedKey != null) {
            hdNode = new HDNode(hdKey.privateExtendedKey);
        }
        else {
            hdNode = new HDNode(hdKey.publicExtendedKey);
        }
        return hdNode;
    }
    /**
     * Signs the buffer hash with the private key using secp256k1 and returns the signature as a buffer.
     * @param hash
     * @returns signature as a Buffer
     */
    sign(hash) {
        const sig = this.hdkey.sign(hash);
        return buffer_1.Buffer.from(sig);
    }
    /**
     * Verifies that the signature is valid for hash and the HDNode's public key using secp256k1.
     * @param hash
     * @param signature
     * @returns true for valid, false for invalid.
     * @throws if the hash or signature is the wrong length.
     */
    verify(hash, signature) {
        return this.hdkey.verify(hash, signature);
    }
    /**
     * Wipes all record of the private key from the HDNode instance.
     * After calling this method, the instance will behave as if it was created via an xpub.
     */
    wipePrivateData() {
        this.privateKey = null;
        this.privateExtendedKey = null;
        this.privateKeyCB58 = null;
        this.hdkey.wipePrivateData();
    }
}
exports.default = HDNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGRub2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2hkbm9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7OztBQUVILG9DQUFnQztBQUNoQyxrREFBMEI7QUFDMUIsMERBQWlDO0FBQ2pDLE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFakQ7O0dBRUc7QUFFSCxNQUFxQixNQUFNO0lBeUR6Qjs7O09BR0c7SUFDSCxZQUFZLElBQXFCO1FBQy9CLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUM3RCxJQUFJLENBQUMsS0FBSyxHQUFHLGVBQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDMUM7YUFBTSxJQUFJLGVBQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxlQUFNLENBQUMsY0FBYyxDQUFDLElBQW9DLENBQUMsQ0FBQTtTQUN6RTthQUFNO1lBQ0wsSUFBSSxDQUFDLEtBQUssR0FBRyxlQUFNLENBQUMsY0FBYyxDQUNoQyxlQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBaUMsQ0FDbEQsQ0FBQTtTQUNGO1FBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQTtRQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFBO1FBQ3ZDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQTtTQUMzRTthQUFNO1lBQ0wsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtTQUMvQjtRQUNELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUE7UUFDckMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUE7UUFDdkQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUE7SUFDdkQsQ0FBQztJQXhFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLElBQVk7UUFDakIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckMsSUFBSSxNQUFjLENBQUE7UUFDbEIsSUFBSSxLQUFLLENBQUMsa0JBQWtCLElBQUksSUFBSSxFQUFFO1lBQ3BDLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtTQUM5QzthQUFNO1lBQ0wsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1NBQzdDO1FBQ0QsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksQ0FBQyxJQUFZO1FBQ2YsTUFBTSxHQUFHLEdBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDekMsT0FBTyxlQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3pCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsSUFBWSxFQUFFLFNBQWlCO1FBQ3BDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxlQUFlO1FBQ2IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7UUFDdEIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtRQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQTtRQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBQzlCLENBQUM7Q0EyQkY7QUFsRkQseUJBa0ZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIFV0aWxzLUhETm9kZVxyXG4gKi9cclxuXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IGhkbm9kZSBmcm9tIFwiaGRrZXlcIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4vYmludG9vbHNcIlxyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQklQMzIgaGllcmFyY2hpY2FsIGRldGVybWluaXN0aWMga2V5cy5cclxuICovXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIRE5vZGUge1xyXG4gIHByaXZhdGUgaGRrZXk6IGFueVxyXG4gIHB1YmxpY0tleTogQnVmZmVyXHJcbiAgcHJpdmF0ZUtleTogQnVmZmVyXHJcbiAgcHJpdmF0ZUtleUNCNTg6IHN0cmluZ1xyXG4gIGNoYWluQ29kZTogQnVmZmVyXHJcbiAgcHJpdmF0ZUV4dGVuZGVkS2V5OiBzdHJpbmdcclxuICBwdWJsaWNFeHRlbmRlZEtleTogc3RyaW5nXHJcblxyXG4gIC8qKlxyXG4gICAqIERlcml2ZXMgdGhlIEhETm9kZSBhdCBwYXRoIGZyb20gdGhlIGN1cnJlbnQgSEROb2RlLlxyXG4gICAqIEBwYXJhbSBwYXRoXHJcbiAgICogQHJldHVybnMgZGVyaXZlZCBjaGlsZCBIRE5vZGVcclxuICAgKi9cclxuICBkZXJpdmUocGF0aDogc3RyaW5nKTogSEROb2RlIHtcclxuICAgIGNvbnN0IGhkS2V5ID0gdGhpcy5oZGtleS5kZXJpdmUocGF0aClcclxuICAgIGxldCBoZE5vZGU6IEhETm9kZVxyXG4gICAgaWYgKGhkS2V5LnByaXZhdGVFeHRlbmRlZEtleSAhPSBudWxsKSB7XHJcbiAgICAgIGhkTm9kZSA9IG5ldyBIRE5vZGUoaGRLZXkucHJpdmF0ZUV4dGVuZGVkS2V5KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGROb2RlID0gbmV3IEhETm9kZShoZEtleS5wdWJsaWNFeHRlbmRlZEtleSlcclxuICAgIH1cclxuICAgIHJldHVybiBoZE5vZGVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNpZ25zIHRoZSBidWZmZXIgaGFzaCB3aXRoIHRoZSBwcml2YXRlIGtleSB1c2luZyBzZWNwMjU2azEgYW5kIHJldHVybnMgdGhlIHNpZ25hdHVyZSBhcyBhIGJ1ZmZlci5cclxuICAgKiBAcGFyYW0gaGFzaFxyXG4gICAqIEByZXR1cm5zIHNpZ25hdHVyZSBhcyBhIEJ1ZmZlclxyXG4gICAqL1xyXG4gIHNpZ24oaGFzaDogQnVmZmVyKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHNpZzogQnVmZmVyID0gdGhpcy5oZGtleS5zaWduKGhhc2gpXHJcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oc2lnKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVmVyaWZpZXMgdGhhdCB0aGUgc2lnbmF0dXJlIGlzIHZhbGlkIGZvciBoYXNoIGFuZCB0aGUgSEROb2RlJ3MgcHVibGljIGtleSB1c2luZyBzZWNwMjU2azEuXHJcbiAgICogQHBhcmFtIGhhc2hcclxuICAgKiBAcGFyYW0gc2lnbmF0dXJlXHJcbiAgICogQHJldHVybnMgdHJ1ZSBmb3IgdmFsaWQsIGZhbHNlIGZvciBpbnZhbGlkLlxyXG4gICAqIEB0aHJvd3MgaWYgdGhlIGhhc2ggb3Igc2lnbmF0dXJlIGlzIHRoZSB3cm9uZyBsZW5ndGguXHJcbiAgICovXHJcbiAgdmVyaWZ5KGhhc2g6IEJ1ZmZlciwgc2lnbmF0dXJlOiBCdWZmZXIpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmhka2V5LnZlcmlmeShoYXNoLCBzaWduYXR1cmUpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaXBlcyBhbGwgcmVjb3JkIG9mIHRoZSBwcml2YXRlIGtleSBmcm9tIHRoZSBIRE5vZGUgaW5zdGFuY2UuXHJcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgdGhlIGluc3RhbmNlIHdpbGwgYmVoYXZlIGFzIGlmIGl0IHdhcyBjcmVhdGVkIHZpYSBhbiB4cHViLlxyXG4gICAqL1xyXG4gIHdpcGVQcml2YXRlRGF0YSgpIHtcclxuICAgIHRoaXMucHJpdmF0ZUtleSA9IG51bGxcclxuICAgIHRoaXMucHJpdmF0ZUV4dGVuZGVkS2V5ID0gbnVsbFxyXG4gICAgdGhpcy5wcml2YXRlS2V5Q0I1OCA9IG51bGxcclxuICAgIHRoaXMuaGRrZXkud2lwZVByaXZhdGVEYXRhKClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gSEROb2RlIGZyb20gYSBtYXN0ZXIgc2VlZCBvciBhbiBleHRlbmRlZCBwdWJsaWMvcHJpdmF0ZSBrZXlcclxuICAgKiBAcGFyYW0gZnJvbSBzZWVkIG9yIGtleSB0byBjcmVhdGUgSEROb2RlIGZyb21cclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcihmcm9tOiBzdHJpbmcgfCBCdWZmZXIpIHtcclxuICAgIGlmICh0eXBlb2YgZnJvbSA9PT0gXCJzdHJpbmdcIiAmJiBmcm9tLnN1YnN0cmluZygwLCAyKSA9PT0gXCJ4cFwiKSB7XHJcbiAgICAgIHRoaXMuaGRrZXkgPSBoZG5vZGUuZnJvbUV4dGVuZGVkS2V5KGZyb20pXHJcbiAgICB9IGVsc2UgaWYgKEJ1ZmZlci5pc0J1ZmZlcihmcm9tKSkge1xyXG4gICAgICB0aGlzLmhka2V5ID0gaGRub2RlLmZyb21NYXN0ZXJTZWVkKGZyb20gYXMgdW5rbm93biBhcyBnbG9iYWxUaGlzLkJ1ZmZlcilcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuaGRrZXkgPSBoZG5vZGUuZnJvbU1hc3RlclNlZWQoXHJcbiAgICAgICAgQnVmZmVyLmZyb20oZnJvbSkgYXMgdW5rbm93biBhcyBnbG9iYWxUaGlzLkJ1ZmZlclxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICB0aGlzLnB1YmxpY0tleSA9IHRoaXMuaGRrZXkucHVibGljS2V5XHJcbiAgICB0aGlzLnByaXZhdGVLZXkgPSB0aGlzLmhka2V5LnByaXZhdGVLZXlcclxuICAgIGlmICh0aGlzLnByaXZhdGVLZXkpIHtcclxuICAgICAgdGhpcy5wcml2YXRlS2V5Q0I1OCA9IGBQcml2YXRlS2V5LSR7YmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnByaXZhdGVLZXkpfWBcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucHJpdmF0ZUV4dGVuZGVkS2V5ID0gbnVsbFxyXG4gICAgfVxyXG4gICAgdGhpcy5jaGFpbkNvZGUgPSB0aGlzLmhka2V5LmNoYWluQ29kZVxyXG4gICAgdGhpcy5wcml2YXRlRXh0ZW5kZWRLZXkgPSB0aGlzLmhka2V5LnByaXZhdGVFeHRlbmRlZEtleVxyXG4gICAgdGhpcy5wdWJsaWNFeHRlbmRlZEtleSA9IHRoaXMuaGRrZXkucHVibGljRXh0ZW5kZWRLZXlcclxuICB9XHJcbn1cclxuIl19