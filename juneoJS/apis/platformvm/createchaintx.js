"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChainTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateChainTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const credentials_1 = require("../../common/credentials");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const _1 = require(".");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned CreateChainTx transaction.
 */
class CreateChainTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned CreateChain transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param subnetID Optional ID of the Subnet that validates this blockchain.
     * @param chainName Optional A human readable name for the chain; need not be unique
     * @param vmID Optional ID of the VM running on the new chain
     * @param fxIDs Optional IDs of the feature extensions running on the new chain
     * @param genesisData Optional Byte representation of genesis state of the new chain
     * @param chainAssetID Optional ID of the chain asset that is used to pay for the fees. None sets it to JUNE asset id
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, subnetID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined, chainAssetID = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "CreateChainTx";
        this._typeID = constants_1.PlatformVMConstants.CREATECHAINTX;
        this.subnetID = buffer_1.Buffer.alloc(32);
        this.chainName = "";
        this.vmID = buffer_1.Buffer.alloc(32);
        this.numFXIDs = buffer_1.Buffer.alloc(4);
        this.fxIDs = [];
        this.genesisData = buffer_1.Buffer.alloc(32);
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of subnet auth signers
        this.chainAssetID = buffer_1.Buffer.alloc(32);
        if (typeof subnetID != "undefined") {
            if (typeof subnetID === "string") {
                this.subnetID = bintools.cb58Decode(subnetID);
            }
            else {
                this.subnetID = subnetID;
            }
        }
        if (typeof chainName != "undefined") {
            this.chainName = chainName;
        }
        if (typeof vmID != "undefined") {
            const buf = buffer_1.Buffer.alloc(32);
            buf.write(vmID, 0, vmID.length);
            this.vmID = buf;
        }
        if (typeof fxIDs != "undefined") {
            this.numFXIDs.writeUInt32BE(fxIDs.length, 0);
            const fxIDBufs = [];
            fxIDs.forEach((fxID) => {
                const buf = buffer_1.Buffer.alloc(32);
                buf.write(fxID, 0, fxID.length, "utf8");
                fxIDBufs.push(buf);
            });
            this.fxIDs = fxIDBufs;
        }
        if (typeof genesisData != "undefined" && typeof genesisData != "string") {
            this.genesisData = genesisData.toBuffer();
        }
        else if (typeof genesisData == "string") {
            this.genesisData = buffer_1.Buffer.from(genesisData);
        }
        const subnetAuth = new _1.SubnetAuth();
        this.subnetAuth = subnetAuth;
        if (typeof chainAssetID != "undefined") {
            if (typeof chainAssetID === "string") {
                this.chainAssetID = bintools.cb58Decode(chainAssetID);
            }
            else {
                this.chainAssetID = chainAssetID;
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { subnetID: serialization.encoder(this.subnetID, encoding, "Buffer", "cb58"), chainAssetID: serialization.encoder(this.chainAssetID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.subnetID = serialization.decoder(fields["subnetID"], encoding, "cb58", "Buffer", 32);
        this.chainAssetID = serialization.decoder(fields["chainAssetID"], encoding, "cb58", "Buffer", 32);
    }
    /**
     * Returns the id of the [[CreateChainTx]]
     */
    getTxType() {
        return constants_1.PlatformVMConstants.CREATECHAINTX;
    }
    /**
     * Returns the subnetAuth
     */
    getSubnetAuth() {
        return this.subnetAuth;
    }
    /**
     * Returns the subnetID as a string
     */
    getSubnetID() {
        return bintools.cb58Encode(this.subnetID);
    }
    /**
     * Returns a string of the chainName
     */
    getChainName() {
        return this.chainName;
    }
    /**
     * Returns a Buffer of the vmID
     */
    getVMID() {
        return this.vmID;
    }
    /**
     * Returns an array of fxIDs as Buffers
     */
    getFXIDs() {
        return this.fxIDs;
    }
    /**
     * Returns a string of the genesisData
     */
    getGenesisData() {
        return bintools.cb58Encode(this.genesisData);
    }
    /**
     * Returns the chainAssetID as a string
     */
    getChainAssetID() {
        return bintools.cb58Encode(this.chainAssetID);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateChainTx]], parses it, populates the class, and returns the length of the [[CreateChainTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateChainTx]]
     *
     * @returns The length of the raw [[CreateChainTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.subnetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const chainNameSize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.chainName = bintools
            .copyFrom(bytes, offset, offset + chainNameSize)
            .toString("utf8");
        offset += chainNameSize;
        this.vmID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numFXIDs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const nfxids = parseInt(this.numFXIDs.toString("hex"), 10);
        for (let i = 0; i < nfxids; i++) {
            this.fxIDs.push(bintools.copyFrom(bytes, offset, offset + 32));
            offset += 32;
        }
        const genesisDataSize = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.genesisData = bintools.copyFrom(bytes, offset, offset + genesisDataSize);
        offset += genesisDataSize;
        const sa = new _1.SubnetAuth();
        offset += sa.fromBuffer(bintools.copyFrom(bytes, offset));
        this.subnetAuth = sa;
        this.chainAssetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateChainTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const chainNameBuff = buffer_1.Buffer.alloc(this.chainName.length);
        chainNameBuff.write(this.chainName, 0, this.chainName.length, "utf8");
        const chainNameSize = buffer_1.Buffer.alloc(2);
        chainNameSize.writeUIntBE(this.chainName.length, 0, 2);
        let bsize = superbuff.length +
            this.subnetID.length +
            chainNameSize.length +
            chainNameBuff.length +
            this.vmID.length +
            this.numFXIDs.length;
        const barr = [
            superbuff,
            this.subnetID,
            chainNameSize,
            chainNameBuff,
            this.vmID,
            this.numFXIDs
        ];
        this.fxIDs.forEach((fxID) => {
            bsize += fxID.length;
            barr.push(fxID);
        });
        bsize += 4;
        bsize += this.genesisData.length;
        const gdLength = buffer_1.Buffer.alloc(4);
        gdLength.writeUIntBE(this.genesisData.length, 0, 4);
        barr.push(gdLength);
        barr.push(this.genesisData);
        bsize += this.subnetAuth.toBuffer().length;
        barr.push(this.subnetAuth.toBuffer());
        bsize += 32;
        barr.push(this.chainAssetID);
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        const newCreateChainTx = new CreateChainTx();
        newCreateChainTx.fromBuffer(this.toBuffer());
        return newCreateChainTx;
    }
    create(...args) {
        return new CreateChainTx(...args);
    }
    /**
     * Creates and adds a [[SigIdx]] to the [[AddSubnetValidatorTx]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx(addressIdx, address) {
        const addressIndex = buffer_1.Buffer.alloc(4);
        addressIndex.writeUIntBE(addressIdx, 0, 4);
        this.subnetAuth.addAddressIndex(addressIndex);
        const sigidx = new credentials_1.SigIdx();
        const b = buffer_1.Buffer.alloc(4);
        b.writeUInt32BE(addressIdx, 0);
        sigidx.fromBuffer(b);
        sigidx.setSource(address);
        this.sigIdxs.push(sigidx);
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    /**
     * Returns the array of [[SigIdx]] for this [[Input]]
     */
    getSigIdxs() {
        return this.sigIdxs;
    }
    getCredentialID() {
        return constants_1.PlatformVMConstants.SECPCREDENTIAL;
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const creds = super.sign(msg, kc);
        const sigidxs = this.getSigIdxs();
        const cred = (0, _1.SelectCredentialClass)(this.getCredentialID());
        for (let i = 0; i < sigidxs.length; i++) {
            const keypair = kc.getKey(sigidxs[`${i}`].getSource());
            const signval = keypair.sign(msg);
            const sig = new credentials_1.Signature();
            sig.fromBuffer(signval);
            cred.addSignature(sig);
        }
        creds.push(cred);
        return creds;
    }
}
exports.CreateChainTx = CreateChainTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlY2hhaW50eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vY3JlYXRlY2hhaW50eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUFpRDtBQUdqRCwwREFBd0U7QUFDeEUscUNBQWlDO0FBQ2pDLHFEQUF3RDtBQUN4RCw2REFBNkU7QUFFN0Usd0JBQXFEO0FBR3JEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsYUFBYyxTQUFRLGVBQU07SUE4UXZDOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsV0FBNEIsU0FBUyxFQUNyQyxZQUFvQixTQUFTLEVBQzdCLE9BQWUsU0FBUyxFQUN4QixRQUFrQixTQUFTLEVBQzNCLGNBQW9DLFNBQVMsRUFDN0MsZUFBZ0MsU0FBUztRQUV6QyxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBelN2QyxjQUFTLEdBQUcsZUFBZSxDQUFBO1FBQzNCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxhQUFhLENBQUE7UUE0QjNDLGFBQVEsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLGNBQVMsR0FBVyxFQUFFLENBQUE7UUFDdEIsU0FBSSxHQUFXLGVBQU0sQ0FBQyxLQUFL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QUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE9BQU8sR0FBVyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sR0FBRyxHQUFjLElBQUksdUJBQVMsRUFBRSxDQUFBO1lBQ3RDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDdkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUN2QjtRQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEIsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBeUVGO0FBclZELHNDQXFWQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1DcmVhdGVDaGFpblR4XHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXHJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcclxuaW1wb3J0IHsgQ3JlZGVudGlhbCwgU2lnSWR4LCBTaWduYXR1cmUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcclxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcbmltcG9ydCB7IEdlbmVzaXNEYXRhIH0gZnJvbSBcIi4uL2p2bVwiXHJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcywgU3VibmV0QXV0aCB9IGZyb20gXCIuXCJcclxuaW1wb3J0IHsgS2V5Q2hhaW4sIEtleVBhaXIgfSBmcm9tIFwiLi9rZXljaGFpblwiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIENyZWF0ZUNoYWluVHggdHJhbnNhY3Rpb24uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQ3JlYXRlQ2hhaW5UeCBleHRlbmRzIEJhc2VUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQ3JlYXRlQ2hhaW5UeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkNSRUFURUNIQUlOVFhcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgc3VibmV0SUQ6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLnN1Ym5ldElELCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJjYjU4XCIpLFxyXG4gICAgICBjaGFpbkFzc2V0SUQ6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLmNoYWluQXNzZXRJRCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLnN1Ym5ldElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJzdWJuZXRJRFwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIFwiY2I1OFwiLFxyXG4gICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAzMlxyXG4gICAgKVxyXG4gICAgdGhpcy5jaGFpbkFzc2V0SUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImNoYWluQXNzZXRJRFwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIFwiY2I1OFwiLFxyXG4gICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAzMlxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHN1Ym5ldElEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXHJcbiAgcHJvdGVjdGVkIGNoYWluTmFtZTogc3RyaW5nID0gXCJcIlxyXG4gIHByb3RlY3RlZCB2bUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXHJcbiAgcHJvdGVjdGVkIG51bUZYSURzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgZnhJRHM6IEJ1ZmZlcltdID0gW11cclxuICBwcm90ZWN0ZWQgZ2VuZXNpc0RhdGE6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcclxuICBwcm90ZWN0ZWQgc3VibmV0QXV0aDogU3VibmV0QXV0aFxyXG4gIHByb3RlY3RlZCBzaWdDb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgcHJvdGVjdGVkIHNpZ0lkeHM6IFNpZ0lkeFtdID0gW10gLy8gaWR4cyBvZiBzdWJuZXQgYXV0aCBzaWduZXJzXHJcbiAgcHJvdGVjdGVkIGNoYWluQXNzZXRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tDcmVhdGVDaGFpblR4XV1cclxuICAgKi9cclxuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBQbGF0Zm9ybVZNQ29uc3RhbnRzLkNSRUFURUNIQUlOVFhcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHN1Ym5ldEF1dGhcclxuICAgKi9cclxuICBnZXRTdWJuZXRBdXRoKCk6IFN1Ym5ldEF1dGgge1xyXG4gICAgcmV0dXJuIHRoaXMuc3VibmV0QXV0aFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3VibmV0SUQgYXMgYSBzdHJpbmdcclxuICAgKi9cclxuICBnZXRTdWJuZXRJRCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5zdWJuZXRJRClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgb2YgdGhlIGNoYWluTmFtZVxyXG4gICAqL1xyXG4gIGdldENoYWluTmFtZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuY2hhaW5OYW1lXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgQnVmZmVyIG9mIHRoZSB2bUlEXHJcbiAgICovXHJcbiAgZ2V0Vk1JRCgpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHRoaXMudm1JRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBmeElEcyBhcyBCdWZmZXJzXHJcbiAgICovXHJcbiAgZ2V0RlhJRHMoKTogQnVmZmVyW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZnhJRHNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgb2YgdGhlIGdlbmVzaXNEYXRhXHJcbiAgICovXHJcbiAgZ2V0R2VuZXNpc0RhdGEoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMuZ2VuZXNpc0RhdGEpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjaGFpbkFzc2V0SUQgYXMgYSBzdHJpbmdcclxuICAgKi9cclxuICBnZXRDaGFpbkFzc2V0SUQoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMuY2hhaW5Bc3NldElEKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbQ3JlYXRlQ2hhaW5UeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbQ3JlYXRlQ2hhaW5UeF1dIGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0NyZWF0ZUNoYWluVHhdXVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQ3JlYXRlQ2hhaW5UeF1dXHJcbiAgICpcclxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXHJcbiAgICovXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgdGhpcy5zdWJuZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcblxyXG4gICAgY29uc3QgY2hhaW5OYW1lU2l6ZTogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIpXHJcbiAgICAgIC5yZWFkVUludDE2QkUoMClcclxuICAgIG9mZnNldCArPSAyXHJcblxyXG4gICAgdGhpcy5jaGFpbk5hbWUgPSBiaW50b29sc1xyXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgY2hhaW5OYW1lU2l6ZSlcclxuICAgICAgLnRvU3RyaW5nKFwidXRmOFwiKVxyXG4gICAgb2Zmc2V0ICs9IGNoYWluTmFtZVNpemVcclxuXHJcbiAgICB0aGlzLnZtSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcclxuICAgIG9mZnNldCArPSAzMlxyXG5cclxuICAgIHRoaXMubnVtRlhJRHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuXHJcbiAgICBjb25zdCBuZnhpZHM6IG51bWJlciA9IHBhcnNlSW50KHRoaXMubnVtRlhJRHMudG9TdHJpbmcoXCJoZXhcIiksIDEwKVxyXG5cclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBuZnhpZHM7IGkrKykge1xyXG4gICAgICB0aGlzLmZ4SURzLnB1c2goYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpKVxyXG4gICAgICBvZmZzZXQgKz0gMzJcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBnZW5lc2lzRGF0YVNpemU6IG51bWJlciA9IGJpbnRvb2xzXHJcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgICAucmVhZFVJbnQzMkJFKDApXHJcbiAgICBvZmZzZXQgKz0gNFxyXG5cclxuICAgIHRoaXMuZ2VuZXNpc0RhdGEgPSBiaW50b29scy5jb3B5RnJvbShcclxuICAgICAgYnl0ZXMsXHJcbiAgICAgIG9mZnNldCxcclxuICAgICAgb2Zmc2V0ICsgZ2VuZXNpc0RhdGFTaXplXHJcbiAgICApXHJcbiAgICBvZmZzZXQgKz0gZ2VuZXNpc0RhdGFTaXplXHJcblxyXG4gICAgY29uc3Qgc2E6IFN1Ym5ldEF1dGggPSBuZXcgU3VibmV0QXV0aCgpXHJcbiAgICBvZmZzZXQgKz0gc2EuZnJvbUJ1ZmZlcihiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0KSlcclxuXHJcbiAgICB0aGlzLnN1Ym5ldEF1dGggPSBzYVxyXG5cclxuICAgIHRoaXMuY2hhaW5Bc3NldElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXHJcbiAgICBvZmZzZXQgKz0gMzJcclxuXHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbQ3JlYXRlQ2hhaW5UeF1dLlxyXG4gICAqL1xyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcclxuXHJcbiAgICBjb25zdCBjaGFpbk5hbWVCdWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5jaGFpbk5hbWUubGVuZ3RoKVxyXG4gICAgY2hhaW5OYW1lQnVmZi53cml0ZSh0aGlzLmNoYWluTmFtZSwgMCwgdGhpcy5jaGFpbk5hbWUubGVuZ3RoLCBcInV0ZjhcIilcclxuICAgIGNvbnN0IGNoYWluTmFtZVNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxyXG4gICAgY2hhaW5OYW1lU2l6ZS53cml0ZVVJbnRCRSh0aGlzLmNoYWluTmFtZS5sZW5ndGgsIDAsIDIpXHJcblxyXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPVxyXG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICtcclxuICAgICAgdGhpcy5zdWJuZXRJRC5sZW5ndGggK1xyXG4gICAgICBjaGFpbk5hbWVTaXplLmxlbmd0aCArXHJcbiAgICAgIGNoYWluTmFtZUJ1ZmYubGVuZ3RoICtcclxuICAgICAgdGhpcy52bUlELmxlbmd0aCArXHJcbiAgICAgIHRoaXMubnVtRlhJRHMubGVuZ3RoXHJcblxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXHJcbiAgICAgIHN1cGVyYnVmZixcclxuICAgICAgdGhpcy5zdWJuZXRJRCxcclxuICAgICAgY2hhaW5OYW1lU2l6ZSxcclxuICAgICAgY2hhaW5OYW1lQnVmZixcclxuICAgICAgdGhpcy52bUlELFxyXG4gICAgICB0aGlzLm51bUZYSURzXHJcbiAgICBdXHJcblxyXG4gICAgdGhpcy5meElEcy5mb3JFYWNoKChmeElEOiBCdWZmZXIpOiB2b2lkID0+IHtcclxuICAgICAgYnNpemUgKz0gZnhJRC5sZW5ndGhcclxuICAgICAgYmFyci5wdXNoKGZ4SUQpXHJcbiAgICB9KVxyXG5cclxuICAgIGJzaXplICs9IDRcclxuICAgIGJzaXplICs9IHRoaXMuZ2VuZXNpc0RhdGEubGVuZ3RoXHJcbiAgICBjb25zdCBnZExlbmd0aDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBnZExlbmd0aC53cml0ZVVJbnRCRSh0aGlzLmdlbmVzaXNEYXRhLmxlbmd0aCwgMCwgNClcclxuICAgIGJhcnIucHVzaChnZExlbmd0aClcclxuICAgIGJhcnIucHVzaCh0aGlzLmdlbmVzaXNEYXRhKVxyXG5cclxuICAgIGJzaXplICs9IHRoaXMuc3VibmV0QXV0aC50b0J1ZmZlcigpLmxlbmd0aFxyXG4gICAgYmFyci5wdXNoKHRoaXMuc3VibmV0QXV0aC50b0J1ZmZlcigpKVxyXG5cclxuICAgIGJzaXplICs9IDMyXHJcbiAgICBiYXJyLnB1c2godGhpcy5jaGFpbkFzc2V0SUQpXHJcblxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGNvbnN0IG5ld0NyZWF0ZUNoYWluVHg6IENyZWF0ZUNoYWluVHggPSBuZXcgQ3JlYXRlQ2hhaW5UeCgpXHJcbiAgICBuZXdDcmVhdGVDaGFpblR4LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld0NyZWF0ZUNoYWluVHggYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IENyZWF0ZUNoYWluVHgoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbmQgYWRkcyBhIFtbU2lnSWR4XV0gdG8gdGhlIFtbQWRkU3VibmV0VmFsaWRhdG9yVHhdXS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcclxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBvZiB0aGUgc291cmNlIG9mIHRoZSBzaWduYXR1cmVcclxuICAgKi9cclxuICBhZGRTaWduYXR1cmVJZHgoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpOiB2b2lkIHtcclxuICAgIGNvbnN0IGFkZHJlc3NJbmRleDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBhZGRyZXNzSW5kZXgud3JpdGVVSW50QkUoYWRkcmVzc0lkeCwgMCwgNClcclxuICAgIHRoaXMuc3VibmV0QXV0aC5hZGRBZGRyZXNzSW5kZXgoYWRkcmVzc0luZGV4KVxyXG5cclxuICAgIGNvbnN0IHNpZ2lkeDogU2lnSWR4ID0gbmV3IFNpZ0lkeCgpXHJcbiAgICBjb25zdCBiOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIGIud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxyXG4gICAgc2lnaWR4LmZyb21CdWZmZXIoYilcclxuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcylcclxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcclxuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW0lucHV0XV1cclxuICAgKi9cclxuICBnZXRTaWdJZHhzKCk6IFNpZ0lkeFtdIHtcclxuICAgIHJldHVybiB0aGlzLnNpZ0lkeHNcclxuICB9XHJcblxyXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUxcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSBtc2cgQSBCdWZmZXIgZm9yIHRoZSBbW1Vuc2lnbmVkVHhdXVxyXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcclxuICAgKi9cclxuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xyXG4gICAgY29uc3QgY3JlZHM6IENyZWRlbnRpYWxbXSA9IHN1cGVyLnNpZ24obXNnLCBrYylcclxuICAgIGNvbnN0IHNpZ2lkeHM6IFNpZ0lkeFtdID0gdGhpcy5nZXRTaWdJZHhzKClcclxuICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3ModGhpcy5nZXRDcmVkZW50aWFsSUQoKSlcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzaWdpZHhzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkoc2lnaWR4c1tgJHtpfWBdLmdldFNvdXJjZSgpKVxyXG4gICAgICBjb25zdCBzaWdudmFsOiBCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKVxyXG4gICAgICBjb25zdCBzaWc6IFNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKVxyXG4gICAgICBzaWcuZnJvbUJ1ZmZlcihzaWdudmFsKVxyXG4gICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpXHJcbiAgICB9XHJcbiAgICBjcmVkcy5wdXNoKGNyZWQpXHJcbiAgICByZXR1cm4gY3JlZHNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBDcmVhdGVDaGFpbiB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXHJcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXHJcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxyXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbCBJRCBvZiB0aGUgU3VibmV0IHRoYXQgdmFsaWRhdGVzIHRoaXMgYmxvY2tjaGFpbi5cclxuICAgKiBAcGFyYW0gY2hhaW5OYW1lIE9wdGlvbmFsIEEgaHVtYW4gcmVhZGFibGUgbmFtZSBmb3IgdGhlIGNoYWluOyBuZWVkIG5vdCBiZSB1bmlxdWVcclxuICAgKiBAcGFyYW0gdm1JRCBPcHRpb25hbCBJRCBvZiB0aGUgVk0gcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXHJcbiAgICogQHBhcmFtIGZ4SURzIE9wdGlvbmFsIElEcyBvZiB0aGUgZmVhdHVyZSBleHRlbnNpb25zIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxyXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBPcHRpb25hbCBCeXRlIHJlcHJlc2VudGF0aW9uIG9mIGdlbmVzaXMgc3RhdGUgb2YgdGhlIG5ldyBjaGFpblxyXG4gICAqIEBwYXJhbSBjaGFpbkFzc2V0SUQgT3B0aW9uYWwgSUQgb2YgdGhlIGNoYWluIGFzc2V0IHRoYXQgaXMgdXNlZCB0byBwYXkgZm9yIHRoZSBmZWVzLiBOb25lIHNldHMgaXQgdG8gSlVORSBhc3NldCBpZFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxyXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcclxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgc3VibmV0SUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGNoYWluTmFtZTogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgdm1JRDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgZnhJRHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxyXG4gICAgZ2VuZXNpc0RhdGE6IHN0cmluZyB8IEdlbmVzaXNEYXRhID0gdW5kZWZpbmVkLFxyXG4gICAgY2hhaW5Bc3NldElEOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXHJcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEICE9IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIHRoaXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKHN1Ym5ldElEKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3VibmV0SUQgPSBzdWJuZXRJRFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGNoYWluTmFtZSAhPSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMuY2hhaW5OYW1lID0gY2hhaW5OYW1lXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZtSUQgIT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBjb25zdCBidWY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcclxuICAgICAgYnVmLndyaXRlKHZtSUQsIDAsIHZtSUQubGVuZ3RoKVxyXG4gICAgICB0aGlzLnZtSUQgPSBidWZcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgZnhJRHMgIT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLm51bUZYSURzLndyaXRlVUludDMyQkUoZnhJRHMubGVuZ3RoLCAwKVxyXG4gICAgICBjb25zdCBmeElEQnVmczogQnVmZmVyW10gPSBbXVxyXG4gICAgICBmeElEcy5mb3JFYWNoKChmeElEOiBzdHJpbmcpOiB2b2lkID0+IHtcclxuICAgICAgICBjb25zdCBidWY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcclxuICAgICAgICBidWYud3JpdGUoZnhJRCwgMCwgZnhJRC5sZW5ndGgsIFwidXRmOFwiKVxyXG4gICAgICAgIGZ4SURCdWZzLnB1c2goYnVmKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmZ4SURzID0gZnhJREJ1ZnNcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgZ2VuZXNpc0RhdGEgIT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgZ2VuZXNpc0RhdGEgIT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB0aGlzLmdlbmVzaXNEYXRhID0gZ2VuZXNpc0RhdGEudG9CdWZmZXIoKVxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZ2VuZXNpc0RhdGEgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB0aGlzLmdlbmVzaXNEYXRhID0gQnVmZmVyLmZyb20oZ2VuZXNpc0RhdGEpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3VibmV0QXV0aDogU3VibmV0QXV0aCA9IG5ldyBTdWJuZXRBdXRoKClcclxuICAgIHRoaXMuc3VibmV0QXV0aCA9IHN1Ym5ldEF1dGhcclxuICAgIFxyXG4gICAgaWYgKHR5cGVvZiBjaGFpbkFzc2V0SUQgIT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBpZiAodHlwZW9mIGNoYWluQXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIHRoaXMuY2hhaW5Bc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShjaGFpbkFzc2V0SUQpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5jaGFpbkFzc2V0SUQgPSBjaGFpbkFzc2V0SURcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=