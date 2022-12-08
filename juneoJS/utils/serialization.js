"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serialization = exports.Serializable = exports.SERIALIZATIONVERSION = void 0;
/**
 * @packageDocumentation
 * @module Utils-Serialization
 */
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const xss_1 = __importDefault(require("xss"));
const helperfunctions_1 = require("./helperfunctions");
const errors_1 = require("../utils/errors");
exports.SERIALIZATIONVERSION = 0;
class Serializable {
    constructor() {
        this._typeName = undefined;
        this._typeID = undefined;
        this._codecID = undefined;
    }
    /**
     * Used in serialization. TypeName is a string name for the type of object being output.
     */
    getTypeName() {
        return this._typeName;
    }
    /**
     * Used in serialization. Optional. TypeID is a number for the typeID of object being output.
     */
    getTypeID() {
        return this._typeID;
    }
    /**
     * Used in serialization. Optional. TypeID is a number for the typeID of object being output.
     */
    getCodecID() {
        return this._codecID;
    }
    /**
     * Sanitize to prevent cross scripting attacks.
     */
    sanitizeObject(obj) {
        for (const k in obj) {
            if (typeof obj[`${k}`] === "object" && obj[`${k}`] !== null) {
                this.sanitizeObject(obj[`${k}`]);
            }
            else if (typeof obj[`${k}`] === "string") {
                obj[`${k}`] = (0, xss_1.default)(obj[`${k}`]);
            }
        }
        return obj;
    }
    //sometimes the parent class manages the fields
    //these are so you can say super.serialize(encoding)
    serialize(encoding) {
        return {
            _typeName: (0, xss_1.default)(this._typeName),
            _typeID: typeof this._typeID === "undefined" ? null : this._typeID,
            _codecID: typeof this._codecID === "undefined" ? null : this._codecID
        };
    }
    deserialize(fields, encoding) {
        fields = this.sanitizeObject(fields);
        if (typeof fields["_typeName"] !== "string") {
            throw new errors_1.TypeNameError("Error - Serializable.deserialize: _typeName must be a string, found: " +
                typeof fields["_typeName"]);
        }
        if (fields["_typeName"] !== this._typeName) {
            throw new errors_1.TypeNameError("Error - Serializable.deserialize: _typeName mismatch -- expected: " +
                this._typeName +
                " -- received: " +
                fields["_typeName"]);
        }
        if (typeof fields["_typeID"] !== "undefined" &&
            fields["_typeID"] !== null) {
            if (typeof fields["_typeID"] !== "number") {
                throw new errors_1.TypeIdError("Error - Serializable.deserialize: _typeID must be a number, found: " +
                    typeof fields["_typeID"]);
            }
            if (fields["_typeID"] !== this._typeID) {
                throw new errors_1.TypeIdError("Error - Serializable.deserialize: _typeID mismatch -- expected: " +
                    this._typeID +
                    " -- received: " +
                    fields["_typeID"]);
            }
        }
        if (typeof fields["_codecID"] !== "undefined" &&
            fields["_codecID"] !== null) {
            if (typeof fields["_codecID"] !== "number") {
                throw new errors_1.CodecIdError("Error - Serializable.deserialize: _codecID must be a number, found: " +
                    typeof fields["_codecID"]);
            }
            if (fields["_codecID"] !== this._codecID) {
                throw new errors_1.CodecIdError("Error - Serializable.deserialize: _codecID mismatch -- expected: " +
                    this._codecID +
                    " -- received: " +
                    fields["_codecID"]);
            }
        }
    }
}
exports.Serializable = Serializable;
class Serialization {
    constructor() {
        this.bintools = bintools_1.default.getInstance();
    }
    /**
     * Retrieves the Serialization singleton.
     */
    static getInstance() {
        if (!Serialization.instance) {
            Serialization.instance = new Serialization();
        }
        return Serialization.instance;
    }
    /**
     * Convert {@link https://github.com/feross/buffer|Buffer} to [[SerializedType]]
     *
     * @param vb {@link https://github.com/feross/buffer|Buffer}
     * @param type [[SerializedType]]
     * @param ...args remaining arguments
     * @returns type of [[SerializedType]]
     */
    bufferToType(vb, type, ...args) {
        if (type === "BN") {
            return new bn_js_1.default(vb.toString("hex"), "hex");
        }
        else if (type === "Buffer") {
            if (args.length == 1 && typeof args[0] === "number") {
                vb = buffer_1.Buffer.from(vb.toString("hex").padStart(args[0] * 2, "0"), "hex");
            }
            return vb;
        }
        else if (type === "bech32") {
            return this.bintools.addressToString(args[0], args[1], vb);
        }
        else if (type === "nodeID") {
            return (0, helperfunctions_1.bufferToNodeIDString)(vb);
        }
        else if (type === "privateKey") {
            return (0, helperfunctions_1.bufferToPrivateKeyString)(vb);
        }
        else if (type === "cb58") {
            return this.bintools.cb58Encode(vb);
        }
        else if (type === "base58") {
            return this.bintools.bufferToB58(vb);
        }
        else if (type === "base64") {
            return vb.toString("base64");
        }
        else if (type === "hex") {
            return vb.toString("hex");
        }
        else if (type === "decimalString") {
            return new bn_js_1.default(vb.toString("hex"), "hex").toString(10);
        }
        else if (type === "number") {
            return new bn_js_1.default(vb.toString("hex"), "hex").toNumber();
        }
        else if (type === "utf8") {
            return vb.toString("utf8");
        }
        return undefined;
    }
    /**
     * Convert [[SerializedType]] to {@link https://github.com/feross/buffer|Buffer}
     *
     * @param v type of [[SerializedType]]
     * @param type [[SerializedType]]
     * @param ...args remaining arguments
     * @returns {@link https://github.com/feross/buffer|Buffer}
     */
    typeToBuffer(v, type, ...args) {
        if (type === "BN") {
            let str = v.toString("hex");
            if (args.length == 1 && typeof args[0] === "number") {
                return buffer_1.Buffer.from(str.padStart(args[0] * 2, "0"), "hex");
            }
            return buffer_1.Buffer.from(str, "hex");
        }
        else if (type === "Buffer") {
            return v;
        }
        else if (type === "bech32") {
            return this.bintools.stringToAddress(v, ...args);
        }
        else if (type === "nodeID") {
            return (0, helperfunctions_1.NodeIDStringToBuffer)(v);
        }
        else if (type === "privateKey") {
            return (0, helperfunctions_1.privateKeyStringToBuffer)(v);
        }
        else if (type === "cb58") {
            return this.bintools.cb58Decode(v);
        }
        else if (type === "base58") {
            return this.bintools.b58ToBuffer(v);
        }
        else if (type === "base64") {
            return buffer_1.Buffer.from(v, "base64");
        }
        else if (type === "hex") {
            if (v.startsWith("0x")) {
                v = v.slice(2);
            }
            return buffer_1.Buffer.from(v, "hex");
        }
        else if (type === "decimalString") {
            let str = new bn_js_1.default(v, 10).toString("hex");
            if (args.length == 1 && typeof args[0] === "number") {
                return buffer_1.Buffer.from(str.padStart(args[0] * 2, "0"), "hex");
            }
            return buffer_1.Buffer.from(str, "hex");
        }
        else if (type === "number") {
            let str = new bn_js_1.default(v, 10).toString("hex");
            if (args.length == 1 && typeof args[0] === "number") {
                return buffer_1.Buffer.from(str.padStart(args[0] * 2, "0"), "hex");
            }
            return buffer_1.Buffer.from(str, "hex");
        }
        else if (type === "utf8") {
            if (args.length == 1 && typeof args[0] === "number") {
                let b = buffer_1.Buffer.alloc(args[0]);
                b.write(v);
                return b;
            }
            return buffer_1.Buffer.from(v, "utf8");
        }
        return undefined;
    }
    /**
     * Convert value to type of [[SerializedType]] or [[SerializedEncoding]]
     *
     * @param value
     * @param encoding [[SerializedEncoding]]
     * @param intype [[SerializedType]]
     * @param outtype [[SerializedType]]
     * @param ...args remaining arguments
     * @returns type of [[SerializedType]] or [[SerializedEncoding]]
     */
    encoder(value, encoding, intype, outtype, ...args) {
        if (typeof value === "undefined") {
            throw new errors_1.UnknownTypeError("Error - Serializable.encoder: value passed is undefined");
        }
        if (encoding !== "display") {
            outtype = encoding;
        }
        const vb = this.typeToBuffer(value, intype, ...args);
        return this.bufferToType(vb, outtype, ...args);
    }
    /**
     * Convert value to type of [[SerializedType]] or [[SerializedEncoding]]
     *
     * @param value
     * @param encoding [[SerializedEncoding]]
     * @param intype [[SerializedType]]
     * @param outtype [[SerializedType]]
     * @param ...args remaining arguments
     * @returns type of [[SerializedType]] or [[SerializedEncoding]]
     */
    decoder(value, encoding, intype, outtype, ...args) {
        if (typeof value === "undefined") {
            throw new errors_1.UnknownTypeError("Error - Serializable.decoder: value passed is undefined");
        }
        if (encoding !== "display") {
            intype = encoding;
        }
        const vb = this.typeToBuffer(value, intype, ...args);
        return this.bufferToType(vb, outtype, ...args);
    }
    serialize(serialize, vm, encoding = "display", notes = undefined) {
        if (typeof notes === "undefined") {
            notes = serialize.getTypeName();
        }
        return {
            vm,
            encoding,
            version: exports.SERIALIZATIONVERSION,
            notes,
            fields: serialize.serialize(encoding)
        };
    }
    deserialize(input, output) {
        output.deserialize(input.fields, input.encoding);
    }
}
exports.Serialization = Serialization;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9zZXJpYWxpemF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILGlFQUF3QztBQUN4QyxrREFBc0I7QUFDdEIsb0NBQWdDO0FBQ2hDLDhDQUFxQjtBQUNyQix1REFLMEI7QUFDMUIsNENBS3dCO0FBR1gsUUFBQSxvQkFBb0IsR0FBVyxDQUFDLENBQUE7QUF5QjdDLE1BQXNCLFlBQVk7SUFBbEM7UUFDWSxjQUFTLEdBQVcsU0FBUyxDQUFBO1FBQzdCLFlBQU8sR0FBVyxTQUFTLENBQUE7UUFDM0IsYUFBUSxHQUFXLFNBQVMsQ0FBQTtJQXFHeEMsQ0FBQztJQW5HQzs7T0FFRztJQUNILFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUE7SUFDdkIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxVQUFVO1FBQ1IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFBO0lBQ3RCLENBQUM7SUFFRDs7T0FFRztJQUNILGNBQWMsQ0FBQyxHQUFXO1FBQ3hCLEtBQUssTUFBTSxDQUFDLElBQUksR0FBRyxFQUFFO1lBQ25CLElBQUksT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDM0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7YUFDakM7aUJBQU0sSUFBSSxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUMxQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxH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Q2xCO1FBQ0QsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUE7UUFDNUQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsU0FBUyxDQUNQLFNBQXVCLEVBQ3ZCLEVBQVUsRUFDVixXQUErQixTQUFTLEVBQ3hDLFFBQWdCLFNBQVM7UUFFekIsSUFBSSxPQUFPLEtBQUssS0FBSyxXQUFXLEVBQUU7WUFDaEMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtTQUNoQztRQUNELE9BQU87WUFDTCxFQUFFO1lBQ0YsUUFBUTtZQUNSLE9BQU8sRUFBRSw0QkFBb0I7WUFDN0IsS0FBSztZQUNMLE1BQU0sRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztTQUN0QyxDQUFBO0lBQ0gsQ0FBQztJQUVELFdBQVcsQ0FBQyxLQUFpQixFQUFFLE1BQW9CO1FBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDbEQsQ0FBQztDQUNGO0FBbE1ELHNDQWtNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBVdGlscy1TZXJpYWxpemF0aW9uXHJcbiAqL1xyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IHhzcyBmcm9tIFwieHNzXCJcclxuaW1wb3J0IHtcclxuICBOb2RlSURTdHJpbmdUb0J1ZmZlcixcclxuICBwcml2YXRlS2V5U3RyaW5nVG9CdWZmZXIsXHJcbiAgYnVmZmVyVG9Ob2RlSURTdHJpbmcsXHJcbiAgYnVmZmVyVG9Qcml2YXRlS2V5U3RyaW5nXHJcbn0gZnJvbSBcIi4vaGVscGVyZnVuY3Rpb25zXCJcclxuaW1wb3J0IHtcclxuICBDb2RlY0lkRXJyb3IsXHJcbiAgVHlwZUlkRXJyb3IsXHJcbiAgVHlwZU5hbWVFcnJvcixcclxuICBVbmtub3duVHlwZUVycm9yXHJcbn0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXHJcbmltcG9ydCB7IFNlcmlhbGl6ZWQgfSBmcm9tIFwiLi4vY29tbW9uXCJcclxuXHJcbmV4cG9ydCBjb25zdCBTRVJJQUxJWkFUSU9OVkVSU0lPTjogbnVtYmVyID0gMFxyXG5leHBvcnQgdHlwZSBTZXJpYWxpemVkVHlwZSA9XHJcbiAgfCBcImhleFwiXHJcbiAgfCBcIkJOXCJcclxuICB8IFwiQnVmZmVyXCJcclxuICB8IFwiYmVjaDMyXCJcclxuICB8IFwibm9kZUlEXCJcclxuICB8IFwicHJpdmF0ZUtleVwiXHJcbiAgfCBcImNiNThcIlxyXG4gIHwgXCJiYXNlNThcIlxyXG4gIHwgXCJiYXNlNjRcIlxyXG4gIHwgXCJkZWNpbWFsU3RyaW5nXCJcclxuICB8IFwibnVtYmVyXCJcclxuICB8IFwidXRmOFwiXHJcblxyXG5leHBvcnQgdHlwZSBTZXJpYWxpemVkRW5jb2RpbmcgPVxyXG4gIHwgXCJoZXhcIlxyXG4gIHwgXCJjYjU4XCJcclxuICB8IFwiYmFzZTU4XCJcclxuICB8IFwiYmFzZTY0XCJcclxuICB8IFwiZGVjaW1hbFN0cmluZ1wiXHJcbiAgfCBcIm51bWJlclwiXHJcbiAgfCBcInV0ZjhcIlxyXG4gIHwgXCJkaXNwbGF5XCJcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWU6IHN0cmluZyA9IHVuZGVmaW5lZFxyXG4gIHByb3RlY3RlZCBfdHlwZUlEOiBudW1iZXIgPSB1bmRlZmluZWRcclxuICBwcm90ZWN0ZWQgX2NvZGVjSUQ6IG51bWJlciA9IHVuZGVmaW5lZFxyXG5cclxuICAvKipcclxuICAgKiBVc2VkIGluIHNlcmlhbGl6YXRpb24uIFR5cGVOYW1lIGlzIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG9iamVjdCBiZWluZyBvdXRwdXQuXHJcbiAgICovXHJcbiAgZ2V0VHlwZU5hbWUoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl90eXBlTmFtZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCBpbiBzZXJpYWxpemF0aW9uLiBPcHRpb25hbC4gVHlwZUlEIGlzIGEgbnVtYmVyIGZvciB0aGUgdHlwZUlEIG9mIG9iamVjdCBiZWluZyBvdXRwdXQuXHJcbiAgICovXHJcbiAgZ2V0VHlwZUlEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2VkIGluIHNlcmlhbGl6YXRpb24uIE9wdGlvbmFsLiBUeXBlSUQgaXMgYSBudW1iZXIgZm9yIHRoZSB0eXBlSUQgb2Ygb2JqZWN0IGJlaW5nIG91dHB1dC5cclxuICAgKi9cclxuICBnZXRDb2RlY0lEKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29kZWNJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2FuaXRpemUgdG8gcHJldmVudCBjcm9zcyBzY3JpcHRpbmcgYXR0YWNrcy5cclxuICAgKi9cclxuICBzYW5pdGl6ZU9iamVjdChvYmo6IG9iamVjdCk6IG9iamVjdCB7XHJcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqW2Ake2t9YF0gPT09IFwib2JqZWN0XCIgJiYgb2JqW2Ake2t9YF0gIT09IG51bGwpIHtcclxuICAgICAgICB0aGlzLnNhbml0aXplT2JqZWN0KG9ialtgJHtrfWBdKVxyXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmpbYCR7a31gXSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIG9ialtgJHtrfWBdID0geHNzKG9ialtgJHtrfWBdKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqXHJcbiAgfVxyXG5cclxuICAvL3NvbWV0aW1lcyB0aGUgcGFyZW50IGNsYXNzIG1hbmFnZXMgdGhlIGZpZWxkc1xyXG4gIC8vdGhlc2UgYXJlIHNvIHlvdSBjYW4gc2F5IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICBzZXJpYWxpemUoZW5jb2Rpbmc/OiBTZXJpYWxpemVkRW5jb2RpbmcpOiBvYmplY3Qge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgX3R5cGVOYW1lOiB4c3ModGhpcy5fdHlwZU5hbWUpLFxyXG4gICAgICBfdHlwZUlEOiB0eXBlb2YgdGhpcy5fdHlwZUlEID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IHRoaXMuX3R5cGVJRCxcclxuICAgICAgX2NvZGVjSUQ6IHR5cGVvZiB0aGlzLl9jb2RlY0lEID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IHRoaXMuX2NvZGVjSURcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nPzogU2VyaWFsaXplZEVuY29kaW5nKTogdm9pZCB7XHJcbiAgICBmaWVsZHMgPSB0aGlzLnNhbml0aXplT2JqZWN0KGZpZWxkcylcclxuICAgIGlmICh0eXBlb2YgZmllbGRzW1wiX3R5cGVOYW1lXCJdICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlTmFtZUVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBTZXJpYWxpemFibGUuZGVzZXJpYWxpemU6IF90eXBlTmFtZSBtdXN0IGJlIGEgc3RyaW5nLCBmb3VuZDogXCIgK1xyXG4gICAgICAgICAgdHlwZW9mIGZpZWxkc1tcIl90eXBlTmFtZVwiXVxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBpZiAoZmllbGRzW1wiX3R5cGVOYW1lXCJdICE9PSB0aGlzLl90eXBlTmFtZSkge1xyXG4gICAgICB0aHJvdyBuZXcgVHlwZU5hbWVFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gU2VyaWFsaXphYmxlLmRlc2VyaWFsaXplOiBfdHlwZU5hbWUgbWlzbWF0Y2ggLS0gZXhwZWN0ZWQ6IFwiICtcclxuICAgICAgICAgIHRoaXMuX3R5cGVOYW1lICtcclxuICAgICAgICAgIFwiIC0tIHJlY2VpdmVkOiBcIiArXHJcbiAgICAgICAgICBmaWVsZHNbXCJfdHlwZU5hbWVcIl1cclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgaWYgKFxyXG4gICAgICB0eXBlb2YgZmllbGRzW1wiX3R5cGVJRFwiXSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICBmaWVsZHNbXCJfdHlwZUlEXCJdICE9PSBudWxsXHJcbiAgICApIHtcclxuICAgICAgaWYgKHR5cGVvZiBmaWVsZHNbXCJfdHlwZUlEXCJdICE9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVJZEVycm9yKFxyXG4gICAgICAgICAgXCJFcnJvciAtIFNlcmlhbGl6YWJsZS5kZXNlcmlhbGl6ZTogX3R5cGVJRCBtdXN0IGJlIGEgbnVtYmVyLCBmb3VuZDogXCIgK1xyXG4gICAgICAgICAgICB0eXBlb2YgZmllbGRzW1wiX3R5cGVJRFwiXVxyXG4gICAgICAgIClcclxuICAgICAgfVxyXG4gICAgICBpZiAoZmllbGRzW1wiX3R5cGVJRFwiXSAhPT0gdGhpcy5fdHlwZUlEKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVJZEVycm9yKFxyXG4gICAgICAgICAgXCJFcnJvciAtIFNlcmlhbGl6YWJsZS5kZXNlcmlhbGl6ZTogX3R5cGVJRCBtaXNtYXRjaCAtLSBleHBlY3RlZDogXCIgK1xyXG4gICAgICAgICAgICB0aGlzLl90eXBlSUQgK1xyXG4gICAgICAgICAgICBcIiAtLSByZWNlaXZlZDogXCIgK1xyXG4gICAgICAgICAgICBmaWVsZHNbXCJfdHlwZUlEXCJdXHJcbiAgICAgICAgKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoXHJcbiAgICAgIHR5cGVvZiBmaWVsZHNbXCJfY29kZWNJRFwiXSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICBmaWVsZHNbXCJfY29kZWNJRFwiXSAhPT0gbnVsbFxyXG4gICAgKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgZmllbGRzW1wiX2NvZGVjSURcIl0gIT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxyXG4gICAgICAgICAgXCJFcnJvciAtIFNlcmlhbGl6YWJsZS5kZXNlcmlhbGl6ZTogX2NvZGVjSUQgbXVzdCBiZSBhIG51bWJlciwgZm91bmQ6IFwiICtcclxuICAgICAgICAgICAgdHlwZW9mIGZpZWxkc1tcIl9jb2RlY0lEXCJdXHJcbiAgICAgICAgKVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChmaWVsZHNbXCJfY29kZWNJRFwiXSAhPT0gdGhpcy5fY29kZWNJRCkge1xyXG4gICAgICAgIHRocm93IG5ldyBDb2RlY0lkRXJyb3IoXHJcbiAgICAgICAgICBcIkVycm9yIC0gU2VyaWFsaXphYmxlLmRlc2VyaWFsaXplOiBfY29kZWNJRCBtaXNtYXRjaCAtLSBleHBlY3RlZDogXCIgK1xyXG4gICAgICAgICAgICB0aGlzLl9jb2RlY0lEICtcclxuICAgICAgICAgICAgXCIgLS0gcmVjZWl2ZWQ6IFwiICtcclxuICAgICAgICAgICAgZmllbGRzW1wiX2NvZGVjSURcIl1cclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTZXJpYWxpemF0aW9uIHtcclxuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogU2VyaWFsaXphdGlvblxyXG5cclxuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5iaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuICB9XHJcbiAgcHJpdmF0ZSBiaW50b29sczogQmluVG9vbHNcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0cmlldmVzIHRoZSBTZXJpYWxpemF0aW9uIHNpbmdsZXRvbi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogU2VyaWFsaXphdGlvbiB7XHJcbiAgICBpZiAoIVNlcmlhbGl6YXRpb24uaW5zdGFuY2UpIHtcclxuICAgICAgU2VyaWFsaXphdGlvbi5pbnN0YW5jZSA9IG5ldyBTZXJpYWxpemF0aW9uKClcclxuICAgIH1cclxuICAgIHJldHVybiBTZXJpYWxpemF0aW9uLmluc3RhbmNlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIFtbU2VyaWFsaXplZFR5cGVdXVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHZiIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICogQHBhcmFtIHR5cGUgW1tTZXJpYWxpemVkVHlwZV1dXHJcbiAgICogQHBhcmFtIC4uLmFyZ3MgcmVtYWluaW5nIGFyZ3VtZW50c1xyXG4gICAqIEByZXR1cm5zIHR5cGUgb2YgW1tTZXJpYWxpemVkVHlwZV1dXHJcbiAgICovXHJcbiAgYnVmZmVyVG9UeXBlKHZiOiBCdWZmZXIsIHR5cGU6IFNlcmlhbGl6ZWRUeXBlLCAuLi5hcmdzOiBhbnlbXSk6IGFueSB7XHJcbiAgICBpZiAodHlwZSA9PT0gXCJCTlwiKSB7XHJcbiAgICAgIHJldHVybiBuZXcgQk4odmIudG9TdHJpbmcoXCJoZXhcIiksIFwiaGV4XCIpXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiQnVmZmVyXCIpIHtcclxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIGFyZ3NbMF0gPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICB2YiA9IEJ1ZmZlci5mcm9tKHZiLnRvU3RyaW5nKFwiaGV4XCIpLnBhZFN0YXJ0KGFyZ3NbMF0gKiAyLCBcIjBcIiksIFwiaGV4XCIpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHZiXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiYmVjaDMyXCIpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYmludG9vbHMuYWRkcmVzc1RvU3RyaW5nKGFyZ3NbMF0sIGFyZ3NbMV0sIHZiKVxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcIm5vZGVJRFwiKSB7XHJcbiAgICAgIHJldHVybiBidWZmZXJUb05vZGVJRFN0cmluZyh2YilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJwcml2YXRlS2V5XCIpIHtcclxuICAgICAgcmV0dXJuIGJ1ZmZlclRvUHJpdmF0ZUtleVN0cmluZyh2YilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJjYjU4XCIpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYmludG9vbHMuY2I1OEVuY29kZSh2YilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJiYXNlNThcIikge1xyXG4gICAgICByZXR1cm4gdGhpcy5iaW50b29scy5idWZmZXJUb0I1OCh2YilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJiYXNlNjRcIikge1xyXG4gICAgICByZXR1cm4gdmIudG9TdHJpbmcoXCJiYXNlNjRcIilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJoZXhcIikge1xyXG4gICAgICByZXR1cm4gdmIudG9TdHJpbmcoXCJoZXhcIilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJkZWNpbWFsU3RyaW5nXCIpIHtcclxuICAgICAgcmV0dXJuIG5ldyBCTih2Yi50b1N0cmluZyhcImhleFwiKSwgXCJoZXhcIikudG9TdHJpbmcoMTApXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgcmV0dXJuIG5ldyBCTih2Yi50b1N0cmluZyhcImhleFwiKSwgXCJoZXhcIikudG9OdW1iZXIoKVxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcInV0ZjhcIikge1xyXG4gICAgICByZXR1cm4gdmIudG9TdHJpbmcoXCJ1dGY4XCIpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IFtbU2VyaWFsaXplZFR5cGVdXSB0byB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHYgdHlwZSBvZiBbW1NlcmlhbGl6ZWRUeXBlXV1cclxuICAgKiBAcGFyYW0gdHlwZSBbW1NlcmlhbGl6ZWRUeXBlXV1cclxuICAgKiBAcGFyYW0gLi4uYXJncyByZW1haW5pbmcgYXJndW1lbnRzXHJcbiAgICogQHJldHVybnMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKi9cclxuICB0eXBlVG9CdWZmZXIodjogYW55LCB0eXBlOiBTZXJpYWxpemVkVHlwZSwgLi4uYXJnczogYW55W10pOiBCdWZmZXIge1xyXG4gICAgaWYgKHR5cGUgPT09IFwiQk5cIikge1xyXG4gICAgICBsZXQgc3RyOiBzdHJpbmcgPSAodiBhcyBCTikudG9TdHJpbmcoXCJoZXhcIilcclxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIGFyZ3NbMF0gPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oc3RyLnBhZFN0YXJ0KGFyZ3NbMF0gKiAyLCBcIjBcIiksIFwiaGV4XCIpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHN0ciwgXCJoZXhcIilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJCdWZmZXJcIikge1xyXG4gICAgICByZXR1cm4gdlxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcImJlY2gzMlwiKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyh2LCAuLi5hcmdzKVxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcIm5vZGVJRFwiKSB7XHJcbiAgICAgIHJldHVybiBOb2RlSURTdHJpbmdUb0J1ZmZlcih2KVxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcInByaXZhdGVLZXlcIikge1xyXG4gICAgICByZXR1cm4gcHJpdmF0ZUtleVN0cmluZ1RvQnVmZmVyKHYpXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiY2I1OFwiKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmJpbnRvb2xzLmNiNThEZWNvZGUodilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJiYXNlNThcIikge1xyXG4gICAgICByZXR1cm4gdGhpcy5iaW50b29scy5iNThUb0J1ZmZlcih2KVxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcImJhc2U2NFwiKSB7XHJcbiAgICAgIHJldHVybiBCdWZmZXIuZnJvbSh2IGFzIHN0cmluZywgXCJiYXNlNjRcIilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJoZXhcIikge1xyXG4gICAgICBpZiAoKHYgYXMgc3RyaW5nKS5zdGFydHNXaXRoKFwiMHhcIikpIHtcclxuICAgICAgICB2ID0gKHYgYXMgc3RyaW5nKS5zbGljZSgyKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBCdWZmZXIuZnJvbSh2IGFzIHN0cmluZywgXCJoZXhcIilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJkZWNpbWFsU3RyaW5nXCIpIHtcclxuICAgICAgbGV0IHN0cjogc3RyaW5nID0gbmV3IEJOKHYgYXMgc3RyaW5nLCAxMCkudG9TdHJpbmcoXCJoZXhcIilcclxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIGFyZ3NbMF0gPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oc3RyLnBhZFN0YXJ0KGFyZ3NbMF0gKiAyLCBcIjBcIiksIFwiaGV4XCIpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHN0ciwgXCJoZXhcIilcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICBsZXQgc3RyOiBzdHJpbmcgPSBuZXcgQk4odiwgMTApLnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIHR5cGVvZiBhcmdzWzBdID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHN0ci5wYWRTdGFydChhcmdzWzBdICogMiwgXCIwXCIpLCBcImhleFwiKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBCdWZmZXIuZnJvbShzdHIsIFwiaGV4XCIpXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwidXRmOFwiKSB7XHJcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIHR5cGVvZiBhcmdzWzBdID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgbGV0IGI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhhcmdzWzBdKVxyXG4gICAgICAgIGIud3JpdGUodilcclxuICAgICAgICByZXR1cm4gYlxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBCdWZmZXIuZnJvbSh2LCBcInV0ZjhcIilcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnQgdmFsdWUgdG8gdHlwZSBvZiBbW1NlcmlhbGl6ZWRUeXBlXV0gb3IgW1tTZXJpYWxpemVkRW5jb2RpbmddXVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHZhbHVlXHJcbiAgICogQHBhcmFtIGVuY29kaW5nIFtbU2VyaWFsaXplZEVuY29kaW5nXV1cclxuICAgKiBAcGFyYW0gaW50eXBlIFtbU2VyaWFsaXplZFR5cGVdXVxyXG4gICAqIEBwYXJhbSBvdXR0eXBlIFtbU2VyaWFsaXplZFR5cGVdXVxyXG4gICAqIEBwYXJhbSAuLi5hcmdzIHJlbWFpbmluZyBhcmd1bWVudHNcclxuICAgKiBAcmV0dXJucyB0eXBlIG9mIFtbU2VyaWFsaXplZFR5cGVdXSBvciBbW1NlcmlhbGl6ZWRFbmNvZGluZ11dXHJcbiAgICovXHJcbiAgZW5jb2RlcihcclxuICAgIHZhbHVlOiBhbnksXHJcbiAgICBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nLFxyXG4gICAgaW50eXBlOiBTZXJpYWxpemVkVHlwZSxcclxuICAgIG91dHR5cGU6IFNlcmlhbGl6ZWRUeXBlLFxyXG4gICAgLi4uYXJnczogYW55W11cclxuICApOiBhbnkge1xyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aHJvdyBuZXcgVW5rbm93blR5cGVFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gU2VyaWFsaXphYmxlLmVuY29kZXI6IHZhbHVlIHBhc3NlZCBpcyB1bmRlZmluZWRcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBpZiAoZW5jb2RpbmcgIT09IFwiZGlzcGxheVwiKSB7XHJcbiAgICAgIG91dHR5cGUgPSBlbmNvZGluZ1xyXG4gICAgfVxyXG4gICAgY29uc3QgdmI6IEJ1ZmZlciA9IHRoaXMudHlwZVRvQnVmZmVyKHZhbHVlLCBpbnR5cGUsIC4uLmFyZ3MpXHJcbiAgICByZXR1cm4gdGhpcy5idWZmZXJUb1R5cGUodmIsIG91dHR5cGUsIC4uLmFyZ3MpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IHZhbHVlIHRvIHR5cGUgb2YgW1tTZXJpYWxpemVkVHlwZV1dIG9yIFtbU2VyaWFsaXplZEVuY29kaW5nXV1cclxuICAgKlxyXG4gICAqIEBwYXJhbSB2YWx1ZVxyXG4gICAqIEBwYXJhbSBlbmNvZGluZyBbW1NlcmlhbGl6ZWRFbmNvZGluZ11dXHJcbiAgICogQHBhcmFtIGludHlwZSBbW1NlcmlhbGl6ZWRUeXBlXV1cclxuICAgKiBAcGFyYW0gb3V0dHlwZSBbW1NlcmlhbGl6ZWRUeXBlXV1cclxuICAgKiBAcGFyYW0gLi4uYXJncyByZW1haW5pbmcgYXJndW1lbnRzXHJcbiAgICogQHJldHVybnMgdHlwZSBvZiBbW1NlcmlhbGl6ZWRUeXBlXV0gb3IgW1tTZXJpYWxpemVkRW5jb2RpbmddXVxyXG4gICAqL1xyXG4gIGRlY29kZXIoXHJcbiAgICB2YWx1ZTogc3RyaW5nLFxyXG4gICAgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyxcclxuICAgIGludHlwZTogU2VyaWFsaXplZFR5cGUsXHJcbiAgICBvdXR0eXBlOiBTZXJpYWxpemVkVHlwZSxcclxuICAgIC4uLmFyZ3M6IGFueVtdXHJcbiAgKTogYW55IHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhyb3cgbmV3IFVua25vd25UeXBlRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIFNlcmlhbGl6YWJsZS5kZWNvZGVyOiB2YWx1ZSBwYXNzZWQgaXMgdW5kZWZpbmVkXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgaWYgKGVuY29kaW5nICE9PSBcImRpc3BsYXlcIikge1xyXG4gICAgICBpbnR5cGUgPSBlbmNvZGluZ1xyXG4gICAgfVxyXG4gICAgY29uc3QgdmI6IEJ1ZmZlciA9IHRoaXMudHlwZVRvQnVmZmVyKHZhbHVlLCBpbnR5cGUsIC4uLmFyZ3MpXHJcbiAgICByZXR1cm4gdGhpcy5idWZmZXJUb1R5cGUodmIsIG91dHR5cGUsIC4uLmFyZ3MpXHJcbiAgfVxyXG5cclxuICBzZXJpYWxpemUoXHJcbiAgICBzZXJpYWxpemU6IFNlcmlhbGl6YWJsZSxcclxuICAgIHZtOiBzdHJpbmcsXHJcbiAgICBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJkaXNwbGF5XCIsXHJcbiAgICBub3Rlczogc3RyaW5nID0gdW5kZWZpbmVkXHJcbiAgKTogU2VyaWFsaXplZCB7XHJcbiAgICBpZiAodHlwZW9mIG5vdGVzID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIG5vdGVzID0gc2VyaWFsaXplLmdldFR5cGVOYW1lKClcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHZtLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgdmVyc2lvbjogU0VSSUFMSVpBVElPTlZFUlNJT04sXHJcbiAgICAgIG5vdGVzLFxyXG4gICAgICBmaWVsZHM6IHNlcmlhbGl6ZS5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkZXNlcmlhbGl6ZShpbnB1dDogU2VyaWFsaXplZCwgb3V0cHV0OiBTZXJpYWxpemFibGUpIHtcclxuICAgIG91dHB1dC5kZXNlcmlhbGl6ZShpbnB1dC5maWVsZHMsIGlucHV0LmVuY29kaW5nKVxyXG4gIH1cclxufVxyXG4iXX0=