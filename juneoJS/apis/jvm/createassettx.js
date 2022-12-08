"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAssetTx = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-CreateAssetTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const initialstates_1 = require("./initialstates");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const utf8 = "utf8";
const decimalString = "decimalString";
const buffer = "Buffer";
class CreateAssetTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Create Asset transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 JUNE = 10^9 $nJUNE
     * @param initialState Optional [[InitialStates]] that represent the intial state of a created asset
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, name = undefined, symbol = undefined, denomination = undefined, initialState = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "CreateAssetTx";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.JVMConstants.CREATEASSETTX
            : constants_1.JVMConstants.CREATEASSETTX_CODECONE;
        this.name = "";
        this.symbol = "";
        this.denomination = buffer_1.Buffer.alloc(1);
        this.initialState = new initialstates_1.InitialStates();
        if (typeof name === "string" &&
            typeof symbol === "string" &&
            typeof denomination === "number" &&
            denomination >= 0 &&
            denomination <= 32 &&
            typeof initialState !== "undefined") {
            this.initialState = initialState;
            this.name = name;
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { name: serialization.encoder(this.name, encoding, utf8, utf8), symbol: serialization.encoder(this.symbol, encoding, utf8, utf8), denomination: serialization.encoder(this.denomination, encoding, buffer, decimalString, 1), initialState: this.initialState.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.name = serialization.decoder(fields["name"], encoding, utf8, utf8);
        this.symbol = serialization.decoder(fields["symbol"], encoding, utf8, utf8);
        this.denomination = serialization.decoder(fields["denomination"], encoding, decimalString, buffer, 1);
        this.initialState = new initialstates_1.InitialStates();
        this.initialState.deserialize(fields["initialState"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - CreateAssetTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.JVMConstants.CREATEASSETTX
                : constants_1.JVMConstants.CREATEASSETTX_CODECONE;
    }
    /**
     * Returns the id of the [[CreateAssetTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns the array of array of [[Output]]s for the initial state
     */
    getInitialStates() {
        return this.initialState;
    }
    /**
     * Returns the string representation of the name
     */
    getName() {
        return this.name;
    }
    /**
     * Returns the string representation of the symbol
     */
    getSymbol() {
        return this.symbol;
    }
    /**
     * Returns the numeric representation of the denomination
     */
    getDenomination() {
        return this.denomination.readUInt8(0);
    }
    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
     */
    getDenominationBuffer() {
        return this.denomination;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
     *
     * @returns The length of the raw [[CreateAssetTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        const namesize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.name = bintools
            .copyFrom(bytes, offset, offset + namesize)
            .toString("utf8");
        offset += namesize;
        const symsize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.symbol = bintools
            .copyFrom(bytes, offset, offset + symsize)
            .toString("utf8");
        offset += symsize;
        this.denomination = bintools.copyFrom(bytes, offset, offset + 1);
        offset += 1;
        const inits = new initialstates_1.InitialStates();
        offset = inits.fromBuffer(bytes, offset);
        this.initialState = inits;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const initstatebuff = this.initialState.toBuffer();
        const namebuff = buffer_1.Buffer.alloc(this.name.length);
        namebuff.write(this.name, 0, this.name.length, utf8);
        const namesize = buffer_1.Buffer.alloc(2);
        namesize.writeUInt16BE(this.name.length, 0);
        const symbuff = buffer_1.Buffer.alloc(this.symbol.length);
        symbuff.write(this.symbol, 0, this.symbol.length, utf8);
        const symsize = buffer_1.Buffer.alloc(2);
        symsize.writeUInt16BE(this.symbol.length, 0);
        const bsize = superbuff.length +
            namesize.length +
            namebuff.length +
            symsize.length +
            symbuff.length +
            this.denomination.length +
            initstatebuff.length;
        const barr = [
            superbuff,
            namesize,
            namebuff,
            symsize,
            symbuff,
            this.denomination,
            initstatebuff
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        let newbase = new CreateAssetTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new CreateAssetTx(...args);
    }
}
exports.CreateAssetTx = CreateAssetTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlYXNzZXR0eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2p2bS9jcmVhdGVhc3NldHR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQTBDO0FBRzFDLG1EQUErQztBQUMvQyxxQ0FBaUM7QUFDakMscURBQXdEO0FBQ3hELDZEQUlrQztBQUNsQywrQ0FBaUQ7QUFFakQ7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2hFLE1BQU0sSUFBSSxHQUFtQixNQUFNLENBQUE7QUFDbkMsTUFBTSxhQUFhLEdBQW1CLGVBQWUsQ0FBQTtBQUNyRCxNQUFNLE1BQU0sR0FBbUIsUUFBUSxDQUFBO0FBRXZDLE1BQWEsYUFBYyxTQUFRLGVBQU07SUFnTXZDOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILFlBQ0UsWUFBb0IsNEJBQWdCLEVBQ3BDLGVBQXVCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMzQyxPQUE2QixTQUFTLEVBQ3RDLE1BQTJCLFNBQVMsRUFDcEMsT0FBZSxTQUFTLEVBQ3hCLE9BQWUsU0FBUyxFQUN4QixTQUFpQixTQUFTLEVBQzFCLGVBQXVCLFNBQVMsRUFDaEMsZUFBOEIsU0FBUztRQUV2QyxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBdk52QyxjQUFTLEdBQUcsZUFBZSxDQUFBO1FBQzNCLGFBQVEsR0FBRyx3QkFBWSxDQUFDLFdBQVcsQ0FBQTtRQUNuQyxZQUFPLEdBQ2YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyx3QkFBWSxDQUFDLGFBQWE7WUFDNUIsQ0FBQyxDQUFDLHdCQUFZLENBQUMsc0JBQXNCLENBQUE7UUFpQy9CLFNBQUksR0FBVyxFQUFFLENBQUE7UUFDakIsV0FBTSxHQUFXLEVBQUUsQ0FBQTtRQUNuQixpQkFBWSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDdEMsaUJBQVksR0FBa0IsSUFBSSw2QkFBYSxFQUFFLENBQUE7UUErS3pELElBQ0UsT0FBTyxJQUFJLEtBQUssUUFBUTtZQUN4QixPQUFPLE1BQU0sS0FBSyxRQUFRO1lBQzFCLE9BQU8sWUFBWSxLQUFLLFFBQVE7WUFDaEMsWUFBWSxJQUFJLENBQUM7WUFDakIsWUFBWSxJQUFJLEVBQUU7WUFDbEIsT0FBTyxZQUFZLEtBQUssV0FBVyxFQUNuQztZQUNBLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBO1lBQ2hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUM5QztJQUNILENBQUM7SUE5TkQsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsTUFBTSxNQUFNLEdBQVcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNoRCx1Q0FDSyxNQUFNLEtBQ1QsSUFBSSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUM1RCxNQUFNLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQ2hFLFlBQVksRUFBRSxhQUFhLENBQUMsT0FBTyxDQUNqQyxJQUFJLENBQUMsWUFBWSxFQUNqQixRQUFRLEVBQ1IsTUFBTSxFQUNOLGFBQWEsRUFDYixDQUFDLENBQ0YsRUFDRCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQ3BEO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDdkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQzNFLElBQUksQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUN0QixRQUFRLEVBQ1IsYUFBYSxFQUNiLE1BQU0sRUFDTixDQUFDLENBQ0YsQ0FBQTtRQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUE7UUFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ2pFLENBQUM7SUFPRDs7OztPQUlHO0lBQ0gsVUFBVSxDQUFDLE9BQWU7UUFDeEIsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLE9BQU8sS0FBSyxDQUFDLEVBQUU7WUFDbEMsMEJBQTBCO1lBQzFCLE1BQU0sSUFBSSxxQkFBWSxDQUNwQixnRkFBZ0YsQ0FDakYsQ0FBQTtTQUNGO1FBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDdkIsSUFBSSxDQUFDLE9BQU87WUFDVixJQUFJLENBQUMsUUFBUSxLQUFLLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyx3QkFBWSxDQUFDLGFBQWE7Z0JBQzVCLENBQUMsQ0FBQyx3QkFBWSxDQUFDLHNCQUFzQixDQUFBO0lBQzNDLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVM7UUFDUCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUE7SUFDckIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsZ0JBQWdCO1FBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFBO0lBQzFCLENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxlQUFlO1FBQ2IsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUN2QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxxQkFBcUI7UUFDbkIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFBO0lBQzFCLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILFVBQVUsQ0FBQyxLQUFhLEVBQUUsU0FBaUIsQ0FBQztRQUMxQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFFeEMsTUFBTSxRQUFRLEdBQVcsUUFBUTthQUM5QixRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO2FBQ25DLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsQixNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRO2FBQ2pCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxRQUFRLENBQUM7YUFDMUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ25CLE1BQU0sSUFBSSxRQUFRLENBQUE7UUFFbEIsTUFBTSxPQUFPLEdBQVcsUUFBUTthQUM3QixRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO2FBQ25DLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsQixNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRO2FBQ25CLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxPQUFPLENBQUM7YUFDekMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ25CLE1BQU0sSUFBSSxPQUFPLENBQUE7UUFFakIsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ2hFLE1BQU0sSUFBSSxDQUFDLENBQUE7UUFFWCxNQUFNLEtBQUssR0FBa0IsSUFBSSw2QkFBYSxFQUFFLENBQUE7UUFDaEQsTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3hDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFBO1FBRXpCLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE1BQU0sU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUMxQyxNQUFNLGFBQWEsR0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBRTFELE1BQU0sUUFBUSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RCxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BELE1BQU0sUUFBUSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDeEMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUUzQyxNQUFNLE9BQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDeEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUN2RCxNQUFNLE9BQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFFNUMsTUFBTSxLQUFLLEdBQ1QsU0FBUyxDQUFDLE1BQU07WUFDaEIsUUFBUSxDQUFDLE1BQU07WUFDZixRQUFRLENBQUMsTUFBTTtZQUNmLE9BQU8sQ0FBQyxNQUFNO1lBQ2QsT0FBTyxDQUFDLE1BQU07WUFDZCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU07WUFDeEIsYUFBYSxDQUFDLE1BQU0sQ0FBQTtRQUN0QixNQUFNLElBQUksR0FBYTtZQUNyQixTQUFTO1lBQ1QsUUFBUTtZQUNSLFFBQVE7WUFDUixPQUFPO1lBQ1AsT0FBTztZQUNQLElBQUksQ0FBQyxZQUFZO1lBQ2pCLGFBQWE7U0FDZCxDQUFBO1FBQ0QsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRUQsS0FBSztRQUNILElBQUksT0FBTyxHQUFrQixJQUFJLGFBQWEsRUFBRSxDQUFBO1FBQ2hELE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDbkMsT0FBTyxPQUFlLENBQUE7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBUyxDQUFBO0lBQzNDLENBQUM7Q0F5Q0Y7QUF2T0Qsc0NBdU9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1KVk0tQ3JlYXRlQXNzZXRUeFxyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHsgSlZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXHJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcclxuaW1wb3J0IHsgSW5pdGlhbFN0YXRlcyB9IGZyb20gXCIuL2luaXRpYWxzdGF0ZXNcIlxyXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxyXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgU2VyaWFsaXphdGlvbixcclxuICBTZXJpYWxpemVkRW5jb2RpbmcsXHJcbiAgU2VyaWFsaXplZFR5cGVcclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcbmltcG9ydCB7IENvZGVjSWRFcnJvciB9IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCB1dGY4OiBTZXJpYWxpemVkVHlwZSA9IFwidXRmOFwiXHJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcclxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBDcmVhdGVBc3NldFR4IGV4dGVuZHMgQmFzZVR4IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJDcmVhdGVBc3NldFR4XCJcclxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBKVk1Db25zdGFudHMuTEFURVNUQ09ERUNcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XHJcbiAgICB0aGlzLl9jb2RlY0lEID09PSAwXHJcbiAgICAgID8gSlZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFhcclxuICAgICAgOiBKVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWF9DT0RFQ09ORVxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgY29uc3QgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIG5hbWU6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLm5hbWUsIGVuY29kaW5nLCB1dGY4LCB1dGY4KSxcclxuICAgICAgc3ltYm9sOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5zeW1ib2wsIGVuY29kaW5nLCB1dGY4LCB1dGY4KSxcclxuICAgICAgZGVub21pbmF0aW9uOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5kZW5vbWluYXRpb24sXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgIGRlY2ltYWxTdHJpbmcsXHJcbiAgICAgICAgMVxyXG4gICAgICApLFxyXG4gICAgICBpbml0aWFsU3RhdGU6IHRoaXMuaW5pdGlhbFN0YXRlLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5uYW1lID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKGZpZWxkc1tcIm5hbWVcIl0sIGVuY29kaW5nLCB1dGY4LCB1dGY4KVxyXG4gICAgdGhpcy5zeW1ib2wgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoZmllbGRzW1wic3ltYm9sXCJdLCBlbmNvZGluZywgdXRmOCwgdXRmOClcclxuICAgIHRoaXMuZGVub21pbmF0aW9uID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJkZW5vbWluYXRpb25cIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBkZWNpbWFsU3RyaW5nLFxyXG4gICAgICBidWZmZXIsXHJcbiAgICAgIDFcclxuICAgIClcclxuICAgIHRoaXMuaW5pdGlhbFN0YXRlID0gbmV3IEluaXRpYWxTdGF0ZXMoKVxyXG4gICAgdGhpcy5pbml0aWFsU3RhdGUuZGVzZXJpYWxpemUoZmllbGRzW1wiaW5pdGlhbFN0YXRlXCJdLCBlbmNvZGluZylcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmcgPSBcIlwiXHJcbiAgcHJvdGVjdGVkIHN5bWJvbDogc3RyaW5nID0gXCJcIlxyXG4gIHByb3RlY3RlZCBkZW5vbWluYXRpb246IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxKVxyXG4gIHByb3RlY3RlZCBpbml0aWFsU3RhdGU6IEluaXRpYWxTdGF0ZXMgPSBuZXcgSW5pdGlhbFN0YXRlcygpXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY29kZWNJRFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XHJcbiAgICovXHJcbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IENvZGVjSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gQ3JlYXRlQXNzZXRUeC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXHJcbiAgICB0aGlzLl90eXBlSUQgPVxyXG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXHJcbiAgICAgICAgPyBKVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWFxyXG4gICAgICAgIDogSlZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFhfQ09ERUNPTkVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0NyZWF0ZUFzc2V0VHhdXVxyXG4gICAqL1xyXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgYXJyYXkgb2YgW1tPdXRwdXRdXXMgZm9yIHRoZSBpbml0aWFsIHN0YXRlXHJcbiAgICovXHJcbiAgZ2V0SW5pdGlhbFN0YXRlcygpOiBJbml0aWFsU3RhdGVzIHtcclxuICAgIHJldHVybiB0aGlzLmluaXRpYWxTdGF0ZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBuYW1lXHJcbiAgICovXHJcbiAgZ2V0TmFtZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMubmFtZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzeW1ib2xcclxuICAgKi9cclxuICBnZXRTeW1ib2woKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLnN5bWJvbFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbnVtZXJpYyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGVub21pbmF0aW9uXHJcbiAgICovXHJcbiAgZ2V0RGVub21pbmF0aW9uKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5kZW5vbWluYXRpb24ucmVhZFVJbnQ4KDApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGVub21pbmF0aW9uXHJcbiAgICovXHJcbiAgZ2V0RGVub21pbmF0aW9uQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICByZXR1cm4gdGhpcy5kZW5vbWluYXRpb25cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0NyZWF0ZUFzc2V0VHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW0NyZWF0ZUFzc2V0VHhdXSBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tDcmVhdGVBc3NldFR4XV1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0NyZWF0ZUFzc2V0VHhdXVxyXG4gICAqXHJcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuXHJcbiAgICBjb25zdCBuYW1lc2l6ZTogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIpXHJcbiAgICAgIC5yZWFkVUludDE2QkUoMClcclxuICAgIG9mZnNldCArPSAyXHJcbiAgICB0aGlzLm5hbWUgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgbmFtZXNpemUpXHJcbiAgICAgIC50b1N0cmluZyhcInV0ZjhcIilcclxuICAgIG9mZnNldCArPSBuYW1lc2l6ZVxyXG5cclxuICAgIGNvbnN0IHN5bXNpemU6IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKVxyXG4gICAgICAucmVhZFVJbnQxNkJFKDApXHJcbiAgICBvZmZzZXQgKz0gMlxyXG4gICAgdGhpcy5zeW1ib2wgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgc3ltc2l6ZSlcclxuICAgICAgLnRvU3RyaW5nKFwidXRmOFwiKVxyXG4gICAgb2Zmc2V0ICs9IHN5bXNpemVcclxuXHJcbiAgICB0aGlzLmRlbm9taW5hdGlvbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDEpXHJcbiAgICBvZmZzZXQgKz0gMVxyXG5cclxuICAgIGNvbnN0IGluaXRzOiBJbml0aWFsU3RhdGVzID0gbmV3IEluaXRpYWxTdGF0ZXMoKVxyXG4gICAgb2Zmc2V0ID0gaW5pdHMuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgdGhpcy5pbml0aWFsU3RhdGUgPSBpbml0c1xyXG5cclxuICAgIHJldHVybiBvZmZzZXRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tDcmVhdGVBc3NldFR4XV0uXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxyXG4gICAgY29uc3QgaW5pdHN0YXRlYnVmZjogQnVmZmVyID0gdGhpcy5pbml0aWFsU3RhdGUudG9CdWZmZXIoKVxyXG5cclxuICAgIGNvbnN0IG5hbWVidWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5uYW1lLmxlbmd0aClcclxuICAgIG5hbWVidWZmLndyaXRlKHRoaXMubmFtZSwgMCwgdGhpcy5uYW1lLmxlbmd0aCwgdXRmOClcclxuICAgIGNvbnN0IG5hbWVzaXplOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMilcclxuICAgIG5hbWVzaXplLndyaXRlVUludDE2QkUodGhpcy5uYW1lLmxlbmd0aCwgMClcclxuXHJcbiAgICBjb25zdCBzeW1idWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5zeW1ib2wubGVuZ3RoKVxyXG4gICAgc3ltYnVmZi53cml0ZSh0aGlzLnN5bWJvbCwgMCwgdGhpcy5zeW1ib2wubGVuZ3RoLCB1dGY4KVxyXG4gICAgY29uc3Qgc3ltc2l6ZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXHJcbiAgICBzeW1zaXplLndyaXRlVUludDE2QkUodGhpcy5zeW1ib2wubGVuZ3RoLCAwKVxyXG5cclxuICAgIGNvbnN0IGJzaXplOiBudW1iZXIgPVxyXG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICtcclxuICAgICAgbmFtZXNpemUubGVuZ3RoICtcclxuICAgICAgbmFtZWJ1ZmYubGVuZ3RoICtcclxuICAgICAgc3ltc2l6ZS5sZW5ndGggK1xyXG4gICAgICBzeW1idWZmLmxlbmd0aCArXHJcbiAgICAgIHRoaXMuZGVub21pbmF0aW9uLmxlbmd0aCArXHJcbiAgICAgIGluaXRzdGF0ZWJ1ZmYubGVuZ3RoXHJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtcclxuICAgICAgc3VwZXJidWZmLFxyXG4gICAgICBuYW1lc2l6ZSxcclxuICAgICAgbmFtZWJ1ZmYsXHJcbiAgICAgIHN5bXNpemUsXHJcbiAgICAgIHN5bWJ1ZmYsXHJcbiAgICAgIHRoaXMuZGVub21pbmF0aW9uLFxyXG4gICAgICBpbml0c3RhdGVidWZmXHJcbiAgICBdXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgbGV0IG5ld2Jhc2U6IENyZWF0ZUFzc2V0VHggPSBuZXcgQ3JlYXRlQXNzZXRUeCgpXHJcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IENyZWF0ZUFzc2V0VHgoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIENyZWF0ZSBBc3NldCB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXHJcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXHJcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxyXG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XHJcbiAgICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBhc3NldFxyXG4gICAqIEBwYXJhbSBkZW5vbWluYXRpb24gT3B0aW9uYWwgbnVtYmVyIGZvciB0aGUgZGVub21pbmF0aW9uIHdoaWNoIGlzIDEwXkQuIEQgbXVzdCBiZSA+PSAwIGFuZCA8PSAzMi4gRXg6ICQxIEpVTkUgPSAxMF45ICRuSlVORVxyXG4gICAqIEBwYXJhbSBpbml0aWFsU3RhdGUgT3B0aW9uYWwgW1tJbml0aWFsU3RhdGVzXV0gdGhhdCByZXByZXNlbnQgdGhlIGludGlhbCBzdGF0ZSBvZiBhIGNyZWF0ZWQgYXNzZXRcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXHJcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG5hbWU6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIHN5bWJvbDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgZGVub21pbmF0aW9uOiBudW1iZXIgPSB1bmRlZmluZWQsXHJcbiAgICBpbml0aWFsU3RhdGU6IEluaXRpYWxTdGF0ZXMgPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXHJcbiAgICBpZiAoXHJcbiAgICAgIHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiICYmXHJcbiAgICAgIHR5cGVvZiBzeW1ib2wgPT09IFwic3RyaW5nXCIgJiZcclxuICAgICAgdHlwZW9mIGRlbm9taW5hdGlvbiA9PT0gXCJudW1iZXJcIiAmJlxyXG4gICAgICBkZW5vbWluYXRpb24gPj0gMCAmJlxyXG4gICAgICBkZW5vbWluYXRpb24gPD0gMzIgJiZcclxuICAgICAgdHlwZW9mIGluaXRpYWxTdGF0ZSAhPT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuaW5pdGlhbFN0YXRlID0gaW5pdGlhbFN0YXRlXHJcbiAgICAgIHRoaXMubmFtZSA9IG5hbWVcclxuICAgICAgdGhpcy5zeW1ib2wgPSBzeW1ib2xcclxuICAgICAgdGhpcy5kZW5vbWluYXRpb24ud3JpdGVVSW50OChkZW5vbWluYXRpb24sIDApXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==