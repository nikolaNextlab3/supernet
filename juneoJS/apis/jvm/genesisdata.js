"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenesisData = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-GenesisData
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const serialization_1 = require("../../utils/serialization");
const constants_1 = require("./constants");
const _1 = require(".");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const serialization = serialization_1.Serialization.getInstance();
const bintools = bintools_1.default.getInstance();
const decimalString = "decimalString";
const buffer = "Buffer";
class GenesisData extends serialization_1.Serializable {
    /**
     * Class representing JVM GenesisData
     *
     * @param genesisAssets Optional GenesisAsset[]
     * @param networkID Optional DefaultNetworkID
     */
    constructor(genesisAssets = [], networkID = utils_1.DefaultNetworkID) {
        super();
        this._typeName = "GenesisData";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this.networkID = buffer_1.Buffer.alloc(4);
        /**
         * Returns the GenesisAssets[]
         */
        this.getGenesisAssets = () => this.genesisAssets;
        /**
         * Returns the NetworkID as a number
         */
        this.getNetworkID = () => this.networkID.readUInt32BE(0);
        this.genesisAssets = genesisAssets;
        this.networkID.writeUInt32BE(networkID, 0);
    }
    // TODO - setCodecID?
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { genesisAssets: this.genesisAssets.map((genesisAsset) => genesisAsset.serialize(encoding)), networkID: serialization.encoder(this.networkID, encoding, buffer, decimalString) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.genesisAssets = fields["genesisAssets"].map((genesisAsset) => {
            let g = new _1.GenesisAsset();
            g.deserialize(genesisAsset, encoding);
            return g;
        });
        this.networkID = serialization.decoder(fields["networkID"], encoding, decimalString, buffer, 4);
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
        this._codecID = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        const numGenesisAssets = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const assetCount = numGenesisAssets.readUInt32BE(0);
        this.genesisAssets = [];
        for (let i = 0; i < assetCount; i++) {
            const genesisAsset = new _1.GenesisAsset();
            offset = genesisAsset.fromBuffer(bytes, offset);
            this.genesisAssets.push(genesisAsset);
            if (i === 0) {
                this.networkID.writeUInt32BE(genesisAsset.getNetworkID(), 0);
            }
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisData]].
     */
    toBuffer() {
        // codec id
        const codecbuffSize = buffer_1.Buffer.alloc(2);
        codecbuffSize.writeUInt16BE(this._codecID, 0);
        // num assets
        const numAssetsbuffSize = buffer_1.Buffer.alloc(4);
        numAssetsbuffSize.writeUInt32BE(this.genesisAssets.length, 0);
        let bsize = codecbuffSize.length + numAssetsbuffSize.length;
        let barr = [codecbuffSize, numAssetsbuffSize];
        this.genesisAssets.forEach((genesisAsset) => {
            const b = genesisAsset.toBuffer(this.getNetworkID());
            bsize += b.length;
            barr.push(b);
        });
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.GenesisData = GenesisData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXNpc2RhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9qdm0vZ2VuZXNpc2RhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQyw2REFJa0M7QUFDbEMsMkNBQTBDO0FBQzFDLHdCQUFnQztBQUNoQyx1Q0FBOEQ7QUFFOUQ7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNoRSxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFtQixlQUFlLENBQUE7QUFDckQsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUV2QyxNQUFhLFdBQVksU0FBUSw0QkFBWTtJQXNHM0M7Ozs7O09BS0c7SUFDSCxZQUNFLGdCQUFnQyxFQUFFLEVBQ2xDLFlBQW9CLHdCQUFnQjtRQUVwQyxLQUFLLEVBQUUsQ0FBQTtRQS9HQyxjQUFTLEdBQUcsYUFBYSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyx3QkFBWSxDQUFDLFdBQVcsQ0FBQTtRQXNDbkMsY0FBUyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFN0M7O1dBRUc7UUFDSCxxQkFBZ0IsR0FBRyxHQUFtQixFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQTtRQUUzRDs7V0FFRztRQUNILGlCQUFZLEdBQUcsR0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUE7UUErRHpELElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFBO1FBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUM1QyxDQUFDO0lBL0dELHFCQUFxQjtJQUNyQixTQUFT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QUFJLEtBQUssR0FBVyxhQUFhLENBQUMsTUFBTSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQTtRQUNuRSxJQUFJLElBQUksR0FBYSxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFBO1FBRXZELElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBMEIsRUFBUSxFQUFFO1lBQzlELE1BQU0sQ0FBQyxHQUFXLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUE7WUFDNUQsS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUE7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNkLENBQUMsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0NBZ0JGO0FBcEhELGtDQW9IQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktSlZNLUdlbmVzaXNEYXRhXHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQge1xyXG4gIFNlcmlhbGl6YWJsZSxcclxuICBTZXJpYWxpemF0aW9uLFxyXG4gIFNlcmlhbGl6ZWRFbmNvZGluZ1xyXG59IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgSlZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgR2VuZXNpc0Fzc2V0IH0gZnJvbSBcIi5cIlxyXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lELCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcclxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBHZW5lc2lzRGF0YSBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiR2VuZXNpc0RhdGFcIlxyXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEpWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xyXG5cclxuICAvLyBUT0RPIC0gc2V0Q29kZWNJRD9cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBnZW5lc2lzQXNzZXRzOiB0aGlzLmdlbmVzaXNBc3NldHMubWFwKChnZW5lc2lzQXNzZXQ6IEdlbmVzaXNBc3NldCkgPT5cclxuICAgICAgICBnZW5lc2lzQXNzZXQuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgICApLFxyXG4gICAgICBuZXR3b3JrSUQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICB0aGlzLm5ldHdvcmtJRCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBidWZmZXIsXHJcbiAgICAgICAgZGVjaW1hbFN0cmluZ1xyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLmdlbmVzaXNBc3NldHMgPSBmaWVsZHNbXCJnZW5lc2lzQXNzZXRzXCJdLm1hcChcclxuICAgICAgKGdlbmVzaXNBc3NldDogR2VuZXNpc0Fzc2V0KTogR2VuZXNpc0Fzc2V0ID0+IHtcclxuICAgICAgICBsZXQgZzogR2VuZXNpc0Fzc2V0ID0gbmV3IEdlbmVzaXNBc3NldCgpXHJcbiAgICAgICAgZy5kZXNlcmlhbGl6ZShnZW5lc2lzQXNzZXQsIGVuY29kaW5nKVxyXG4gICAgICAgIHJldHVybiBnXHJcbiAgICAgIH1cclxuICAgIClcclxuICAgIHRoaXMubmV0d29ya0lEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJuZXR3b3JrSURcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBkZWNpbWFsU3RyaW5nLFxyXG4gICAgICBidWZmZXIsXHJcbiAgICAgIDRcclxuICAgIClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBnZW5lc2lzQXNzZXRzOiBHZW5lc2lzQXNzZXRbXVxyXG4gIHByb3RlY3RlZCBuZXR3b3JrSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBHZW5lc2lzQXNzZXRzW11cclxuICAgKi9cclxuICBnZXRHZW5lc2lzQXNzZXRzID0gKCk6IEdlbmVzaXNBc3NldFtdID0+IHRoaXMuZ2VuZXNpc0Fzc2V0c1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBOZXR3b3JrSUQgYXMgYSBudW1iZXJcclxuICAgKi9cclxuICBnZXROZXR3b3JrSUQgPSAoKTogbnVtYmVyID0+IHRoaXMubmV0d29ya0lELnJlYWRVSW50MzJCRSgwKVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tHZW5lc2lzQXNzZXRdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW0dlbmVzaXNBc3NldF1dIGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0dlbmVzaXNBc3NldF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tHZW5lc2lzQXNzZXRdXVxyXG4gICAqXHJcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIHRoaXMuX2NvZGVjSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKS5yZWFkVUludDE2QkUoMClcclxuICAgIG9mZnNldCArPSAyXHJcbiAgICBjb25zdCBudW1HZW5lc2lzQXNzZXRzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICBjb25zdCBhc3NldENvdW50OiBudW1iZXIgPSBudW1HZW5lc2lzQXNzZXRzLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgdGhpcy5nZW5lc2lzQXNzZXRzID0gW11cclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhc3NldENvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgZ2VuZXNpc0Fzc2V0OiBHZW5lc2lzQXNzZXQgPSBuZXcgR2VuZXNpc0Fzc2V0KClcclxuICAgICAgb2Zmc2V0ID0gZ2VuZXNpc0Fzc2V0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgICAgdGhpcy5nZW5lc2lzQXNzZXRzLnB1c2goZ2VuZXNpc0Fzc2V0KVxyXG4gICAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgIHRoaXMubmV0d29ya0lELndyaXRlVUludDMyQkUoZ2VuZXNpc0Fzc2V0LmdldE5ldHdvcmtJRCgpLCAwKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbR2VuZXNpc0RhdGFdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgLy8gY29kZWMgaWRcclxuICAgIGNvbnN0IGNvZGVjYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxyXG4gICAgY29kZWNidWZmU2l6ZS53cml0ZVVJbnQxNkJFKHRoaXMuX2NvZGVjSUQsIDApXHJcblxyXG4gICAgLy8gbnVtIGFzc2V0c1xyXG4gICAgY29uc3QgbnVtQXNzZXRzYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgbnVtQXNzZXRzYnVmZlNpemUud3JpdGVVSW50MzJCRSh0aGlzLmdlbmVzaXNBc3NldHMubGVuZ3RoLCAwKVxyXG5cclxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gY29kZWNidWZmU2l6ZS5sZW5ndGggKyBudW1Bc3NldHNidWZmU2l6ZS5sZW5ndGhcclxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFtjb2RlY2J1ZmZTaXplLCBudW1Bc3NldHNidWZmU2l6ZV1cclxuXHJcbiAgICB0aGlzLmdlbmVzaXNBc3NldHMuZm9yRWFjaCgoZ2VuZXNpc0Fzc2V0OiBHZW5lc2lzQXNzZXQpOiB2b2lkID0+IHtcclxuICAgICAgY29uc3QgYjogQnVmZmVyID0gZ2VuZXNpc0Fzc2V0LnRvQnVmZmVyKHRoaXMuZ2V0TmV0d29ya0lEKCkpXHJcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXHJcbiAgICAgIGJhcnIucHVzaChiKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIEpWTSBHZW5lc2lzRGF0YVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGdlbmVzaXNBc3NldHMgT3B0aW9uYWwgR2VuZXNpc0Fzc2V0W11cclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIERlZmF1bHROZXR3b3JrSURcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGdlbmVzaXNBc3NldHM6IEdlbmVzaXNBc3NldFtdID0gW10sXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSURcclxuICApIHtcclxuICAgIHN1cGVyKClcclxuICAgIHRoaXMuZ2VuZXNpc0Fzc2V0cyA9IGdlbmVzaXNBc3NldHNcclxuICAgIHRoaXMubmV0d29ya0lELndyaXRlVUludDMyQkUobmV0d29ya0lELCAwKVxyXG4gIH1cclxufVxyXG4iXX0=