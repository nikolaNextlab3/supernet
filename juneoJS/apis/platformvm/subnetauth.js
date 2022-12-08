"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubnetAuth = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-SubnetAuth
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utils_1 = require("../../utils");
const _1 = require(".");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
class SubnetAuth extends utils_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "SubnetAuth";
        this._typeID = _1.PlatformVMConstants.SUBNETAUTH;
        this.addressIndices = [];
        this.numAddressIndices = buffer_1.Buffer.alloc(4);
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign({}, fields);
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
    }
    /**
     * Add an address index for Subnet Auth signing
     *
     * @param index the Buffer of the address index to add
     */
    addAddressIndex(index) {
        const numAddrIndices = this.getNumAddressIndices();
        this.numAddressIndices.writeUIntBE(numAddrIndices + 1, 0, 4);
        this.addressIndices.push(index);
    }
    /**
     * Returns the number of address indices as a number
     */
    getNumAddressIndices() {
        return this.numAddressIndices.readUIntBE(0, 4);
    }
    /**
     * Returns an array of AddressIndices as Buffers
     */
    getAddressIndices() {
        return this.addressIndices;
    }
    fromBuffer(bytes, offset = 0) {
        // increase offset for type id
        offset += 4;
        this.numAddressIndices = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        for (let i = 0; i < this.getNumAddressIndices(); i++) {
            this.addressIndices.push(bintools.copyFrom(bytes, offset, offset + 4));
            offset += 4;
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[SubnetAuth]].
     */
    toBuffer() {
        const typeIDBuf = buffer_1.Buffer.alloc(4);
        typeIDBuf.writeUIntBE(this._typeID, 0, 4);
        const numAddressIndices = buffer_1.Buffer.alloc(4);
        numAddressIndices.writeIntBE(this.addressIndices.length, 0, 4);
        const barr = [typeIDBuf, numAddressIndices];
        let bsize = typeIDBuf.length + numAddressIndices.length;
        this.addressIndices.forEach((addressIndex, i) => {
            bsize += 4;
            barr.push(this.addressIndices[`${i}`]);
        });
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.SubnetAuth = SubnetAuth;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VibmV0YXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vc3VibmV0YXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLHVDQUE4RDtBQUM5RCx3QkFBdUM7QUFFdkM7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWpELE1BQWEsVUFBVyxTQUFRLG9CQUFZO0lBQTVDOztRQUNZLGNBQVMsR0FBRyxZQUFZLENBQUE7UUFDeEIsWUFBTyxHQUFHLHNCQUFtQixDQUFDLFVBQVUsQ0FBQTtRQXFDeEMsbUJBQWMsR0FBYSxFQUFFLENBQUE7UUFDN0Isc0JBQWlCLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQThCdkQsQ0FBQztJQWxFQyxTQUFTLENBQUMsV0FBK0IsS0FBSztRQUM1QyxJQUFJLE1BQU0sR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlDLHlCQUNLLE1BQU0sRUFDVjtJQUNILENBQUM7SUFDRCxXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDckMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxlQUFlLENBQUMsS0FBYTtRQUMzQixNQUFNLGNBQWMsR0FBVyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQTtRQUMxRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLGNBQWMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzVELElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFFRDs7T0FFRztJQUNILG9CQUFvQjtRQUNsQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRDs7T0FFRztJQUNILGlCQUFpQjtRQUNmLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQTtJQUM1QixDQUFDO0lBS0QsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLDhCQUE4QjtRQUM5QixNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDckUsTUFBTSxJQUFJLENBQUMsQ0FBQTtRQUNYLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM1RCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDdEUsTUFBTSxJQUFJLENBQUMsQ0FBQTtTQUNaO1FBQ0QsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sTUFBTSxTQUFTLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN6QyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3pDLE1BQU0saUJBQWlCLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNqRCxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzlELE1BQU0sSUFBSSxHQUFhLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUE7UUFDckQsSUFBSSxLQUFLLEdBQVcsU0FBUyxDQUFDLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUE7UUFDL0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxZQUFvQixFQUFFLENBQVMsRUFBUSxFQUFFO1lBQ3BFLEtBQUssSUFBSSxDQUFDLENBQUE7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDeEMsQ0FBQyxDQUFDLENBQUE7UUFDRixPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25DLENBQUM7Q0FDRjtBQXRFRCxnQ0FzRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tU3VibmV0QXV0aFxyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHsgU2VyaWFsaXphYmxlLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIlxyXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi5cIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJuZXRBdXRoIGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdWJuZXRBdXRoXCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuU1VCTkVUQVVUSFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhbiBhZGRyZXNzIGluZGV4IGZvciBTdWJuZXQgQXV0aCBzaWduaW5nXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaW5kZXggdGhlIEJ1ZmZlciBvZiB0aGUgYWRkcmVzcyBpbmRleCB0byBhZGRcclxuICAgKi9cclxuICBhZGRBZGRyZXNzSW5kZXgoaW5kZXg6IEJ1ZmZlcik6IHZvaWQge1xyXG4gICAgY29uc3QgbnVtQWRkckluZGljZXM6IG51bWJlciA9IHRoaXMuZ2V0TnVtQWRkcmVzc0luZGljZXMoKVxyXG4gICAgdGhpcy5udW1BZGRyZXNzSW5kaWNlcy53cml0ZVVJbnRCRShudW1BZGRySW5kaWNlcyArIDEsIDAsIDQpXHJcbiAgICB0aGlzLmFkZHJlc3NJbmRpY2VzLnB1c2goaW5kZXgpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYWRkcmVzcyBpbmRpY2VzIGFzIGEgbnVtYmVyXHJcbiAgICovXHJcbiAgZ2V0TnVtQWRkcmVzc0luZGljZXMoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLm51bUFkZHJlc3NJbmRpY2VzLnJlYWRVSW50QkUoMCwgNClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgQWRkcmVzc0luZGljZXMgYXMgQnVmZmVyc1xyXG4gICAqL1xyXG4gIGdldEFkZHJlc3NJbmRpY2VzKCk6IEJ1ZmZlcltdIHtcclxuICAgIHJldHVybiB0aGlzLmFkZHJlc3NJbmRpY2VzXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgYWRkcmVzc0luZGljZXM6IEJ1ZmZlcltdID0gW11cclxuICBwcm90ZWN0ZWQgbnVtQWRkcmVzc0luZGljZXM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG5cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICAvLyBpbmNyZWFzZSBvZmZzZXQgZm9yIHR5cGUgaWRcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLm51bUFkZHJlc3NJbmRpY2VzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5nZXROdW1BZGRyZXNzSW5kaWNlcygpOyBpKyspIHtcclxuICAgICAgdGhpcy5hZGRyZXNzSW5kaWNlcy5wdXNoKGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpKVxyXG4gICAgICBvZmZzZXQgKz0gNFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1N1Ym5ldEF1dGhdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgdHlwZUlEQnVmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIHR5cGVJREJ1Zi53cml0ZVVJbnRCRSh0aGlzLl90eXBlSUQsIDAsIDQpXHJcbiAgICBjb25zdCBudW1BZGRyZXNzSW5kaWNlczogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBudW1BZGRyZXNzSW5kaWNlcy53cml0ZUludEJFKHRoaXMuYWRkcmVzc0luZGljZXMubGVuZ3RoLCAwLCA0KVxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdHlwZUlEQnVmLCBudW1BZGRyZXNzSW5kaWNlc11cclxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdHlwZUlEQnVmLmxlbmd0aCArIG51bUFkZHJlc3NJbmRpY2VzLmxlbmd0aFxyXG4gICAgdGhpcy5hZGRyZXNzSW5kaWNlcy5mb3JFYWNoKChhZGRyZXNzSW5kZXg6IEJ1ZmZlciwgaTogbnVtYmVyKTogdm9pZCA9PiB7XHJcbiAgICAgIGJzaXplICs9IDRcclxuICAgICAgYmFyci5wdXNoKHRoaXMuYWRkcmVzc0luZGljZXNbYCR7aX1gXSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcclxuICB9XHJcbn1cclxuIl19