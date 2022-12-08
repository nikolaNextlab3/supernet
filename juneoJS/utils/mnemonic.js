"use strict";
/**
 * @packageDocumentation
 * @module Utils-Mnemonic
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer/");
const errors_1 = require("./errors");
const bip39 = require("bip39");
const randomBytes = require("randombytes");
/**
 * BIP39 Mnemonic code for generating deterministic keys.
 *
 */
class Mnemonic {
    constructor() {
        this.wordlists = bip39.wordlists;
    }
    /**
     * Retrieves the Mnemonic singleton.
     */
    static getInstance() {
        if (!Mnemonic.instance) {
            Mnemonic.instance = new Mnemonic();
        }
        return Mnemonic.instance;
    }
    /**
     * Return wordlists
     *
     * @param language a string specifying the language
     *
     * @returns A [[Wordlist]] object or array of strings
     */
    getWordlists(language) {
        if (language !== undefined) {
            return this.wordlists[`${language}`];
        }
        else {
            return this.wordlists;
        }
    }
    /**
     * Synchronously takes mnemonic and password and returns {@link https://github.com/feross/buffer|Buffer}
     *
     * @param mnemonic the mnemonic as a string
     * @param password the password as a string
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer}
     */
    mnemonicToSeedSync(mnemonic, password = "") {
        const seed = bip39.mnemonicToSeedSync(mnemonic, password);
        return buffer_1.Buffer.from(seed);
    }
    /**
     * Asynchronously takes mnemonic and password and returns Promise {@link https://github.com/feross/buffer|Buffer}
     *
     * @param mnemonic the mnemonic as a string
     * @param password the password as a string
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer}
     */
    mnemonicToSeed(mnemonic, password = "") {
        return __awaiter(this, void 0, void 0, function* () {
            const seed = yield bip39.mnemonicToSeed(mnemonic, password);
            return buffer_1.Buffer.from(seed);
        });
    }
    /**
     * Takes mnemonic and wordlist and returns buffer
     *
     * @param mnemonic the mnemonic as a string
     * @param wordlist Optional the wordlist as an array of strings
     *
     * @returns A string
     */
    mnemonicToEntropy(mnemonic, wordlist) {
        return bip39.mnemonicToEntropy(mnemonic, wordlist);
    }
    /**
     * Takes mnemonic and wordlist and returns buffer
     *
     * @param entropy the entropy as a {@link https://github.com/feross/buffer|Buffer} or as a string
     * @param wordlist Optional, the wordlist as an array of strings
     *
     * @returns A string
     */
    entropyToMnemonic(entropy, wordlist) {
        return bip39.entropyToMnemonic(entropy, wordlist);
    }
    /**
     * Validates a mnemonic
     11*
     * @param mnemonic the mnemonic as a string
     * @param wordlist Optional the wordlist as an array of strings
     *
     * @returns A string
     */
    validateMnemonic(mnemonic, wordlist) {
        return bip39.validateMnemonic(mnemonic, wordlist);
    }
    /**
     * Sets the default word list
     *
     * @param language the language as a string
     *
     */
    setDefaultWordlist(language) {
        bip39.setDefaultWordlist(language);
    }
    /**
     * Returns the language of the default word list
     *
     * @returns A string
     */
    getDefaultWordlist() {
        return bip39.getDefaultWordlist();
    }
    /**
     * Generate a random mnemonic (uses crypto.randomBytes under the hood), defaults to 256-bits of entropy
     *
     * @param strength Optional the strength as a number
     * @param rng Optional the random number generator. Defaults to crypto.randomBytes
     * @param wordlist Optional
     *
     */
    generateMnemonic(strength, rng, wordlist) {
        strength = strength || 256;
        if (strength % 32 !== 0) {
            throw new errors_1.InvalidEntropy("Error - Invalid entropy");
        }
        rng = rng || randomBytes;
        return bip39.generateMnemonic(strength, rng, wordlist);
    }
}
exports.default = Mnemonic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW5lbW9uaWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvbW5lbW9uaWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7QUFFSCxvQ0FBZ0M7QUFFaEMscUNBQXlDO0FBQ3pDLE1BQU0sS0FBSyxHQUFRLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNuQyxNQUFNLFdBQVcsR0FBUSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7QUFFL0M7OztHQUdHO0FBQ0gsTUFBcUIsUUFBUTtJQUUzQjtRQUNVLGNBQVMsR0FBYSxLQUFLLENBQUMsU0FBUyxDQUFBO0lBRHhCLENBQUM7SUFHeEI7O09BRUc7SUFDSCxNQUFNLENBQUMsV0FBVztRQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUN0QixRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUE7U0FDbkM7UUFDRCxPQUFPLFFBQVEsQ0FBQyxRQUFRLENBQUE7SUFDMUIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFlBQVksQ0FBQyxRQUFpQjtRQUM1QixJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsQ0FBQTtTQUNyQzthQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFBO1NBQ3RCO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxrQkFBa0IsQ0FBQyxRQUFnQixFQUFFLFdBQW1CLEVBQUU7UUFDeEQsTUFBTSxJQUFJLEdBQVcsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNqRSxPQUFPLGVBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDRyxjQUFjLENBQ2xCLFFBQWdCLEVBQ2hCLFdBQW1CLEVBQUU7O1lBRXJCLE1BQU0sSUFBSSxHQUFXLE1BQU0sS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFDbkUsT0FBTyxlQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFCLENBQUM7S0FBQTtJQUVEOzs7Ozs7O09BT0c7SUFDSCxpQkFBaUIsQ0FBQyxRQUFnQixFQUFFLFFBQW1CO1FBQ3JELE9BQU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNwRCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILGlCQUFpQixDQUFDLE9BQXdCLEVBQUUsUUFBbUI7UUFDN0QsT0FBTyxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ25ELENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsZ0JBQWdCLENBQUMsUUFBZ0IsRUFBRSxRQUFtQjtRQUNwRCxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDbkQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsa0JBQWtCLENBQUMsUUFBZ0I7UUFDakMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsa0JBQWtCO1FBQ2hCLE9BQU8sS0FBSyxDQUFDLGtCQUFrQixFQUFFLENBQUE7SUFDbkMsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxnQkFBZ0IsQ0FDZCxRQUFpQixFQUNqQixHQUE4QixFQUM5QixRQUFtQjtRQUVuQixRQUFRLEdBQUcsUUFBUSxJQUFJLEdBQUcsQ0FBQTtRQUMxQixJQUFJLFFBQVEsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sSUFBSSx1QkFBYyxDQUFDLHlCQUF5QixDQUFDLENBQUE7U0FDcEQ7UUFDRCxHQUFHLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQTtRQUN4QixPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3hELENBQUM7Q0FDRjtBQXRJRCwyQkFzSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgVXRpbHMtTW5lbW9uaWNcclxuICovXHJcblxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCB7IFdvcmRsaXN0IH0gZnJvbSBcImV0aGVyc1wiXHJcbmltcG9ydCB7IEludmFsaWRFbnRyb3B5IH0gZnJvbSBcIi4vZXJyb3JzXCJcclxuY29uc3QgYmlwMzk6IGFueSA9IHJlcXVpcmUoXCJiaXAzOVwiKVxyXG5jb25zdCByYW5kb21CeXRlczogYW55ID0gcmVxdWlyZShcInJhbmRvbWJ5dGVzXCIpXHJcblxyXG4vKipcclxuICogQklQMzkgTW5lbW9uaWMgY29kZSBmb3IgZ2VuZXJhdGluZyBkZXRlcm1pbmlzdGljIGtleXMuXHJcbiAqXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNbmVtb25pYyB7XHJcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IE1uZW1vbmljXHJcbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XHJcbiAgcHJvdGVjdGVkIHdvcmRsaXN0czogc3RyaW5nW10gPSBiaXAzOS53b3JkbGlzdHNcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0cmlldmVzIHRoZSBNbmVtb25pYyBzaW5nbGV0b24uXHJcbiAgICovXHJcbiAgc3RhdGljIGdldEluc3RhbmNlKCk6IE1uZW1vbmljIHtcclxuICAgIGlmICghTW5lbW9uaWMuaW5zdGFuY2UpIHtcclxuICAgICAgTW5lbW9uaWMuaW5zdGFuY2UgPSBuZXcgTW5lbW9uaWMoKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1uZW1vbmljLmluc3RhbmNlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm4gd29yZGxpc3RzXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbGFuZ3VhZ2UgYSBzdHJpbmcgc3BlY2lmeWluZyB0aGUgbGFuZ3VhZ2VcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgW1tXb3JkbGlzdF1dIG9iamVjdCBvciBhcnJheSBvZiBzdHJpbmdzXHJcbiAgICovXHJcbiAgZ2V0V29yZGxpc3RzKGxhbmd1YWdlPzogc3RyaW5nKTogc3RyaW5nW10gfCBXb3JkbGlzdCB7XHJcbiAgICBpZiAobGFuZ3VhZ2UgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy53b3JkbGlzdHNbYCR7bGFuZ3VhZ2V9YF1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLndvcmRsaXN0c1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3luY2hyb25vdXNseSB0YWtlcyBtbmVtb25pYyBhbmQgcGFzc3dvcmQgYW5kIHJldHVybnMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtbmVtb25pYyB0aGUgbW5lbW9uaWMgYXMgYSBzdHJpbmdcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgdGhlIHBhc3N3b3JkIGFzIGEgc3RyaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgbW5lbW9uaWNUb1NlZWRTeW5jKG1uZW1vbmljOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcgPSBcIlwiKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHNlZWQ6IEJ1ZmZlciA9IGJpcDM5Lm1uZW1vbmljVG9TZWVkU3luYyhtbmVtb25pYywgcGFzc3dvcmQpXHJcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oc2VlZClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IHRha2VzIG1uZW1vbmljIGFuZCBwYXNzd29yZCBhbmQgcmV0dXJucyBQcm9taXNlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICpcclxuICAgKiBAcGFyYW0gbW5lbW9uaWMgdGhlIG1uZW1vbmljIGFzIGEgc3RyaW5nXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIHRoZSBwYXNzd29yZCBhcyBhIHN0cmluZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxyXG4gICAqL1xyXG4gIGFzeW5jIG1uZW1vbmljVG9TZWVkKFxyXG4gICAgbW5lbW9uaWM6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcgPSBcIlwiXHJcbiAgKTogUHJvbWlzZTxCdWZmZXI+IHtcclxuICAgIGNvbnN0IHNlZWQ6IEJ1ZmZlciA9IGF3YWl0IGJpcDM5Lm1uZW1vbmljVG9TZWVkKG1uZW1vbmljLCBwYXNzd29yZClcclxuICAgIHJldHVybiBCdWZmZXIuZnJvbShzZWVkKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgbW5lbW9uaWMgYW5kIHdvcmRsaXN0IGFuZCByZXR1cm5zIGJ1ZmZlclxyXG4gICAqXHJcbiAgICogQHBhcmFtIG1uZW1vbmljIHRoZSBtbmVtb25pYyBhcyBhIHN0cmluZ1xyXG4gICAqIEBwYXJhbSB3b3JkbGlzdCBPcHRpb25hbCB0aGUgd29yZGxpc3QgYXMgYW4gYXJyYXkgb2Ygc3RyaW5nc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBzdHJpbmdcclxuICAgKi9cclxuICBtbmVtb25pY1RvRW50cm9weShtbmVtb25pYzogc3RyaW5nLCB3b3JkbGlzdD86IHN0cmluZ1tdKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaXAzOS5tbmVtb25pY1RvRW50cm9weShtbmVtb25pYywgd29yZGxpc3QpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBtbmVtb25pYyBhbmQgd29yZGxpc3QgYW5kIHJldHVybnMgYnVmZmVyXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZW50cm9weSB0aGUgZW50cm9weSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFzIGEgc3RyaW5nXHJcbiAgICogQHBhcmFtIHdvcmRsaXN0IE9wdGlvbmFsLCB0aGUgd29yZGxpc3QgYXMgYW4gYXJyYXkgb2Ygc3RyaW5nc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBzdHJpbmdcclxuICAgKi9cclxuICBlbnRyb3B5VG9NbmVtb25pYyhlbnRyb3B5OiBCdWZmZXIgfCBzdHJpbmcsIHdvcmRsaXN0Pzogc3RyaW5nW10pOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpcDM5LmVudHJvcHlUb01uZW1vbmljKGVudHJvcHksIHdvcmRsaXN0KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVmFsaWRhdGVzIGEgbW5lbW9uaWNcclxuICAgMTEqXHJcbiAgICogQHBhcmFtIG1uZW1vbmljIHRoZSBtbmVtb25pYyBhcyBhIHN0cmluZ1xyXG4gICAqIEBwYXJhbSB3b3JkbGlzdCBPcHRpb25hbCB0aGUgd29yZGxpc3QgYXMgYW4gYXJyYXkgb2Ygc3RyaW5nc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBzdHJpbmdcclxuICAgKi9cclxuICB2YWxpZGF0ZU1uZW1vbmljKG1uZW1vbmljOiBzdHJpbmcsIHdvcmRsaXN0Pzogc3RyaW5nW10pOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpcDM5LnZhbGlkYXRlTW5lbW9uaWMobW5lbW9uaWMsIHdvcmRsaXN0KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgZGVmYXVsdCB3b3JkIGxpc3RcclxuICAgKlxyXG4gICAqIEBwYXJhbSBsYW5ndWFnZSB0aGUgbGFuZ3VhZ2UgYXMgYSBzdHJpbmdcclxuICAgKlxyXG4gICAqL1xyXG4gIHNldERlZmF1bHRXb3JkbGlzdChsYW5ndWFnZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBiaXAzOS5zZXREZWZhdWx0V29yZGxpc3QobGFuZ3VhZ2UpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsYW5ndWFnZSBvZiB0aGUgZGVmYXVsdCB3b3JkIGxpc3RcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nXHJcbiAgICovXHJcbiAgZ2V0RGVmYXVsdFdvcmRsaXN0KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYmlwMzkuZ2V0RGVmYXVsdFdvcmRsaXN0KClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlIGEgcmFuZG9tIG1uZW1vbmljICh1c2VzIGNyeXB0by5yYW5kb21CeXRlcyB1bmRlciB0aGUgaG9vZCksIGRlZmF1bHRzIHRvIDI1Ni1iaXRzIG9mIGVudHJvcHlcclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdHJlbmd0aCBPcHRpb25hbCB0aGUgc3RyZW5ndGggYXMgYSBudW1iZXJcclxuICAgKiBAcGFyYW0gcm5nIE9wdGlvbmFsIHRoZSByYW5kb20gbnVtYmVyIGdlbmVyYXRvci4gRGVmYXVsdHMgdG8gY3J5cHRvLnJhbmRvbUJ5dGVzXHJcbiAgICogQHBhcmFtIHdvcmRsaXN0IE9wdGlvbmFsXHJcbiAgICpcclxuICAgKi9cclxuICBnZW5lcmF0ZU1uZW1vbmljKFxyXG4gICAgc3RyZW5ndGg/OiBudW1iZXIsXHJcbiAgICBybmc/OiAoc2l6ZTogbnVtYmVyKSA9PiBCdWZmZXIsXHJcbiAgICB3b3JkbGlzdD86IHN0cmluZ1tdXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIHN0cmVuZ3RoID0gc3RyZW5ndGggfHwgMjU2XHJcbiAgICBpZiAoc3RyZW5ndGggJSAzMiAhPT0gMCkge1xyXG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEVudHJvcHkoXCJFcnJvciAtIEludmFsaWQgZW50cm9weVwiKVxyXG4gICAgfVxyXG4gICAgcm5nID0gcm5nIHx8IHJhbmRvbUJ5dGVzXHJcbiAgICByZXR1cm4gYmlwMzkuZ2VuZXJhdGVNbmVtb25pYyhzdHJlbmd0aCwgcm5nLCB3b3JkbGlzdClcclxuICB9XHJcbn1cclxuIl19