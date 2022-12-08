"use strict";
/**
 * @packageDocumentation
 * @module Common-NBytes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBytes = void 0;
const bintools_1 = __importDefault(require("../utils/bintools"));
const serialization_1 = require("../utils/serialization");
const errors_1 = require("../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Abstract class that implements basic functionality for managing a
 * {@link https://github.com/feross/buffer|Buffer} of an exact length.
 *
 * Create a class that extends this one and override bsize to make it validate for exactly
 * the correct length.
 */
class NBytes extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "NBytes";
        this._typeID = undefined;
        /**
         * Returns the length of the {@link https://github.com/feross/buffer|Buffer}.
         *
         * @returns The exact length requirement of this class
         */
        this.getSize = () => this.bsize;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { bsize: serialization.encoder(this.bsize, encoding, "number", "decimalString", 4), bytes: serialization.encoder(this.bytes, encoding, "Buffer", "hex", this.bsize) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.bsize = serialization.decoder(fields["bsize"], encoding, "decimalString", "number", 4);
        this.bytes = serialization.decoder(fields["bytes"], encoding, "hex", "Buffer", this.bsize);
    }
    /**
     * Takes a base-58 encoded string, verifies its length, and stores it.
     *
     * @returns The size of the {@link https://github.com/feross/buffer|Buffer}
     */
    fromString(b58str) {
        try {
            this.fromBuffer(bintools.b58ToBuffer(b58str));
        }
        catch (e) {
            /* istanbul ignore next */
            const emsg = `Error - NBytes.fromString: ${e}`;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
        return this.bsize;
    }
    /**
     * Takes a [[Buffer]], verifies its length, and stores it.
     *
     * @returns The size of the {@link https://github.com/feross/buffer|Buffer}
     */
    fromBuffer(buff, offset = 0) {
        try {
            if (buff.length - offset < this.bsize) {
                /* istanbul ignore next */
                throw new errors_1.BufferSizeError("Error - NBytes.fromBuffer: not enough space available in buffer.");
            }
            this.bytes = bintools.copyFrom(buff, offset, offset + this.bsize);
        }
        catch (e) {
            /* istanbul ignore next */
            const emsg = `Error - NBytes.fromBuffer: ${e}`;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
        return offset + this.bsize;
    }
    /**
     * @returns A reference to the stored {@link https://github.com/feross/buffer|Buffer}
     */
    toBuffer() {
        return this.bytes;
    }
    /**
     * @returns A base-58 string of the stored {@link https://github.com/feross/buffer|Buffer}
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NBytes = NBytes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmJ5dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9uYnl0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBR0gsaUVBQXdDO0FBQ3hDLDBEQUkrQjtBQUMvQiw0Q0FBaUQ7QUFFakQ7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNILE1BQXNCLE1BQU8sU0FBUSw0QkFBWTtJQUFqRDs7UUFDWSxjQUFTLEdBQUcsUUFBUSxDQUFBO1FBQ3BCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUEyQzdCOzs7O1dBSUc7UUFDSCxZQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQTtJQTJENUIsQ0FBQztJQXpHQyxTQUFTLENBQUMsV0FBK0IsS0FBSztRQUM1QyxJQUFJLE1BQU0sR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlDLHVDQUNLLE1BQU0sS0FDVCxLQUFLLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FDMUIsSUFBSSxDQUFDLEtBQUssRUFDVixRQUFRLEVBQ1IsUUFBUSxFQUNSLGVBQWUsRUFDZixDQUFDLENBQ0YsRUFDRCxLQUFLLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FDMUIsSUFBSSxDQUFDLEtBQUssRUFDVixRQUFRLEVBQ1IsUUFBUSxFQUNSLEtBQUssRUFDTCxJQUFJLENBQUMsS0FBSyxDQUNYLElBQ0Y7SUFDSCxDQUFDO0lBQ0QsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDaEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUNmLFFBQVEsRUFDUixlQUFlLEVBQ2YsUUFBUSxFQUNSLENBQUMsQ0FDRixDQUFBO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsT0FBTyxDQUNoQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQ2YsUUFBUSxFQUNSLEtBQUssRUFDTCxRQUFRLEVBQ1IsSUFBSSxDQUFDLEtBQUssQ0FDWCxDQUFBO0lBQ0gsQ0FBQztJQVlEOzs7O09BSUc7SUFDSCxVQUFVLENBQUMsTUFBYztRQUN2QixJQUFJO1lBQ0YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7U0FDOUM7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLDBCQUEwQjtZQUMxQixNQUFNLElBQUksR0FBVyw4QkFBOEIsQ0FBQyxFQUFFLENBQUE7WUFDdEQsMEJBQTBCO1lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDdEI7UUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUE7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxVQUFVLENBQUMsSUFBWSxFQUFFLFNBQWlCLENBQUM7UUFDekMsSUFBSTtZQUNGLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDckMsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksd0JBQWUsQ0FDdkIsa0VBQWtFLENBQ25FLENBQUE7YUFDRjtZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7U0FDbEU7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLDBCQUEwQjtZQUMxQixNQUFNLElBQUksR0FBVyw4QkFBOEIsQ0FBQyxFQUFFLENBQUE7WUFDdEQsMEJBQTBCO1lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDdEI7UUFDRCxPQUFPLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO0lBQzVCLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUE7SUFDbkIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE9BQU8sUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtJQUM5QyxDQUFDO0NBSUY7QUE3R0Qsd0JBNkdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIENvbW1vbi1OQnl0ZXNcclxuICovXHJcblxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQge1xyXG4gIFNlcmlhbGl6YWJsZSxcclxuICBTZXJpYWxpemF0aW9uLFxyXG4gIFNlcmlhbGl6ZWRFbmNvZGluZ1xyXG59IGZyb20gXCIuLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgQnVmZmVyU2l6ZUVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQWJzdHJhY3QgY2xhc3MgdGhhdCBpbXBsZW1lbnRzIGJhc2ljIGZ1bmN0aW9uYWxpdHkgZm9yIG1hbmFnaW5nIGFcclxuICoge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgYW4gZXhhY3QgbGVuZ3RoLlxyXG4gKlxyXG4gKiBDcmVhdGUgYSBjbGFzcyB0aGF0IGV4dGVuZHMgdGhpcyBvbmUgYW5kIG92ZXJyaWRlIGJzaXplIHRvIG1ha2UgaXQgdmFsaWRhdGUgZm9yIGV4YWN0bHlcclxuICogdGhlIGNvcnJlY3QgbGVuZ3RoLlxyXG4gKi9cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5CeXRlcyBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkJ5dGVzXCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBic2l6ZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuYnNpemUsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJudW1iZXJcIixcclxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgICA0XHJcbiAgICAgICksXHJcbiAgICAgIGJ5dGVzOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5ieXRlcyxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiaGV4XCIsXHJcbiAgICAgICAgdGhpcy5ic2l6ZVxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuYnNpemUgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImJzaXplXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwibnVtYmVyXCIsXHJcbiAgICAgIDRcclxuICAgIClcclxuICAgIHRoaXMuYnl0ZXMgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImJ5dGVzXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJoZXhcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgdGhpcy5ic2l6ZVxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGJ5dGVzOiBCdWZmZXJcclxuICBwcm90ZWN0ZWQgYnNpemU6IG51bWJlclxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGV4YWN0IGxlbmd0aCByZXF1aXJlbWVudCBvZiB0aGlzIGNsYXNzXHJcbiAgICovXHJcbiAgZ2V0U2l6ZSA9ICgpID0+IHRoaXMuYnNpemVcclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSBiYXNlLTU4IGVuY29kZWQgc3RyaW5nLCB2ZXJpZmllcyBpdHMgbGVuZ3RoLCBhbmQgc3RvcmVzIGl0LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIHNpemUgb2YgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgZnJvbVN0cmluZyhiNThzdHI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLmZyb21CdWZmZXIoYmludG9vbHMuYjU4VG9CdWZmZXIoYjU4c3RyKSlcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgY29uc3QgZW1zZzogc3RyaW5nID0gYEVycm9yIC0gTkJ5dGVzLmZyb21TdHJpbmc6ICR7ZX1gXHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihlbXNnKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuYnNpemVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEgW1tCdWZmZXJdXSwgdmVyaWZpZXMgaXRzIGxlbmd0aCwgYW5kIHN0b3JlcyBpdC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBzaXplIG9mIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnVmZjogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKGJ1ZmYubGVuZ3RoIC0gb2Zmc2V0IDwgdGhpcy5ic2l6ZSkge1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgdGhyb3cgbmV3IEJ1ZmZlclNpemVFcnJvcihcclxuICAgICAgICAgIFwiRXJyb3IgLSBOQnl0ZXMuZnJvbUJ1ZmZlcjogbm90IGVub3VnaCBzcGFjZSBhdmFpbGFibGUgaW4gYnVmZmVyLlwiXHJcbiAgICAgICAgKVxyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmJ5dGVzID0gYmludG9vbHMuY29weUZyb20oYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyB0aGlzLmJzaXplKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICBjb25zdCBlbXNnOiBzdHJpbmcgPSBgRXJyb3IgLSBOQnl0ZXMuZnJvbUJ1ZmZlcjogJHtlfWBcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGVtc2cpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0ICsgdGhpcy5ic2l6ZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybnMgQSByZWZlcmVuY2UgdG8gdGhlIHN0b3JlZCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICByZXR1cm4gdGhpcy5ieXRlc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybnMgQSBiYXNlLTU4IHN0cmluZyBvZiB0aGUgc3RvcmVkIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXHJcbiAgfVxyXG5cclxuICBhYnN0cmFjdCBjbG9uZSgpOiB0aGlzXHJcbiAgYWJzdHJhY3QgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xyXG59XHJcbiJdfQ==