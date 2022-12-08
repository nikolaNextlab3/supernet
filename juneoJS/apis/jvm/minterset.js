"use strict";
/**
 * @packageDocumentation
 * @module API-JVM-MinterSet
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinterSet = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const decimalString = "decimalString";
const cb58 = "cb58";
const num = "number";
const buffer = "Buffer";
/**
 * Class for representing a threshold and set of minting addresses in Juneo.
 *
 * @typeparam MinterSet including a threshold and array of addresses
 */
class MinterSet extends serialization_1.Serializable {
    /**
     *
     * @param threshold The number of signatures required to mint more of an asset by signing a minting transaction
     * @param minters Array of addresss which are authorized to sign a minting transaction
     */
    constructor(threshold = 1, minters = []) {
        super();
        this._typeName = "MinterSet";
        this._typeID = undefined;
        this.minters = [];
        /**
         * Returns the threshold.
         */
        this.getThreshold = () => {
            return this.threshold;
        };
        /**
         * Returns the minters.
         */
        this.getMinters = () => {
            return this.minters;
        };
        this._cleanAddresses = (addresses) => {
            let addrs = [];
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[`${i}`] === "string") {
                    addrs.push(bintools.stringToAddress(addresses[`${i}`]));
                }
                else if (addresses[`${i}`] instanceof buffer_1.Buffer) {
                    addrs.push(addresses[`${i}`]);
                }
            }
            return addrs;
        };
        this.threshold = threshold;
        this.minters = this._cleanAddresses(minters);
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { threshold: serialization.encoder(this.threshold, encoding, num, decimalString, 4), minters: this.minters.map((m) => serialization.encoder(m, encoding, buffer, cb58, 20)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.threshold = serialization.decoder(fields["threshold"], encoding, decimalString, num, 4);
        this.minters = fields["minters"].map((m) => serialization.decoder(m, encoding, cb58, buffer, 20));
    }
}
exports.MinterSet = MinterSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWludGVyc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvanZtL21pbnRlcnNldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7QUFFSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDZEQUtrQztBQUVsQzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDaEUsTUFBTSxhQUFhLEdBQW1CLGVBQWUsQ0FBQTtBQUNyRCxNQUFNLElBQUksR0FBbUIsTUFBTSxDQUFBO0FBQ25DLE1BQU0sR0FBRyxHQUFtQixRQUFRLENBQUE7QUFDcEMsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUV2Qzs7OztHQUlHO0FBQ0gsTUFBYSxTQUFVLFNBQVEsNEJBQVk7SUErRHpDOzs7O09BSUc7SUFDSCxZQUFZLFlBQW9CLENBQUMsRUFBRSxVQUErQixFQUFFO1FBQ2xFLEtBQUssRUFBRSxDQUFBO1FBcEVDLGNBQVMsR0FBRyxXQUFXLENBQUE7UUFDdkIsWUFBTyxHQUFHLFNBQVMsQ0FBQTtRQWlDbkIsWUFBTyxHQUFhLEVBQUUsQ0FBQTtRQUVoQzs7V0FFRztRQUNILGlCQUFZLEdBQUcsR0FBVyxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQTtRQUN2QixDQUFDLENBQUE7UUFFRDs7V0FFRztRQUNILGVBQVUsR0FBRyxHQUFhLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFBO1FBQ3JCLENBQUMsQ0FBQTtRQUVTLG9CQUFlLEdBQUcsQ0FBQyxTQUE4QixFQUFZLEVBQUU7WUFDdkUsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFBO1lBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNqRCxJQUFJLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxRQUFRLEVBQUU7b0JBQ3pDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDLENBQUMsQ0FBQTtpQkFDbEU7cUJBQU0sSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLGVBQU0sRUFBRTtvQkFDOUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDLENBQUE7aUJBQ3hDO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUMsQ0FBQTtRQVNDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM5QyxDQUFDO0lBcEVELFNBQVMsQ0FBQyxXQUErQixLQUFLO1FBQzVDLE1BQU0sTUFBTSxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDaEQsdUNBQ0ssTUFBTSxLQUNULFNBQVMsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUM5QixJQUFJLENBQUMsU0FBUyxFQUNkLFFBQVEsRUFDUixHQUFHLEVBQ0gsYUFBYSxFQUNiLENBQUMsQ0FDRixFQUNELE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQzlCLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUNyRCxJQUNGO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDbkIsUUFBUSxFQUNSLGFBQWEsRUFDYixHQUFHLEVBQ0gsQ0FBQyxDQUNGLENBQUE7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUNqRCxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FDckQsQ0FBQTtJQUNILENBQUM7Q0F5Q0Y7QUF6RUQsOEJBeUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1KVk0tTWludGVyU2V0XHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHtcclxuICBTZXJpYWxpemFibGUsXHJcbiAgU2VyaWFsaXphdGlvbixcclxuICBTZXJpYWxpemVkRW5jb2RpbmcsXHJcbiAgU2VyaWFsaXplZFR5cGVcclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcclxuY29uc3QgY2I1ODogU2VyaWFsaXplZFR5cGUgPSBcImNiNThcIlxyXG5jb25zdCBudW06IFNlcmlhbGl6ZWRUeXBlID0gXCJudW1iZXJcIlxyXG5jb25zdCBidWZmZXI6IFNlcmlhbGl6ZWRUeXBlID0gXCJCdWZmZXJcIlxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSB0aHJlc2hvbGQgYW5kIHNldCBvZiBtaW50aW5nIGFkZHJlc3NlcyBpbiBKdW5lby5cclxuICpcclxuICogQHR5cGVwYXJhbSBNaW50ZXJTZXQgaW5jbHVkaW5nIGEgdGhyZXNob2xkIGFuZCBhcnJheSBvZiBhZGRyZXNzZXNcclxuICovXHJcbmV4cG9ydCBjbGFzcyBNaW50ZXJTZXQgZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk1pbnRlclNldFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICB0aHJlc2hvbGQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICB0aGlzLnRocmVzaG9sZCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBudW0sXHJcbiAgICAgICAgZGVjaW1hbFN0cmluZyxcclxuICAgICAgICA0XHJcbiAgICAgICksXHJcbiAgICAgIG1pbnRlcnM6IHRoaXMubWludGVycy5tYXAoKG0pID0+XHJcbiAgICAgICAgc2VyaWFsaXphdGlvbi5lbmNvZGVyKG0sIGVuY29kaW5nLCBidWZmZXIsIGNiNTgsIDIwKVxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMudGhyZXNob2xkID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJ0aHJlc2hvbGRcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBkZWNpbWFsU3RyaW5nLFxyXG4gICAgICBudW0sXHJcbiAgICAgIDRcclxuICAgIClcclxuICAgIHRoaXMubWludGVycyA9IGZpZWxkc1tcIm1pbnRlcnNcIl0ubWFwKChtOiBzdHJpbmcpID0+XHJcbiAgICAgIHNlcmlhbGl6YXRpb24uZGVjb2RlcihtLCBlbmNvZGluZywgY2I1OCwgYnVmZmVyLCAyMClcclxuICAgIClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCB0aHJlc2hvbGQ6IG51bWJlclxyXG4gIHByb3RlY3RlZCBtaW50ZXJzOiBCdWZmZXJbXSA9IFtdXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHRocmVzaG9sZC5cclxuICAgKi9cclxuICBnZXRUaHJlc2hvbGQgPSAoKTogbnVtYmVyID0+IHtcclxuICAgIHJldHVybiB0aGlzLnRocmVzaG9sZFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbWludGVycy5cclxuICAgKi9cclxuICBnZXRNaW50ZXJzID0gKCk6IEJ1ZmZlcltdID0+IHtcclxuICAgIHJldHVybiB0aGlzLm1pbnRlcnNcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBfY2xlYW5BZGRyZXNzZXMgPSAoYWRkcmVzc2VzOiBzdHJpbmdbXSB8IEJ1ZmZlcltdKTogQnVmZmVyW10gPT4ge1xyXG4gICAgbGV0IGFkZHJzOiBCdWZmZXJbXSA9IFtdXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzW2Ake2l9YF0gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICBhZGRycy5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpKVxyXG4gICAgICB9IGVsc2UgaWYgKGFkZHJlc3Nlc1tgJHtpfWBdIGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzZXNbYCR7aX1gXSBhcyBCdWZmZXIpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhZGRyc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBtaW50IG1vcmUgb2YgYW4gYXNzZXQgYnkgc2lnbmluZyBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cclxuICAgKiBAcGFyYW0gbWludGVycyBBcnJheSBvZiBhZGRyZXNzcyB3aGljaCBhcmUgYXV0aG9yaXplZCB0byBzaWduIGEgbWludGluZyB0cmFuc2FjdGlvblxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHRocmVzaG9sZDogbnVtYmVyID0gMSwgbWludGVyczogc3RyaW5nW10gfCBCdWZmZXJbXSA9IFtdKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICB0aGlzLnRocmVzaG9sZCA9IHRocmVzaG9sZFxyXG4gICAgdGhpcy5taW50ZXJzID0gdGhpcy5fY2xlYW5BZGRyZXNzZXMobWludGVycylcclxuICB9XHJcbn1cclxuIl19