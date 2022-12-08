"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyChain = exports.KeyPair = void 0;
const bintools_1 = __importDefault(require("../../utils/bintools"));
const secp256k1_1 = require("../../common/secp256k1");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for representing a private and public keypair on the Platform Chain.
 */
class KeyPair extends secp256k1_1.SECP256k1KeyPair {
    clone() {
        let newkp = new KeyPair(this.hrp, this.chainID);
        newkp.importKey(bintools.copyFrom(this.getPrivateKey()));
        return newkp;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyPair(args[0], args[1]);
        }
        return new KeyPair(this.hrp, this.chainID);
    }
}
exports.KeyPair = KeyPair;
/**
 * Class for representing a key chain in Juneo.
 *
 * @typeparam KeyPair Class extending [[KeyPair]] which is used as the key in [[KeyChain]]
 */
class KeyChain extends secp256k1_1.SECP256k1KeyChain {
    /**
     * Returns instance of KeyChain.
     */
    constructor(hrp, chainID) {
        super();
        this.hrp = "";
        this.chainID = "";
        /**
         * Makes a new key pair, returns the address.
         *
         * @returns The new key pair
         */
        this.makeKey = () => {
            let keypair = new KeyPair(this.hrp, this.chainID);
            this.addKey(keypair);
            return keypair;
        };
        this.addKey = (newKey) => {
            newKey.setChainID(this.chainID);
            super.addKey(newKey);
        };
        /**
         * Given a private key, makes a new key pair, returns the address.
         *
         * @param privk A {@link https://github.com/feross/buffer|Buffer} or cb58 serialized string representing the private key
         *
         * @returns The new key pair
         */
        this.importKey = (privk) => {
            let keypair = new KeyPair(this.hrp, this.chainID);
            let pk;
            if (typeof privk === "string") {
                pk = bintools.cb58Decode(privk.split("-")[1]);
            }
            else {
                pk = bintools.copyFrom(privk);
            }
            keypair.importKey(pk);
            if (!(keypair.getAddress().toString("hex") in this.keys)) {
                this.addKey(keypair);
            }
            return keypair;
        };
        this.hrp = hrp;
        this.chainID = chainID;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyChain(args[0], args[1]);
        }
        return new KeyChain(this.hrp, this.chainID);
    }
    clone() {
        const newkc = new KeyChain(this.hrp, this.chainID);
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
    union(kc) {
        let newkc = kc.clone();
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
}
exports.KeyChain = KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2tleWNoYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUtBLG9FQUEyQztBQUMzQyxzREFBNEU7QUFDNUUsdUNBQTJEO0FBRTNEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsT0FBUSxTQUFRLDRCQUFnQjtJQUMzQyxLQUFLO1FBQ0gsSUFBSSxLQUFLLEdBQVksSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDeEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDeEQsT0FBTyxLQUFhLENBQUE7SUFDdEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUNwQixPQUFPLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQVMsQ0FBQTtTQUM3QztRQUNELE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFTLENBQUE7SUFDcEQsQ0FBQztDQUNGO0FBYkQsMEJBYUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBYSxRQUFTLFNBQVEsNkJBQTBCO0lBaUV0RDs7T0FFRztJQUNILFlBQVksR0FBVyxFQUFFLE9BQWU7UUFDdEMsS0FBSyxFQUFFLENBQUE7UUFwRVQsUUFBRyxHQUFXLEVBQUUsQ0FBQTtR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ICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tS2V5Q2hhaW5cclxuICovXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IFNFQ1AyNTZrMUtleUNoYWluLCBTRUNQMjU2azFLZXlQYWlyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9zZWNwMjU2azFcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHByaXZhdGUgYW5kIHB1YmxpYyBrZXlwYWlyIG9uIHRoZSBQbGF0Zm9ybSBDaGFpbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBLZXlQYWlyIGV4dGVuZHMgU0VDUDI1NmsxS2V5UGFpciB7XHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBsZXQgbmV3a3A6IEtleVBhaXIgPSBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKVxyXG4gICAgbmV3a3AuaW1wb3J0S2V5KGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMuZ2V0UHJpdmF0ZUtleSgpKSlcclxuICAgIHJldHVybiBuZXdrcCBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgIHJldHVybiBuZXcgS2V5UGFpcihhcmdzWzBdLCBhcmdzWzFdKSBhcyB0aGlzXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRCkgYXMgdGhpc1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBrZXkgY2hhaW4gaW4gSnVuZW8uXHJcbiAqXHJcbiAqIEB0eXBlcGFyYW0gS2V5UGFpciBDbGFzcyBleHRlbmRpbmcgW1tLZXlQYWlyXV0gd2hpY2ggaXMgdXNlZCBhcyB0aGUga2V5IGluIFtbS2V5Q2hhaW5dXVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEtleUNoYWluIGV4dGVuZHMgU0VDUDI1NmsxS2V5Q2hhaW48S2V5UGFpcj4ge1xyXG4gIGhycDogc3RyaW5nID0gXCJcIlxyXG4gIGNoYWluSUQ6IHN0cmluZyA9IFwiXCJcclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXHJcbiAgICovXHJcbiAgbWFrZUtleSA9ICgpOiBLZXlQYWlyID0+IHtcclxuICAgIGxldCBrZXlwYWlyOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcclxuICAgIHRoaXMuYWRkS2V5KGtleXBhaXIpXHJcbiAgICByZXR1cm4ga2V5cGFpclxyXG4gIH1cclxuXHJcbiAgYWRkS2V5ID0gKG5ld0tleTogS2V5UGFpcikgPT4ge1xyXG4gICAgbmV3S2V5LnNldENoYWluSUQodGhpcy5jaGFpbklEKVxyXG4gICAgc3VwZXIuYWRkS2V5KG5ld0tleSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgcHJpdmF0ZSBrZXksIG1ha2VzIGEgbmV3IGtleSBwYWlyLCByZXR1cm5zIHRoZSBhZGRyZXNzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHByaXZrIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXHJcbiAgICovXHJcbiAgaW1wb3J0S2V5ID0gKHByaXZrOiBCdWZmZXIgfCBzdHJpbmcpOiBLZXlQYWlyID0+IHtcclxuICAgIGxldCBrZXlwYWlyOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcclxuICAgIGxldCBwazogQnVmZmVyXHJcbiAgICBpZiAodHlwZW9mIHByaXZrID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHBrID0gYmludG9vbHMuY2I1OERlY29kZShwcml2ay5zcGxpdChcIi1cIilbMV0pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwayA9IGJpbnRvb2xzLmNvcHlGcm9tKHByaXZrKVxyXG4gICAgfVxyXG4gICAga2V5cGFpci5pbXBvcnRLZXkocGspXHJcbiAgICBpZiAoIShrZXlwYWlyLmdldEFkZHJlc3MoKS50b1N0cmluZyhcImhleFwiKSBpbiB0aGlzLmtleXMpKSB7XHJcbiAgICAgIHRoaXMuYWRkS2V5KGtleXBhaXIpXHJcbiAgICB9XHJcbiAgICByZXR1cm4ga2V5cGFpclxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICBpZiAoYXJncy5sZW5ndGggPT0gMikge1xyXG4gICAgICByZXR1cm4gbmV3IEtleUNoYWluKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXNcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgS2V5Q2hhaW4odGhpcy5ocnAsIHRoaXMuY2hhaW5JRCkgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdrYzogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcclxuICAgIGZvciAobGV0IGsgaW4gdGhpcy5rZXlzKSB7XHJcbiAgICAgIG5ld2tjLmFkZEtleSh0aGlzLmtleXNbYCR7a31gXS5jbG9uZSgpKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld2tjIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIHVuaW9uKGtjOiB0aGlzKTogdGhpcyB7XHJcbiAgICBsZXQgbmV3a2M6IEtleUNoYWluID0ga2MuY2xvbmUoKVxyXG4gICAgZm9yIChsZXQgayBpbiB0aGlzLmtleXMpIHtcclxuICAgICAgbmV3a2MuYWRkS2V5KHRoaXMua2V5c1tgJHtrfWBdLmNsb25lKCkpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3a2MgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBpbnN0YW5jZSBvZiBLZXlDaGFpbi5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihocnA6IHN0cmluZywgY2hhaW5JRDogc3RyaW5nKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICB0aGlzLmhycCA9IGhycFxyXG4gICAgdGhpcy5jaGFpbklEID0gY2hhaW5JRFxyXG4gIH1cclxufVxyXG4iXX0=