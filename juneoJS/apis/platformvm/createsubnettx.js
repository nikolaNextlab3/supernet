"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSubnetTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateSubnetTx
 */
const buffer_1 = require("buffer/");
const basetx_1 = require("./basetx");
const constants_1 = require("./constants");
const constants_2 = require("../../utils/constants");
const outputs_1 = require("./outputs");
const errors_1 = require("../../utils/errors");
class CreateSubnetTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Create Subnet transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param subnetOwners Optional [[SECPOwnerOutput]] class for specifying who owns the subnet.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, subnetOwners = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "CreateSubnetTx";
        this._typeID = constants_1.PlatformVMConstants.CREATESUBNETTX;
        this.subnetOwners = undefined;
        this.subnetOwners = subnetOwners;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { subnetOwners: this.subnetOwners.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.subnetOwners = new outputs_1.SECPOwnerOutput();
        this.subnetOwners.deserialize(fields["subnetOwners"], encoding);
    }
    /**
     * Returns the id of the [[CreateSubnetTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
     */
    getSubnetOwners() {
        return this.subnetOwners;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateSubnetTx]], parses it, populates the class, and returns the length of the [[CreateSubnetTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateSubnetTx]]
     * @param offset A number for the starting position in the bytes.
     *
     * @returns The length of the raw [[CreateSubnetTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        offset += 4;
        this.subnetOwners = new outputs_1.SECPOwnerOutput();
        offset = this.subnetOwners.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateSubnetTx]].
     */
    toBuffer() {
        if (typeof this.subnetOwners === "undefined" ||
            !(this.subnetOwners instanceof outputs_1.SECPOwnerOutput)) {
            throw new errors_1.SubnetOwnerError("CreateSubnetTx.toBuffer -- this.subnetOwners is not a SECPOwnerOutput");
        }
        let typeID = buffer_1.Buffer.alloc(4);
        typeID.writeUInt32BE(this.subnetOwners.getOutputID(), 0);
        let barr = [
            super.toBuffer(),
            typeID,
            this.subnetOwners.toBuffer()
        ];
        return buffer_1.Buffer.concat(barr);
    }
}
exports.CreateSubnetTx = CreateSubnetTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlc3VibmV0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2NyZWF0ZXN1Ym5ldHR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxxQ0FBaUM7QUFDakMsMkNBQWlEO0FBQ2pELHFEQUF3RDtBQUN4RCx1Q0FBK0Q7QUFHL0QsK0NBQXFEO0FBRXJELE1BQWEsY0FBZSxTQUFRLGVBQU07SUF5RXhDOzs7Ozs7Ozs7T0FTRztJQUNILFlBQ0UsWUFBb0IsNEJBQWdCLEVBQ3BDLGVBQXVCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMzQyxPQUE2QixTQUFTLEVBQ3RDLE1BQTJCLFNBQVMsRUFDcEMsT0FBZSxTQUFTLEVBQ3hCLGVBQWdDLFNBQVM7UUFFekMsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQTFGdkMsY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxjQUFjLENBQUE7UUFlNUMsaUJBQVksR0FBb0IsU0FBUyxDQUFBO1FBMkVqRCxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQTtJQUNsQyxDQUFDO0lBekZELFNBQVMsQ0FBQyxXQUErQixLQUFLO1FBQzVDLElBQUksTUFBTSxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDOUMsdUNBQ0ssTUFBTSxLQUNULFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFDcEQ7SUFDSCxDQUFDO0lBQ0QsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSx5QkFBZSxFQUFFLENBQUE7UUFDekMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ2pFLENBQUM7SUFJRDs7T0FFRztJQUNILFNBQVM7UUFDUCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUE7SUFDckIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsZUFBZTtRQUNiLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUMxQixDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUN4QyxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLHlCQUFlLEVBQUUsQ0FBQTtRQUN6QyxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3BELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLElBQ0UsT0FBTyxJQUFJLENBQUMsWUFBWSxLQUFLLFdBQVc7WUFDeEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLFlBQVkseUJBQWUsQ0FBQyxFQUMvQztZQUNBLE1BQU0sSUFBSSx5QkFBZ0IsQ0FDeEIsdUVBQXVFLENBQ3hFLENBQUE7U0FDRjtRQUNELElBQUksTUFBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDcEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3hELElBQUksSUFBSSxHQUFhO1lBQ25CLEtBQUssQ0FBQyxRQUFRLEVBQUU7WUFDaEIsTUFBTTtZQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1NBQzdCLENBQUE7UUFDRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDNUIsQ0FBQztDQXVCRjtBQTlGRCx3Q0E4RkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tQ3JlYXRlU3VibmV0VHhcclxuICovXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcclxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0LCBTRUNQT3duZXJPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcclxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXHJcbmltcG9ydCB7IFN1Ym5ldE93bmVyRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBDcmVhdGVTdWJuZXRUeCBleHRlbmRzIEJhc2VUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQ3JlYXRlU3VibmV0VHhcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5DUkVBVEVTVUJORVRUWFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBzdWJuZXRPd25lcnM6IHRoaXMuc3VibmV0T3duZXJzLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5zdWJuZXRPd25lcnMgPSBuZXcgU0VDUE93bmVyT3V0cHV0KClcclxuICAgIHRoaXMuc3VibmV0T3duZXJzLmRlc2VyaWFsaXplKGZpZWxkc1tcInN1Ym5ldE93bmVyc1wiXSwgZW5jb2RpbmcpXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3VibmV0T3duZXJzOiBTRUNQT3duZXJPdXRwdXQgPSB1bmRlZmluZWRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbQ3JlYXRlU3VibmV0VHhdXVxyXG4gICAqL1xyXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgcmV3YXJkIGFkZHJlc3MuXHJcbiAgICovXHJcbiAgZ2V0U3VibmV0T3duZXJzKCk6IFNFQ1BPd25lck91dHB1dCB7XHJcbiAgICByZXR1cm4gdGhpcy5zdWJuZXRPd25lcnNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0NyZWF0ZVN1Ym5ldFR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tDcmVhdGVTdWJuZXRUeF1dIGluIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0NyZWF0ZVN1Ym5ldFR4XV1cclxuICAgKiBAcGFyYW0gb2Zmc2V0IEEgbnVtYmVyIGZvciB0aGUgc3RhcnRpbmcgcG9zaXRpb24gaW4gdGhlIGJ5dGVzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQ3JlYXRlU3VibmV0VHhdXVxyXG4gICAqXHJcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLnN1Ym5ldE93bmVycyA9IG5ldyBTRUNQT3duZXJPdXRwdXQoKVxyXG4gICAgb2Zmc2V0ID0gdGhpcy5zdWJuZXRPd25lcnMuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0NyZWF0ZVN1Ym5ldFR4XV0uXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGlmIChcclxuICAgICAgdHlwZW9mIHRoaXMuc3VibmV0T3duZXJzID09PSBcInVuZGVmaW5lZFwiIHx8XHJcbiAgICAgICEodGhpcy5zdWJuZXRPd25lcnMgaW5zdGFuY2VvZiBTRUNQT3duZXJPdXRwdXQpXHJcbiAgICApIHtcclxuICAgICAgdGhyb3cgbmV3IFN1Ym5ldE93bmVyRXJyb3IoXHJcbiAgICAgICAgXCJDcmVhdGVTdWJuZXRUeC50b0J1ZmZlciAtLSB0aGlzLnN1Ym5ldE93bmVycyBpcyBub3QgYSBTRUNQT3duZXJPdXRwdXRcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBsZXQgdHlwZUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICAgIHR5cGVJRC53cml0ZVVJbnQzMkJFKHRoaXMuc3VibmV0T3duZXJzLmdldE91dHB1dElEKCksIDApXHJcbiAgICBsZXQgYmFycjogQnVmZmVyW10gPSBbXHJcbiAgICAgIHN1cGVyLnRvQnVmZmVyKCksXHJcbiAgICAgIHR5cGVJRCxcclxuICAgICAgdGhpcy5zdWJuZXRPd25lcnMudG9CdWZmZXIoKVxyXG4gICAgXVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycilcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBDcmVhdGUgU3VibmV0IHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXHJcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBPcHRpb25hbCBibG9ja2NoYWluSUQsIGRlZmF1bHQgQnVmZmVyLmFsbG9jKDMyLCAxNilcclxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcclxuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXHJcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBtZW1vIGZpZWxkXHJcbiAgICogQHBhcmFtIHN1Ym5ldE93bmVycyBPcHRpb25hbCBbW1NFQ1BPd25lck91dHB1dF1dIGNsYXNzIGZvciBzcGVjaWZ5aW5nIHdobyBvd25zIHRoZSBzdWJuZXQuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXHJcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxyXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBzdWJuZXRPd25lcnM6IFNFQ1BPd25lck91dHB1dCA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbylcclxuICAgIHRoaXMuc3VibmV0T3duZXJzID0gc3VibmV0T3duZXJzXHJcbiAgfVxyXG59XHJcbiJdfQ==