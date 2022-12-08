"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-UTXOs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const inputs_1 = require("./inputs");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../../common/utxos");
const constants_2 = require("../../utils/constants");
const assetamount_1 = require("../../common/assetamount");
const serialization_1 = require("../../utils/serialization");
const tx_1 = require("./tx");
const importtx_1 = require("./importtx");
const exporttx_1 = require("./exporttx");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
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
    create(codecID = constants_1.EVMConstants.LATESTCODEC, txID = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
        return new UTXO(codecID, txID, outputidx, assetID, output);
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
        this.getMinimumSpendable = (aad, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const utxoArray = this.getAllUTXOs();
            const outids = {};
            for (let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
                const u = utxoArray[`${i}`];
                const assetKey = u.getAssetID().toString("hex");
                const fromAddresses = aad.getSenders();
                if (u.getOutput() instanceof outputs_1.AmountOutput &&
                    aad.assetExists(assetKey) &&
                    u.getOutput().meetsThreshold(fromAddresses, asOf)) {
                    const am = aad.getAssetAmount(assetKey);
                    if (!am.isFinished()) {
                        const uout = u.getOutput();
                        outids[`${assetKey}`] = uout.getOutputID();
                        const amount = uout.getAmount();
                        am.spendAmount(amount);
                        const txid = u.getTxID();
                        const outputidx = u.getOutputIdx();
                        const input = new inputs_1.SECPTransferInput(amount);
                        const xferin = new inputs_1.TransferableInput(txid, outputidx, u.getAssetID(), input);
                        const spenders = uout.getSpenders(fromAddresses, asOf);
                        spenders.forEach((spender) => {
                            const idx = uout.getAddressIdx(spender);
                            if (idx === -1) {
                                /* istanbul ignore next */
                                throw new errors_1.AddressError("Error - UTXOSet.getMinimumSpendable: no such address in output");
                            }
                            xferin.getInput().addSignatureIdx(idx, spender);
                        });
                        aad.addInput(xferin);
                    }
                    else if (aad.assetExists(assetKey) &&
                        !(u.getOutput() instanceof outputs_1.AmountOutput)) {
                        /**
                         * Leaving the below lines, not simply for posterity, but for clarification.
                         * AssetIDs may have mixed OutputTypes.
                         * Some of those OutputTypes may implement AmountOutput.
                         * Others may not.
                         * Simply continue in this condition.
                         */
                        /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
                           + `implement AmountOutput: ${u.getOutput().getOutputID}`);*/
                        continue;
                    }
                }
            }
            if (!aad.canComplete()) {
                return new errors_1.InsufficientFundsError(`Error - UTXOSet.getMinimumSpendable: insufficient funds to create the transaction`);
            }
            const amounts = aad.getAmounts();
            const zero = new bn_js_1.default(0);
            for (let i = 0; i < amounts.length; i++) {
                const assetKey = amounts[`${i}`].getAssetIDString();
                const amount = amounts[`${i}`].getAmount();
                if (amount.gt(zero)) {
                    const spendout = (0, outputs_1.SelectOutputClass)(outids[`${assetKey}`], amount, aad.getDestinations(), locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(amounts[`${i}`].getAssetID(), spendout);
                    aad.addOutput(xferout);
                }
                const change = amounts[`${i}`].getChange();
                if (change.gt(zero)) {
                    const changeout = (0, outputs_1.SelectOutputClass)(outids[`${assetKey}`], change, aad.getChangeAddresses());
                    const chgxferout = new outputs_1.TransferableOutput(amounts[`${i}`].getAssetID(), changeout);
                    aad.addChange(chgxferout);
                }
            }
            return undefined;
        };
        /**
         * Creates an unsigned ImportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param toAddress The address to send the funds
         * @param importIns An array of [[TransferableInput]]s being imported
         * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildImportTx = (networkID, blockchainID, toAddress, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined) => {
            const zero = new bn_js_1.default(0);
            const map = new Map();
            let ins = [];
            let outs = [];
            let feepaid = new bn_js_1.default(0);
            if (typeof fee === "undefined") {
                fee = zero.clone();
            }
            // build a set of inputs which covers the fee
            atomics.forEach((atomic) => {
                const assetIDBuf = atomic.getAssetID();
                const assetID = bintools.cb58Encode(atomic.getAssetID());
                const output = atomic.getOutput();
                const amount = output.getAmount().clone();
                let infeeamount = amount.clone();
                if (typeof feeAssetID !== "undefined" &&
                    fee.gt(zero) &&
                    feepaid.lt(fee) &&
                    buffer_1.Buffer.compare(feeAssetID, assetIDBuf) === 0) {
                    feepaid = feepaid.add(infeeamount);
                    if (feepaid.gt(fee)) {
                        infeeamount = feepaid.sub(fee);
                        feepaid = fee.clone();
                    }
                    else {
                        infeeamount = zero.clone();
                    }
                }
                const txid = atomic.getTxID();
                const outputidx = atomic.getOutputIdx();
                const input = new inputs_1.SECPTransferInput(amount);
                const xferin = new inputs_1.TransferableInput(txid, outputidx, assetIDBuf, input);
                const from = output.getAddresses();
                const spenders = output.getSpenders(from);
                spenders.forEach((spender) => {
                    const idx = output.getAddressIdx(spender);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.buildImportTx: no such address in output");
                    }
                    xferin.getInput().addSignatureIdx(idx, spender);
                });
                ins.push(xferin);
                if (map.has(assetID)) {
                    infeeamount = infeeamount.add(new bn_js_1.default(map.get(assetID)));
                }
                map.set(assetID, infeeamount.toString());
            });
            for (let [assetID, amount] of map) {
                // skip empty output (imported output can be used for fee)
                if (new bn_js_1.default(amount).eq(new bn_js_1.default(0))) {
                    continue;
                }
                // Create single EVMOutput for each assetID
                const evmOutput = new outputs_1.EVMOutput(toAddress, new bn_js_1.default(amount), bintools.cb58Decode(assetID));
                outs.push(evmOutput);
            }
            // lexicographically sort array
            ins = ins.sort(inputs_1.TransferableInput.comparator());
            outs = outs.sort(outputs_1.EVMOutput.comparator());
            const importTx = new importtx_1.ImportTx(networkID, blockchainID, sourceChain, ins, outs, fee);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
         * Creates an unsigned ExportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param juneAssetID {@link https://github.com/feross/buffer|Buffer} of the AssetID for JUNE
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the JUNE
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the JUNE
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
         * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param feeToExport Optional. The amount being exported to destination chain to use as a fee
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildExportTx = (networkID, blockchainID, amount, juneAssetID, toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1, feeToExport = undefined) => {
            let ins = [];
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
                throw new errors_1.FeeAssetError("Error - UTXOSet.buildExportTx: feeAssetID must match juneAssetID");
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.PlatformChainID);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (juneAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(juneAssetID, amount, fee);
            }
            else {
                if (typeof feeToExport === "undefined") {
                    feeToExport = zero;
                }
                aad.addAssetAmount(juneAssetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, feeToExport, fee);
                }
            }
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === "undefined") {
                exportouts = aad.getOutputs();
            }
            else {
                throw success;
            }
            const exportTx = new exporttx_1.ExportTx(networkID, blockchainID, destinationChain, ins, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        const utxos = {};
        for (let utxoid in fields["utxos"]) {
            let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
            utxos[`${utxoidCleaned}`] = new UTXO();
            utxos[`${utxoidCleaned}`].deserialize(fields["utxos"][`${utxoid}`], encoding);
        }
        let addressUTXOs = {};
        for (let address in fields["addressUTXOs"]) {
            let addressCleaned = serializer.decoder(address, encoding, "cb58", "hex");
            let utxobalance = {};
            for (let utxoid in fields["addressUTXOs"][`${address}`]) {
                let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
                utxobalance[`${utxoidCleaned}`] = serializer.decoder(fields["addressUTXOs"][`${address}`][`${utxoid}`], encoding, "decimalString", "BN");
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
        else if (utxo instanceof UTXO) {
            utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.UTXOError("Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string");
        }
        return utxovar;
    }
    create() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vdXR4b3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQyxrREFBc0I7QUFDdEIsdUNBS2tCO0FBQ2xCLDJDQUEwQztBQUMxQyxxQ0FBeUU7QUFFekUsaUVBQXFEO0FBQ3JELDhDQUFrRTtBQUNsRSxxREFBdUQ7QUFDdkQsMERBR2lDO0FBQ2pDLDZEQUE2RTtBQUM3RSw2QkFBaUM7QUFDakMseUNBQXFDO0FBQ3JDLHlDQUFxQztBQUNyQywrQ0FLMkI7QUFFM0I7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sVUFBVSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRTdEOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQTtRQUNsQixZQUFPLEdBQUcsU0FBUyxDQUFBO0lBb0UvQixDQUFDO0lBbEVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLDJCQUFpQixFQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FB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LCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQVBJLUVWTS1VVFhPc1xyXG4gKi9cclxuXHJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxyXG5pbXBvcnQge1xyXG4gIEFtb3VudE91dHB1dCxcclxuICBTZWxlY3RPdXRwdXRDbGFzcyxcclxuICBUcmFuc2ZlcmFibGVPdXRwdXQsXHJcbiAgRVZNT3V0cHV0XHJcbn0gZnJvbSBcIi4vb3V0cHV0c1wiXHJcbmltcG9ydCB7IEVWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IEVWTUlucHV0LCBTRUNQVHJhbnNmZXJJbnB1dCwgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxyXG5pbXBvcnQgeyBPdXRwdXQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL291dHB1dFwiXHJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcclxuaW1wb3J0IHsgU3RhbmRhcmRVVFhPLCBTdGFuZGFyZFVUWE9TZXQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3V0eG9zXCJcclxuaW1wb3J0IHsgUGxhdGZvcm1DaGFpbklEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uLFxyXG4gIEFzc2V0QW1vdW50XHJcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hc3NldGFtb3VudFwiXHJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgVW5zaWduZWRUeCB9IGZyb20gXCIuL3R4XCJcclxuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tIFwiLi9pbXBvcnR0eFwiXHJcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSBcIi4vZXhwb3J0dHhcIlxyXG5pbXBvcnQge1xyXG4gIFVUWE9FcnJvcixcclxuICBBZGRyZXNzRXJyb3IsXHJcbiAgSW5zdWZmaWNpZW50RnVuZHNFcnJvcixcclxuICBGZWVBc3NldEVycm9yXHJcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemVyOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHNpbmdsZSBVVFhPLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFVUWE8gZXh0ZW5kcyBTdGFuZGFyZFVUWE8ge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9cIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXHJcblxyXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxyXG5cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pXHJcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKVxyXG4gIH1cclxuXHJcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG4gICAgdGhpcy5jb2RlY0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMilcclxuICAgIG9mZnNldCArPSAyXHJcbiAgICB0aGlzLnR4aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcclxuICAgIG9mZnNldCArPSAzMlxyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxyXG4gICAgb2Zmc2V0ICs9IDRcclxuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICBjb25zdCBvdXRwdXRpZDogbnVtYmVyID0gYmludG9vbHNcclxuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICAgIC5yZWFkVUludDMyQkUoMClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKVxyXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIFtbVVRYT11dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFN0YW5kYXJkVVRYTyBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzZXJpYWxpemVkIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9dXVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVVRYT11dXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIHVubGlrZSBtb3N0IGZyb21TdHJpbmdzLCBpdCBleHBlY3RzIHRoZSBzdHJpbmcgdG8gYmUgc2VyaWFsaXplZCBpbiBjYjU4IGZvcm1hdFxyXG4gICAqL1xyXG4gIGZyb21TdHJpbmcoc2VyaWFsaXplZDogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tVVFhPXV0uXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIHVubGlrZSBtb3N0IHRvU3RyaW5ncywgdGhpcyByZXR1cm5zIGluIGNiNTggc2VyaWFsaXphdGlvbiBmb3JtYXRcclxuICAgKi9cclxuICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSlcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgY29uc3QgdXR4bzogVVRYTyA9IG5ldyBVVFhPKClcclxuICAgIHV0eG8uZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXHJcbiAgICByZXR1cm4gdXR4byBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoXHJcbiAgICBjb2RlY0lEOiBudW1iZXIgPSBFVk1Db25zdGFudHMuTEFURVNUQ09ERUMsXHJcbiAgICB0eElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBvdXRwdXRpZHg6IEJ1ZmZlciB8IG51bWJlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG91dHB1dDogT3V0cHV0ID0gdW5kZWZpbmVkXHJcbiAgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IFVUWE8oY29kZWNJRCwgdHhJRCwgb3V0cHV0aWR4LCBhc3NldElELCBvdXRwdXQpIGFzIHRoaXNcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBc3NldEFtb3VudERlc3RpbmF0aW9uIGV4dGVuZHMgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uPFxyXG4gIFRyYW5zZmVyYWJsZU91dHB1dCxcclxuICBUcmFuc2ZlcmFibGVJbnB1dFxyXG4+IHt9XHJcblxyXG4vKipcclxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgc2V0IG9mIFtbVVRYT11dcy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBVVFhPU2V0IGV4dGVuZHMgU3RhbmRhcmRVVFhPU2V0PFVUWE8+IHtcclxuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVVFhPU2V0XCJcclxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxyXG5cclxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcclxuXHJcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogdm9pZCB7XHJcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxyXG4gICAgY29uc3QgdXR4b3M6IHt9ID0ge31cclxuICAgIGZvciAobGV0IHV0eG9pZCBpbiBmaWVsZHNbXCJ1dHhvc1wiXSkge1xyXG4gICAgICBsZXQgdXR4b2lkQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXplci5kZWNvZGVyKFxyXG4gICAgICAgIHV0eG9pZCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcImJhc2U1OFwiLFxyXG4gICAgICAgIFwiYmFzZTU4XCJcclxuICAgICAgKVxyXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdID0gbmV3IFVUWE8oKVxyXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdLmRlc2VyaWFsaXplKFxyXG4gICAgICAgIGZpZWxkc1tcInV0eG9zXCJdW2Ake3V0eG9pZH1gXSxcclxuICAgICAgICBlbmNvZGluZ1xyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBsZXQgYWRkcmVzc1VUWE9zOiB7fSA9IHt9XHJcbiAgICBmb3IgKGxldCBhZGRyZXNzIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXSkge1xyXG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2RlcihcclxuICAgICAgICBhZGRyZXNzLFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIFwiY2I1OFwiLFxyXG4gICAgICAgIFwiaGV4XCJcclxuICAgICAgKVxyXG4gICAgICBsZXQgdXR4b2JhbGFuY2U6IHt9ID0ge31cclxuICAgICAgZm9yIChsZXQgdXR4b2lkIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVtgJHthZGRyZXNzfWBdKSB7XHJcbiAgICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2RlcihcclxuICAgICAgICAgIHV0eG9pZCxcclxuICAgICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgICAgXCJiYXNlNThcIixcclxuICAgICAgICAgIFwiYmFzZTU4XCJcclxuICAgICAgICApXHJcbiAgICAgICAgdXR4b2JhbGFuY2VbYCR7dXR4b2lkQ2xlYW5lZH1gXSA9IHNlcmlhbGl6ZXIuZGVjb2RlcihcclxuICAgICAgICAgIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVtgJHthZGRyZXNzfWBdW2Ake3V0eG9pZH1gXSxcclxuICAgICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXHJcbiAgICAgICAgICBcIkJOXCJcclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgICAgYWRkcmVzc1VUWE9zW2Ake2FkZHJlc3NDbGVhbmVkfWBdID0gdXR4b2JhbGFuY2VcclxuICAgIH1cclxuICAgIHRoaXMudXR4b3MgPSB1dHhvc1xyXG4gICAgdGhpcy5hZGRyZXNzVVRYT3MgPSBhZGRyZXNzVVRYT3NcclxuICB9XHJcblxyXG4gIHBhcnNlVVRYTyh1dHhvOiBVVFhPIHwgc3RyaW5nKTogVVRYTyB7XHJcbiAgICBjb25zdCB1dHhvdmFyOiBVVFhPID0gbmV3IFVUWE8oKVxyXG4gICAgLy8gZm9yY2UgYSBjb3B5XHJcbiAgICBpZiAodHlwZW9mIHV0eG8gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgdXR4b3Zhci5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUodXR4bykpXHJcbiAgICB9IGVsc2UgaWYgKHV0eG8gaW5zdGFuY2VvZiBVVFhPKSB7XHJcbiAgICAgIHV0eG92YXIuZnJvbUJ1ZmZlcih1dHhvLnRvQnVmZmVyKCkpIC8vIGZvcmNlcyBhIGNvcHlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBVVFhPRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIFVUWE8ucGFyc2VVVFhPOiB1dHhvIHBhcmFtZXRlciBpcyBub3QgYSBVVFhPIG9yIHN0cmluZ1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHJldHVybiB1dHhvdmFyXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoKTogdGhpcyB7XHJcbiAgICByZXR1cm4gbmV3IFVUWE9TZXQoKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIGNvbnN0IG5ld3NldDogVVRYT1NldCA9IHRoaXMuY3JlYXRlKClcclxuICAgIGNvbnN0IGFsbFVUWE9zOiBVVFhPW10gPSB0aGlzLmdldEFsbFVUWE9zKClcclxuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcclxuICAgIHJldHVybiBuZXdzZXQgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgX2ZlZUNoZWNrKGZlZTogQk4sIGZlZUFzc2V0SUQ6IEJ1ZmZlcik6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgdHlwZW9mIGZlZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICBmZWUuZ3QobmV3IEJOKDApKSAmJlxyXG4gICAgICBmZWVBc3NldElEIGluc3RhbmNlb2YgQnVmZmVyXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBnZXRNaW5pbXVtU3BlbmRhYmxlID0gKFxyXG4gICAgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXHJcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXHJcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcclxuICApOiBFcnJvciA9PiB7XHJcbiAgICBjb25zdCB1dHhvQXJyYXk6IFVUWE9bXSA9IHRoaXMuZ2V0QWxsVVRYT3MoKVxyXG4gICAgY29uc3Qgb3V0aWRzOiBvYmplY3QgPSB7fVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9BcnJheS5sZW5ndGggJiYgIWFhZC5jYW5Db21wbGV0ZSgpOyBpKyspIHtcclxuICAgICAgY29uc3QgdTogVVRYTyA9IHV0eG9BcnJheVtgJHtpfWBdXHJcbiAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSB1LmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKVxyXG4gICAgICBjb25zdCBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSA9IGFhZC5nZXRTZW5kZXJzKClcclxuICAgICAgaWYgKFxyXG4gICAgICAgIHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQgJiZcclxuICAgICAgICBhYWQuYXNzZXRFeGlzdHMoYXNzZXRLZXkpICYmXHJcbiAgICAgICAgdS5nZXRPdXRwdXQoKS5tZWV0c1RocmVzaG9sZChmcm9tQWRkcmVzc2VzLCBhc09mKVxyXG4gICAgICApIHtcclxuICAgICAgICBjb25zdCBhbTogQXNzZXRBbW91bnQgPSBhYWQuZ2V0QXNzZXRBbW91bnQoYXNzZXRLZXkpXHJcbiAgICAgICAgaWYgKCFhbS5pc0ZpbmlzaGVkKCkpIHtcclxuICAgICAgICAgIGNvbnN0IHVvdXQ6IEFtb3VudE91dHB1dCA9IHUuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0XHJcbiAgICAgICAgICBvdXRpZHNbYCR7YXNzZXRLZXl9YF0gPSB1b3V0LmdldE91dHB1dElEKClcclxuICAgICAgICAgIGNvbnN0IGFtb3VudCA9IHVvdXQuZ2V0QW1vdW50KClcclxuICAgICAgICAgIGFtLnNwZW5kQW1vdW50KGFtb3VudClcclxuICAgICAgICAgIGNvbnN0IHR4aWQ6IEJ1ZmZlciA9IHUuZ2V0VHhJRCgpXHJcbiAgICAgICAgICBjb25zdCBvdXRwdXRpZHg6IEJ1ZmZlciA9IHUuZ2V0T3V0cHV0SWR4KClcclxuICAgICAgICAgIGNvbnN0IGlucHV0OiBTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpXHJcbiAgICAgICAgICBjb25zdCB4ZmVyaW46IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KFxyXG4gICAgICAgICAgICB0eGlkLFxyXG4gICAgICAgICAgICBvdXRwdXRpZHgsXHJcbiAgICAgICAgICAgIHUuZ2V0QXNzZXRJRCgpLFxyXG4gICAgICAgICAgICBpbnB1dFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgY29uc3Qgc3BlbmRlcnM6IEJ1ZmZlcltdID0gdW91dC5nZXRTcGVuZGVycyhmcm9tQWRkcmVzc2VzLCBhc09mKVxyXG4gICAgICAgICAgc3BlbmRlcnMuZm9yRWFjaCgoc3BlbmRlcjogQnVmZmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkeDogbnVtYmVyID0gdW91dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXIpXHJcbiAgICAgICAgICAgIGlmIChpZHggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogbm8gc3VjaCBhZGRyZXNzIGluIG91dHB1dFwiXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHhmZXJpbi5nZXRJbnB1dCgpLmFkZFNpZ25hdHVyZUlkeChpZHgsIHNwZW5kZXIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgYWFkLmFkZElucHV0KHhmZXJpbilcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgYWFkLmFzc2V0RXhpc3RzKGFzc2V0S2V5KSAmJlxyXG4gICAgICAgICAgISh1LmdldE91dHB1dCgpIGluc3RhbmNlb2YgQW1vdW50T3V0cHV0KVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgKiBMZWF2aW5nIHRoZSBiZWxvdyBsaW5lcywgbm90IHNpbXBseSBmb3IgcG9zdGVyaXR5LCBidXQgZm9yIGNsYXJpZmljYXRpb24uXHJcbiAgICAgICAgICAgKiBBc3NldElEcyBtYXkgaGF2ZSBtaXhlZCBPdXRwdXRUeXBlcy5cclxuICAgICAgICAgICAqIFNvbWUgb2YgdGhvc2UgT3V0cHV0VHlwZXMgbWF5IGltcGxlbWVudCBBbW91bnRPdXRwdXQuXHJcbiAgICAgICAgICAgKiBPdGhlcnMgbWF5IG5vdC5cclxuICAgICAgICAgICAqIFNpbXBseSBjb250aW51ZSBpbiB0aGlzIGNvbmRpdGlvbi5cclxuICAgICAgICAgICAqL1xyXG4gICAgICAgICAgLypyZXR1cm4gbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogb3V0cHV0SUQgZG9lcyBub3QgJ1xyXG4gICAgICAgICAgICAgKyBgaW1wbGVtZW50IEFtb3VudE91dHB1dDogJHt1LmdldE91dHB1dCgpLmdldE91dHB1dElEfWApOyovXHJcbiAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKCFhYWQuY2FuQ29tcGxldGUoKSkge1xyXG4gICAgICByZXR1cm4gbmV3IEluc3VmZmljaWVudEZ1bmRzRXJyb3IoXHJcbiAgICAgICAgYEVycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBpbnN1ZmZpY2llbnQgZnVuZHMgdG8gY3JlYXRlIHRoZSB0cmFuc2FjdGlvbmBcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgY29uc3QgYW1vdW50czogQXNzZXRBbW91bnRbXSA9IGFhZC5nZXRBbW91bnRzKClcclxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYW1vdW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjb25zdCBhc3NldEtleTogc3RyaW5nID0gYW1vdW50c1tgJHtpfWBdLmdldEFzc2V0SURTdHJpbmcoKVxyXG4gICAgICBjb25zdCBhbW91bnQ6IEJOID0gYW1vdW50c1tgJHtpfWBdLmdldEFtb3VudCgpXHJcbiAgICAgIGlmIChhbW91bnQuZ3QoemVybykpIHtcclxuICAgICAgICBjb25zdCBzcGVuZG91dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXHJcbiAgICAgICAgICBvdXRpZHNbYCR7YXNzZXRLZXl9YF0sXHJcbiAgICAgICAgICBhbW91bnQsXHJcbiAgICAgICAgICBhYWQuZ2V0RGVzdGluYXRpb25zKCksXHJcbiAgICAgICAgICBsb2NrdGltZSxcclxuICAgICAgICAgIHRocmVzaG9sZFxyXG4gICAgICAgICkgYXMgQW1vdW50T3V0cHV0XHJcbiAgICAgICAgY29uc3QgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcclxuICAgICAgICAgIGFtb3VudHNbYCR7aX1gXS5nZXRBc3NldElEKCksXHJcbiAgICAgICAgICBzcGVuZG91dFxyXG4gICAgICAgIClcclxuICAgICAgICBhYWQuYWRkT3V0cHV0KHhmZXJvdXQpXHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY2hhbmdlOiBCTiA9IGFtb3VudHNbYCR7aX1gXS5nZXRDaGFuZ2UoKVxyXG4gICAgICBpZiAoY2hhbmdlLmd0KHplcm8pKSB7XHJcbiAgICAgICAgY29uc3QgY2hhbmdlb3V0OiBBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhcclxuICAgICAgICAgIG91dGlkc1tgJHthc3NldEtleX1gXSxcclxuICAgICAgICAgIGNoYW5nZSxcclxuICAgICAgICAgIGFhZC5nZXRDaGFuZ2VBZGRyZXNzZXMoKVxyXG4gICAgICAgICkgYXMgQW1vdW50T3V0cHV0XHJcbiAgICAgICAgY29uc3QgY2hneGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcclxuICAgICAgICAgIGFtb3VudHNbYCR7aX1gXS5nZXRBc3NldElEKCksXHJcbiAgICAgICAgICBjaGFuZ2VvdXRcclxuICAgICAgICApXHJcbiAgICAgICAgYWFkLmFkZENoYW5nZShjaGd4ZmVyb3V0KVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydFR4IHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXHJcbiAgICogQHBhcmFtIHRvQWRkcmVzcyBUaGUgYWRkcmVzcyB0byBzZW5kIHRoZSBmdW5kc1xyXG4gICAqIEBwYXJhbSBpbXBvcnRJbnMgQW4gYXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcyBiZWluZyBpbXBvcnRlZFxyXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgY2hhaW5pZCB3aGVyZSB0aGUgaW1wb3J0cyBhcmUgY29taW5nIGZyb20uXHJcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uIEZlZSB3aWxsIGNvbWUgZnJvbSB0aGUgaW5wdXRzIGZpcnN0LCBpZiB0aGV5IGNhbi5cclxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxyXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXHJcbiAgICpcclxuICAgKi9cclxuICBidWlsZEltcG9ydFR4ID0gKFxyXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXHJcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcclxuICAgIHRvQWRkcmVzczogc3RyaW5nLFxyXG4gICAgYXRvbWljczogVVRYT1tdLFxyXG4gICAgc291cmNlQ2hhaW46IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWRcclxuICApOiBVbnNpZ25lZFR4ID0+IHtcclxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXHJcbiAgICBjb25zdCBtYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKClcclxuXHJcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cclxuICAgIGxldCBvdXRzOiBFVk1PdXRwdXRbXSA9IFtdXHJcbiAgICBsZXQgZmVlcGFpZDogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgICBpZiAodHlwZW9mIGZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBmZWUgPSB6ZXJvLmNsb25lKClcclxuICAgIH1cclxuXHJcbiAgICAvLyBidWlsZCBhIHNldCBvZiBpbnB1dHMgd2hpY2ggY292ZXJzIHRoZSBmZWVcclxuICAgIGF0b21pY3MuZm9yRWFjaCgoYXRvbWljOiBVVFhPKTogdm9pZCA9PiB7XHJcbiAgICAgIGNvbnN0IGFzc2V0SURCdWY6IEJ1ZmZlciA9IGF0b21pYy5nZXRBc3NldElEKClcclxuICAgICAgY29uc3QgYXNzZXRJRDogc3RyaW5nID0gYmludG9vbHMuY2I1OEVuY29kZShhdG9taWMuZ2V0QXNzZXRJRCgpKVxyXG4gICAgICBjb25zdCBvdXRwdXQ6IEFtb3VudE91dHB1dCA9IGF0b21pYy5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXRcclxuICAgICAgY29uc3QgYW1vdW50OiBCTiA9IG91dHB1dC5nZXRBbW91bnQoKS5jbG9uZSgpXHJcbiAgICAgIGxldCBpbmZlZWFtb3VudDogQk4gPSBhbW91bnQuY2xvbmUoKVxyXG5cclxuICAgICAgaWYgKFxyXG4gICAgICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgICAgZmVlLmd0KHplcm8pICYmXHJcbiAgICAgICAgZmVlcGFpZC5sdChmZWUpICYmXHJcbiAgICAgICAgQnVmZmVyLmNvbXBhcmUoZmVlQXNzZXRJRCwgYXNzZXRJREJ1ZikgPT09IDBcclxuICAgICAgKSB7XHJcbiAgICAgICAgZmVlcGFpZCA9IGZlZXBhaWQuYWRkKGluZmVlYW1vdW50KVxyXG4gICAgICAgIGlmIChmZWVwYWlkLmd0KGZlZSkpIHtcclxuICAgICAgICAgIGluZmVlYW1vdW50ID0gZmVlcGFpZC5zdWIoZmVlKVxyXG4gICAgICAgICAgZmVlcGFpZCA9IGZlZS5jbG9uZSgpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGluZmVlYW1vdW50ID0gemVyby5jbG9uZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB0eGlkOiBCdWZmZXIgPSBhdG9taWMuZ2V0VHhJRCgpXHJcbiAgICAgIGNvbnN0IG91dHB1dGlkeDogQnVmZmVyID0gYXRvbWljLmdldE91dHB1dElkeCgpXHJcbiAgICAgIGNvbnN0IGlucHV0OiBTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpXHJcbiAgICAgIGNvbnN0IHhmZXJpbjogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoXHJcbiAgICAgICAgdHhpZCxcclxuICAgICAgICBvdXRwdXRpZHgsXHJcbiAgICAgICAgYXNzZXRJREJ1ZixcclxuICAgICAgICBpbnB1dFxyXG4gICAgICApXHJcbiAgICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gb3V0cHV0LmdldEFkZHJlc3NlcygpXHJcbiAgICAgIGNvbnN0IHNwZW5kZXJzOiBCdWZmZXJbXSA9IG91dHB1dC5nZXRTcGVuZGVycyhmcm9tKVxyXG4gICAgICBzcGVuZGVycy5mb3JFYWNoKChzcGVuZGVyOiBCdWZmZXIpOiB2b2lkID0+IHtcclxuICAgICAgICBjb25zdCBpZHg6IG51bWJlciA9IG91dHB1dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXIpXHJcbiAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcclxuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5idWlsZEltcG9ydFR4OiBubyBzdWNoIGFkZHJlc3MgaW4gb3V0cHV0XCJcclxuICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgeGZlcmluLmdldElucHV0KCkuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcilcclxuICAgICAgfSlcclxuICAgICAgaW5zLnB1c2goeGZlcmluKVxyXG5cclxuICAgICAgaWYgKG1hcC5oYXMoYXNzZXRJRCkpIHtcclxuICAgICAgICBpbmZlZWFtb3VudCA9IGluZmVlYW1vdW50LmFkZChuZXcgQk4obWFwLmdldChhc3NldElEKSkpXHJcbiAgICAgIH1cclxuICAgICAgbWFwLnNldChhc3NldElELCBpbmZlZWFtb3VudC50b1N0cmluZygpKVxyXG4gICAgfSlcclxuXHJcbiAgICBmb3IgKGxldCBbYXNzZXRJRCwgYW1vdW50XSBvZiBtYXApIHtcclxuICAgICAgLy8gc2tpcCBlbXB0eSBvdXRwdXQgKGltcG9ydGVkIG91dHB1dCBjYW4gYmUgdXNlZCBmb3IgZmVlKVxyXG4gICAgICBpZiAobmV3IEJOKGFtb3VudCkuZXEobmV3IEJOKDApKSkge1xyXG4gICAgICAgIGNvbnRpbnVlXHJcbiAgICAgIH1cclxuICAgICAgLy8gQ3JlYXRlIHNpbmdsZSBFVk1PdXRwdXQgZm9yIGVhY2ggYXNzZXRJRFxyXG4gICAgICBjb25zdCBldm1PdXRwdXQ6IEVWTU91dHB1dCA9IG5ldyBFVk1PdXRwdXQoXHJcbiAgICAgICAgdG9BZGRyZXNzLFxyXG4gICAgICAgIG5ldyBCTihhbW91bnQpLFxyXG4gICAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRClcclxuICAgICAgKVxyXG4gICAgICBvdXRzLnB1c2goZXZtT3V0cHV0KVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGxleGljb2dyYXBoaWNhbGx5IHNvcnQgYXJyYXlcclxuICAgIGlucyA9IGlucy5zb3J0KFRyYW5zZmVyYWJsZUlucHV0LmNvbXBhcmF0b3IoKSlcclxuICAgIG91dHMgPSBvdXRzLnNvcnQoRVZNT3V0cHV0LmNvbXBhcmF0b3IoKSlcclxuXHJcbiAgICBjb25zdCBpbXBvcnRUeDogSW1wb3J0VHggPSBuZXcgSW1wb3J0VHgoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmxvY2tjaGFpbklELFxyXG4gICAgICBzb3VyY2VDaGFpbixcclxuICAgICAgaW5zLFxyXG4gICAgICBvdXRzLFxyXG4gICAgICBmZWVcclxuICAgIClcclxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChpbXBvcnRUeClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0VHggdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cclxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBqdW5lQXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgQXNzZXRJRCBmb3IgSlVORVxyXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2lldmVzIHRoZSBKVU5FXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd25zIHRoZSBKVU5FXHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cclxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBPcHRpb25hbC4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdG8gc2VuZCB0aGUgYXNzZXQuXHJcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xyXG4gICAqIEBwYXJhbSBmZWVUb0V4cG9ydCBPcHRpb25hbC4gVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCB0byBkZXN0aW5hdGlvbiBjaGFpbiB0byB1c2UgYXMgYSBmZWVcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqXHJcbiAgICovXHJcbiAgYnVpbGRFeHBvcnRUeCA9IChcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyLFxyXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXHJcbiAgICBhbW91bnQ6IEJOLFxyXG4gICAganVuZUFzc2V0SUQ6IEJ1ZmZlcixcclxuICAgIHRvQWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxyXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcclxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcclxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMSxcclxuICAgIGZlZVRvRXhwb3J0OiBCTiA9IHVuZGVmaW5lZFxyXG4gICk6IFVuc2lnbmVkVHggPT4ge1xyXG4gICAgbGV0IGluczogRVZNSW5wdXRbXSA9IFtdXHJcbiAgICBsZXQgZXhwb3J0b3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxyXG5cclxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkcmVzc2VzID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyA9IHRvQWRkcmVzc2VzXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWRcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGZlZUFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgZmVlQXNzZXRJRCA9IGp1bmVBc3NldElEXHJcbiAgICB9IGVsc2UgaWYgKGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgIT09IGp1bmVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBGZWVBc3NldEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkRXhwb3J0VHg6IGZlZUFzc2V0SUQgbXVzdCBtYXRjaCBqdW5lQXNzZXRJRFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoUGxhdGZvcm1DaGFpbklEKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxyXG4gICAgICB0b0FkZHJlc3NlcyxcclxuICAgICAgZnJvbUFkZHJlc3NlcyxcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzXHJcbiAgICApXHJcbiAgICBpZiAoanVuZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcclxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGp1bmVBc3NldElELCBhbW91bnQsIGZlZSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh0eXBlb2YgZmVlVG9FeHBvcnQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICBmZWVUb0V4cG9ydCA9IHplcm9cclxuICAgICAgfVxyXG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoanVuZUFzc2V0SUQsIGFtb3VudCwgemVybylcclxuICAgICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcclxuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgZmVlVG9FeHBvcnQsIGZlZSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3Qgc3VjY2VzczogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoXHJcbiAgICAgIGFhZCxcclxuICAgICAgYXNPZixcclxuICAgICAgbG9ja3RpbWUsXHJcbiAgICAgIHRocmVzaG9sZFxyXG4gICAgKVxyXG4gICAgaWYgKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGV4cG9ydG91dHMgPSBhYWQuZ2V0T3V0cHV0cygpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBzdWNjZXNzXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZXhwb3J0VHg6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgZGVzdGluYXRpb25DaGFpbixcclxuICAgICAgaW5zLFxyXG4gICAgICBleHBvcnRvdXRzXHJcbiAgICApXHJcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoZXhwb3J0VHgpXHJcbiAgfVxyXG59XHJcbiJdfQ==