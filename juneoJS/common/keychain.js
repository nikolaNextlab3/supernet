"use strict";
/**
 * @packageDocumentation
 * @module Common-KeyChain
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardKeyChain = exports.StandardKeyPair = void 0;
const buffer_1 = require("buffer/");
/**
 * Class for representing a private and public keypair in Juneo.
 * All APIs that need key pairs should extend on this class.
 */
class StandardKeyPair {
    /**
     * Returns a reference to the private key.
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the private key
     */
    getPrivateKey() {
        return this.privk;
    }
    /**
     * Returns a reference to the public key.
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key
     */
    getPublicKey() {
        return this.pubk;
    }
}
exports.StandardKeyPair = StandardKeyPair;
/**
 * Class for representing a key chain in Juneo.
 * All endpoints that need key chains should extend on this class.
 *
 * @typeparam KPClass extending [[StandardKeyPair]] which is used as the key in [[StandardKeyChain]]
 */
class StandardKeyChain {
    constructor() {
        this.keys = {};
        /**
         * Gets an array of addresses stored in the [[StandardKeyChain]].
         *
         * @returns An array of {@link https://github.com/feross/buffer|Buffer}  representations
         * of the addresses
         */
        this.getAddresses = () => Object.values(this.keys).map((kp) => kp.getAddress());
        /**
         * Gets an array of addresses stored in the [[StandardKeyChain]].
         *
         * @returns An array of string representations of the addresses
         */
        this.getAddressStrings = () => Object.values(this.keys).map((kp) => kp.getAddressString());
        /**
         * Removes the key pair from the list of they keys managed in the [[StandardKeyChain]].
         *
         * @param key A {@link https://github.com/feross/buffer|Buffer} for the address or
         * KPClass to remove
         *
         * @returns The boolean true if a key was removed.
         */
        this.removeKey = (key) => {
            let kaddr;
            if (key instanceof buffer_1.Buffer) {
                kaddr = key.toString("hex");
            }
            else {
                kaddr = key.getAddress().toString("hex");
            }
            if (kaddr in this.keys) {
                delete this.keys[`${kaddr}`];
                return true;
            }
            return false;
        };
        /**
         * Checks if there is a key associated with the provided address.
         *
         * @param address The address to check for existence in the keys database
         *
         * @returns True on success, false if not found
         */
        this.hasKey = (address) => address.toString("hex") in this.keys;
        /**
         * Returns the [[StandardKeyPair]] listed under the provided address
         *
         * @param address The {@link https://github.com/feross/buffer|Buffer} of the address to
         * retrieve from the keys database
         *
         * @returns A reference to the [[StandardKeyPair]] in the keys database
         */
        this.getKey = (address) => this.keys[address.toString("hex")];
    }
    /**
     * Adds the key pair to the list of the keys managed in the [[StandardKeyChain]].
     *
     * @param newKey A key pair of the appropriate class to be added to the [[StandardKeyChain]]
     */
    addKey(newKey) {
        this.keys[newKey.getAddress().toString("hex")] = newKey;
    }
}
exports.StandardKeyChain = StandardKeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2tleWNoYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUVILG9DQUFnQztBQUVoQzs7O0dBR0c7QUFDSCxNQUFzQixlQUFlO0lBb0RuQzs7OztPQUlHO0lBQ0gsYUFBYTtRQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtJQUNuQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVk7UUFDVixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQztDQWlDRjtBQXJHRCwwQ0FxR0M7QUFFRDs7Ozs7R0FLRztBQUNILE1BQXNCLGdCQUFnQjtJQUF0QztRQUNZLFNBQUksR0FBbUMsRUFBRSxDQUFBO1FBa0JuRDs7Ozs7V0FLRztRQUNILGlCQUFZLEdBQUcsR0FBYSxFQUFFLENBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUE7UUFFdkQ7Ozs7V0FJRztRQUNILHNCQUFpQixHQUFHLEdBQWEsRUFBRSxDQUNqQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUE7UUFXN0Q7Ozs7Ozs7V0FPRztRQUNILGNBQVMsR0FBRyxDQUFDLEdBQXFCLEVBQUUsRUFBRTtZQUNwQyxJQUFJLEtBQWEsQ0FBQTtZQUNqQixJQUFJLEdBQUcsWUFBWSxlQUFNLEVBQUU7Z0JBQ3pCLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQzVCO2lCQUFNO2dCQUNMLEtBQUssR0FBRyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQ3pDO1lBQ0QsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDdEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQTtnQkFDNUIsT0FBTyxJQUFJLENBQUE7YUFDWjtZQUNELE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQyxDQUFBO1FBRUQ7Ozs7OztXQU1HO1FBQ0gsV0FBTSxHQUFHLENBQUMsT0FBZSxFQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUE7UUFFM0U7Ozs7Ozs7V0FPRztRQUNILFdBQU0sR0FBRyxDQUFDLE9BQWUsRUFBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7SUFPM0UsQ0FBQztJQXZEQzs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLE1BQWU7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFBO0lBQ3pELENBQUM7Q0FnREY7QUEzRkQsNENBMkZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIENvbW1vbi1LZXlDaGFpblxyXG4gKi9cclxuXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgcHJpdmF0ZSBhbmQgcHVibGljIGtleXBhaXIgaW4gSnVuZW8uXHJcbiAqIEFsbCBBUElzIHRoYXQgbmVlZCBrZXkgcGFpcnMgc2hvdWxkIGV4dGVuZCBvbiB0aGlzIGNsYXNzLlxyXG4gKi9cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkS2V5UGFpciB7XHJcbiAgcHJvdGVjdGVkIHB1Yms6IEJ1ZmZlclxyXG4gIHByb3RlY3RlZCBwcml2azogQnVmZmVyXHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlcyBhIG5ldyBrZXlwYWlyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGVudHJvcHkgT3B0aW9uYWwgcGFyYW1ldGVyIHRoYXQgbWF5IGJlIG5lY2Vzc2FyeSB0byBwcm9kdWNlIHNlY3VyZSBrZXlzXHJcbiAgICovXHJcbiAgYWJzdHJhY3QgZ2VuZXJhdGVLZXkoZW50cm9weT86IEJ1ZmZlcik6IHZvaWRcclxuXHJcbiAgLyoqXHJcbiAgICogSW1wb3J0cyBhIHByaXZhdGUga2V5IGFuZCBnZW5lcmF0ZXMgdGhlIGFwcHJvcHJpYXRlIHB1YmxpYyBrZXkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcHJpdmsgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB0cnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9uIGZhaWx1cmVcclxuICAgKi9cclxuICBhYnN0cmFjdCBpbXBvcnRLZXkocHJpdms6IEJ1ZmZlcik6IGJvb2xlYW5cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSBtZXNzYWdlLCBzaWducyBpdCwgYW5kIHJldHVybnMgdGhlIHNpZ25hdHVyZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdG8gc2lnblxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIHRoZSBzaWduYXR1cmVcclxuICAgKi9cclxuICBhYnN0cmFjdCBzaWduKG1zZzogQnVmZmVyKTogQnVmZmVyXHJcblxyXG4gIC8qKlxyXG4gICAqIFJlY292ZXJzIHRoZSBwdWJsaWMga2V5IG9mIGEgbWVzc2FnZSBzaWduZXIgZnJvbSBhIG1lc3NhZ2UgYW5kIGl0cyBhc3NvY2lhdGVkIHNpZ25hdHVyZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdGhhdCdzIHNpZ25lZFxyXG4gICAqIEBwYXJhbSBzaWcgVGhlIHNpZ25hdHVyZSB0aGF0J3Mgc2lnbmVkIG9uIHRoZSBtZXNzYWdlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHB1YmxpY1xyXG4gICAqIGtleSBvZiB0aGUgc2lnbmVyXHJcbiAgICovXHJcbiAgYWJzdHJhY3QgcmVjb3Zlcihtc2c6IEJ1ZmZlciwgc2lnOiBCdWZmZXIpOiBCdWZmZXJcclxuXHJcbiAgLyoqXHJcbiAgICogVmVyaWZpZXMgdGhhdCB0aGUgcHJpdmF0ZSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcm92aWRlZCBwdWJsaWMga2V5IHByb2R1Y2VzIHRoZVxyXG4gICAqIHNpZ25hdHVyZSBhc3NvY2lhdGVkIHdpdGggdGhlIGdpdmVuIG1lc3NhZ2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbXNnIFRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2lnbmF0dXJlXHJcbiAgICogQHBhcmFtIHNpZyBUaGUgc2lnbmF0dXJlIG9mIHRoZSBzaWduZWQgbWVzc2FnZVxyXG4gICAqIEBwYXJhbSBwdWJrIFRoZSBwdWJsaWMga2V5IGFzc29jaWF0ZWQgd2l0aCB0aGUgbWVzc2FnZSBzaWduYXR1cmVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRydWUgb24gc3VjY2VzcywgZmFsc2Ugb24gZmFpbHVyZVxyXG4gICAqL1xyXG4gIGFic3RyYWN0IHZlcmlmeShtc2c6IEJ1ZmZlciwgc2lnOiBCdWZmZXIsIHB1Yms6IEJ1ZmZlcik6IGJvb2xlYW5cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgcHJpdmF0ZSBrZXkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHByaXZhdGUga2V5XHJcbiAgICovXHJcbiAgZ2V0UHJpdmF0ZUtleSgpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucHJpdmtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIHB1YmxpYyBrZXkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHB1YmxpYyBrZXlcclxuICAgKi9cclxuICBnZXRQdWJsaWNLZXkoKTogQnVmZmVyIHtcclxuICAgIHJldHVybiB0aGlzLnB1YmtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHByaXZhdGUga2V5LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHB1YmxpYyBrZXlcclxuICAgKi9cclxuICBhYnN0cmFjdCBnZXRQcml2YXRlS2V5U3RyaW5nKCk6IHN0cmluZ1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwdWJsaWMga2V5LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHB1YmxpYyBrZXlcclxuICAgKi9cclxuICBhYnN0cmFjdCBnZXRQdWJsaWNLZXlTdHJpbmcoKTogc3RyaW5nXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9ICByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWRkcmVzc1xyXG4gICAqL1xyXG4gIGFic3RyYWN0IGdldEFkZHJlc3MoKTogQnVmZmVyXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFkZHJlc3MncyBzdHJpbmcgcmVwcmVzZW50YXRpb24uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWRkcmVzc1xyXG4gICAqL1xyXG4gIGFic3RyYWN0IGdldEFkZHJlc3NTdHJpbmcoKTogc3RyaW5nXHJcblxyXG4gIGFic3RyYWN0IGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXNcclxuXHJcbiAgYWJzdHJhY3QgY2xvbmUoKTogdGhpc1xyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIGtleSBjaGFpbiBpbiBKdW5lby5cclxuICogQWxsIGVuZHBvaW50cyB0aGF0IG5lZWQga2V5IGNoYWlucyBzaG91bGQgZXh0ZW5kIG9uIHRoaXMgY2xhc3MuXHJcbiAqXHJcbiAqIEB0eXBlcGFyYW0gS1BDbGFzcyBleHRlbmRpbmcgW1tTdGFuZGFyZEtleVBhaXJdXSB3aGljaCBpcyB1c2VkIGFzIHRoZSBrZXkgaW4gW1tTdGFuZGFyZEtleUNoYWluXV1cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZEtleUNoYWluPEtQQ2xhc3MgZXh0ZW5kcyBTdGFuZGFyZEtleVBhaXI+IHtcclxuICBwcm90ZWN0ZWQga2V5czogeyBbYWRkcmVzczogc3RyaW5nXTogS1BDbGFzcyB9ID0ge31cclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZXMgYSBuZXcgW1tTdGFuZGFyZEtleVBhaXJdXSwgcmV0dXJucyB0aGUgYWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFkZHJlc3Mgb2YgdGhlIG5ldyBbW1N0YW5kYXJkS2V5UGFpcl1dXHJcbiAgICovXHJcbiAgbWFrZUtleTogKCkgPT4gS1BDbGFzc1xyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIHByaXZhdGUga2V5LCBtYWtlcyBhIG5ldyBbW1N0YW5kYXJkS2V5UGFpcl1dLCByZXR1cm5zIHRoZSBhZGRyZXNzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHByaXZrIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBuZXcgW1tTdGFuZGFyZEtleVBhaXJdXVxyXG4gICAqL1xyXG4gIGltcG9ydEtleTogKHByaXZrOiBCdWZmZXIpID0+IEtQQ2xhc3NcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyBhbiBhcnJheSBvZiBhZGRyZXNzZXMgc3RvcmVkIGluIHRoZSBbW1N0YW5kYXJkS2V5Q2hhaW5dXS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9ICByZXByZXNlbnRhdGlvbnNcclxuICAgKiBvZiB0aGUgYWRkcmVzc2VzXHJcbiAgICovXHJcbiAgZ2V0QWRkcmVzc2VzID0gKCk6IEJ1ZmZlcltdID0+XHJcbiAgICBPYmplY3QudmFsdWVzKHRoaXMua2V5cykubWFwKChrcCkgPT4ga3AuZ2V0QWRkcmVzcygpKVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIGFuIGFycmF5IG9mIGFkZHJlc3NlcyBzdG9yZWQgaW4gdGhlIFtbU3RhbmRhcmRLZXlDaGFpbl1dLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2Ygc3RyaW5nIHJlcHJlc2VudGF0aW9ucyBvZiB0aGUgYWRkcmVzc2VzXHJcbiAgICovXHJcbiAgZ2V0QWRkcmVzc1N0cmluZ3MgPSAoKTogc3RyaW5nW10gPT5cclxuICAgIE9iamVjdC52YWx1ZXModGhpcy5rZXlzKS5tYXAoKGtwKSA9PiBrcC5nZXRBZGRyZXNzU3RyaW5nKCkpXHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgdGhlIGtleSBwYWlyIHRvIHRoZSBsaXN0IG9mIHRoZSBrZXlzIG1hbmFnZWQgaW4gdGhlIFtbU3RhbmRhcmRLZXlDaGFpbl1dLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5ld0tleSBBIGtleSBwYWlyIG9mIHRoZSBhcHByb3ByaWF0ZSBjbGFzcyB0byBiZSBhZGRlZCB0byB0aGUgW1tTdGFuZGFyZEtleUNoYWluXV1cclxuICAgKi9cclxuICBhZGRLZXkobmV3S2V5OiBLUENsYXNzKSB7XHJcbiAgICB0aGlzLmtleXNbbmV3S2V5LmdldEFkZHJlc3MoKS50b1N0cmluZyhcImhleFwiKV0gPSBuZXdLZXlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgdGhlIGtleSBwYWlyIGZyb20gdGhlIGxpc3Qgb2YgdGhleSBrZXlzIG1hbmFnZWQgaW4gdGhlIFtbU3RhbmRhcmRLZXlDaGFpbl1dLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGtleSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBvclxyXG4gICAqIEtQQ2xhc3MgdG8gcmVtb3ZlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgYm9vbGVhbiB0cnVlIGlmIGEga2V5IHdhcyByZW1vdmVkLlxyXG4gICAqL1xyXG4gIHJlbW92ZUtleSA9IChrZXk6IEtQQ2xhc3MgfCBCdWZmZXIpID0+IHtcclxuICAgIGxldCBrYWRkcjogc3RyaW5nXHJcbiAgICBpZiAoa2V5IGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICAgIGthZGRyID0ga2V5LnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBrYWRkciA9IGtleS5nZXRBZGRyZXNzKCkudG9TdHJpbmcoXCJoZXhcIilcclxuICAgIH1cclxuICAgIGlmIChrYWRkciBpbiB0aGlzLmtleXMpIHtcclxuICAgICAgZGVsZXRlIHRoaXMua2V5c1tgJHtrYWRkcn1gXVxyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgaWYgdGhlcmUgaXMgYSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcm92aWRlZCBhZGRyZXNzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgdG8gY2hlY2sgZm9yIGV4aXN0ZW5jZSBpbiB0aGUga2V5cyBkYXRhYmFzZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLCBmYWxzZSBpZiBub3QgZm91bmRcclxuICAgKi9cclxuICBoYXNLZXkgPSAoYWRkcmVzczogQnVmZmVyKTogYm9vbGVhbiA9PiBhZGRyZXNzLnRvU3RyaW5nKFwiaGV4XCIpIGluIHRoaXMua2V5c1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBbW1N0YW5kYXJkS2V5UGFpcl1dIGxpc3RlZCB1bmRlciB0aGUgcHJvdmlkZWQgYWRkcmVzc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhZGRyZXNzIHRvXHJcbiAgICogcmV0cmlldmUgZnJvbSB0aGUga2V5cyBkYXRhYmFzZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSByZWZlcmVuY2UgdG8gdGhlIFtbU3RhbmRhcmRLZXlQYWlyXV0gaW4gdGhlIGtleXMgZGF0YWJhc2VcclxuICAgKi9cclxuICBnZXRLZXkgPSAoYWRkcmVzczogQnVmZmVyKTogS1BDbGFzcyA9PiB0aGlzLmtleXNbYWRkcmVzcy50b1N0cmluZyhcImhleFwiKV1cclxuXHJcbiAgYWJzdHJhY3QgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xyXG5cclxuICBhYnN0cmFjdCBjbG9uZSgpOiB0aGlzXHJcblxyXG4gIGFic3RyYWN0IHVuaW9uKGtjOiB0aGlzKTogdGhpc1xyXG59XHJcbiJdfQ==