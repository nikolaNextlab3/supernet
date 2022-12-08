"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenesisAsset = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-GenesisAsset
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const initialstates_1 = require("./initialstates");
const constants_1 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const createassettx_1 = require("./createassettx");
const bn_js_1 = __importDefault(require("bn.js"));
/**
 * @ignore
 */
const serialization = serialization_1.Serialization.getInstance();
const bintools = bintools_1.default.getInstance();
const utf8 = "utf8";
const buffer = "Buffer";
const decimalString = "decimalString";
class GenesisAsset extends createassettx_1.CreateAssetTx {
    /**
     * Class representing a GenesisAsset
     *
     * @param assetAlias Optional String for the asset alias
     * @param name Optional String for the descriptive name of the asset
     * @param symbol Optional String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 JUNE = 10^9 $nJUNE
     * @param initialState Optional [[InitialStates]] that represent the intial state of a created asset
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(assetAlias = undefined, name = undefined, symbol = undefined, denomination = undefined, initialState = undefined, memo = undefined) {
        super(constants_1.DefaultNetworkID, buffer_1.Buffer.alloc(32), [], [], memo);
        this._typeName = "GenesisAsset";
        this._codecID = undefined;
        this._typeID = undefined;
        this.assetAlias = "";
        /**
         * Returns the string representation of the assetAlias
         */
        this.getAssetAlias = () => this.assetAlias;
        if (typeof assetAlias === "string" &&
            typeof name === "string" &&
            typeof symbol === "string" &&
            typeof denomination === "number" &&
            denomination >= 0 &&
            denomination <= 32 &&
            typeof initialState !== "undefined") {
            this.assetAlias = assetAlias;
            this.name = name;
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
            this.initialState = initialState;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        delete fields["blockchainID"];
        delete fields["outs"];
        delete fields["ins"];
        return Object.assign(Object.assign({}, fields), { assetAlias: serialization.encoder(this.assetAlias, encoding, utf8, utf8), name: serialization.encoder(this.name, encoding, utf8, utf8), symbol: serialization.encoder(this.symbol, encoding, utf8, utf8), denomination: serialization.encoder(this.denomination, encoding, buffer, decimalString, 1), initialState: this.initialState.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        fields["blockchainID"] = buffer_1.Buffer.alloc(32, 16).toString("hex");
        fields["outs"] = [];
        fields["ins"] = [];
        super.deserialize(fields, encoding);
        this.assetAlias = serialization.decoder(fields["assetAlias"], encoding, utf8, utf8);
        this.name = serialization.decoder(fields["name"], encoding, utf8, utf8);
        this.symbol = serialization.decoder(fields["symbol"], encoding, utf8, utf8);
        this.denomination = serialization.decoder(fields["denomination"], encoding, decimalString, buffer, 1);
        this.initialState = new initialstates_1.InitialStates();
        this.initialState.deserialize(fields["initialState"], encoding);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[GenesisAsset]], parses it, populates the class, and returns the length of the [[GenesisAsset]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[GenesisAsset]]
     *
     * @returns The length of the raw [[GenesisAsset]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        const assetAliasSize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.assetAlias = bintools
            .copyFrom(bytes, offset, offset + assetAliasSize)
            .toString("utf8");
        offset += assetAliasSize;
        offset += super.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisAsset]].
     */
    toBuffer(networkID = constants_1.DefaultNetworkID) {
        // asset alias
        const assetAlias = this.getAssetAlias();
        const assetAliasbuffSize = buffer_1.Buffer.alloc(2);
        assetAliasbuffSize.writeUInt16BE(assetAlias.length, 0);
        let bsize = assetAliasbuffSize.length;
        let barr = [assetAliasbuffSize];
        const assetAliasbuff = buffer_1.Buffer.alloc(assetAlias.length);
        assetAliasbuff.write(assetAlias, 0, assetAlias.length, utf8);
        bsize += assetAliasbuff.length;
        barr.push(assetAliasbuff);
        const networkIDBuff = buffer_1.Buffer.alloc(4);
        networkIDBuff.writeUInt32BE(new bn_js_1.default(networkID).toNumber(), 0);
        bsize += networkIDBuff.length;
        barr.push(networkIDBuff);
        // Blockchain ID
        bsize += 32;
        barr.push(buffer_1.Buffer.alloc(32));
        // num Outputs
        bsize += 4;
        barr.push(buffer_1.Buffer.alloc(4));
        // num Inputs
        bsize += 4;
        barr.push(buffer_1.Buffer.alloc(4));
        // memo
        const memo = this.getMemo();
        const memobuffSize = buffer_1.Buffer.alloc(4);
        memobuffSize.writeUInt32BE(memo.length, 0);
        bsize += memobuffSize.length;
        barr.push(memobuffSize);
        bsize += memo.length;
        barr.push(memo);
        // asset name
        const name = this.getName();
        const namebuffSize = buffer_1.Buffer.alloc(2);
        namebuffSize.writeUInt16BE(name.length, 0);
        bsize += namebuffSize.length;
        barr.push(namebuffSize);
        const namebuff = buffer_1.Buffer.alloc(name.length);
        namebuff.write(name, 0, name.length, utf8);
        bsize += namebuff.length;
        barr.push(namebuff);
        // symbol
        const symbol = this.getSymbol();
        const symbolbuffSize = buffer_1.Buffer.alloc(2);
        symbolbuffSize.writeUInt16BE(symbol.length, 0);
        bsize += symbolbuffSize.length;
        barr.push(symbolbuffSize);
        const symbolbuff = buffer_1.Buffer.alloc(symbol.length);
        symbolbuff.write(symbol, 0, symbol.length, utf8);
        bsize += symbolbuff.length;
        barr.push(symbolbuff);
        // denomination
        const denomination = this.getDenomination();
        const denominationbuffSize = buffer_1.Buffer.alloc(1);
        denominationbuffSize.writeUInt8(denomination, 0);
        bsize += denominationbuffSize.length;
        barr.push(denominationbuffSize);
        bsize += this.initialState.toBuffer().length;
        barr.push(this.initialState.toBuffer());
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.GenesisAsset = GenesisAsset;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXNpc2Fzc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvanZtL2dlbmVzaXNhc3NldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLG1EQUErQztBQUMvQyxxREFBd0Q7QUFDeEQsNkRBSWtDO0FBQ2xDLG1EQUErQztBQUMvQyxrREFBc0I7QUFFdEI7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNoRSxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sSUFBSSxHQUFtQixNQUFNLENBQUE7QUFDbkMsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUN2QyxNQUFNLGFBQWEsR0FBbUIsZUFBZSxDQUFBO0FBRXJELE1BQWEsWUFBYSxTQUFRLDZCQUFhO0lBNEo3Qzs7Ozs7Ozs7O09BU0c7SUFDSCxZQUNFLGFBQXFCLFNBQVMsRUFDOUIsT0FBZSxTQUFTLEVBQ3hCLFNBQWlCLFNBQVMsRUFDMUIsZUFBdUIsU0FBUyxFQUNoQyxlQUE4QixTQUFTLEVBQ3ZDLE9BQWUsU0FBUztRQUV4QixLQUFLLENBQUMsNEJBQWdCLEVBQUUsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBN0svQyxjQUFTLEdBQUcsY0FBYyxDQUFBO1FBQzFCLGFBQVEsR0FBRyxTQUFTLENBQUE7UUFDcEIsWUFBTyxHQUFHLFNBQVMsQ0FBQTtRQStDbkIsZUFBVSxHQUFXLEVBQUUsQ0FBQTtRQUVqQzs7V0FFRztRQUNILGtCQUFhLEdBQUcsR0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQTtRQXdIM0MsSUFDRSxPQUFPLFVBQVUsS0FBSyxRQUFRO1lBQzlCLE9B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QUksQ0FBQyxDQUFBO1FBQ2hELEtBQUssSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFBO1FBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7UUFFckIsZUFBZTtRQUNmLE1BQU0sWUFBWSxHQUFXLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtRQUNuRCxNQUFNLG9CQUFvQixHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDcEQsb0JBQW9CLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUNoRCxLQUFLLElBQUksb0JBQW9CLENBQUMsTUFBTSxDQUFBO1FBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtRQUUvQixLQUFLLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUE7UUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDdkMsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0NBcUNGO0FBL0xELG9DQStMQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktSlZNLUdlbmVzaXNBc3NldFxyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IHsgSW5pdGlhbFN0YXRlcyB9IGZyb20gXCIuL2luaXRpYWxzdGF0ZXNcIlxyXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgU2VyaWFsaXphdGlvbixcclxuICBTZXJpYWxpemVkRW5jb2RpbmcsXHJcbiAgU2VyaWFsaXplZFR5cGVcclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcbmltcG9ydCB7IENyZWF0ZUFzc2V0VHggfSBmcm9tIFwiLi9jcmVhdGVhc3NldHR4XCJcclxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHV0Zjg6IFNlcmlhbGl6ZWRUeXBlID0gXCJ1dGY4XCJcclxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcclxuY29uc3QgZGVjaW1hbFN0cmluZzogU2VyaWFsaXplZFR5cGUgPSBcImRlY2ltYWxTdHJpbmdcIlxyXG5cclxuZXhwb3J0IGNsYXNzIEdlbmVzaXNBc3NldCBleHRlbmRzIENyZWF0ZUFzc2V0VHgge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkdlbmVzaXNBc3NldFwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gdW5kZWZpbmVkXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgZGVsZXRlIGZpZWxkc1tcImJsb2NrY2hhaW5JRFwiXVxyXG4gICAgZGVsZXRlIGZpZWxkc1tcIm91dHNcIl1cclxuICAgIGRlbGV0ZSBmaWVsZHNbXCJpbnNcIl1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgYXNzZXRBbGlhczogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRBbGlhcywgZW5jb2RpbmcsIHV0ZjgsIHV0ZjgpLFxyXG4gICAgICBuYW1lOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5uYW1lLCBlbmNvZGluZywgdXRmOCwgdXRmOCksXHJcbiAgICAgIHN5bWJvbDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuc3ltYm9sLCBlbmNvZGluZywgdXRmOCwgdXRmOCksXHJcbiAgICAgIGRlbm9taW5hdGlvbjogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuZGVub21pbmF0aW9uLFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIGJ1ZmZlcixcclxuICAgICAgICBkZWNpbWFsU3RyaW5nLFxyXG4gICAgICAgIDFcclxuICAgICAgKSxcclxuICAgICAgaW5pdGlhbFN0YXRlOiB0aGlzLmluaXRpYWxTdGF0ZS5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIGZpZWxkc1tcImJsb2NrY2hhaW5JRFwiXSA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgICBmaWVsZHNbXCJvdXRzXCJdID0gW11cclxuICAgIGZpZWxkc1tcImluc1wiXSA9IFtdXHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5hc3NldEFsaWFzID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJhc3NldEFsaWFzXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgdXRmOCxcclxuICAgICAgdXRmOFxyXG4gICAgKVxyXG4gICAgdGhpcy5uYW1lID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKGZpZWxkc1tcIm5hbWVcIl0sIGVuY29kaW5nLCB1dGY4LCB1dGY4KVxyXG4gICAgdGhpcy5zeW1ib2wgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoZmllbGRzW1wic3ltYm9sXCJdLCBlbmNvZGluZywgdXRmOCwgdXRmOClcclxuICAgIHRoaXMuZGVub21pbmF0aW9uID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJkZW5vbWluYXRpb25cIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBkZWNpbWFsU3RyaW5nLFxyXG4gICAgICBidWZmZXIsXHJcbiAgICAgIDFcclxuICAgIClcclxuICAgIHRoaXMuaW5pdGlhbFN0YXRlID0gbmV3IEluaXRpYWxTdGF0ZXMoKVxyXG4gICAgdGhpcy5pbml0aWFsU3RhdGUuZGVzZXJpYWxpemUoZmllbGRzW1wiaW5pdGlhbFN0YXRlXCJdLCBlbmNvZGluZylcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhc3NldEFsaWFzOiBzdHJpbmcgPSBcIlwiXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYXNzZXRBbGlhc1xyXG4gICAqL1xyXG4gIGdldEFzc2V0QWxpYXMgPSAoKTogc3RyaW5nID0+IHRoaXMuYXNzZXRBbGlhc1xyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tHZW5lc2lzQXNzZXRdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW0dlbmVzaXNBc3NldF1dIGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0dlbmVzaXNBc3NldF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tHZW5lc2lzQXNzZXRdXVxyXG4gICAqXHJcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IGFzc2V0QWxpYXNTaXplOiBudW1iZXIgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMilcclxuICAgICAgLnJlYWRVSW50MTZCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDJcclxuICAgIHRoaXMuYXNzZXRBbGlhcyA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBhc3NldEFsaWFzU2l6ZSlcclxuICAgICAgLnRvU3RyaW5nKFwidXRmOFwiKVxyXG4gICAgb2Zmc2V0ICs9IGFzc2V0QWxpYXNTaXplXHJcbiAgICBvZmZzZXQgKz0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0dlbmVzaXNBc3NldF1dLlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCk6IEJ1ZmZlciB7XHJcbiAgICAvLyBhc3NldCBhbGlhc1xyXG4gICAgY29uc3QgYXNzZXRBbGlhczogc3RyaW5nID0gdGhpcy5nZXRBc3NldEFsaWFzKClcclxuICAgIGNvbnN0IGFzc2V0QWxpYXNidWZmU2l6ZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXHJcbiAgICBhc3NldEFsaWFzYnVmZlNpemUud3JpdGVVSW50MTZCRShhc3NldEFsaWFzLmxlbmd0aCwgMClcclxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gYXNzZXRBbGlhc2J1ZmZTaXplLmxlbmd0aFxyXG4gICAgbGV0IGJhcnI6IEJ1ZmZlcltdID0gW2Fzc2V0QWxpYXNidWZmU2l6ZV1cclxuICAgIGNvbnN0IGFzc2V0QWxpYXNidWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoYXNzZXRBbGlhcy5sZW5ndGgpXHJcbiAgICBhc3NldEFsaWFzYnVmZi53cml0ZShhc3NldEFsaWFzLCAwLCBhc3NldEFsaWFzLmxlbmd0aCwgdXRmOClcclxuICAgIGJzaXplICs9IGFzc2V0QWxpYXNidWZmLmxlbmd0aFxyXG4gICAgYmFyci5wdXNoKGFzc2V0QWxpYXNidWZmKVxyXG5cclxuICAgIGNvbnN0IG5ldHdvcmtJREJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgbmV0d29ya0lEQnVmZi53cml0ZVVJbnQzMkJFKG5ldyBCTihuZXR3b3JrSUQpLnRvTnVtYmVyKCksIDApXHJcbiAgICBic2l6ZSArPSBuZXR3b3JrSURCdWZmLmxlbmd0aFxyXG4gICAgYmFyci5wdXNoKG5ldHdvcmtJREJ1ZmYpXHJcblxyXG4gICAgLy8gQmxvY2tjaGFpbiBJRFxyXG4gICAgYnNpemUgKz0gMzJcclxuICAgIGJhcnIucHVzaChCdWZmZXIuYWxsb2MoMzIpKVxyXG5cclxuICAgIC8vIG51bSBPdXRwdXRzXHJcbiAgICBic2l6ZSArPSA0XHJcbiAgICBiYXJyLnB1c2goQnVmZmVyLmFsbG9jKDQpKVxyXG5cclxuICAgIC8vIG51bSBJbnB1dHNcclxuICAgIGJzaXplICs9IDRcclxuICAgIGJhcnIucHVzaChCdWZmZXIuYWxsb2MoNCkpXHJcblxyXG4gICAgLy8gbWVtb1xyXG4gICAgY29uc3QgbWVtbzogQnVmZmVyID0gdGhpcy5nZXRNZW1vKClcclxuICAgIGNvbnN0IG1lbW9idWZmU2l6ZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBtZW1vYnVmZlNpemUud3JpdGVVSW50MzJCRShtZW1vLmxlbmd0aCwgMClcclxuICAgIGJzaXplICs9IG1lbW9idWZmU2l6ZS5sZW5ndGhcclxuICAgIGJhcnIucHVzaChtZW1vYnVmZlNpemUpXHJcblxyXG4gICAgYnNpemUgKz0gbWVtby5sZW5ndGhcclxuICAgIGJhcnIucHVzaChtZW1vKVxyXG5cclxuICAgIC8vIGFzc2V0IG5hbWVcclxuICAgIGNvbnN0IG5hbWU6IHN0cmluZyA9IHRoaXMuZ2V0TmFtZSgpXHJcbiAgICBjb25zdCBuYW1lYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxyXG4gICAgbmFtZWJ1ZmZTaXplLndyaXRlVUludDE2QkUobmFtZS5sZW5ndGgsIDApXHJcbiAgICBic2l6ZSArPSBuYW1lYnVmZlNpemUubGVuZ3RoXHJcbiAgICBiYXJyLnB1c2gobmFtZWJ1ZmZTaXplKVxyXG4gICAgY29uc3QgbmFtZWJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhuYW1lLmxlbmd0aClcclxuICAgIG5hbWVidWZmLndyaXRlKG5hbWUsIDAsIG5hbWUubGVuZ3RoLCB1dGY4KVxyXG4gICAgYnNpemUgKz0gbmFtZWJ1ZmYubGVuZ3RoXHJcbiAgICBiYXJyLnB1c2gobmFtZWJ1ZmYpXHJcblxyXG4gICAgLy8gc3ltYm9sXHJcbiAgICBjb25zdCBzeW1ib2w6IHN0cmluZyA9IHRoaXMuZ2V0U3ltYm9sKClcclxuICAgIGNvbnN0IHN5bWJvbGJ1ZmZTaXplOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMilcclxuICAgIHN5bWJvbGJ1ZmZTaXplLndyaXRlVUludDE2QkUoc3ltYm9sLmxlbmd0aCwgMClcclxuICAgIGJzaXplICs9IHN5bWJvbGJ1ZmZTaXplLmxlbmd0aFxyXG4gICAgYmFyci5wdXNoKHN5bWJvbGJ1ZmZTaXplKVxyXG5cclxuICAgIGNvbnN0IHN5bWJvbGJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhzeW1ib2wubGVuZ3RoKVxyXG4gICAgc3ltYm9sYnVmZi53cml0ZShzeW1ib2wsIDAsIHN5bWJvbC5sZW5ndGgsIHV0ZjgpXHJcbiAgICBic2l6ZSArPSBzeW1ib2xidWZmLmxlbmd0aFxyXG4gICAgYmFyci5wdXNoKHN5bWJvbGJ1ZmYpXHJcblxyXG4gICAgLy8gZGVub21pbmF0aW9uXHJcbiAgICBjb25zdCBkZW5vbWluYXRpb246IG51bWJlciA9IHRoaXMuZ2V0RGVub21pbmF0aW9uKClcclxuICAgIGNvbnN0IGRlbm9taW5hdGlvbmJ1ZmZTaXplOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMSlcclxuICAgIGRlbm9taW5hdGlvbmJ1ZmZTaXplLndyaXRlVUludDgoZGVub21pbmF0aW9uLCAwKVxyXG4gICAgYnNpemUgKz0gZGVub21pbmF0aW9uYnVmZlNpemUubGVuZ3RoXHJcbiAgICBiYXJyLnB1c2goZGVub21pbmF0aW9uYnVmZlNpemUpXHJcblxyXG4gICAgYnNpemUgKz0gdGhpcy5pbml0aWFsU3RhdGUudG9CdWZmZXIoKS5sZW5ndGhcclxuICAgIGJhcnIucHVzaCh0aGlzLmluaXRpYWxTdGF0ZS50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYSBHZW5lc2lzQXNzZXRcclxuICAgKlxyXG4gICAqIEBwYXJhbSBhc3NldEFsaWFzIE9wdGlvbmFsIFN0cmluZyBmb3IgdGhlIGFzc2V0IGFsaWFzXHJcbiAgICogQHBhcmFtIG5hbWUgT3B0aW9uYWwgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgYXNzZXRcclxuICAgKiBAcGFyYW0gc3ltYm9sIE9wdGlvbmFsIFN0cmluZyBmb3IgdGhlIHRpY2tlciBzeW1ib2wgb2YgdGhlIGFzc2V0XHJcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbCBudW1iZXIgZm9yIHRoZSBkZW5vbWluYXRpb24gd2hpY2ggaXMgMTBeRC4gRCBtdXN0IGJlID49IDAgYW5kIDw9IDMyLiBFeDogJDEgSlVORSA9IDEwXjkgJG5KVU5FXHJcbiAgICogQHBhcmFtIGluaXRpYWxTdGF0ZSBPcHRpb25hbCBbW0luaXRpYWxTdGF0ZXNdXSB0aGF0IHJlcHJlc2VudCB0aGUgaW50aWFsIHN0YXRlIG9mIGEgY3JlYXRlZCBhc3NldFxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgYXNzZXRBbGlhczogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgbmFtZTogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgc3ltYm9sOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICBkZW5vbWluYXRpb246IG51bWJlciA9IHVuZGVmaW5lZCxcclxuICAgIGluaXRpYWxTdGF0ZTogSW5pdGlhbFN0YXRlcyA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoRGVmYXVsdE5ldHdvcmtJRCwgQnVmZmVyLmFsbG9jKDMyKSwgW10sIFtdLCBtZW1vKVxyXG4gICAgaWYgKFxyXG4gICAgICB0eXBlb2YgYXNzZXRBbGlhcyA9PT0gXCJzdHJpbmdcIiAmJlxyXG4gICAgICB0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIiAmJlxyXG4gICAgICB0eXBlb2Ygc3ltYm9sID09PSBcInN0cmluZ1wiICYmXHJcbiAgICAgIHR5cGVvZiBkZW5vbWluYXRpb24gPT09IFwibnVtYmVyXCIgJiZcclxuICAgICAgZGVub21pbmF0aW9uID49IDAgJiZcclxuICAgICAgZGVub21pbmF0aW9uIDw9IDMyICYmXHJcbiAgICAgIHR5cGVvZiBpbml0aWFsU3RhdGUgIT09IFwidW5kZWZpbmVkXCJcclxuICAgICkge1xyXG4gICAgICB0aGlzLmFzc2V0QWxpYXMgPSBhc3NldEFsaWFzXHJcbiAgICAgIHRoaXMubmFtZSA9IG5hbWVcclxuICAgICAgdGhpcy5zeW1ib2wgPSBzeW1ib2xcclxuICAgICAgdGhpcy5kZW5vbWluYXRpb24ud3JpdGVVSW50OChkZW5vbWluYXRpb24sIDApXHJcbiAgICAgIHRoaXMuaW5pdGlhbFN0YXRlID0gaW5pdGlhbFN0YXRlXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==