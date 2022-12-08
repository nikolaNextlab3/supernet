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
    constructor(hrp, chainid) {
        super();
        this.hrp = "";
        this.chainid = "";
        /**
         * Makes a new key pair, returns the address.
         *
         * @returns The new key pair
         */
        this.makeKey = () => {
            let keypair = new KeyPair(this.hrp, this.chainid);
            this.addKey(keypair);
            return keypair;
        };
        this.addKey = (newKey) => {
            newKey.setChainID(this.chainid);
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
            let keypair = new KeyPair(this.hrp, this.chainid);
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
        this.chainid = chainid;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyChain(args[0], args[1]);
        }
        return new KeyChain(this.hrp, this.chainid);
    }
    clone() {
        const newkc = new KeyChain(this.hrp, this.chainid);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9qdm0va2V5Y2hhaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBS0Esb0VBQTJDO0FBQzNDLHNEQUE0RTtBQUM1RSx1Q0FBMkQ7QUFFM0Q7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQixxQkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxPQUFRLFNBQVEsNEJBQWdCO0lBQzNDLEtBQUs7UUFDSCxNQUFNLEtBQUssR0FBWSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMxRCxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUN4RCxPQUFPLEtBQWEsQ0FBQTtJQUN0QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBUyxDQUFBO1NBQzdDO1FBQ0QsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQVMsQ0FBQTtJQUNwRCxDQUFDO0NBQ0Y7QUFiRCwwQkFhQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFhLFFBQVMsU0FBUSw2QkFBMEI7SUFpRXREOztPQUVHO0lBQ0gsWUFBWSxHQUFXLEVBQUUsT0FBZTtRQUN0QyxLQUFLLEVBQUUsQ0FBQTtRQXBFVCxRQUFHLEdBQVcsRUFBRSxDQUFBO1FBQ2hCLFlB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a2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktSlZNLUtleUNoYWluXHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBTRUNQMjU2azFLZXlDaGFpbiwgU0VDUDI1NmsxS2V5UGFpciB9IGZyb20gXCIuLi8uLi9jb21tb24vc2VjcDI1NmsxXCJcclxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZFR5cGUgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBwcml2YXRlIGFuZCBwdWJsaWMga2V5cGFpciBvbiBhbiBKVk0gQ2hhaW4uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgS2V5UGFpciBleHRlbmRzIFNFQ1AyNTZrMUtleVBhaXIge1xyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgbmV3a3A6IEtleVBhaXIgPSBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKVxyXG4gICAgbmV3a3AuaW1wb3J0S2V5KGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMuZ2V0UHJpdmF0ZUtleSgpKSlcclxuICAgIHJldHVybiBuZXdrcCBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgIHJldHVybiBuZXcgS2V5UGFpcihhcmdzWzBdLCBhcmdzWzFdKSBhcyB0aGlzXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRCkgYXMgdGhpc1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBrZXkgY2hhaW4gaW4gSnVuZW8uXHJcbiAqXHJcbiAqIEB0eXBlcGFyYW0gS2V5UGFpciBDbGFzcyBleHRlbmRpbmcgW1tTRUNQMjU2azFLZXlDaGFpbl1dIHdoaWNoIGlzIHVzZWQgYXMgdGhlIGtleSBpbiBbW0tleUNoYWluXV1cclxuICovXHJcbmV4cG9ydCBjbGFzcyBLZXlDaGFpbiBleHRlbmRzIFNFQ1AyNTZrMUtleUNoYWluPEtleVBhaXI+IHtcclxuICBocnA6IHN0cmluZyA9IFwiXCJcclxuICBjaGFpbmlkOiBzdHJpbmcgPSBcIlwiXHJcblxyXG4gIC8qKlxyXG4gICAqIE1ha2VzIGEgbmV3IGtleSBwYWlyLCByZXR1cm5zIHRoZSBhZGRyZXNzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXkgcGFpclxyXG4gICAqL1xyXG4gIG1ha2VLZXkgPSAoKTogS2V5UGFpciA9PiB7XHJcbiAgICBsZXQga2V5cGFpcjogS2V5UGFpciA9IG5ldyBLZXlQYWlyKHRoaXMuaHJwLCB0aGlzLmNoYWluaWQpXHJcbiAgICB0aGlzLmFkZEtleShrZXlwYWlyKVxyXG4gICAgcmV0dXJuIGtleXBhaXJcclxuICB9XHJcblxyXG4gIGFkZEtleSA9IChuZXdLZXk6IEtleVBhaXIpID0+IHtcclxuICAgIG5ld0tleS5zZXRDaGFpbklEKHRoaXMuY2hhaW5pZClcclxuICAgIHN1cGVyLmFkZEtleShuZXdLZXkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIHByaXZhdGUga2V5LCBtYWtlcyBhIG5ldyBrZXkgcGFpciwgcmV0dXJucyB0aGUgYWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwcml2ayBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXkgcGFpclxyXG4gICAqL1xyXG4gIGltcG9ydEtleSA9IChwcml2azogQnVmZmVyIHwgc3RyaW5nKTogS2V5UGFpciA9PiB7XHJcbiAgICBsZXQga2V5cGFpcjogS2V5UGFpciA9IG5ldyBLZXlQYWlyKHRoaXMuaHJwLCB0aGlzLmNoYWluaWQpXHJcbiAgICBsZXQgcGs6IEJ1ZmZlclxyXG4gICAgaWYgKHR5cGVvZiBwcml2ayA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBwayA9IGJpbnRvb2xzLmNiNThEZWNvZGUocHJpdmsuc3BsaXQoXCItXCIpWzFdKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGsgPSBiaW50b29scy5jb3B5RnJvbShwcml2aylcclxuICAgIH1cclxuICAgIGtleXBhaXIuaW1wb3J0S2V5KHBrKVxyXG4gICAgaWYgKCEoa2V5cGFpci5nZXRBZGRyZXNzKCkudG9TdHJpbmcoXCJoZXhcIikgaW4gdGhpcy5rZXlzKSkge1xyXG4gICAgICB0aGlzLmFkZEtleShrZXlwYWlyKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGtleXBhaXJcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09IDIpIHtcclxuICAgICAgcmV0dXJuIG5ldyBLZXlDaGFpbihhcmdzWzBdLCBhcmdzWzFdKSBhcyB0aGlzXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IEtleUNoYWluKHRoaXMuaHJwLCB0aGlzLmNoYWluaWQpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgbmV3a2M6IEtleUNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuaHJwLCB0aGlzLmNoYWluaWQpXHJcbiAgICBmb3IgKGxldCBrIGluIHRoaXMua2V5cykge1xyXG4gICAgICBuZXdrYy5hZGRLZXkodGhpcy5rZXlzW2Ake2t9YF0uY2xvbmUoKSlcclxuICAgIH1cclxuICAgIHJldHVybiBuZXdrYyBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICB1bmlvbihrYzogdGhpcyk6IHRoaXMge1xyXG4gICAgbGV0IG5ld2tjOiBLZXlDaGFpbiA9IGtjLmNsb25lKClcclxuICAgIGZvciAobGV0IGsgaW4gdGhpcy5rZXlzKSB7XHJcbiAgICAgIG5ld2tjLmFkZEtleSh0aGlzLmtleXNbYCR7a31gXS5jbG9uZSgpKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld2tjIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgaW5zdGFuY2Ugb2YgS2V5Q2hhaW4uXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoaHJwOiBzdHJpbmcsIGNoYWluaWQ6IHN0cmluZykge1xyXG4gICAgc3VwZXIoKVxyXG4gICAgdGhpcy5ocnAgPSBocnBcclxuICAgIHRoaXMuY2hhaW5pZCA9IGNoYWluaWRcclxuICB9XHJcbn1cclxuIl19