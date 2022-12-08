"use strict";
/**
 * @packageDocumentation
 * @module API-PlatformVM-ValidationTx
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddValidatorTx = exports.AddDelegatorTx = exports.WeightedValidatorTx = exports.ValidatorTx = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../../utils/bintools"));
const basetx_1 = require("./basetx");
const outputs_1 = require("../platformvm/outputs");
const buffer_1 = require("buffer/");
const constants_1 = require("./constants");
const constants_2 = require("../../utils/constants");
const helperfunctions_1 = require("../../utils/helperfunctions");
const outputs_2 = require("./outputs");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Abstract class representing an transactions with validation information.
 */
class ValidatorTx extends basetx_1.BaseTx {
    constructor(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "ValidatorTx";
        this._typeID = undefined;
        this.nodeID = buffer_1.Buffer.alloc(20);
        this.startTime = buffer_1.Buffer.alloc(8);
        this.endTime = buffer_1.Buffer.alloc(8);
        this.nodeID = nodeID;
        this.startTime = bintools.fromBNToBuffer(startTime, 8);
        this.endTime = bintools.fromBNToBuffer(endTime, 8);
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { nodeID: serialization.encoder(this.nodeID, encoding, "Buffer", "nodeID"), startTime: serialization.encoder(this.startTime, encoding, "Buffer", "decimalString"), endTime: serialization.encoder(this.endTime, encoding, "Buffer", "decimalString") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.nodeID = serialization.decoder(fields["nodeID"], encoding, "nodeID", "Buffer", 20);
        this.startTime = serialization.decoder(fields["startTime"], encoding, "decimalString", "Buffer", 8);
        this.endTime = serialization.decoder(fields["endTime"], encoding, "decimalString", "Buffer", 8);
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getNodeID() {
        return this.nodeID;
    }
    /**
     * Returns a string for the nodeID amount.
     */
    getNodeIDString() {
        return (0, helperfunctions_1.bufferToNodeIDString)(this.nodeID);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getStartTime() {
        return bintools.fromBufferToBN(this.startTime);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getEndTime() {
        return bintools.fromBufferToBN(this.endTime);
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.nodeID = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.startTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.endTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ValidatorTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = superbuff.length +
            this.nodeID.length +
            this.startTime.length +
            this.endTime.length;
        return buffer_1.Buffer.concat([superbuff, this.nodeID, this.startTime, this.endTime], bsize);
    }
}
exports.ValidatorTx = ValidatorTx;
class WeightedValidatorTx extends ValidatorTx {
    /**
     * Class representing an unsigned AddSubnetValidatorTx transaction.
     *
     * @param networkID Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainID Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
     * @param weight Optional. The amount of nJUNE the validator is staking.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, nodeID = undefined, startTime = undefined, endTime = undefined, weight = undefined) {
        super(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime);
        this._typeName = "WeightedValidatorTx";
        this._typeID = undefined;
        this.weight = buffer_1.Buffer.alloc(8);
        if (typeof weight !== undefined) {
            this.weight = bintools.fromBNToBuffer(weight, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { weight: serialization.encoder(this.weight, encoding, "Buffer", "decimalString") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.weight = serialization.decoder(fields["weight"], encoding, "decimalString", "Buffer", 8);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getWeight() {
        return bintools.fromBufferToBN(this.weight);
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getWeightBuffer() {
        return this.weight;
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.weight = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddSubnetValidatorTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        return buffer_1.Buffer.concat([superbuff, this.weight]);
    }
}
exports.WeightedValidatorTx = WeightedValidatorTx;
/**
 * Class representing an unsigned AddDelegatorTx transaction.
 */
class AddDelegatorTx extends WeightedValidatorTx {
    /**
     * Class representing an unsigned AddDelegatorTx transaction.
     *
     * @param networkID Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainID Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
     * @param stakeAmount Optional. The amount of nJUNE the validator is staking.
     * @param stakeOuts Optional. The outputs used in paying the stake.
     * @param rewardOwners Optional. The [[ParseableOutput]] containing a [[SECPOwnerOutput]] for the rewards.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, nodeID = undefined, startTime = undefined, endTime = undefined, stakeAmount = undefined, stakeOuts = undefined, rewardOwners = undefined) {
        super(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount);
        this._typeName = "AddDelegatorTx";
        this._typeID = constants_1.PlatformVMConstants.ADDDELEGATORTX;
        this.stakeOuts = [];
        this.rewardOwners = undefined;
        if (typeof stakeOuts !== undefined) {
            this.stakeOuts = stakeOuts;
        }
        this.rewardOwners = rewardOwners;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { stakeOuts: this.stakeOuts.map((s) => s.serialize(encoding)), rewardOwners: this.rewardOwners.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.stakeOuts = fields["stakeOuts"].map((s) => {
            let xferout = new outputs_1.TransferableOutput();
            xferout.deserialize(s, encoding);
            return xferout;
        });
        this.rewardOwners = new outputs_2.ParseableOutput();
        this.rewardOwners.deserialize(fields["rewardOwners"], encoding);
    }
    /**
     * Returns the id of the [[AddDelegatorTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getStakeAmount() {
        return this.getWeight();
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getStakeAmountBuffer() {
        return this.weight;
    }
    /**
     * Returns the array of outputs being staked.
     */
    getStakeOuts() {
        return this.stakeOuts;
    }
    /**
     * Should match stakeAmount. Used in sanity checking.
     */
    getStakeOutsTotal() {
        let val = new bn_js_1.default(0);
        for (let i = 0; i < this.stakeOuts.length; i++) {
            val = val.add(this.stakeOuts[`${i}`].getOutput().getAmount());
        }
        return val;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
     */
    getRewardOwners() {
        return this.rewardOwners;
    }
    getTotalOuts() {
        return [...this.getOuts(), ...this.getStakeOuts()];
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        const numstakeouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount = numstakeouts.readUInt32BE(0);
        this.stakeOuts = [];
        for (let i = 0; i < outcount; i++) {
            const xferout = new outputs_1.TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.stakeOuts.push(xferout);
        }
        this.rewardOwners = new outputs_2.ParseableOutput();
        offset = this.rewardOwners.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddDelegatorTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        let bsize = superbuff.length;
        const numouts = buffer_1.Buffer.alloc(4);
        numouts.writeUInt32BE(this.stakeOuts.length, 0);
        let barr = [super.toBuffer(), numouts];
        bsize += numouts.length;
        this.stakeOuts = this.stakeOuts.sort(outputs_1.TransferableOutput.comparator());
        for (let i = 0; i < this.stakeOuts.length; i++) {
            let out = this.stakeOuts[`${i}`].toBuffer();
            barr.push(out);
            bsize += out.length;
        }
        let ro = this.rewardOwners.toBuffer();
        barr.push(ro);
        bsize += ro.length;
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        let newbase = new AddDelegatorTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new AddDelegatorTx(...args);
    }
}
exports.AddDelegatorTx = AddDelegatorTx;
class AddValidatorTx extends AddDelegatorTx {
    /**
     * Class representing an unsigned AddValidatorTx transaction.
     *
     * @param networkID Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainID Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
     * @param stakeAmount Optional. The amount of nJUNE the validator is staking.
     * @param stakeOuts Optional. The outputs used in paying the stake.
     * @param rewardOwners Optional. The [[ParseableOutput]] containing the [[SECPOwnerOutput]] for the rewards.
     * @param delegationFee Optional. The percent fee this validator charges when others delegate stake to them.
     * Up to 4 decimal places allowed; additional decimal places are ignored. Must be between 0 and 100, inclusive.
     * For example, if delegationFeeRate is 1.2345 and someone delegates to this validator, then when the delegation
     * period is over, 1.2345% of the reward goes to the validator and the rest goes to the delegator.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, nodeID = undefined, startTime = undefined, endTime = undefined, stakeAmount = undefined, stakeOuts = undefined, rewardOwners = undefined, delegationFee = undefined) {
        super(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, rewardOwners);
        this._typeName = "AddValidatorTx";
        this._typeID = constants_1.PlatformVMConstants.ADDVALIDATORTX;
        this.delegationFee = 0;
        if (typeof delegationFee === "number") {
            if (delegationFee >= 0 && delegationFee <= 100) {
                this.delegationFee = parseFloat(delegationFee.toFixed(4));
            }
            else {
                throw new errors_1.DelegationFeeError("AddValidatorTx.constructor -- delegationFee must be in the range of 0 and 100, inclusively.");
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { delegationFee: serialization.encoder(this.getDelegationFeeBuffer(), encoding, "Buffer", "decimalString", 4) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let dbuff = serialization.decoder(fields["delegationFee"], encoding, "decimalString", "Buffer", 4);
        this.delegationFee =
            dbuff.readUInt32BE(0) / AddValidatorTx.delegatorMultiplier;
    }
    /**
     * Returns the id of the [[AddValidatorTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns the delegation fee (represents a percentage from 0 to 100);
     */
    getDelegationFee() {
        return this.delegationFee;
    }
    /**
     * Returns the binary representation of the delegation fee as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getDelegationFeeBuffer() {
        let dBuff = buffer_1.Buffer.alloc(4);
        let buffnum = parseFloat(this.delegationFee.toFixed(4)) *
            AddValidatorTx.delegatorMultiplier;
        dBuff.writeUInt32BE(buffnum, 0);
        return dBuff;
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        let dbuff = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.delegationFee =
            dbuff.readUInt32BE(0) / AddValidatorTx.delegatorMultiplier;
        return offset;
    }
    toBuffer() {
        let superBuff = super.toBuffer();
        let feeBuff = this.getDelegationFeeBuffer();
        return buffer_1.Buffer.concat([superBuff, feeBuff]);
    }
}
exports.AddValidatorTx = AddValidatorTx;
AddValidatorTx.delegatorMultiplier = 10000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbnR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS92YWxpZGF0aW9udHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsa0RBQXNCO0FBQ3RCLG9FQUEyQztBQUMzQyxxQ0FBaUM7QUFDakMsbURBQTBEO0FBRTFELG9DQUFnQztBQUNoQywyQ0FBaUQ7QUFDakQscURBQXdEO0FBQ3hELGlFQUFrRTtBQUNsRSx1Q0FBeUQ7QUFDekQsNkRBQTZFO0FBQzdFLCtDQUF1RDtBQUV2RDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFzQixXQUFZLFNBQVEsZUFBTTtJQTBHOUMsWUFDRSxTQUFpQixFQUNqQixZQUFvQixFQUNwQixJQUEwQixFQUMxQixHQUF3QixFQUN4QixJQUFhLEVBQ2IsTUFBZSxFQUNmLFNBQWMsRUFDZCxPQUFZO1FBRVosS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQW5IdkMsY0FBUyxHQUFHLGFBQWEsQ0FBQTtRQUN6QixZQUFPLEdBQUcsU0FBUyxDQUFBO1FBOENuQixXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNqQyxjQUFTLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNuQyxZQUFPLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQW1FekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNB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Q0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNuQyxJQUFJLE9BQU8sR0FDVCxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsY0FBYyxDQUFDLG1CQUFtQixDQUFBO1FBQ3BDLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQy9CLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFhLEVBQUUsU0FBaUIsQ0FBQztRQUMxQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDeEMsSUFBSSxLQUFLLEdBQVcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUNoRSxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLGFBQWE7WUFDaEIsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsbUJBQW1CLENBQUE7UUFDNUQsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QyxJQUFJLE9BQU8sR0FBVyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQTtRQUNuRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtJQUM1QyxDQUFDOztBQXhFSCx3Q0FrSUM7QUFuR2dCLGtDQUFtQixHQUFXLEtBQUssQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1WYWxpZGF0aW9uVHhcclxuICovXHJcblxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuL2Jhc2V0eFwiXHJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL291dHB1dHNcIlxyXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2lucHV0c1wiXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgYnVmZmVyVG9Ob2RlSURTdHJpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcclxuaW1wb3J0IHsgQW1vdW50T3V0cHV0LCBQYXJzZWFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcclxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5pbXBvcnQgeyBEZWxlZ2F0aW9uRmVlRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbi8qKlxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBBYnN0cmFjdCBjbGFzcyByZXByZXNlbnRpbmcgYW4gdHJhbnNhY3Rpb25zIHdpdGggdmFsaWRhdGlvbiBpbmZvcm1hdGlvbi5cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWYWxpZGF0b3JUeCBleHRlbmRzIEJhc2VUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVmFsaWRhdG9yVHhcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIG5vZGVJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMubm9kZUlELCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJub2RlSURcIiksXHJcbiAgICAgIHN0YXJ0VGltZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuc3RhcnRUaW1lLFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCJcclxuICAgICAgKSxcclxuICAgICAgZW5kVGltZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuZW5kVGltZSxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgdGhpcy5ub2RlSUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcIm5vZGVJRFwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIFwibm9kZUlEXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDIwXHJcbiAgICApXHJcbiAgICB0aGlzLnN0YXJ0VGltZSA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wic3RhcnRUaW1lXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDhcclxuICAgIClcclxuICAgIHRoaXMuZW5kVGltZSA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wiZW5kVGltZVwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxyXG4gICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICA4XHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgbm9kZUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMjApXHJcbiAgcHJvdGVjdGVkIHN0YXJ0VGltZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXHJcbiAgcHJvdGVjdGVkIGVuZFRpbWU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg4KVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBzdGFrZSBhbW91bnQuXHJcbiAgICovXHJcbiAgZ2V0Tm9kZUlEKCk6IEJ1ZmZlciB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2RlSURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgZm9yIHRoZSBub2RlSUQgYW1vdW50LlxyXG4gICAqL1xyXG4gIGdldE5vZGVJRFN0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGJ1ZmZlclRvTm9kZUlEU3RyaW5nKHRoaXMubm9kZUlEKVxyXG4gIH1cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBzdGFrZSBhbW91bnQuXHJcbiAgICovXHJcbiAgZ2V0U3RhcnRUaW1lKCkge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMuc3RhcnRUaW1lKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGZvciB0aGUgc3Rha2UgYW1vdW50LlxyXG4gICAqL1xyXG4gIGdldEVuZFRpbWUoKSB7XHJcbiAgICByZXR1cm4gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5lbmRUaW1lKVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgdGhpcy5ub2RlSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyMClcclxuICAgIG9mZnNldCArPSAyMFxyXG4gICAgdGhpcy5zdGFydFRpbWUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxyXG4gICAgb2Zmc2V0ICs9IDhcclxuICAgIHRoaXMuZW5kVGltZSA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXHJcbiAgICBvZmZzZXQgKz0gOFxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1ZhbGlkYXRvclR4XV0uXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxyXG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9XHJcbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggK1xyXG4gICAgICB0aGlzLm5vZGVJRC5sZW5ndGggK1xyXG4gICAgICB0aGlzLnN0YXJ0VGltZS5sZW5ndGggK1xyXG4gICAgICB0aGlzLmVuZFRpbWUubGVuZ3RoXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChcclxuICAgICAgW3N1cGVyYnVmZiwgdGhpcy5ub2RlSUQsIHRoaXMuc3RhcnRUaW1lLCB0aGlzLmVuZFRpbWVdLFxyXG4gICAgICBic2l6ZVxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxyXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10sXHJcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10sXHJcbiAgICBtZW1vPzogQnVmZmVyLFxyXG4gICAgbm9kZUlEPzogQnVmZmVyLFxyXG4gICAgc3RhcnRUaW1lPzogQk4sXHJcbiAgICBlbmRUaW1lPzogQk5cclxuICApIHtcclxuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXHJcbiAgICB0aGlzLm5vZGVJRCA9IG5vZGVJRFxyXG4gICAgdGhpcy5zdGFydFRpbWUgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihzdGFydFRpbWUsIDgpXHJcbiAgICB0aGlzLmVuZFRpbWUgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihlbmRUaW1lLCA4KVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFdlaWdodGVkVmFsaWRhdG9yVHggZXh0ZW5kcyBWYWxpZGF0b3JUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiV2VpZ2h0ZWRWYWxpZGF0b3JUeFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgd2VpZ2h0OiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy53ZWlnaHQsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMud2VpZ2h0ID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJ3ZWlnaHRcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgOFxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHdlaWdodDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHN0YWtlIGFtb3VudC5cclxuICAgKi9cclxuICBnZXRXZWlnaHQoKTogQk4ge1xyXG4gICAgcmV0dXJuIGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMud2VpZ2h0KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgc3Rha2UgYW1vdW50LlxyXG4gICAqL1xyXG4gIGdldFdlaWdodEJ1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHRoaXMud2VpZ2h0XHJcbiAgfVxyXG5cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICB0aGlzLndlaWdodCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXHJcbiAgICBvZmZzZXQgKz0gOFxyXG4gICAgcmV0dXJuIG9mZnNldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0uXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoW3N1cGVyYnVmZiwgdGhpcy53ZWlnaHRdKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEFkZFN1Ym5ldFZhbGlkYXRvclR4IHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbC4gTmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwuIEJsb2NrY2hhaW5pZCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxyXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsLiBBcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcclxuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsLiBBcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcclxuICAgKiBAcGFyYW0gbm9kZUlEIE9wdGlvbmFsLiBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxyXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgT3B0aW9uYWwuIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0YXJ0cyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsuXHJcbiAgICogQHBhcmFtIGVuZFRpbWUgT3B0aW9uYWwuIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBKVU5FIGlzIHJldHVybmVkKS5cclxuICAgKiBAcGFyYW0gd2VpZ2h0IE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIG5KVU5FIHRoZSB2YWxpZGF0b3IgaXMgc3Rha2luZy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXHJcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG5vZGVJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgc3RhcnRUaW1lOiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIGVuZFRpbWU6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgd2VpZ2h0OiBCTiA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbywgbm9kZUlELCBzdGFydFRpbWUsIGVuZFRpbWUpXHJcbiAgICBpZiAodHlwZW9mIHdlaWdodCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMud2VpZ2h0ID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIod2VpZ2h0LCA4KVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBBZGREZWxlZ2F0b3JUeCB0cmFuc2FjdGlvbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBBZGREZWxlZ2F0b3JUeCBleHRlbmRzIFdlaWdodGVkVmFsaWRhdG9yVHgge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkFkZERlbGVnYXRvclR4XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuQUREREVMRUdBVE9SVFhcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgc3Rha2VPdXRzOiB0aGlzLnN0YWtlT3V0cy5tYXAoKHMpID0+IHMuc2VyaWFsaXplKGVuY29kaW5nKSksXHJcbiAgICAgIHJld2FyZE93bmVyczogdGhpcy5yZXdhcmRPd25lcnMuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLnN0YWtlT3V0cyA9IGZpZWxkc1tcInN0YWtlT3V0c1wiXS5tYXAoKHM6IG9iamVjdCkgPT4ge1xyXG4gICAgICBsZXQgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXHJcbiAgICAgIHhmZXJvdXQuZGVzZXJpYWxpemUocywgZW5jb2RpbmcpXHJcbiAgICAgIHJldHVybiB4ZmVyb3V0XHJcbiAgICB9KVxyXG4gICAgdGhpcy5yZXdhcmRPd25lcnMgPSBuZXcgUGFyc2VhYmxlT3V0cHV0KClcclxuICAgIHRoaXMucmV3YXJkT3duZXJzLmRlc2VyaWFsaXplKGZpZWxkc1tcInJld2FyZE93bmVyc1wiXSwgZW5jb2RpbmcpXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3Rha2VPdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcbiAgcHJvdGVjdGVkIHJld2FyZE93bmVyczogUGFyc2VhYmxlT3V0cHV0ID0gdW5kZWZpbmVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0FkZERlbGVnYXRvclR4XV1cclxuICAgKi9cclxuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl90eXBlSURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHN0YWtlIGFtb3VudC5cclxuICAgKi9cclxuICBnZXRTdGFrZUFtb3VudCgpOiBCTiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRXZWlnaHQoKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgc3Rha2UgYW1vdW50LlxyXG4gICAqL1xyXG4gIGdldFN0YWtlQW1vdW50QnVmZmVyKCk6IEJ1ZmZlciB7XHJcbiAgICByZXR1cm4gdGhpcy53ZWlnaHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFycmF5IG9mIG91dHB1dHMgYmVpbmcgc3Rha2VkLlxyXG4gICAqL1xyXG4gIGdldFN0YWtlT3V0cygpOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdGFrZU91dHNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNob3VsZCBtYXRjaCBzdGFrZUFtb3VudC4gVXNlZCBpbiBzYW5pdHkgY2hlY2tpbmcuXHJcbiAgICovXHJcbiAgZ2V0U3Rha2VPdXRzVG90YWwoKTogQk4ge1xyXG4gICAgbGV0IHZhbDogQk4gPSBuZXcgQk4oMClcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLnN0YWtlT3V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YWwgPSB2YWwuYWRkKFxyXG4gICAgICAgICh0aGlzLnN0YWtlT3V0c1tgJHtpfWBdLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dCkuZ2V0QW1vdW50KClcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgcmV3YXJkIGFkZHJlc3MuXHJcbiAgICovXHJcbiAgZ2V0UmV3YXJkT3duZXJzKCk6IFBhcnNlYWJsZU91dHB1dCB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXdhcmRPd25lcnNcclxuICB9XHJcblxyXG4gIGdldFRvdGFsT3V0cygpOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSB7XHJcbiAgICByZXR1cm4gWy4uLih0aGlzLmdldE91dHMoKSBhcyBUcmFuc2ZlcmFibGVPdXRwdXRbXSksIC4uLnRoaXMuZ2V0U3Rha2VPdXRzKCldXHJcbiAgfVxyXG5cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICBjb25zdCBudW1zdGFrZW91dHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIGNvbnN0IG91dGNvdW50OiBudW1iZXIgPSBudW1zdGFrZW91dHMucmVhZFVJbnQzMkJFKDApXHJcbiAgICB0aGlzLnN0YWtlT3V0cyA9IFtdXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgb3V0Y291bnQ7IGkrKykge1xyXG4gICAgICBjb25zdCB4ZmVyb3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcclxuICAgICAgb2Zmc2V0ID0geGZlcm91dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICAgIHRoaXMuc3Rha2VPdXRzLnB1c2goeGZlcm91dClcclxuICAgIH1cclxuICAgIHRoaXMucmV3YXJkT3duZXJzID0gbmV3IFBhcnNlYWJsZU91dHB1dCgpXHJcbiAgICBvZmZzZXQgPSB0aGlzLnJld2FyZE93bmVycy5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbQWRkRGVsZWdhdG9yVHhdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHN1cGVyYnVmZi5sZW5ndGhcclxuICAgIGNvbnN0IG51bW91dHM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgbnVtb3V0cy53cml0ZVVJbnQzMkJFKHRoaXMuc3Rha2VPdXRzLmxlbmd0aCwgMClcclxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlci50b0J1ZmZlcigpLCBudW1vdXRzXVxyXG4gICAgYnNpemUgKz0gbnVtb3V0cy5sZW5ndGhcclxuICAgIHRoaXMuc3Rha2VPdXRzID0gdGhpcy5zdGFrZU91dHMuc29ydChUcmFuc2ZlcmFibGVPdXRwdXQuY29tcGFyYXRvcigpKVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuc3Rha2VPdXRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGxldCBvdXQ6IEJ1ZmZlciA9IHRoaXMuc3Rha2VPdXRzW2Ake2l9YF0udG9CdWZmZXIoKVxyXG4gICAgICBiYXJyLnB1c2gob3V0KVxyXG4gICAgICBic2l6ZSArPSBvdXQubGVuZ3RoXHJcbiAgICB9XHJcbiAgICBsZXQgcm86IEJ1ZmZlciA9IHRoaXMucmV3YXJkT3duZXJzLnRvQnVmZmVyKClcclxuICAgIGJhcnIucHVzaChybylcclxuICAgIGJzaXplICs9IHJvLmxlbmd0aFxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGxldCBuZXdiYXNlOiBBZGREZWxlZ2F0b3JUeCA9IG5ldyBBZGREZWxlZ2F0b3JUeCgpXHJcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxyXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IEFkZERlbGVnYXRvclR4KC4uLmFyZ3MpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBBZGREZWxlZ2F0b3JUeCB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwuIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsLiBCbG9ja2NoYWluaWQsIGRlZmF1bHQgQnVmZmVyLmFsbG9jKDMyLCAxNilcclxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbC4gQXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXHJcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbC4gQXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4ge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBtZW1vIGZpZWxkXHJcbiAgICogQHBhcmFtIG5vZGVJRCBPcHRpb25hbC4gVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cclxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIE9wdGlvbmFsLiBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxyXG4gICAqIEBwYXJhbSBlbmRUaW1lIE9wdGlvbmFsLiBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgSlVORSBpcyByZXR1cm5lZCkuXHJcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIG5KVU5FIHRoZSB2YWxpZGF0b3IgaXMgc3Rha2luZy5cclxuICAgKiBAcGFyYW0gc3Rha2VPdXRzIE9wdGlvbmFsLiBUaGUgb3V0cHV0cyB1c2VkIGluIHBheWluZyB0aGUgc3Rha2UuXHJcbiAgICogQHBhcmFtIHJld2FyZE93bmVycyBPcHRpb25hbC4gVGhlIFtbUGFyc2VhYmxlT3V0cHV0XV0gY29udGFpbmluZyBhIFtbU0VDUE93bmVyT3V0cHV0XV0gZm9yIHRoZSByZXdhcmRzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxyXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcclxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgbm9kZUlEOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBzdGFydFRpbWU6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgZW5kVGltZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBzdGFrZUFtb3VudDogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBzdGFrZU91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgcmV3YXJkT3duZXJzOiBQYXJzZWFibGVPdXRwdXQgPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgb3V0cyxcclxuICAgICAgaW5zLFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBub2RlSUQsXHJcbiAgICAgIHN0YXJ0VGltZSxcclxuICAgICAgZW5kVGltZSxcclxuICAgICAgc3Rha2VBbW91bnRcclxuICAgIClcclxuICAgIGlmICh0eXBlb2Ygc3Rha2VPdXRzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5zdGFrZU91dHMgPSBzdGFrZU91dHNcclxuICAgIH1cclxuICAgIHRoaXMucmV3YXJkT3duZXJzID0gcmV3YXJkT3duZXJzXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQWRkVmFsaWRhdG9yVHggZXh0ZW5kcyBBZGREZWxlZ2F0b3JUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQWRkVmFsaWRhdG9yVHhcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5BRERWQUxJREFUT1JUWFxyXG5cclxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xyXG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICBkZWxlZ2F0aW9uRmVlOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5nZXREZWxlZ2F0aW9uRmVlQnVmZmVyKCksXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgICA0XHJcbiAgICAgIClcclxuICAgIH1cclxuICB9XHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgbGV0IGRidWZmOiBCdWZmZXIgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImRlbGVnYXRpb25GZWVcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgNFxyXG4gICAgKVxyXG4gICAgdGhpcy5kZWxlZ2F0aW9uRmVlID1cclxuICAgICAgZGJ1ZmYucmVhZFVJbnQzMkJFKDApIC8gQWRkVmFsaWRhdG9yVHguZGVsZWdhdG9yTXVsdGlwbGllclxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGRlbGVnYXRpb25GZWU6IG51bWJlciA9IDBcclxuICBwcml2YXRlIHN0YXRpYyBkZWxlZ2F0b3JNdWx0aXBsaWVyOiBudW1iZXIgPSAxMDAwMFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tBZGRWYWxpZGF0b3JUeF1dXHJcbiAgICovXHJcbiAgZ2V0VHhUeXBlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBkZWxlZ2F0aW9uIGZlZSAocmVwcmVzZW50cyBhIHBlcmNlbnRhZ2UgZnJvbSAwIHRvIDEwMCk7XHJcbiAgICovXHJcbiAgZ2V0RGVsZWdhdGlvbkZlZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGlvbkZlZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYmluYXJ5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkZWxlZ2F0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxyXG4gICAqL1xyXG4gIGdldERlbGVnYXRpb25GZWVCdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGxldCBkQnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICBsZXQgYnVmZm51bTogbnVtYmVyID1cclxuICAgICAgcGFyc2VGbG9hdCh0aGlzLmRlbGVnYXRpb25GZWUudG9GaXhlZCg0KSkgKlxyXG4gICAgICBBZGRWYWxpZGF0b3JUeC5kZWxlZ2F0b3JNdWx0aXBsaWVyXHJcbiAgICBkQnVmZi53cml0ZVVJbnQzMkJFKGJ1ZmZudW0sIDApXHJcbiAgICByZXR1cm4gZEJ1ZmZcclxuICB9XHJcblxyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgIGxldCBkYnVmZjogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLmRlbGVnYXRpb25GZWUgPVxyXG4gICAgICBkYnVmZi5yZWFkVUludDMyQkUoMCkgLyBBZGRWYWxpZGF0b3JUeC5kZWxlZ2F0b3JNdWx0aXBsaWVyXHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgbGV0IHN1cGVyQnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxyXG4gICAgbGV0IGZlZUJ1ZmY6IEJ1ZmZlciA9IHRoaXMuZ2V0RGVsZWdhdGlvbkZlZUJ1ZmZlcigpXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbc3VwZXJCdWZmLCBmZWVCdWZmXSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBBZGRWYWxpZGF0b3JUeCB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwuIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsLiBCbG9ja2NoYWluaWQsIGRlZmF1bHQgQnVmZmVyLmFsbG9jKDMyLCAxNilcclxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbC4gQXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXHJcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbC4gQXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4ge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBtZW1vIGZpZWxkXHJcbiAgICogQHBhcmFtIG5vZGVJRCBPcHRpb25hbC4gVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cclxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIE9wdGlvbmFsLiBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxyXG4gICAqIEBwYXJhbSBlbmRUaW1lIE9wdGlvbmFsLiBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgSlVORSBpcyByZXR1cm5lZCkuXHJcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIG5KVU5FIHRoZSB2YWxpZGF0b3IgaXMgc3Rha2luZy5cclxuICAgKiBAcGFyYW0gc3Rha2VPdXRzIE9wdGlvbmFsLiBUaGUgb3V0cHV0cyB1c2VkIGluIHBheWluZyB0aGUgc3Rha2UuXHJcbiAgICogQHBhcmFtIHJld2FyZE93bmVycyBPcHRpb25hbC4gVGhlIFtbUGFyc2VhYmxlT3V0cHV0XV0gY29udGFpbmluZyB0aGUgW1tTRUNQT3duZXJPdXRwdXRdXSBmb3IgdGhlIHJld2FyZHMuXHJcbiAgICogQHBhcmFtIGRlbGVnYXRpb25GZWUgT3B0aW9uYWwuIFRoZSBwZXJjZW50IGZlZSB0aGlzIHZhbGlkYXRvciBjaGFyZ2VzIHdoZW4gb3RoZXJzIGRlbGVnYXRlIHN0YWtlIHRvIHRoZW0uXHJcbiAgICogVXAgdG8gNCBkZWNpbWFsIHBsYWNlcyBhbGxvd2VkOyBhZGRpdGlvbmFsIGRlY2ltYWwgcGxhY2VzIGFyZSBpZ25vcmVkLiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLCBpbmNsdXNpdmUuXHJcbiAgICogRm9yIGV4YW1wbGUsIGlmIGRlbGVnYXRpb25GZWVSYXRlIGlzIDEuMjM0NSBhbmQgc29tZW9uZSBkZWxlZ2F0ZXMgdG8gdGhpcyB2YWxpZGF0b3IsIHRoZW4gd2hlbiB0aGUgZGVsZWdhdGlvblxyXG4gICAqIHBlcmlvZCBpcyBvdmVyLCAxLjIzNDUlIG9mIHRoZSByZXdhcmQgZ29lcyB0byB0aGUgdmFsaWRhdG9yIGFuZCB0aGUgcmVzdCBnb2VzIHRvIHRoZSBkZWxlZ2F0b3IuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXHJcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxyXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBub2RlSUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIHN0YXJ0VGltZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBlbmRUaW1lOiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIHN0YWtlQW1vdW50OiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIHN0YWtlT3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXHJcbiAgICByZXdhcmRPd25lcnM6IFBhcnNlYWJsZU91dHB1dCA9IHVuZGVmaW5lZCxcclxuICAgIGRlbGVnYXRpb25GZWU6IG51bWJlciA9IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgc3VwZXIoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmxvY2tjaGFpbklELFxyXG4gICAgICBvdXRzLFxyXG4gICAgICBpbnMsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIG5vZGVJRCxcclxuICAgICAgc3RhcnRUaW1lLFxyXG4gICAgICBlbmRUaW1lLFxyXG4gICAgICBzdGFrZUFtb3VudCxcclxuICAgICAgc3Rha2VPdXRzLFxyXG4gICAgICByZXdhcmRPd25lcnNcclxuICAgIClcclxuICAgIGlmICh0eXBlb2YgZGVsZWdhdGlvbkZlZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICBpZiAoZGVsZWdhdGlvbkZlZSA+PSAwICYmIGRlbGVnYXRpb25GZWUgPD0gMTAwKSB7XHJcbiAgICAgICAgdGhpcy5kZWxlZ2F0aW9uRmVlID0gcGFyc2VGbG9hdChkZWxlZ2F0aW9uRmVlLnRvRml4ZWQoNCkpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IERlbGVnYXRpb25GZWVFcnJvcihcclxuICAgICAgICAgIFwiQWRkVmFsaWRhdG9yVHguY29uc3RydWN0b3IgLS0gZGVsZWdhdGlvbkZlZSBtdXN0IGJlIGluIHRoZSByYW5nZSBvZiAwIGFuZCAxMDAsIGluY2x1c2l2ZWx5LlwiXHJcbiAgICAgICAgKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==