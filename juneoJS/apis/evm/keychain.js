"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-KeyChain
 */
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
 * Class for representing a private and public keypair on an JVM Chain.
 */
class KeyPair extends secp256k1_1.SECP256k1KeyPair {
    clone() {
        const newkp = new KeyPair(this.hrp, this.chainID);
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
 * @typeparam KeyPair Class extending [[SECP256k1KeyChain]] which is used as the key in [[KeyChain]]
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
            const keypair = new KeyPair(this.hrp, this.chainID);
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
         * @param privk A {@link https://github.com/feross/buffer|Buffer}
         * or cb58 serialized string representing the private key
         *
         * @returns The new key pair
         */
        this.importKey = (privk) => {
            const keypair = new KeyPair(this.hrp, this.chainID);
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
        const newkc = kc.clone();
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
}
exports.KeyChain = KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0va2V5Y2hhaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBR0gsb0VBQTJDO0FBQzNDLHNEQUE0RTtBQUM1RSx1Q0FBMkQ7QUFFM0Q7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQixxQkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxPQUFRLFNBQVEsNEJBQWdCO0lBQzNDLEtBQUs7UUFDSCxNQUFNLEtBQUssR0FBWSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMxRCxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUN4RCxPQUFPLEtBQWEsQ0FBQTtJQUN0QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBUyxDQUFBO1NBQzdDO1FBQ0QsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQVMsQ0FBQTtJQUNwRCxDQUFDO0NBQ0Y7QUFiRCwwQkFhQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFhLFFBQVMsU0FBUSw2QkFBMEI7SUFrRXREOztPQUVHO0lBQ0gsWUFBWSxHQUFXLEVBQUUsT0FBZTtRQUN0QyxLQUFLLEVBQUUsQ0FBQTtRQXJFVCxRQUFHLEdBQVcsRUFBRSxD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KipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLUVWTS1LZXlDaGFpblxyXG4gKi9cclxuXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IFNFQ1AyNTZrMUtleUNoYWluLCBTRUNQMjU2azFLZXlQYWlyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9zZWNwMjU2azFcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHByaXZhdGUgYW5kIHB1YmxpYyBrZXlwYWlyIG9uIGFuIEpWTSBDaGFpbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBLZXlQYWlyIGV4dGVuZHMgU0VDUDI1NmsxS2V5UGFpciB7XHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdrcDogS2V5UGFpciA9IG5ldyBLZXlQYWlyKHRoaXMuaHJwLCB0aGlzLmNoYWluSUQpXHJcbiAgICBuZXdrcC5pbXBvcnRLZXkoYmludG9vbHMuY29weUZyb20odGhpcy5nZXRQcml2YXRlS2V5KCkpKVxyXG4gICAgcmV0dXJuIG5ld2twIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09IDIpIHtcclxuICAgICAgcmV0dXJuIG5ldyBLZXlQYWlyKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXNcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKSBhcyB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIGtleSBjaGFpbiBpbiBKdW5lby5cclxuICpcclxuICogQHR5cGVwYXJhbSBLZXlQYWlyIENsYXNzIGV4dGVuZGluZyBbW1NFQ1AyNTZrMUtleUNoYWluXV0gd2hpY2ggaXMgdXNlZCBhcyB0aGUga2V5IGluIFtbS2V5Q2hhaW5dXVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEtleUNoYWluIGV4dGVuZHMgU0VDUDI1NmsxS2V5Q2hhaW48S2V5UGFpcj4ge1xyXG4gIGhycDogc3RyaW5nID0gXCJcIlxyXG4gIGNoYWluSUQ6IHN0cmluZyA9IFwiXCJcclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXHJcbiAgICovXHJcbiAgbWFrZUtleSA9ICgpOiBLZXlQYWlyID0+IHtcclxuICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKVxyXG4gICAgdGhpcy5hZGRLZXkoa2V5cGFpcilcclxuICAgIHJldHVybiBrZXlwYWlyXHJcbiAgfVxyXG5cclxuICBhZGRLZXkgPSAobmV3S2V5OiBLZXlQYWlyKSA9PiB7XHJcbiAgICBuZXdLZXkuc2V0Q2hhaW5JRCh0aGlzLmNoYWluSUQpXHJcbiAgICBzdXBlci5hZGRLZXkobmV3S2V5KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSBwcml2YXRlIGtleSwgbWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcHJpdmsgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxyXG4gICAqIG9yIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXkgcGFpclxyXG4gICAqL1xyXG4gIGltcG9ydEtleSA9IChwcml2azogQnVmZmVyIHwgc3RyaW5nKTogS2V5UGFpciA9PiB7XHJcbiAgICBjb25zdCBrZXlwYWlyOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcclxuICAgIGxldCBwazogQnVmZmVyXHJcbiAgICBpZiAodHlwZW9mIHByaXZrID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHBrID0gYmludG9vbHMuY2I1OERlY29kZShwcml2ay5zcGxpdChcIi1cIilbMV0pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwayA9IGJpbnRvb2xzLmNvcHlGcm9tKHByaXZrKVxyXG4gICAgfVxyXG4gICAga2V5cGFpci5pbXBvcnRLZXkocGspXHJcbiAgICBpZiAoIShrZXlwYWlyLmdldEFkZHJlc3MoKS50b1N0cmluZyhcImhleFwiKSBpbiB0aGlzLmtleXMpKSB7XHJcbiAgICAgIHRoaXMuYWRkS2V5KGtleXBhaXIpXHJcbiAgICB9XHJcbiAgICByZXR1cm4ga2V5cGFpclxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICBpZiAoYXJncy5sZW5ndGggPT0gMikge1xyXG4gICAgICByZXR1cm4gbmV3IEtleUNoYWluKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXNcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgS2V5Q2hhaW4odGhpcy5ocnAsIHRoaXMuY2hhaW5JRCkgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdrYzogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcclxuICAgIGZvciAobGV0IGsgaW4gdGhpcy5rZXlzKSB7XHJcbiAgICAgIG5ld2tjLmFkZEtleSh0aGlzLmtleXNbYCR7a31gXS5jbG9uZSgpKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld2tjIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIHVuaW9uKGtjOiB0aGlzKTogdGhpcyB7XHJcbiAgICBjb25zdCBuZXdrYzogS2V5Q2hhaW4gPSBrYy5jbG9uZSgpXHJcbiAgICBmb3IgKGxldCBrIGluIHRoaXMua2V5cykge1xyXG4gICAgICBuZXdrYy5hZGRLZXkodGhpcy5rZXlzW2Ake2t9YF0uY2xvbmUoKSlcclxuICAgIH1cclxuICAgIHJldHVybiBuZXdrYyBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGluc3RhbmNlIG9mIEtleUNoYWluLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGhycDogc3RyaW5nLCBjaGFpbklEOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKClcclxuICAgIHRoaXMuaHJwID0gaHJwXHJcbiAgICB0aGlzLmNoYWluSUQgPSBjaGFpbklEXHJcbiAgfVxyXG59XHJcbiJdfQ==