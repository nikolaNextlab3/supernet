"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credential = exports.Signature = exports.SigIdx = void 0;
/**
 * @packageDocumentation
 * @module Common-Signature
 */
const nbytes_1 = require("./nbytes");
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
class SigIdx extends nbytes_1.NBytes {
    /**
     * Type representing a [[Signature]] index used in [[Input]]
     */
    constructor() {
        super();
        this._typeName = "SigIdx";
        this._typeID = undefined;
        this.source = buffer_1.Buffer.alloc(20);
        this.bytes = buffer_1.Buffer.alloc(4);
        this.bsize = 4;
        /**
         * Sets the source address for the signature
         */
        this.setSource = (address) => {
            this.source = address;
        };
        /**
         * Retrieves the source address for the signature
         */
        this.getSource = () => this.source;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { source: serialization.encoder(this.source, encoding, "Buffer", "hex") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.source = serialization.decoder(fields["source"], encoding, "hex", "Buffer");
    }
    clone() {
        let newbase = new SigIdx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new SigIdx();
    }
}
exports.SigIdx = SigIdx;
/**
 * Signature for a [[Tx]]
 */
class Signature extends nbytes_1.NBytes {
    /**
     * Signature for a [[Tx]]
     */
    constructor() {
        super();
        this._typeName = "Signature";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(65);
        this.bsize = 65;
    }
    clone() {
        let newbase = new Signature();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new Signature();
    }
}
exports.Signature = Signature;
class Credential extends serialization_1.Serializable {
    constructor(sigarray = undefined) {
        super();
        this._typeName = "Credential";
        this._typeID = undefined;
        this.sigArray = [];
        /**
         * Adds a signature to the credentials and returns the index off the added signature.
         */
        this.addSignature = (sig) => {
            this.sigArray.push(sig);
            return this.sigArray.length - 1;
        };
        if (typeof sigarray !== "undefined") {
            /* istanbul ignore next */
            this.sigArray = sigarray;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sigArray: this.sigArray.map((s) => s.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigArray = fields["sigArray"].map((s) => {
            let sig = new Signature();
            sig.deserialize(s, encoding);
            return sig;
        });
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) { }
    fromBuffer(bytes, offset = 0) {
        const siglen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.sigArray = [];
        for (let i = 0; i < siglen; i++) {
            const sig = new Signature();
            offset = sig.fromBuffer(bytes, offset);
            this.sigArray.push(sig);
        }
        return offset;
    }
    toBuffer() {
        const siglen = buffer_1.Buffer.alloc(4);
        siglen.writeInt32BE(this.sigArray.length, 0);
        const barr = [siglen];
        let bsize = siglen.length;
        for (let i = 0; i < this.sigArray.length; i++) {
            const sigbuff = this.sigArray[`${i}`].toBuffer();
            bsize += sigbuff.length;
            barr.push(sigbuff);
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.Credential = Credential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2NyZWRlbnRpYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILHFDQUFpQztBQUNqQyxvQ0FBZ0M7QUFDaEMsaUVBQXdDO0FBQ3hDLDBEQUkrQjtBQUUvQjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNO0lBK0NoQzs7T0FFRztJQUNIO1FBQ0UsS0FBSyxFQUFFLENBQUE7UUFsREMsY0FBUyxHQUFHLFFBQVEsQ0FBQTtRQUNwQixZQUFPLEdBQUcsU0FBUyxDQUFBO1FBbUJuQixXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNqQyxVQUFLLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN2QixVQUFLLEdBQUcsQ0FBQyxDQUFBO1FBRW5COztXQUVHO1FBQ0gsY0FBUyxHQUFHLENBQUMsT0FBZSxFQUFFLEVBQUU7WUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUE7UUFDdkIsQ0FBQyxDQUFBO1FBRUQ7O1dBRUc7UUFDSCxjQUFTLEdBQUcsR0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQWlCckMsQ0FBQztJQWhERCxTQUFTLENBQUMsV0FBK0IsS0FBSztRQUM1QyxJQUFJLE1BQU0sR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlDLHVDQUNLLE1BQU0sS0FDVCxNQUFNLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVB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QVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDeEQsS0FBSyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUE7WUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtTQUNuQjtRQUNELE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDbkMsQ0FBQztDQVlGO0FBNUVELGdDQTRFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBDb21tb24tU2lnbmF0dXJlXHJcbiAqL1xyXG5pbXBvcnQgeyBOQnl0ZXMgfSBmcm9tIFwiLi9uYnl0ZXNcIlxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQge1xyXG4gIFNlcmlhbGl6YWJsZSxcclxuICBTZXJpYWxpemF0aW9uLFxyXG4gIFNlcmlhbGl6ZWRFbmNvZGluZ1xyXG59IGZyb20gXCIuLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuXHJcbi8qKlxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBUeXBlIHJlcHJlc2VudGluZyBhIFtbU2lnbmF0dXJlXV0gaW5kZXggdXNlZCBpbiBbW0lucHV0XV1cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTaWdJZHggZXh0ZW5kcyBOQnl0ZXMge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNpZ0lkeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgc291cmNlOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5zb3VyY2UsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImhleFwiKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLnNvdXJjZSA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wic291cmNlXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJoZXhcIixcclxuICAgICAgXCJCdWZmZXJcIlxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHNvdXJjZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIwKVxyXG4gIHByb3RlY3RlZCBieXRlcyA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gIHByb3RlY3RlZCBic2l6ZSA9IDRcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc291cmNlIGFkZHJlc3MgZm9yIHRoZSBzaWduYXR1cmVcclxuICAgKi9cclxuICBzZXRTb3VyY2UgPSAoYWRkcmVzczogQnVmZmVyKSA9PiB7XHJcbiAgICB0aGlzLnNvdXJjZSA9IGFkZHJlc3NcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHJpZXZlcyB0aGUgc291cmNlIGFkZHJlc3MgZm9yIHRoZSBzaWduYXR1cmVcclxuICAgKi9cclxuICBnZXRTb3VyY2UgPSAoKTogQnVmZmVyID0+IHRoaXMuc291cmNlXHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgbGV0IG5ld2Jhc2U6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxyXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIG5ldyBTaWdJZHgoKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUeXBlIHJlcHJlc2VudGluZyBhIFtbU2lnbmF0dXJlXV0gaW5kZXggdXNlZCBpbiBbW0lucHV0XV1cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKClcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTaWduYXR1cmUgZm9yIGEgW1tUeF1dXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlIGV4dGVuZHMgTkJ5dGVzIHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTaWduYXR1cmVcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcclxuXHJcbiAgcHJvdGVjdGVkIGJ5dGVzID0gQnVmZmVyLmFsbG9jKDY1KVxyXG4gIHByb3RlY3RlZCBic2l6ZSA9IDY1XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgbGV0IG5ld2Jhc2U6IFNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKVxyXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIG5ldyBTaWduYXR1cmUoKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaWduYXR1cmUgZm9yIGEgW1tUeF1dXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ3JlZGVudGlhbCBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQ3JlZGVudGlhbFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgc2lnQXJyYXk6IHRoaXMuc2lnQXJyYXkubWFwKChzKSA9PiBzLnNlcmlhbGl6ZShlbmNvZGluZykpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuc2lnQXJyYXkgPSBmaWVsZHNbXCJzaWdBcnJheVwiXS5tYXAoKHM6IG9iamVjdCkgPT4ge1xyXG4gICAgICBsZXQgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcclxuICAgICAgc2lnLmRlc2VyaWFsaXplKHMsIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gc2lnXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHNpZ0FycmF5OiBTaWduYXR1cmVbXSA9IFtdXHJcblxyXG4gIGFic3RyYWN0IGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXJcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBjb2RlY0lEXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcclxuICAgKi9cclxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge31cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHNpZ25hdHVyZSB0byB0aGUgY3JlZGVudGlhbHMgYW5kIHJldHVybnMgdGhlIGluZGV4IG9mZiB0aGUgYWRkZWQgc2lnbmF0dXJlLlxyXG4gICAqL1xyXG4gIGFkZFNpZ25hdHVyZSA9IChzaWc6IFNpZ25hdHVyZSk6IG51bWJlciA9PiB7XHJcbiAgICB0aGlzLnNpZ0FycmF5LnB1c2goc2lnKVxyXG4gICAgcmV0dXJuIHRoaXMuc2lnQXJyYXkubGVuZ3RoIC0gMVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgY29uc3Qgc2lnbGVuOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMuc2lnQXJyYXkgPSBbXVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNpZ2xlbjsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHNpZzogU2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpXHJcbiAgICAgIG9mZnNldCA9IHNpZy5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICAgIHRoaXMuc2lnQXJyYXkucHVzaChzaWcpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgc2lnbGVuOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIHNpZ2xlbi53cml0ZUludDMyQkUodGhpcy5zaWdBcnJheS5sZW5ndGgsIDApXHJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzaWdsZW5dXHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHNpZ2xlbi5sZW5ndGhcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLnNpZ0FycmF5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHNpZ2J1ZmY6IEJ1ZmZlciA9IHRoaXMuc2lnQXJyYXlbYCR7aX1gXS50b0J1ZmZlcigpXHJcbiAgICAgIGJzaXplICs9IHNpZ2J1ZmYubGVuZ3RoXHJcbiAgICAgIGJhcnIucHVzaChzaWdidWZmKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICBhYnN0cmFjdCBjbG9uZSgpOiB0aGlzXHJcbiAgYWJzdHJhY3QgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xyXG4gIGFic3RyYWN0IHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IENyZWRlbnRpYWxcclxuICBjb25zdHJ1Y3RvcihzaWdhcnJheTogU2lnbmF0dXJlW10gPSB1bmRlZmluZWQpIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmICh0eXBlb2Ygc2lnYXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhpcy5zaWdBcnJheSA9IHNpZ2FycmF5XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==