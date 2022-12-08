"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../../common/utxos");
const constants_1 = require("./constants");
const tx_1 = require("./tx");
const exporttx_1 = require("../platformvm/exporttx");
const constants_2 = require("../../utils/constants");
const importtx_1 = require("../platformvm/importtx");
const basetx_1 = require("../platformvm/basetx");
const assetamount_1 = require("../../common/assetamount");
const validationtx_1 = require("./validationtx");
const createsubnettx_1 = require("./createsubnettx");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const _1 = require(".");
const addsubnetvalidatortx_1 = require("../platformvm/addsubnetvalidatortx");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single UTXO.
 */
class UTXO extends utxos_1.StandardUTXO {
    constructor() {
        super(...arguments);
        this._typeName = "UTXO";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = (0, outputs_1.SelectOutputClass)(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.codecID = bintools.copyFrom(bytes, offset, offset + 2);
        offset += 2;
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, outputs_1.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
    /**
     * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
     *
     * @param serialized A base-58 string containing a raw [[UTXO]]
     *
     * @returns The length of the raw [[UTXO]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
    fromString(serialized) {
        /* istanbul ignore next */
        return this.fromBuffer(bintools.cb58Decode(serialized));
    }
    /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString() {
        /* istanbul ignore next */
        return bintools.cb58Encode(this.toBuffer());
    }
    clone() {
        const utxo = new UTXO();
        utxo.fromBuffer(this.toBuffer());
        return utxo;
    }
    create(codecID = constants_1.PlatformVMConstants.LATESTCODEC, txid = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
        return new UTXO(codecID, txid, outputidx, assetID, output);
    }
}
exports.UTXO = UTXO;
class AssetAmountDestination extends assetamount_1.StandardAssetAmountDestination {
}
exports.AssetAmountDestination = AssetAmountDestination;
/**
 * Class representing a set of [[UTXO]]s.
 */
class UTXOSet extends utxos_1.StandardUTXOSet {
    constructor() {
        super(...arguments);
        this._typeName = "UTXOSet";
        this._typeID = undefined;
        this.getConsumableUXTO = (asOf = (0, helperfunctions_1.UnixNow)(), stakeable = false) => {
            return this.getAllUTXOs().filter((utxo) => {
                if (stakeable) {
                    // stakeable transactions can consume any UTXO.
                    return true;
                }
                const output = utxo.getOutput();
                if (!(output instanceof outputs_1.StakeableLockOut)) {
                    // non-stakeable transactions can consume any UTXO that isn't locked.
                    return true;
                }
                const stakeableOutput = output;
                if (stakeableOutput.getStakeableLocktime().lt(asOf)) {
                    // If the stakeable outputs locktime has ended, then this UTXO can still
                    // be consumed by a non-stakeable transaction.
                    return true;
                }
                // This output is locked and can't be consumed by a non-stakeable
                // transaction.
                return false;
            });
        };
        this.getMinimumSpendable = (aad, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1, stakeable = false) => {
            let utxoArray = this.getConsumableUXTO(asOf, stakeable);
            let tmpUTXOArray = [];
            if (stakeable) {
                // If this is a stakeable transaction then have StakeableLockOut come before SECPTransferOutput
                // so that users first stake locked tokens before staking unlocked tokens
                utxoArray.forEach((utxo) => {
                    // StakeableLockOuts
                    if (utxo.getOutput().getTypeID() === 22) {
                        tmpUTXOArray.push(utxo);
                    }
                });
                // Sort the StakeableLockOuts by StakeableLocktime so that the greatest StakeableLocktime are spent first
                tmpUTXOArray.sort((a, b) => {
                    let stakeableLockOut1 = a.getOutput();
                    let stakeableLockOut2 = b.getOutput();
                    return (stakeableLockOut2.getStakeableLocktime().toNumber() -
                        stakeableLockOut1.getStakeableLocktime().toNumber());
                });
                utxoArray.forEach((utxo) => {
                    // SECPTransferOutputs
                    if (utxo.getOutput().getTypeID() === 7) {
                        tmpUTXOArray.push(utxo);
                    }
                });
                utxoArray = tmpUTXOArray;
            }
            // outs is a map from assetID to a tuple of (lockedStakeable, unlocked)
            // which are arrays of outputs.
            const outs = {};
            // We only need to iterate over UTXOs until we have spent sufficient funds
            // to met the requested amounts.
            utxoArray.forEach((utxo, index) => {
                const assetID = utxo.getAssetID();
                const assetKey = assetID.toString("hex");
                const fromAddresses = aad.getSenders();
                const output = utxo.getOutput();
                if (!(output instanceof outputs_1.AmountOutput) ||
                    !aad.assetExists(assetKey) ||
                    !output.meetsThreshold(fromAddresses, asOf)) {
                    // We should only try to spend fungible assets.
                    // We should only spend {{ assetKey }}.
                    // We need to be able to spend the output.
                    return;
                }
                const assetAmount = aad.getAssetAmount(assetKey);
                if (assetAmount.isFinished()) {
                    // We've already spent the needed UTXOs for this assetID.
                    return;
                }
                if (!(assetKey in outs)) {
                    // If this is the first time spending this assetID, we need to
                    // initialize the outs object correctly.
                    outs[`${assetKey}`] = {
                        lockedStakeable: [],
                        unlocked: []
                    };
                }
                const amountOutput = output;
                // amount is the amount of funds available from this UTXO.
                const amount = amountOutput.getAmount();
                // Set up the SECP input with the same amount as the output.
                let input = new inputs_1.SECPTransferInput(amount);
                let locked = false;
                if (amountOutput instanceof outputs_1.StakeableLockOut) {
                    const stakeableOutput = amountOutput;
                    const stakeableLocktime = stakeableOutput.getStakeableLocktime();
                    if (stakeableLocktime.gt(asOf)) {
                        // Add a new input and mark it as being locked.
                        input = new inputs_1.StakeableLockIn(amount, stakeableLocktime, new inputs_1.ParseableInput(input));
                        // Mark this UTXO as having been re-locked.
                        locked = true;
                    }
                }
                assetAmount.spendAmount(amount, locked);
                if (locked) {
                    // Track the UTXO as locked.
                    outs[`${assetKey}`].lockedStakeable.push(amountOutput);
                }
                else {
                    // Track the UTXO as unlocked.
                    outs[`${assetKey}`].unlocked.push(amountOutput);
                }
                // Get the indices of the outputs that should be used to authorize the
                // spending of this input.
                // TODO: getSpenders should return an array of indices rather than an
                // array of addresses.
                const spenders = amountOutput.getSpenders(fromAddresses, asOf);
                spenders.forEach((spender) => {
                    const idx = amountOutput.getAddressIdx(spender);
                    if (idx === -1) {
                        // This should never happen, which is why the error is thrown rather
                        // than being returned. If this were to ever happen this would be an
                        // error in the internal logic rather having called this function with
                        // invalid arguments.
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.getMinimumSpendable: no such " +
                            `address in output: ${spender}`);
                    }
                    input.addSignatureIdx(idx, spender);
                });
                const txID = utxo.getTxID();
                const outputIdx = utxo.getOutputIdx();
                const transferInput = new inputs_1.TransferableInput(txID, outputIdx, assetID, input);
                aad.addInput(transferInput);
            });
            if (!aad.canComplete()) {
                // After running through all the UTXOs, we still weren't able to get all
                // the necessary funds, so this transaction can't be made.
                return new errors_1.InsufficientFundsError("Error - UTXOSet.getMinimumSpendable: insufficient " +
                    "funds to create the transaction");
            }
            // TODO: We should separate the above functionality into a single function
            // that just selects the UTXOs to consume.
            const zero = new bn_js_1.default(0);
            // assetAmounts is an array of asset descriptions and how much is left to
            // spend for them.
            const assetAmounts = aad.getAmounts();
            assetAmounts.forEach((assetAmount) => {
                // change is the amount that should be returned back to the source of the
                // funds.
                const change = assetAmount.getChange();
                // isStakeableLockChange is if the change is locked or not.
                const isStakeableLockChange = assetAmount.getStakeableLockChange();
                // lockedChange is the amount of locked change that should be returned to
                // the sender
                const lockedChange = isStakeableLockChange ? change : zero.clone();
                const assetID = assetAmount.getAssetID();
                const assetKey = assetAmount.getAssetIDString();
                const lockedOutputs = outs[`${assetKey}`].lockedStakeable;
                lockedOutputs.forEach((lockedOutput, i) => {
                    const stakeableLocktime = lockedOutput.getStakeableLocktime();
                    const parseableOutput = lockedOutput.getTransferableOutput();
                    // We know that parseableOutput contains an AmountOutput because the
                    // first loop filters for fungible assets.
                    const output = parseableOutput.getOutput();
                    let outputAmountRemaining = output.getAmount();
                    // The only output that could generate change is the last output.
                    // Otherwise, any further UTXOs wouldn't have needed to be spent.
                    if (i == lockedOutputs.length - 1 && lockedChange.gt(zero)) {
                        // update outputAmountRemaining to no longer hold the change that we
                        // are returning.
                        outputAmountRemaining = outputAmountRemaining.sub(lockedChange);
                        // Create the inner output.
                        const newChangeOutput = (0, outputs_1.SelectOutputClass)(output.getOutputID(), lockedChange, output.getAddresses(), output.getLocktime(), output.getThreshold());
                        // Wrap the inner output in the StakeableLockOut wrapper.
                        let newLockedChangeOutput = (0, outputs_1.SelectOutputClass)(lockedOutput.getOutputID(), lockedChange, output.getAddresses(), output.getLocktime(), output.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(newChangeOutput));
                        const transferOutput = new outputs_1.TransferableOutput(assetID, newLockedChangeOutput);
                        aad.addChange(transferOutput);
                    }
                    // We know that outputAmountRemaining > 0. Otherwise, we would never
                    // have consumed this UTXO, as it would be only change.
                    // Create the inner output.
                    const newOutput = (0, outputs_1.SelectOutputClass)(output.getOutputID(), outputAmountRemaining, output.getAddresses(), output.getLocktime(), output.getThreshold());
                    // Wrap the inner output in the StakeableLockOut wrapper.
                    const newLockedOutput = (0, outputs_1.SelectOutputClass)(lockedOutput.getOutputID(), outputAmountRemaining, output.getAddresses(), output.getLocktime(), output.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(newOutput));
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newLockedOutput);
                    aad.addOutput(transferOutput);
                });
                // unlockedChange is the amount of unlocked change that should be returned
                // to the sender
                const unlockedChange = isStakeableLockChange ? zero.clone() : change;
                if (unlockedChange.gt(zero)) {
                    const newChangeOutput = new outputs_1.SECPTransferOutput(unlockedChange, aad.getChangeAddresses(), zero.clone(), // make sure that we don't lock the change output.
                    threshold);
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newChangeOutput);
                    aad.addChange(transferOutput);
                }
                // totalAmountSpent is the total amount of tokens consumed.
                const totalAmountSpent = assetAmount.getSpent();
                // stakeableLockedAmount is the total amount of locked tokens consumed.
                const stakeableLockedAmount = assetAmount.getStakeableLockSpent();
                // totalUnlockedSpent is the total amount of unlocked tokens consumed.
                const totalUnlockedSpent = totalAmountSpent.sub(stakeableLockedAmount);
                // amountBurnt is the amount of unlocked tokens that must be burn.
                const amountBurnt = assetAmount.getBurn();
                // totalUnlockedAvailable is the total amount of unlocked tokens available
                // to be produced.
                const totalUnlockedAvailable = totalUnlockedSpent.sub(amountBurnt);
                // unlockedAmount is the amount of unlocked tokens that should be sent.
                const unlockedAmount = totalUnlockedAvailable.sub(unlockedChange);
                if (unlockedAmount.gt(zero)) {
                    const newOutput = new outputs_1.SECPTransferOutput(unlockedAmount, aad.getDestinations(), locktime, threshold);
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newOutput);
                    aad.addOutput(transferOutput);
                }
            });
            return undefined;
        };
        /**
         * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount of the asset to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned. Default: assetID
         * @param memo Optional. Contains arbitrary data, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildBaseTx = (networkID, blockchainID, amount, assetID, toAddresses, fromAddresses, changeAddresses = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            if (threshold > toAddresses.length) {
                /* istanbul ignore next */
                throw new errors_1.ThresholdError("Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses");
            }
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = assetID;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (assetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(assetID, amount, fee);
            }
            else {
                aad.addAssetAmount(assetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            let ins = [];
            let outs = [];
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getAllOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins, memo);
            return new tx_1.UnsignedTx(baseTx);
        };
        /**
         * Creates an unsigned ImportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
         * @param importIns An array of [[TransferableInput]]s being imported
         * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildImportTx = (networkID, blockchainID, toAddresses, fromAddresses, changeAddresses, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (typeof fee === "undefined") {
                fee = zero.clone();
            }
            const importIns = [];
            let feepaid = new bn_js_1.default(0);
            let feeAssetStr = feeAssetID.toString("hex");
            for (let i = 0; i < atomics.length; i++) {
                const utxo = atomics[`${i}`];
                const assetID = utxo.getAssetID();
                const output = utxo.getOutput();
                let amt = output.getAmount().clone();
                let infeeamount = amt.clone();
                let assetStr = assetID.toString("hex");
                if (typeof feeAssetID !== "undefined" &&
                    fee.gt(zero) &&
                    feepaid.lt(fee) &&
                    assetStr === feeAssetStr) {
                    feepaid = feepaid.add(infeeamount);
                    if (feepaid.gte(fee)) {
                        infeeamount = feepaid.sub(fee);
                        feepaid = fee.clone();
                    }
                    else {
                        infeeamount = zero.clone();
                    }
                }
                const txid = utxo.getTxID();
                const outputidx = utxo.getOutputIdx();
                const input = new inputs_1.SECPTransferInput(amt);
                const xferin = new inputs_1.TransferableInput(txid, outputidx, assetID, input);
                const from = output.getAddresses();
                const spenders = output.getSpenders(from, asOf);
                for (let j = 0; j < spenders.length; j++) {
                    const idx = output.getAddressIdx(spenders[`${j}`]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.buildImportTx: no such " +
                            `address in output: ${spenders[`${j}`]}`);
                    }
                    xferin.getInput().addSignatureIdx(idx, spenders[`${j}`]);
                }
                importIns.push(xferin);
                //add extra outputs for each amount (calculated from the imported inputs), minus fees
                if (infeeamount.gt(zero)) {
                    const spendout = (0, outputs_1.SelectOutputClass)(output.getOutputID(), infeeamount, toAddresses, locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(assetID, spendout);
                    outs.push(xferout);
                }
            }
            // get remaining fees from the provided addresses
            let feeRemaining = fee.sub(feepaid);
            if (feeRemaining.gt(zero) && this._feeCheck(feeRemaining, feeAssetID)) {
                const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, feeRemaining);
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
                }
            }
            const importTx = new importtx_1.ImportTx(networkID, blockchainID, outs, ins, memo, sourceChain, importIns);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
         * Creates an unsigned ExportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param juneAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for JUNE
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the JUNE
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the JUNE
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover of the JUNE
         * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildExportTx = (networkID, blockchainID, amount, juneAssetID, // TODO: rename this to amountAssetID
        toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            let ins = [];
            let outs = [];
            let exportouts = [];
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = juneAssetID;
            }
            else if (feeAssetID.toString("hex") !== juneAssetID.toString("hex")) {
                /* istanbul ignore next */
                throw new errors_1.FeeAssetError("Error - UTXOSet.buildExportTx: " + `feeAssetID must match juneAssetID`);
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.Defaults.network[`${networkID}`].X["blockchainID"]);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (juneAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(juneAssetID, amount, fee);
            }
            else {
                aad.addAssetAmount(juneAssetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                exportouts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const exportTx = new exporttx_1.ExportTx(networkID, blockchainID, outs, ins, memo, destinationChain, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
        /**
         * Class representing an unsigned [[AddSubnetValidatorTx]] transaction.
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in JUNE
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
         * @param weight The amount of weight for this subnet validator.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddSubnetValidatorTx = (networkID = constants_2.DefaultNetworkID, blockchainID, fromAddresses, changeAddresses, nodeID, startTime, endTime, weight, subnetID, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), subnetAuthCredentials = []) => {
            let ins = [];
            let outs = [];
            const zero = new bn_js_1.default(0);
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("UTXOSet.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            const addSubnetValidatorTx = new addsubnetvalidatortx_1.AddSubnetValidatorTx(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, weight, subnetID);
            subnetAuthCredentials.forEach((subnetAuthCredential) => {
                addSubnetValidatorTx.addSignatureIdx(subnetAuthCredential[0], subnetAuthCredential[1]);
            });
            return new tx_1.UnsignedTx(addSubnetValidatorTx);
        };
        /**
         * Class representing an unsigned [[AddDelegatorTx]] transaction.
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param juneAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for JUNE
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
         * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nJUNE.
         * @param rewardLocktime The locktime field created in the resulting reward outputs
         * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
         * @param rewardAddresses The addresses the validator reward goes.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddDelegatorTx = (networkID = constants_2.DefaultNetworkID, blockchainID, juneAssetID, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewardAddresses, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), changeThreshold = 1) => {
            if (rewardThreshold > rewardAddresses.length) {
                /* istanbul ignore next */
                throw new errors_1.ThresholdError("Error - UTXOSet.buildAddDelegatorTx: reward threshold is greater than number of addresses");
            }
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            let ins = [];
            let outs = [];
            let stakeOuts = [];
            const zero = new bn_js_1.default(0);
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("UTXOSet.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (juneAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(juneAssetID, stakeAmount, fee);
            }
            else {
                aad.addAssetAmount(juneAssetID, stakeAmount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, changeThreshold, true);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                stakeOuts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const rewardOutputOwners = new outputs_1.SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);
            const UTx = new validationtx_1.AddDelegatorTx(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new outputs_1.ParseableOutput(rewardOutputOwners));
            return new tx_1.UnsignedTx(UTx);
        };
        /**
         * Class representing an unsigned [[AddValidatorTx]] transaction.
         *
         * @param networkID NetworkID, [[DefaultNetworkID]]
         * @param blockchainID BlockchainID, default undefined
         * @param juneAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for JUNE
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
         * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nJUNE.
         * @param rewardLocktime The locktime field created in the resulting reward outputs
         * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
         * @param rewardAddresses The addresses the validator reward goes.
         * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
         * @param minStake A {@link https://github.com/indutny/bn.js/|BN} representing the minimum stake required to validate on this network.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddValidatorTx = (networkID = constants_2.DefaultNetworkID, blockchainID, juneAssetID, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewardAddresses, delegationFee, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            let ins = [];
            let outs = [];
            let stakeOuts = [];
            const zero = new bn_js_1.default(0);
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("UTXOSet.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            if (delegationFee > 100 || delegationFee < 0) {
                throw new errors_1.TimeError("UTXOSet.buildAddValidatorTx -- startTime must be in the range of 0 to 100, inclusively");
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (juneAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(juneAssetID, stakeAmount, fee);
            }
            else {
                aad.addAssetAmount(juneAssetID, stakeAmount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                stakeOuts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const rewardOutputOwners = new outputs_1.SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);
            const UTx = new validationtx_1.AddValidatorTx(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new outputs_1.ParseableOutput(rewardOutputOwners), delegationFee);
            return new tx_1.UnsignedTx(UTx);
        };
        /**
         * Class representing an unsigned [[CreateSubnetTx]] transaction.
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param subnetOwnerAddresses An array of {@link https://github.com/feross/buffer|Buffer} for the addresses to add to a subnet
         * @param subnetOwnerThreshold The number of owners's signatures required to add a validator to the network
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateSubnetTx = (networkID = constants_2.DefaultNetworkID, blockchainID, fromAddresses, changeAddresses, subnetOwnerAddresses, subnetOwnerThreshold, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
                }
            }
            const locktime = new bn_js_1.default(0);
            const subnetOwners = new outputs_1.SECPOwnerOutput(subnetOwnerAddresses, locktime, subnetOwnerThreshold);
            const createSubnetTx = new createsubnettx_1.CreateSubnetTx(networkID, blockchainID, outs, ins, memo, subnetOwners);
            return new tx_1.UnsignedTx(createSubnetTx);
        };
        /**
         * Build an unsigned [[CreateChainTx]].
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param subnetID Optional ID of the Subnet that validates this blockchain
         * @param chainName Optional A human readable name for the chain; need not be unique
         * @param vmID Optional ID of the VM running on the new chain
         * @param fxIDs Optional IDs of the feature extensions running on the new chain
         * @param genesisData Optional Byte representation of genesis state of the new chain
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
         * @param chainAssetID Optional ID of the ChainAssetID that is used to pay fees in this blockchain (defaults to JUNE if empty)
         *
         * @returns An unsigned CreateChainTx created from the passed in parameters.
         */
        this.buildCreateChainTx = (networkID = constants_2.DefaultNetworkID, blockchainID, fromAddresses, changeAddresses, subnetID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), subnetAuthCredentials = [], chainAssetID = undefined) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
                }
            }
            if (typeof chainAssetID === "undefined") {
                chainAssetID = feeAssetID;
            }
            const createChainTx = new _1.CreateChainTx(networkID, blockchainID, outs, ins, memo, subnetID, chainName, vmID, fxIDs, genesisData, chainAssetID);
            subnetAuthCredentials.forEach((subnetAuthCredential) => {
                createChainTx.addSignatureIdx(subnetAuthCredential[0], subnetAuthCredential[1]);
            });
            return new tx_1.UnsignedTx(createChainTx);
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let utxos = {};
        for (let utxoid in fields["utxos"]) {
            let utxoidCleaned = serialization.decoder(utxoid, encoding, "base58", "base58");
            utxos[`${utxoidCleaned}`] = new UTXO();
            utxos[`${utxoidCleaned}`].deserialize(fields["utxos"][`${utxoid}`], encoding);
        }
        let addressUTXOs = {};
        for (let address in fields["addressUTXOs"]) {
            let addressCleaned = serialization.decoder(address, encoding, "cb58", "hex");
            let utxobalance = {};
            for (let utxoid in fields["addressUTXOs"][`${address}`]) {
                let utxoidCleaned = serialization.decoder(utxoid, encoding, "base58", "base58");
                utxobalance[`${utxoidCleaned}`] = serialization.decoder(fields["addressUTXOs"][`${address}`][`${utxoid}`], encoding, "decimalString", "BN");
            }
            addressUTXOs[`${addressCleaned}`] = utxobalance;
        }
        this.utxos = utxos;
        this.addressUTXOs = addressUTXOs;
    }
    parseUTXO(utxo) {
        const utxovar = new UTXO();
        // force a copy
        if (typeof utxo === "string") {
            utxovar.fromBuffer(bintools.cb58Decode(utxo));
        }
        else if (utxo instanceof utxos_1.StandardUTXO) {
            utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.UTXOError("Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string");
        }
        return utxovar;
    }
    create(...args) {
        return new UTXOSet();
    }
    clone() {
        const newset = this.create();
        const allUTXOs = this.getAllUTXOs();
        newset.addArray(allUTXOs);
        return newset;
    }
    _feeCheck(fee, feeAssetID) {
        return (typeof fee !== "undefined" &&
            typeof feeAssetID !== "undefined" &&
            fee.gt(new bn_js_1.default(0)) &&
            feeAssetID instanceof buffer_1.Buffer);
    }
}
exports.UTXOSet = UTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0Msa0RBQXNCO0FBQ3RCLHVDQVFrQjtBQUNsQixxQ0FNaUI7QUFDakIsaUVBQXFEO0FBQ3JELDhDQUFrRTtBQUNsRSwyQ0FBaUQ7QUFDakQsNkJBQWlDO0FBQ2pDLHFEQUFpRDtBQUNqRCxxREFBa0U7QUFDbEUscURBQWlEO0FBQ2pELGlEQUE2QztBQUM3QywwREFHaUM7QUFFakMsaURBQStEO0FBQy9ELHFEQUFpRDtBQUNqRCw2REFBNkU7QUFDN0UsK0NBTzJCO0FBQzNCLHdCQUFpQztBQUVqQyw2RUFBeUU7QUFFekU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQTtRQUNsQixZQUFPLEdBQUcsU0FBUyxDQUFBO0lBb0UvQixDQUFDO0lBbEVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLDJCQUFpQixFQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsVUFB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U0FDRjtRQUNELE9BQU8sT0FBTyxDQUFBO0lBQ2hCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxPQUFPLEVBQVUsQ0FBQTtJQUM5QixDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sTUFBTSxHQUFZLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUNyQyxNQUFNLFFBQVEsR0FBVyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUN6QixPQUFPLE1BQWMsQ0FBQTtJQUN2QixDQUFDO0lBRUQsU0FBUyxDQUFDLEdBQU8sRUFBRSxVQUFrQjtRQUNuQyxPQUFPLENBQ0wsT0FBTyxHQUFHLEtBQUssV0FBVztZQUMxQixPQUFPLFVBQVUsS0FBSyxXQUFXO1lBQ2pDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsVUFBVSxZQUFZLGVBQU0sQ0FDN0IsQ0FBQTtJQUNILENBQUM7Q0EwbkNGO0FBL3NDRCwwQkErc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNLVVUWE9zXHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHtcclxuICBBbW91bnRPdXRwdXQsXHJcbiAgU2VsZWN0T3V0cHV0Q2xhc3MsXHJcbiAgVHJhbnNmZXJhYmxlT3V0cHV0LFxyXG4gIFNFQ1BPd25lck91dHB1dCxcclxuICBQYXJzZWFibGVPdXRwdXQsXHJcbiAgU3Rha2VhYmxlTG9ja091dCxcclxuICBTRUNQVHJhbnNmZXJPdXRwdXRcclxufSBmcm9tIFwiLi9vdXRwdXRzXCJcclxuaW1wb3J0IHtcclxuICBBbW91bnRJbnB1dCxcclxuICBTRUNQVHJhbnNmZXJJbnB1dCxcclxuICBTdGFrZWFibGVMb2NrSW4sXHJcbiAgVHJhbnNmZXJhYmxlSW5wdXQsXHJcbiAgUGFyc2VhYmxlSW5wdXRcclxufSBmcm9tIFwiLi9pbnB1dHNcIlxyXG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXHJcbmltcG9ydCB7IFN0YW5kYXJkVVRYTywgU3RhbmRhcmRVVFhPU2V0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dHhvc1wiXHJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBVbnNpZ25lZFR4IH0gZnJvbSBcIi4vdHhcIlxyXG5pbXBvcnQgeyBFeHBvcnRUeCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2V4cG9ydHR4XCJcclxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCwgRGVmYXVsdHMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tIFwiLi4vcGxhdGZvcm12bS9pbXBvcnR0eFwiXHJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2Jhc2V0eFwiXHJcbmltcG9ydCB7XHJcbiAgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uLFxyXG4gIEFzc2V0QW1vdW50XHJcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hc3NldGFtb3VudFwiXHJcbmltcG9ydCB7IE91dHB1dCB9IGZyb20gXCIuLi8uLi9jb21tb24vb3V0cHV0XCJcclxuaW1wb3J0IHsgQWRkRGVsZWdhdG9yVHgsIEFkZFZhbGlkYXRvclR4IH0gZnJvbSBcIi4vdmFsaWRhdGlvbnR4XCJcclxuaW1wb3J0IHsgQ3JlYXRlU3VibmV0VHggfSBmcm9tIFwiLi9jcmVhdGVzdWJuZXR0eFwiXHJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHtcclxuICBVVFhPRXJyb3IsXHJcbiAgQWRkcmVzc0Vycm9yLFxyXG4gIEluc3VmZmljaWVudEZ1bmRzRXJyb3IsXHJcbiAgVGhyZXNob2xkRXJyb3IsXHJcbiAgRmVlQXNzZXRFcnJvcixcclxuICBUaW1lRXJyb3JcclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuaW1wb3J0IHsgQ3JlYXRlQ2hhaW5UeCB9IGZyb20gXCIuXCJcclxuaW1wb3J0IHsgR2VuZXNpc0RhdGEgfSBmcm9tIFwiLi4vanZtXCJcclxuaW1wb3J0IHsgQWRkU3VibmV0VmFsaWRhdG9yVHggfSBmcm9tIFwiLi4vcGxhdGZvcm12bS9hZGRzdWJuZXR2YWxpZGF0b3J0eFwiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHNpbmdsZSBVVFhPLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFVUWE8gZXh0ZW5kcyBTdGFuZGFyZFVUWE8ge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9cIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pXHJcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5jb2RlY0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMilcclxuICAgIG9mZnNldCArPSAyXHJcbiAgICB0aGlzLnR4aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcclxuICAgIG9mZnNldCArPSAzMlxyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICBjb25zdCBvdXRwdXRpZDogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKVxyXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIFtbVVRYT11dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFN0YW5kYXJkVVRYTyBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzZXJpYWxpemVkIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9dXVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVVRYT11dXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIHVubGlrZSBtb3N0IGZyb21TdHJpbmdzLCBpdCBleHBlY3RzIHRoZSBzdHJpbmcgdG8gYmUgc2VyaWFsaXplZCBpbiBjYjU4IGZvcm1hdFxyXG4gICAqL1xyXG4gIGZyb21TdHJpbmcoc2VyaWFsaXplZDogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tVVFhPXV0uXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIHVubGlrZSBtb3N0IHRvU3RyaW5ncywgdGhpcyByZXR1cm5zIGluIGNiNTggc2VyaWFsaXphdGlvbiBmb3JtYXRcclxuICAgKi9cclxuICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgdXR4bzogVVRYTyA9IG5ldyBVVFhPKClcclxuICAgIHV0eG8uZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXHJcbiAgICByZXR1cm4gdXR4byBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoXHJcbiAgICBjb2RlY0lEOiBudW1iZXIgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkxBVEVTVENPREVDLFxyXG4gICAgdHhpZDogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgb3V0cHV0aWR4OiBCdWZmZXIgfCBudW1iZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBvdXRwdXQ6IE91dHB1dCA9IHVuZGVmaW5lZFxyXG4gICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQsIG91dHB1dGlkeCwgYXNzZXRJRCwgb3V0cHV0KSBhcyB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXNzZXRBbW91bnREZXN0aW5hdGlvbiBleHRlbmRzIFN0YW5kYXJkQXNzZXRBbW91bnREZXN0aW5hdGlvbjxcclxuICBUcmFuc2ZlcmFibGVPdXRwdXQsXHJcbiAgVHJhbnNmZXJhYmxlSW5wdXRcclxuPiB7fVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNldCBvZiBbW1VUWE9dXXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgVVRYT1NldCBleHRlbmRzIFN0YW5kYXJkVVRYT1NldDxVVFhPPiB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1NldFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXHJcblxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIGxldCB1dHhvcyA9IHt9XHJcbiAgICBmb3IgKGxldCB1dHhvaWQgaW4gZmllbGRzW1widXR4b3NcIl0pIHtcclxuICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgICB1dHhvaWQsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJiYXNlNThcIixcclxuICAgICAgICBcImJhc2U1OFwiXHJcbiAgICAgIClcclxuICAgICAgdXR4b3NbYCR7dXR4b2lkQ2xlYW5lZH1gXSA9IG5ldyBVVFhPKClcclxuICAgICAgdXR4b3NbYCR7dXR4b2lkQ2xlYW5lZH1gXS5kZXNlcmlhbGl6ZShcclxuICAgICAgICBmaWVsZHNbXCJ1dHhvc1wiXVtgJHt1dHhvaWR9YF0sXHJcbiAgICAgICAgZW5jb2RpbmdcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgbGV0IGFkZHJlc3NVVFhPcyA9IHt9XHJcbiAgICBmb3IgKGxldCBhZGRyZXNzIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXSkge1xyXG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgICBhZGRyZXNzLFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIFwiY2I1OFwiLFxyXG4gICAgICAgIFwiaGV4XCJcclxuICAgICAgKVxyXG4gICAgICBsZXQgdXR4b2JhbGFuY2UgPSB7fVxyXG4gICAgICBmb3IgKGxldCB1dHhvaWQgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2Ake2FkZHJlc3N9YF0pIHtcclxuICAgICAgICBsZXQgdXR4b2lkQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICAgICAgdXR4b2lkLFxyXG4gICAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgICBcImJhc2U1OFwiLFxyXG4gICAgICAgICAgXCJiYXNlNThcIlxyXG4gICAgICAgIClcclxuICAgICAgICB1dHhvYmFsYW5jZVtgJHt1dHhvaWRDbGVhbmVkfWBdID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICAgICAgZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2Ake2FkZHJlc3N9YF1bYCR7dXR4b2lkfWBdLFxyXG4gICAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgICAgIFwiQk5cIlxyXG4gICAgICAgIClcclxuICAgICAgfVxyXG4gICAgICBhZGRyZXNzVVRYT3NbYCR7YWRkcmVzc0NsZWFuZWR9YF0gPSB1dHhvYmFsYW5jZVxyXG4gICAgfVxyXG4gICAgdGhpcy51dHhvcyA9IHV0eG9zXHJcbiAgICB0aGlzLmFkZHJlc3NVVFhPcyA9IGFkZHJlc3NVVFhPc1xyXG4gIH1cclxuXHJcbiAgcGFyc2VVVFhPKHV0eG86IFVUWE8gfCBzdHJpbmcpOiBVVFhPIHtcclxuICAgIGNvbnN0IHV0eG92YXI6IFVUWE8gPSBuZXcgVVRYTygpXHJcbiAgICAvLyBmb3JjZSBhIGNvcHlcclxuICAgIGlmICh0eXBlb2YgdXR4byA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIoYmludG9vbHMuY2I1OERlY29kZSh1dHhvKSlcclxuICAgIH0gZWxzZSBpZiAodXR4byBpbnN0YW5jZW9mIFN0YW5kYXJkVVRYTykge1xyXG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIodXR4by50b0J1ZmZlcigpKSAvLyBmb3JjZXMgYSBjb3B5XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgVVRYT0Vycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBVVFhPLnBhcnNlVVRYTzogdXR4byBwYXJhbWV0ZXIgaXMgbm90IGEgVVRYTyBvciBzdHJpbmdcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXR4b3ZhclxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IFVUWE9TZXQoKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGNvbnN0IG5ld3NldDogVVRYT1NldCA9IHRoaXMuY3JlYXRlKClcclxuICAgIGNvbnN0IGFsbFVUWE9zOiBVVFhPW10gPSB0aGlzLmdldEFsbFVUWE9zKClcclxuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcclxuICAgIHJldHVybiBuZXdzZXQgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgX2ZlZUNoZWNrKGZlZTogQk4sIGZlZUFzc2V0SUQ6IEJ1ZmZlcik6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgdHlwZW9mIGZlZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICBmZWUuZ3QobmV3IEJOKDApKSAmJlxyXG4gICAgICBmZWVBc3NldElEIGluc3RhbmNlb2YgQnVmZmVyXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBnZXRDb25zdW1hYmxlVVhUTyA9IChcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxyXG4gICAgc3Rha2VhYmxlOiBib29sZWFuID0gZmFsc2VcclxuICApOiBVVFhPW10gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsVVRYT3MoKS5maWx0ZXIoKHV0eG86IFVUWE8pID0+IHtcclxuICAgICAgaWYgKHN0YWtlYWJsZSkge1xyXG4gICAgICAgIC8vIHN0YWtlYWJsZSB0cmFuc2FjdGlvbnMgY2FuIGNvbnN1bWUgYW55IFVUWE8uXHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBvdXRwdXQ6IE91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KClcclxuICAgICAgaWYgKCEob3V0cHV0IGluc3RhbmNlb2YgU3Rha2VhYmxlTG9ja091dCkpIHtcclxuICAgICAgICAvLyBub24tc3Rha2VhYmxlIHRyYW5zYWN0aW9ucyBjYW4gY29uc3VtZSBhbnkgVVRYTyB0aGF0IGlzbid0IGxvY2tlZC5cclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHN0YWtlYWJsZU91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9IG91dHB1dCBhcyBTdGFrZWFibGVMb2NrT3V0XHJcbiAgICAgIGlmIChzdGFrZWFibGVPdXRwdXQuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS5sdChhc09mKSkge1xyXG4gICAgICAgIC8vIElmIHRoZSBzdGFrZWFibGUgb3V0cHV0cyBsb2NrdGltZSBoYXMgZW5kZWQsIHRoZW4gdGhpcyBVVFhPIGNhbiBzdGlsbFxyXG4gICAgICAgIC8vIGJlIGNvbnN1bWVkIGJ5IGEgbm9uLXN0YWtlYWJsZSB0cmFuc2FjdGlvbi5cclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICB9XHJcbiAgICAgIC8vIFRoaXMgb3V0cHV0IGlzIGxvY2tlZCBhbmQgY2FuJ3QgYmUgY29uc3VtZWQgYnkgYSBub24tc3Rha2VhYmxlXHJcbiAgICAgIC8vIHRyYW5zYWN0aW9uLlxyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBnZXRNaW5pbXVtU3BlbmRhYmxlID0gKFxyXG4gICAgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXHJcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXHJcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDEsXHJcbiAgICBzdGFrZWFibGU6IGJvb2xlYW4gPSBmYWxzZVxyXG4gICk6IEVycm9yID0+IHtcclxuICAgIGxldCB1dHhvQXJyYXk6IFVUWE9bXSA9IHRoaXMuZ2V0Q29uc3VtYWJsZVVYVE8oYXNPZiwgc3Rha2VhYmxlKVxyXG4gICAgbGV0IHRtcFVUWE9BcnJheTogVVRYT1tdID0gW11cclxuICAgIGlmIChzdGFrZWFibGUpIHtcclxuICAgICAgLy8gSWYgdGhpcyBpcyBhIHN0YWtlYWJsZSB0cmFuc2FjdGlvbiB0aGVuIGhhdmUgU3Rha2VhYmxlTG9ja091dCBjb21lIGJlZm9yZSBTRUNQVHJhbnNmZXJPdXRwdXRcclxuICAgICAgLy8gc28gdGhhdCB1c2VycyBmaXJzdCBzdGFrZSBsb2NrZWQgdG9rZW5zIGJlZm9yZSBzdGFraW5nIHVubG9ja2VkIHRva2Vuc1xyXG4gICAgICB1dHhvQXJyYXkuZm9yRWFjaCgodXR4bzogVVRYTykgPT4ge1xyXG4gICAgICAgIC8vIFN0YWtlYWJsZUxvY2tPdXRzXHJcbiAgICAgICAgaWYgKHV0eG8uZ2V0T3V0cHV0KCkuZ2V0VHlwZUlEKCkgPT09IDIyKSB7XHJcbiAgICAgICAgICB0bXBVVFhPQXJyYXkucHVzaCh1dHhvKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIFNvcnQgdGhlIFN0YWtlYWJsZUxvY2tPdXRzIGJ5IFN0YWtlYWJsZUxvY2t0aW1lIHNvIHRoYXQgdGhlIGdyZWF0ZXN0IFN0YWtlYWJsZUxvY2t0aW1lIGFyZSBzcGVudCBmaXJzdFxyXG4gICAgICB0bXBVVFhPQXJyYXkuc29ydCgoYTogVVRYTywgYjogVVRYTykgPT4ge1xyXG4gICAgICAgIGxldCBzdGFrZWFibGVMb2NrT3V0MSA9IGEuZ2V0T3V0cHV0KCkgYXMgU3Rha2VhYmxlTG9ja091dFxyXG4gICAgICAgIGxldCBzdGFrZWFibGVMb2NrT3V0MiA9IGIuZ2V0T3V0cHV0KCkgYXMgU3Rha2VhYmxlTG9ja091dFxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICBzdGFrZWFibGVMb2NrT3V0Mi5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvTnVtYmVyKCkgLVxyXG4gICAgICAgICAgc3Rha2VhYmxlTG9ja091dDEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b051bWJlcigpXHJcbiAgICAgICAgKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgdXR4b0FycmF5LmZvckVhY2goKHV0eG86IFVUWE8pID0+IHtcclxuICAgICAgICAvLyBTRUNQVHJhbnNmZXJPdXRwdXRzXHJcbiAgICAgICAgaWYgKHV0eG8uZ2V0T3V0cHV0KCkuZ2V0VHlwZUlEKCkgPT09IDcpIHtcclxuICAgICAgICAgIHRtcFVUWE9BcnJheS5wdXNoKHV0eG8pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICB1dHhvQXJyYXkgPSB0bXBVVFhPQXJyYXlcclxuICAgIH1cclxuXHJcbiAgICAvLyBvdXRzIGlzIGEgbWFwIGZyb20gYXNzZXRJRCB0byBhIHR1cGxlIG9mIChsb2NrZWRTdGFrZWFibGUsIHVubG9ja2VkKVxyXG4gICAgLy8gd2hpY2ggYXJlIGFycmF5cyBvZiBvdXRwdXRzLlxyXG4gICAgY29uc3Qgb3V0czogb2JqZWN0ID0ge31cclxuXHJcbiAgICAvLyBXZSBvbmx5IG5lZWQgdG8gaXRlcmF0ZSBvdmVyIFVUWE9zIHVudGlsIHdlIGhhdmUgc3BlbnQgc3VmZmljaWVudCBmdW5kc1xyXG4gICAgLy8gdG8gbWV0IHRoZSByZXF1ZXN0ZWQgYW1vdW50cy5cclxuICAgIHV0eG9BcnJheS5mb3JFYWNoKCh1dHhvOiBVVFhPLCBpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFzc2V0SUQ6IEJ1ZmZlciA9IHV0eG8uZ2V0QXNzZXRJRCgpXHJcbiAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSBhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgICAgIGNvbnN0IGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdID0gYWFkLmdldFNlbmRlcnMoKVxyXG4gICAgICBjb25zdCBvdXRwdXQ6IE91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KClcclxuICAgICAgaWYgKFxyXG4gICAgICAgICEob3V0cHV0IGluc3RhbmNlb2YgQW1vdW50T3V0cHV0KSB8fFxyXG4gICAgICAgICFhYWQuYXNzZXRFeGlzdHMoYXNzZXRLZXkpIHx8XHJcbiAgICAgICAgIW91dHB1dC5tZWV0c1RocmVzaG9sZChmcm9tQWRkcmVzc2VzLCBhc09mKVxyXG4gICAgICApIHtcclxuICAgICAgICAvLyBXZSBzaG91bGQgb25seSB0cnkgdG8gc3BlbmQgZnVuZ2libGUgYXNzZXRzLlxyXG4gICAgICAgIC8vIFdlIHNob3VsZCBvbmx5IHNwZW5kIHt7IGFzc2V0S2V5IH19LlxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gYmUgYWJsZSB0byBzcGVuZCB0aGUgb3V0cHV0LlxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBhc3NldEFtb3VudDogQXNzZXRBbW91bnQgPSBhYWQuZ2V0QXNzZXRBbW91bnQoYXNzZXRLZXkpXHJcbiAgICAgIGlmIChhc3NldEFtb3VudC5pc0ZpbmlzaGVkKCkpIHtcclxuICAgICAgICAvLyBXZSd2ZSBhbHJlYWR5IHNwZW50IHRoZSBuZWVkZWQgVVRYT3MgZm9yIHRoaXMgYXNzZXRJRC5cclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCEoYXNzZXRLZXkgaW4gb3V0cykpIHtcclxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHNwZW5kaW5nIHRoaXMgYXNzZXRJRCwgd2UgbmVlZCB0b1xyXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIG91dHMgb2JqZWN0IGNvcnJlY3RseS5cclxuICAgICAgICBvdXRzW2Ake2Fzc2V0S2V5fWBdID0ge1xyXG4gICAgICAgICAgbG9ja2VkU3Rha2VhYmxlOiBbXSxcclxuICAgICAgICAgIHVubG9ja2VkOiBbXVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgYW1vdW50T3V0cHV0OiBBbW91bnRPdXRwdXQgPSBvdXRwdXQgYXMgQW1vdW50T3V0cHV0XHJcbiAgICAgIC8vIGFtb3VudCBpcyB0aGUgYW1vdW50IG9mIGZ1bmRzIGF2YWlsYWJsZSBmcm9tIHRoaXMgVVRYTy5cclxuICAgICAgY29uc3QgYW1vdW50ID0gYW1vdW50T3V0cHV0LmdldEFtb3VudCgpXHJcblxyXG4gICAgICAvLyBTZXQgdXAgdGhlIFNFQ1AgaW5wdXQgd2l0aCB0aGUgc2FtZSBhbW91bnQgYXMgdGhlIG91dHB1dC5cclxuICAgICAgbGV0IGlucHV0OiBBbW91bnRJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpXHJcblxyXG4gICAgICBsZXQgbG9ja2VkOiBib29sZWFuID0gZmFsc2VcclxuICAgICAgaWYgKGFtb3VudE91dHB1dCBpbnN0YW5jZW9mIFN0YWtlYWJsZUxvY2tPdXQpIHtcclxuICAgICAgICBjb25zdCBzdGFrZWFibGVPdXRwdXQ6IFN0YWtlYWJsZUxvY2tPdXQgPVxyXG4gICAgICAgICAgYW1vdW50T3V0cHV0IGFzIFN0YWtlYWJsZUxvY2tPdXRcclxuICAgICAgICBjb25zdCBzdGFrZWFibGVMb2NrdGltZTogQk4gPSBzdGFrZWFibGVPdXRwdXQuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKVxyXG5cclxuICAgICAgICBpZiAoc3Rha2VhYmxlTG9ja3RpbWUuZ3QoYXNPZikpIHtcclxuICAgICAgICAgIC8vIEFkZCBhIG5ldyBpbnB1dCBhbmQgbWFyayBpdCBhcyBiZWluZyBsb2NrZWQuXHJcbiAgICAgICAgICBpbnB1dCA9IG5ldyBTdGFrZWFibGVMb2NrSW4oXHJcbiAgICAgICAgICAgIGFtb3VudCxcclxuICAgICAgICAgICAgc3Rha2VhYmxlTG9ja3RpbWUsXHJcbiAgICAgICAgICAgIG5ldyBQYXJzZWFibGVJbnB1dChpbnB1dClcclxuICAgICAgICAgIClcclxuXHJcbiAgICAgICAgICAvLyBNYXJrIHRoaXMgVVRYTyBhcyBoYXZpbmcgYmVlbiByZS1sb2NrZWQuXHJcbiAgICAgICAgICBsb2NrZWQgPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBhc3NldEFtb3VudC5zcGVuZEFtb3VudChhbW91bnQsIGxvY2tlZClcclxuICAgICAgaWYgKGxvY2tlZCkge1xyXG4gICAgICAgIC8vIFRyYWNrIHRoZSBVVFhPIGFzIGxvY2tlZC5cclxuICAgICAgICBvdXRzW2Ake2Fzc2V0S2V5fWBdLmxvY2tlZFN0YWtlYWJsZS5wdXNoKGFtb3VudE91dHB1dClcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBUcmFjayB0aGUgVVRYTyBhcyB1bmxvY2tlZC5cclxuICAgICAgICBvdXRzW2Ake2Fzc2V0S2V5fWBdLnVubG9ja2VkLnB1c2goYW1vdW50T3V0cHV0KVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBHZXQgdGhlIGluZGljZXMgb2YgdGhlIG91dHB1dHMgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBhdXRob3JpemUgdGhlXHJcbiAgICAgIC8vIHNwZW5kaW5nIG9mIHRoaXMgaW5wdXQuXHJcblxyXG4gICAgICAvLyBUT0RPOiBnZXRTcGVuZGVycyBzaG91bGQgcmV0dXJuIGFuIGFycmF5IG9mIGluZGljZXMgcmF0aGVyIHRoYW4gYW5cclxuICAgICAgLy8gYXJyYXkgb2YgYWRkcmVzc2VzLlxyXG4gICAgICBjb25zdCBzcGVuZGVyczogQnVmZmVyW10gPSBhbW91bnRPdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZilcclxuICAgICAgc3BlbmRlcnMuZm9yRWFjaCgoc3BlbmRlcjogQnVmZmVyKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaWR4OiBudW1iZXIgPSBhbW91bnRPdXRwdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyKVxyXG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XHJcbiAgICAgICAgICAvLyBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4sIHdoaWNoIGlzIHdoeSB0aGUgZXJyb3IgaXMgdGhyb3duIHJhdGhlclxyXG4gICAgICAgICAgLy8gdGhhbiBiZWluZyByZXR1cm5lZC4gSWYgdGhpcyB3ZXJlIHRvIGV2ZXIgaGFwcGVuIHRoaXMgd291bGQgYmUgYW5cclxuICAgICAgICAgIC8vIGVycm9yIGluIHRoZSBpbnRlcm5hbCBsb2dpYyByYXRoZXIgaGF2aW5nIGNhbGxlZCB0aGlzIGZ1bmN0aW9uIHdpdGhcclxuICAgICAgICAgIC8vIGludmFsaWQgYXJndW1lbnRzLlxyXG5cclxuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBubyBzdWNoIFwiICtcclxuICAgICAgICAgICAgICBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcn1gXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlucHV0LmFkZFNpZ25hdHVyZUlkeChpZHgsIHNwZW5kZXIpXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICBjb25zdCB0eElEOiBCdWZmZXIgPSB1dHhvLmdldFR4SUQoKVxyXG4gICAgICBjb25zdCBvdXRwdXRJZHg6IEJ1ZmZlciA9IHV0eG8uZ2V0T3V0cHV0SWR4KClcclxuICAgICAgY29uc3QgdHJhbnNmZXJJbnB1dDogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoXHJcbiAgICAgICAgdHhJRCxcclxuICAgICAgICBvdXRwdXRJZHgsXHJcbiAgICAgICAgYXNzZXRJRCxcclxuICAgICAgICBpbnB1dFxyXG4gICAgICApXHJcbiAgICAgIGFhZC5hZGRJbnB1dCh0cmFuc2ZlcklucHV0KVxyXG4gICAgfSlcclxuXHJcbiAgICBpZiAoIWFhZC5jYW5Db21wbGV0ZSgpKSB7XHJcbiAgICAgIC8vIEFmdGVyIHJ1bm5pbmcgdGhyb3VnaCBhbGwgdGhlIFVUWE9zLCB3ZSBzdGlsbCB3ZXJlbid0IGFibGUgdG8gZ2V0IGFsbFxyXG4gICAgICAvLyB0aGUgbmVjZXNzYXJ5IGZ1bmRzLCBzbyB0aGlzIHRyYW5zYWN0aW9uIGNhbid0IGJlIG1hZGUuXHJcbiAgICAgIHJldHVybiBuZXcgSW5zdWZmaWNpZW50RnVuZHNFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBpbnN1ZmZpY2llbnQgXCIgK1xyXG4gICAgICAgICAgXCJmdW5kcyB0byBjcmVhdGUgdGhlIHRyYW5zYWN0aW9uXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IFdlIHNob3VsZCBzZXBhcmF0ZSB0aGUgYWJvdmUgZnVuY3Rpb25hbGl0eSBpbnRvIGEgc2luZ2xlIGZ1bmN0aW9uXHJcbiAgICAvLyB0aGF0IGp1c3Qgc2VsZWN0cyB0aGUgVVRYT3MgdG8gY29uc3VtZS5cclxuXHJcbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxyXG5cclxuICAgIC8vIGFzc2V0QW1vdW50cyBpcyBhbiBhcnJheSBvZiBhc3NldCBkZXNjcmlwdGlvbnMgYW5kIGhvdyBtdWNoIGlzIGxlZnQgdG9cclxuICAgIC8vIHNwZW5kIGZvciB0aGVtLlxyXG4gICAgY29uc3QgYXNzZXRBbW91bnRzOiBBc3NldEFtb3VudFtdID0gYWFkLmdldEFtb3VudHMoKVxyXG4gICAgYXNzZXRBbW91bnRzLmZvckVhY2goKGFzc2V0QW1vdW50OiBBc3NldEFtb3VudCkgPT4ge1xyXG4gICAgICAvLyBjaGFuZ2UgaXMgdGhlIGFtb3VudCB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCBiYWNrIHRvIHRoZSBzb3VyY2Ugb2YgdGhlXHJcbiAgICAgIC8vIGZ1bmRzLlxyXG4gICAgICBjb25zdCBjaGFuZ2U6IEJOID0gYXNzZXRBbW91bnQuZ2V0Q2hhbmdlKClcclxuICAgICAgLy8gaXNTdGFrZWFibGVMb2NrQ2hhbmdlIGlzIGlmIHRoZSBjaGFuZ2UgaXMgbG9ja2VkIG9yIG5vdC5cclxuICAgICAgY29uc3QgaXNTdGFrZWFibGVMb2NrQ2hhbmdlOiBib29sZWFuID1cclxuICAgICAgICBhc3NldEFtb3VudC5nZXRTdGFrZWFibGVMb2NrQ2hhbmdlKClcclxuICAgICAgLy8gbG9ja2VkQ2hhbmdlIGlzIHRoZSBhbW91bnQgb2YgbG9ja2VkIGNoYW5nZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCB0b1xyXG4gICAgICAvLyB0aGUgc2VuZGVyXHJcbiAgICAgIGNvbnN0IGxvY2tlZENoYW5nZTogQk4gPSBpc1N0YWtlYWJsZUxvY2tDaGFuZ2UgPyBjaGFuZ2UgOiB6ZXJvLmNsb25lKClcclxuXHJcbiAgICAgIGNvbnN0IGFzc2V0SUQ6IEJ1ZmZlciA9IGFzc2V0QW1vdW50LmdldEFzc2V0SUQoKVxyXG4gICAgICBjb25zdCBhc3NldEtleTogc3RyaW5nID0gYXNzZXRBbW91bnQuZ2V0QXNzZXRJRFN0cmluZygpXHJcbiAgICAgIGNvbnN0IGxvY2tlZE91dHB1dHM6IFN0YWtlYWJsZUxvY2tPdXRbXSA9XHJcbiAgICAgICAgb3V0c1tgJHthc3NldEtleX1gXS5sb2NrZWRTdGFrZWFibGVcclxuICAgICAgbG9ja2VkT3V0cHV0cy5mb3JFYWNoKChsb2NrZWRPdXRwdXQ6IFN0YWtlYWJsZUxvY2tPdXQsIGk6IG51bWJlcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2t0aW1lOiBCTiA9IGxvY2tlZE91dHB1dC5nZXRTdGFrZWFibGVMb2NrdGltZSgpXHJcbiAgICAgICAgY29uc3QgcGFyc2VhYmxlT3V0cHV0OiBQYXJzZWFibGVPdXRwdXQgPVxyXG4gICAgICAgICAgbG9ja2VkT3V0cHV0LmdldFRyYW5zZmVyYWJsZU91dHB1dCgpXHJcblxyXG4gICAgICAgIC8vIFdlIGtub3cgdGhhdCBwYXJzZWFibGVPdXRwdXQgY29udGFpbnMgYW4gQW1vdW50T3V0cHV0IGJlY2F1c2UgdGhlXHJcbiAgICAgICAgLy8gZmlyc3QgbG9vcCBmaWx0ZXJzIGZvciBmdW5naWJsZSBhc3NldHMuXHJcbiAgICAgICAgY29uc3Qgb3V0cHV0OiBBbW91bnRPdXRwdXQgPSBwYXJzZWFibGVPdXRwdXQuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0XHJcblxyXG4gICAgICAgIGxldCBvdXRwdXRBbW91bnRSZW1haW5pbmc6IEJOID0gb3V0cHV0LmdldEFtb3VudCgpXHJcbiAgICAgICAgLy8gVGhlIG9ubHkgb3V0cHV0IHRoYXQgY291bGQgZ2VuZXJhdGUgY2hhbmdlIGlzIHRoZSBsYXN0IG91dHB1dC5cclxuICAgICAgICAvLyBPdGhlcndpc2UsIGFueSBmdXJ0aGVyIFVUWE9zIHdvdWxkbid0IGhhdmUgbmVlZGVkIHRvIGJlIHNwZW50LlxyXG4gICAgICAgIGlmIChpID09IGxvY2tlZE91dHB1dHMubGVuZ3RoIC0gMSAmJiBsb2NrZWRDaGFuZ2UuZ3QoemVybykpIHtcclxuICAgICAgICAgIC8vIHVwZGF0ZSBvdXRwdXRBbW91bnRSZW1haW5pbmcgdG8gbm8gbG9uZ2VyIGhvbGQgdGhlIGNoYW5nZSB0aGF0IHdlXHJcbiAgICAgICAgICAvLyBhcmUgcmV0dXJuaW5nLlxyXG4gICAgICAgICAgb3V0cHV0QW1vdW50UmVtYWluaW5nID0gb3V0cHV0QW1vdW50UmVtYWluaW5nLnN1Yihsb2NrZWRDaGFuZ2UpXHJcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGlubmVyIG91dHB1dC5cclxuICAgICAgICAgIGNvbnN0IG5ld0NoYW5nZU91dHB1dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXHJcbiAgICAgICAgICAgIG91dHB1dC5nZXRPdXRwdXRJRCgpLFxyXG4gICAgICAgICAgICBsb2NrZWRDaGFuZ2UsXHJcbiAgICAgICAgICAgIG91dHB1dC5nZXRBZGRyZXNzZXMoKSxcclxuICAgICAgICAgICAgb3V0cHV0LmdldExvY2t0aW1lKCksXHJcbiAgICAgICAgICAgIG91dHB1dC5nZXRUaHJlc2hvbGQoKVxyXG4gICAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcclxuICAgICAgICAgIC8vIFdyYXAgdGhlIGlubmVyIG91dHB1dCBpbiB0aGUgU3Rha2VhYmxlTG9ja091dCB3cmFwcGVyLlxyXG4gICAgICAgICAgbGV0IG5ld0xvY2tlZENoYW5nZU91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9IFNlbGVjdE91dHB1dENsYXNzKFxyXG4gICAgICAgICAgICBsb2NrZWRPdXRwdXQuZ2V0T3V0cHV0SUQoKSxcclxuICAgICAgICAgICAgbG9ja2VkQ2hhbmdlLFxyXG4gICAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXHJcbiAgICAgICAgICAgIG91dHB1dC5nZXRMb2NrdGltZSgpLFxyXG4gICAgICAgICAgICBvdXRwdXQuZ2V0VGhyZXNob2xkKCksXHJcbiAgICAgICAgICAgIHN0YWtlYWJsZUxvY2t0aW1lLFxyXG4gICAgICAgICAgICBuZXcgUGFyc2VhYmxlT3V0cHV0KG5ld0NoYW5nZU91dHB1dClcclxuICAgICAgICAgICkgYXMgU3Rha2VhYmxlTG9ja091dFxyXG4gICAgICAgICAgY29uc3QgdHJhbnNmZXJPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXHJcbiAgICAgICAgICAgIGFzc2V0SUQsXHJcbiAgICAgICAgICAgIG5ld0xvY2tlZENoYW5nZU91dHB1dFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgYWFkLmFkZENoYW5nZSh0cmFuc2Zlck91dHB1dClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFdlIGtub3cgdGhhdCBvdXRwdXRBbW91bnRSZW1haW5pbmcgPiAwLiBPdGhlcndpc2UsIHdlIHdvdWxkIG5ldmVyXHJcbiAgICAgICAgLy8gaGF2ZSBjb25zdW1lZCB0aGlzIFVUWE8sIGFzIGl0IHdvdWxkIGJlIG9ubHkgY2hhbmdlLlxyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIGlubmVyIG91dHB1dC5cclxuICAgICAgICBjb25zdCBuZXdPdXRwdXQ6IEFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxyXG4gICAgICAgICAgb3V0cHV0LmdldE91dHB1dElEKCksXHJcbiAgICAgICAgICBvdXRwdXRBbW91bnRSZW1haW5pbmcsXHJcbiAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXHJcbiAgICAgICAgICBvdXRwdXQuZ2V0TG9ja3RpbWUoKSxcclxuICAgICAgICAgIG91dHB1dC5nZXRUaHJlc2hvbGQoKVxyXG4gICAgICAgICkgYXMgQW1vdW50T3V0cHV0XHJcbiAgICAgICAgLy8gV3JhcCB0aGUgaW5uZXIgb3V0cHV0IGluIHRoZSBTdGFrZWFibGVMb2NrT3V0IHdyYXBwZXIuXHJcbiAgICAgICAgY29uc3QgbmV3TG9ja2VkT3V0cHV0OiBTdGFrZWFibGVMb2NrT3V0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXHJcbiAgICAgICAgICBsb2NrZWRPdXRwdXQuZ2V0T3V0cHV0SUQoKSxcclxuICAgICAgICAgIG91dHB1dEFtb3VudFJlbWFpbmluZyxcclxuICAgICAgICAgIG91dHB1dC5nZXRBZGRyZXNzZXMoKSxcclxuICAgICAgICAgIG91dHB1dC5nZXRMb2NrdGltZSgpLFxyXG4gICAgICAgICAgb3V0cHV0LmdldFRocmVzaG9sZCgpLFxyXG4gICAgICAgICAgc3Rha2VhYmxlTG9ja3RpbWUsXHJcbiAgICAgICAgICBuZXcgUGFyc2VhYmxlT3V0cHV0KG5ld091dHB1dClcclxuICAgICAgICApIGFzIFN0YWtlYWJsZUxvY2tPdXRcclxuICAgICAgICBjb25zdCB0cmFuc2Zlck91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcclxuICAgICAgICAgIGFzc2V0SUQsXHJcbiAgICAgICAgICBuZXdMb2NrZWRPdXRwdXRcclxuICAgICAgICApXHJcbiAgICAgICAgYWFkLmFkZE91dHB1dCh0cmFuc2Zlck91dHB1dClcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIHVubG9ja2VkQ2hhbmdlIGlzIHRoZSBhbW91bnQgb2YgdW5sb2NrZWQgY2hhbmdlIHRoYXQgc2hvdWxkIGJlIHJldHVybmVkXHJcbiAgICAgIC8vIHRvIHRoZSBzZW5kZXJcclxuICAgICAgY29uc3QgdW5sb2NrZWRDaGFuZ2U6IEJOID0gaXNTdGFrZWFibGVMb2NrQ2hhbmdlID8gemVyby5jbG9uZSgpIDogY2hhbmdlXHJcbiAgICAgIGlmICh1bmxvY2tlZENoYW5nZS5ndCh6ZXJvKSkge1xyXG4gICAgICAgIGNvbnN0IG5ld0NoYW5nZU91dHB1dDogQW1vdW50T3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChcclxuICAgICAgICAgIHVubG9ja2VkQ2hhbmdlLFxyXG4gICAgICAgICAgYWFkLmdldENoYW5nZUFkZHJlc3NlcygpLFxyXG4gICAgICAgICAgemVyby5jbG9uZSgpLCAvLyBtYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBsb2NrIHRoZSBjaGFuZ2Ugb3V0cHV0LlxyXG4gICAgICAgICAgdGhyZXNob2xkXHJcbiAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcclxuICAgICAgICBjb25zdCB0cmFuc2Zlck91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcclxuICAgICAgICAgIGFzc2V0SUQsXHJcbiAgICAgICAgICBuZXdDaGFuZ2VPdXRwdXRcclxuICAgICAgICApXHJcbiAgICAgICAgYWFkLmFkZENoYW5nZSh0cmFuc2Zlck91dHB1dClcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gdG90YWxBbW91bnRTcGVudCBpcyB0aGUgdG90YWwgYW1vdW50IG9mIHRva2VucyBjb25zdW1lZC5cclxuICAgICAgY29uc3QgdG90YWxBbW91bnRTcGVudDogQk4gPSBhc3NldEFtb3VudC5nZXRTcGVudCgpXHJcbiAgICAgIC8vIHN0YWtlYWJsZUxvY2tlZEFtb3VudCBpcyB0aGUgdG90YWwgYW1vdW50IG9mIGxvY2tlZCB0b2tlbnMgY29uc3VtZWQuXHJcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tlZEFtb3VudDogQk4gPSBhc3NldEFtb3VudC5nZXRTdGFrZWFibGVMb2NrU3BlbnQoKVxyXG4gICAgICAvLyB0b3RhbFVubG9ja2VkU3BlbnQgaXMgdGhlIHRvdGFsIGFtb3VudCBvZiB1bmxvY2tlZCB0b2tlbnMgY29uc3VtZWQuXHJcbiAgICAgIGNvbnN0IHRvdGFsVW5sb2NrZWRTcGVudDogQk4gPSB0b3RhbEFtb3VudFNwZW50LnN1YihzdGFrZWFibGVMb2NrZWRBbW91bnQpXHJcbiAgICAgIC8vIGFtb3VudEJ1cm50IGlzIHRoZSBhbW91bnQgb2YgdW5sb2NrZWQgdG9rZW5zIHRoYXQgbXVzdCBiZSBidXJuLlxyXG4gICAgICBjb25zdCBhbW91bnRCdXJudDogQk4gPSBhc3NldEFtb3VudC5nZXRCdXJuKClcclxuICAgICAgLy8gdG90YWxVbmxvY2tlZEF2YWlsYWJsZSBpcyB0aGUgdG90YWwgYW1vdW50IG9mIHVubG9ja2VkIHRva2VucyBhdmFpbGFibGVcclxuICAgICAgLy8gdG8gYmUgcHJvZHVjZWQuXHJcbiAgICAgIGNvbnN0IHRvdGFsVW5sb2NrZWRBdmFpbGFibGU6IEJOID0gdG90YWxVbmxvY2tlZFNwZW50LnN1YihhbW91bnRCdXJudClcclxuICAgICAgLy8gdW5sb2NrZWRBbW91bnQgaXMgdGhlIGFtb3VudCBvZiB1bmxvY2tlZCB0b2tlbnMgdGhhdCBzaG91bGQgYmUgc2VudC5cclxuICAgICAgY29uc3QgdW5sb2NrZWRBbW91bnQ6IEJOID0gdG90YWxVbmxvY2tlZEF2YWlsYWJsZS5zdWIodW5sb2NrZWRDaGFuZ2UpXHJcbiAgICAgIGlmICh1bmxvY2tlZEFtb3VudC5ndCh6ZXJvKSkge1xyXG4gICAgICAgIGNvbnN0IG5ld091dHB1dDogQW1vdW50T3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChcclxuICAgICAgICAgIHVubG9ja2VkQW1vdW50LFxyXG4gICAgICAgICAgYWFkLmdldERlc3RpbmF0aW9ucygpLFxyXG4gICAgICAgICAgbG9ja3RpbWUsXHJcbiAgICAgICAgICB0aHJlc2hvbGRcclxuICAgICAgICApIGFzIEFtb3VudE91dHB1dFxyXG4gICAgICAgIGNvbnN0IHRyYW5zZmVyT3V0cHV0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KFxyXG4gICAgICAgICAgYXNzZXRJRCxcclxuICAgICAgICAgIG5ld091dHB1dFxyXG4gICAgICAgIClcclxuICAgICAgICBhYWQuYWRkT3V0cHV0KHRyYW5zZmVyT3V0cHV0KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBbW1Vuc2lnbmVkVHhdXSB3cmFwcGluZyBhIFtbQmFzZVR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXHJcbiAgICogW1tVbnNpZ25lZFR4XV0gd3JhcHBpbmcgYSBbW0Jhc2VUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcyBhbmQgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXHJcbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIHRoZSBhc3NldCB0byBiZSBzcGVudCBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cclxuICAgKiBAcGFyYW0gYXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIHRoZSBVVFhPXHJcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLiBEZWZhdWx0OiB0b0FkZHJlc3Nlc1xyXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gRGVmYXVsdDogYXNzZXRJRFxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDb250YWlucyBhcmJpdHJhcnkgZGF0YSwgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xyXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqXHJcbiAgICovXHJcbiAgYnVpbGRCYXNlVHggPSAoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxyXG4gICAgYW1vdW50OiBCTixcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlcixcclxuICAgIHRvQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcclxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcclxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxyXG4gICk6IFVuc2lnbmVkVHggPT4ge1xyXG4gICAgaWYgKHRocmVzaG9sZCA+IHRvQWRkcmVzc2VzLmxlbmd0aCkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgVGhyZXNob2xkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRCYXNlVHg6IHRocmVzaG9sZCBpcyBncmVhdGVyIHRoYW4gbnVtYmVyIG9mIGFkZHJlc3Nlc1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMgPSB0b0FkZHJlc3Nlc1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgZmVlQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBmZWVBc3NldElEID0gYXNzZXRJRFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXHJcblxyXG4gICAgaWYgKGFtb3VudC5lcSh6ZXJvKSkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXHJcbiAgICAgIHRvQWRkcmVzc2VzLFxyXG4gICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXNcclxuICAgIClcclxuICAgIGlmIChhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XHJcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIGZlZSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIHplcm8pXHJcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XHJcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxyXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cclxuXHJcbiAgICBjb25zdCBtaW5TcGVuZGFibGVFcnI6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxyXG4gICAgICBhYWQsXHJcbiAgICAgIGFzT2YsXHJcbiAgICAgIGxvY2t0aW1lLFxyXG4gICAgICB0aHJlc2hvbGRcclxuICAgIClcclxuICAgIGlmICh0eXBlb2YgbWluU3BlbmRhYmxlRXJyID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxyXG4gICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYmFzZVR4OiBCYXNlVHggPSBuZXcgQmFzZVR4KG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXHJcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBJbXBvcnRUeCB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXHJcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxyXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy4gRGVmYXVsdDogdG9BZGRyZXNzZXNcclxuICAgKiBAcGFyYW0gaW1wb3J0SW5zIEFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgYmVpbmcgaW1wb3J0ZWRcclxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdGhlIGltcG9ydHMgYXJlIGNvbWluZyBmcm9tLlxyXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LiBGZWUgd2lsbCBjb21lIGZyb20gdGhlIGlucHV0cyBmaXJzdCwgaWYgdGhleSBjYW4uXHJcbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC5cclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xyXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXHJcbiAgICpcclxuICAgKi9cclxuICBidWlsZEltcG9ydFR4ID0gKFxyXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXHJcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcclxuICAgIHRvQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGF0b21pY3M6IFVUWE9bXSxcclxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXHJcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXHJcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcclxuICApOiBVbnNpZ25lZFR4ID0+IHtcclxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXHJcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cclxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcbiAgICBpZiAodHlwZW9mIGZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBmZWUgPSB6ZXJvLmNsb25lKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbXBvcnRJbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxyXG4gICAgbGV0IGZlZXBhaWQ6IEJOID0gbmV3IEJOKDApXHJcbiAgICBsZXQgZmVlQXNzZXRTdHI6IHN0cmluZyA9IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIilcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhdG9taWNzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHV0eG86IFVUWE8gPSBhdG9taWNzW2Ake2l9YF1cclxuICAgICAgY29uc3QgYXNzZXRJRDogQnVmZmVyID0gdXR4by5nZXRBc3NldElEKClcclxuICAgICAgY29uc3Qgb3V0cHV0OiBBbW91bnRPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dFxyXG4gICAgICBsZXQgYW10OiBCTiA9IG91dHB1dC5nZXRBbW91bnQoKS5jbG9uZSgpXHJcblxyXG4gICAgICBsZXQgaW5mZWVhbW91bnQgPSBhbXQuY2xvbmUoKVxyXG4gICAgICBsZXQgYXNzZXRTdHI6IHN0cmluZyA9IGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIilcclxuICAgICAgaWYgKFxyXG4gICAgICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgICAgZmVlLmd0KHplcm8pICYmXHJcbiAgICAgICAgZmVlcGFpZC5sdChmZWUpICYmXHJcbiAgICAgICAgYXNzZXRTdHIgPT09IGZlZUFzc2V0U3RyXHJcbiAgICAgICkge1xyXG4gICAgICAgIGZlZXBhaWQgPSBmZWVwYWlkLmFkZChpbmZlZWFtb3VudClcclxuICAgICAgICBpZiAoZmVlcGFpZC5ndGUoZmVlKSkge1xyXG4gICAgICAgICAgaW5mZWVhbW91bnQgPSBmZWVwYWlkLnN1YihmZWUpXHJcbiAgICAgICAgICBmZWVwYWlkID0gZmVlLmNsb25lKClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW5mZWVhbW91bnQgPSB6ZXJvLmNsb25lKClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHR4aWQ6IEJ1ZmZlciA9IHV0eG8uZ2V0VHhJRCgpXHJcbiAgICAgIGNvbnN0IG91dHB1dGlkeDogQnVmZmVyID0gdXR4by5nZXRPdXRwdXRJZHgoKVxyXG4gICAgICBjb25zdCBpbnB1dDogU0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW10KVxyXG4gICAgICBjb25zdCB4ZmVyaW46IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KFxyXG4gICAgICAgIHR4aWQsXHJcbiAgICAgICAgb3V0cHV0aWR4LFxyXG4gICAgICAgIGFzc2V0SUQsXHJcbiAgICAgICAgaW5wdXRcclxuICAgICAgKVxyXG4gICAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IG91dHB1dC5nZXRBZGRyZXNzZXMoKVxyXG4gICAgICBjb25zdCBzcGVuZGVyczogQnVmZmVyW10gPSBvdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbSwgYXNPZilcclxuICAgICAgZm9yIChsZXQgajogbnVtYmVyID0gMDsgaiA8IHNwZW5kZXJzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgY29uc3QgaWR4OiBudW1iZXIgPSBvdXRwdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tgJHtqfWBdKVxyXG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XHJcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcclxuICAgICAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRJbXBvcnRUeDogbm8gc3VjaCBcIiArXHJcbiAgICAgICAgICAgICAgYGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJzW2Ake2p9YF19YFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tgJHtqfWBdKVxyXG4gICAgICB9XHJcbiAgICAgIGltcG9ydElucy5wdXNoKHhmZXJpbilcclxuICAgICAgLy9hZGQgZXh0cmEgb3V0cHV0cyBmb3IgZWFjaCBhbW91bnQgKGNhbGN1bGF0ZWQgZnJvbSB0aGUgaW1wb3J0ZWQgaW5wdXRzKSwgbWludXMgZmVlc1xyXG4gICAgICBpZiAoaW5mZWVhbW91bnQuZ3QoemVybykpIHtcclxuICAgICAgICBjb25zdCBzcGVuZG91dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXHJcbiAgICAgICAgICBvdXRwdXQuZ2V0T3V0cHV0SUQoKSxcclxuICAgICAgICAgIGluZmVlYW1vdW50LFxyXG4gICAgICAgICAgdG9BZGRyZXNzZXMsXHJcbiAgICAgICAgICBsb2NrdGltZSxcclxuICAgICAgICAgIHRocmVzaG9sZFxyXG4gICAgICAgICkgYXMgQW1vdW50T3V0cHV0XHJcbiAgICAgICAgY29uc3QgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcclxuICAgICAgICAgIGFzc2V0SUQsXHJcbiAgICAgICAgICBzcGVuZG91dFxyXG4gICAgICAgIClcclxuICAgICAgICBvdXRzLnB1c2goeGZlcm91dClcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCByZW1haW5pbmcgZmVlcyBmcm9tIHRoZSBwcm92aWRlZCBhZGRyZXNzZXNcclxuICAgIGxldCBmZWVSZW1haW5pbmc6IEJOID0gZmVlLnN1YihmZWVwYWlkKVxyXG4gICAgaWYgKGZlZVJlbWFpbmluZy5ndCh6ZXJvKSAmJiB0aGlzLl9mZWVDaGVjayhmZWVSZW1haW5pbmcsIGZlZUFzc2V0SUQpKSB7XHJcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxyXG4gICAgICAgIHRvQWRkcmVzc2VzLFxyXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgICAgY2hhbmdlQWRkcmVzc2VzXHJcbiAgICAgIClcclxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZVJlbWFpbmluZylcclxuICAgICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcclxuICAgICAgICBhYWQsXHJcbiAgICAgICAgYXNPZixcclxuICAgICAgICBsb2NrdGltZSxcclxuICAgICAgICB0aHJlc2hvbGRcclxuICAgICAgKVxyXG4gICAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxyXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbXBvcnRUeDogSW1wb3J0VHggPSBuZXcgSW1wb3J0VHgoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmxvY2tjaGFpbklELFxyXG4gICAgICBvdXRzLFxyXG4gICAgICBpbnMsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIHNvdXJjZUNoYWluLFxyXG4gICAgICBpbXBvcnRJbnNcclxuICAgIClcclxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChpbXBvcnRUeClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0VHggdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cclxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBqdW5lQXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIEpVTkVcclxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyByZWNpZXZlcyB0aGUgSlVORVxyXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3ducyB0aGUgSlVORVxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgb2YgdGhlIEpVTkVcclxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBPcHRpb25hbC4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdG8gc2VuZCB0aGUgYXNzZXQuXHJcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xyXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqXHJcbiAgICovXHJcbiAgYnVpbGRFeHBvcnRUeCA9IChcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyLFxyXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXHJcbiAgICBhbW91bnQ6IEJOLFxyXG4gICAganVuZUFzc2V0SUQ6IEJ1ZmZlciwgLy8gVE9ETzogcmVuYW1lIHRoaXMgdG8gYW1vdW50QXNzZXRJRFxyXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxyXG4gICAgZGVzdGluYXRpb25DaGFpbjogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxyXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxyXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXHJcbiAgKTogVW5zaWduZWRUeCA9PiB7XHJcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cclxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcbiAgICBsZXQgZXhwb3J0b3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxyXG5cclxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkcmVzc2VzID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyA9IHRvQWRkcmVzc2VzXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWRcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGZlZUFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgZmVlQXNzZXRJRCA9IGp1bmVBc3NldElEXHJcbiAgICB9IGVsc2UgaWYgKGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgIT09IGp1bmVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBGZWVBc3NldEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkRXhwb3J0VHg6IFwiICsgYGZlZUFzc2V0SUQgbXVzdCBtYXRjaCBqdW5lQXNzZXRJRGBcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShcclxuICAgICAgICBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldHdvcmtJRH1gXS5YW1wiYmxvY2tjaGFpbklEXCJdXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcclxuICAgICAgdG9BZGRyZXNzZXMsXHJcbiAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgIGNoYW5nZUFkZHJlc3Nlc1xyXG4gICAgKVxyXG4gICAgaWYgKGp1bmVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XHJcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChqdW5lQXNzZXRJRCwgYW1vdW50LCBmZWUpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoanVuZUFzc2V0SUQsIGFtb3VudCwgemVybylcclxuICAgICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcclxuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcclxuICAgICAgYWFkLFxyXG4gICAgICBhc09mLFxyXG4gICAgICBsb2NrdGltZSxcclxuICAgICAgdGhyZXNob2xkXHJcbiAgICApXHJcbiAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcclxuICAgICAgb3V0cyA9IGFhZC5nZXRDaGFuZ2VPdXRwdXRzKClcclxuICAgICAgZXhwb3J0b3V0cyA9IGFhZC5nZXRPdXRwdXRzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGV4cG9ydFR4OiBFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeChcclxuICAgICAgbmV0d29ya0lELFxyXG4gICAgICBibG9ja2NoYWluSUQsXHJcbiAgICAgIG91dHMsXHJcbiAgICAgIGlucyxcclxuICAgICAgbWVtbyxcclxuICAgICAgZGVzdGluYXRpb25DaGFpbixcclxuICAgICAgZXhwb3J0b3V0c1xyXG4gICAgKVxyXG5cclxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChleHBvcnRUeClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0gdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEJsb2NrY2hhaW5pZCwgZGVmYXVsdCB1bmRlZmluZWRcclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHBheXMgdGhlIGZlZXMgaW4gSlVORVxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgZmVlIHBheW1lbnRcclxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXHJcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxyXG4gICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBKVU5FIGlzIHJldHVybmVkKS5cclxuICAgKiBAcGFyYW0gd2VpZ2h0IFRoZSBhbW91bnQgb2Ygd2VpZ2h0IGZvciB0aGlzIHN1Ym5ldCB2YWxpZGF0b3IuXHJcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gc3VibmV0QXV0aENyZWRlbnRpYWxzIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBpbmRleCBhbmQgYWRkcmVzcyB0byBzaWduIGZvciBlYWNoIFN1Ym5ldEF1dGguXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG4gIGJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHggPSAoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXHJcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcclxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIG5vZGVJRDogQnVmZmVyLFxyXG4gICAgc3RhcnRUaW1lOiBCTixcclxuICAgIGVuZFRpbWU6IEJOLFxyXG4gICAgd2VpZ2h0OiBCTixcclxuICAgIHN1Ym5ldElEOiBzdHJpbmcsXHJcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxyXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXHJcbiAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbHM6IFtudW1iZXIsIEJ1ZmZlcl1bXSA9IFtdXHJcbiAgKTogVW5zaWduZWRUeCA9PiB7XHJcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cclxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcblxyXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcclxuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcclxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBcIlVUWE9TZXQuYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcclxuICAgICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXHJcbiAgICAgICAgZnJvbUFkZHJlc3NlcyxcclxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICAgIGNoYW5nZUFkZHJlc3Nlc1xyXG4gICAgICApXHJcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXHJcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxyXG4gICAgICAgIGFhZCxcclxuICAgICAgICBhc09mLFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgdHJ1ZVxyXG4gICAgICApXHJcbiAgICAgIGlmICh0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxyXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgc3VjY2Vzc1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWRkU3VibmV0VmFsaWRhdG9yVHg6IEFkZFN1Ym5ldFZhbGlkYXRvclR4ID0gbmV3IEFkZFN1Ym5ldFZhbGlkYXRvclR4KFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgb3V0cyxcclxuICAgICAgaW5zLFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBub2RlSUQsXHJcbiAgICAgIHN0YXJ0VGltZSxcclxuICAgICAgZW5kVGltZSxcclxuICAgICAgd2VpZ2h0LFxyXG4gICAgICBzdWJuZXRJRFxyXG4gICAgKVxyXG4gICAgc3VibmV0QXV0aENyZWRlbnRpYWxzLmZvckVhY2goXHJcbiAgICAgIChzdWJuZXRBdXRoQ3JlZGVudGlhbDogW251bWJlciwgQnVmZmVyXSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGFkZFN1Ym5ldFZhbGlkYXRvclR4LmFkZFNpZ25hdHVyZUlkeChcclxuICAgICAgICAgIHN1Ym5ldEF1dGhDcmVkZW50aWFsWzBdLFxyXG4gICAgICAgICAgc3VibmV0QXV0aENyZWRlbnRpYWxbMV1cclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgIClcclxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChhZGRTdWJuZXRWYWxpZGF0b3JUeClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBbW0FkZERlbGVnYXRvclR4XV0gdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEJsb2NrY2hhaW5pZCwgZGVmYXVsdCB1bmRlZmluZWRcclxuICAgKiBAcGFyYW0ganVuZUFzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciBKVU5FXHJcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZWNpZXZlcyB0aGUgc3Rha2UgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHBheXMgdGhlIGZlZXMgYW5kIHRoZSBzdGFrZVxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgc3Rha2luZyBwYXltZW50XHJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxyXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cclxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgSlVORSBpcyByZXR1cm5lZCkuXHJcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBhbW91bnQgb2Ygc3Rha2UgdG8gYmUgZGVsZWdhdGVkIGluIG5KVU5FLlxyXG4gICAqIEBwYXJhbSByZXdhcmRMb2NrdGltZSBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIHJld2FyZCBvdXRwdXRzXHJcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE9cclxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhlIHZhbGlkYXRvciByZXdhcmQgZ29lcy5cclxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXHJcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcclxuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIGNoYW5nZSBVVFhPXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG4gIGJ1aWxkQWRkRGVsZWdhdG9yVHggPSAoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXHJcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcclxuICAgIGp1bmVBc3NldElEOiBCdWZmZXIsXHJcbiAgICB0b0FkZHJlc3NlczogQnVmZmVyW10sXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10sXHJcbiAgICBub2RlSUQ6IEJ1ZmZlcixcclxuICAgIHN0YXJ0VGltZTogQk4sXHJcbiAgICBlbmRUaW1lOiBCTixcclxuICAgIHN0YWtlQW1vdW50OiBCTixcclxuICAgIHJld2FyZExvY2t0aW1lOiBCTixcclxuICAgIHJld2FyZFRocmVzaG9sZDogbnVtYmVyLFxyXG4gICAgcmV3YXJkQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcclxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxyXG4gICk6IFVuc2lnbmVkVHggPT4ge1xyXG4gICAgaWYgKHJld2FyZFRocmVzaG9sZCA+IHJld2FyZEFkZHJlc3Nlcy5sZW5ndGgpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IFRocmVzaG9sZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkQWRkRGVsZWdhdG9yVHg6IHJld2FyZCB0aHJlc2hvbGQgaXMgZ3JlYXRlciB0aGFuIG51bWJlciBvZiBhZGRyZXNzZXNcIlxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyZXNzZXMgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXNcclxuICAgIH1cclxuXHJcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cclxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcbiAgICBsZXQgc3Rha2VPdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcblxyXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcclxuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcclxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXHJcbiAgICAgICAgXCJVVFhPU2V0LmJ1aWxkQWRkRGVsZWdhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxyXG4gICAgICB0b0FkZHJlc3NlcyxcclxuICAgICAgZnJvbUFkZHJlc3NlcyxcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzXHJcbiAgICApXHJcbiAgICBpZiAoanVuZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcclxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGp1bmVBc3NldElELCBzdGFrZUFtb3VudCwgZmVlKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGp1bmVBc3NldElELCBzdGFrZUFtb3VudCwgemVybylcclxuICAgICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcclxuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcclxuICAgICAgYWFkLFxyXG4gICAgICBhc09mLFxyXG4gICAgICB1bmRlZmluZWQsXHJcbiAgICAgIGNoYW5nZVRocmVzaG9sZCxcclxuICAgICAgdHJ1ZVxyXG4gICAgKVxyXG4gICAgaWYgKHR5cGVvZiBtaW5TcGVuZGFibGVFcnIgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXHJcbiAgICAgIG91dHMgPSBhYWQuZ2V0Q2hhbmdlT3V0cHV0cygpXHJcbiAgICAgIHN0YWtlT3V0cyA9IGFhZC5nZXRPdXRwdXRzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJld2FyZE91dHB1dE93bmVyczogU0VDUE93bmVyT3V0cHV0ID0gbmV3IFNFQ1BPd25lck91dHB1dChcclxuICAgICAgcmV3YXJkQWRkcmVzc2VzLFxyXG4gICAgICByZXdhcmRMb2NrdGltZSxcclxuICAgICAgcmV3YXJkVGhyZXNob2xkXHJcbiAgICApXHJcblxyXG4gICAgY29uc3QgVVR4OiBBZGREZWxlZ2F0b3JUeCA9IG5ldyBBZGREZWxlZ2F0b3JUeChcclxuICAgICAgbmV0d29ya0lELFxyXG4gICAgICBibG9ja2NoYWluSUQsXHJcbiAgICAgIG91dHMsXHJcbiAgICAgIGlucyxcclxuICAgICAgbWVtbyxcclxuICAgICAgbm9kZUlELFxyXG4gICAgICBzdGFydFRpbWUsXHJcbiAgICAgIGVuZFRpbWUsXHJcbiAgICAgIHN0YWtlQW1vdW50LFxyXG4gICAgICBzdGFrZU91dHMsXHJcbiAgICAgIG5ldyBQYXJzZWFibGVPdXRwdXQocmV3YXJkT3V0cHV0T3duZXJzKVxyXG4gICAgKVxyXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KFVUeClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBbW0FkZFZhbGlkYXRvclR4XV0gdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEJsb2NrY2hhaW5JRCwgZGVmYXVsdCB1bmRlZmluZWRcclxuICAgKiBAcGFyYW0ganVuZUFzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciBKVU5FXHJcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZWNpZXZlcyB0aGUgc3Rha2UgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHBheXMgdGhlIGZlZXMgYW5kIHRoZSBzdGFrZVxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgc3Rha2luZyBwYXltZW50XHJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxyXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cclxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgSlVORSBpcyByZXR1cm5lZCkuXHJcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBhbW91bnQgb2Ygc3Rha2UgdG8gYmUgZGVsZWdhdGVkIGluIG5KVU5FLlxyXG4gICAqIEBwYXJhbSByZXdhcmRMb2NrdGltZSBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIHJld2FyZCBvdXRwdXRzXHJcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE9cclxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhlIHZhbGlkYXRvciByZXdhcmQgZ29lcy5cclxuICAgKiBAcGFyYW0gZGVsZWdhdGlvbkZlZSBBIG51bWJlciBmb3IgdGhlIHBlcmNlbnRhZ2Ugb2YgcmV3YXJkIHRvIGJlIGdpdmVuIHRvIHRoZSB2YWxpZGF0b3Igd2hlbiBzb21lb25lIGRlbGVnYXRlcyB0byB0aGVtLiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLlxyXG4gICAqIEBwYXJhbSBtaW5TdGFrZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgbWluaW11bSBzdGFrZSByZXF1aXJlZCB0byB2YWxpZGF0ZSBvbiB0aGlzIG5ldHdvcmsuXHJcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXHJcbiAgICovXHJcbiAgYnVpbGRBZGRWYWxpZGF0b3JUeCA9IChcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxyXG4gICAganVuZUFzc2V0SUQ6IEJ1ZmZlcixcclxuICAgIHRvQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIG5vZGVJRDogQnVmZmVyLFxyXG4gICAgc3RhcnRUaW1lOiBCTixcclxuICAgIGVuZFRpbWU6IEJOLFxyXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxyXG4gICAgcmV3YXJkTG9ja3RpbWU6IEJOLFxyXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIsXHJcbiAgICByZXdhcmRBZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgZGVsZWdhdGlvbkZlZTogbnVtYmVyLFxyXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXHJcbiAgKTogVW5zaWduZWRUeCA9PiB7XHJcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cclxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcbiAgICBsZXQgc3Rha2VPdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXHJcblxyXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcclxuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcclxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXHJcbiAgICAgICAgXCJVVFhPU2V0LmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkZWxlZ2F0aW9uRmVlID4gMTAwIHx8IGRlbGVnYXRpb25GZWUgPCAwKSB7XHJcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXHJcbiAgICAgICAgXCJVVFhPU2V0LmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIHJhbmdlIG9mIDAgdG8gMTAwLCBpbmNsdXNpdmVseVwiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcclxuICAgICAgdG9BZGRyZXNzZXMsXHJcbiAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgIGNoYW5nZUFkZHJlc3Nlc1xyXG4gICAgKVxyXG4gICAgaWYgKGp1bmVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XHJcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChqdW5lQXNzZXRJRCwgc3Rha2VBbW91bnQsIGZlZSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChqdW5lQXNzZXRJRCwgc3Rha2VBbW91bnQsIHplcm8pXHJcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XHJcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoXHJcbiAgICAgIGFhZCxcclxuICAgICAgYXNPZixcclxuICAgICAgdW5kZWZpbmVkLFxyXG4gICAgICB1bmRlZmluZWQsXHJcbiAgICAgIHRydWVcclxuICAgIClcclxuICAgIGlmICh0eXBlb2YgbWluU3BlbmRhYmxlRXJyID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxyXG4gICAgICBvdXRzID0gYWFkLmdldENoYW5nZU91dHB1dHMoKVxyXG4gICAgICBzdGFrZU91dHMgPSBhYWQuZ2V0T3V0cHV0cygpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBtaW5TcGVuZGFibGVFcnJcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXdhcmRPdXRwdXRPd25lcnM6IFNFQ1BPd25lck91dHB1dCA9IG5ldyBTRUNQT3duZXJPdXRwdXQoXHJcbiAgICAgIHJld2FyZEFkZHJlc3NlcyxcclxuICAgICAgcmV3YXJkTG9ja3RpbWUsXHJcbiAgICAgIHJld2FyZFRocmVzaG9sZFxyXG4gICAgKVxyXG5cclxuICAgIGNvbnN0IFVUeDogQWRkVmFsaWRhdG9yVHggPSBuZXcgQWRkVmFsaWRhdG9yVHgoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmxvY2tjaGFpbklELFxyXG4gICAgICBvdXRzLFxyXG4gICAgICBpbnMsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIG5vZGVJRCxcclxuICAgICAgc3RhcnRUaW1lLFxyXG4gICAgICBlbmRUaW1lLFxyXG4gICAgICBzdGFrZUFtb3VudCxcclxuICAgICAgc3Rha2VPdXRzLFxyXG4gICAgICBuZXcgUGFyc2VhYmxlT3V0cHV0KHJld2FyZE91dHB1dE93bmVycyksXHJcbiAgICAgIGRlbGVnYXRpb25GZWVcclxuICAgIClcclxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChVVHgpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tDcmVhdGVTdWJuZXRUeF1dIHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBOZXR3b3JraWQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXHJcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBCbG9ja2NoYWluaWQsIGRlZmF1bHQgdW5kZWZpbmVkXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxyXG4gICAqIEBwYXJhbSBzdWJuZXRPd25lckFkZHJlc3NlcyBBbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGFkZHJlc3NlcyB0byBhZGQgdG8gYSBzdWJuZXRcclxuICAgKiBAcGFyYW0gc3VibmV0T3duZXJUaHJlc2hvbGQgVGhlIG51bWJlciBvZiBvd25lcnMncyBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIGFkZCBhIHZhbGlkYXRvciB0byB0aGUgbmV0d29ya1xyXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZFxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXHJcbiAgICovXHJcbiAgYnVpbGRDcmVhdGVTdWJuZXRUeCA9IChcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxyXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgc3VibmV0T3duZXJBZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgc3VibmV0T3duZXJUaHJlc2hvbGQ6IG51bWJlcixcclxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxyXG4gICk6IFVuc2lnbmVkVHggPT4ge1xyXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcclxuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxyXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cclxuXHJcbiAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xyXG4gICAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcclxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgICAgY2hhbmdlQWRkcmVzc2VzXHJcbiAgICAgIClcclxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcclxuICAgICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcclxuICAgICAgICBhYWQsXHJcbiAgICAgICAgYXNPZixcclxuICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgdW5kZWZpbmVkXHJcbiAgICAgIClcclxuICAgICAgaWYgKHR5cGVvZiBtaW5TcGVuZGFibGVFcnIgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcclxuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApXHJcbiAgICBjb25zdCBzdWJuZXRPd25lcnM6IFNFQ1BPd25lck91dHB1dCA9IG5ldyBTRUNQT3duZXJPdXRwdXQoXHJcbiAgICAgIHN1Ym5ldE93bmVyQWRkcmVzc2VzLFxyXG4gICAgICBsb2NrdGltZSxcclxuICAgICAgc3VibmV0T3duZXJUaHJlc2hvbGRcclxuICAgIClcclxuICAgIGNvbnN0IGNyZWF0ZVN1Ym5ldFR4OiBDcmVhdGVTdWJuZXRUeCA9IG5ldyBDcmVhdGVTdWJuZXRUeChcclxuICAgICAgbmV0d29ya0lELFxyXG4gICAgICBibG9ja2NoYWluSUQsXHJcbiAgICAgIG91dHMsXHJcbiAgICAgIGlucyxcclxuICAgICAgbWVtbyxcclxuICAgICAgc3VibmV0T3duZXJzXHJcbiAgICApXHJcblxyXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGNyZWF0ZVN1Ym5ldFR4KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tDcmVhdGVDaGFpblR4XV0uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEJsb2NrY2hhaW5pZCwgZGVmYXVsdCB1bmRlZmluZWRcclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXHJcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsIElEIG9mIHRoZSBTdWJuZXQgdGhhdCB2YWxpZGF0ZXMgdGhpcyBibG9ja2NoYWluXHJcbiAgICogQHBhcmFtIGNoYWluTmFtZSBPcHRpb25hbCBBIGh1bWFuIHJlYWRhYmxlIG5hbWUgZm9yIHRoZSBjaGFpbjsgbmVlZCBub3QgYmUgdW5pcXVlXHJcbiAgICogQHBhcmFtIHZtSUQgT3B0aW9uYWwgSUQgb2YgdGhlIFZNIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxyXG4gICAqIEBwYXJhbSBmeElEcyBPcHRpb25hbCBJRHMgb2YgdGhlIGZlYXR1cmUgZXh0ZW5zaW9ucyBydW5uaW5nIG9uIHRoZSBuZXcgY2hhaW5cclxuICAgKiBAcGFyYW0gZ2VuZXNpc0RhdGEgT3B0aW9uYWwgQnl0ZSByZXByZXNlbnRhdGlvbiBvZiBnZW5lc2lzIHN0YXRlIG9mIHRoZSBuZXcgY2hhaW5cclxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWRcclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIHN1Ym5ldEF1dGhDcmVkZW50aWFscyBPcHRpb25hbC4gQW4gYXJyYXkgb2YgaW5kZXggYW5kIGFkZHJlc3MgdG8gc2lnbiBmb3IgZWFjaCBTdWJuZXRBdXRoLlxyXG4gICAqIEBwYXJhbSBjaGFpbkFzc2V0SUQgT3B0aW9uYWwgSUQgb2YgdGhlIENoYWluQXNzZXRJRCB0aGF0IGlzIHVzZWQgdG8gcGF5IGZlZXMgaW4gdGhpcyBibG9ja2NoYWluIChkZWZhdWx0cyB0byBKVU5FIGlmIGVtcHR5KVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgQ3JlYXRlQ2hhaW5UeCBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG4gIGJ1aWxkQ3JlYXRlQ2hhaW5UeCA9IChcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxyXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgc3VibmV0SUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGNoYWluTmFtZTogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgdm1JRDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgZnhJRHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxyXG4gICAgZ2VuZXNpc0RhdGE6IHN0cmluZyB8IEdlbmVzaXNEYXRhID0gdW5kZWZpbmVkLFxyXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcclxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxyXG4gICAgc3VibmV0QXV0aENyZWRlbnRpYWxzOiBbbnVtYmVyLCBCdWZmZXJdW10gPSBbXSxcclxuICAgIGNoYWluQXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkXHJcbiAgKTogVW5zaWduZWRUeCA9PiB7XHJcbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxyXG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXHJcbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxyXG5cclxuICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XHJcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxyXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgICAgZnJvbUFkZHJlc3NlcyxcclxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcclxuICAgICAgKVxyXG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxyXG4gICAgICBjb25zdCBtaW5TcGVuZGFibGVFcnI6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxyXG4gICAgICAgIGFhZCxcclxuICAgICAgICBhc09mLFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICB1bmRlZmluZWRcclxuICAgICAgKVxyXG4gICAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxyXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGNoYWluQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBjaGFpbkFzc2V0SUQgPSBmZWVBc3NldElEXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY3JlYXRlQ2hhaW5UeDogQ3JlYXRlQ2hhaW5UeCA9IG5ldyBDcmVhdGVDaGFpblR4KFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgb3V0cyxcclxuICAgICAgaW5zLFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBzdWJuZXRJRCxcclxuICAgICAgY2hhaW5OYW1lLFxyXG4gICAgICB2bUlELFxyXG4gICAgICBmeElEcyxcclxuICAgICAgZ2VuZXNpc0RhdGEsXHJcbiAgICAgIGNoYWluQXNzZXRJRFxyXG4gICAgKVxyXG4gICAgc3VibmV0QXV0aENyZWRlbnRpYWxzLmZvckVhY2goXHJcbiAgICAgIChzdWJuZXRBdXRoQ3JlZGVudGlhbDogW251bWJlciwgQnVmZmVyXSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNyZWF0ZUNoYWluVHguYWRkU2lnbmF0dXJlSWR4KFxyXG4gICAgICAgICAgc3VibmV0QXV0aENyZWRlbnRpYWxbMF0sXHJcbiAgICAgICAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbFsxXVxyXG4gICAgICAgIClcclxuICAgICAgfVxyXG4gICAgKVxyXG5cclxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChjcmVhdGVDaGFpblR4KVxyXG4gIH1cclxufVxyXG4iXX0=