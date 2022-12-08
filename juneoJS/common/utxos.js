"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardUTXOSet = exports.StandardUTXO = void 0;
/**
 * @packageDocumentation
 * @module Common-UTXOs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const output_1 = require("./output");
const helperfunctions_1 = require("../utils/helperfunctions");
const serialization_1 = require("../utils/serialization");
const errors_1 = require("../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single StandardUTXO.
 */
class StandardUTXO extends serialization_1.Serializable {
    /**
     * Class for representing a single StandardUTXO.
     *
     * @param codecID Optional number which specifies the codeID of the UTXO. Default 0
     * @param txID Optional {@link https://github.com/feross/buffer|Buffer} of transaction ID for the StandardUTXO
     * @param txidx Optional {@link https://github.com/feross/buffer|Buffer} or number for the index of the transaction's [[Output]]
     * @param assetID Optional {@link https://github.com/feross/buffer|Buffer} of the asset ID for the StandardUTXO
     * @param outputid Optional {@link https://github.com/feross/buffer|Buffer} or number of the output ID for the StandardUTXO
     */
    constructor(codecID = 0, txID = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
        super();
        this._typeName = "StandardUTXO";
        this._typeID = undefined;
        this.codecID = buffer_1.Buffer.alloc(2);
        this.txid = buffer_1.Buffer.alloc(32);
        this.outputidx = buffer_1.Buffer.alloc(4);
        this.assetID = buffer_1.Buffer.alloc(32);
        this.output = undefined;
        /**
         * Returns the numeric representation of the CodecID.
         */
        this.getCodecID = () => this.codecID.readUInt8(0);
        /**
         * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
         */
        this.getCodecIDBuffer = () => this.codecID;
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
         */
        this.getTxID = () => this.txid;
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
         */
        this.getOutputIdx = () => this.outputidx;
        /**
         * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAssetID = () => this.assetID;
        /**
         * Returns the UTXOID as a base-58 string (UTXOID is a string )
         */
        this.getUTXOID = () => bintools.bufferToB58(buffer_1.Buffer.concat([this.getTxID(), this.getOutputIdx()]));
        /**
         * Returns a reference to the output
         */
        this.getOutput = () => this.output;
        if (typeof codecID !== "undefined") {
            this.codecID.writeUInt8(codecID, 0);
        }
        if (typeof txID !== "undefined") {
            this.txid = txID;
        }
        if (typeof outputidx === "number") {
            this.outputidx.writeUInt32BE(outputidx, 0);
        }
        else if (outputidx instanceof buffer_1.Buffer) {
            this.outputidx = outputidx;
        }
        if (typeof assetID !== "undefined") {
            this.assetID = assetID;
        }
        if (typeof output !== "undefined") {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { codecID: serialization.encoder(this.codecID, encoding, "Buffer", "decimalString"), txid: serialization.encoder(this.txid, encoding, "Buffer", "cb58"), outputidx: serialization.encoder(this.outputidx, encoding, "Buffer", "decimalString"), assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58"), output: this.output.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.codecID = serialization.decoder(fields["codecID"], encoding, "decimalString", "Buffer", 2);
        this.txid = serialization.decoder(fields["txid"], encoding, "cb58", "Buffer", 32);
        this.outputidx = serialization.decoder(fields["outputidx"], encoding, "decimalString", "Buffer", 4);
        this.assetID = serialization.decoder(fields["assetID"], encoding, "cb58", "Buffer", 32);
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardUTXO]].
     */
    toBuffer() {
        const outbuff = this.output.toBuffer();
        const outputidbuffer = buffer_1.Buffer.alloc(4);
        outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
        const barr = [
            this.codecID,
            this.txid,
            this.outputidx,
            this.assetID,
            outputidbuffer,
            outbuff
        ];
        return buffer_1.Buffer.concat(barr, this.codecID.length +
            this.txid.length +
            this.outputidx.length +
            this.assetID.length +
            outputidbuffer.length +
            outbuff.length);
    }
}
exports.StandardUTXO = StandardUTXO;
/**
 * Class representing a set of [[StandardUTXO]]s.
 */
class StandardUTXOSet extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "StandardUTXOSet";
        this._typeID = undefined;
        this.utxos = {};
        this.addressUTXOs = {}; // maps address to utxoids:locktime
        /**
         * Returns true if the [[StandardUTXO]] is in the StandardUTXOSet.
         *
         * @param utxo Either a [[StandardUTXO]] a cb58 serialized string representing a StandardUTXO
         */
        this.includes = (utxo) => {
            let utxoX = undefined;
            let utxoid = undefined;
            try {
                utxoX = this.parseUTXO(utxo);
                utxoid = utxoX.getUTXOID();
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                }
                else {
                    console.log(e);
                }
                return false;
            }
            return utxoid in this.utxos;
        };
        /**
         * Removes a [[StandardUTXO]] from the [[StandardUTXOSet]] if it exists.
         *
         * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
         *
         * @returns A [[StandardUTXO]] if it was removed and undefined if nothing was removed.
         */
        this.remove = (utxo) => {
            let utxovar = undefined;
            try {
                utxovar = this.parseUTXO(utxo);
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                }
                else {
                    console.log(e);
                }
                return undefined;
            }
            const utxoid = utxovar.getUTXOID();
            if (!(utxoid in this.utxos)) {
                return undefined;
            }
            delete this.utxos[`${utxoid}`];
            const addresses = Object.keys(this.addressUTXOs);
            for (let i = 0; i < addresses.length; i++) {
                if (utxoid in this.addressUTXOs[addresses[`${i}`]]) {
                    delete this.addressUTXOs[addresses[`${i}`]][`${utxoid}`];
                }
            }
            return utxovar;
        };
        /**
         * Removes an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
         *
         * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
         * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
         *
         * @returns An array of UTXOs which were removed.
         */
        this.removeArray = (utxos) => {
            const removed = [];
            for (let i = 0; i < utxos.length; i++) {
                const result = this.remove(utxos[`${i}`]);
                if (typeof result !== "undefined") {
                    removed.push(result);
                }
            }
            return removed;
        };
        /**
         * Gets a [[StandardUTXO]] from the [[StandardUTXOSet]] by its UTXOID.
         *
         * @param utxoid String representing the UTXOID
         *
         * @returns A [[StandardUTXO]] if it exists in the set.
         */
        this.getUTXO = (utxoid) => this.utxos[`${utxoid}`];
        /**
         * Gets all the [[StandardUTXO]]s, optionally that match with UTXOIDs in an array
         *
         * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
         *
         * @returns An array of [[StandardUTXO]]s.
         */
        this.getAllUTXOs = (utxoids = undefined) => {
            let results = [];
            if (typeof utxoids !== "undefined" && Array.isArray(utxoids)) {
                results = utxoids
                    .filter((utxoid) => this.utxos[`${utxoid}`])
                    .map((utxoid) => this.utxos[`${utxoid}`]);
            }
            else {
                results = Object.values(this.utxos);
            }
            return results;
        };
        /**
         * Gets all the [[StandardUTXO]]s as strings, optionally that match with UTXOIDs in an array.
         *
         * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
         *
         * @returns An array of [[StandardUTXO]]s as cb58 serialized strings.
         */
        this.getAllUTXOStrings = (utxoids = undefined) => {
            const results = [];
            const utxos = Object.keys(this.utxos);
            if (typeof utxoids !== "undefined" && Array.isArray(utxoids)) {
                for (let i = 0; i < utxoids.length; i++) {
                    if (utxoids[`${i}`] in this.utxos) {
                        results.push(this.utxos[utxoids[`${i}`]].toString());
                    }
                }
            }
            else {
                for (const u of utxos) {
                    results.push(this.utxos[`${u}`].toString());
                }
            }
            return results;
        };
        /**
         * Given an address or array of addresses, returns all the UTXOIDs for those addresses
         *
         * @param address An array of address {@link https://github.com/feross/buffer|Buffer}s
         * @param spendable If true, only retrieves UTXOIDs whose locktime has passed
         *
         * @returns An array of addresses.
         */
        this.getUTXOIDs = (addresses = undefined, spendable = true) => {
            if (typeof addresses !== "undefined") {
                const results = [];
                const now = (0, helperfunctions_1.UnixNow)();
                for (let i = 0; i < addresses.length; i++) {
                    if (addresses[`${i}`].toString("hex") in this.addressUTXOs) {
                        const entries = Object.entries(this.addressUTXOs[addresses[`${i}`].toString("hex")]);
                        for (const [utxoid, locktime] of entries) {
                            if ((results.indexOf(utxoid) === -1 &&
                                spendable &&
                                locktime.lte(now)) ||
                                !spendable) {
                                results.push(utxoid);
                            }
                        }
                    }
                }
                return results;
            }
            return Object.keys(this.utxos);
        };
        /**
         * Gets the addresses in the [[StandardUTXOSet]] and returns an array of {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAddresses = () => Object.keys(this.addressUTXOs).map((k) => buffer_1.Buffer.from(k, "hex"));
        /**
         * Returns the balance of a set of addresses in the StandardUTXOSet.
         *
         * @param addresses An array of addresses
         * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized representation of an AssetID
         * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns Returns the total balance as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getBalance = (addresses, assetID, asOf = undefined) => {
            const utxoids = this.getUTXOIDs(addresses);
            const utxos = this.getAllUTXOs(utxoids);
            let spend = new bn_js_1.default(0);
            let asset;
            if (typeof assetID === "string") {
                asset = bintools.cb58Decode(assetID);
            }
            else {
                asset = assetID;
            }
            for (let i = 0; i < utxos.length; i++) {
                if (utxos[`${i}`].getOutput() instanceof output_1.StandardAmountOutput &&
                    utxos[`${i}`].getAssetID().toString("hex") === asset.toString("hex") &&
                    utxos[`${i}`].getOutput().meetsThreshold(addresses, asOf)) {
                    spend = spend.add(utxos[`${i}`].getOutput().getAmount());
                }
            }
            return spend;
        };
        /**
         * Gets all the Asset IDs, optionally that match with Asset IDs in an array
         *
         * @param utxoids An optional array of Addresses as string or Buffer, returns all Asset IDs if not provided
         *
         * @returns An array of {@link https://github.com/feross/buffer|Buffer} representing the Asset IDs.
         */
        this.getAssetIDs = (addresses = undefined) => {
            const results = new Set();
            let utxoids = [];
            if (typeof addresses !== "undefined") {
                utxoids = this.getUTXOIDs(addresses);
            }
            else {
                utxoids = this.getUTXOIDs();
            }
            for (let i = 0; i < utxoids.length; i++) {
                if (utxoids[`${i}`] in this.utxos && !(utxoids[`${i}`] in results)) {
                    results.add(this.utxos[utxoids[`${i}`]].getAssetID());
                }
            }
            return [...results];
        };
        /**
         * Returns a new set with copy of UTXOs in this and set parameter.
         *
         * @param utxoset The [[StandardUTXOSet]] to merge with this one
         * @param hasUTXOIDs Will subselect a set of [[StandardUTXO]]s which have the UTXOIDs provided in this array, defults to all UTXOs
         *
         * @returns A new StandardUTXOSet that contains all the filtered elements.
         */
        this.merge = (utxoset, hasUTXOIDs = undefined) => {
            const results = this.create();
            const utxos1 = this.getAllUTXOs(hasUTXOIDs);
            const utxos2 = utxoset.getAllUTXOs(hasUTXOIDs);
            const process = (utxo) => {
                results.add(utxo);
            };
            utxos1.forEach(process);
            utxos2.forEach(process);
            return results;
        };
        /**
         * Set intersetion between this set and a parameter.
         *
         * @param utxoset The set to intersect
         *
         * @returns A new StandardUTXOSet containing the intersection
         */
        this.intersection = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1.filter((utxoid) => us2.includes(utxoid));
            return this.merge(utxoset, results);
        };
        /**
         * Set difference between this set and a parameter.
         *
         * @param utxoset The set to difference
         *
         * @returns A new StandardUTXOSet containing the difference
         */
        this.difference = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1.filter((utxoid) => !us2.includes(utxoid));
            return this.merge(utxoset, results);
        };
        /**
         * Set symmetrical difference between this set and a parameter.
         *
         * @param utxoset The set to symmetrical difference
         *
         * @returns A new StandardUTXOSet containing the symmetrical difference
         */
        this.symDifference = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1
                .filter((utxoid) => !us2.includes(utxoid))
                .concat(us2.filter((utxoid) => !us1.includes(utxoid)));
            return this.merge(utxoset, results);
        };
        /**
         * Set union between this set and a parameter.
         *
         * @param utxoset The set to union
         *
         * @returns A new StandardUTXOSet containing the union
         */
        this.union = (utxoset) => this.merge(utxoset);
        /**
         * Merges a set by the rule provided.
         *
         * @param utxoset The set to merge by the MergeRule
         * @param mergeRule The [[MergeRule]] to apply
         *
         * @returns A new StandardUTXOSet containing the merged data
         *
         * @remarks
         * The merge rules are as follows:
         *   * "intersection" - the intersection of the set
         *   * "differenceSelf" - the difference between the existing data and new set
         *   * "differenceNew" - the difference between the new data and the existing set
         *   * "symDifference" - the union of the differences between both sets of data
         *   * "union" - the unique set of all elements contained in both sets
         *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
         *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
         */
        this.mergeByRule = (utxoset, mergeRule) => {
            let uSet;
            switch (mergeRule) {
                case "intersection":
                    return this.intersection(utxoset);
                case "differenceSelf":
                    return this.difference(utxoset);
                case "differenceNew":
                    return utxoset.difference(this);
                case "symDifference":
                    return this.symDifference(utxoset);
                case "union":
                    return this.union(utxoset);
                case "unionMinusNew":
                    uSet = this.union(utxoset);
                    return uSet.difference(utxoset);
                case "unionMinusSelf":
                    uSet = this.union(utxoset);
                    return uSet.difference(this);
                default:
                    throw new errors_1.MergeRuleError("Error - StandardUTXOSet.mergeByRule: bad MergeRule");
            }
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let utxos = {};
        for (let utxoid in this.utxos) {
            let utxoidCleaned = serialization.encoder(utxoid, encoding, "base58", "base58");
            utxos[`${utxoidCleaned}`] = this.utxos[`${utxoid}`].serialize(encoding);
        }
        let addressUTXOs = {};
        for (let address in this.addressUTXOs) {
            let addressCleaned = serialization.encoder(address, encoding, "hex", "cb58");
            let utxobalance = {};
            for (let utxoid in this.addressUTXOs[`${address}`]) {
                let utxoidCleaned = serialization.encoder(utxoid, encoding, "base58", "base58");
                utxobalance[`${utxoidCleaned}`] = serialization.encoder(this.addressUTXOs[`${address}`][`${utxoid}`], encoding, "BN", "decimalString");
            }
            addressUTXOs[`${addressCleaned}`] = utxobalance;
        }
        return Object.assign(Object.assign({}, fields), { utxos,
            addressUTXOs });
    }
    /**
     * Adds a [[StandardUTXO]] to the StandardUTXOSet.
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns A [[StandardUTXO]] if one was added and undefined if nothing was added.
     */
    add(utxo, overwrite = false) {
        let utxovar = undefined;
        try {
            utxovar = this.parseUTXO(utxo);
        }
        catch (e) {
            if (e instanceof Error) {
                console.log(e.message);
            }
            else {
                console.log(e);
            }
            return undefined;
        }
        const utxoid = utxovar.getUTXOID();
        if (!(utxoid in this.utxos) || overwrite === true) {
            this.utxos[`${utxoid}`] = utxovar;
            const addresses = utxovar.getOutput().getAddresses();
            const locktime = utxovar.getOutput().getLocktime();
            for (let i = 0; i < addresses.length; i++) {
                const address = addresses[`${i}`].toString("hex");
                if (!(address in this.addressUTXOs)) {
                    this.addressUTXOs[`${address}`] = {};
                }
                this.addressUTXOs[`${address}`][`${utxoid}`] = locktime;
            }
            return utxovar;
        }
        return undefined;
    }
    /**
     * Adds an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns An array of StandardUTXOs which were added.
     */
    addArray(utxos, overwrite = false) {
        const added = [];
        for (let i = 0; i < utxos.length; i++) {
            let result = this.add(utxos[`${i}`], overwrite);
            if (typeof result !== "undefined") {
                added.push(result);
            }
        }
        return added;
    }
    filter(args, lambda) {
        let newset = this.clone();
        let utxos = this.getAllUTXOs();
        for (let i = 0; i < utxos.length; i++) {
            if (lambda(utxos[`${i}`], ...args) === false) {
                newset.remove(utxos[`${i}`]);
            }
        }
        return newset;
    }
}
exports.StandardUTXOSet = StandardUTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFDeEMsa0RBQXNCO0FBQ3RCLHFDQUF1RDtBQUN2RCw4REFBa0Q7QUFFbEQsMERBSStCO0FBQy9CLDRDQUFnRDtBQUVoRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFzQixZQUFhLFNBQVEsNEJBQVk7SUFtSnJEOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxVQUFrQixDQUFDLEVBQ25CLE9BQWUsU0FBUyxFQUN4QixZQUE2QixTQUFTLEVBQ3RDLFVBQWtCLFNBQVMsRUFDM0IsU0FBaUIsU0FBUztRQUUxQixLQUFLLEVBQUUsQ0FBQTtRQWxLQyxjQUFTLEdBQUcsY0FBYyxDQUFBO1FBQzFCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUF1RG5CLFlBQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2pDLFNBQUksR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQy9CLGNBQVMsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ25DLFlBQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLFdBQU0sR0FBVyxTQUFTLENBQUE7UUFFcEM7O1dBRUc7UUFDSCxlQUFVLEdBQUcsR0FBc0MsRUFBRSxDQUNuRCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUUzQjs7V0FFRztRQUNILHFCQUFnQixHQUFHLEdBQVcs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LENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO2FBQzdCO1NBQ0Y7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7Q0FzSEY7QUFqZUQsMENBaWVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIENvbW1vbi1VVFhPc1xyXG4gKi9cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uL3V0aWxzL2JpbnRvb2xzXCJcclxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXHJcbmltcG9ydCB7IE91dHB1dCwgU3RhbmRhcmRBbW91bnRPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRcIlxyXG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXHJcbmltcG9ydCB7IE1lcmdlUnVsZSB9IGZyb20gXCIuLi91dGlscy9jb25zdGFudHNcIlxyXG5pbXBvcnQge1xyXG4gIFNlcmlhbGl6YWJsZSxcclxuICBTZXJpYWxpemF0aW9uLFxyXG4gIFNlcmlhbGl6ZWRFbmNvZGluZ1xyXG59IGZyb20gXCIuLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgTWVyZ2VSdWxlRXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbi8qKlxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgc2luZ2xlIFN0YW5kYXJkVVRYTy5cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFVUWE8gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YW5kYXJkVVRYT1wiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLmZpZWxkcyxcclxuICAgICAgY29kZWNJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMuY29kZWNJRCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXHJcbiAgICAgICksXHJcbiAgICAgIHR4aWQ6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLnR4aWQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIiksXHJcbiAgICAgIG91dHB1dGlkeDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHRoaXMub3V0cHV0aWR4LFxyXG4gICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCJcclxuICAgICAgKSxcclxuICAgICAgYXNzZXRJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRJRCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKSxcclxuICAgICAgb3V0cHV0OiB0aGlzLm91dHB1dC5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuY29kZWNJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcclxuICAgICAgZmllbGRzW1wiY29kZWNJRFwiXSxcclxuICAgICAgZW5jb2RpbmcsXHJcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxyXG4gICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAyXHJcbiAgICApXHJcbiAgICB0aGlzLnR4aWQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcInR4aWRcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImNiNThcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgMzJcclxuICAgIClcclxuICAgIHRoaXMub3V0cHV0aWR4ID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJvdXRwdXRpZHhcIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgNFxyXG4gICAgKVxyXG4gICAgdGhpcy5hc3NldElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxyXG4gICAgICBmaWVsZHNbXCJhc3NldElEXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJjYjU4XCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDMyXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgY29kZWNJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXHJcbiAgcHJvdGVjdGVkIHR4aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcclxuICBwcm90ZWN0ZWQgb3V0cHV0aWR4OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgYXNzZXRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxyXG4gIHByb3RlY3RlZCBvdXRwdXQ6IE91dHB1dCA9IHVuZGVmaW5lZFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBudW1lcmljIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDb2RlY0lELlxyXG4gICAqL1xyXG4gIGdldENvZGVjSUQgPSAoKTogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gbnVtYmVyID0+XHJcbiAgICB0aGlzLmNvZGVjSUQucmVhZFVJbnQ4KDApXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDb2RlY0lEXHJcbiAgICovXHJcbiAgZ2V0Q29kZWNJREJ1ZmZlciA9ICgpOiBCdWZmZXIgPT4gdGhpcy5jb2RlY0lEXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgVHhJRC5cclxuICAgKi9cclxuICBnZXRUeElEID0gKCk6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIEJ1ZmZlciA9PiB0aGlzLnR4aWRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9ICBvZiB0aGUgT3V0cHV0SWR4LlxyXG4gICAqL1xyXG4gIGdldE91dHB1dElkeCA9ICgpOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBCdWZmZXIgPT4gdGhpcy5vdXRwdXRpZHhcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXNzZXRJRCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxyXG4gICAqL1xyXG4gIGdldEFzc2V0SUQgPSAoKTogQnVmZmVyID0+IHRoaXMuYXNzZXRJRFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBVVFhPSUQgYXMgYSBiYXNlLTU4IHN0cmluZyAoVVRYT0lEIGlzIGEgc3RyaW5nIClcclxuICAgKi9cclxuICBnZXRVVFhPSUQgPSAoKTogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gc3RyaW5nID0+XHJcbiAgICBiaW50b29scy5idWZmZXJUb0I1OChCdWZmZXIuY29uY2F0KFt0aGlzLmdldFR4SUQoKSwgdGhpcy5nZXRPdXRwdXRJZHgoKV0pKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBvdXRwdXRcclxuICAgKi9cclxuICBnZXRPdXRwdXQgPSAoKTogT3V0cHV0ID0+IHRoaXMub3V0cHV0XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW1N0YW5kYXJkVVRYT11dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFN0YW5kYXJkVVRYTyBpbiBieXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tTdGFuZGFyZFVUWE9dXVxyXG4gICAqL1xyXG4gIGFic3RyYWN0IGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0PzogbnVtYmVyKTogbnVtYmVyXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZFVUWE9dXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgY29uc3Qgb3V0YnVmZjogQnVmZmVyID0gdGhpcy5vdXRwdXQudG9CdWZmZXIoKVxyXG4gICAgY29uc3Qgb3V0cHV0aWRidWZmZXI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgb3V0cHV0aWRidWZmZXIud3JpdGVVSW50MzJCRSh0aGlzLm91dHB1dC5nZXRPdXRwdXRJRCgpLCAwKVxyXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXHJcbiAgICAgIHRoaXMuY29kZWNJRCxcclxuICAgICAgdGhpcy50eGlkLFxyXG4gICAgICB0aGlzLm91dHB1dGlkeCxcclxuICAgICAgdGhpcy5hc3NldElELFxyXG4gICAgICBvdXRwdXRpZGJ1ZmZlcixcclxuICAgICAgb3V0YnVmZlxyXG4gICAgXVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoXHJcbiAgICAgIGJhcnIsXHJcbiAgICAgIHRoaXMuY29kZWNJRC5sZW5ndGggK1xyXG4gICAgICAgIHRoaXMudHhpZC5sZW5ndGggK1xyXG4gICAgICAgIHRoaXMub3V0cHV0aWR4Lmxlbmd0aCArXHJcbiAgICAgICAgdGhpcy5hc3NldElELmxlbmd0aCArXHJcbiAgICAgICAgb3V0cHV0aWRidWZmZXIubGVuZ3RoICtcclxuICAgICAgICBvdXRidWZmLmxlbmd0aFxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgYWJzdHJhY3QgZnJvbVN0cmluZyhzZXJpYWxpemVkOiBzdHJpbmcpOiBudW1iZXJcclxuXHJcbiAgYWJzdHJhY3QgdG9TdHJpbmcoKTogc3RyaW5nXHJcblxyXG4gIGFic3RyYWN0IGNsb25lKCk6IHRoaXNcclxuXHJcbiAgYWJzdHJhY3QgY3JlYXRlKFxyXG4gICAgY29kZWNJRD86IG51bWJlcixcclxuICAgIHR4aWQ/OiBCdWZmZXIsXHJcbiAgICBvdXRwdXRpZHg/OiBCdWZmZXIgfCBudW1iZXIsXHJcbiAgICBhc3NldElEPzogQnVmZmVyLFxyXG4gICAgb3V0cHV0PzogT3V0cHV0XHJcbiAgKTogdGhpc1xyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgc2luZ2xlIFN0YW5kYXJkVVRYTy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb2RlY0lEIE9wdGlvbmFsIG51bWJlciB3aGljaCBzcGVjaWZpZXMgdGhlIGNvZGVJRCBvZiB0aGUgVVRYTy4gRGVmYXVsdCAwXHJcbiAgICogQHBhcmFtIHR4SUQgT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdHJhbnNhY3Rpb24gSUQgZm9yIHRoZSBTdGFuZGFyZFVUWE9cclxuICAgKiBAcGFyYW0gdHhpZHggT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgbnVtYmVyIGZvciB0aGUgaW5kZXggb2YgdGhlIHRyYW5zYWN0aW9uJ3MgW1tPdXRwdXRdXVxyXG4gICAqIEBwYXJhbSBhc3NldElEIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgdGhlIFN0YW5kYXJkVVRYT1xyXG4gICAqIEBwYXJhbSBvdXRwdXRpZCBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBudW1iZXIgb2YgdGhlIG91dHB1dCBJRCBmb3IgdGhlIFN0YW5kYXJkVVRYT1xyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgY29kZWNJRDogbnVtYmVyID0gMCxcclxuICAgIHR4SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG91dHB1dGlkeDogQnVmZmVyIHwgbnVtYmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgb3V0cHV0OiBPdXRwdXQgPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKClcclxuICAgIGlmICh0eXBlb2YgY29kZWNJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLmNvZGVjSUQud3JpdGVVSW50OChjb2RlY0lELCAwKVxyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB0eElEICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMudHhpZCA9IHR4SURcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2Ygb3V0cHV0aWR4ID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgIHRoaXMub3V0cHV0aWR4LndyaXRlVUludDMyQkUob3V0cHV0aWR4LCAwKVxyXG4gICAgfSBlbHNlIGlmIChvdXRwdXRpZHggaW5zdGFuY2VvZiBCdWZmZXIpIHtcclxuICAgICAgdGhpcy5vdXRwdXRpZHggPSBvdXRwdXRpZHhcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy5hc3NldElEID0gYXNzZXRJRFxyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBvdXRwdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy5vdXRwdXQgPSBvdXRwdXRcclxuICAgIH1cclxuICB9XHJcbn1cclxuLyoqXHJcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNldCBvZiBbW1N0YW5kYXJkVVRYT11dcy5cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFVUWE9TZXQ8XHJcbiAgVVRYT0NsYXNzIGV4dGVuZHMgU3RhbmRhcmRVVFhPXHJcbj4gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xyXG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YW5kYXJkVVRYT1NldFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcclxuXHJcbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcclxuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcclxuICAgIGxldCB1dHhvcyA9IHt9XHJcbiAgICBmb3IgKGxldCB1dHhvaWQgaW4gdGhpcy51dHhvcykge1xyXG4gICAgICBsZXQgdXR4b2lkQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIHV0eG9pZCxcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcImJhc2U1OFwiLFxyXG4gICAgICAgIFwiYmFzZTU4XCJcclxuICAgICAgKVxyXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdID0gdGhpcy51dHhvc1tgJHt1dHhvaWR9YF0uc2VyaWFsaXplKGVuY29kaW5nKVxyXG4gICAgfVxyXG4gICAgbGV0IGFkZHJlc3NVVFhPcyA9IHt9XHJcbiAgICBmb3IgKGxldCBhZGRyZXNzIGluIHRoaXMuYWRkcmVzc1VUWE9zKSB7XHJcbiAgICAgIGxldCBhZGRyZXNzQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxyXG4gICAgICAgIGFkZHJlc3MsXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJoZXhcIixcclxuICAgICAgICBcImNiNThcIlxyXG4gICAgICApXHJcbiAgICAgIGxldCB1dHhvYmFsYW5jZSA9IHt9XHJcbiAgICAgIGZvciAobGV0IHV0eG9pZCBpbiB0aGlzLmFkZHJlc3NVVFhPc1tgJHthZGRyZXNzfWBdKSB7XHJcbiAgICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICAgIHV0eG9pZCxcclxuICAgICAgICAgIGVuY29kaW5nLFxyXG4gICAgICAgICAgXCJiYXNlNThcIixcclxuICAgICAgICAgIFwiYmFzZTU4XCJcclxuICAgICAgICApXHJcbiAgICAgICAgdXR4b2JhbGFuY2VbYCR7dXR4b2lkQ2xlYW5lZH1gXSA9IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcclxuICAgICAgICAgIHRoaXMuYWRkcmVzc1VUWE9zW2Ake2FkZHJlc3N9YF1bYCR7dXR4b2lkfWBdLFxyXG4gICAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgICBcIkJOXCIsXHJcbiAgICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxyXG4gICAgICAgIClcclxuICAgICAgfVxyXG4gICAgICBhZGRyZXNzVVRYT3NbYCR7YWRkcmVzc0NsZWFuZWR9YF0gPSB1dHhvYmFsYW5jZVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uZmllbGRzLFxyXG4gICAgICB1dHhvcyxcclxuICAgICAgYWRkcmVzc1VUWE9zXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgdXR4b3M6IHsgW3V0eG9pZDogc3RyaW5nXTogVVRYT0NsYXNzIH0gPSB7fVxyXG4gIHByb3RlY3RlZCBhZGRyZXNzVVRYT3M6IHsgW2FkZHJlc3M6IHN0cmluZ106IHsgW3V0eG9pZDogc3RyaW5nXTogQk4gfSB9ID0ge30gLy8gbWFwcyBhZGRyZXNzIHRvIHV0eG9pZHM6bG9ja3RpbWVcclxuXHJcbiAgYWJzdHJhY3QgcGFyc2VVVFhPKHV0eG86IFVUWE9DbGFzcyB8IHN0cmluZyk6IFVUWE9DbGFzc1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIFtbU3RhbmRhcmRVVFhPXV0gaXMgaW4gdGhlIFN0YW5kYXJkVVRYT1NldC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvIEVpdGhlciBhIFtbU3RhbmRhcmRVVFhPXV0gYSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGluZyBhIFN0YW5kYXJkVVRYT1xyXG4gICAqL1xyXG4gIGluY2x1ZGVzID0gKHV0eG86IFVUWE9DbGFzcyB8IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xyXG4gICAgbGV0IHV0eG9YOiBVVFhPQ2xhc3MgPSB1bmRlZmluZWRcclxuICAgIGxldCB1dHhvaWQ6IHN0cmluZyA9IHVuZGVmaW5lZFxyXG4gICAgdHJ5IHtcclxuICAgICAgdXR4b1ggPSB0aGlzLnBhcnNlVVRYTyh1dHhvKVxyXG4gICAgICB1dHhvaWQgPSB1dHhvWC5nZXRVVFhPSUQoKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXR4b2lkIGluIHRoaXMudXR4b3NcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBbW1N0YW5kYXJkVVRYT11dIHRvIHRoZSBTdGFuZGFyZFVUWE9TZXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4byBFaXRoZXIgYSBbW1N0YW5kYXJkVVRYT11dIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIGEgU3RhbmRhcmRVVFhPXHJcbiAgICogQHBhcmFtIG92ZXJ3cml0ZSBJZiB0cnVlLCBpZiB0aGUgVVRYT0lEIGFscmVhZHkgZXhpc3RzLCBvdmVyd3JpdGUgaXQuLi4gZGVmYXVsdCBmYWxzZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBbW1N0YW5kYXJkVVRYT11dIGlmIG9uZSB3YXMgYWRkZWQgYW5kIHVuZGVmaW5lZCBpZiBub3RoaW5nIHdhcyBhZGRlZC5cclxuICAgKi9cclxuICBhZGQodXR4bzogVVRYT0NsYXNzIHwgc3RyaW5nLCBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZSk6IFVUWE9DbGFzcyB7XHJcbiAgICBsZXQgdXR4b3ZhcjogVVRYT0NsYXNzID0gdW5kZWZpbmVkXHJcbiAgICB0cnkge1xyXG4gICAgICB1dHhvdmFyID0gdGhpcy5wYXJzZVVUWE8odXR4bylcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWRcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB1dHhvaWQ6IHN0cmluZyA9IHV0eG92YXIuZ2V0VVRYT0lEKClcclxuICAgIGlmICghKHV0eG9pZCBpbiB0aGlzLnV0eG9zKSB8fCBvdmVyd3JpdGUgPT09IHRydWUpIHtcclxuICAgICAgdGhpcy51dHhvc1tgJHt1dHhvaWR9YF0gPSB1dHhvdmFyXHJcbiAgICAgIGNvbnN0IGFkZHJlc3NlczogQnVmZmVyW10gPSB1dHhvdmFyLmdldE91dHB1dCgpLmdldEFkZHJlc3NlcygpXHJcbiAgICAgIGNvbnN0IGxvY2t0aW1lOiBCTiA9IHV0eG92YXIuZ2V0T3V0cHV0KCkuZ2V0TG9ja3RpbWUoKVxyXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgYWRkcmVzczogc3RyaW5nID0gYWRkcmVzc2VzW2Ake2l9YF0udG9TdHJpbmcoXCJoZXhcIilcclxuICAgICAgICBpZiAoIShhZGRyZXNzIGluIHRoaXMuYWRkcmVzc1VUWE9zKSkge1xyXG4gICAgICAgICAgdGhpcy5hZGRyZXNzVVRYT3NbYCR7YWRkcmVzc31gXSA9IHt9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWRkcmVzc1VUWE9zW2Ake2FkZHJlc3N9YF1bYCR7dXR4b2lkfWBdID0gbG9ja3RpbWVcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdXR4b3ZhclxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBhcnJheSBvZiBbW1N0YW5kYXJkVVRYT11dcyB0byB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvIEVpdGhlciBhIFtbU3RhbmRhcmRVVFhPXV0gYW4gY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgYSBTdGFuZGFyZFVUWE9cclxuICAgKiBAcGFyYW0gb3ZlcndyaXRlIElmIHRydWUsIGlmIHRoZSBVVFhPSUQgYWxyZWFkeSBleGlzdHMsIG92ZXJ3cml0ZSBpdC4uLiBkZWZhdWx0IGZhbHNlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBTdGFuZGFyZFVUWE9zIHdoaWNoIHdlcmUgYWRkZWQuXHJcbiAgICovXHJcbiAgYWRkQXJyYXkoXHJcbiAgICB1dHhvczogc3RyaW5nW10gfCBVVFhPQ2xhc3NbXSxcclxuICAgIG92ZXJ3cml0ZTogYm9vbGVhbiA9IGZhbHNlXHJcbiAgKTogU3RhbmRhcmRVVFhPW10ge1xyXG4gICAgY29uc3QgYWRkZWQ6IFVUWE9DbGFzc1tdID0gW11cclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB1dHhvcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBsZXQgcmVzdWx0OiBVVFhPQ2xhc3MgPSB0aGlzLmFkZCh1dHhvc1tgJHtpfWBdLCBvdmVyd3JpdGUpXHJcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgYWRkZWQucHVzaChyZXN1bHQpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhZGRlZFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhIFtbU3RhbmRhcmRVVFhPXV0gZnJvbSB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXSBpZiBpdCBleGlzdHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4byBFaXRoZXIgYSBbW1N0YW5kYXJkVVRYT11dIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIGEgU3RhbmRhcmRVVFhPXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIFtbU3RhbmRhcmRVVFhPXV0gaWYgaXQgd2FzIHJlbW92ZWQgYW5kIHVuZGVmaW5lZCBpZiBub3RoaW5nIHdhcyByZW1vdmVkLlxyXG4gICAqL1xyXG4gIHJlbW92ZSA9ICh1dHhvOiBVVFhPQ2xhc3MgfCBzdHJpbmcpOiBVVFhPQ2xhc3MgPT4ge1xyXG4gICAgbGV0IHV0eG92YXI6IFVUWE9DbGFzcyA9IHVuZGVmaW5lZFxyXG4gICAgdHJ5IHtcclxuICAgICAgdXR4b3ZhciA9IHRoaXMucGFyc2VVVFhPKHV0eG8pXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlLm1lc3NhZ2UpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdXR4b2lkOiBzdHJpbmcgPSB1dHhvdmFyLmdldFVUWE9JRCgpXHJcbiAgICBpZiAoISh1dHhvaWQgaW4gdGhpcy51dHhvcykpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gICAgfVxyXG4gICAgZGVsZXRlIHRoaXMudXR4b3NbYCR7dXR4b2lkfWBdXHJcbiAgICBjb25zdCBhZGRyZXNzZXMgPSBPYmplY3Qua2V5cyh0aGlzLmFkZHJlc3NVVFhPcylcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHV0eG9pZCBpbiB0aGlzLmFkZHJlc3NVVFhPc1thZGRyZXNzZXNbYCR7aX1gXV0pIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5hZGRyZXNzVVRYT3NbYWRkcmVzc2VzW2Ake2l9YF1dW2Ake3V0eG9pZH1gXVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXR4b3ZhclxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbiBhcnJheSBvZiBbW1N0YW5kYXJkVVRYT11dcyB0byB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvIEVpdGhlciBhIFtbU3RhbmRhcmRVVFhPXV0gYW4gY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgYSBTdGFuZGFyZFVUWE9cclxuICAgKiBAcGFyYW0gb3ZlcndyaXRlIElmIHRydWUsIGlmIHRoZSBVVFhPSUQgYWxyZWFkeSBleGlzdHMsIG92ZXJ3cml0ZSBpdC4uLiBkZWZhdWx0IGZhbHNlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBVVFhPcyB3aGljaCB3ZXJlIHJlbW92ZWQuXHJcbiAgICovXHJcbiAgcmVtb3ZlQXJyYXkgPSAodXR4b3M6IHN0cmluZ1tdIHwgVVRYT0NsYXNzW10pOiBVVFhPQ2xhc3NbXSA9PiB7XHJcbiAgICBjb25zdCByZW1vdmVkOiBVVFhPQ2xhc3NbXSA9IFtdXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdXR4b3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3QgcmVzdWx0OiBVVFhPQ2xhc3MgPSB0aGlzLnJlbW92ZSh1dHhvc1tgJHtpfWBdKVxyXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgIHJlbW92ZWQucHVzaChyZXN1bHQpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZW1vdmVkXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIGEgW1tTdGFuZGFyZFVUWE9dXSBmcm9tIHRoZSBbW1N0YW5kYXJkVVRYT1NldF1dIGJ5IGl0cyBVVFhPSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4b2lkIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIFVUWE9JRFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBbW1N0YW5kYXJkVVRYT11dIGlmIGl0IGV4aXN0cyBpbiB0aGUgc2V0LlxyXG4gICAqL1xyXG4gIGdldFVUWE8gPSAodXR4b2lkOiBzdHJpbmcpOiBVVFhPQ2xhc3MgPT4gdGhpcy51dHhvc1tgJHt1dHhvaWR9YF1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyBhbGwgdGhlIFtbU3RhbmRhcmRVVFhPXV1zLCBvcHRpb25hbGx5IHRoYXQgbWF0Y2ggd2l0aCBVVFhPSURzIGluIGFuIGFycmF5XHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4b2lkcyBBbiBvcHRpb25hbCBhcnJheSBvZiBVVFhPSURzLCByZXR1cm5zIGFsbCBbW1N0YW5kYXJkVVRYT11dcyBpZiBub3QgcHJvdmlkZWRcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbU3RhbmRhcmRVVFhPXV1zLlxyXG4gICAqL1xyXG4gIGdldEFsbFVUWE9zID0gKHV0eG9pZHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkKTogVVRYT0NsYXNzW10gPT4ge1xyXG4gICAgbGV0IHJlc3VsdHM6IFVUWE9DbGFzc1tdID0gW11cclxuICAgIGlmICh0eXBlb2YgdXR4b2lkcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBBcnJheS5pc0FycmF5KHV0eG9pZHMpKSB7XHJcbiAgICAgIHJlc3VsdHMgPSB1dHhvaWRzXHJcbiAgICAgICAgLmZpbHRlcigodXR4b2lkKSA9PiB0aGlzLnV0eG9zW2Ake3V0eG9pZH1gXSlcclxuICAgICAgICAubWFwKCh1dHhvaWQpID0+IHRoaXMudXR4b3NbYCR7dXR4b2lkfWBdKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzdWx0cyA9IE9iamVjdC52YWx1ZXModGhpcy51dHhvcylcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHRzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIGFsbCB0aGUgW1tTdGFuZGFyZFVUWE9dXXMgYXMgc3RyaW5ncywgb3B0aW9uYWxseSB0aGF0IG1hdGNoIHdpdGggVVRYT0lEcyBpbiBhbiBhcnJheS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvaWRzIEFuIG9wdGlvbmFsIGFycmF5IG9mIFVUWE9JRHMsIHJldHVybnMgYWxsIFtbU3RhbmRhcmRVVFhPXV1zIGlmIG5vdCBwcm92aWRlZFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tTdGFuZGFyZFVUWE9dXXMgYXMgY2I1OCBzZXJpYWxpemVkIHN0cmluZ3MuXHJcbiAgICovXHJcbiAgZ2V0QWxsVVRYT1N0cmluZ3MgPSAodXR4b2lkczogc3RyaW5nW10gPSB1bmRlZmluZWQpOiBzdHJpbmdbXSA9PiB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdXHJcbiAgICBjb25zdCB1dHhvcyA9IE9iamVjdC5rZXlzKHRoaXMudXR4b3MpXHJcbiAgICBpZiAodHlwZW9mIHV0eG9pZHMgIT09IFwidW5kZWZpbmVkXCIgJiYgQXJyYXkuaXNBcnJheSh1dHhvaWRzKSkge1xyXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdXR4b2lkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICh1dHhvaWRzW2Ake2l9YF0gaW4gdGhpcy51dHhvcykge1xyXG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMudXR4b3NbdXR4b2lkc1tgJHtpfWBdXS50b1N0cmluZygpKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm9yIChjb25zdCB1IG9mIHV0eG9zKSB7XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMudXR4b3NbYCR7dX1gXS50b1N0cmluZygpKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0c1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYW4gYWRkcmVzcyBvciBhcnJheSBvZiBhZGRyZXNzZXMsIHJldHVybnMgYWxsIHRoZSBVVFhPSURzIGZvciB0aG9zZSBhZGRyZXNzZXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzIEFuIGFycmF5IG9mIGFkZHJlc3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zXHJcbiAgICogQHBhcmFtIHNwZW5kYWJsZSBJZiB0cnVlLCBvbmx5IHJldHJpZXZlcyBVVFhPSURzIHdob3NlIGxvY2t0aW1lIGhhcyBwYXNzZWRcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGFkZHJlc3Nlcy5cclxuICAgKi9cclxuICBnZXRVVFhPSURzID0gKFxyXG4gICAgYWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIHNwZW5kYWJsZTogYm9vbGVhbiA9IHRydWVcclxuICApOiBzdHJpbmdbXSA9PiB7XHJcbiAgICBpZiAodHlwZW9mIGFkZHJlc3NlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdXHJcbiAgICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcclxuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChhZGRyZXNzZXNbYCR7aX1gXS50b1N0cmluZyhcImhleFwiKSBpbiB0aGlzLmFkZHJlc3NVVFhPcykge1xyXG4gICAgICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKFxyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NVVFhPc1thZGRyZXNzZXNbYCR7aX1gXS50b1N0cmluZyhcImhleFwiKV1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIGZvciAoY29uc3QgW3V0eG9pZCwgbG9ja3RpbWVdIG9mIGVudHJpZXMpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgIChyZXN1bHRzLmluZGV4T2YodXR4b2lkKSA9PT0gLTEgJiZcclxuICAgICAgICAgICAgICAgIHNwZW5kYWJsZSAmJlxyXG4gICAgICAgICAgICAgICAgbG9ja3RpbWUubHRlKG5vdykpIHx8XHJcbiAgICAgICAgICAgICAgIXNwZW5kYWJsZVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICByZXN1bHRzLnB1c2godXR4b2lkKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXN1bHRzXHJcbiAgICB9XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy51dHhvcylcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGFkZHJlc3NlcyBpbiB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cclxuICAgKi9cclxuICBnZXRBZGRyZXNzZXMgPSAoKTogQnVmZmVyW10gPT5cclxuICAgIE9iamVjdC5rZXlzKHRoaXMuYWRkcmVzc1VUWE9zKS5tYXAoKGspID0+IEJ1ZmZlci5mcm9tKGssIFwiaGV4XCIpKVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBiYWxhbmNlIG9mIGEgc2V0IG9mIGFkZHJlc3NlcyBpbiB0aGUgU3RhbmRhcmRVVFhPU2V0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXNcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBjYjU4IHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgYW4gQXNzZXRJRFxyXG4gICAqIEBwYXJhbSBhc09mIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgdGhlIHRvdGFsIGJhbGFuY2UgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cclxuICAgKi9cclxuICBnZXRCYWxhbmNlID0gKFxyXG4gICAgYWRkcmVzc2VzOiBCdWZmZXJbXSxcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyxcclxuICAgIGFzT2Y6IEJOID0gdW5kZWZpbmVkXHJcbiAgKTogQk4gPT4ge1xyXG4gICAgY29uc3QgdXR4b2lkczogc3RyaW5nW10gPSB0aGlzLmdldFVUWE9JRHMoYWRkcmVzc2VzKVxyXG4gICAgY29uc3QgdXR4b3M6IFN0YW5kYXJkVVRYT1tdID0gdGhpcy5nZXRBbGxVVFhPcyh1dHhvaWRzKVxyXG4gICAgbGV0IHNwZW5kOiBCTiA9IG5ldyBCTigwKVxyXG4gICAgbGV0IGFzc2V0OiBCdWZmZXJcclxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxyXG4gICAgfVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICB1dHhvc1tgJHtpfWBdLmdldE91dHB1dCgpIGluc3RhbmNlb2YgU3RhbmRhcmRBbW91bnRPdXRwdXQgJiZcclxuICAgICAgICB1dHhvc1tgJHtpfWBdLmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKSA9PT0gYXNzZXQudG9TdHJpbmcoXCJoZXhcIikgJiZcclxuICAgICAgICB1dHhvc1tgJHtpfWBdLmdldE91dHB1dCgpLm1lZXRzVGhyZXNob2xkKGFkZHJlc3NlcywgYXNPZilcclxuICAgICAgKSB7XHJcbiAgICAgICAgc3BlbmQgPSBzcGVuZC5hZGQoXHJcbiAgICAgICAgICAodXR4b3NbYCR7aX1gXS5nZXRPdXRwdXQoKSBhcyBTdGFuZGFyZEFtb3VudE91dHB1dCkuZ2V0QW1vdW50KClcclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzcGVuZFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyBhbGwgdGhlIEFzc2V0IElEcywgb3B0aW9uYWxseSB0aGF0IG1hdGNoIHdpdGggQXNzZXQgSURzIGluIGFuIGFycmF5XHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4b2lkcyBBbiBvcHRpb25hbCBhcnJheSBvZiBBZGRyZXNzZXMgYXMgc3RyaW5nIG9yIEJ1ZmZlciwgcmV0dXJucyBhbGwgQXNzZXQgSURzIGlmIG5vdCBwcm92aWRlZFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBBc3NldCBJRHMuXHJcbiAgICovXHJcbiAgZ2V0QXNzZXRJRHMgPSAoYWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCk6IEJ1ZmZlcltdID0+IHtcclxuICAgIGNvbnN0IHJlc3VsdHM6IFNldDxCdWZmZXI+ID0gbmV3IFNldCgpXHJcbiAgICBsZXQgdXR4b2lkczogc3RyaW5nW10gPSBbXVxyXG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdXR4b2lkcyA9IHRoaXMuZ2V0VVRYT0lEcyhhZGRyZXNzZXMpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB1dHhvaWRzID0gdGhpcy5nZXRVVFhPSURzKClcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdXR4b2lkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAodXR4b2lkc1tgJHtpfWBdIGluIHRoaXMudXR4b3MgJiYgISh1dHhvaWRzW2Ake2l9YF0gaW4gcmVzdWx0cykpIHtcclxuICAgICAgICByZXN1bHRzLmFkZCh0aGlzLnV0eG9zW3V0eG9pZHNbYCR7aX1gXV0uZ2V0QXNzZXRJRCgpKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFsuLi5yZXN1bHRzXVxyXG4gIH1cclxuXHJcbiAgYWJzdHJhY3QgY2xvbmUoKTogdGhpc1xyXG5cclxuICBhYnN0cmFjdCBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzXHJcblxyXG4gIGZpbHRlcihcclxuICAgIGFyZ3M6IGFueVtdLFxyXG4gICAgbGFtYmRhOiAodXR4bzogVVRYT0NsYXNzLCAuLi5sYXJnczogYW55W10pID0+IGJvb2xlYW5cclxuICApOiB0aGlzIHtcclxuICAgIGxldCBuZXdzZXQ6IHRoaXMgPSB0aGlzLmNsb25lKClcclxuICAgIGxldCB1dHhvczogVVRYT0NsYXNzW10gPSB0aGlzLmdldEFsbFVUWE9zKClcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB1dHhvcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAobGFtYmRhKHV0eG9zW2Ake2l9YF0sIC4uLmFyZ3MpID09PSBmYWxzZSkge1xyXG4gICAgICAgIG5ld3NldC5yZW1vdmUodXR4b3NbYCR7aX1gXSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld3NldFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBzZXQgd2l0aCBjb3B5IG9mIFVUWE9zIGluIHRoaXMgYW5kIHNldCBwYXJhbWV0ZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4b3NldCBUaGUgW1tTdGFuZGFyZFVUWE9TZXRdXSB0byBtZXJnZSB3aXRoIHRoaXMgb25lXHJcbiAgICogQHBhcmFtIGhhc1VUWE9JRHMgV2lsbCBzdWJzZWxlY3QgYSBzZXQgb2YgW1tTdGFuZGFyZFVUWE9dXXMgd2hpY2ggaGF2ZSB0aGUgVVRYT0lEcyBwcm92aWRlZCBpbiB0aGlzIGFycmF5LCBkZWZ1bHRzIHRvIGFsbCBVVFhPc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IHRoYXQgY29udGFpbnMgYWxsIHRoZSBmaWx0ZXJlZCBlbGVtZW50cy5cclxuICAgKi9cclxuICBtZXJnZSA9ICh1dHhvc2V0OiB0aGlzLCBoYXNVVFhPSURzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCk6IHRoaXMgPT4ge1xyXG4gICAgY29uc3QgcmVzdWx0czogdGhpcyA9IHRoaXMuY3JlYXRlKClcclxuICAgIGNvbnN0IHV0eG9zMTogVVRYT0NsYXNzW10gPSB0aGlzLmdldEFsbFVUWE9zKGhhc1VUWE9JRHMpXHJcbiAgICBjb25zdCB1dHhvczI6IFVUWE9DbGFzc1tdID0gdXR4b3NldC5nZXRBbGxVVFhPcyhoYXNVVFhPSURzKVxyXG4gICAgY29uc3QgcHJvY2VzcyA9ICh1dHhvOiBVVFhPQ2xhc3MpID0+IHtcclxuICAgICAgcmVzdWx0cy5hZGQodXR4bylcclxuICAgIH1cclxuICAgIHV0eG9zMS5mb3JFYWNoKHByb2Nlc3MpXHJcbiAgICB1dHhvczIuZm9yRWFjaChwcm9jZXNzKVxyXG4gICAgcmV0dXJuIHJlc3VsdHMgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IGludGVyc2V0aW9uIGJldHdlZW4gdGhpcyBzZXQgYW5kIGEgcGFyYW1ldGVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byBpbnRlcnNlY3RcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgbmV3IFN0YW5kYXJkVVRYT1NldCBjb250YWluaW5nIHRoZSBpbnRlcnNlY3Rpb25cclxuICAgKi9cclxuICBpbnRlcnNlY3Rpb24gPSAodXR4b3NldDogdGhpcyk6IHRoaXMgPT4ge1xyXG4gICAgY29uc3QgdXMxOiBzdHJpbmdbXSA9IHRoaXMuZ2V0VVRYT0lEcygpXHJcbiAgICBjb25zdCB1czI6IHN0cmluZ1tdID0gdXR4b3NldC5nZXRVVFhPSURzKClcclxuICAgIGNvbnN0IHJlc3VsdHM6IHN0cmluZ1tdID0gdXMxLmZpbHRlcigodXR4b2lkKSA9PiB1czIuaW5jbHVkZXModXR4b2lkKSlcclxuICAgIHJldHVybiB0aGlzLm1lcmdlKHV0eG9zZXQsIHJlc3VsdHMpIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCBkaWZmZXJlbmNlIGJldHdlZW4gdGhpcyBzZXQgYW5kIGEgcGFyYW1ldGVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byBkaWZmZXJlbmNlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIG5ldyBTdGFuZGFyZFVUWE9TZXQgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxyXG4gICAqL1xyXG4gIGRpZmZlcmVuY2UgPSAodXR4b3NldDogdGhpcyk6IHRoaXMgPT4ge1xyXG4gICAgY29uc3QgdXMxOiBzdHJpbmdbXSA9IHRoaXMuZ2V0VVRYT0lEcygpXHJcbiAgICBjb25zdCB1czI6IHN0cmluZ1tdID0gdXR4b3NldC5nZXRVVFhPSURzKClcclxuICAgIGNvbnN0IHJlc3VsdHM6IHN0cmluZ1tdID0gdXMxLmZpbHRlcigodXR4b2lkKSA9PiAhdXMyLmluY2x1ZGVzKHV0eG9pZCkpXHJcbiAgICByZXR1cm4gdGhpcy5tZXJnZSh1dHhvc2V0LCByZXN1bHRzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgc3ltbWV0cmljYWwgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoaXMgc2V0IGFuZCBhIHBhcmFtZXRlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0IFRoZSBzZXQgdG8gc3ltbWV0cmljYWwgZGlmZmVyZW5jZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIHN5bW1ldHJpY2FsIGRpZmZlcmVuY2VcclxuICAgKi9cclxuICBzeW1EaWZmZXJlbmNlID0gKHV0eG9zZXQ6IHRoaXMpOiB0aGlzID0+IHtcclxuICAgIGNvbnN0IHVzMTogc3RyaW5nW10gPSB0aGlzLmdldFVUWE9JRHMoKVxyXG4gICAgY29uc3QgdXMyOiBzdHJpbmdbXSA9IHV0eG9zZXQuZ2V0VVRYT0lEcygpXHJcbiAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IHVzMVxyXG4gICAgICAuZmlsdGVyKCh1dHhvaWQpID0+ICF1czIuaW5jbHVkZXModXR4b2lkKSlcclxuICAgICAgLmNvbmNhdCh1czIuZmlsdGVyKCh1dHhvaWQpID0+ICF1czEuaW5jbHVkZXModXR4b2lkKSkpXHJcbiAgICByZXR1cm4gdGhpcy5tZXJnZSh1dHhvc2V0LCByZXN1bHRzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdW5pb24gYmV0d2VlbiB0aGlzIHNldCBhbmQgYSBwYXJhbWV0ZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4b3NldCBUaGUgc2V0IHRvIHVuaW9uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIG5ldyBTdGFuZGFyZFVUWE9TZXQgY29udGFpbmluZyB0aGUgdW5pb25cclxuICAgKi9cclxuICB1bmlvbiA9ICh1dHhvc2V0OiB0aGlzKTogdGhpcyA9PiB0aGlzLm1lcmdlKHV0eG9zZXQpIGFzIHRoaXNcclxuXHJcbiAgLyoqXHJcbiAgICogTWVyZ2VzIGEgc2V0IGJ5IHRoZSBydWxlIHByb3ZpZGVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byBtZXJnZSBieSB0aGUgTWVyZ2VSdWxlXHJcbiAgICogQHBhcmFtIG1lcmdlUnVsZSBUaGUgW1tNZXJnZVJ1bGVdXSB0byBhcHBseVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIG1lcmdlZCBkYXRhXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIFRoZSBtZXJnZSBydWxlcyBhcmUgYXMgZm9sbG93czpcclxuICAgKiAgICogXCJpbnRlcnNlY3Rpb25cIiAtIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIHNldFxyXG4gICAqICAgKiBcImRpZmZlcmVuY2VTZWxmXCIgLSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBleGlzdGluZyBkYXRhIGFuZCBuZXcgc2V0XHJcbiAgICogICAqIFwiZGlmZmVyZW5jZU5ld1wiIC0gdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgbmV3IGRhdGEgYW5kIHRoZSBleGlzdGluZyBzZXRcclxuICAgKiAgICogXCJzeW1EaWZmZXJlbmNlXCIgLSB0aGUgdW5pb24gb2YgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYm90aCBzZXRzIG9mIGRhdGFcclxuICAgKiAgICogXCJ1bmlvblwiIC0gdGhlIHVuaXF1ZSBzZXQgb2YgYWxsIGVsZW1lbnRzIGNvbnRhaW5lZCBpbiBib3RoIHNldHNcclxuICAgKiAgICogXCJ1bmlvbk1pbnVzTmV3XCIgLSB0aGUgdW5pcXVlIHNldCBvZiBhbGwgZWxlbWVudHMgY29udGFpbmVkIGluIGJvdGggc2V0cywgZXhjbHVkaW5nIHZhbHVlcyBvbmx5IGZvdW5kIGluIHRoZSBuZXcgc2V0XHJcbiAgICogICAqIFwidW5pb25NaW51c1NlbGZcIiAtIHRoZSB1bmlxdWUgc2V0IG9mIGFsbCBlbGVtZW50cyBjb250YWluZWQgaW4gYm90aCBzZXRzLCBleGNsdWRpbmcgdmFsdWVzIG9ubHkgZm91bmQgaW4gdGhlIGV4aXN0aW5nIHNldFxyXG4gICAqL1xyXG4gIG1lcmdlQnlSdWxlID0gKHV0eG9zZXQ6IHRoaXMsIG1lcmdlUnVsZTogTWVyZ2VSdWxlKTogdGhpcyA9PiB7XHJcbiAgICBsZXQgdVNldDogdGhpc1xyXG4gICAgc3dpdGNoIChtZXJnZVJ1bGUpIHtcclxuICAgICAgY2FzZSBcImludGVyc2VjdGlvblwiOlxyXG4gICAgICAgIHJldHVybiB0aGlzLmludGVyc2VjdGlvbih1dHhvc2V0KVxyXG4gICAgICBjYXNlIFwiZGlmZmVyZW5jZVNlbGZcIjpcclxuICAgICAgICByZXR1cm4gdGhpcy5kaWZmZXJlbmNlKHV0eG9zZXQpXHJcbiAgICAgIGNhc2UgXCJkaWZmZXJlbmNlTmV3XCI6XHJcbiAgICAgICAgcmV0dXJuIHV0eG9zZXQuZGlmZmVyZW5jZSh0aGlzKSBhcyB0aGlzXHJcbiAgICAgIGNhc2UgXCJzeW1EaWZmZXJlbmNlXCI6XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3ltRGlmZmVyZW5jZSh1dHhvc2V0KVxyXG4gICAgICBjYXNlIFwidW5pb25cIjpcclxuICAgICAgICByZXR1cm4gdGhpcy51bmlvbih1dHhvc2V0KVxyXG4gICAgICBjYXNlIFwidW5pb25NaW51c05ld1wiOlxyXG4gICAgICAgIHVTZXQgPSB0aGlzLnVuaW9uKHV0eG9zZXQpXHJcbiAgICAgICAgcmV0dXJuIHVTZXQuZGlmZmVyZW5jZSh1dHhvc2V0KSBhcyB0aGlzXHJcbiAgICAgIGNhc2UgXCJ1bmlvbk1pbnVzU2VsZlwiOlxyXG4gICAgICAgIHVTZXQgPSB0aGlzLnVuaW9uKHV0eG9zZXQpXHJcbiAgICAgICAgcmV0dXJuIHVTZXQuZGlmZmVyZW5jZSh0aGlzKSBhcyB0aGlzXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgdGhyb3cgbmV3IE1lcmdlUnVsZUVycm9yKFxyXG4gICAgICAgICAgXCJFcnJvciAtIFN0YW5kYXJkVVRYT1NldC5tZXJnZUJ5UnVsZTogYmFkIE1lcmdlUnVsZVwiXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=