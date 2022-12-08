"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vertex = void 0;
/**
 * @packageDocumentation
 * @module API-JVM-Vertex
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const tx_1 = require("./tx");
const utils_1 = require("../../utils");
const bn_js_1 = __importDefault(require("bn.js"));
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class representing a Vertex
 */
class Vertex extends utils_1.Serializable {
    /**
     * Class representing a Vertex which is a container for JVM Transactions.
     *
     * @param networkID Optional, [[DefaultNetworkID]]
     * @param blockchainID Optional, default "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM"
     * @param height Optional, default new BN(0)
     * @param epoch Optional, default new BN(0)
     * @param parentIDs Optional, default []
     * @param txs Optional, default []
     * @param restrictions Optional, default []
     */
    constructor(networkID = utils_1.DefaultNetworkID, blockchainID = "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM", height = new bn_js_1.default(0), epoch = 0, parentIDs = [], txs = [], restrictions = []) {
        super();
        this._typeName = "Vertex";
        this._codecID = constants_1.JVMConstants.LATESTCODEC;
        this.networkID = networkID;
        this.blockchainID = bintools.cb58Decode(blockchainID);
        this.height = height;
        this.epoch = epoch;
        this.parentIDs = parentIDs;
        this.numParentIDs = parentIDs.length;
        this.txs = txs;
        this.numTxs = txs.length;
        this.restrictions = restrictions;
        this.numRestrictions = restrictions.length;
    }
    /**
     * Returns the NetworkID as a number
     */
    getNetworkID() {
        return this.networkID;
    }
    /**
     * Returns the BlockchainID as a CB58 string
     */
    getBlockchainID() {
        return bintools.cb58Encode(this.blockchainID);
    }
    /**
     * Returns the Height as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getHeight() {
        return this.height;
    }
    /**
     * Returns the Epoch as a number.
     */
    getEpoch() {
        return this.epoch;
    }
    /**
     * @returns An array of Buffers
     */
    getParentIDs() {
        return this.parentIDs;
    }
    /**
     * Returns array of UnsignedTxs.
     */
    getTxs() {
        return this.txs;
    }
    /**
     * @returns An array of Buffers
     */
    getRestrictions() {
        return this.restrictions;
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new utils_1.CodecIdError("Error - Vertex.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0 ? constants_1.JVMConstants.VERTEX : constants_1.JVMConstants.VERTEX_CODECONE;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Vertex]], parses it, populates the class, and returns the length of the Vertex in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Vertex]]
     *
     * @returns The length of the raw [[Vertex]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset += 2;
        this.blockchainID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const h = bintools.copyFrom(bytes, offset, offset + 8);
        this.height = bintools.fromBufferToBN(h);
        offset += 8;
        const e = bintools.copyFrom(bytes, offset, offset + 4);
        this.epoch = e.readInt32BE(0);
        offset += 4;
        const nPIDs = bintools.copyFrom(bytes, offset, offset + 4);
        this.numParentIDs = nPIDs.readInt32BE(0);
        offset += 4;
        for (let i = 0; i < this.numParentIDs; i++) {
            const parentID = bintools.copyFrom(bytes, offset, offset + 32);
            offset += 32;
            this.parentIDs.push(parentID);
        }
        const nTxs = bintools.copyFrom(bytes, offset, offset + 4);
        this.numTxs = nTxs.readInt32BE(0);
        // account for tx-size bytes
        offset += 8;
        for (let i = 0; i < this.numTxs; i++) {
            const tx = new tx_1.Tx();
            offset += tx.fromBuffer(bintools.copyFrom(bytes, offset));
            this.txs.push(tx);
        }
        if (bytes.byteLength > offset && bytes.byteLength - offset > 4) {
            const nRs = bintools.copyFrom(bytes, offset, offset + 4);
            this.numRestrictions = nRs.readInt32BE(0);
            offset += 4;
            for (let i = 0; i < this.numRestrictions; i++) {
                const tx = bintools.copyFrom(bytes, offset, offset + 32);
                offset += 32;
                this.restrictions.push(tx);
            }
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Vertex]].
     */
    toBuffer() {
        const codec = this.getCodecID();
        const codecBuf = buffer_1.Buffer.alloc(2);
        codecBuf.writeUInt16BE(codec, 0);
        const epochBuf = buffer_1.Buffer.alloc(4);
        epochBuf.writeInt32BE(this.epoch, 0);
        const numParentIDsBuf = buffer_1.Buffer.alloc(4);
        numParentIDsBuf.writeInt32BE(this.numParentIDs, 0);
        let barr = [
            codecBuf,
            this.blockchainID,
            bintools.fromBNToBuffer(this.height, 8),
            epochBuf,
            numParentIDsBuf
        ];
        this.parentIDs.forEach((parentID) => {
            barr.push(parentID);
        });
        const txs = this.getTxs();
        const numTxs = buffer_1.Buffer.alloc(4);
        numTxs.writeUInt32BE(txs.length, 0);
        barr.push(numTxs);
        let size = 0;
        const txSize = buffer_1.Buffer.alloc(4);
        txs.forEach((tx) => {
            const b = tx.toBuffer();
            size += b.byteLength;
        });
        txSize.writeUInt32BE(size, 0);
        barr.push(txSize);
        txs.forEach((tx) => {
            const b = tx.toBuffer();
            barr.push(b);
        });
        return buffer_1.Buffer.concat(barr);
    }
    clone() {
        let vertex = new Vertex();
        vertex.fromBuffer(this.toBuffer());
        return vertex;
    }
}
exports.Vertex = Vertex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVydGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvanZtL3ZlcnRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUEwQztBQUMxQyw2QkFBcUM7QUFDckMsdUNBQTBFO0FBQzFFLGtEQUFzQjtBQUd0Qjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFakQ7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxvQkFBWTtJQTZMdEM7Ozs7Ozs7Ozs7T0FVRztJQUNILFlBQ0UsWUFBb0Isd0JBQWdCLEVBQ3BDLGVBQXVCLG9EQUFvRCxFQUMzRSxTQUFhLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUN0QixRQUFnQixDQUFDLEVBQ2pCLFlBQXNCLEVBQUUsRUFDeEIsTUFBWSxFQUFFLEVBQ2QsZUFBeUIsRUFBRTtRQUUzQixLQUFLLEVBQUUsQ0FBQTtRQWhOQyxjQUFTLEdBQUcsUUFBUSxDQUFBO1FBQ3BCLGFBQVEsR0FBRyx3QkFBWSxDQUFDLFdBQVcsQ0FBQTtRQWdOM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUE7UUFDMUIsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ3JELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1FBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO1FBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtRQUNwQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQTtRQUNkLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUN4QixJ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RyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRWpCLElBQUksSUFBSSxHQUFXLENBQUMsQ0FBQTtRQUNwQixNQUFNLE1BQU0sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3RDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFNLEVBQVEsRUFBRTtZQUMzQixNQUFNLENBQUMsR0FBVyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDL0IsSUFBSSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUE7UUFDdEIsQ0FBQyxDQUFDLENBQUE7UUFDRixNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRWpCLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFNLEVBQVEsRUFBRTtZQUMzQixNQUFNLENBQUMsR0FBVyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNkLENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzVCLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxNQUFNLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQTtRQUNqQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLE9BQU8sTUFBYyxDQUFBO0lBQ3ZCLENBQUM7Q0FpQ0Y7QUE3TkQsd0JBNk5DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1KVk0tVmVydGV4XHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBKVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBUeCwgVW5zaWduZWRUeCB9IGZyb20gXCIuL3R4XCJcclxuaW1wb3J0IHsgU2VyaWFsaXphYmxlLCBDb2RlY0lkRXJyb3IsIERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi5cIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBWZXJ0ZXhcclxuICovXHJcbmV4cG9ydCBjbGFzcyBWZXJ0ZXggZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlZlcnRleFwiXHJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gSlZNQ29uc3RhbnRzLkxBVEVTVENPREVDXHJcbiAgLy8gc2VyaWFsaXplIGlzIGluaGVyaXRlZFxyXG4gIC8vIGRlc2VyaWFsaXplIGlzIGluaGVyaXRlZFxyXG4gIHByb3RlY3RlZCBuZXR3b3JrSUQ6IG51bWJlclxyXG4gIHByb3RlY3RlZCBibG9ja2NoYWluSUQ6IEJ1ZmZlclxyXG4gIHByb3RlY3RlZCBoZWlnaHQ6IEJOXHJcbiAgcHJvdGVjdGVkIGVwb2NoOiBudW1iZXJcclxuICBwcm90ZWN0ZWQgcGFyZW50SURzOiBCdWZmZXJbXVxyXG4gIHByb3RlY3RlZCBudW1QYXJlbnRJRHM6IG51bWJlclxyXG4gIHByb3RlY3RlZCB0eHM6IFR4W11cclxuICBwcm90ZWN0ZWQgbnVtVHhzOiBudW1iZXJcclxuICBwcm90ZWN0ZWQgcmVzdHJpY3Rpb25zOiBCdWZmZXJbXVxyXG4gIHByb3RlY3RlZCBudW1SZXN0cmljdGlvbnM6IG51bWJlclxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBOZXR3b3JrSUQgYXMgYSBudW1iZXJcclxuICAgKi9cclxuICBnZXROZXR3b3JrSUQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLm5ldHdvcmtJRFxyXG4gIH1cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBCbG9ja2NoYWluSUQgYXMgYSBDQjU4IHN0cmluZ1xyXG4gICAqL1xyXG4gIGdldEJsb2NrY2hhaW5JRCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5ibG9ja2NoYWluSUQpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBIZWlnaHQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cclxuICAgKi9cclxuICBnZXRIZWlnaHQoKTogQk4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaGVpZ2h0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBFcG9jaCBhcyBhIG51bWJlci5cclxuICAgKi9cclxuICBnZXRFcG9jaCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZXBvY2hcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIEJ1ZmZlcnNcclxuICAgKi9cclxuICBnZXRQYXJlbnRJRHMoKTogQnVmZmVyW10ge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50SURzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFycmF5IG9mIFVuc2lnbmVkVHhzLlxyXG4gICAqL1xyXG4gIGdldFR4cygpOiBUeFtdIHtcclxuICAgIHJldHVybiB0aGlzLnR4c1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgQnVmZmVyc1xyXG4gICAqL1xyXG4gIGdldFJlc3RyaWN0aW9ucygpOiBCdWZmZXJbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXN0cmljdGlvbnNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY29kZWNJRFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XHJcbiAgICovXHJcbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IENvZGVjSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gVmVydGV4LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSURcclxuICAgIHRoaXMuX3R5cGVJRCA9XHJcbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDAgPyBKVk1Db25zdGFudHMuVkVSVEVYIDogSlZNQ29uc3RhbnRzLlZFUlRFWF9DT0RFQ09ORVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbVmVydGV4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgVmVydGV4IGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW1ZlcnRleF1dXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tWZXJ0ZXhdXVxyXG4gICAqXHJcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIG9mZnNldCArPSAyXHJcbiAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcblxyXG4gICAgY29uc3QgaDogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgOClcclxuICAgIHRoaXMuaGVpZ2h0ID0gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4oaClcclxuICAgIG9mZnNldCArPSA4XHJcblxyXG4gICAgY29uc3QgZTogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIHRoaXMuZXBvY2ggPSBlLnJlYWRJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG5cclxuICAgIGNvbnN0IG5QSURzOiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgdGhpcy5udW1QYXJlbnRJRHMgPSBuUElEcy5yZWFkSW50MzJCRSgwKVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5udW1QYXJlbnRJRHM7IGkrKykge1xyXG4gICAgICBjb25zdCBwYXJlbnRJRDogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXHJcbiAgICAgIG9mZnNldCArPSAzMlxyXG4gICAgICB0aGlzLnBhcmVudElEcy5wdXNoKHBhcmVudElEKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5UeHM6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICB0aGlzLm51bVR4cyA9IG5UeHMucmVhZEludDMyQkUoMClcclxuICAgIC8vIGFjY291bnQgZm9yIHR4LXNpemUgYnl0ZXNcclxuICAgIG9mZnNldCArPSA4XHJcblxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMubnVtVHhzOyBpKyspIHtcclxuICAgICAgY29uc3QgdHg6IFR4ID0gbmV3IFR4KClcclxuICAgICAgb2Zmc2V0ICs9IHR4LmZyb21CdWZmZXIoYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCkpXHJcbiAgICAgIHRoaXMudHhzLnB1c2godHgpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGJ5dGVzLmJ5dGVMZW5ndGggPiBvZmZzZXQgJiYgYnl0ZXMuYnl0ZUxlbmd0aCAtIG9mZnNldCA+IDQpIHtcclxuICAgICAgY29uc3QgblJzOiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICB0aGlzLm51bVJlc3RyaWN0aW9ucyA9IG5Scy5yZWFkSW50MzJCRSgwKVxyXG4gICAgICBvZmZzZXQgKz0gNFxyXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5udW1SZXN0cmljdGlvbnM7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IHR4OiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcclxuICAgICAgICBvZmZzZXQgKz0gMzJcclxuICAgICAgICB0aGlzLnJlc3RyaWN0aW9ucy5wdXNoKHR4KVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1ZlcnRleF1dLlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBjb2RlYzogbnVtYmVyID0gdGhpcy5nZXRDb2RlY0lEKClcclxuICAgIGNvbnN0IGNvZGVjQnVmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMilcclxuICAgIGNvZGVjQnVmLndyaXRlVUludDE2QkUoY29kZWMsIDApXHJcblxyXG4gICAgY29uc3QgZXBvY2hCdWY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgZXBvY2hCdWYud3JpdGVJbnQzMkJFKHRoaXMuZXBvY2gsIDApXHJcblxyXG4gICAgY29uc3QgbnVtUGFyZW50SURzQnVmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIG51bVBhcmVudElEc0J1Zi53cml0ZUludDMyQkUodGhpcy5udW1QYXJlbnRJRHMsIDApXHJcbiAgICBsZXQgYmFycjogQnVmZmVyW10gPSBbXHJcbiAgICAgIGNvZGVjQnVmLFxyXG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCxcclxuICAgICAgYmludG9vbHMuZnJvbUJOVG9CdWZmZXIodGhpcy5oZWlnaHQsIDgpLFxyXG4gICAgICBlcG9jaEJ1ZixcclxuICAgICAgbnVtUGFyZW50SURzQnVmXHJcbiAgICBdXHJcbiAgICB0aGlzLnBhcmVudElEcy5mb3JFYWNoKChwYXJlbnRJRDogQnVmZmVyKTogdm9pZCA9PiB7XHJcbiAgICAgIGJhcnIucHVzaChwYXJlbnRJRClcclxuICAgIH0pXHJcblxyXG4gICAgY29uc3QgdHhzOiBUeFtdID0gdGhpcy5nZXRUeHMoKVxyXG4gICAgY29uc3QgbnVtVHhzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIG51bVR4cy53cml0ZVVJbnQzMkJFKHR4cy5sZW5ndGgsIDApXHJcbiAgICBiYXJyLnB1c2gobnVtVHhzKVxyXG5cclxuICAgIGxldCBzaXplOiBudW1iZXIgPSAwXHJcbiAgICBjb25zdCB0eFNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgdHhzLmZvckVhY2goKHR4OiBUeCk6IHZvaWQgPT4ge1xyXG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSB0eC50b0J1ZmZlcigpXHJcbiAgICAgIHNpemUgKz0gYi5ieXRlTGVuZ3RoXHJcbiAgICB9KVxyXG4gICAgdHhTaXplLndyaXRlVUludDMyQkUoc2l6ZSwgMClcclxuICAgIGJhcnIucHVzaCh0eFNpemUpXHJcblxyXG4gICAgdHhzLmZvckVhY2goKHR4OiBUeCk6IHZvaWQgPT4ge1xyXG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSB0eC50b0J1ZmZlcigpXHJcbiAgICAgIGJhcnIucHVzaChiKVxyXG4gICAgfSlcclxuXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyKVxyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBsZXQgdmVydGV4OiBWZXJ0ZXggPSBuZXcgVmVydGV4KClcclxuICAgIHZlcnRleC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiB2ZXJ0ZXggYXMgdGhpc1xyXG4gIH1cclxuICAvKipcclxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYSBWZXJ0ZXggd2hpY2ggaXMgYSBjb250YWluZXIgZm9yIEpWTSBUcmFuc2FjdGlvbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsLCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwsIGRlZmF1bHQgXCIyb1lNQk5WNGVOSHlxazJmampWNW5WUUxEYnRtTkp6cTVzM3FzM0xvNmZ0bkM2RkJ5TVwiXHJcbiAgICogQHBhcmFtIGhlaWdodCBPcHRpb25hbCwgZGVmYXVsdCBuZXcgQk4oMClcclxuICAgKiBAcGFyYW0gZXBvY2ggT3B0aW9uYWwsIGRlZmF1bHQgbmV3IEJOKDApXHJcbiAgICogQHBhcmFtIHBhcmVudElEcyBPcHRpb25hbCwgZGVmYXVsdCBbXVxyXG4gICAqIEBwYXJhbSB0eHMgT3B0aW9uYWwsIGRlZmF1bHQgW11cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb25zIE9wdGlvbmFsLCBkZWZhdWx0IFtdXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXHJcbiAgICBibG9ja2NoYWluSUQ6IHN0cmluZyA9IFwiMm9ZTUJOVjRlTkh5cWsyZmpqVjVuVlFMRGJ0bU5KenE1czNxczNMbzZmdG5DNkZCeU1cIixcclxuICAgIGhlaWdodDogQk4gPSBuZXcgQk4oMCksXHJcbiAgICBlcG9jaDogbnVtYmVyID0gMCxcclxuICAgIHBhcmVudElEczogQnVmZmVyW10gPSBbXSxcclxuICAgIHR4czogVHhbXSA9IFtdLFxyXG4gICAgcmVzdHJpY3Rpb25zOiBCdWZmZXJbXSA9IFtdXHJcbiAgKSB7XHJcbiAgICBzdXBlcigpXHJcbiAgICB0aGlzLm5ldHdvcmtJRCA9IG5ldHdvcmtJRFxyXG4gICAgdGhpcy5ibG9ja2NoYWluSUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5JRClcclxuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB0aGlzLmVwb2NoID0gZXBvY2hcclxuICAgIHRoaXMucGFyZW50SURzID0gcGFyZW50SURzXHJcbiAgICB0aGlzLm51bVBhcmVudElEcyA9IHBhcmVudElEcy5sZW5ndGhcclxuICAgIHRoaXMudHhzID0gdHhzXHJcbiAgICB0aGlzLm51bVR4cyA9IHR4cy5sZW5ndGhcclxuICAgIHRoaXMucmVzdHJpY3Rpb25zID0gcmVzdHJpY3Rpb25zXHJcbiAgICB0aGlzLm51bVJlc3RyaWN0aW9ucyA9IHJlc3RyaWN0aW9ucy5sZW5ndGhcclxuICB9XHJcbn1cclxuIl19